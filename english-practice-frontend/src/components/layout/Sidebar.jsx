import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/img/logo/logo.png";

const Sidebar = ({
  toggleSidebar,
  toggleSidebarOpen,
  handleLogout,
  closeSidebar,
}) => {
  const location = useLocation();

  // Đóng sidebar khi click vào menu item (trên mobile)
  const handleMenuItemClick = () => {
    if (window.innerWidth < 992) {
      closeSidebar(); // Sử dụng hàm closeSidebar từ prop
    }
  };

  // Đóng sidebar khi click overlay
  const handleOverlayClick = () => {
    if (window.innerWidth < 992) {
      closeSidebar();
    }
  };

  return (
    <>
      <div className="sidebar" data-background-color="dark">
        <div className="sidebar-logo">
          <div className="logo-header" data-background-color="dark">
            <a href="index.html" className="logo">
              <img
                src={logo}
                alt="navbar brand"
                className="navbar-brand"
                height="50"
              />
            </a>
            <div className="nav-toggle">
              <button
                className="btn btn-toggle toggle-sidebar d-none d-lg-block"
                onClick={toggleSidebar}
              >
                <i className="fa-solid fa-bars-staggered"></i>
              </button>

              <button
                className="btn btn-toggle sidenav-toggler d-lg-none"
                onClick={toggleSidebarOpen}
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="sidebar-wrapper scrollbar scrollbar-inner">
          <div className="sidebar-content">
            <ul className="nav nav-secondary">
              <li
                className={`nav-item ${
                  location.pathname === "/dashboard" ? "active" : ""
                }`}
              >
                <Link
                  to={"/dashboard"}
                  className="collapsed"
                  onClick={handleMenuItemClick}
                >
                  <i className="fas fa-home"></i>
                  <p>Bảng điều khiển</p>
                </Link>
                <div className="collapse" id="dashboard">
                  <ul className="nav nav-collapse"></ul>
                </div>
              </li>
              <li className="nav-section">
                <span className="sidebar-mini-icon">
                  <i className="fa fa-ellipsis-h"></i>
                </span>
                <h4 className="text-section">Thành phần</h4>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === "/exam-management" ? "active" : ""
                }`}
              >
                <Link to={"/exam-management"} onClick={handleMenuItemClick}>
                  <i className="fas fa-layer-group"></i>
                  <p>Quản lý đề thi IELTS</p>
                </Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === "/grammar-management" ? "active" : ""
                }`}
              >
                <Link to={"/grammar-management"} onClick={handleMenuItemClick}>
                  <i className="fa-solid fa-barcode"></i>
                  <p>Quản lý ngữ pháp</p>
                </Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === "/vocabulary-management" ? "active" : ""
                }`}
              >
                <Link
                  to={"/vocabulary-management"}
                  onClick={handleMenuItemClick}
                >
                  <i className="fa-solid fa-gears"></i>
                  <p>Quản lý từ vựng</p>
                </Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === "/user-management" ? "active" : ""
                }`}
              >
                <Link to={"/user-management"} onClick={handleMenuItemClick}>
                  <i className="fa-solid fa-chart-simple"></i>
                  <p>Quản lý người dùng</p>
                </Link>
              </li>
              {/* <li
                className={`nav-item ${
                  location.pathname === "/speaking-practice" ? "active" : ""
                }`}
              >
                <Link to={"/speaking-practice"} onClick={handleMenuItemClick}>
                  <i className="fa-solid fa-microphone-lines"></i>
                  <p>Luyện nói AI</p>
                </Link>
              </li> */}
              <li className="nav-section">
                <span className="sidebar-mini-icon">
                  <i className="fa fa-ellipsis-h"></i>
                </span>
                <h4 className="text-section">Thao tác</h4>
              </li>
              <li className="nav-item">
                <Link to="#" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  <p>Đăng xuất</p>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Overlay cho mobile/tablet */}
      {window.innerWidth < 992 && (
        <div
          className="sidebar-overlay"
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "none",
          }}
        />
      )}

      {/* Thêm CSS inline để hiển thị overlay khi sidebar mở */}
      <style jsx>{`
        .nav_open .sidebar-overlay {
          display: block !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
