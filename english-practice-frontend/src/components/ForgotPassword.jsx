import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import './assets/css/forgotpassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý gửi yêu cầu đặt lại mật khẩu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email,
      });
      setSent(true);
      toast.success(
        "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư!"
      );
    } catch (err) {
      console.error("Lỗi khi gửi email:", err);
      if (err.code === "ERR_NETWORK") {
        toast.error("Không thể kết nối đến server. Vui lòng thử lại sau.");
      } else {
        toast.error(err.response?.data?.message || "Gửi email thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                {sent ? (
                  /* Success State */
                  <div className="text-center py-4">
                    <div className="success-icon mb-4">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" 
                           style={{width: '80px', height: '80px'}}>
                        <i className="fas fa-check-circle text-white  fs-1"></i>   
                      </div>
                    </div>
                    
                    <h5 className="text-success mb-3">Yêu cầu đã được gửi!</h5>
                    <p className="text-muted mb-4">
                      Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn. 
                      Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                    </p>
                    
                    <div className="alert alert-warning text-start mb-4">
                      <div className="d-flex align-items-start">
                        <i className="fas fa-exclamation-triangle text-warning me-2 mt-1"></i>
                        <div>
                          <small className="fw-bold">Lưu ý:</small>
                          <ul className="mb-0 ps-3 mt-1">
                            <li><small>Kiểm tra thư mục spam nếu không thấy email</small></li>
                            <li><small>Liên kết có hiệu lực trong 1 giờ</small></li>
                            <li><small>Mỗi liên kết chỉ sử dụng được một lần</small></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-3">
                      <button 
                        onClick={() => setSent(false)}
                        className="btn btn-outline-primary"
                      >
                        <i className="fas fa-redo me-2"></i>
                        Gửi lại yêu cầu
                      </button>
                      <Link 
                        to="/login" 
                        className="btn btn-primary"
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Quay lại đăng nhập
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Form State */
                  <>
                    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                      <div className="mb-4">
                        <label htmlFor="email" className="form-label text-dark fw-medium">
                          <i className="fas fa-envelope me-2 text-primary"></i>
                          Email đăng ký
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-user text-muted"></i>
                          </span>
                          <input
                            type="email"
                            className="form-control border-start-0"
                            id="email"
                            placeholder="Nhập email đã đăng ký tài khoản"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <small className="text-muted">
                          Nhập chính xác email bạn đã dùng để đăng ký tài khoản
                        </small>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 py-2 mb-4"
                        disabled={isLoading || !email}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Đang gửi yêu cầu...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Gửi liên kết đặt lại
                          </>
                        )}
                      </button>
                    </form>

                    {/* Additional Help */}
                    <div className="text-center">
                      <div className="d-flex justify-content-center gap-4 mb-3">
                        <Link 
                          to="/login" 
                          className="text-decoration-none text-primary fw-medium"
                        >
                          <i className="fas fa-arrow-left me-1"></i>
                          Quay lại đăng nhập
                        </Link>
                        <Link 
                          to="/register" 
                          className="text-decoration-none text-primary fw-medium"
                        >
                          <i className="fas fa-user-plus me-1"></i>
                          Tạo tài khoản mới
                        </Link>
                      </div>
                      
                      <div className="card bg-light border-0">
                        <div className="card-body py-3">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-info-circle text-info me-2"></i>
                            <small className="text-muted text_emphasis">
                              Bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong vài phút
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="card-footer bg-transparent text-center py-3">
                <small className="text-muted">
                  Cần hỗ trợ? <Link to="/contact" className="text-decoration-none text-primary">Liên hệ chúng tôi</Link>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{zIndex: -1}}>
        <div className="position-absolute top-0 start-0 w-50 h-50 bg-warning bg-opacity-10 rounded-circle blur-3"></div>
        <div className="position-absolute bottom-0 end-0 w-50 h-50 bg-info bg-opacity-10 rounded-circle blur-3"></div>
      </div>
    </div>
  );
};

export default ForgotPassword;