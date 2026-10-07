const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

// Tạo queue cho email jobs
const emailQueue = [];
let isProcessing = false;

// Hàm xử lý email queue
const processEmailQueue = async () => {
  if (isProcessing || emailQueue.length === 0) return;

  isProcessing = true;

  while (emailQueue.length > 0) {
    const emailJob = emailQueue.shift();
    try {
      await sendEmail(emailJob.to, emailJob.subject, emailJob.html);
      console.log(`Email đã gửi đến: ${emailJob.to}`);
    } catch (error) {
      console.error(`Không thể gửi email đến: ${emailJob.to}`, error);
    }
  }

  isProcessing = false;
};

// Đăng ký
const register = async (req, res) => {
  const { email, phone, password } = req.body;

  // Kiểm tra định dạng email
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Email không đúng định dạng" });
  }
  // Kiểm tra định dạng số điện thoại nếu có nhập
  if (!isValidPhone(phone)) {
    return res
      .status(400)
      .json({ message: "Số điện thoại không đúng định dạng" });
  }

  try {
    // Kiểm tra người dùng đã tồn tại chưa
    const [existingUser] = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Người dùng đã tồn tại" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo token xác thực
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Lưu người dùng vào cơ sở dữ liệu
    const newUser = {
      email,
      phone,
      password: hashedPassword,
      verification_token: verificationToken,
      role: "user",
    };

    await User.create(newUser);

    // Gửi email xác thực qua queue
    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Chào mừng đến với English Learning!</h2>
        <p>Cảm ơn bạn đã tham gia nền tảng của chúng tôi. Để bắt đầu luyện tập và cải thiện kỹ năng tiếng Anh, vui lòng xác minh địa chỉ email của bạn.</p>
        <p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                    color: #fff; text-decoration: none; border-radius: 5px;">
            Xác minh Email của tôi
          </a>
        </p>
        <p>Nếu nút ở trên không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
        <p><a href="${verificationUrl}" style="color: #4CAF50;">${verificationUrl}</a></p>
        <hr />
        <p style="font-size: 12px; color: #777;">
          Chúc bạn học tập vui vẻ,<br/>
Đội ngũ Học tiếng Anh
        </p>
      </div>
    `;

    emailQueue.push({
      to: email,
      subject: "Verify your email",
      html: emailHtml,
    });
    processEmailQueue();

    // Trả về response NGAY LẬP TỨC
    res.status(201).json({
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email của bạn để xác minh.",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

// Hàm kiểm tra định dạng email
function isValidEmail(email) {
  // Regex đơn giản cho email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Hàm kiểm tra định dạng số điện thoại (Việt Nam hoặc quốc tế, tối thiểu 9 số)
function isValidPhone(phone) {
  if (!phone) return true; // Cho phép bỏ trống
  // Chỉ nhận số, có thể bắt đầu bằng +, 0, hoặc không
  return /^(\+?\d{9,15})$/.test(phone);
}

// Xác thực email
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  console.log("Đã nhận được mã thông báo xác minh:", token);

  try {
    // Dùng async/await thay vì callback
    const results = await User.findByVerificationToken(token);

    if (results.length === 0) {
      return res.status(400).send(`
        <div style="font-family: Arial; color: #c00; text-align: center; margin-top: 50px;">
          <h2>Xác minh không thành công</h2>
          <p>Mã xác minh không hợp lệ hoặc đã hết hạn.</p>
          <a href="http://localhost:3000/login"></a>
        </div>
      `);
    }

    const user = results[0];

    // Cập nhật trạng thái xác thực
    await User.updateVerificationStatus(user.id);

    return res.send(`
      <div style="font-family: Arial; color: #090; text-align: center; margin-top: 50px;">
        <h2>Email đã được xác minh thành công!</h2>
        <p>Email của bạn đã được xác minh. Bây giờ bạn có thể đăng nhập và bắt đầu học tiếng Anh.</p>
        <a href="http://localhost:3000/login">Đi đến Đăng nhập</a>
      </div>
    `);
  } catch (error) {
    console.error("Lỗi cơ sở dữ liệu:", error);
    res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error });
  }
};

// Đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await User.findByEmail(email);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hợp lệ" });
    }

    // Kiểm tra email đã xác thực chưa
    if (!user.is_verified) {
      return res
        .status(400)
        .json({ message: "Vui lòng xác minh email của bạn trước" });
    }

    // Tạo JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role, // Đảm bảo trả về role
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};
// Quên mật khẩu
// Quên mật khẩu - Tối ưu hóa
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.time("findUserByEmail");
    const results = await User.findByEmail(email);
    console.timeEnd("findUserByEmail");

    if (results.length === 0) {
      // Trả về thành công ngay cả khi không tìm thấy email (bảo mật)
      return res.json({
        message: "Nếu email tồn tại, liên kết đặt lại đã được gửi",
      });
    }

    const user = results[0];

    // Tạo token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 giờ

    console.time("updateResetToken");
    await User.updateResetPasswordToken(user.id, token, expires);
    console.timeEnd("updateResetToken");

    // Tạo email content
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào nút bên dưới để tiếp tục:</p>
        <p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                    color: #fff; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Nếu nút trên không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
        <p><a href="${resetUrl}" style="color: #4CAF50;">${resetUrl}</a></p>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <hr />
        <p style="font-size: 12px; color: #777;">
          Nếu bạn không yêu cầu thiết lập lại này, vui lòng bỏ qua email này.<br/>
          Nhóm học tiếng Anh
        </p>
      </div>
    `;

    // Thêm email vào queue và phản hồi ngay lập tức
    emailQueue.push({
      to: email,
      subject: "Đặt lại mật khẩu của bạn",
      html: emailHtml,
    });

    // Khởi động xử lý queue
    processEmailQueue();

    res.json({ message: "Nếu email tồn tại, liên kết đặt lại đã được gửi" });
  } catch (error) {
    console.error("Lỗi trong forgetPassword:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

// Reset mật khẩu
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // Tìm user bằng token (dùng async/await)
    const results = await User.findByResetPasswordToken(token);

    // Kiểm tra token hợp lệ
    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: "Mã thông báo không hợp lệ hoặc hết hạn" });
    }

    const user = results[0];

    // Xác thực mật khẩu (ví dụ: độ dài tối thiểu)
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải từ 6 ký tự trở lên" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Cập nhật mật khẩu và xóa token (dùng async/await)
    await User.updatePassword(user.id, hashedPassword);

    res.json({ message: "Mật khất đã được đặt lại thành công!" });
  } catch (error) {
    console.error("Lỗi trong resetPassword:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
};
