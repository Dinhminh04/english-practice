// components/grammar/GrammarQuiz.jsx
import React, { useState, useEffect } from "react";

const GrammarQuiz = ({ quiz, onSubmit, onBack }) => {
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // in seconds

  useEffect(() => {
    // Initialize user answers
    setUserAnswers(new Array(quiz.exercises.length).fill(null));

    // Timer
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  // Xử lý thay đổi câu trả lời
  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Xử lý nộp bài
  const handleSubmit = () => {
    const timeSpent = quiz.timeLimit * 60 - timeLeft;
    onSubmit(userAnswers, timeSpent);
  };

  // Định dạng thời gian hiển thị
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="card-title mb-0">{quiz.title}</h4>
          {quiz.instructions && <p className="text-muted mb-0 small">{quiz.instructions}</p>}
        </div>
        <div className="text-end">
            <span className="badge bg-danger fs-6">{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div className="card-body">
        {quiz.exercises.map((question, questionIndex) => (
          <div key={questionIndex} className="mb-4 p-3 border rounded">
            <p></p>
            <p className="fw-bold">Câu {questionIndex + 1}: {question.question_text}</p>
            {question.question_type === 'multiple_choice' && (
              <div>
                {question.options.map((option, index) => (
                  <div key={index} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`question-${questionIndex}`}
                      id={`q-${questionIndex}-o-${index}`}
                      value={index.toString()}
                      checked={userAnswers[questionIndex] === index.toString()}
                      onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={`q-${questionIndex}-o-${index}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}
             {question.question_type === 'fill_in_blank' && (
                <div className="mt-2">
                    <input
                        type="text"
                        className="form-control"
                        value={userAnswers[questionIndex] || ''}
                        onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                    />
                </div>
            )}
          </div>
        ))}
        <div className="d-flex justify-content-between mt-4">
            <button className="btn btn-secondary" onClick={onBack}>
                <i className="fas fa-arrow-left me-2"></i>
                Quay lại bài học
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
                <i className="fas fa-check me-2"></i>
                Nộp bài
            </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarQuiz;