import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./assets/css/profile.css"; // Thêm file CSS riêng

const Profile = () => {
  // Trạng thái người dùng
  const [user, setUser] = useState({
    display_name: "",
    email: "",
    phone: "",
    avatar: "",
    learning_goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [changePw, setChangePw] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [learningHistory, setLearningHistory] = useState({
    examHistory: [],
    grammarHistory: [],
    vocabularyHistory: [],
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch lịch sử học tập khi chuyển sang tab Lịch sử
  useEffect(() => {
    if (activeTab === "history") {
      fetchLearningHistory();
    }
  }, [activeTab]);

  // Lấy thông tin người dùng
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/user/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Đảm bảo không bị lỗi khi response.data là undefined
      const data = response.data || {};
      setUser({
        display_name: data.display_name || "",
        email: data.email || "",
        phone: data.phone || "",
        avatar: data.avatar || "",
        learning_goal: data.learning_goal || "",
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Không thể tải thông tin người dùng");
    }
  };

  //  Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // Xử lý thay đổi file ảnh
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    // Xem trước ảnh ngay
    if (e.target.files[0]) {
      const previewURL = URL.createObjectURL(e.target.files[0]);
      setUser({ ...user, avatar: previewURL });
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("display_name", user.display_name);
      formData.append("phone", user.phone);
      formData.append("learning_goal", user.learning_goal);

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const response = await axios.put(
        "http://localhost:5000/api/user/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Cập nhật thông tin thành công!");
      setSelectedFile(null);

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thông tin thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi mật khẩu
  const handlePwChange = (e) => {
    setChangePw({ ...changePw, [e.target.name]: e.target.value });
  };

  // Xử lý submit đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePw.newPassword !== changePw.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/user/change-password",
        {
          oldPassword: changePw.oldPassword,
          newPassword: changePw.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Đổi mật khẩu thành công!");
      setChangePw({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
    }
  };

  // Lấy lịch sử học tập
  const fetchLearningHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/user/learning-history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLearningHistory({
        examHistory: [],
        grammarHistory: [],
        vocabularyHistory: [],
        ...response.data,
      });
    } catch (error) {
      console.error("Error fetching learning history:", error);
      toast.error("Không thể tải lịch sử học tập");
    }
  };

  // Render lịch sử học tập
  const renderLearningHistory = () => (
    <div className="history-container">
      <h3 className="section-title">Lịch sử học tập</h3>
      
      <div className="history-section">
        <h4 className="history-section-title">
          <span className="icon">📝</span>
          Lịch sử làm bài thi
        </h4>
        {learningHistory.examHistory.length > 0 ? (
          <div className="history-list">
            {learningHistory.examHistory.map((item) => (
              <div key={item.result_id} className="history-item">
                <div className="history-item-main">
                  <strong className="history-item-title">{item.exam_title}</strong>
                  <span className="history-item-score">Điểm: {item.score}</span>
                </div>
                <div className="history-item-date">
                  {new Date(item.submitted_at).toLocaleDateString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Chưa có lịch sử làm bài thi.</p>
          </div>
        )}
      </div>
      
      <div className="history-section">
        <h4 className="history-section-title">
          <span className="icon">📚</span>
          Lịch sử học ngữ pháp
        </h4>
        {learningHistory.grammarHistory.length > 0 ? (
          <div className="history-list">
            {learningHistory.grammarHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-main">
                  <strong className="history-item-title">{item.title}</strong>
                </div>
                <div className="history-item-date">
                  {new Date(item.completed_at).toLocaleDateString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Chưa có lịch sử học ngữ pháp.</p>
          </div>
        )}
      </div>
      
      <div className="history-section">
        <h4 className="history-section-title">
          <span className="icon">🔤</span>
          Lịch sử học từ vựng
        </h4>
        {learningHistory.vocabularyHistory.length > 0 ? (
          <div className="history-list">
            {learningHistory.vocabularyHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-main">
                  <strong className="history-item-title">{item.collection_title}</strong>
                </div>
                <div className="history-item-date">
                  {new Date(item.last_reviewed_at).toLocaleDateString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Chưa có lịch sử học từ vựng.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">Hồ sơ cá nhân</h2>
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab("profile")}
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          >
            <span className="tab-icon">👤</span>
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          >
            <span className="tab-icon">📊</span>
            Lịch sử học tập
          </button>
        </div>
      </div>

      <div className="profile-content">
        {activeTab === "profile" ? (
          <div className="profile-form-container">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="avatar-section">
                <label className="form-label">Ảnh đại diện</label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="avatar-container"
                >
                  {user.avatar ? (
                    <img
                      src={
                        user.avatar.startsWith("blob:")
                          ? user.avatar
                          : `http://localhost:5000${user.avatar}`
                      }
                      alt="Avatar"
                      className="avatar"
                    />
                  ) : (
                    <div className="no-avatar">
                      <span className="avatar-placeholder">👤</span>
                    </div>
                  )}
                  <div className="edit-avatar-overlay">
                    <span className="edit-avatar-icon">📷</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="file-input"
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  name="display_name"
                  value={user.display_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  disabled
                  className="form-input disabled"
                />
                <small className="form-hint">Email không thể thay đổi</small>
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={user.phone || ""}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mục tiêu học tập</label>
                <input
                  type="text"
                  name="learning_goal"
                  value={user.learning_goal || ""}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ví dụ: IELTS 7.0"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Đang xử lý...
                  </>
                ) : (
                  "Cập nhật thông tin"
                )}
              </button>
            </form>

            <div className="password-section">
              <h3 className="section-title">Đổi mật khẩu</h3>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <input
                    type="password"
                    name="oldPassword"
                    placeholder="Mật khẩu hiện tại"
                    value={changePw.oldPassword}
                    onChange={handlePwChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="Mật khẩu mới"
                    value={changePw.newPassword}
                    onChange={handlePwChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu mới"
                    value={changePw.confirmPassword}
                    onChange={handlePwChange}
                    className="form-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="submit-button secondary"
                >
                  {pwLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          renderLearningHistory()
        )}
      </div>
    </div>
  );
};

export default Profile;