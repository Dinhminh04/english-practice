import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-toastify';
import '../assets/css/grammarlist.css';

const GrammarList = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, lessonsRes, progressRes] = await Promise.all([
          api.get('/grammar/topics'),
          api.get('/grammar/lessons'),
          api.get('/grammar/progress')
        ]);

        const topicsData = topicsRes.data.topics || [];
        const lessonsData = lessonsRes.data.lessons || [];
        const progressData = progressRes.data || [];

        const progressMap = {};
        progressData.forEach(p => {
          if (p.completed) {
            progressMap[p.lesson_id] = true;
          }
        });

        const topicsWithLessonsAndProgress = topicsData.map(topic => {
          const lessons = lessonsData.filter(lesson => lesson.topic_id === topic.id);
          const completed_lessons = lessons.filter(lesson => progressMap[lesson.id]).length;
          const difficulties = [...new Set(lessons.map(lesson => lesson.difficulty_level))].filter(Boolean);
          return {
            ...topic,
            lessons,
            difficulties,
            completed_lessons,
          };
        });

        setTopics(topicsWithLessonsAndProgress);

      } catch (error) {
        console.error('Error fetching grammar data:', error);
        toast.error('Không thể tải dữ liệu ngữ pháp.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm lấy màu theo độ khó
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#27ae60',
      medium: '#f39c12',
      hard: '#e74c3c',
      expert: '#8e44ad'
    };
    return colors[difficulty] || '#6c757d';
  };

  // Hàm lấy text theo độ khó
  const getDifficultyText = (difficulty) => {
    const texts = {
      easy: 'Cơ bản',
      medium: 'Trung cấp',
      hard: 'Nâng cao',
      expert: 'Chuyên sâu'
    };
    return texts[difficulty] || 'Không xác định';
  };

  // Hàm lấy icon theo chủ đề
  const getTopicIcon = (topicTitle) => {
    const icons = {
      'Tenses': '⏰',
      'Verbs': '🔤',
      'Nouns': '📝',
      'Adjectives': '🎯',
      'Adverbs': '⚡',
      'Prepositions': '📍',
      'Conjunctions': '🔗',
      'Articles': '📰',
      'Passive Voice': '🔀',
      'Conditionals': '🎭',
      'Reported Speech': '💬',
      'Relative Clauses': '⛓️'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (topicTitle.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    
    return '📚';
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = !difficultyFilter || 
      topic.lessons.some(lesson => lesson.difficulty_level === difficultyFilter);
    
    return matchesSearch && matchesDifficulty;
  });

  // Hàm tính tổng số bài học
  const getTotalLessons = () => {
    return topics.reduce((total, topic) => total + (topic.lessons?.length || 0), 0);
  };

  if (loading) {
    return (
      <div className="grammar-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Đang tải dữ liệu ngữ pháp...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-list-container">
      <div className="container">
        {/* Header Section */}
        <div className="grammar-header">
          <div className="header-content-grammar">
            <div className="header-text">
              <h1 className="page-title">Ngữ Pháp Tiếng Anh</h1>
              <p className="page-subtitle">
                Làm chủ ngữ pháp tiếng Anh từ cơ bản đến nâng cao. 
                Học lý thuyết và thực hành với bài tập đa dạng.
              </p>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{topics.length}</div>
                  <div className="stat-label">Chủ đề</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📖</div>
                <div className="stat-content">
                  <div className="stat-number">{getTotalLessons()}</div>
                  <div className="stat-label">Bài học</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="search-filter">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm chủ đề hoặc bài học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <label className="filter-label">Độ khó</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả độ khó</option>
                <option value="easy">Cơ bản</option>
                <option value="medium">Trung cấp</option>
                <option value="hard">Nâng cao</option>
                <option value="expert">Chuyên sâu</option>
              </select>
            </div>

            <div className="filter-actions">
              <button 
                className="reset-filters"
                onClick={() => {
                  setSearchTerm('');
                  setDifficultyFilter('');
                }}
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            Hiển thị <strong>{filteredTopics.length}</strong> chủ đề
            {(searchTerm || difficultyFilter) && (
              <span className="filtered-text"> (đã lọc)</span>
            )}
          </div>
        </div>

        {/* Topics Grid */}
        <div className="topics-grid">
          {filteredTopics.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Không tìm thấy chủ đề phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setDifficultyFilter('');
                }}
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <div key={topic.id} className="topic-card">
                <div className="topic-header">
                  <div className="topic-icon">
                    {getTopicIcon(topic.title)}
                  </div>
                  <div className="topic-info">
                    <h3 className="topic-title">{topic.title}</h3>
                    <div class="topic-meta">
                      <span class="lessons-count">
                        📖 {topic.lessons?.length || 0} bài học
                      </span>
                      {topic.difficulties && topic.difficulties.length > 0 && (
                        <div className="difficulty-badges">
                          {topic.difficulties.map(difficulty => (
                            <span
                              key={difficulty}
                              className="difficulty-badge"
                              style={{ backgroundColor: getDifficultyColor(difficulty) }}
                            >
                              {getDifficultyText(difficulty)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="topic-body">
                  <p className="topic-description">{topic.description}</p>
                  
                  {topic.lessons && topic.lessons.length > 0 ? (
                    <div className="lessons-list">
                      <h4 className="lessons-title">Danh sách bài học</h4>
                      <div className="lessons-grid">
                        {topic.lessons.map(lesson => (
                          <div key={lesson.id} className="lesson-item">
                            <div className="lesson-content">
                              <h5 className="lesson-title">{lesson.title}</h5>
                              {lesson.description && (
                                <p className="lesson-description">{lesson.description}</p>
                              )}
                              <div class="lesson-meta">
                                {lesson.difficulty_level && (
                                  <span 
                                    className="lesson-difficulty"
                                    style={{ color: getDifficultyColor(lesson.difficulty_level) }}
                                  >
                                    {getDifficultyText(lesson.difficulty_level)}
                                  </span>
                                )}
                                {lesson.duration && (
                                  <span className="lesson-duration">⏱️ {lesson.duration} phút</span>
                                )}
                              </div>
                            </div>
                            <div className="lesson-actions">
                              <Link 
                                to={`/grammar/learn/${lesson.id}`} 
                                className="btn-primary lesson-btn"
                              >
                                <span className="btn-icon">🚀</span>
                                Học ngay
                              </Link>
                              {lesson.exercise_count > 0 && (
                                <Link 
                                  to={`/grammar/practice/${lesson.id}`} 
                                  className="btn-outline practice-btn"
                                >
                                  <span className="btn-icon">💪</span>
                                  Luyện tập
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-lessons">
                      <span className="no-lessons-icon">📝</span>
                      <p>Chủ đề này chưa có bài học nào.</p>
                    </div>
                  )}
                </div>

                <div className="topic-footer">
                  <div className="topic-progress">
                    <div className="progress-text">
                      {topic.completed_lessons || 0}/{topic.lessons?.length || 0} bài đã hoàn thành
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${((topic.completed_lessons || 0) / (topic.lessons?.length || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        {filteredTopics.length > 0 && (
          <div className="quick-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {filteredTopics.reduce((acc, topic) => acc + (topic.completed_lessons || 0), 0)}
                  </div>
                  <div className="stat-label">Bài đã hoàn thành</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {filteredTopics.reduce((acc, topic) => 
                      acc + (topic.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0), 0)
                    }
                  </div>
                  <div className="stat-label">Phút học tập</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💪</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {filteredTopics.reduce((acc, topic) => 
                      acc + (topic.lessons?.reduce((sum, lesson) => sum + (lesson.exercise_count || 0), 0) || 0), 0)
                    }
                  </div>
                  <div className="stat-label">Bài tập có sẵn</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarList;