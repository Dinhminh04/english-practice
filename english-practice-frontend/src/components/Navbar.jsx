import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./assets/css/navbar.css";

const Navbar = ({ isAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Lấy thông tin người dùng khi component được mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/user/profile",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // Các mục điều hướng
  const navItems = [
    { path: "/", label: "Trang chủ", icon: "🏠" },
    { path: "/vocabulary-collections", label: "Từ vựng", icon: "📖" },
    { path: "/grammar", label: "Ngữ pháp", icon: "🔤" },
    { path: "/exams", label: "Luyện thi", icon: "✍️" },
    { path: "/courses", label: "Khóa học", icon: "📚" },
    { path: "/about", label: "Về chúng tôi", icon: "👥" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link
          className="nav-logo"
          to="/"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="logo-icon">🎯</div>
          <div className="logo-text">
            <span className="logo-primary">English</span>
            <span className="logo-secondary">Master</span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <div className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          {navItems.map((item, idx) => (
            <div className="nav-item" key={idx}>
              <NavLink
                end={item.path === "/"}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-underline"></span>
              </NavLink>
            </div>
          ))}
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="user-dropdown dropdown">
              <button
                className="user-trigger dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`}
                      alt={user.display_name}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.display_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <span className="user-name">
                  {user ? user.display_name : "Người dùng"}
                </span>
                {/* <span className="dropdown-arrow">
                  ▼
                </span> */}
              </button>

              <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-avatar small">
                        {user?.avatar ? (
                          <img
                            src={user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`}
                            alt={user.display_name}
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.display_name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="user-display-name">
                          {user?.display_name || "Người dùng"}
                        </div>
                        <div className="user-email">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                  >
                    <span className="item-icon">👤</span>
                    <span className="item-text">Hồ sơ cá nhân</span>
                  </Link>
                  <Link 
                    to="/progress-dashboard" 
                    className="dropdown-item"
                  >
                    <span className="item-icon">📊</span>
                    <span className="item-text">Theo dõi tiến độ</span>
                  </Link>
                  
                  <Link 
                    to="/speaking-practice" 
                    className="dropdown-item"
                  >
                    <span className="item-icon">🎙</span>
                    <span className="item-text">Luyện nói với AI</span>
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <span className="item-icon">🚪</span>
                    <span className="item-text">Đăng xuất</span>
                  </button>
                </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link 
                to="/login" 
                className="btn-login"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="btn-register"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={`hamburger ${isMenuOpen ? "active" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;