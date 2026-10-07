import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../layout/admin/Layout";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "../assets/css/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ handleLogout }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (userRole !== "superadmin" && userRole !== "admin") {
      navigate("/");
    } else {
      const fetchStats = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/admin/users/stats",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setStats(response.data.stats);
          setRecentActivities(response.data.recentUsers);
        } catch (error) {
          console.error("Error fetching user stats:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [userRole, navigate]);

  if (userRole !== "superadmin" && userRole !== "admin") {
    return null;
  }

  // Chart data với thiết kế cải tiến
  const roleChartData = {
    labels: ["Người dùng thường", "Quản trị viên", "Super Admin"],
    datasets: [
      {
        data: [
          stats?.regular_users || 0,
          stats?.admin_users || 0,
          stats?.superadmin_users || 0,
        ],
        backgroundColor: [
          "rgba(102, 126, 234, 0.8)",
          "rgba(72, 187, 120, 0.8)",
          "rgba(237, 137, 54, 0.8)",
        ],
        borderColor: [
          "rgba(102, 126, 234, 1)",
          "rgba(72, 187, 120, 1)",
          "rgba(237, 137, 54, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const userStatsChartData = {
    labels: ["Xác thực", "Người dùng mới"],
    datasets: [
      {
        label: "Đã xác thực",
        data: [stats?.verified_users || 0, 0],
        backgroundColor: "rgba(72, 187, 120, 0.8)",
        borderColor: "rgba(72, 187, 120, 1)",
        borderWidth: 2,
      },
      {
        label: "Chưa xác thực",
        data: [stats?.unverified_users || 0, 0],
        backgroundColor: "rgba(237, 137, 54, 0.8)",
        borderColor: "rgba(237, 137, 54, 1)",
        borderWidth: 2,
      },
      {
        label: "Mới hôm nay",
        data: [0, stats?.new_today || 0],
        backgroundColor: "rgba(102, 126, 234, 0.8)",
        borderColor: "rgba(102, 126, 234, 1)",
        borderWidth: 2,
      },
      {
        label: "Mới tuần này",
        data: [0, stats?.new_this_week || 0],
        backgroundColor: "rgba(153, 102, 255, 0.8)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4a5568',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#718096',
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#718096'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#4a5568',
          font: {
            size: 11
          },
          padding: 20
        }
      }
    },
    cutout: '65%'
  };

  return (
    <Layout handleLogout={handleLogout}>
      <div className="admin-dashboard">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header">
            <h1 className="dashboard-title">Dashboard Quản Trị</h1>
            <p className="dashboard-subtitle">
              Tổng quan thống kê và quản lý người dùng
            </p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-dashboard">
            <div className="stat-card primary">
              <div className="stat-header">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>{loading ? "..." : stats?.total_users}</h3>
                  <p>Tổng người dùng</p>
                  <div className="stat-trend trend-up">
                    <i className="fas fa-arrow-up"></i>
                    <span>+{stats?.new_this_week || 0} tuần này</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-header">
                <div className="stat-icon">
                  <i className="fas fa-user-check"></i>
                </div>
                <div className="stat-content">
                  <h3>{loading ? "..." : stats?.verified_users}</h3>
                  <p>Đã xác thực</p>
                  <div className="stat-content">
                    <small className="text-muted">
                      {stats ? Math.round((stats.verified_users / stats.total_users) * 100) : 0}% tổng số
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-header">
                <div className="stat-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="stat-content">
                  <h3>{loading ? "..." : stats?.new_this_week}</h3>
                  <p>Mới tuần này</p>
                  <div className="stat-trend trend-up">
                    <i className="fas fa-arrow-up"></i>
                    <span>+{stats?.new_today || 0} hôm nay</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-header">
                <div className="stat-icon">
                  <i className="far fa-clock"></i>
                </div>
                <div className="stat-content">
                  <h3>{loading ? "..." : stats?.new_today}</h3>
                  <p>Mới hôm nay</p>
                  <div className="stat-trend trend-neutral">
                    <i className="fas fa-minus"></i>
                    <span>So với hôm qua</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Main Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Thống Kê Người Dùng</h2>
                <div className="chart-actions">
                  <button 
                    className={`time-filter ${timeRange === 'day' ? 'active' : ''}`}
                    onClick={() => setTimeRange('day')}
                  >
                    Ngày
                  </button>
                  <button 
                    className={`time-filter ${timeRange === 'week' ? 'active' : ''}`}
                    onClick={() => setTimeRange('week')}
                  >
                    Tuần
                  </button>
                  <button 
                    className={`time-filter ${timeRange === 'month' ? 'active' : ''}`}
                    onClick={() => setTimeRange('month')}
                  >
                    Tháng
                  </button>
                </div>
              </div>
              <div className="chart-container">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải biểu đồ...</p>
                  </div>
                ) : (
                  <Bar data={userStatsChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Doughnut Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Phân Phối Vai Trò</h2>
              </div>
              <div className="doughnut-container">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải biểu đồ...</p>
                  </div>
                ) : (
                  <>
                    <Doughnut data={roleChartData} options={doughnutOptions} />
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: 'rgba(102, 126, 234, 0.8)'}}></div>
                        <span>Người dùng thường</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: 'rgba(72, 187, 120, 0.8)'}}></div>
                        <span>Quản trị viên</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: 'rgba(237, 137, 54, 0.8)'}}></div>
                        <span>Super Admin</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="chart-title">Thao Tác Nhanh</h2>
            <div className="actions-grid">
              <Link to="/admin/users" className="action-btn">
                <div className="action-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="action-text">Quản lý người dùng</div>
              </Link>
              <Link to="/admin/analytics" className="action-btn">
                <div className="action-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="action-text">Phân tích chi tiết</div>
              </Link>
              <Link to="/admin/settings" className="action-btn">
                <div className="action-icon">
                  <i className="fas fa-cog"></i>
                </div>
                <div className="action-text">Cài đặt hệ thống</div>
              </Link>
              <Link to="/admin/reports" className="action-btn">
                <div className="action-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="action-text">Báo cáo & Thống kê</div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h2 className="chart-title">Hoạt Động Gần Đây</h2>
            <div className="activity-list">
              {loading ? (
                <p>Đang tải...</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <i className={"fas fa-user-plus"}></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">Người dùng mới</div>
                      <p className="activity-description">
                        {activity.display_name || activity.email} đã đăng ký.
                      </p>
                    </div>
                    <div className="activity-time">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;