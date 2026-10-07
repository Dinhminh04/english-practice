import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import GrammarLessonView from "./GrammarLessonView";
import GrammarQuiz from "./GrammarQuiz";
import ProgressTracker from "./ProgressTracker";

const GrammarLearning = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentStep, setCurrentStep] = useState("lesson"); // 'lesson', 'quiz', 'result'
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    completed: false,
    score: 0,
    timeSpent: 0
  });

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  // Lấy dữ liệu bài học và tiến độ
  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const [lessonResponse, progressResponse] = await Promise.all([
        api.get(`/grammar/lessons/${lessonId}`),
        api.get(`/grammar/progress/${lessonId}`)
      ]);
      
      const lessonData = lessonResponse.data;
      setLesson(lessonData);
      
      if (progressResponse.data) {
        setProgress(progressResponse.data);
      }
      
      // FIX: Create quiz from lesson's exercises (not practices)
      if (lessonData.exercises && lessonData.exercises.length > 0) {
        const questionsWithContext = lessonData.exercises.map((ex) => ({
          ...ex,
          practice_id: ex.id,
          correct_answer: ex.correct_answer,
          options: ex.options,
        }));

        setQuiz({
          title: `Luyện tập: ${lessonData.title}`,
          instructions: "Chọn đáp án đúng cho mỗi câu hỏi bên dưới.",
          timeLimit: 10,
          exercises: questionsWithContext,
        });
      }
    } catch (error) {
      console.error("Error fetching lesson data:", error);
      toast.error("Không thể tải dữ liệu bài học");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý hoàn thành bài học
  const handleLessonComplete = () => {
    setCurrentStep("quiz");
    toast.info("Bắt đầu làm quiz!");
  };

  // Xử lý nộp bài quiz
const handleQuizSubmit = async (answers, timeSpent) => {
    try {
      let score = 0;
      const results = quiz.exercises.map((exercise, index) => {
        // FIX: answers[index] là index của option (vd: "1")
        // correct_answer là giá trị thực (vd: "is")
        // Cần lấy giá trị option theo index rồi so sánh
        const correctAnswer = typeof exercise.correct_answer === 'string'
          ? exercise.correct_answer.replace(/^"|"$/g, '').trim()
          : exercise.correct_answer;
        
        // Lấy giá trị mà user chọn từ options array
        const userSelectedValue = exercise.options && answers[index] !== null
          ? exercise.options[parseInt(answers[index])]
          : answers[index];

        const isCorrect = userSelectedValue === correctAnswer;
        if (isCorrect) score += exercise.points || 1;
        return {
          exerciseId: exercise.id,
          userAnswer: answers[index],
          isCorrect,
          correctAnswer: correctAnswer
        };
      });

      const totalScore = (score / quiz.exercises.reduce((sum, ex) => sum + (ex.points || 1), 0)) * 100;

      setQuizResult({
        score: totalScore,
        totalQuestions: quiz.exercises.length,
        correctAnswers: results.filter(r => r.isCorrect).length,
        results,
        timeSpent
      });

      setCurrentStep("result");
      
      // Lưu kết quả
      await saveProgress(totalScore, timeSpent);
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Lỗi khi nộp bài");
    }
  };

  // Lưu tiến độ học tập
  const saveProgress = async (score, timeSpent) => {
    try {
      await api.post("/grammar/progress", {
        lesson_id: parseInt(lessonId),
        score,
        time_spent: timeSpent,
        completed: true
      });
      
      setProgress({
        completed: true,
        score,
        timeSpent
      });
      
      toast.success("Đã lưu tiến độ học tập!");
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Xử lý làm lại quiz
  const handleRetryQuiz = () => {
    setCurrentStep("quiz");
    setUserAnswers([]);
    setQuizResult(null);
  };

  const handleNextLesson = () => {
    navigate("/grammar");
  };

  // Xử lý phân tích kết quả với AI
  const handleAnalyzeResult = async () => {
    try {
      setAnalyzing(true);
      const response = await api.post("/grammar/progress/analyze", {
        quiz,
        results: quizResult.results,
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing result:", error);
      toast.error("Lỗi khi phân tích kết quả");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="grammar-learning-container  bg-gradient-primary">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-white mb-3" style={{width: '3rem', height: '3rem'}}></div>
            <h4 className="text-white">Đang tải bài học...</h4>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="grammar-learning-container  bg-gradient-primary">
        <div className="container">
          <div className="text-center py-5">
            <i className="fas fa-book text-white mb-3" style={{fontSize: '4rem'}}></i>
            <h2 className="text-white mb-3">Không tìm thấy bài học</h2>
            <p className="text-white mb-4">Bài học không tồn tại hoặc đã bị xóa.</p>
            <Link to="/grammar" className="btn btn-light btn-lg">
              <i className="fas fa-arrow-left me-2"></i>Quay lại danh sách bài học
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-learning-container  bg-light">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container py-3">
          <ProgressTracker 
            lesson={lesson}
            currentStep={currentStep}
            progress={progress}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        <div className="row g-4">
          {/* Main Content Area */}
          <div className="col-lg-8">
            <div className="learning-content-wrapper">
              {currentStep === "lesson" && (
                <GrammarLessonView 
                  lesson={lesson}
                  onComplete={handleLessonComplete}
                />
              )}

              {currentStep === "quiz" && quiz && (
                <GrammarQuiz 
                  quiz={quiz}
                  onSubmit={handleQuizSubmit}
                  onBack={() => setCurrentStep("lesson")}
                />
              )}

              {currentStep === "quiz" && !quiz && (
                <div className="card shadow-sm border-0 text-center py-5">
                  <div className="card-body">
                    <i className="fas fa-clipboard-question text-muted mb-3" style={{fontSize: '3rem'}}></i>
                    <h4 className="text-muted">Bài học này chưa có câu hỏi luyện tập</h4>
                    <p className="text-muted mb-4">Admin chưa thêm bài tập cho bài học này.</p>
                    <button onClick={() => setCurrentStep("lesson")} className="btn btn-primary">
                      <i className="fas fa-arrow-left me-2"></i>Quay lại bài học
                    </button>
                  </div>
                </div>
              )}

              {currentStep === "result" && quizResult && (
                <QuizResult 
                  result={quizResult}
                  lesson={lesson}
                  quiz={quiz}
                  onRetry={handleRetryQuiz}
                  onNext={handleNextLesson}
                  onAnalyze={handleAnalyzeResult}
                  analysis={analysis}
                  analyzing={analyzing}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="sidebar-sticky">
              <LessonResources lesson={lesson} />
              <RelatedLessons topicId={lesson.topic_id} currentLessonId={lesson.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component hiển thị kết quả quiz
const QuizResult = ({ result, lesson, quiz, onRetry, onNext, onAnalyze, analysis, analyzing }) => {
  const percentage = Math.round(result.score);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Xuất sắc! 🎉";
    if (percentage >= 80) return "Rất tốt! 👍";
    if (percentage >= 70) return "Tốt! 👏";
    if (percentage >= 60) return "Đạt yêu cầu ✅";
    return "Cần ôn tập thêm 💪";
  };

  const getPerformanceColor = () => {
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  const getPerformanceIcon = () => {
    if (percentage >= 80) return "fa-trophy";
    if (percentage >= 60) return "fa-star";
    return "fa-redo";
  };

  return (
    <div className="quiz-result card shadow-lg border-0">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="card-title mb-0 text-dark">
            <i className="fas fa-chart-line text-primary me-2"></i>
            Kết quả bài kiểm tra
          </h4>
          <span className="badge bg-primary fs-6">
            {result.timeSpent} phút
          </span>
        </div>
      </div>
      
      <div className="card-body">
        {/* Score Circle */}
        <div className="text-center mb-4">
          <div className="position-relative d-inline-block">
            <div className={`score-circle mx-auto mb-3  bg-opacity-10`}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `6px solid var(--bs-${getPerformanceColor()})`,
                position: 'relative'
              }}>
              <div className="text-center">
                <i className={`fas ${getPerformanceIcon()} text-${getPerformanceColor()} mb-2`} style={{fontSize: '1.5rem'}}></i>
                <h2 className={`mb-0 text-${getPerformanceColor()}`} style={{fontWeight: 'bold', fontSize: '2rem'}}>
                  {percentage}%
                </h2>
                <small className="text-muted">Điểm số</small>
              </div>
            </div>
          </div>
          
          <h4 className={`text-${getPerformanceColor()} mb-2`}>
            {getPerformanceMessage()}
          </h4>
          <p className="text-muted mb-3">
            <i className="fas fa-check-circle text-success me-1"></i>
            {result.correctAnswers}/{result.totalQuestions} câu đúng
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <span className="small text-muted">Tiến độ hoàn thành</span>
            <span className="small text-muted">{percentage}%</span>
          </div>
          <div className="progress" style={{height: '8px'}}>
            <div 
              className={`progress-bar bg-${getPerformanceColor()}`}
              style={{width: `${percentage}%`}}
            ></div>
          </div>
        </div>

        {/* Result Details */}
        <div className="result-details mb-4">
          <h5 className="mb-3 text-dark d-flex align-items-center">
            <i className="fas fa-list-check text-primary me-2"></i>
            Chi tiết kết quả
          </h5>
          <div className="row g-2">
            {result.results.map((item, index) => (
              <div key={index} className="col-12">
                <div className={`d-flex align-items-center p-3 rounded ${item.isCorrect ? ' bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                  <div className="flex-shrink-0">
                    <i className={`fas ${item.isCorrect ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-3`} style={{fontSize: '1.2rem'}}></i>
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-1 fw-medium">
                      Câu {index + 1}: {item.isCorrect ? 'Đúng' : 'Sai'}
                    </p>
                    {!item.isCorrect && quiz.exercises[index] && (
                      <p className="mb-0 small text-muted">
                        <span className="fw-medium">Đáp án đúng:</span> {quiz.exercises[index].question_type === 'multiple_choice' && quiz.exercises[index].options ? quiz.exercises[index].options[item.correctAnswer] : item.correctAnswer}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`badge bg-${item.isCorrect ? 'success' : 'danger'}`}>
                      {item.isCorrect ? '+1' : '0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons d-grid gap-3">
          <div className="row g-2">
            <div className="col-md-6">
              <button onClick={onRetry} className="btn btn-outline-primary w-100 py-2">
                <i className="fas fa-redo me-2"></i>Làm lại
              </button>
            </div>
            <div className="col-md-6">
              <button onClick={onNext} className="btn btn-primary w-100 py-2">
                <i className="fas fa-arrow-right me-2"></i>Bài tiếp theo
              </button>
            </div>
          </div>
          
          {!analysis && (
            <button onClick={onAnalyze} className="btn btn-info w-100 py-2" disabled={analyzing}>
              {analyzing ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Đang phân tích...</>
              ) : (
                <><i className="fas fa-robot me-2"></i> Phân tích AI</>
              )}
            </button>
          )}
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="ai-analysis mt-4">
            <h5 className="mb-3 text-dark d-flex align-items-center">
              <i className="fas fa-brain text-info me-2"></i>
              Phân tích từ AI
            </h5>
            <div className="card bg-light border-0">
              <div className="card-body">
                <div className="analysis-content" 
                  style={{lineHeight: '1.6', maxHeight: '300px', overflowY: 'auto'}}
                  dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component tài nguyên bổ sung
const LessonResources = ({ lesson }) => (
  <div className="card shadow-sm border-0 mb-4">
    <div className="card-header bg-transparent border-0 pb-2">
      <h6 className="card-title mb-0 d-flex align-items-center text-primary">
        <i className="fas fa-bookmark me-2"></i>
        Tài nguyên bài học
      </h6>
    </div>
    <div className="card-body pt-0">
      {lesson.pronunciation_audio && (
        <div className="resource-item mb-3">
          <h6 className="small fw-bold text-dark mb-2">
            <i className="fas fa-volume-up text-success me-1"></i>
            Phát âm
          </h6>
          <div className="audio-player">
            <audio controls className="w-100 rounded" style={{height: '40px'}}>
              <source src={lesson.pronunciation_audio} type="audio/mpeg" />
              Trình duyệt không hỗ trợ phát audio.
            </audio>
          </div>
        </div>
      )}

      {lesson.example_image && (
        <div className="resource-item mb-3">
          <h6 className="small fw-bold text-dark mb-2">
            <i className="fas fa-image text-info me-1"></i>
            Hình ảnh minh họa
          </h6>
          <img 
            src={lesson.example_image} 
            alt="Example" 
            className="img-fluid rounded shadow-sm"
            style={{maxHeight: '200px', objectFit: 'cover', width: '100%'}}
          />
        </div>
      )}

      {lesson.tags && lesson.tags.length > 0 && (
        <div className="resource-item">
          <h6 className="small fw-bold text-dark mb-2">
            <i className="fas fa-tags text-warning me-1"></i>
            Tags
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {lesson.tags.map((tag, index) => (
              <span key={index} className="badge bg-light text-dark border px-3 py-2">
                <i className="fas fa-hashtag me-1 small"></i>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Component bài học liên quan
const RelatedLessons = ({ topicId, currentLessonId }) => {
  const [relatedLessons, setRelatedLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const getDifficultyText = (difficulty) => {
    const texts = {
      easy: 'Cơ bản',
      medium: 'Trung bình',
      hard: 'Nâng cao'
    };
    return texts[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger'
    };
    return colors[difficulty] || 'secondary';
  };

  useEffect(() => {
    fetchRelatedLessons();
  }, [topicId]);

  const fetchRelatedLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/grammar/topics/${topicId}/lessons`);
      // FIX: API trả về object {lessons: []}, không phải array trực tiếp
      const data = Array.isArray(response.data) ? response.data : response.data.lessons || [];
      const lessons = data.filter(lesson => lesson.id !== parseInt(currentLessonId));
      setRelatedLessons(lessons.slice(0, 3));
    } catch (error) {
      console.error("Error fetching related lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          <p className="small text-muted mt-2 mb-0">Đang tải bài học liên quan...</p>
        </div>
      </div>
    );
  }

  if (relatedLessons.length === 0) {
    return null;
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-transparent border-0 pb-2">
        <h6 className="card-title mb-0 d-flex align-items-center text-primary">
          <i className="fas fa-book-open me-2"></i>
          Bài học liên quan
        </h6>
      </div>
      <div className="card-body pt-0">
        <div className="list-group list-group-flush">
          {relatedLessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/grammar/learn/${lesson.id}`}
              className="list-group-item list-group-item-action border-0 px-0 py-3"
            >
              <div className="d-flex align-items-start">
                <div className="flex-grow-1 me-2">
                  <h6 className="mb-1 text-dark fw-medium">{lesson.title}</h6>
                  <p className="small text-muted mb-1 line-clamp-2">{lesson.description}</p>
                  <div className="d-flex align-items-center">
                    <span className={`badge bg-${getDifficultyColor(lesson.difficulty_level)} bg-opacity-10 text-${getDifficultyColor(lesson.difficulty_level)} me-2`}>
                      {getDifficultyText(lesson.difficulty_level)}
                    </span>
                    <span className="small text-muted">
                      <i className="fas fa-clock me-1"></i>
                      10 phút
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <i className="fas fa-chevron-right text-muted"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrammarLearning;