import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import './assets/css/progressdashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ProgressDashboard = () => {
    const [examHistory, setExamHistory] = useState([]);
    const [vocabularyProgress, setVocabularyProgress] = useState([]);
    const [weaknesses, setWeaknesses] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');

    useEffect(() => {
        // Hàm tải dữ liệu tiến độ học tập
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [examRes, vocabRes, weaknessesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/exams/history', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get('http://localhost:5000/api/vocabulary/learning/progress', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get('http://localhost:5000/api/user/weaknesses', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setExamHistory(examRes.data);
                setVocabularyProgress(vocabRes.data);
                setWeaknesses(weaknessesRes.data.analysis);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching progress data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalExamsTaken = examHistory.length;
    const totalCorrectAnswers = examHistory.reduce((sum, exam) => sum + exam.correct_answers, 0);
    const totalQuestions = examHistory.reduce((sum, exam) => sum + exam.total_questions, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;
    const learnedWords = vocabularyProgress.filter(word => word.status === 'learned' || word.status === 'mastered').length;
    const masteredWords = vocabularyProgress.filter(word => word.status === 'mastered').length;

    // Chart data với thiết kế cải tiến
    const chartData = {
        labels: examHistory.map(exam => new Date(exam.submitted_at).toLocaleDateString('vi-VN')),
        datasets: [
            {
                label: 'Tỷ lệ đúng (%)',
                data: examHistory.map(exam => (exam.correct_answers / exam.total_questions) * 100),
                fill: true,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: 'rgb(102, 126, 234)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgb(102, 126, 234)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return `Tỷ lệ đúng: ${context.parsed.y.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    color: '#718096',
                    callback: function(value) {
                        return value + '%';
                    }
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

    if (loading) {
        return (
            <div className="progress-dashboard">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <h3 className="text-muted">Đang tải dữ liệu tiến độ...</h3>
                        <p className="text-muted">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="progress-dashboard">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Bảng Điều Khiển Tiến Độ</h1>
                    <p className="dashboard-subtitle">
                        Theo dõi sự tiến bộ và nhận gợi ý học tập cá nhân hóa
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid-progress">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <i className="fas fa-clipboard-list"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{totalExamsTaken}</h3>
                            <p>Bài thi đã làm</p>
                            <div className="stat-trend trend-up">
                                <i className="fas fa-arrow-up"></i>
                                <span>+2 tuần này</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{overallAccuracy.toFixed(1)}%</h3>
                            <p>Tỷ lệ đúng tổng thể</p>
                            <div className="stat-trend trend-up">
                                <i className="fas fa-arrow-up"></i>
                                <span>+5.2% so với tháng trước</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card info">
                        <div className="stat-icon">
                            <i className="fas fa-book"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{learnedWords}</h3>
                            <p>Từ vựng đã học</p>
                            <div className="stat-content">
                                <small className="text-muted">{masteredWords} từ đã thuộc</small>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <i className="fas fa-fire"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{examHistory.length > 0 ? Math.max(...examHistory.map(e => e.streak || 0)) : 0}</h3>
                            <p>Chuỗi ngày học</p>
                            <div className="stat-trend trend-neutral">
                                <i className="fas fa-minus"></i>
                                <span>Duy trì thói quen</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="dashboard-content">
                    {/* Left Column - Chart */}
                    <div className="chart-section">
                        <div className="section-header">
                            <h2 className="section-title">Biểu Đồ Tiến Bộ</h2>
                            <div className="section-actions">
                                <button 
                                    className={`time-filter ${timeRange === 'week' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('week')}
                                >
                                    1 Tuần
                                </button>
                                <button 
                                    className={`time-filter ${timeRange === 'month' ? 'active' : ''}`}
                                    onClick={() => setTimeRange('month')}
                                >
                                    1 Tháng
                                </button>
                                <button 
                                    className={`timeFilter ${timeRange === 'all' ? 'active' : ''} btn btn-outline-primary`}
                                    onClick={() => setTimeRange('all')}
                                >
                                    Tất Cả
                                </button>
                            </div>
                        </div>
                        <div className="chart-container">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Right Column - Suggestions */}
                    <div className="suggestions-section">
                        <h2 className="section-title">Gợi Ý Học Tập</h2>
                        {weaknesses ? (
                            <div className="suggestion-card">
                                <div className="suggestion-header">
                                    <div className="suggestion-icon">
                                        <i className="fas fa-lightbulb"></i>
                                    </div>
                                    <h3 className="suggestion-title">Phân tích từ AI</h3>
                                </div>
                                <div 
                                    className="suggestion-content"
                                    dangerouslySetInnerHTML={{ __html: weaknesses.replace(/\n/g, '<br />') }} 
                                />
                            </div>
                        ) : (
                            <div className="suggestion-card success">
                                <div className="suggestion-header">
                                    <div className="suggestion-icon">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <h3 className="suggestion-title">Tiếp tục phát huy!</h3>
                                </div>
                                <div className="suggestion-content">
                                    <p>Bạn đang có tiến độ học tập rất tốt. Hãy tiếp tục duy trì:</p>
                                    <ul>
                                        <li>Ôn tập từ vựng đều đặn mỗi ngày</li>
                                        <li>Làm bài kiểm tra thường xuyên</li>
                                        <li>Tập trung vào các kỹ năng còn yếu</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weaknesses Section */}
                {weaknesses && (
                    <div className="weaknesses-section">
                        <h2 className="section-title">Điểm Cần Cải Thiện</h2>
                        <p className="text-muted">Dựa trên phân tích bài làm gần đây</p>
                        <div className="weakness-tags">
                            <span className="weakness-tag">Từ vựng nâng cao</span>
                            <span className="weakness-tag">Ngữ pháp phức tạp</span>
                            <span className="weakness-tag">Kỹ năng đọc hiểu</span>
                        </div>
                    </div>
                )}

                {/* History Section */}
                <div className="history-section">
                    <div className="section-header">
                        <h2 className="section-title">Lịch Sử Làm Bài</h2>
                        <div className="section-actions">
                            <span className="text-muted mx-3">
                                Hiển thị {examHistory.length} bài thi
                            </span>
                        </div>
                    </div>

                    {examHistory.length > 0 ? (
                        <div className="table-responsive">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Đề thi</th>
                                        <th>Điểm số</th>
                                        <th>Tỷ lệ đúng</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examHistory.map(exam => {
                                        const accuracy = (exam.correct_answers / exam.total_questions) * 100;
                                        const scoreClass = accuracy >= 80 ? 'score-high' : 
                                                          accuracy >= 60 ? 'score-medium' : 'score-low';
                                        
                                        return (
                                            <tr key={exam.id}>
                                                <td>
                                                    <strong>{exam.exam_title}</strong>
                                                </td>
                                                <td>
                                                    <span className={`score-badge ${scoreClass}`}>
                                                        {exam.score}/{exam.total_points}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{accuracy.toFixed(1)}%</strong>
                                                    <div className="progress" style={{height: '4px', marginTop: '0.5rem'}}>
                                                        <div 
                                                            className={`progress-bar ${
                                                                accuracy >= 80 ? 'bg-success' : 
                                                                accuracy >= 60 ? 'bg-warning' : 'bg-danger'
                                                            }`} 
                                                            style={{width: `${accuracy}%`}}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {new Date(exam.submitted_at).toLocaleDateString('vi-VN')}
                                                    <br />
                                                    <small className="text-muted">
                                                        {new Date(exam.submitted_at).toLocaleTimeString('vi-VN')}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        accuracy >= 80 ? 'bg-success' : 
                                                        accuracy >= 60 ? 'bg-warning' : 'bg-danger'
                                                    }`}>
                                                        {accuracy >= 80 ? 'Xuất sắc' : 
                                                         accuracy >= 60 ? 'Khá' : 'Cần cố gắng'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-clipboard-list"></i>
                            <h4>Chưa có lịch sử làm bài</h4>
                            <p>Hãy bắt đầu làm bài kiểm tra để theo dõi tiến độ của bạn</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgressDashboard;