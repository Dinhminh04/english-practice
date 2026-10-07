import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/vocabulary.css";

const VocabularyCollections = ({ isAuthenticated }) => {
  const [collections, setCollections] = useState([]);
  const [learningProgress, setLearningProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    fetchCollections();
  }, []);

  // Hàm tải danh sách bộ từ vựng và tiến độ học tập
  const fetchCollections = async () => {
    try {
      const [collectionsRes, progressRes] = await Promise.all([
        api.get("/vocabulary/collections"),
        isAuthenticated
          ? api.get("/vocabulary/learning/progress")
          : Promise.resolve({ data: [] }),
      ]);

      setCollections(collectionsRes.data);

      // Tạo map progress theo collection
      const progressMap = {};
      progressRes.data.forEach((item) => {
        if (!progressMap[item.collection_id]) {
          progressMap[item.collection_id] = [];
        }
        progressMap[item.collection_id].push(item);
      });
      setLearningProgress(progressMap);
      setLoading(false);
    } catch (error) {
      toast.error("Không thể tải danh sách bộ từ vựng");
      setLoading(false);
    }
  };

  // Hàm tính toán tiến độ học tập cho mỗi bộ
  const getProgressStats = (collectionId) => {
    const progress = learningProgress[collectionId] || [];
    const totalCards =
      collections.find((c) => c.id === collectionId)?.total_cards || 0;
    const mastered = progress.filter((p) => p.status === "mastered").length;
    const learning = progress.filter((p) => p.status === "learning").length;

    return {
      mastered,
      learning,
      total: totalCards,
      progress: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
    };
  };

  // Lọc bộ từ vựng theo từ khóa và trình độ
  const filteredCollections = collections.filter((collection) => {
    const matchesSearch =
      collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !levelFilter || collection.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Hàm hiển thị nhãn trình độ
  const getLevelBadge = (level) => {
    const levelConfig = {
      beginner: { label: "Cơ bản", class: "beginner" },
      intermediate: { label: "Trung cấp", class: "intermediate" },
      advanced: { label: "Nâng cao", class: "advanced" }
    };
    
    // Nếu level không hợp lệ, trả về nhãn mặc định
    const config = levelConfig[level] || { label: level, class: "beginner" };
    return (
      <span className={`collection-level-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="vocabulary-collections-container">
        <div className="container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            {/* <p>Đang tải danh sách bộ từ vựng...</p> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vocabulary-collections-container">
      <div className="container">
        {/* Header Section */}
        <div className="collections-header">
          <div className="header-content-vocabulary">
            <h1>Học Từ Vựng với Flashcard</h1>
            <p>Hệ thống Spaced Repetition giúp bạn ghi nhớ từ vựng hiệu quả và lâu dài</p>
          </div>
          <div className="header-badge">
            <span>🎯 Phương pháp khoa học</span>
          </div>
        </div>

        {/* Filters Section */}
        <div className="collections-filters-section">
          <div className="filters-container">
            <div className="search-box-wrapper">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm bộ từ vựng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="filter-controls">
              <div className="filter-select-wrapper">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="level-filter-select"
                >
                  <option value="">Tất cả trình độ</option>
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </select>
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="collections-content">
          {filteredCollections.length === 0 ? (
            <div className="no-collections-found">
              <div className="no-collections-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <h3>Không tìm thấy bộ từ vựng phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trình độ</p>
            </div>
          ) : (
            <div className="collections-grid">
              {filteredCollections.map((collection) => {
                const stats = getProgressStats(collection.id);

                return (
                  <div key={collection.id} className="collection-card">
                    <div className="card-header">
                      <div className="card-badges">
                        {getLevelBadge(collection.level)}
                        <span className="collection-category-badge">
                          {collection.category}
                        </span>
                      </div>
                      {isAuthenticated && stats.learning > 0 && (
                        <div className="active-learning-badge">
                          📚 Đang học
                        </div>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="collection-icon">
                        <i className="fas fa-book"></i>
                      </div>
                      <h3 className="collection-title">{collection.title}</h3>
                      <p className="collection-description">{collection.description}</p>

                      {isAuthenticated && (
                        <div className="progress-section">
                          <div className="progress-header">
                            <span>Tiến độ học tập</span>
                            <span className="progress-percent">{stats.progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${stats.progress}%` }}
                            ></div>
                          </div>
                          <div className="progress-stats">
                            <span className="stats-item">
                              <i className="fas fa-check-circle"></i>
                              {stats.mastered} từ đã thuộc
                            </span>
                            <span className="stats-item">
                              <i className="fas fa-clock"></i>
                              {stats.learning} từ đang học
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="collection-meta">
                        <div className="meta-item">
                          <i className="fas fa-list"></i>
                          <span>{collection.total_cards} từ vựng</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-user"></i>
                          <span>{collection.creator_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      {isAuthenticated ? (
                        <Link
                          to={`/vocabulary-collections/${collection.id}/study`}
                          className="btn btn-primary study-btn"
                        >
                          <i className="fas fa-play"></i>
                          {stats.learning > 0
                            ? `Tiếp tục học (${stats.learning})`
                            : "Bắt đầu học"}
                        </Link>
                      ) : (
                        <Link to="/login" className="btn btn-primary study-btn">
                          <i className="fas fa-sign-in-alt"></i>
                          Đăng nhập để học
                        </Link>
                      )}
                      <Link
                        to={`/vocabulary-collections/${collection.id}/preview`}
                        className="btn btn-outline preview-btn"
                      >
                        <i className="fas fa-eye"></i>
                        Xem trước
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="collections-info pb-5">
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <div className="info-content">
              <h4>Phương pháp Spaced Repetition</h4>
              <p>Học từ vựng đúng thời điểm để ghi nhớ lâu dài với thuật toán thông minh</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>Theo dõi tiến độ</h4>
              <p>Biết được từ nào bạn đã thuộc và từ nào cần ôn tập thêm</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <h4>Học mọi lúc mọi nơi</h4>
              <p>Truy cập trên mọi thiết bị, học offline và đồng bộ khi có kết nối</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyCollections;