import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/img/logo/logo.png";
import avatar from "../../assets/img/profile.jpg";

const Header = ({ toggleSidebar, toggleSidebarOpen, handleLogout, user }) => {
  const defaultAvatar = avatar;

  return (
    <div className="main-header">
      <div className="main-header-logo">
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
              className="btn btn-toggle toggle-sidebar"
              onClick={toggleSidebar}
            >
              <i className="gg-menu-right"></i>
            </button>
            <button
              className="btn btn-toggle sidenav-toggler"
              onClick={toggleSidebarOpen}
            >
              <i className="gg-menu-left"></i>
            </button>
          </div>
        </div>
      </div>
      <nav className="navbar navbar-header navbar-header-transparent navbar-expand-lg border-bottom">
        <div className="container">
          <nav className="navbar navbar-header-left navbar-expand-lg navbar-form nav-search p-0 d-none d-lg-flex">
            <div className="input-group"></div>
          </nav>
          <ul className="navbar-nav topbar-nav ms-md-auto align-items-center">
            <li className="nav-item topbar-user dropdown hidden-caret">
              <Link
                className="dropdown-toggle profile-pic"
                data-bs-toggle="dropdown"
                to={"#"}
                aria-expanded="false"
              >
                <div className="avatar-sm">
                  <img
                    src={
                      user && user.avatar
                        ? `http://localhost:5000${user.avatar}`
                        : defaultAvatar
                    }
                    alt="..."
                    className="avatar-img rounded-circle"
                  />
                </div>
                <span className="profile-username d-flex flex-column text-start">
                  <span className="op-7">Xin chào,</span>
                  <span
                    className="fw-bold text-truncate"
                    style={{ maxWidth: "150px" }}
                  >
                    {user ? user.display_name : "User"}
                  </span>
                </span>
              </Link>
              <ul className="dropdown-menu dropdown-user animated fadeIn">
                <div className="dropdown-user-scroll scrollbar-outer">
                  <li>
                    <div className="user-box">
                      <div className="avatar-lg">
                        <img
                          src={
                            user && user.avatar
                              ? `http://localhost:5000${user.avatar}`
                              : defaultAvatar
                          }
                          alt="image profile"
                          className="avatar-img rounded"
                        />
                      </div>
                      <div className="u-text">
                        <h4>{user ? user.display_name : "User"}</h4>
                        <p className="text-muted">
                          {user ? user.email : "user@example.com"}
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="dropdown-divider"></div>
                    <Link
                      className="dropdown-item"
                      to={"#"}
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </Link>
                  </li>
                </div>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Header;
