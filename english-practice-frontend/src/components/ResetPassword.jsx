import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./assets/css/resetpassword.css";
const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Lấy token từ URL
  const getTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("token");
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Kiểm tra mật khẩu
    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp!");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      setIsLoading(false);
      return;
    }

    const token = getTokenFromURL();

    if (!token) {
      setMessage("Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập bằng mật khẩu mới."
        );
        setSuccess(true);
        toast.success("Đặt lại mật khẩu thành công!");
      } else {
        setMessage(data.message || "Có lỗi xảy ra khi đặt lại mật khẩu.");
        toast.error(data.message || "Có lỗi xảy ra khi đặt lại mật khẩu.");
      }
    } catch (error) {
      setMessage("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
      toast.error("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu không có token, hiển thị thông báo lỗi
  if (!getTokenFromURL()) {
    return (
      <div className="min-vh-100 bg-gradient-primary d-flex align-items-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-5 col-lg-6 col-md-8">
              <div className="card shadow-lg border-0 rounded-lg">
                <div className="card-header bg-transparent pb-4 text-center">
                  <Link to="/" className="text-decoration-none">
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <i className="fas fa-graduation-cap text-primary fs-1 me-3"></i>
                      <h2 className="text-primary fw-bold mb-0">
                        English Master
                      </h2>
                    </div>
                  </Link>
                  <h4 className="text-dark fw-bold">Liên kết không hợp lệ</h4>
                </div>

                <div className="card-body p-4 p-sm-5 text-center">
                  <div className="error-icon mb-4">
                    <div
                      className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <i className="fas fa-exclamation-triangle text-danger fs-1"></i>
                    </div>
                  </div>

                  <h5 className="text-danger mb-3">Token không hợp lệ</h5>
                  <p className="text-muted mb-4">
                    Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui
                    lòng yêu cầu liên kết mới từ trang quên mật khẩu.
                  </p>

                  <div className="d-grid gap-2">
                    <Link to="/forgot-password" className="btn btn-primary">
                      <i className="fas fa-redo me-2"></i>
                      Yêu cầu liên kết mới
                    </Link>
                    <Link to="/login" className="btn btn-outline-primary">
                      <i className="fas fa-arrow-left me-2"></i>
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-gradient-primary d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-lg-6 col-md-8">
            <div className="card shadow-lg border-0 rounded-lg">
              {/* Header */}
              <div className="card-header bg-transparent pb-4 text-center">
                <div className="row">
                  <div className="col-12">
                    <Link to="/" className="text-decoration-none">
                      <div className="d-flex align-items-center justify-content-center mb-3">
                        <i className="fas fa-graduation-cap text-primary fs-1 me-3"></i>
                        <h2 className="text-primary fw-bold mb-0">
                          English Master
                        </h2>
                      </div>
                    </Link>
                  </div>
                  <div className="col-12">
                    {" "}
                    <h4 className="text-dark fw-bold">
                      Bắt đầu hành trình học tập
                    </h4>
                  </div>
                  <div className="col-12">
                    <p className="text-muted mb-0">
                      Tạo tài khoản để khám phá thế giới tiếng Anh
                    </p>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="card-body p-4 p-sm-5">
                {success ? (
                  /* Success State */
                  <div className="text-center py-4">
                    <div className="success-icon mb-4">
                      <div
                        className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <i className="fas fa-check-circle text-white fs-1"></i>
                      </div>
                    </div>

                    <h5 className="text-success mb-3">Thành công!</h5>
                    <p className="text-muted mb-4">
                      Mật khẩu của bạn đã được thay đổi thành công. Bây giờ bạn
                      có thể đăng nhập bằng mật khẩu mới.
                    </p>

                    <div className="alert alert-info text-start mb-4">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-info-circle text-info me-2 mt-1"></i>
                        <div>
                          <small className="fw-bold">Lưu ý bảo mật:</small>
                          <ul className="mb-0 ps-3 mt-1">
                            <li>
                              <small>
                                Không chia sẻ mật khẩu với người khác
                              </small>
                            </li>
                            <li>
                              <small>
                                Sử dụng mật khẩu mạnh kết hợp chữ và số
                              </small>
                            </li>
                            <li>
                              <small>
                                Đăng xuất trên các thiết bị công cộng
                              </small>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Link to="/login" className="btn btn-primary btn-lg">
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Đăng nhập ngay
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Form State */
                  <>
                    <form
                      onSubmit={handleSubmit}
                      className="needs-validation"
                      noValidate
                    >
                      {/* New Password */}
                      <div className="mb-4">
                        <label
                          htmlFor="password"
                          className="form-label text-dark fw-medium"
                        >
                          <i className="fas fa-lock me-2 text-primary"></i>
                          Mật khẩu mới
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-key text-muted"></i>
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control border-start-0 pe-5"
                            id="password"
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-3 border-0 bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ zIndex: 5 }}
                          >
                            <i
                              className={`fas ${
                                showPassword ? "fa-eye-slash" : "fa-eye"
                              }`}
                            ></i>
                          </button>
                        </div>
                        <small className="text-muted">
                          Mật khẩu phải có ít nhất 6 ký tự
                        </small>
                      </div>

                      {/* Confirm Password */}
                      <div className="mb-4">
                        <label
                          htmlFor="confirmPassword"
                          className="form-label text-dark fw-medium"
                        >
                          <i className="fas fa-lock me-2 text-primary"></i>
                          Xác nhận mật khẩu
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-key text-muted"></i>
                          </span>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control border-start-0 pe-5"
                            id="confirmPassword"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-3 border-0 bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={{ zIndex: 5 }}
                          >
                            <i
                              className={`fas ${
                                showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                              }`}
                            ></i>
                          </button>
                        </div>
                      </div>

                      {/* Password Strength Indicator */}
                      {password && (
                        <div className="mb-4">
                          <div className="d-flex justify-content-between mb-1">
                            <small className="text-muted">
                              Độ mạnh mật khẩu:
                            </small>
                            <small
                              className={`fw-medium ${
                                password.length >= 8
                                  ? "text-success"
                                  : password.length >= 6
                                  ? "text-warning"
                                  : "text-danger"
                              }`}
                            >
                              {password.length >= 8
                                ? "Mạnh"
                                : password.length >= 6
                                ? "Trung bình"
                                : "Yếu"}
                            </small>
                          </div>
                          <div className="progress" style={{ height: "4px" }}>
                            <div
                              className={`progress-bar ${
                                password.length >= 8
                                  ? "bg-success"
                                  : password.length >= 6
                                  ? "bg-warning"
                                  : "bg-danger"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (password.length / 8) * 100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {message && (
                        <div className="alert alert-danger d-flex align-items-center mb-4">
                          <i className="fas fa-exclamation-circle me-2"></i>
                          <small className="mb-0">{message}</small>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 py-2 mb-3"
                        disabled={isLoading || !password || !confirmPassword}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Đặt lại mật khẩu
                          </>
                        )}
                      </button>
                    </form>

                    {/* Additional Links */}
                    <div className="text-center">
                      <div className="d-flex justify-content-center gap-4">
                        <Link
                          to="/login"
                          className="text-decoration-none text-primary fw-medium"
                        >
                          <i className="fas fa-arrow-left me-1"></i>
                          Quay lại đăng nhập
                        </Link>
                        <Link
                          to="/forgot-password"
                          className="text-decoration-none text-primary fw-medium"
                        >
                          <i className="fas fa-question-circle me-1"></i>
                          Gửi lại liên kết
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ zIndex: -1 }}
      >
        <div className="position-absolute top-0 end-0 w-50 h-50 bg-info bg-opacity-10 rounded-circle blur-3"></div>
        <div className="position-absolute bottom-0 start-0 w-50 h-50 bg-success bg-opacity-10 rounded-circle blur-3"></div>
      </div>
    </div>
  );
};

export default ResetPassword;
