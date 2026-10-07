import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "../assets/css/examlist.css";


const ExamList = ({ isAuthenticated }) => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [examType, setExamType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, examType, difficulty]);

  // Lấy bài kiểm tra từ API
  const fetchExams = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/exams");
      setExams(response.data.exams);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Không thể tải danh sách đề thi");
      setLoading(false);
    }
  };

  // Lọc bài kiểm tra dựa trên từ khóa và bộ lọc
  const filterExams = () => {
    let filtered = exams;

    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (examType) {
      filtered = filtered.filter(exam => exam.exam_type === examType);
    }

    if (difficulty) {
      filtered = filtered.filter(exam => exam.difficulty === difficulty);
    }

    setFilteredExams(filtered);
  };

  // Lấy biểu tượng loại đề thi
  const getExamTypeIcon = (type) => {
    const icons = {
      ielts: "🎓",
      toeic: "💼",
      toefl: "🌎",
      general: "📚",
      practice: "🔰"
    };
    return icons[type] || "📝";
  };

  // Lấy nhãn độ khó
  const getDifficultyBadge = (level) => {
    const levels = {
      easy: { text: "Dễ", color: "#27ae60", bg: "#d5f4e6" },
      medium: { text: "Trung bình", color: "#f39c12", bg: "#fef5e6" },
      hard: { text: "Khó", color: "#e74c3c", bg: "#fde8e6" },
      expert: { text: "Chuyên gia", color: "#8e44ad", bg: "#f4e6fd" }
    };
    return levels[level] || { text: "Không xác định", color: "#95a5a6", bg: "#ecf0f1" };
  };

  if (loading) {
    return (
      <div className="exam-list-container">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Đang tải danh sách đề thi...</h3>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-list-container">
      <div className="container">
        {/* Header Section */}
        <div className="exam-header-list">
          <div className="header-content">
            <h1 className="page-title">Luyện Đề Thi Tiếng Anh</h1>
            <p className="page-subtitle">
              Chọn đề thi phù hợp với trình độ và mục tiêu của bạn. 
              Hệ thống đề thi đa dạng từ cơ bản đến nâng cao.
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-number">{exams.length}</div>
              <div className="stat-label">Đề thi có sẵn</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {exams.reduce((acc, exam) => acc + (exam.attempt_count || 0), 0)}
              </div>
              <div className="stat-label">Lượt thi</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="search-filter">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm đề thi theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <label className="filter-label">Loại đề thi</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả loại đề</option>
                <option value="ielts">IELTS</option>
                <option value="toeic">TOEIC</option>
                <option value="toefl">TOEFL</option>
                <option value="general">Tổng quát</option>
                <option value="practice">Luyện tập</option>
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Độ khó</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả độ khó</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
                <option value="expert">Chuyên gia</option>
              </select>
            </div>

            <div className="filter-actions">
              <button 
                className="reset-filters"
                onClick={() => {
                  setSearchTerm("");
                  setExamType("");
                  setDifficulty("");
                }}
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            Hiển thị <strong>{filteredExams.length}</strong> đề thi
            {(searchTerm || examType || difficulty) && (
              <span className="filtered-text"> (đã lọc)</span>
            )}
          </div>
        </div>

        {/* Exams Grid */}
        <div className="exams-grid">
          {filteredExams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Không tìm thấy đề thi phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSearchTerm("");
                  setExamType("");
                  setDifficulty("");
                }}
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const difficultyInfo = getDifficultyBadge(exam.difficulty);
              
              return (
                <div key={exam.id} className="exam-card">
                  <div className="exam-card-header">
                    <div className="exam-type-badge">
                      <span className="type-icon">
                        {getExamTypeIcon(exam.exam_type)}
                      </span>
                      <span className="type-text">
                        {exam.exam_type.toUpperCase()}
                      </span>
                    </div>
                    <div 
                      className="difficulty-badge"
                      style={{ 
                        backgroundColor: difficultyInfo.bg,
                        color: difficultyInfo.color
                      }}
                    >
                      {difficultyInfo.text}
                    </div>
                  </div>

                  <div className="exam-card-body">
                    <h3 className="exam-title">{exam.title}</h3>
                    <p className="exam-description">{exam.description}</p>
                    
                    <div className="exam-meta">
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">{exam.duration} phút</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">❓</span>
                        <span className="meta-text">{exam.total_questions || 0} câu hỏi</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span className="meta-text">{exam.attempt_count || 0} lượt thi</span>
                      </div>
                    </div>

                    {exam.tags && exam.tags.length > 0 && (
                      <div className="exam-tags">
                        {exam.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="exam-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="exam-card-footer">
                    {isAuthenticated ? (
                      <Link
                        to={`/exams/${exam.id}/take`}
                        className="btn-primary exam-action"
                      >
                        <span className="btn-icon">🚀</span>
                        Bắt đầu thi
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="btn-primary exam-action"
                      >
                        <span className="btn-icon">🔐</span>
                        Đăng nhập để thi
                      </Link>
                    )}
                    
                    <div className="action-buttons w-100 ">
                      <Link
                        to={`/exams/${exam.id}/preview`}
                        className="btn-secondary w-100"
                      >
                        <span className="btn-icon">👁️</span>
                        Xem trước
                      </Link>
            
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        {filteredExams.length > 0 && (
          <div className="quick-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {filteredExams.reduce((acc, exam) => acc + (exam.total_questions || 0), 0)}
                  </div>
                  <div className="stat-label">Tổng số câu hỏi</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {filteredExams.reduce((acc, exam) => acc + exam.duration, 0)}
                  </div>
                  <div className="stat-label">Tổng thời gian (phút)</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {filteredExams.reduce((acc, exam) => acc + (exam.attempt_count || 0), 0)}
                  </div>
                  <div className="stat-label">Tổng lượt thi</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;