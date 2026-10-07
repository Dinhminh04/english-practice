// Home.jsx
import React from "react";
import { Link } from 'react-router-dom';
import './assets/css/home.css';

const Home = ({ isAuthenticated, userRole, userId }) => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span>🎯 Phương pháp học hiệu quả</span>
              </div>
              <h1 className="hero-title">
                Chinh phục tiếng Anh
                <span className="highlight"> cùng chuyên gia</span>
              </h1>
              <p className="hero-description">
                Khám phá lộ trình học tiếng Anh thông minh, được cá nhân hóa theo trình độ 
                và mục tiêu của bạn. Bắt đầu hành trình chinh phục ngôn ngữ toàn cầu ngay hôm nay!
              </p>
              <div className="hero-buttons">
                {isAuthenticated ? (
                  <Link to="/courses" className="btn btn-primary">
                    <span className="btn-icon">🚀</span>
                    Tiếp tục học tập
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-primary">
                    <span className="btn-icon">🎯</span>
                    Bắt đầu miễn phí
                  </Link>
                )}
                <Link to="/about" className="btn btn-secondary">
                  <span className="btn-icon">📚</span>
                  Tìm hiểu thêm
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <strong>50,000+</strong>
                  <span>Học viên</span>
                </div>
                <div className="stat">
                  <strong>95%</strong>
                  <span>Hài lòng</span>
                </div>
                <div className="stat">
                  <strong>4.9/5</strong>
                  <span>Đánh giá</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-card card-1">
                <div className="card-icon">📖</div>
                <div className="card-text">Bài học tương tác</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🎯</div>
                <div className="card-text">Lộ trình cá nhân</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">📊</div>
                <div className="card-text">Theo dõi tiến độ</div>
              </div>
              <div className="main-hero-image">
                <div className="image-placeholder">
                  <span className="emoji">🎓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title-home">Tại sao chọn EnglishMaster?</h2>
            <p className="section-subtitle">
              Chúng tôi mang đến giải pháp học tiếng Anh toàn diện với công nghệ hiện đại
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📚</div>
              </div>
              <h3>Nội dung đa dạng</h3>
              <p>Hàng nghìn bài học, bài tập và đề thi được cập nhật thường xuyên theo chuẩn quốc tế, phù hợp mọi trình độ.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎯</div>
              </div>
              <h3>Cá nhân hóa</h3>
              <p>AI phân tích trình độ và xây dựng lộ trình học tập tối ưu, tập trung vào kỹ năng bạn cần cải thiện nhất.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📊</div>
              </div>
              <h3>Theo dõi tiến độ</h3>
              <p>Hệ thống báo cáo chi tiết giúp bạn theo dõi sự tiến bộ và điều chỉnh phương pháp học hiệu quả.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">⚡</div>
              </div>
              <h3>Học mọi lúc</h3>
              <p>Truy cập mọi lúc, mọi nơi trên tất cả thiết bị. Học offline và đồng bộ tiến độ khi có kết nối.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">👨‍🏫</div>
              </div>
              <h3>Chuyên gia hướng dẫn</h3>
              <p>Đội ngũ giảng viên giàu kinh nghiệm, sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🏆</div>
              </div>
              <h3>Chứng nhận</h3>
              <p>Nhận chứng chỉ hoàn thành khóa học có giá trị, công nhận năng lực tiếng Anh của bạn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title-home">Khóa học nổi bật</h2>
            <p className="section-subtitle">
              Khám phá các khóa học được thiết kế bởi chuyên gia hàng đầu
            </p>
          </div>
          
          <div className="courses-grid">
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon">🎤</div>
                <span className="course-category">Giao tiếp</span>
              </div>
              <div className="course-content">
                <h3>T.Anh giao tiếp cơ bản</h3>
                <p>Làm chủ các tình huống giao tiếp hàng ngày với người bản xứ, tự tin trong mọi hoàn cảnh.</p>
                <div className="course-features">
                  <span>📝 50+ bài học</span>
                  <span>🎧 30+ audio</span>
                  <span>💬 Thực hành trực tiếp</span>
                </div>
              </div>
              <div className="course-footer">
                <div className="course-meta">
                  <span className="duration">⏱️ 30 giờ</span>
                  <span className="level">🟢 Cơ bản</span>
                </div>
          
              </div>
            </div>
            
            <div className="course-card featured">
              <div className="course-badge">Phổ biến</div>
              <div className="course-header">
                <div className="course-icon">✍️</div>
                <span className="course-category">Luyện thi</span>
              </div>
              <div className="course-content">
                <h3>IELTS Masterclass</h3>
                <p>Chiến lược và kỹ năng cần thiết để đạt điểm cao trong kỳ thi IELTS với phương pháp khoa học.</p>
                <div className="course-features">
                  <span>📝 200+ bài học</span>
                  <span>📊 10 đề thi thử</span>
                  <span>👨‍🏫 Chấm bài chi tiết</span>
                </div>
              </div>
              <div className="course-footer">
                <div className="course-meta">
                  <span className="duration">⏱️ 60 giờ</span>
                  <span className="level">🟡 Trung cấp</span>
                </div>
              </div>
            </div>
            
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon">💼</div>
                <span className="course-category">Chuyên ngành</span>
              </div>
              <div className="course-content">
                <h3>Tiếng Anh thương mại</h3>
                <p>Nâng cao kỹ năng giao tiếp trong môi trường công sở, đàm phán và thuyết trình chuyên nghiệp.</p>
                <div className="course-features">
                  <span>📝 80+ bài học</span>
                  <span>📈 Tình huống thực tế</span>
                  <span>💼 Business vocabulary</span>
                </div>
              </div>
              <div className="course-footer">
                <div className="course-meta">
                  <span className="duration">⏱️ 45 giờ</span>
                  <span className="level">🟡 Trung cấp</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section-cta">
            <Link to="/courses" className="btn btn-outline">
              <span>Xem tất cả khóa học</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid-home">
            <div className="stat-card">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Học viên tham gia</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">Học viên hài lòng</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">2,500+</div>
              <div className="stat-label">Bài học chất lượng</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Hỗ trợ học tập</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title-home">Học viên nói gì về chúng tôi</h2>
            <p className="section-subtitle">
              Những phản hồi chân thực từ cộng đồng học viên của EnglishMaster
            </p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">❝</div>
                <p className="testimonial-text">
                  "Tôi đã cải thiện đáng kể kỹ năng nghe và nói chỉ sau 3 tháng học. 
                  Phương pháp giảng dạy rất thú vị và dễ hiểu, đặc biệt là phần thực hành với AI."
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>👩‍🎓</span>
                </div>
                <div className="author-info">
                  <h4>Nguyễn Minh Anh</h4>
                  <p>Sinh viên ĐH Ngoại Thương</p>
                  <div className="author-rating">★★★★★</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">❝</div>
                <p className="testimonial-text">
                  "Khóa học IELTS tại EnglishMaster đã giúp tôi đạt được 7.5 điểm. 
                  Tôi đặc biệt ấn tượng với phần luyện nói và viết có chấm điểm chi tiết."
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>👨‍💼</span>
                </div>
                <div className="author-info">
                  <h4>Trần Quang Huy</h4>
                  <p>Nhân viên Marketing</p>
                  <div className="author-rating">★★★★★</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">❝</div>
                <p className="testimonial-text">
                  "Lộ trình học được cá nhân hóa đã giúp tôi tiết kiệm rất nhiều thời gian. 
                  Tôi tập trung vào đúng những kỹ năng cần cải thiện và thấy rõ sự tiến bộ."
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <span>👩‍🏫</span>
                </div>
                <div className="author-info">
                  <h4>Lê Thị Hương</h4>
                  <p>Giáo viên tiếng Anh</p>
                  <div className="author-rating">★★★★☆</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Sẵn sàng chinh phục tiếng Anh?</h2>
            <p>
              Tham gia cộng đồng 50,000+ học viên đã thành công với EnglishMaster. 
              Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt!
            </p>
            <div className="cta-buttons">
              {isAuthenticated ? (
                <Link to="/courses" className="btn btn-light">
                  <span className="btn-icon">🚀</span>
                  Tiếp tục học tập
                </Link>
              ) : (
                <Link to="/register" className="btn btn-light">
                  <span className="btn-icon">🎯</span>
                  Đăng ký miễn phí
                </Link>
              )}
              <Link to="/courses" className="btn btn-outline-light">
                <span className="btn-icon">📚</span>
                Khám phá khóa học
              </Link>
            </div>
            <div className="cta-features">
              <span>✅ Học thử miễn phí</span>
              <span>✅ Hoàn tiền trong 7 ngày</span>
              <span>✅ Hỗ trợ 24/7</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;