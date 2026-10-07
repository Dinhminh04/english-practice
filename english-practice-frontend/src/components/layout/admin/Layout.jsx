import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import axios from "axios";

const Layout = ({ children, handleLogout }) => {
  const [isSidebarMinimized, setSidebarMinimized] = useState(false);
  const [isSidebarOpened, setSidebarOpened] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const toggleSidebarMinimize = () => {
    setSidebarMinimized(!isSidebarMinimized);
  };

  const toggleSidebarOpen = () => {
    setSidebarOpened(!isSidebarOpened);
  };

  // Đóng sidebar khi chuyển route (trên mobile)
  const closeSidebar = () => {
    if (window.innerWidth < 992) {
      setSidebarOpened(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/user/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpened(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`wrapper ${isSidebarMinimized ? "sidebar_minimize" : ""} ${
        isSidebarOpened ? "nav_open" : ""
      }`}
    >
      <Sidebar
        toggleSidebar={toggleSidebarMinimize}
        toggleSidebarOpen={toggleSidebarOpen}
        handleLogout={handleLogout}
        closeSidebar={closeSidebar} // Thêm prop mới
      />
      <div className="main-panel">
        <Header
          toggleSidebar={toggleSidebarMinimize}
          toggleSidebarOpen={toggleSidebarOpen}
          handleLogout={handleLogout}
          user={user}
          isSidebarOpened={isSidebarOpened}
        />
        <div className="container">{children}</div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;