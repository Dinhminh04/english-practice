import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../components/Home";
import Login from "../components/Login";
import Register from "../components/Register";
import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import AuthSuccess from "../pages/AuthSuccess";
import Profile from "../components/Profile";
import Dashboard from "../components/admin/Dashboard";
import ExamManagement from "../components/admin/ExamManagement";
import GrammarManagement from "../components/admin/GrammarManagement";
import VocabularyManagement from "../components/admin/VocabularyManagement";
import UserManagement from "../components/admin/UserManagement";
import ExamList from "../components/exam/ExamList";
import ExamPreview from "../components/exam/ExamPreview";
import ExamResult from "../components/exam/ExamResult";
import ExamTaking from "../components/exam/ExamTaking";
import VocabularyCollections from "../components/vocabulary/VocabularyCollections";
import FlashcardStudy from "../components/vocabulary/FlashcardStudy";
import SelfTestQuiz from "../components/vocabulary/SelfTestQuiz";
import VocabularyPreview from "../components/vocabulary/VocabularyPreview";
import GrammarLearning from "../components/grammar/GrammarLearning";
import GrammarList from "../components/grammar/GrammarList";
import ProgressDashboard from "../components/ProgressDashboard";
import CourseList from "../components/course/CourseList";
import About from "../components/About";
import SpeakingPractice from "../components/speaking/SpeakingPractice";

function AppRoutes({
  isAuthenticated,
  userRole,
  userId,
  setAuth,
  setUserRole,
  setUserId,
  handleLogout,
}) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <Home
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            userId={userId}
          />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            userRole === "superadmin" || userRole === "admin" ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/" />
            )
          ) : (
            <Login
              setAuth={setAuth}
              setUserRole={setUserRole}
              setUserId={setUserId}
            />
          )
        }
      />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route
        path="/auth/success"
        element={
          <AuthSuccess
            setAuth={setAuth}
            setUserRole={setUserRole}
            setUserId={setUserId}
          />
        }
      />

      {/* Protected User Routes */}
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/progress-dashboard"
        element={
          isAuthenticated ? <ProgressDashboard /> : <Navigate to="/login" />
        }
      />

      {/* Exam Routes */}
      <Route
        path="/exams"
        element={
          isAuthenticated ? (
            <ExamList isAuthenticated={isAuthenticated} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/exams/:id/take"
        element={isAuthenticated ? <ExamTaking /> : <Navigate to="/login" />}
      />
      <Route
        path="/exams/result/:resultId"
        element={isAuthenticated ? <ExamResult /> : <Navigate to="/login" />}
      />
      <Route
        path="/exams/:id/preview"
        element={isAuthenticated ? <ExamPreview /> : <Navigate to="/login" />}
      />

      <Route
        path="/vocabulary-collections"
        element={
          isAuthenticated ? (
            <VocabularyCollections isAuthenticated={isAuthenticated} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/vocabulary-collections/:collectionId/study"
        element={
          isAuthenticated ? (
            <FlashcardStudy isAuthenticated={isAuthenticated} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/vocabulary-collections/:collectionId/self-test"
        element={isAuthenticated ? <SelfTestQuiz /> : <Navigate to="/login" />}
      />
      <Route
        path="/vocabulary-collections/:collectionId/preview"
        element={isAuthenticated ? <VocabularyPreview /> : <Navigate to="/login" />}
      />

      <Route
        path="/grammar"
        element={isAuthenticated ? <GrammarList /> : <Navigate to="/login" />}
      />
      <Route
        path="/grammar/learn/:lessonId"
        element={
          isAuthenticated ? <GrammarLearning /> : <Navigate to="/login" />
        }
      />

      <Route
        path="/courses"
        element={isAuthenticated ? <CourseList /> : <Navigate to="/login" />}
      />

      <Route
        path="/speaking-practice"
        element={
          isAuthenticated ? <SpeakingPractice /> : <Navigate to="/login" />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated &&
          (userRole === "superadmin" || userRole === "admin") ? (
            <Dashboard handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/exam-management"
        element={
          isAuthenticated &&
          (userRole === "superadmin" || userRole === "admin") ? (
            <ExamManagement handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/grammar-management"
        element={
          isAuthenticated &&
          (userRole === "superadmin" || userRole === "admin") ? (
            <GrammarManagement handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/vocabulary-management"
        element={
          isAuthenticated &&
          (userRole === "superadmin" || userRole === "admin") ? (
            <VocabularyManagement handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/user-management"
        element={
          isAuthenticated &&
          (userRole === "superadmin" || userRole === "admin") ? (
            <UserManagement handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      {/* Catch all route */}
      <Route path="/about" element={<About />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
