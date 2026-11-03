import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";
import "./assets/css/ChatAI.css";
import api from "../api";

const WELCOME_MESSAGE = {
  text: "Xin chào! Tôi là trợ lý EnglishMaster. Tôi biết tiến độ học của bạn, có thể chỉ ra điểm yếu, giải thích lỗi sai trong bài thi, tra từ vựng và gợi ý bài học tiếp theo.",
  sender: "ai",
};

// Câu hỏi gợi ý nhanh khi bắt đầu cuộc trò chuyện
const SUGGESTIONS = [
  "Điểm yếu của tôi là gì?",
  "Hôm nay tôi nên học gì?",
  "Giải thích lỗi sai bài thi gần nhất",
  "Từ nào tôi cần ôn hôm nay?",
];

// Link nội bộ (/grammar/...) chuyển trang trong ứng dụng, link ngoài mở tab mới
const MarkdownLink = ({ href = "", children }) =>
  href.startsWith("/") ? (
    <Link to={href}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );

const ChatAI = () => {
  // Trạng thái của chat bot
  const [isOpen, setIsOpen] = useState(false);
  // Danh sách tin nhắn
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // Lịch sử cuộc trò chuyện
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const recognitionRef = useRef(null);

  const isLoggedIn = () => Boolean(localStorage.getItem("token"));

  // Lấy danh sách cuộc trò chuyện
  const fetchConversations = async () => {
    const response = await api.get("/chat/conversations");
    setConversations(response.data.conversations);
    return response.data.conversations;
  };

  // Mở một cuộc trò chuyện cũ
  const openConversation = async (id) => {
    try {
      const response = await api.get(`/chat/conversations/${id}/messages`);
      const loaded = response.data.messages.map((m) => ({
        text: m.content,
        sender: m.role === "user" ? "user" : "ai",
      }));
      setConversationId(id);
      setMessages([WELCOME_MESSAGE, ...loaded]);
      setShowHistory(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Lần đầu mở chat: tải cuộc trò chuyện gần nhất
  useEffect(() => {
    if (!isOpen || historyLoaded || !isLoggedIn()) return;
    setHistoryLoaded(true);
    fetchConversations()
      .then((list) => {
        if (list.length > 0) openConversation(list[0].id);
      })
      .catch((error) => console.error("Error loading conversations:", error));
  }, [isOpen, historyLoaded]);

  // Chuyển đổi trạng thái mở/đóng chat bot
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Xử lý nhấn phím Enter để gửi tin nhắn
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text = input) => {
    if (text.trim() === "" || isLoading) return;

    if (!isLoggedIn()) {
      setMessages((prev) => [
        ...prev,
        { text: "Vui lòng đăng nhập để trò chuyện với trợ lý.", sender: "ai" },
      ]);
      return;
    }

    const userMessage = { text, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: text,
        conversation_id: conversationId,
      });
      const aiMessage = { text: response.data.reply, sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
      if (response.data.conversation_id !== conversationId) {
        setConversationId(response.data.conversation_id);
      }
      fetchConversations().catch(() => {});
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text:
          error.response?.data?.message ||
          "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý ghi âm giọng nói
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Hàm bắt đầu ghi âm
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.");
      return;
    }

    // Khởi tạo đối tượng nhận dạng giọng nói
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = false;
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
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setInput(finalTranscript || interimTranscript);
    };

    // Xử lý lỗi và kết thúc ghi âm
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);

      if (event.error === 'not-allowed') {
        alert('Vui lòng cho phép sử dụng microphone để ghi âm.');
      }
    };

    // Khi kết thúc ghi âm, gửi tin nhắn nếu có nội dung
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (input.trim()) {
        handleSendVoiceMessage(input);
      }
    };

    recognitionRef.current.start();
  };

  // Hàm dừng ghi âm
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Xử lý gửi tin nhắn thoại
  const handleSendVoiceMessage = async (voiceText) => {
    if (!voiceText.trim()) return;

    const userMessage = { text: voiceText, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat/voice-feedback", {
        transcription: voiceText
      });
      const aiMessage = { text: response.data.reply, sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending voice message:", error);
      const errorMessage = {
        text: "Xin lỗi, tôi không thể xử lý tin nhắn thoại của bạn.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    const messagesContainer = document.querySelector(".chat-ai-messages");
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  // Bắt đầu cuộc trò chuyện mới
  const startNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setShowHistory(false);
  };

  // Mở/đóng danh sách lịch sử
  const toggleHistory = () => {
    if (!showHistory && isLoggedIn()) {
      fetchConversations().catch((error) =>
        console.error("Error loading conversations:", error)
      );
    }
    setShowHistory(!showHistory);
  };

  // Xóa một cuộc trò chuyện
  const deleteConversation = async (id) => {
    if (!window.confirm("Xóa cuộc trò chuyện này?")) return;
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) startNewChat();
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <div className="chat-ai-container">
      <button onClick={toggleChat} className="chat-ai-button">
        <i className="fas fa-robot"></i>
      </button>
      {isOpen && (
        <div className="chat-ai-window">
          <div className="chat-ai-header">
            <div className="header-left">
              <h2>Trợ lý EnglishMaster</h2>
              <span className="status-indicator">● Đang hoạt động</span>
            </div>
            <div className="header-right">
              <button
                onClick={toggleHistory}
                className={`clear-chat-button ${showHistory ? "active" : ""}`}
                title="Lịch sử trò chuyện"
              >
                <i className="fas fa-clock-rotate-left"></i>
              </button>
              <button
                onClick={startNewChat}
                className="clear-chat-button"
                title="Cuộc trò chuyện mới"
              >
                <i className="fas fa-plus"></i>
              </button>
              <button onClick={toggleChat} className="close-chat-button">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="chat-ai-history">
              <div className="history-title">Lịch sử trò chuyện</div>
              {conversations.length === 0 ? (
                <div className="history-empty">Chưa có cuộc trò chuyện nào.</div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`history-item ${c.id === conversationId ? "active" : ""}`}
                  >
                    <button
                      className="history-open"
                      onClick={() => openConversation(c.id)}
                      title={c.title}
                    >
                      <span className="history-item-title">{c.title}</span>
                      <span className="history-item-date">
                        {new Date(c.updated_at).toLocaleString("vi-VN")}
                      </span>
                    </button>
                    <button
                      className="history-delete"
                      onClick={() => deleteConversation(c.id)}
                      title="Xóa"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="chat-ai-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.sender === "ai" ? (
                  <Markdown components={{ a: MarkdownLink }}>{msg.text}</Markdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {showSuggestions && (
              <div className="chat-ai-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="message ai loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-text">Trợ lý đang trả lời...</span>
              </div>
            )}
          </div>

          <div className="chat-ai-input">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? "Đang nghe..." : "Hỏi về bài học, từ vựng, điểm yếu..."}
              disabled={isLoading || isRecording}
              maxLength={2000}
            />
            <button
              onClick={handleToggleRecording}
              className={`record-button ${isRecording ? "recording" : ""}`}
              title={isRecording ? "Dừng ghi âm" : "Ghi âm"}
              disabled={isLoading}
            >
              <i className={`fas ${isRecording ? "fa-stop" : "fa-microphone"}`}></i>
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || input.trim() === "" || isRecording}
              className="send-button"
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse-animation"></div>
              <span>Đang ghi âm... Nói tiếng Anh vào microphone</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAI;
