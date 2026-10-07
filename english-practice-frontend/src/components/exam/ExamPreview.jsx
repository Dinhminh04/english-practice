import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/style.css"; // Assuming a global style or create a new one

const ExamPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${id}`);
        setExam(response.data);
      } catch (error) {
        console.error("Error fetching exam details:", error);
        toast.error("Không thể tải thông tin đề thi.");
        navigate("/exams");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Đang tải thông tin đề thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container text-center my-5">
        <h1>Không tìm thấy đề thi</h1>
        <Link to="/exams" className="btn btn-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm exam-preview-card">
        <div className="card-header bg-primary text-white">
          <h1 className="mb-0">{exam.title}</h1>
        </div>
        <div className="card-body">
          <p className="card-text lead">{exam.description}</p>

          <div className="row my-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Thông tin chi tiết</h5>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong><i className="fas fa-clock me-2"></i>Thời gian làm bài</strong>
                    <span>{exam.duration > 0 ? `${exam.duration} phút` : "Không giới hạn"}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong><i className="fas fa-question-circle me-2"></i>Số câu hỏi</strong>
                    <span>{exam.total_questions || exam.questions?.length || 0} câu</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong><i className="fas fa-tags me-2"></i>Loại đề thi</strong>
                    <span className="badge bg-info">{exam.exam_type}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong><i className="fas fa-tachometer-alt me-2"></i>Độ khó</strong>
                    <span className="badge bg-warning">{exam.difficulty}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <strong><i className="fas fa-user-edit me-2"></i>Người tạo</strong>
                    <span>{exam.creator_name}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-center rules-section">
                <h5>Quy định làm bài</h5>
                <ul className="list-unstyled text-start">
                    <li><i className="fas fa-check-circle text-success me-2"></i>Đọc kỹ câu hỏi trước khi trả lời.</li>
                    <li><i className="fas fa-check-circle text-success me-2"></i>Bài thi sẽ được tính giờ (nếu có).</li>
                    <li><i className="fas fa-check-circle text-success me-2"></i>Nếu hết giờ, bài thi sẽ tự động được nộp.</li>
                    <li><i className="fas fa-check-circle text-success me-2"></i>Bạn có thể xem lại câu hỏi và thay đổi đáp án.</li>
                </ul>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate(`/exams/${id}/take`)}
              className="btn btn-success btn-lg me-3"
            >
              <i className="fas fa-play-circle me-2"></i>Bắt đầu làm bài
            </button>
            <button onClick={() => navigate("/exams")} className="btn btn-secondary btn-lg">
              <i className="fas fa-arrow-left me-2"></i>Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;
