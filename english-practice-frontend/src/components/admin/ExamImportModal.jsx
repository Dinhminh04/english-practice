import React, { useState } from "react";
import axios from "axios";
import { Modal, Button, Form, Row, Col, Badge, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import "../assets/css/examimport.css";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// Nhập đề thi từ PDF bằng AI: upload PDF -> AI tạo bản nháp -> admin duyệt, sửa -> lưu
const ExamImportModal = ({ show, onHide, onSaved }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [included, setIncluded] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPdfFile(null);
    setAudioFile(null);
    setDraft(null);
    setIncluded({});
  };

  const handleClose = () => {
    if (analyzing || saving) return;
    reset();
    onHide();
  };

  // Bước 1: gửi PDF cho AI để tạo bản nháp
  const handleAnalyze = async () => {
    if (!pdfFile) return toast.warning("Vui lòng chọn file PDF đề thi");
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    setAnalyzing(true);
    try {
      const response = await axios.post("/api/exams/import/preview", formData, {
        headers: authHeader(),
      });
      const newDraft = response.data.draft;
      setDraft(newDraft);
      // Mặc định chọn lưu các câu trắc nghiệm
      setIncluded(
        Object.fromEntries(
          newDraft.questions.map((q) => [q.number, q.question_type === "multiple_choice"])
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "AI chưa đọc được file PDF này");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const updateQuestion = (number, changes) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.number === number ? { ...q, ...changes } : q)),
    }));

  const updateOption = (q, index, value) => {
    const options = q.options.map((o, i) => (i === index ? value : o));
    // Nếu sửa đúng lựa chọn đang là đáp án thì cập nhật đáp án theo
    const correct_answer = q.options[index] === q.correct_answer ? value : q.correct_answer;
    updateQuestion(q.number, { options, correct_answer });
  };

  const selectedQuestions = draft ? draft.questions.filter((q) => included[q.number]) : [];
  const needsAudio = selectedQuestions.some((q) => q.is_listening);
  const invalidCount = selectedQuestions.filter(
    (q) => q.options.length < 2 || !q.options.includes(q.correct_answer)
  ).length;

  // Bước 2: lưu bản nháp đã duyệt vào DB
  const handleSave = async () => {
    if (selectedQuestions.length === 0) return toast.warning("Hãy chọn ít nhất một câu hỏi");
    if (invalidCount > 0) return toast.warning("Có câu chưa chọn đáp án đúng");
    if (needsAudio && !audioFile) return toast.warning("Đề có phần nghe, vui lòng chọn file audio");

    const formData = new FormData();
    formData.append("draft", JSON.stringify({ ...draft, questions: selectedQuestions }));
    if (needsAudio) formData.append("audio", audioFile);

    setSaving(true);
    try {
      const response = await axios.post("/api/exams/import/save", formData, {
        headers: authHeader(),
      });
      toast.success(response.data.message);
      reset();
      onSaved();
      onHide();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu đề thi");
    } finally {
      setSaving(false);
    }
  };

  const renderBadges = (q) => (
    <>
      <Badge bg="secondary" className="me-1">{q.part}</Badge>
      {q.is_listening && <Badge bg="info" className="me-1">Nghe</Badge>}
      {q.question_type !== "multiple_choice" && (
        <Badge bg="dark" className="me-1">Chưa hỗ trợ</Badge>
      )}
      {q.answer_source === "ai_suggested" && (
        <Badge bg="warning" text="dark" className="me-1">AI gợi ý đáp án</Badge>
      )}
      {q.needs_review && <Badge bg="danger">Cần duyệt</Badge>}
    </>
  );

  return (
    <Modal show={show} onHide={handleClose} size="xl" backdrop="static" scrollable>
      <Modal.Header closeButton={!analyzing && !saving}>
        <Modal.Title>
          <i className="fas fa-file-pdf text-danger me-2"></i>
          Nhập đề thi từ PDF bằng AI
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!draft ? (
          <div className="exam-import-upload">
            <Form.Group className="mb-3">
              <Form.Label>File PDF đề thi (tối đa 10MB)</Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0] || null)}
                disabled={analyzing}
              />
              <Form.Text muted>
                AI đọc câu hỏi, lựa chọn và bảng đáp án trong PDF. Bạn sẽ được xem và sửa trước khi lưu.
              </Form.Text>
            </Form.Group>
            {analyzing && (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">AI đang đọc đề thi, thường mất khoảng 5–15 giây...</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label>Tên đề thi</Form.Label>
                <Form.Control value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label>Loại đề</Form.Label>
                <Form.Select value={draft.exam_type} onChange={(e) => updateDraft("exam_type", e.target.value)}>
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                  <option value="full_test">Full test</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label>Độ khó</Form.Label>
                <Form.Select value={draft.difficulty} onChange={(e) => updateDraft("difficulty", e.target.value)}>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label>Thời gian (phút)</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={draft.duration}
                  onChange={(e) => updateDraft("duration", parseInt(e.target.value, 10) || 1)}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => updateDraft("description", e.target.value)}
                />
              </Col>
            </Row>

            <Alert variant="light" className="exam-import-summary">
              Đã chọn <b>{selectedQuestions.length}</b> / {draft.questions.length} câu để lưu
              {draft.passages.length > 0 && <> · {draft.passages.length} đoạn văn đọc hiểu sẽ được ghép vào câu hỏi</>}
              {draft.questions.some((q) => q.question_type !== "multiple_choice") && (
                <> · Câu "Chưa hỗ trợ" (điền từ, tự luận) chưa được hệ thống chấm điểm nên không lưu</>
              )}
            </Alert>

            {needsAudio && (
              <Form.Group className="mb-3 exam-import-audio">
                <Form.Label>
                  <i className="fas fa-headphones me-2"></i>File audio cho phần nghe
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                />
              </Form.Group>
            )}

            {draft.questions.map((q) => {
              const supported = q.question_type === "multiple_choice";
              const answerInvalid = supported && !q.options.includes(q.correct_answer);
              return (
                <div
                  key={q.number}
                  className={`exam-import-question ${q.needs_review ? "review" : ""} ${included[q.number] ? "" : "excluded"}`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <b className="me-2">Câu {q.number}</b>
                      {renderBadges(q)}
                    </div>
                    <Form.Check
                      type="switch"
                      label="Lưu"
                      checked={!!included[q.number]}
                      disabled={!supported}
                      onChange={(e) => setIncluded((s) => ({ ...s, [q.number]: e.target.checked }))}
                    />
                  </div>

                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="mb-2"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(q.number, { question_text: e.target.value })}
                  />

                  {supported ? (
                    <Row className="g-2">
                      {q.options.map((option, index) => (
                        <Col md={6} key={index}>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Check
                              type="radio"
                              name={`answer-${q.number}`}
                              checked={option === q.correct_answer}
                              onChange={() => updateQuestion(q.number, { correct_answer: option })}
                              title="Chọn làm đáp án đúng"
                            />
                            <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                            <Form.Control
                              size="sm"
                              value={option}
                              className={option === q.correct_answer ? "correct-option" : ""}
                              onChange={(e) => updateOption(q, index, e.target.value)}
                            />
                          </div>
                        </Col>
                      ))}
                      {answerInvalid && (
                        <Col md={12} className="text-danger small">
                          Chưa có đáp án đúng, hãy chọn một lựa chọn.
                        </Col>
                      )}
                    </Row>
                  ) : (
                    <div className="small text-muted">
                      Đáp án trong đề: <b>{q.correct_answer || "(không có)"}</b>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {draft && (
          <Button variant="outline-secondary" className="me-auto" onClick={reset} disabled={saving}>
            Chọn file khác
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose} disabled={analyzing || saving}>
          Hủy
        </Button>
        {!draft ? (
          <Button variant="primary" onClick={handleAnalyze} disabled={!pdfFile || analyzing}>
            {analyzing ? "Đang phân tích..." : "Phân tích bằng AI"}
          </Button>
        ) : (
          <Button variant="success" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : `Lưu đề thi (${selectedQuestions.length} câu)`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ExamImportModal;
