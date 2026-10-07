// components/grammar/ProgressTracker.jsx
import React from "react";
import { Link } from "react-router-dom";

const ProgressTracker = ({ lesson, currentStep, progress }) => {
  // Xác định trạng thái bước hiện tại
  const getStepStatus = (step) => {
    if (step === currentStep) return "current";
    if (
      (step === "lesson" && currentStep === "quiz") ||
      (step === "lesson" && currentStep === "result") ||
      (step === "quiz" && currentStep === "result")
    ) return "completed";
    return "pending";
  };

  // Dữ liệu bài học
  const steps = [
    { id: "lesson", label: "Học lý thuyết", icon: "fa-book" },
    { id: "quiz", label: "Làm quiz", icon: "fa-question-circle" },
    { id: "result", label: "Kết quả", icon: "fa-chart-bar" }
  ];

  return (
    <div className="progress-tracker">
      <div className="d-flex justify-content-between align-items-center">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/grammar" className="text-decoration-none">Ngữ pháp</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to={`/grammar/topic/${lesson.topic_id}`} className="text-decoration-none">
                {lesson.topic_title}
              </Link>
            </li>
            <li className="breadcrumb-item active">{lesson.title}</li>
          </ol>
        </nav>

        {/* Progress Steps */}
        <div className="d-flex align-items-center">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <React.Fragment key={step.id}>
                <div className={`step-item ${status}`}>
                  <div className={`step-icon ${status}`}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  <span className="step-label d-none d-md-inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${status === "completed" ? "completed" : ""}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Badge */}
        {progress.completed && (
          <div className="badge">
            <i className="fas fa-check me-1"></i>
            Đã hoàn thành
          </div>
        )}
      </div>

      <style jsx>{`
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .step-item.pending .step-icon {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 2px solid #dee2e6;
        }
        
        .step-item.current .step-icon {
          background-color: #007bff;
          color: white;
          border: 2px solid #007bff;
        }
        
        .step-item.completed .step-icon {
          background-color: #28a745;
          color: white;
          border: 2px solid #28a745;
        }
        
        .step-label {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .step-connector {
          width: 60px;
          height: 2px;
          background-color: #dee2e6;
          margin: 0 1rem;
          transition: background-color 0.3s ease;
        }
        
        .step-connector.completed {
          background-color: #28a745;
        }
        
        @media (max-width: 768px) {
          .step-connector {
            width: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressTracker;