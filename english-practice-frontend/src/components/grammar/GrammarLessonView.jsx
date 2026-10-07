// components/grammar/GrammarLessonView.jsx
import React, { useState, useEffect } from "react";

const GrammarLessonView = ({ lesson, onComplete }) => {
  const [currentSection, setCurrentSection] = useState("explanation");
  const [completedSections, setCompletedSections] = useState(new Set());

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

  const sections = [
    { id: "explanation", title: "Giải thích", icon: "fa-info-circle" },
    { id: "structure", title: "Cấu trúc", icon: "fa-code" },
    { id: "usage", title: "Cách dùng", icon: "fa-language" },
    { id: "examples", title: "Ví dụ", icon: "fa-list" }
  ];

  // Đánh dấu phần đã hoàn thành
  const markSectionComplete = (sectionId) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionId);
    setCompletedSections(newCompleted);
  };

  // Kiểm tra nếu tất cả phần đã hoàn thành
  const isAllSectionsCompleted = () => {
    return sections.every(section => completedSections.has(section.id));
  };

  // Render nội dung phần hiện tại
  const renderSectionContent = () => {
    switch (currentSection) {
      case "explanation":
        return (
          <div className="section-content">
            <h4 className="text-primary mb-4">Giải thích ngữ pháp</h4>
            <div className="explanation-content" dangerouslySetInnerHTML={{ 
              __html: lesson.explanation.replace(/\n/g, '<br/>') 
            }} />
            <div className="text-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => markSectionComplete("explanation")}
              >
                Đã hiểu <i className="fas fa-check ms-2"></i>
              </button>
            </div>
          </div>
        );

      case "structure":
        return (
          <div className="section-content">
            <h4 className="text-primary mb-4">Cấu trúc ngữ pháp</h4>
            {lesson.structure ? (
              <div className="structure-content">
                <pre className="bg-light p-4 rounded border">
                  <code>{lesson.structure}</code>
                </pre>
                <div className="mt-3">
                  <p className="text-muted small">
                    <i className="fas fa-lightbulb me-2"></i>
                    Ghi nhớ cấu trúc này để áp dụng vào thực hành
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-code text-muted mb-3" style={{fontSize: '2rem'}}></i>
                <p className="text-muted">Không có cấu trúc cụ thể cho bài học này.</p>
              </div>
            )}
            <div className="text-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => markSectionComplete("structure")}
              >
                Đã hiểu <i className="fas fa-check ms-2"></i>
              </button>
            </div>
          </div>
        );

      case "usage":
        return (
          <div className="section-content">
            <h4 className="text-primary mb-4">Cách sử dụng</h4>
            {lesson.usage ? (
              <div className="usage-content">
                <div className="bg-light p-4 rounded border">
                  {lesson.usage}
                </div>
                {lesson.meaning && (
                  <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                    <strong>Ý nghĩa:</strong> {lesson.meaning}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-language text-muted mb-3" style={{fontSize: '2rem'}}></i>
                <p className="text-muted">Không có hướng dẫn sử dụng cụ thể.</p>
              </div>
            )}
            <div className="text-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => markSectionComplete("usage")}
              >
                Đã hiểu <i className="fas fa-check ms-2"></i>
              </button>
            </div>
          </div>
        );

      case "examples":
        return (
          <div className="section-content">
            <h4 className="text-primary mb-4">Ví dụ minh họa</h4>
            
            {/* Main Example from lesson table */}
            {lesson.example_sentence && (
              <div className="example-item card border-0 bg-light mb-3">
                <div className="card-body">
                  <h6 className="card-title">Ví dụ chính:</h6>
                  <p className="mb-2 fst-italic">"{lesson.example_sentence}"</p>
                  {lesson.meaning && (
                    <p className="mb-0 text-muted">→ {lesson.meaning}</p>
                  )}
                </div>
              </div>
            )}

            {/* Supplementary Examples from examples table */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="supplementary-examples mt-4">
                <h5 className="mb-3">Các ví dụ khác:</h5>
                {lesson.examples.map((example, index) => (
                  <div key={index} className="example-item card border-0 bg-light mb-3">
                    <div className="card-body">
                      <p className="mb-2 fst-italic">"{example.example_sentence}"</p>
                      {example.meaning && (
                        <p className="mb-1 text-muted">→ {example.meaning}</p>
                      )}
                      {example.notes && (
                        <p className="mb-0 text-muted small"><em>Ghi chú: {example.notes}</em></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!lesson.example_sentence && (!lesson.examples || lesson.examples.length === 0)) && (
                 <div className="text-center py-4">
                    <i className="fas fa-list text-muted mb-3" style={{fontSize: '2rem'}}></i>
                    <p className="text-muted">Chưa có ví dụ nào cho bài học này.</p>
                </div>
            )}
            
            <div className="text-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => markSectionComplete("examples")}
              >
                Đã hiểu <i className="fas fa-check ms-2"></i>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grammar-lesson-view card shadow-sm border-0">
      <div className="card-header bg-white border-0">
        <h3 className="card-title mb-0">{lesson.title}</h3>
        <p className="text-muted mb-0 mt-1">
          Chủ đề: {lesson.topic_title} • Độ khó: 
          <span 
            className="badge ms-2"
            style={{ backgroundColor: getDifficultyColor(lesson.difficulty_level) }}
          >
            {getDifficultyText(lesson.difficulty_level)}
          </span>
        </p>
      </div>

      <div className="card-body">
        {/* Navigation Tabs */}
        <div className="lesson-navigation mb-4">
          <ul className="nav nav-pills nav-justified">
            {sections.map(section => (
              <li key={section.id} className="nav-item">
                <button
                  className={`nav-link ${currentSection === section.id ? 'active' : ''} ${
                    completedSections.has(section.id) ? 'text-success' : ''
                  }`}
                  onClick={() => setCurrentSection(section.id)}
                >
                  <i className={`fas ${section.icon} me-2`}></i>
                  {section.title}
                  {completedSections.has(section.id) && (
                    <i className="fas fa-check ms-2 small"></i>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Section Content */}
        {renderSectionContent()}

        {/* Complete Button */}
        {isAllSectionsCompleted() && (
          <div className="text-center mt-5 pt-4 border-top">
            <button 
              className="btn btn-success btn-lg"
              onClick={onComplete}
            >
              <i className="fas fa-arrow-right me-2"></i>
              Hoàn thành bài học & Làm Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarLessonView;