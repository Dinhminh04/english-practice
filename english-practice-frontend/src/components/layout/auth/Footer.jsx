// Footer.jsx
import React from "react";
import { Link } from 'react-router-dom';
import '../assets/css/style.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>EnglishMaster</h3>
            <p>Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam, cung cấp giải pháp học tập toàn diện và hiệu quả.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
            </div>
          </div>
          
          <div className="footer-col">
            <h3>Về chúng tôi</h3>
            <ul>
              <li><Link to="/about">Giới thiệu</Link></li>
              <li><Link to="/teachers">Đội ngũ giảng viên</Link></li>
              <li><Link to="/method">Phương pháp giảng dạy</Link></li>
              <li><Link to="/achievements">Thành tựu</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Khóa học</h3>
            <ul>
              <li><Link to="/courses?category=communication">Tiếng Anh giao tiếp</Link></li>
              <li><Link to="/courses?category=ielts">Luyện thi IELTS</Link></li>
              <li><Link to="/courses?category=business">Tiếng Anh thương mại</Link></li>
              <li><Link to="/courses?category=kids">Tiếng Anh cho trẻ em</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
              <li><Link to="/contact">Liên hệ</Link></li>
              <li><Link to="/privacy">Chính sách bảo mật</Link></li>
              <li><Link to="/terms">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; 2023 EnglishMaster. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
