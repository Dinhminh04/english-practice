import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import "./assets/css/login.css";

const Login = ({ setAuth, setUserRole, setUserId }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  // Xử lý thay đổi input
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Xử lý đăng nhập thành công
  const handleLoginSuccess = useCallback(
    (token, role, id) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", id);

      setAuth(true);
      setUserRole(role);
      if (typeof setUserId === "function") setUserId(id);

      toast.success("Đăng nhập thành công!");

      if (role === "superadmin" || role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    },
    [navigate, setAuth, setUserRole, setUserId]
  );

  // Xử lý submit form
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      handleLoginSuccess(res.data.token, res.data.user.role, res.data.user.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng nhập với Google
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  // Xử lý đăng nhập với Facebook
  const handleFacebookLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/facebook";
  };

  // Kiểm tra token trong URL khi component được mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const role = urlParams.get("role");
    const id = urlParams.get("id");

    if (token && role && id) {
      handleLoginSuccess(token, role, id);
    }
  }, [handleLoginSuccess]);

  return (
    <div className="min-vh-100 bg-gradient-primary d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-lg-6 col-md-8">
            <div className="card shadow-lg border-0 rounded-lg">
              {/* Header */}
              <div className="card-header bg-transparent pb-4 text-center">
                <div className="row">
                  <div className="col-12">
                    {" "}
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
                    <h4 className="text-dark fw-bold">Chào mừng trở lại!</h4>
                  </div>
                  <div className="col-12">
                    <p className="text-muted mb-0">
                      Đăng nhập để tiếp tục học tập
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="card-body p-4 p-sm-5">
                <form
                  onSubmit={onSubmit}
                  className="needs-validation"
                  noValidate
                >
                  {/* Email Input */}
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label text-dark fw-medium"
                    >
                      <i className="fas fa-envelope me-2 text-primary"></i>
                      Email
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-user text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0"
                        id="email"
                        name="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={onChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="form-label text-dark fw-medium"
                    >
                      <i className="fas fa-lock me-2 text-primary"></i>
                      Mật khẩu
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-key text-muted"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control border-start-0 pe-5"
                        id="password"
                        name="password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={onChange}
                        required
                        disabled={loading}
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
                  </div>

                  {/* Remember & Forgot Password */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                      />
                      <label
                        className="form-check-label text-muted small"
                        htmlFor="rememberMe"
                      >
                        Ghi nhớ đăng nhập
                      </label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-decoration-none small text-primary fw-medium"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 py-2 mb-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Đăng nhập
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="position-relative text-center mb-4">
                  <hr className="text-muted" />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                    Hoặc đăng nhập với
                  </span>
                </div>

                {/* Social Login Buttons */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <button
                      onClick={handleGoogleLogin}
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center py-2"
                      disabled={loading}
                    >
                      <i className="fab fa-google me-2"></i>
                      <span>Google</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      onClick={handleFacebookLogin}
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center py-2"
                      disabled={loading}
                    >
                      <i className="fab fa-facebook me-2"></i>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Chưa có tài khoản?{" "}
                    <Link
                      to="/register"
                      className="text-decoration-none fw-bold text-primary"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer bg-transparent text-center py-3">
                <small className="text-muted">
                  Bằng việc đăng nhập, bạn đồng ý với{" "}
                  <Link to="/terms" className="text-decoration-none">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className="text-decoration-none">
                    Chính sách bảo mật
                  </Link>
                </small>
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
        <div className="position-absolute top-0 end-0 w-50 h-50 bg-primary bg-opacity-10 rounded-circle blur-3"></div>
        <div className="position-absolute bottom-0 start-0 w-50 h-50 bg-success bg-opacity-10 rounded-circle blur-3"></div>
      </div>
    </div>
  );
};

export default Login;
