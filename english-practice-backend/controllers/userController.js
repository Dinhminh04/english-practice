const User = require("../models/userModel");
const { Exam, ExamResult, ExamSubmission, Question } = require("../models/examModel");
const { Grammar } = require("../models/grammarModel");
const { Vocabulary } = require("../models/vocabularyModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const users = await User.findById(userId);
    const user = users && users[0];

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json({
      display_name: user.display_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      learning_goal: user.learning_goal,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { display_name, phone, learning_goal } = req.body;

    let avatarPath = null;
    if (req.file) {
      avatarPath = "/uploads/avatars/" + req.file.filename;
    }

    const updatedData = {
      display_name,
      phone,
      learning_goal,
    };

    if (avatarPath) {
      updatedData.avatar = avatarPath;
    }

    const result = await User.updateProfile(userId, updatedData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const updatedUsers = await User.findById(userId);
    const updatedUser = updatedUsers && updatedUsers[0];

    res.json({
      message: "Cập nhật thông tin thành công",
      user: {
        display_name: updatedUser.display_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        learning_goal: updatedUser.learning_goal,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải từ 6 ký tự" });
    }

    const users = await User.findById(userId);
    const user = users && users[0];
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(userId, hashedPassword);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getLearningHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const examHistory = await Exam.getHistoryByUserId(userId);
    const grammarHistory = await Grammar.getHistoryByUserId(userId);
    const vocabularyHistory = await Vocabulary.getHistoryByUserId(userId);

    res.json({
      examHistory,
      grammarHistory,
      vocabularyHistory,
    });
  } catch (error) {
    console.error("Error fetching learning history:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getWeaknesses = async (req, res) => {
  console.log("Starting getWeaknesses");
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      console.error("userId is undefined");
      return res.status(500).json({ message: "Lỗi server" });
    }
    console.log(`Fetching exam history for user: ${userId}`);
    const examHistory = await ExamResult.findExamResultsByUserId(userId);
    console.log(`Found ${examHistory.length} exam results.`);

    if (!examHistory || examHistory.length === 0) {
      return res.json({
        analysis: "Chưa có đủ dữ liệu để phân tích. Hãy làm một vài bài kiểm tra trước!",
      });
    }

    let allIncorrectAnswers = [];

    for (const result of examHistory) {
      if (!result.id || !result.exam_id) {
        console.error("result.id or result.exam_id is undefined", result);
        continue;
      }
      console.log(`Processing result ID: ${result.id}`);
      const [submissionRows] = await ExamSubmission.findByResultId(result.id);
      const [questionRows] = await Question.findByExamId(result.exam_id);

      const questions = questionRows.map((q) => {
        let correctAnswerObject = {};
        if (q.correct_answer) {
          try {
            correctAnswerObject = JSON.parse(JSON.parse(q.correct_answer));
          } catch (e) {
            try {
              correctAnswerObject = JSON.parse(q.correct_answer);
            } catch (e2) {
              correctAnswerObject = {};
            }
          }
        }

        let optionsArray = [];
        if (q.options) {
          try {
            optionsArray = JSON.parse(JSON.parse(q.options));
          } catch (e) {
            try {
              optionsArray = JSON.parse(q.options);
            } catch (e2) {
              optionsArray = [];
            }
          }
        }

        return {
          ...q,
          options: optionsArray,
          correct_answer: correctAnswerObject,
        };
      });

      const incorrectSubmissions = submissionRows.filter((sub) => !sub.is_correct);

      for (const sub of incorrectSubmissions) {
        const question = questions.find((q) => q.id === sub.question_id);
        if (question) {
          allIncorrectAnswers.push({ ...question, user_answer: sub.user_answer });
        }
      }
    }

    console.log(`Found ${allIncorrectAnswers.length} incorrect answers.`);

    if (allIncorrectAnswers.length === 0) {
      return res.json({
        analysis: "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi trong lịch sử làm bài của mình.",
      });
    }

    console.log("Calling Gemini API");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy phân tích điểm yếu của học sinh dựa trên lịch sử các câu trả lời sai và đưa ra gợi ý học tập cá nhân hóa.
      Dưới đây là danh sách các câu hỏi học sinh đã trả lời sai từ nhiều bài thi khác nhau:

      ${allIncorrectAnswers
        .map((q, index) => {
          const userAnswerText = q.options[q.user_answer] || q.user_answer;
          const correctAnswerText = q.options[q.correct_answer.answer] || JSON.stringify(q.correct_answer);
          return `
        Câu ${index + 1}:
        - Đề bài: ${q.question_text}
        - Các lựa chọn: ${JSON.stringify(q.options)}
        - Câu trả lời của học sinh: "${userAnswerText}"
        - Đáp án đúng: "${correctAnswerText}"
        - Loại câu hỏi: ${q.question_type}
      `;
        })
        .join(`\n`)}

      Yêu cầu:
      1. Phân tích tổng quan các lỗi sai và xác định các điểm yếu chính của học sinh (ví dụ: yếu về thì quá khứ đơn, nhầm lẫn giới từ, từ vựng về chủ đề công việc, v.v.).
      2. Đưa ra các gợi ý học tập cụ thể để khắc phục các điểm yếu này. Ví dụ: \"Bạn nên tập trung vào các bài học về thì hiện tại hoàn thành\" hoặc \"Hãy học thêm các từ vựng thuộc chủ đề gia đình.\"
      3. Gợi ý một vài bài học hoặc chủ đề cụ thể có trong hệ thống để học sinh có thể truy cập ngay.
      4. Trình bày kết quả dưới dạng markdown, rõ ràng, dễ hiểu.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = await response.text();

    res.json({ analysis });
  } catch (error) {
    console.error("Error getting weaknesses:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getLearningHistory,
  getWeaknesses,
};