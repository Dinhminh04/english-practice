import React from "react";
import Markdown from "react-markdown";
import "./assets/css/aiAnalysis.css";

// Hiển thị phần phân tích của AI (markdown) theo cùng một giao diện trên mọi trang.
// react-markdown không render HTML thô, nên an toàn hơn dangerouslySetInnerHTML.
const AiAnalysis = ({ text }) => (
  <div className="ai-analysis-markdown">
    <Markdown>{text}</Markdown>
  </div>
);

export default AiAnalysis;
