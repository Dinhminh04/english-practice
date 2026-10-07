import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./assets/css/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { email, phone, password, confirmPassword, acceptTerms } = formData;

  // Xử lý thay đổi input
  const onChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Validate form trước khi submit
  const validateForm = () => {
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (!acceptTerms) {
      toast.error("Vui lòng chấp nhận điều khoản sử dụng");
      return false;
    }
    return true;
  };

  // Xử lý submit form
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        email,
        phone: phone || undefined,
        password,
      });
      toast.success(res.data.message || "Đăng ký thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Lỗi khi đăng kí:", err.response?.data);
      toast.error(err.response?.data?.message || "Đăng kí thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký với Google hoặc Facebook
  const handleGoogleRegister = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  // Xử lý đăng ký với Facebook
  const handleFacebookRegister = () => {
    window.location.href = "http://localhost:5000/api/auth/facebook";
  };

  return (
    <div className="min-vh-100 bg-gradient-primary d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-7 col-md-9">
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
                      Email <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-at text-muted"></i>
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

                  {/* Phone Input */}
                  <div className="mb-3">
                    <label
                      htmlFor="phone"
                      className="form-label text-dark fw-medium"
                    >
                      <i className="fas fa-phone me-2 text-primary"></i>
                      Số điện thoại
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-mobile-alt text-muted"></i>
                      </span>
                      <input
                        type="tel"
                        className="form-control border-start-0"
                        id="phone"
                        name="phone"
                        placeholder="Nhập số điện thoại (tuỳ chọn)"
                        value={phone}
                        onChange={onChange}
                        disabled={loading}
                      />
                    </div>
                    <small className="text-muted">
                      Số điện thoại giúp bảo mật tài khoản tốt hơn
                    </small>
                  </div>

                  {/* Password Input */}
                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label text-dark fw-medium"
                    >
                      <i className="fas fa-lock me-2 text-primary"></i>
                      Mật khẩu <span className="text-danger">*</span>
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
                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                        value={password}
                        onChange={onChange}
                        required
                        disabled={loading}
                        minLength="6"
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

                  {/* Confirm Password Input */}
                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label text-dark fw-medium"
                    >
                      <i className="fas fa-lock me-2 text-primary"></i>
                      Xác nhận mật khẩu <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-key text-muted"></i>
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control border-start-0 pe-5"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={onChange}
                        required
                        disabled={loading}
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

                  {/* Terms and Conditions */}
                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="acceptTerms"
                        name="acceptTerms"
                        checked={acceptTerms}
                        onChange={onChange}
                        disabled={loading}
                      />
                      <label
                        className="form-check-label text-muted"
                        htmlFor="acceptTerms"
                      >
                        Tôi đồng ý với{" "}
                        <Link
                          to="/terms"
                          className="text-decoration-none text-primary fw-medium"
                        >
                          Điều khoản sử dụng
                        </Link>{" "}
                        và{" "}
                        <Link
                          to="/privacy"
                          className="text-decoration-none text-primary fw-medium"
                        >
                          Chính sách bảo mật
                        </Link>
                      </label>
                    </div>
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
                        Đang đăng ký...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Đăng ký tài khoản
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="position-relative text-center mb-4">
                  <hr className="text-muted" />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                    Hoặc đăng ký với
                  </span>
                </div>

                {/* Social Register Buttons */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <button
                      onClick={handleGoogleRegister}
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center py-2"
                      disabled={loading}
                    >
                      <i className="fab fa-google me-2"></i>
                      <span>Google</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      onClick={handleFacebookRegister}
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center py-2"
                      disabled={loading}
                    >
                      <i className="fab fa-facebook me-2"></i>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Đã có tài khoản?{" "}
                    <Link
                      to="/login"
                      className="text-decoration-none fw-bold text-primary"
                    >
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer bg-transparent text-center py-3">
                <small className="text-muted">
                  Bằng việc đăng ký, bạn đồng ý với các điều khoản của chúng tôi
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
        <div className="position-absolute top-0 start-0 w-50 h-50 bg-primary bg-opacity-10 rounded-circle blur-3"></div>
        <div className="position-absolute bottom-0 end-0 w-50 h-50 bg-success bg-opacity-10 rounded-circle blur-3"></div>
      </div>
    </div>
  );
};

export default Register;
