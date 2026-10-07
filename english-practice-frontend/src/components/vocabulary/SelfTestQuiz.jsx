import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/selftestquiz.css"

const SelfTestQuiz = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [collection, setCollection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sessionProgress = location.state?.sessionProgress || [];

  useEffect(() => {
    fetchQuizData();
  }, [collectionId]);

  // Hàm tải dữ liệu bài kiểm tra
  const fetchQuizData = async () => {
    try {
      const [collectionRes, questionsRes] = await Promise.all([
        api.get(`/vocabulary/collections/${collectionId}`),
        api.get(`/vocabulary/questions?collection_id=${collectionId}`),
      ]);
      setCollection(collectionRes.data);
      setQuestions(questionsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Không thể tải dữ liệu cho bài kiểm tra.");
      setLoading(false);
    }
  };

  //  Xử lý chọn câu trả lời
  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answer,
    });
  };

  // Xử lý nộp bài kiểm tra
  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);

    const correctAnswersCount = questions.reduce((acc, question) => {
      return userAnswers[question.id] === question.correct_answer
        ? acc + 1
        : acc;
    }, 0);

    const detailedResults = questions.map((q) => ({
      ...q,
      user_answer: userAnswers[q.id] || null,
      is_correct: userAnswers[q.id] === q.correct_answer,
    }));

    const resultData = {
      score: correctAnswersCount,
      total_questions: questions.length,
      correct_answers: correctAnswersCount,
      collection_title: collection.title,
      submitted_at: new Date(),
      detailed_results: detailedResults,
    };
    setQuizResult(resultData);

    const quizAnswers = questions
      .filter((question) => question.flashcard_id)
      .map((question) => ({
        flashcard_id: question.flashcard_id,
        is_correct: userAnswers[question.id] === question.correct_answer,
      }));

    try {
      await api.post("/vocabulary/session/complete", {
        collection_id: collectionId,
        study_progress: sessionProgress,
        quiz_answers: quizAnswers,
      });
      toast.success("Chúc mừng bạn đã hoàn thành bài kiểm tra và buổi học!");
      setShowResults(true);
    } catch (error) {
      console.error("Error saving session progress:", error);
      toast.error("Lưu tiến độ thất bại, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tính phần trăm điểm đạt được
  const calculatePercentage = () => {
    if (!quizResult || !quizResult.total_questions) return 0;
    const score = Number(quizResult.score);
    const total = Number(quizResult.total_questions);
    if (isNaN(score) || isNaN(total) || total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  // Thông điệp đánh giá dựa trên điểm số
  const getPerformanceMessage = () => {
    const percentage = calculatePercentage();
    if (percentage >= 90) return "Xuất sắc! 🎉";
    if (percentage >= 80) return "Rất tốt! 👍";
    if (percentage >= 70) return "Tốt! 👏";
    if (percentage >= 60) return "Đạt yêu cầu ✅";
    return "Cần cố gắng thêm 💪";
  };

  // Màu sắc đánh giá dựa trên điểm số
  const getPerformanceColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  // Hàm phân tích bài kiểm tra
  const handleAnalyze = async () => {
    if (quizResult.detailed_results.filter((q) => !q.is_correct).length === 0) {
      toast.info("Bạn đã trả lời đúng hết! Không cần phân tích thêm.");
      setAnalysis(
        "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm."
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysis("");
    try {
      const response = await api.post("/vocabulary/analyze", {
        detailedResults: quizResult.detailed_results,
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing quiz result:", error);
      toast.error("Không thể lấy phân tích từ AI. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="self-test-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả bài kiểm tra
  if (showResults && quizResult) {
    const correctPercentage = Math.round(
      (quizResult.correct_answers / quizResult.total_questions) * 100
    );
    const incorrectPercentage = 100 - correctPercentage;
    return (
      <div className="exam-result-container min-vh-100 bg-light py-4">
        <div className="container">
          {/* Header */}
          <div className="result-header text-center mb-5">
            <div className="card shadow-sm border-0">
              <div className="card-body py-4">
                <h1 className="h2 text-dark mb-2">Kết Quả Kiểm Tra</h1>
                <h2 className="h4 text-primary">
                  {quizResult.collection_title}
                </h2>
                <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
                  <span className="text-muted">
                    <i className="fas fa-calendar me-1"></i>
                    {new Date(quizResult.submitted_at).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="row">
            {/* Sidebar - Score Summary */}
            <div className="col-lg-4 mb-4">
              <div
                className="card shadow-sm border-0 sticky-top"
                style={{ top: "20px" }}
              >
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div
                      className={`score-circle mx-auto mb-3  bg-opacity-10`}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `4px solid var(--bs-${getPerformanceColor()})`,
                      }}
                    >
                      <div className="text-center">
                        <h2
                          className={`mb-0 text-${getPerformanceColor()}`}
                          style={{ fontWeight: "bold" }}
                        >
                          {calculatePercentage()}%
                        </h2>
                        <small className="text-muted">Điểm</small>
                      </div>
                    </div>
                    <h4 className={`text-${getPerformanceColor()} mb-2`}>
                      {getPerformanceMessage()}
                    </h4>
                  </div>

                  <div className="score-stats mb-4">
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="text-muted">Số câu đúng:</span>
                      <strong>
                        {quizResult.correct_answers}/
                        {quizResult.total_questions}
                      </strong>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <Link
                      to={`/vocabulary-collections/${collectionId}`}
                      className="btn btn-outline-primary w-100 mb-2"
                    >
                      <i className="fas fa-arrow-left me-2"></i>Quay lại bộ từ
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
                        className={`nav-link ${
                          activeTab === "overview" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("overview")}
                      >
                        <i className="fas fa-chart-bar me-2"></i>Tổng Quan
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          activeTab === "details" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("details")}
                      >
                        <i className="fas fa-list-ul me-2"></i>Chi Tiết
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          activeTab === "analysis" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("analysis")}
                      >
                        <i className="fas fa-chart-pie me-2"></i>Phân Tích Lỗi
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === "overview" && (
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h5 className="card-title d-flex align-items-center">
                        <i className="fas fa-chart-line text-info me-2"></i>
                        Thống kê nhanh
                      </h5>
                      <div className="quick-stats">
                        <div className="d-flex align-items-center py-2 border-bottom">
                          <i className="fas fa-check text-success me-3"></i>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                              <span>Câu đúng:</span>
                              <strong>{quizResult.correct_answers}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center py-2">
                          <i className="fas fa-times text-danger me-3"></i>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                              <span>Câu sai:</span>
                              <strong>
                                {quizResult.total_questions -
                                  quizResult.correct_answers}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h4 className="card-title mb-4">
                        <i className="fas fa-list-ul text-primary me-2"></i>
                        Chi Tiết Từng Câu Hỏi
                      </h4>
                      {quizResult.detailed_results.map((question, index) => (
                        <div
                          key={question.id}
                          className={`question-review card mb-4 ${
                            question.is_correct
                              ? "border-success"
                              : "border-danger"
                          }`}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h5 className="card-title mb-1">
                                Câu {index + 1}
                              </h5>
                              <span
                                className={`badge ${
                                  question.is_correct
                                    ? "bg-success"
                                    : "bg-danger"
                                }`}
                              >
                                {question.is_correct ? "Đúng" : "Sai"}
                              </span>
                            </div>
                            <p className="fw-bold mb-3">
                              {question.question_text}
                            </p>
                            <div className="options-review">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`option p-3 rounded mb-2 ${
                                    option === question.correct_answer
                                      ? "bg-success bg-opacity-10 border border-success"
                                      : ""
                                  } ${
                                    option === question.user_answer &&
                                    !question.is_correct
                                      ? "bg-danger bg-opacity-10 border border-danger"
                                      : "border"
                                  }`}
                                >
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span>{option}</span>
                                    <div>
                                      {option === question.correct_answer && (
                                        <span className="badge bg-success ms-2">
                                          <i className="fas fa-check me-1"></i>{" "}
                                          Đáp án đúng
                                        </span>
                                      )}
                                      {option === question.user_answer &&
                                        !question.is_correct && (
                                          <span className="badge bg-danger ms-2">
                                            <i className="fas fa-times me-1"></i>{" "}
                                            Bạn chọn
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                                Đang phân tích...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-magic me-2"></i> Nhận phân
                                tích
                              </>
                            )}
                          </button>
                        </div>

                        {isAnalyzing && (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary mb-3"
                              style={{ width: "3rem", height: "3rem" }}
                            ></div>
                            <h5 className="text-muted">
                              AI đang phân tích bài làm của bạn...
                            </h5>
                            <p className="text-muted small">
                              Quá trình này có thể mất một vài giây.
                            </p>
                          </div>
                        )}

                        {analysis && (
                          <div className="ai-analysis-result mt-4 p-4 bg-light rounded border">
                            <pre
                              style={{
                                whiteSpace: "pre-wrap",
                                fontFamily: "inherit",
                                fontSize: "inherit",
                              }}
                            >
                              {analysis}
                            </pre>
                          </div>
                        )}

                        {!analysis && !isAnalyzing && (
                          <div className="text-center py-5 bg-light rounded border">
                            <i className="fas fa-robot fs-1 text-muted mb-3"></i>
                            <h5 className="text-dark">
                              Nhận phản hồi chi tiết
                            </h5>
                            <p className="text-muted">
                              Nhấn nút "Nhận phân tích" để AI giúp bạn hiểu rõ
                              các lỗi sai
                              <br /> và gợi ý cách cải thiện nhé!
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
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options =
    currentQuestion && Array.isArray(currentQuestion.options)
      ? currentQuestion.options
      : [];
  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="self-test-container">
      <div className="container">
        {/* Header */}
        <div className="quiz-header">
          <Link
            to={`/vocabulary-collections/${collectionId}`}
            className="back-btn-self-test"
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </Link>
          <h1 className="quiz-title">{collection?.title}</h1>
          <p className="quiz-subtitle">Bài kiểm tra từ vựng</p>

          {/* Progress Bar */}
          <div className="quiz-progress">
            <div className="progress-info">
              <span>Tiến độ bài làm</span>
              <span>
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quiz Card */}
        <div className="quiz-card">
          <div className="quiz-card-header">
            <h2>Câu hỏi kiểm tra</h2>
          </div>

          <div className="quiz-card-body">
            {currentQuestion && (
              <>
                <div className="question-counter">
                  Câu {currentQuestionIndex + 1} / {questions.length}
                </div>

                <div className="question-text">
                  {currentQuestion.question_text}
                </div>

                <div className="options-grid">
                  {options.map((option, index) => {
                    const letter = String.fromCharCode(65 + index); // A, B, C, D
                    const isSelected =
                      userAnswers[currentQuestion.id] === option;

                    return (
                      <button
                        key={index}
                        className={`option-btn ${isSelected ? "selected" : ""}`}
                        onClick={() =>
                          handleAnswerSelect(currentQuestion.id, option)
                        }
                      >
                        <div className="option-letter">{letter}</div>
                        <div className="option-text">{option}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="quiz-card-footer">
            <div className="navigation-buttons">
              <button
                className="nav-btn"
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                }
                disabled={currentQuestionIndex === 0}
              >
                <i className="fas fa-arrow-left"></i> Câu trước
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  className="nav-btn"
                  onClick={() =>
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  }
                  disabled={!userAnswers[currentQuestion?.id]}
                >
                  Câu tiếp theo <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  className="submit-btn"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || !userAnswers[currentQuestion?.id]}
                >
                  {isSubmitting ? (
                    <>
                      <div
                        className="loading-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderWidth: "2px",
                        }}
                      ></div>
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Nộp bài
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="answered-count">
              Đã trả lời: {Object.keys(userAnswers).length}/{questions.length}
            </div>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="quiz-stats">
          <div className="stat-item">
            <div className="stat-label">Tổng câu hỏi</div>
            <div className="stat-value">{questions.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Đã trả lời</div>
            <div className="stat-value">{Object.keys(userAnswers).length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Còn lại</div>
            <div className="stat-value">
              {questions.length - Object.keys(userAnswers).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfTestQuiz;
