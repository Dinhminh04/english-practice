import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/examtaking.css";

const ExamTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Lấy thông tin đề thi từ API
  const fetchExam = async () => {
    try {
      const response = await api.get(`/exams/${id}`);
      
      const examData = response.data;
      if (examData.questions) {
        examData.questions = examData.questions.map(question => {
          let options = question.options;
          
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch (error) {
              options = options.split(',').map(opt => opt.trim());
            }
          }
          
          if (!Array.isArray(options)) {
            options = [];
          }
          
          return { ...question, options };
        });
      }
      
      setExam(examData);
      if (examData.duration && examData.duration > 0) {
        setTimeLeft(examData.duration * 60);
        startTimer();
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Không thể tải đề thi");
      navigate("/exams");
    }
  };

  // Bắt đầu đồng hồ đếm ngược
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Định dạng thời gian hiển thị
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Lấy trạng thái thời gian để thay đổi màu sắc
  const getTimeStatus = () => {
    if (timeLeft === 0) return "ended";
    if (timeLeft < 300) return "warning";
    if (timeLeft < 600) return "alert";
    return "normal";
  };

  // FIX: Lưu cả index và value của option
  const handleAnswerSelect = (questionId, optionIndex, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { index: optionIndex, value: optionValue },
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionNav = (index) => {
    setCurrentQuestion(index);
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await submitExam();
  };

  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitConfirm(false);
    await handleAutoSubmit();
  };

  const handleCancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  // FIX: Gửi giá trị option thực tế thay vì index
  const submitExam = async () => {
    try {
      const formattedAnswers = Object.keys(answers).map((questionId) => ({
        question_id: parseInt(questionId, 10),
        answer: answers[questionId].value, // Gửi giá trị thực tế
      }));

      const response = await api.post(`/exams/${id}/submit`, {
        answers: formattedAnswers,
        time_spent: exam.duration * 60 - timeLeft,
      });

      const { resultId } = response.data;
      navigate(`/exams/result/${resultId}`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Lỗi khi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    return exam ? (getAnsweredCount() / exam.questions.length) * 100 : 0;
  };

  if (!exam) {
    return (
      <div className="exam-taking-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Đang tải đề thi...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="exam-taking-container">
        <div className="empty-exam">
          <div className="empty-icon">📝</div>
          <h2>{exam.title}</h2>
          <p>Đề thi này hiện chưa có câu hỏi.</p>
          <button onClick={() => navigate("/exams")} className="btn-primary">
            Quay lại danh sách đề thi
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];
  const safeOptions = Array.isArray(question.options) ? question.options : [];

  return (
    <div className="exam-taking-container">
      {/* Header */}
      <div className="exam-header d-flex align-items-center">
        <div className="container">
          <div className="header-content-taking">
            <div className="exam-title-section">
              <h1 className="exam-title">{exam.title}</h1>
              <div className="exam-meta">
                <span className="meta-item">
                  <span className="meta-icon">📊</span>
                  {exam.questions.length} câu hỏi
                </span>
                <span className="meta-item">
                  <span className="meta-icon">🎯</span>
                  {getAnsweredCount()}/{exam.questions.length} đã trả lời
                </span>
              </div>
            </div>

            <div className="exam-controls">
              <div className={`timer ${getTimeStatus()}`}>
                <div className="timer-icon">⏱️</div>
                <div className="timer-content">
                  <div className="timer-text">Thời gian còn lại</div>
                  <div className="timer-display">
                    {timeLeft > 0 ? formatTime(timeLeft) : "Không giới hạn"}
                  </div>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {Math.round(getProgressPercentage())}% hoàn thành
                </div>
              </div>

              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📤</span>
                    Nộp bài
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="exam-content">
          {/* Question Navigation Sidebar */}
          <div className="question-sidebar">
            <div className="sidebar-header">
              <h3>Danh sách câu hỏi</h3>
              <div className="answered-count">
                {getAnsweredCount()}/{exam.questions.length}
              </div>
            </div>
            
            <div className="question-grid">
              {exam.questions.map((q, index) => (
                <button
                  key={q.id}
                  className={`question-btn ${
                    index === currentQuestion ? "active" : ""
                  } ${answers[q.id] !== undefined ? "answered" : "unanswered"} ${
                    q.id === question.id ? "current" : ""
                  }`}
                  onClick={() => handleQuestionNav(index)}
                >
                  <span className="question-number">{index + 1}</span>
                  {answers[q.id] !== undefined && (
                    <span className="answer-indicator">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="sidebar-footer">
              <div className="status-legend">
                <div className="status-item">
                  <div className="status-dot answered"></div>
                  <span>Đã trả lời</span>
                </div>
                <div className="status-item">
                  <div className="status-dot unanswered"></div>
                  <span>Chưa trả lời</span>
                </div>
                <div className="status-item">
                  <div className="status-dot current"></div>
                  <span>Đang xem</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="question-content">
            <div className="question-header">
              <div className="question-info">
                <h2 className="question-position">
                  Câu {currentQuestion + 1}/{exam.questions.length}
                </h2>
                <div className="question-points">
                  <span className="points-badge">{question.points} điểm</span>
                </div>
              </div>
              
              <div className="question-nav-buttons">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className="nav-btn prev"
                >
                  <span className="nav-icon">←</span>
                  Câu trước
                </button>
                
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === exam.questions.length - 1}
                  className="nav-btn next"
                >
                  Câu tiếp theo
                  <span className="nav-icon">→</span>
                </button>
              </div>
            </div>

            <div className="question-body">
              {/* Media Section */}
              {(question.audio_url || question.image_url) && (
                <div className="question-media">
                  {question.audio_url && (
                    <div className="audio-player">
                      <div className="audio-header">
                        <span className="audio-icon">🎵</span>
                        <span>Audio</span>
                      </div>
                      <audio controls className="audio-element">
                        <source src={`http://localhost:5000${question.audio_url}`} type="audio/mpeg" />
                        Trình duyệt của bạn không hỗ trợ phát audio.
                      </audio>
                    </div>
                  )}
                  
                  {question.image_url && (
                    <div className="question-image">
                      <img 
                        src={`http://localhost:5000${question.image_url}`} 
                        alt="Minh họa câu hỏi" 
                        className="image-element"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Question Text */}
              <div className="question-text-section">
                <div className="question-text">
                  {question.question_text}
                </div>
              </div>

              {/* Options */}
              <div className="options-section">
                <h4 className="options-title">Chọn đáp án đúng:</h4>
                <div className="options-grid">
                  {safeOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`option-card ${
                        answers[question.id]?.index === index ? "selected" : ""
                      }`}
                      onClick={() => handleAnswerSelect(question.id, index, option)}
                    >
                      <div className="option-selector">
                        <div className="option-radio">
                          {answers[question.id]?.index === index && (
                            <div className="radio-dot"></div>
                          )}
                        </div>
                        <span className="option-label">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <span className="option-text">{option}</span>
                    </div>
                  ))}
                  
                  {safeOptions.length === 0 && (
                    <div className="no-options">
                      <span className="no-options-icon">⚠️</span>
                      <p>Không có lựa chọn nào cho câu hỏi này.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <h3>Xác nhận nộp bài</h3>
            </div>
            <div className="modal-body">
              <div className="submit-summary">
                <div className="summary-item">
                  <span className="summary-label">Số câu đã trả lời:</span>
                  <span className="summary-value">{getAnsweredCount()}/{exam.questions.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Thời gian làm bài:</span>
                  <span className="summary-value">
                    {formatTime(exam.duration * 60 - timeLeft)}
                  </span>
                </div>
              </div>
              <p>Bạn có chắc chắn muốn nộp bài thi này?</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleCancelSubmit}
                className="btn-cancel"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className="btn-confirm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Đang nộp...
                  </>
                ) : (
                  "Xác nhận nộp bài"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTaking;