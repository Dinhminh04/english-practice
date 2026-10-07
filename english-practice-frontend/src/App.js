import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./components/styles/global.js";
import './App.css';

// Import jQuery và khởi tạo
import './components/styles/jquery-init.js';

import Navbar from "./components/Navbar";
import Footer from "./components/layout/Footer";

import AppRoutes from "./routers/AppRoutes";
import BackToTop from "./components/BackToTop";
import ChatAI from "./components/ChatAI";
import "@fortawesome/fontawesome-free/css/all.min.css";

function AppContent({
  isAuthenticated,
  userRole,
  userId,
  handleLogout: originalHandleLogout,
  setAuth,
  setUserRole,
  setUserId,
  isLoading,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    originalHandleLogout();
    navigate("/login");
  };

  // Các route không hiển thị navbar
  const hideNavbarPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard",
    "/exam-management",
    "/grammar-management",
    "/vocabulary-management",
    "/user-management",
  ];

  // Khởi tạo các plugin jQuery sau khi component mount
  useEffect(() => {
    // Đảm bảo DOM đã sẵn sàng
    if (typeof window !== 'undefined' && window.$) {
      // Khởi tạo lại các plugin nếu cần
      try {
        // Gọi các hàm khởi tạo từ kaiadmin.js nếu cần
        if (window.initKaiAdmin) {
          window.initKaiAdmin();
        }
      } catch (error) {
        console.warn('Lỗi khởi tạo plugin:', error);
      }
    }
  }, [location.pathname]);

  // Hiển thị loading trong khi kiểm tra auth
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && (
        <Navbar
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          onLogout={handleLogout}
        />
      )}

      <AppRoutes
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        userId={userId}
        setAuth={setAuth}
        setUserRole={setUserRole}
        setUserId={setUserId}
        handleLogout={handleLogout}
      />
      {!hideNavbarPaths.includes(location.pathname) && <Footer />}
      <BackToTop />
      {!hideNavbarPaths.includes(location.pathname) && <ChatAI />}
    </>
  );
}

function App() {
  const [isAuthenticated, setAuth] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncAuthState = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");
    setAuth(!!token);
    setUserRole(role);
    setUserId(id);
    setIsLoading(false);
  };

  useEffect(() => {
    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    setAuth(false);
    setUserRole(null);
    setUserId(null);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Router>
        <AppContent
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          userId={userId}
          handleLogout={handleLogout}
          setAuth={setAuth}
          setUserRole={setUserRole}
          setUserId={setUserId}
          isLoading={isLoading}
        />
      </Router>
    </>
  );
}

export default App;