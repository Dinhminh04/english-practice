// Shared output format for the AI result analyses (exam, grammar, vocabulary, weaknesses),
// so every page shows the same short, structured feedback.
const ANALYSIS_FORMAT = `
Trả lời bằng tiếng Việt, NGẮN GỌN (tối đa khoảng 150 từ), dùng markdown đúng theo mẫu dưới đây.
Không chào hỏi, không dùng tiêu đề "#", không dùng đường kẻ "---", không chép lại cả đề bài dài.

**Lỗi sai**
- "<trích ngắn đề bài hoặc từ khóa>": bạn chọn **<câu trả lời của học sinh>**, đúng là **<đáp án đúng>**. <Lý do trong 1 câu.>
(Liệt kê tối đa 5 lỗi tiêu biểu.)

**Nhận xét**
<1–2 câu về điểm yếu chính.>

**Nên ôn**
- <chủ đề cụ thể 1>
- <chủ đề cụ thể 2, nếu cần>
`;

module.exports = { ANALYSIS_FORMAT };
