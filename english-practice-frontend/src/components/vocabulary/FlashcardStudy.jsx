import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import "../assets/css/flashcard.css";
const FlashcardStudy = ({ isAuthenticated }) => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState("new"); // new, review, mastered
  const [sessionCards, setSessionCards] = useState([]);
  const [sessionProgress, setSessionProgress] = useState([]);

  // Hàm lấy đường dẫn audio đúng
  const getAudioSrc = (audioPath) => {
    if (!audioPath) {
      return "";
    }
    if (audioPath.startsWith("http")) {
      return audioPath;
    }
    return `http://localhost:5000${audioPath}`;
  };

  // Tải bộ thẻ và tiến độ học
  useEffect(() => {
    if (collectionId) {
      fetchCollectionAndCards();
    }
  }, [collectionId]);

  // Hàm tải bộ thẻ và tiến độ học
  const fetchCollectionAndCards = async () => {
    try {
      const [collectionRes, progressRes] = await Promise.all([
        api.get(`/vocabulary/collections/${collectionId}`),
        isAuthenticated
          ? api.get(
              `/vocabulary/learning/progress?collection_id=${collectionId}`
            )
          : Promise.resolve({ data: [] }),
      ]);

      setCollection(collectionRes.data);

      // Always show all flashcards in the collection for study, ignoring progress.
      const studySession = collectionRes.data.flashcards;
      setSessionCards(studySession);

      setFlashcards(collectionRes.data.flashcards);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu học tập");
      setLoading(false);
    }
  };

  // Xử lý lật thẻ
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Xử lý đánh giá mức độ nhớ
  const handleRating = async (difficulty) => {
    if (!isAuthenticated) {
      toast.info("Đăng nhập để lưu tiến độ học tập");
      // Vẫn cho phép học tiếp dù chưa đăng nhập
      goToNextCard([]);
      return;
    }

    // Cập nhật tiến độ học
    const currentCard = sessionCards[currentIndex];
    let confidenceLevel = 50;

    switch (difficulty) {
      case "easy":
        confidenceLevel = 90;
        break;
      case "medium":
        confidenceLevel = 70;
        break;
      case "hard":
        confidenceLevel = 30;
        break;
      default:
        confidenceLevel = 50;
    }

    const newProgress = [
      ...sessionProgress,
      {
        flashcard_id: currentCard.id,
        confidence_level: confidenceLevel,
        status: confidenceLevel >= 80 ? "mastered" : "learning",
      },
    ];
    setSessionProgress(newProgress);

    goToNextCard(newProgress);
  };

  // Chuyển đến thẻ tiếp theo hoặc kết thúc buổi học
  const goToNextCard = (currentProgress) => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Kết thúc session
      toast.success("Chúc mừng! Bạn đã hoàn thành buổi học này!");
      navigate(`/vocabulary-collections/${collectionId}/self-test`, {
        state: { sessionProgress: currentProgress },
      });
    }
  };

  // Xử lý phím tắt
  const handleKeyPress = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      handleFlip();
    } else if (isFlipped) {
      switch (e.code) {
        case "Digit1":
        case "KeyH":
          handleRating("hard");
          break;
        case "Digit2":
        case "KeyM":
          handleRating("medium");
          break;
        case "Digit3":
        case "KeyE":
          handleRating("easy");
          break;
      }
    }
  };

  // Đăng ký sự kiện phím tắt
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isFlipped, currentIndex]);

  useEffect(() => {
    const card = sessionCards[currentIndex];
    if (card && card.pronunciation_audio) {
      const audio = new Audio(getAudioSrc(card.pronunciation_audio));
      audio.addEventListener('loadeddata', () => {
        audio.play().catch(err => console.error("Audio play failed", err));
      });
    }
  }, [currentIndex, sessionCards]);


  if (!collection || sessionCards.length === 0) {
    return (
      <div className="flashcard-study-container">
        <div className="container">
          <div className="no-cards text-center">
            <i className="fas fa-check-circle"></i>
            <h3>Không có thẻ nào cần học</h3>
            <p className="text-white text-center">
              Tất cả các từ trong bộ này đã được ôn tập hoặc không có thẻ nào để
              học.
            </p>
            <Link
              to={`/vocabulary-collections/${collectionId}`}
              className="btn btn-primary"
            >
              Quay lại bộ từ vựng
            </Link>    
          </div>
        </div>
      </div>
    );
  }

  const currentCard = sessionCards[currentIndex];
  const progress = ((currentIndex / sessionCards.length) * 100).toFixed(1);

  const playAudio = (e) => {
    e.stopPropagation();
    if (currentCard.pronunciation_audio) {
      const audio = new Audio(getAudioSrc(currentCard.pronunciation_audio));
      audio.play().catch((err) => console.error("Audio play failed:", err));
    }
  };

  return (
    <div className="flashcard-study-container">
      <div className="container">
        <div className="study-header">
          <Link
            to={`/vocabulary-collections/${collectionId}`}
            className="back-btn"
          >
            <i className="fas fa-arrow-left"></i> Quay lại
          </Link>
          <h1>{collection.title}</h1>
          <div className="progress-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>
              {currentIndex + 1} / {sessionCards.length} ({100 - progress}% còn
              lại)
            </span>
          </div>
        </div>

        <div className="flashcard-area">
          <div
            className={`flashcard ${isFlipped ? "flipped" : ""}`}
            onClick={handleFlip}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="card-content">
                  <h2>{currentCard.word}</h2>
                  <p className="pronunciation">
                    {currentCard.pronunciation}
                    {currentCard.pronunciation_audio && (
                      <button
                        className="btn-play-audio"
                        onClick={playAudio}
                        title="Nghe phát âm"
                      >
                        <i className="fas fa-volume-up"></i>
                      </button>
                    )}
                  </p>
                  <div className="hint">
                    <i className="fas fa-mouse"></i> Click hoặc <kbd>Space</kbd>{" "}
                    để lật thẻ
                  </div>
                </div>
              </div>
              <div className="flashcard-back">
                <div className="card-content">
                  <h2>{currentCard.word}</h2>
                  <p className="pronunciation">
                    {currentCard.pronunciation}
                    {currentCard.pronunciation_audio && (
                      <button
                        className="btn-play-audio"
                        onClick={playAudio}
                        title="Nghe phát âm"
                      >
                        <i className="fas fa-volume-up"></i>
                      </button>
                    )}
                  </p>
                  <p className="meaning">{currentCard.meaning}</p>

                  {currentCard.part_of_speech && (
                    <div className="part-of-speech">
                      <span className="pos-tag">
                        {currentCard.part_of_speech}
                      </span>
                    </div>
                  )}

                  {currentCard.example_sentence && (
                    <div className="example">
                      <p className="example-sentence">
                        "{currentCard.example_sentence}"
                      </p>
                      {currentCard.example_meaning && (
                        <p className="example-meaning">
                          {currentCard.example_meaning}
                        </p>
                      )}
                    </div>
                  )}

                  {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                    <div className="synonyms">
                      <strong>Từ đồng nghĩa:</strong>{" "}
                      {currentCard.synonyms.join(", ")}
                    </div>
                  )}

                  <div className="hint">Đánh giá mức độ nhớ của bạn</div>
                </div>
              </div>
            </div>
          </div>

          {isFlipped && (
            <div className="rating-buttons">
              <div className="buttons">
                <button
                  className="btn btn-hard"
                  onClick={() => handleRating("hard")}
                  title="Khó - Phím H hoặc 1"
                >
                  <i className="fas fa-times"></i> Khó
                </button>
                <button
                  className="btn btn-medium"
                  onClick={() => handleRating("medium")}
                  title="Bình thường - Phím M hoặc 2"
                >
                  <i className="fas fa-minus"></i> Bình thường
                </button>
                <button
                  className="btn btn-easy"
                  onClick={() => handleRating("easy")}
                  title="Dễ - Phím E hoặc 3"
                >
                  <i className="fas fa-check"></i> Dễ
                </button>
              </div>
              <div className="shortcut-hints">
                <span>
                  <kbd>H</kbd> Khó
                </span>
                <span>
                  <kbd>M</kbd> Bình thường
                </span>
                <span>
                  <kbd>E</kbd> Dễ
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="study-stats">
          <div className="stat-item">
            <span className="stat-label">Thẻ mới:</span>
            <span className="stat-value">
              {sessionCards.filter((card) => !card.progress).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cần ôn tập:</span>
            <span className="stat-value">
              {sessionCards.filter((card) => card.progress).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStudy;
