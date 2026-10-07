// Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
        </svg>
      </div>
      
      <div className="container">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <Link to="/" className="brand-logo">
                <span className="logo-icon">🎯</span>
                <span className="logo-text">
                  English<span className="logo-highlight">Master</span>
                </span>
              </Link>
              <p className="brand-description">
                Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam, 
                cung cấp giải pháp học tập toàn diện và hiệu quả cho mọi trình độ.
              </p>
              <div className="newsletter">
                <h4>Đăng ký nhận tin</h4>
                <div className="newsletter-form">
                  <input 
                    type="email" 
                    placeholder="Nhập email của bạn..." 
                    className="newsletter-input"
                  />
                  <button className="newsletter-btn">
                    <span className="btn-text">Đăng ký</span>
                    <span className="btn-icon">✉️</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-column">
                <h3 className="column-title">
                  <span className="title-icon">🏢</span>
                  Về chúng tôi
                </h3>
                <ul className="footer-links">
                  <li><Link to="/about" className="footer-link">Giới thiệu</Link></li>
                  <li><Link to="/teachers" className="footer-link">Đội ngũ giảng viên</Link></li>
                  <li><Link to="/method" className="footer-link">Phương pháp giảng dạy</Link></li>
                  <li><Link to="/achievements" className="footer-link">Thành tựu</Link></li>
                  <li><Link to="/careers" className="footer-link">Tuyển dụng</Link></li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="column-title">
                  <span className="title-icon">📚</span>
                  Khóa học
                </h3>
                <ul className="footer-links">
                  <li><Link to="/courses?category=communication" className="footer-link">Tiếng Anh giao tiếp</Link></li>
                  <li><Link to="/courses?category=ielts" className="footer-link">Luyện thi IELTS</Link></li>
                  <li><Link to="/courses?category=business" className="footer-link">Tiếng Anh thương mại</Link></li>
                  <li><Link to="/courses?category=kids" className="footer-link">Tiếng Anh trẻ em</Link></li>
                  <li><Link to="/courses?category=toeic" className="footer-link">Luyện thi TOEIC</Link></li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="column-title">
                  <span className="title-icon">🔧</span>
                  Hỗ trợ
                </h3>
                <ul className="footer-links">
                  <li><Link to="/faq" className="footer-link">Câu hỏi thường gặp</Link></li>
                  <li><Link to="/contact" className="footer-link">Liên hệ hỗ trợ</Link></li>
                  <li><Link to="/privacy" className="footer-link">Chính sách bảo mật</Link></li>
                  <li><Link to="/terms" className="footer-link">Điều khoản sử dụng</Link></li>
                  <li><Link to="/refund" className="footer-link">Chính sách hoàn tiền</Link></li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="column-title">
                  <span className="title-icon">📞</span>
                  Liên hệ
                </h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div>
                      <div className="contact-label">Email</div>
                      <div className="contact-value">support@englishmaster.com</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    <div>
                      <div className="contact-label">Hotline</div>
                      <div className="contact-value">1900 1234</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <div>
                      <div className="contact-label">Địa chỉ</div>
                      <div className="contact-value">123 Nguyễn Văn Linh, Q.7, TP.HCM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <span className="social-icon">📘</span>
                  <span className="social-text">Facebook</span>
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  <span className="social-icon">📺</span>
                  <span className="social-text">YouTube</span>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <span className="social-icon">📷</span>
                  <span className="social-text">Instagram</span>
                </a>
                <a href="#" className="social-link" aria-label="TikTok">
                  <span className="social-icon">🎵</span>
                  <span className="social-text">TikTok</span>
                </a>
                <a href="#" className="social-link" aria-label="Zalo">
                  <span className="social-icon">💬</span>
                  <span className="social-text">Zalo</span>
                </a>
              </div>

              <div className="footer-legal">
                <div className="payment-methods">
                  <span className="payment-text">Chấp nhận thanh toán:</span>
                  <div className="payment-icons">
                    <span className="payment-icon">💳</span>
                    <span className="payment-icon">🏦</span>
                    <span className="payment-icon">📱</span>
                    <span className="payment-icon">🔗</span>
                  </div>
                </div>
                
                <div className="copyright">
                  <p>&copy; 2025 <strong>EnglishMaster</strong>. Tất cả các quyền được bảo lưu.</p>
                  <div className="legal-links">
                    <Link to="/privacy">Bảo mật</Link>
                    <span className="divider">•</span>
                    <Link to="/terms">Điều khoản</Link>
                    <span className="divider">•</span>
                    <Link to="/sitemap">Sitemap</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;