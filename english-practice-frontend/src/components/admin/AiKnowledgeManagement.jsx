import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button, Form, Table, Row, Col, Badge, Spinner, Card } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Layout from "../layout/admin/Layout";
import AiAnalysis from "../AiAnalysis";
import "../assets/css/aiknowledge.css";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// Các nguồn trong kho kiến thức (khớp với metadata.source ở backend)
const SOURCE_INFO = {
  grammar_lesson: { label: "Bài ngữ pháp", icon: "fa-book-open", rebuild: true },
  flashcard: { label: "Flashcard", icon: "fa-clone", rebuild: true },
  exam_question: { label: "Câu hỏi đề thi", icon: "fa-file-pen", rebuild: true },
  document: { label: "Tài liệu upload", icon: "fa-file-pdf", rebuild: false },
};

const SCOPE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "theory", label: "Lý thuyết (tài liệu + bài ngữ pháp)" },
  { value: "vocabulary", label: "Từ vựng (flashcard)" },
  { value: "practice", label: "Câu hỏi luyện thi" },
];

const STATUS_BADGE = {
  processing: { bg: "warning", text: "Đang xử lý" },
  ready: { bg: "success", text: "Sẵn sàng" },
  failed: { bg: "danger", text: "Lỗi" },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const POLL_MS = 3000;

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "");

// Quản lý AI: kho kiến thức RAG (Qdrant) + tài liệu tham khảo do admin tải lên
const AiKnowledgeManagement = ({ handleLogout }) => {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [documents, setDocuments] = useState([]);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState("all");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/ai/knowledge", { headers: authHeader() });
      setStats(response.data);
      setStatsError(false);
    } catch (error) {
      setStatsError(true);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/ai/documents", { headers: authHeader() });
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách tài liệu");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDocuments();
  }, [fetchStats, fetchDocuments]);

  // Tự cập nhật khi đang nạp kho hoặc có tài liệu đang xử lý
  const isIndexing = Boolean(stats?.indexing?.running);
  const hasProcessing = documents.some((d) => d.status === "processing");

  useEffect(() => {
    if (!isIndexing && !hasProcessing) return undefined;
    const timer = setInterval(() => {
      fetchStats();
      fetchDocuments();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isIndexing, hasProcessing, fetchStats, fetchDocuments]);

  // Nạp lại kho kiến thức (toàn bộ hoặc một nguồn)
  const handleRebuild = async (source) => {
    const label = source ? SOURCE_INFO[source].label : "toàn bộ kho kiến thức";
    const confirm = await Swal.fire({
      title: "Nạp lại kho kiến thức?",
      text: `AI sẽ đọc lại ${label.toLowerCase()} từ cơ sở dữ liệu và tạo lại vector. Việc này có thể mất vài phút.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Nạp lại",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;

    try {
      const response = await axios.post("/api/admin/ai/knowledge/rebuild", null, {
        headers: authHeader(),
        params: source ? { source } : {},
      });
      toast.info(response.data.message);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không bắt đầu nạp lại được");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0] || null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      toast.warning("File tối đa 10MB");
      e.target.value = "";
      return setFile(null);
    }
    setFile(selected);
  };

  // Tải tài liệu lên: backend trả 202 rồi xử lý nền (đọc chữ, cắt đoạn, tạo vector)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.warning("Vui lòng chọn file PDF hoặc TXT");

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    setUploading(true);
    try {
      const response = await axios.post("/api/admin/ai/documents", formData, {
        headers: authHeader(),
      });
      toast.success(response.data.message);
      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải tài liệu lên");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    const confirm = await Swal.fire({
      title: "Xóa tài liệu?",
      text: `"${doc.title}" sẽ bị xóa khỏi kho kiến thức, AI sẽ không dùng tài liệu này nữa.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`/api/admin/ai/documents/${doc.id}`, { headers: authHeader() });
      toast.success("Đã xóa tài liệu");
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa tài liệu");
    }
  };

  // Hỏi thử kho kiến thức (RAG chain): xem AI trả lời và trích nguồn nào
  const handleAsk = async (e) => {
    e.preventDefault();
    if (question.trim().length < 2) return toast.warning("Vui lòng nhập câu hỏi");

    setAsking(true);
    setAnswer(null);
    try {
      const response = await axios.post(
        "/api/admin/ai/knowledge/ask",
        { question: question.trim(), scope },
        { headers: authHeader() }
      );
      setAnswer(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "AI đang bận, vui lòng thử lại");
    } finally {
      setAsking(false);
    }
  };

  // Ô thống kê cho mỗi nguồn
  const renderStatCard = (source) => {
    const info = SOURCE_INFO[source];
    return (
      <Col key={source} xs={6} lg={3} className="mb-3">
        <Card className="ai-stat-card h-100">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="ai-stat-label">{info.label}</div>
                <div className="ai-stat-value">{stats?.by_source?.[source] ?? "–"}</div>
                <div className="ai-stat-unit">đoạn văn</div>
              </div>
              <i className={`fa-solid ${info.icon} ai-stat-icon ai-stat-${source}`}></i>
            </div>
            {info.rebuild && (
              <Button
                variant="link"
                size="sm"
                className="ai-stat-rebuild p-0 mt-2 d-block text-start"
                disabled={isIndexing}
                onClick={() => handleRebuild(source)}
              >
                <i className="fa-solid fa-rotate me-1"></i>Nạp lại
              </Button>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const lastResult = stats?.indexing?.result;

  return (
    <Layout handleLogout={handleLogout}>
      <div className="page-inner ai-knowledge-page">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-primary">Quản lý AI</h2>
            <p className="text-muted mb-0">
              Kho kiến thức mà trợ lý AI tra cứu khi trả lời học viên (RAG với Qdrant).
            </p>
          </div>
          <Button variant="primary" disabled={isIndexing} onClick={() => handleRebuild()}>
            {isIndexing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang nạp kho...
              </>
            ) : (
              <>
                <i className="fa-solid fa-rotate me-2"></i>Nạp lại toàn bộ
              </>
            )}
          </Button>
        </div>

        {/* Thống kê kho kiến thức */}
        {statsError ? (
          <div className="alert alert-danger">
            Không kết nối được kho kiến thức AI (Qdrant). Kiểm tra container qdrant.
          </div>
        ) : (
          <>
            <Row>{Object.keys(SOURCE_INFO).map(renderStatCard)}</Row>
            <p className="ai-index-status text-muted">
              Tổng cộng <strong>{stats?.total ?? "–"}</strong> đoạn văn.
              {isIndexing && " Đang nạp lại kho kiến thức, số liệu sẽ tự cập nhật."}
              {!isIndexing && stats?.indexing?.error && (
                <span className="text-danger"> Lần nạp gần nhất bị lỗi: {stats.indexing.error}</span>
              )}
              {!isIndexing && lastResult && !stats?.indexing?.error && (
                <span> Lần nạp gần nhất xong lúc {formatDate(stats.indexing.finishedAt)}.</span>
              )}
            </p>
          </>
        )}

        <Row>
          {/* Tài liệu tham khảo */}
          <Col xl={7} className="mb-4">
            <Card className="h-100">
              <Card.Header className="fw-bold">
                <i className="fa-solid fa-file-arrow-up me-2 text-primary"></i>Tài liệu tham khảo
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleUpload} className="ai-upload-form mb-3">
                  <Row className="g-2 align-items-end">
                    <Col md={5}>
                      <Form.Label className="small mb-1">File PDF hoặc TXT (tối đa 10MB)</Form.Label>
                      <Form.Control
                        type="file"
                        accept=".pdf,.txt,application/pdf,text/plain"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Label className="small mb-1">Tên hiển thị khi AI trích nguồn</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Mặc định: tên file"
                        maxLength={255}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={uploading}
                      />
                    </Col>
                    <Col md={2}>
                      <Button type="submit" className="w-100" disabled={uploading || !file}>
                        {uploading ? <Spinner animation="border" size="sm" /> : "Tải lên"}
                      </Button>
                    </Col>
                  </Row>
                  <Form.Text muted>
                    PDF phải có chữ (không phải ảnh scan). AI sẽ trích dẫn theo tên và số trang.
                  </Form.Text>
                </Form>

                {documents.length === 0 ? (
                  <p className="text-muted text-center my-4">Chưa có tài liệu nào.</p>
                ) : (
                  <div className="table-responsive">
                    <Table hover size="sm" className="align-middle ai-doc-table">
                      <thead>
                        <tr>
                          <th>Tài liệu</th>
                          <th className="text-center">Trang</th>
                          <th className="text-center">Đoạn</th>
                          <th>Trạng thái</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => {
                          const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.failed;
                          return (
                            <tr key={doc.id}>
                              <td>
                                <div className="fw-semibold">{doc.title}</div>
                                <div className="small text-muted">
                                  {doc.original_name} · {formatSize(doc.size_bytes)} ·{" "}
                                  {doc.uploaded_by_name || "Admin"} · {formatDate(doc.created_at)}
                                </div>
                                {doc.status === "failed" && doc.error && (
                                  <div className="small text-danger">{doc.error}</div>
                                )}
                              </td>
                              <td className="text-center">{doc.page_count ?? "–"}</td>
                              <td className="text-center">{doc.chunk_count ?? "–"}</td>
                              <td>
                                <Badge bg={badge.bg}>
                                  {doc.status === "processing" && (
                                    <Spinner animation="border" size="sm" className="me-1 ai-badge-spinner" />
                                  )}
                                  {badge.text}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  title="Xóa tài liệu"
                                  disabled={doc.status === "processing"}
                                  onClick={() => handleDelete(doc)}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Hỏi thử kho kiến thức */}
          <Col xl={5} className="mb-4">
            <Card className="h-100">
              <Card.Header className="fw-bold">
                <i className="fa-solid fa-magnifying-glass me-2 text-primary"></i>Hỏi thử kho kiến thức
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleAsk}>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    maxLength={500}
                    placeholder="Ví dụ: dùng since hay for với số năm?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={asking}
                    className="mb-2"
                  />
                  <div className="d-flex gap-2">
                    <Form.Select value={scope} onChange={(e) => setScope(e.target.value)} disabled={asking}>
                      {SCOPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                    <Button type="submit" disabled={asking} className="text-nowrap">
                      {asking ? <Spinner animation="border" size="sm" /> : "Hỏi AI"}
                    </Button>
                  </div>
                </Form>

                {answer && (
                  <div className="ai-ask-result mt-3">
                    <AiAnalysis text={answer.answer} />
                    {answer.sources.length > 0 && (
                      <div className="ai-ask-sources">
                        <div className="small fw-semibold text-muted mb-1">Nguồn</div>
                        <ul className="list-unstyled mb-0">
                          {answer.sources.map((s) => (
                            <li key={s.number} className="small">
                              <span className="ai-source-number">[{s.number}]</span>{" "}
                              {s.link ? <Link to={s.link}>{s.citation}</Link> : s.citation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default AiKnowledgeManagement;
