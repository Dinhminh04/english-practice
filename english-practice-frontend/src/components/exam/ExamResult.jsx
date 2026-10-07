// ExamResult.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/examresult.css";

const ExamResult = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [detailedResults, setDetailedResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchExamResult();
  }, [resultId]);

  const fetchExamResult = async () => {
    try {
      const response = await api.get(`/exams/result/${resultId}`);
      setResult(response.data.result);
      setDetailedResults(response.data.detailedResults);
    } catch (error) {
      console.error("Error fetching exam result:", error);
      toast.error("Không thể tải kết quả bài thi");
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = () => {
    if (!result) return 0;
    return Math.round((result.score / result.total_points) * 100);
  };

  const getPerformanceMessage = () => {
    const percentage = calculatePercentage();
    if (percentage >= 90) return "Xuất sắc! 🎉";
    if (percentage >= 80) return "Rất tốt! 👍";
    if (percentage >= 70) return "Tốt! 👏";
    if (percentage >= 60) return "Đạt yêu cầu ✅";
    return "Cần cố gắng thêm 💪";
  };

  const getPerformanceColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // FIX: Lấy giá trị correct_answer thực tế (string hoặc object)
  const getCorrectAnswerValue = (correctAnswer) => {
    if (!correctAnswer) return "";
    if (typeof correctAnswer === "string") {
      return correctAnswer.replace(/^"|"$/g, "").trim();
    }
    if (typeof correctAnswer === "object" && correctAnswer.answer !== undefined) {
      return String(correctAnswer.answer).replace(/^"|"$/g, "").trim();
    }
    return String(correctAnswer);
  };

  // FIX: Kiểm tra option có phải đáp án đúng không
  const isCorrectOption = (option, correctAnswer) => {
    const correctValue = getCorrectAnswerValue(correctAnswer);
    return option === correctValue;
  };

  // FIX: Kiểm tra option có phải đáp án user chọn không
  const isUserAnswer = (option, userAnswer) => {
    if (!userAnswer) return false;
    if (typeof userAnswer === "object" && userAnswer.value !== undefined) {
      return option === userAnswer.value;
    }
    return option === userAnswer;
  };

  const handleAnalyze = async () => {
    if (detailedResults.filter(q => !q.is_correct).length === 0) {
      toast.info("Bạn đã trả lời đúng hết! Không cần phân tích thêm.");
      setAnalysis("Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm.");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis("");
    try {
      const response = await api.post("/exams/analyze", { detailedResults });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing exam result:", error);
      toast.error("Không thể lấy phân tích từ AI. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-result-container min-vh-100 bg-light py-5">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
            <h4 className="text-muted">Đang tải kết quả...</h4>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="exam-result-container min-vh-100 bg-light py-5">
        <div className="container">
          <div className="text-center py-5">
            <div className="card shadow-sm border-0">
              <div className="card-body py-5">
                <i className="fas fa-exclamation-triangle text-warning mb-3" style={{fontSize: '3rem'}}></i>
                <h2 className="text-dark mb-3">Không tìm thấy kết quả</h2>
                <p className="text-muted mb-4">Kết quả bài thi không tồn tại hoặc đã bị xóa.</p>
                <Link to="/exams" className="btn btn-primary btn-lg">
                  <i className="fas fa-arrow-left me-2"></i>Quay lại danh sách đề thi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-result-container min-vh-100 bg-light py-4">
      <div className="container mt-5">
        {/* Header */}
        <div className="result-header text-center mb-5">
          <div className="card shadow-sm border-0">
            <div className="card-body py-4">
              <nav aria-label="breadcrumb" className="d-flex justify-content-center mb-3">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/exams" className="text-decoration-none">Đề thi</Link>
                  </li>
                  <li className="breadcrumb-item active">Kết quả bài thi</li>
                </ol>
              </nav>
              <h1 className="h2 text-dark mb-2">Kết Quả Bài Thi</h1>
              <h2 className="h4 text-primary">{result.exam_title}</h2>
              <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
                <span className="badge bg-secondary">{result.exam_type}</span>
                <span className="text-muted">
                  <i className="fas fa-calendar me-1"></i>
                  {new Date(result.submitted_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm border-0 sticky-top" style={{top: '20px'}}>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div className={`score-circle mx-auto mb-3 bg-${getPerformanceColor()} bg-opacity-10`}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `4px solid var(--bs-${getPerformanceColor()})`
                    }}>
                    <div className="text-center">
                      <h2 className="mb-0 text-dark" style={{fontWeight: 'bold'}}>
                        {calculatePercentage()}%
                      </h2>
                      <small className="text-muted">Điểm phần trăm</small>
                    </div>
                  </div>
                  <h4 className={`text-${getPerformanceColor()} mb-2`}>
                    {getPerformanceMessage()}
                  </h4>
                </div>

                <div className="score-stats mb-4">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Điểm số:</span>
                    <strong>{result.score}/{result.total_points}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Số câu đúng:</span>
                    <strong>{result.correct_answers}/{result.total_questions}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Thời gian làm:</span>
                    <strong>{formatTime(result.time_spent)}</strong>
                  </div>
                </div>

                <div className="action-buttons">
                  <Link to="/exams" className="btn btn-outline-primary w-100 mb-2">
                    <i className="fas fa-list me-2"></i>Đề thi khác
                  </Link>
                  <button 
                    onClick={() => setActiveTab("details")}
                    className="btn btn-primary w-100"
                  >
                    <i className="fas fa-search me-2"></i>Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-0">
                <ul className="nav nav-tabs nav-justified">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                      onClick={() => setActiveTab("overview")}
                    >
                      <i className="fas fa-chart-bar me-2"></i>Tổng Quan
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "details" ? "active" : ""}`}
                      onClick={() => setActiveTab("details")}
                    >
                      <i className="fas fa-list-ul me-2"></i>Chi Tiết Câu Hỏi
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "analysis" ? "active" : ""}`}
                      onClick={() => setActiveTab("analysis")}
                    >
                      <i className="fas fa-chart-pie me-2"></i>Phân Tích Lỗi
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="tab-content">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="overview-tab">
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                          <h5 className="card-title d-flex align-items-center">
                            <i className="fas fa-award text-warning me-2"></i>
                            Thông tin bài làm
                          </h5>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <span className="text-muted">Thời gian làm bài:</span>
                            <strong>{formatTime(result.time_spent)}</strong>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <span className="text-muted">Thời gian nộp:</span>
                            <strong>{new Date(result.submitted_at).toLocaleString("vi-VN")}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-4">
                      <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                          <h5 className="card-title d-flex align-items-center">
                            <i className="fas fa-chart-line text-info me-2"></i>
                            Thống kê nhanh
                          </h5>
                          <div className="d-flex align-items-center py-2 border-bottom">
                            <i className="fas fa-check text-success me-3"></i>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span>Câu đúng:</span>
                                <strong>{result.correct_answers}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center py-2 border-bottom">
                            <i className="fas fa-times text-danger me-3"></i>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span>Câu sai:</span>
                                <strong>{result.total_questions - result.correct_answers}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center py-2">
                            <i className="fas fa-star text-warning me-3"></i>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span>Điểm TB/câu:</span>
                                <strong>{(result.score / result.total_questions).toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="details-tab">
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h4 className="card-title mb-4">
                        <i className="fas fa-list-ul text-primary me-2"></i>
                        Chi Tiết Từng Câu Hỏi
                      </h4>
                      <div className="questions-review">
                        {detailedResults.map((question, index) => {
                          const correctValue = getCorrectAnswerValue(question.correct_answer);
                          return (
                            <div
                              key={question.id}
                              className={`question-review card mb-4 ${
                                question.is_correct ? "border-success" : "border-danger"
                              }`}
                            >
                              <div className="card-body">
                                <div className="question-header d-flex justify-content-between align-items-start mb-3">
                                  <h5 className="card-title mb-1">
                                    Câu {index + 1}
                                    <span className="text-muted fs-6 ms-2">({question.points} điểm)</span>
                                  </h5>
                                  <span className={`badge ${question.is_correct ? "bg-success" : "bg-danger"}`}>
                                    {question.is_correct ? "Đúng" : "Sai"}
                                  </span>
                                </div>

                                <div className="question-text mb-3">
                                  <p className="fw-bold mb-0">{question.question_text}</p>
                                </div>

                                <div className="options-review">
                                  {question.options.map((option, optIndex) => {
                                    const isCorrect = isCorrectOption(option, question.correct_answer);
                                    const isUserSelected = isUserAnswer(option, question.user_answer);
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`option p-3 rounded mb-2 ${
                                          isCorrect
                                            ? "bg-success bg-opacity-10 border border-success"
                                            : isUserSelected && !question.is_correct
                                            ? "bg-danger bg-opacity-10 border border-danger"
                                            : "border"
                                        }`}
                                      >
                                        <div className="d-flex align-items-center justify-content-between">
                                          <div className="d-flex align-items-center">
                                            <span className="option-label fw-bold me-3">
                                              {String.fromCharCode(65 + optIndex)}
                                            </span>
                                            <span className="option-text">{option}</span>
                                          </div>
                                          <div>
                                            {isCorrect && (
                                              <span className="badge bg-success ms-2">
                                                <i className="fas fa-check me-1"></i> Đáp án đúng
                                              </span>
                                            )}
                                            {isUserSelected && !question.is_correct && (
                                              <span className="badge bg-danger ms-2">
                                                <i className="fas fa-times me-1"></i> Bạn chọn
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {!question.is_correct && (
                                  <div className="explanation mt-3 p-3 bg-light rounded">
                                    <h6 className="d-flex align-items-center mb-2">
                                      <i className="fas fa-lightbulb text-warning me-2"></i>
                                      Giải thích:
                                    </h6>
                                    <p className="mb-0">
                                      Câu trả lời đúng là: <strong>{correctValue}</strong>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === "analysis" && (
                <div className="analysis-tab">
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="card-title mb-0">
                          <i className="fas fa-robot text-primary me-2"></i>
                          Phân Tích Chuyên Sâu từ AI
                        </h4>
                        <button 
                          className="btn btn-primary"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span> Đang phân tích...</>
                          ) : (
                            <><i className="fas fa-magic me-2"></i> Nhận phân tích</>
                          )}
                        </button>
                      </div>

                      {isAnalyzing && (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
                          <h5 className="text-muted">AI đang phân tích bài làm của bạn...</h5>
                        </div>
                      )}

                      {analysis && (
                        <div className="ai-analysis-result mt-4 p-4 bg-light rounded border">
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit' }}>
                            {analysis}
                          </pre>
                        </div>
                      )}

                      {!analysis && !isAnalyzing && (
                        <div className="text-center py-5 bg-light rounded border">
                          <i className="fas fa-robot fs-1 text-muted mb-3"></i>
                          <h5 className="text-dark">Nhận phản hồi chi tiết</h5>
                          <p className="text-muted">
                            Nhấn nút "Nhận phân tích" để AI giúp bạn hiểu rõ các lỗi sai
                            <br/> và gợi ý cách cải thiện nhé!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;