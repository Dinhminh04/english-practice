import React from 'react';
import { Link } from 'react-router-dom';
import './assets/css/about.css';

const About = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Nguyễn Minh Anh",
      position: "Founder & CEO",
      bio: "Chuyên gia ngôn ngữ học với 10 năm kinh nghiệm giảng dạy tiếng Anh",
      image: "https://vcdn1-english.vnecdn.net/2024/11/18/1-1731922651-1731922672-3493-1731922680.jpg?w=500&h=300&q=100&dpr=2&fit=crop&s=rVmUD42NLo16wrYOMUXQkQ",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    },
    {
      id: 2,
      name: "Trần Quốc Bảo",
      position: "CTO & Lead Developer",
      bio: "Kỹ sư phần mềm với niềm đam mê ứng dụng công nghệ vào giáo dục",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
      social: {
        linkedin: "#",
        github: "#",
        email: "#"
      }
    },
    {
      id: 3,
      name: "Lê Thị Hương",
      position: "Head of Education",
      bio: "Thạc sĩ Ngôn ngữ Anh, chuyên thiết kế chương trình học hiệu quả",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    },
    {
      id: 4,
      name: "Phạm Văn Cường",
      position: "Content Manager",
      bio: "Cử nhân Sư phạm Anh với 8 năm kinh nghiệm biên soạn tài liệu",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
      social: {
        linkedin: "#",
        email: "#"
      }
    }
  ];

  const stats = [
    { number: "50,000+", label: "Học viên", icon: "fas fa-users" },
    { number: "100+", label: "Khóa học", icon: "fas fa-book" },
    { number: "25+", label: "Giảng viên", icon: "fas fa-chalkboard-teacher" },
    { number: "98%", label: "Hài lòng", icon: "fas fa-star" }
  ];

  const values = [
    {
      icon: "fas fa-graduation-cap",
      title: "Chất lượng đào tạo",
      description: "Cam kết cung cấp nội dung học tập chất lượng cao, cập nhật liên tục"
    },
    {
      icon: "fas fa-hand-holding-heart",
      title: "Học tập linh hoạt",
      description: "Học mọi lúc, mọi nơi với lộ trình cá nhân hóa phù hợp với từng học viên"
    },
    {
      icon: "fas fa-rocket",
      title: "Đổi mới sáng tạo",
      description: "Áp dụng công nghệ tiên tiến và phương pháp giảng dạy hiện đại"
    },
    {
      icon: "fas fa-shield-alt",
      title: "Cam kết thành công",
      description: "Đồng hành cùng học viên cho đến khi đạt được mục tiêu học tập"
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero bg-gradient-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">Về Chúng Tôi</h1>
              <p className="lead mb-4">
                English Master - Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam, 
                mang đến giải pháp học tập toàn diện cho mọi đối tượng học viên.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/courses" className="btn btn-light btn-lg px-4">
                  <i className="fas fa-play-circle me-2"></i>Bắt đầu học
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg px-4">
                  <i className="fas fa-envelope me-2"></i>Liên hệ
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image">
                <i className="fas fa-graduation-cap display-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                alt="Our Mission" 
                className="img-fluid rounded shadow"
              />
            </div>
            <div className="col-lg-6">
              <h2 className="display-5 fw-bold text-primary mb-4">Sứ Mệnh Của Chúng Tôi</h2>
              <p className="lead text-dark mb-4">
                Chúng tôi tin rằng việc học tiếng Anh không chỉ là tiếp thu ngôn ngữ, 
                mà còn là mở ra cánh cửa đến với thế giới rộng lớn.
              </p>
              <div className="mission-content">
                <p>
                  Với phương châm "Học thật - Dùng thật", chúng tôi xây dựng nền tảng 
                  học tập giúp người Việt tự tin giao tiếp tiếng Anh trong môi trường 
                  quốc tế, phát triển sự nghiệp và khám phá văn hóa toàn cầu.
                </p>
                <ul className="list-unstyled mt-4">
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Phương pháp học tập tự nhiên, không áp lực
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Nội dung cập nhật, phù hợp với thực tế
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Lộ trình cá nhân hóa cho từng học viên
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Hỗ trợ 24/7 từ đội ngũ chuyên môn
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row text-center">
            <div className="col-12 mb-5">
              <h2 className="display-5 fw-bold text-dark mb-3">Thành Tựu Nổi Bật</h2>
              <p className="lead text-muted">Hành trình 5 năm đồng hành cùng học viên</p>
            </div>
            {stats.map((stat, index) => (
              <div key={index} className="col-lg-3 col-md-6 mb-4">
                <div className="stat-card p-4">
                  <i className={`${stat.icon} display-4 text-primary mb-3`}></i>
                  <h3 className="fw-bold text-dark">{stat.number}</h3>
                  <p className="text-muted mb-0">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-dark mb-3">Giá Trị Cốt Lõi</h2>
              <p className="lead text-muted">Những điều làm nên sự khác biệt của English Master</p>
            </div>
          </div>
          <div className="row g-4">
            {values.map((value, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div className="value-card text-center p-4 h-100">
                  <div className="value-icon mb-4">
                    <i className={`${value.icon} display-4 text-primary`}></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-3">{value.title}</h4>
                  <p className="text-muted">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-dark mb-3">Đội Ngũ Của Chúng Tôi</h2>
              <p className="lead text-muted">Những người đam mê với sứ mệnh giáo dục</p>
            </div>
          </div>
          <div className="row g-4 justify-content-center">
            {teamMembers.map(member => (
              <div key={member.id} className="col-lg-3 col-md-6">
                <div className="team-card text-center p-4 h-100">
                  <div className="team-image mb-4">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="img-fluid rounded-circle shadow"
                    />
                  </div>
                  <h4 className="fw-bold text-dark mb-2">{member.name}</h4>
                  <p className="text-primary fw-medium mb-3">{member.position}</p>
                  <p className="text-muted small mb-4">{member.bio}</p>
                  <div className="social-links">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} className="text-muted me-3">
                        <i className="fab fa-linkedin fa-lg"></i>
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-muted me-3">
                        <i className="fab fa-twitter fa-lg"></i>
                      </a>
                    )}
                    {member.social.github && (
                      <a href={member.social.github} className="text-muted me-3">
                        <i className="fab fa-github fa-lg"></i>
                      </a>
                    )}
                    {member.social.email && (
                      <a href={`mailto:${member.social.email}`} className="text-muted">
                        <i className="fas fa-envelope fa-lg"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container">
          <div className="row text-center">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-4">Sẵn sàng bắt đầu hành trình?</h2>
              <p className="lead mb-4">
                Tham gia cộng đồng 50,000+ học viên đã chinh phục tiếng Anh thành công
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link to="/register" className="btn btn-light btn-lg px-5">
                  <i className="fas fa-user-plus me-2"></i>Đăng ký ngay
                </Link>
                <Link to="/courses" className="btn btn-outline-light btn-lg px-5">
                  <i className="fas fa-search me-2"></i>Khám phá khóa học
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;