import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/vocabulary.css";

const VocabularyPreview = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hàm tải chi tiết bộ từ vựng
    const fetchCollection = async () => {
      try {
        const response = await api.get(`/vocabulary/collections/${collectionId}`);
        setCollection(response.data);
      } catch (error) {
        console.error("Error fetching collection details:", error);
        toast.error("Không thể tải thông tin bộ từ vựng.");
        navigate("/vocabulary-collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId, navigate]);

  if (loading) {
    return (
      <div className="container text-center my-5">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Đang tải thông tin bộ từ vựng...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container text-center my-5">
        <h1 className="text-danger mb-4">Không tìm thấy bộ từ vựng</h1>
        <Link to="/vocabulary-collections" className="btn btn-primary">
          <i className="fas fa-arrow-left me-2"></i>Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="container vocabulary-preview my-5 fade-in">
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
        {/* Header */}
        <div className="card-header bg-gradient text-white py-4" style={{ background: "linear-gradient(135deg, #007bff, #00bcd4)" }}>
          <h1 className="mb-0 text-center text-dark fw-bold">
            <i className="fas fa-language me-2"></i>{collection.title}
          </h1>
        </div>

        {/* Body */}
        <div className="card-body p-4 p-md-5 bg-light">
          <p className="lead text-center text-muted mb-4">{collection.description}</p>

          <div className="row g-4">
            {/* Thông tin chi tiết */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-0 fw-bold fs-5 text-primary">
                  <i className="fas fa-info-circle me-2"></i>Thông tin chi tiết
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-book me-2 text-secondary"></i>Số lượng từ</span>
                    <span className="fw-bold text-primary">{collection.flashcards?.length || 0} từ</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-layer-group me-2 text-secondary"></i>Chủ đề</span>
                    <span className="badge bg-info text-dark px-3 py-2">{collection.category}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-tachometer-alt me-2 text-secondary"></i>Độ khó</span>
                    <span className="badge bg-warning text-dark px-3 py-2">{collection.level}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-user-edit me-2 text-secondary"></i>Người tạo</span>
                    <span className="fw-semibold">{collection.creator_name}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Phương pháp học */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 bg-white text-center p-4">
                <h5 className="fw-bold text-primary mb-3">
                  <i className="fas fa-lightbulb me-2"></i>Phương pháp học hiệu quả
                </h5>
                <ul className="list-unstyled text-start mx-auto" style={{ maxWidth: "90%" }}>
                  <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Học từ vựng bằng Flashcard tương tác.</li>
                  <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Áp dụng lặp lại ngắt quãng (Spaced Repetition).</li>
                  <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Tự kiểm tra bằng mini test nhanh.</li>
                  <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Theo dõi tiến độ học tập chi tiết.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="text-center mt-5">
            <button
              onClick={() => navigate(`/vocabulary-collections/${collectionId}/study`)}
              className="btn btn-success btn-lg me-3 px-4 rounded-pill shadow-sm"
            >
              <i className="fas fa-play-circle me-2"></i>Bắt đầu học
            </button>
            <button
              onClick={() => navigate("/vocabulary-collections")}
              className="btn btn-outline-secondary btn-lg px-4 rounded-pill"
            >
              <i className="fas fa-arrow-left me-2"></i>Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyPreview;
