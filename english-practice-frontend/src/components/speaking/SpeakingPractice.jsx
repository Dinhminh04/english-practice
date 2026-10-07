import React, { useState, useRef, useEffect } from 'react';
import api from '../../api';
import '../assets/css/speakingpractice.css';

const SpeakingPractice = () => {
    const [topic, setTopic] = useState('');
    const [isLoadingTopic, setIsLoadingTopic] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const recognitionRef = useRef(null);

    const getNewTopic = async () => {
        setIsLoadingTopic(true);
        setTopic('');
        setTranscription('');
        setEvaluation(null);
        try {
            const response = await api.get('/speaking/topic');
            // only treat success when we have a 2xx and a non-empty topic
            if (response && response.status >= 200 && response.status < 300 && response.data && response.data.topic) {
                setTopic(response.data.topic);
            } else {
                console.warn('Unexpected speaking/topic response:', response);
                alert('Không thể tải chủ đề mới. Vui lòng thử lại.');
            }
        } catch (error) {
            // Log detailed info for debugging; show user-friendly alert only when needed
            console.error('Error getting new topic:', error.response ? {
                status: error.response.status,
                data: error.response.data
            } : error.message);
            // If call failed due to auth (401) you may want to redirect to login instead of generic alert
            alert('Không thể tải chủ đề mới. Vui lòng thử lại.');
        } finally {
            setIsLoadingTopic(false);
        }
    };

    useEffect(() => {
        getNewTopic();
    }, []);

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.");
            return;
        }

        setTranscription('');
        setEvaluation(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
        };

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            setTranscription(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Vui lòng cho phép sử dụng microphone để ghi âm.');
            }
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleEvaluate = async () => {
        if (!transcription.trim()) {
            alert('Bạn chưa nói gì cả. Vui lòng ghi âm trước khi đánh giá.');
            return;
        }
        setIsEvaluating(true);
        setEvaluation(null);
        try {
            const response = await api.post('/speaking/evaluate', {
                topic,
                transcription,
            });
            setEvaluation(response.data);
        } catch (error) {
            console.error('Error evaluating speaking:', error);
            alert('Không thể đánh giá bài nói. Vui lòng thử lại.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const renderScore = (score) => {
        const percentage = score * 10;
        let colorClass = '';
        if (percentage >= 80) colorClass = 'high';
        else if (percentage >= 50) colorClass = 'medium';
        else colorClass = 'low';
        return (
            <div className={`score-bar-container ${colorClass}`}>
                <div className="score-bar" style={{ width: `${percentage}%` }}></div>
                <span>{score}/10</span>
            </div>
        );
    };

    return (
        <div className="speaking-practice-container">
            <div className="page-header">
                <h1 className="page-title">Luyện Nói Tiếng Anh</h1>
                <p className="page-subtitle">Nhận chủ đề, ghi âm bài nói và để AI chấm điểm</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Chủ đề của bạn</h2>
                    <button onClick={getNewTopic} disabled={isLoadingTopic || isRecording} className="btn btn-primary">
                        {isLoadingTopic ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                        <span>Chủ đề mới</span>
                    </button>
                </div>
                <div className="card-body topic-section">
                    {isLoadingTopic ? (
                        <p>Đang tải chủ đề...</p>
                    ) : (
                        <p className="topic-text">{topic}</p>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Bài nói của bạn</h2>
                </div>
                <div className="card-body recording-section">
                    <button onClick={handleToggleRecording} className={`btn-record ${isRecording ? 'recording' : ''}`} disabled={!topic || isLoadingTopic}>
                        <i className={`fas ${isRecording ? 'fa-stop-circle' : 'fa-microphone'}`}></i>
                        <span>{isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</span>
                    </button>
                    <div className="transcription-box">
                        {transcription || <span className="placeholder">Bản ghi âm của bạn sẽ xuất hiện ở đây...</span>}
                    </div>
                    <button onClick={handleEvaluate} disabled={isEvaluating || isRecording || !transcription} className="btn btn-success btn-evaluate">
                        {isEvaluating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                        <span>Chấm điểm</span>
                    </button>
                </div>
            </div>

            {isEvaluating && (
                <div className="card evaluation-loading">
                    <div className="card-body">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>AI đang chấm điểm bài nói của bạn, vui lòng chờ trong giây lát...</p>
                    </div>
                </div>
            )}

            {evaluation && (
                <div className="card evaluation-result">
                    <div className="card-header">
                        <h2 className="card-title">Kết quả đánh giá</h2>
                    </div>
                    <div className="card-body">
                        <div className="overall-score">
                            <h3>Điểm tổng kết</h3>
                            <div className="score-circle">
                                <span>{evaluation.overallScore}</span>/10
                            </div>
                        </div>
                        <div className="detailed-scores">
                            <h3>Điểm chi tiết</h3>
                            <div className="score-item">
                                <span className="score-label">Độ trôi chảy</span>
                                {renderScore(evaluation.scores.fluency)}
                            </div>
                            <div className="score-item">
                                <span className="score-label">Ngữ pháp</span>
                                {renderScore(evaluation.scores.grammar)}
                            </div>
                            <div className="score-item">
                                <span className="score-label">Từ vựng</span>
                                {renderScore(evaluation.scores.vocabulary)}
                            </div>
                            <div className="score-item">
                                <span className="score-label">Phát âm</span>
                                {renderScore(evaluation.scores.pronunciation)}
                            </div>
                        </div>
                        <div className="feedback-section">
                            <h3>Nhận xét chi tiết</h3>
                            <p>{evaluation.feedback}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeakingPractice;
