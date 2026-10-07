import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../assets/css/course.css";
import courseImage1 from "../assets/img/course/course-basic.png";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - thay thế bằng API call thực tế
  useEffect(() => {
    const mockCourses = [
      {
        id: 1,
        title: "Tiếng Anh Giao Tiếp Cơ Bản",
        description:
          "Khóa học dành cho người mới bắt đầu, tập trung vào kỹ năng giao tiếp hàng ngày",
        image: courseImage1,
        level: "beginner",
        duration: "30 giờ",
        lessons: 25,
        students: 1250,
        rating: 4.8,
        price: 499000,
        originalPrice: 799000,
        category: "communication",
        progress: 0,
        featured: true,
      },
      {
        id: 2,
        title: "Ngữ Pháp Chuyên Sâu",
        description:
          "Nắm vững toàn bộ ngữ pháp tiếng Anh từ cơ bản đến nâng cao",
        image: courseImage1,
        level: "intermediate",
        duration: "45 giờ",
        lessons: 40,
        students: 890,
        rating: 4.9,
        price: 699000,
        originalPrice: 999000,
        category: "grammar",
        progress: 65,
        featured: true,
      },
      {
        id: 3,
        title: "Luyện Thi IELTS",
        description: "Chiến lược và kỹ thuật đạt điểm cao trong kỳ thi IELTS",
        image: courseImage1,
        level: "advanced",
        duration: "60 giờ",
        lessons: 50,
        students: 2100,
        rating: 4.7,
        price: 1299000,
        originalPrice: 1599000,
        category: "exam",
        progress: 0,
        featured: false,
      },
      {
        id: 4,
        title: "Phát Âm Chuẩn",
        description: "Luyện phát âm chuẩn như người bản xứ",
        image: courseImage1,
        level: "beginner",
        duration: "20 giờ",
        lessons: 15,
        students: 750,
        rating: 4.6,
        price: 399000,
        originalPrice: 599000,
        category: "pronunciation",
        progress: 30,
        featured: false,
      },
      {
        id: 5,
        title: "Tiếng Anh Thương Mại",
        description: "Tiếng Anh cho môi trường công sở và kinh doanh",
        image: courseImage1,
        level: "intermediate",
        duration: "35 giờ",
        lessons: 28,
        students: 950,
        rating: 4.8,
        price: 899000,
        originalPrice: 1199000,
        category: "business",
        progress: 0,
        featured: true,
      },
      {
        id: 6,
        title: "Luyện Nghe Nâng Cao",
        description: "Cải thiện kỹ năng nghe hiểu với các tình huống thực tế",
        image: courseImage1,
        level: "advanced",
        duration: "25 giờ",
        lessons: 20,
        students: 680,
        rating: 4.5,
        price: 599000,
        originalPrice: 799000,
        category: "listening",
        progress: 0,
        featured: false,
      },
    ];

    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "featured" && course.featured) ||
      (filter === "in-progress" && course.progress > 0) ||
      course.level === filter ||
      course.category === filter;

    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getLevelBadge = (level) => {
    const levels = {
      beginner: { text: "Cơ bản", class: "bg-success" },
      intermediate: { text: "Trung cấp", class: "bg-warning" },
      advanced: { text: "Nâng cao", class: "bg-danger" },
    };
    return levels[level] || { text: "Không xác định", class: "bg-secondary" };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      communication: "fa-comments",
      grammar: "fa-book",
      exam: "fa-graduation-cap",
      pronunciation: "fa-microphone",
      business: "fa-briefcase",
      listening: "fa-headphones",
    };
    return icons[category] || "fa-book";
  };

  if (loading) {
    return (
      <div className="course-list-container min-vh-100 bg-light py-5">
        <div className="container">
          <div className="text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              style={{ width: "3rem", height: "3rem" }}
            ></div>
            <h4 className="text-muted">Đang tải khóa học...</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-list-container min-vh-100 bg-light">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Khám phá khóa học</h1>
              <p className="lead mb-4">
                Hơn 100+ khóa học chất lượng cao, giúp bạn chinh phục tiếng Anh
                từ cơ bản đến nâng cao
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-light text-primary fs-6">
                  <i className="fas fa-users me-1"></i>10,000+ học viên
                </span>
                <span className="badge bg-light text-primary fs-6">
                  <i className="fas fa-star me-1"></i>4.8/5 đánh giá
                </span>
                <span className="badge bg-light text-primary fs-6">
                  <i className="fas fa-clock me-1"></i>Học mọi lúc
                </span>
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <i className="fas fa-graduation-cap display-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container py-4">
        <div className="row g-4">
          {/* Sidebar Filters */}
          <div className="col-lg-3">
            <div
              className="card shadow-sm border-0 sticky-top"
              style={{ top: "20px" }}
            >
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0">
                  <i className="fas fa-filter me-2 text-primary"></i>
                  Bộ lọc
                </h5>
              </div>
              <div className="card-body">
                {/* Search */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Tìm kiếm</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Tên khóa học..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Danh mục</label>
                  <div className="nav flex-column">
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "all" ? "bg-primary text-white" : "text-dark"
                      }`}
                      onClick={() => setFilter("all")}
                    >
                      <i className="fas fa-th me-2"></i>Tất cả khóa học
                    </button>
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "featured"
                          ? "bg-primary text-white"
                          : "text-dark"
                      }`}
                      onClick={() => setFilter("featured")}
                    >
                      <i className="fas fa-star me-2"></i>Nổi bật
                    </button>
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "in-progress"
                          ? "bg-primary text-white"
                          : "text-dark"
                      }`}
                      onClick={() => setFilter("in-progress")}
                    >
                      <i className="fas fa-play-circle me-2"></i>Đang học
                    </button>
                  </div>
                </div>

                {/* Level Filter */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Trình độ</label>
                  <div className="nav flex-column">
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "beginner"
                          ? "bg-primary text-white"
                          : "text-dark"
                      }`}
                      onClick={() => setFilter("beginner")}
                    >
                      <i className="fas fa-seedling me-2"></i>Cơ bản
                    </button>
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "intermediate"
                          ? "bg-primary text-white"
                          : "text-dark"
                      }`}
                      onClick={() => setFilter("intermediate")}
                    >
                      <i className="fas fa-chart-line me-2"></i>Trung cấp
                    </button>
                    <button
                      className={`nav-link text-start border-0 py-2 px-3 rounded ${
                        filter === "advanced"
                          ? "bg-primary text-white"
                          : "text-dark"
                      }`}
                      onClick={() => setFilter("advanced")}
                    >
                      <i className="fas fa-rocket me-2"></i>Nâng cao
                    </button>
                  </div>
                </div>

                {/* Reset Filter */}
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    setFilter("all");
                    setSearchTerm("");
                  }}
                >
                  <i className="fas fa-redo me-2"></i>Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="col-lg-9">
            {/* Results Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="text-dark mb-1">
                  {filter === "all"
                    ? "Tất cả khóa học"
                    : filter === "featured"
                    ? "Khóa học nổi bật"
                    : filter === "in-progress"
                    ? "Đang học"
                    : "Kết quả tìm kiếm"}
                </h4>
                <p className="text-muted mb-0">
                  {filteredCourses.length} khóa học được tìm thấy
                </p>
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="fas fa-sort me-2"></i>Sắp xếp
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      Phổ biến nhất
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Đánh giá cao
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Mới nhất
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Giá thấp đến cao
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Course Cards */}
            <div className="row g-4">
              {filteredCourses.length === 0 ? (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-search display-1 text-muted mb-3"></i>
                  <h4 className="text-muted">
                    Không tìm thấy khóa học phù hợp
                  </h4>
                  <p className="text-muted">
                    Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setFilter("all");
                      setSearchTerm("");
                    }}
                  >
                    <i className="fas fa-redo me-2"></i>Hiển thị tất cả
                  </button>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div key={course.id} className="col-lg-6 col-xl-4">
                    <div className="card course-card shadow-sm border-0 h-100">
                      {course.featured && (
                        <div className="featured-badge">
                          <span className="badge bg-warning text-dark">
                            <i className="fas fa-star me-1"></i>Nổi bật
                          </span>
                        </div>
                      )}

                      {/* Course Image */}
                      <div className="course-image position-relative">
                        <img
                          src={course.image}
                          className="card-img-top"
                          alt={course.title}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                        <div className="course-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                          <Link
                            to={`/courses/${course.id}`}
                            className="btn btn-light btn-sm rounded-pill px-3"
                          >
                            <i className="fas fa-play me-1"></i>Xem chi tiết
                          </Link>
                        </div>
                      </div>

                      <div className="card-body d-flex flex-column">
                        {/* Course Header */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span
                            className={`badge ${
                              getLevelBadge(course.level).class
                            }`}
                          >
                            {getLevelBadge(course.level).text}
                          </span>
                          <div className="text-warning">
                            <i className="fas fa-star"></i>
                            <span className="ms-1 text-dark fw-medium">
                              {course.rating}
                            </span>
                          </div>
                        </div>

                        {/* Course Title & Description */}
                        <h5 className="card-title text-dark line-clamp-2">
                          {course.title}
                        </h5>
                        <p className="card-text text-muted small line-clamp-2 flex-grow-1">
                          {course.description}
                        </p>

                        {/* Course Meta */}
                        <div className="course-meta d-flex justify-content-between text-muted small mb-3">
                          <span>
                            <i className="fas fa-play-circle me-1"></i>
                            {course.lessons} bài học
                          </span>
                          <span>
                            <i className="fas fa-clock me-1"></i>
                            {course.duration}
                          </span>
                          <span>
                            <i className="fas fa-users me-1"></i>
                            {course.students.toLocaleString()}
                          </span>
                        </div>

                        {/* Progress Bar (if in progress) */}
                        {course.progress > 0 && (
                          <div className="mb-3">
                            <div className="d-flex justify-content-between small text-muted mb-1">
                              <span>Tiến độ</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="progress" style={{ height: "6px" }}>
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Price and Action */}
                        <div className="row d-flex justify-content-between align-items-center mt-auto">
                          <div className="col-12 price-section">
                            {course.originalPrice > course.price ? (
                              <>
                                <span className="text-danger fw-bold fs-5">
                                  {course.price.toLocaleString()}₫
                                </span>
                                <span className="text-muted text-decoration-line-through small ms-2">
                                  {course.originalPrice.toLocaleString()}₫
                                </span>
                              </>
                            ) : (
                              <span className="text-dark fw-bold fs-5">
                                {course.price.toLocaleString()}₫
                              </span>
                            )}
                          </div>
                          <div className="col-12 text-end mt-2">
                                     <Link
                            to={`/courses/${course.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            {course.progress > 0 ? "Tiếp tục" : "Đăng ký"}
                          </Link>
                          </div>
                 
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
