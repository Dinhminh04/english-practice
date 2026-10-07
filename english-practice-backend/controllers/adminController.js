const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

const adminController = {
  // Lấy danh sách người dùng với phân trang và filter
  getUsers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role = "",
        is_verified = ""
      } = req.query;

      const offset = (page - 1) * limit;

      // Build query conditions
      let conditions = [];
      let params = [];

      if (search) {
        conditions.push("(email LIKE ? OR display_name LIKE ? OR phone LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (role) {
        conditions.push("role = ?");
        params.push(role);
      }

      if (is_verified !== "") {
        conditions.push("is_verified = ?");
        params.push(is_verified === "true");
      }

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(" AND ")}` 
        : "";

      // Query để lấy tổng số bản ghi
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0].total;

      // Query để lấy dữ liệu người dùng
      const dataQuery = `
        SELECT 
          id, email, phone, display_name, role, avatar,
          is_verified, created_at, updated_at, is_premium
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const dataParams = [...params, parseInt(limit), offset];
      const [users] = await pool.execute(dataQuery, dataParams);

      res.json({
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // Lấy thông tin chi tiết người dùng
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [users] = await pool.execute(
        `SELECT 
          id, email, phone, display_name, role, avatar,
          learning_goal, is_verified, created_at, updated_at
         FROM users WHERE id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      res.json({ user: users[0] });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // Tạo người dùng mới (admin)
  createUser: async (req, res) => {
    try {
      const { email, phone, password, display_name, role = "user" } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải từ 6 ký tự" });
      }

      // Kiểm tra email đã tồn tại
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Tạo user
      const query = `
        INSERT INTO users 
        (email, phone, password, display_name, role, is_verified) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(query, [
        email,
        phone || null,
        hashedPassword,
        display_name || null,
        role,
        true // Admin tạo user thì auto verify
      ]);

      // Lấy thông tin user vừa tạo
      const [newUsers] = await pool.execute(
        `SELECT 
          id, email, phone, display_name, role, avatar,
          is_verified, created_at 
         FROM users WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        message: "Tạo người dùng thành công",
        user: newUsers[0]
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, phone, display_name, role, learning_goal, is_verified, is_premium } = req.body;

      // Kiểm tra user tồn tại
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE id = ?",
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // Kiểm tra email trùng (nếu có thay đổi email)
      if (email) {
        const [emailUsers] = await pool.execute(
          "SELECT id FROM users WHERE email = ? AND id != ?",
          [email, id]
        );
        if (emailUsers.length > 0) {
          return res.status(400).json({ message: "Email đã được sử dụng" });
        }
      }

      // Build dynamic update query
      const updates = [];
      const params = [];

      if (email) { updates.push("email = ?"); params.push(email); }
      if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
      if (display_name !== undefined) { updates.push("display_name = ?"); params.push(display_name); }
      if (role) { updates.push("role = ?"); params.push(role); }
      if (learning_goal !== undefined) { updates.push("learning_goal = ?"); params.push(learning_goal); }
      if (is_verified !== undefined) { updates.push("is_verified = ?"); params.push(is_verified); }
      if (is_premium !== undefined) { updates.push("is_premium = ?"); params.push(is_premium); }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Không có trường nào để cập nhật" });
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);

      const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
      await pool.execute(query, params);

      // Lấy thông tin user đã cập nhật
      const [updatedUsers] = await pool.execute(
        `SELECT 
          id, email, phone, display_name, role, avatar,
          learning_goal, is_verified, created_at, updated_at
         FROM users WHERE id = ?`,
        [id]
      );

      res.json({
        message: "Cập nhật người dùng thành công",
        user: updatedUsers[0]
      });
    } catch (error) {
      console.error("Lỗi cập nhật người dùng:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // Xóa người dùng
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Không cho phép xóa chính mình
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: "Không thể xóa tài khoản của chính bạn" });
      }

      // Kiểm tra user tồn tại
      const [existingUsers] = await pool.execute(
        "SELECT id, role FROM users WHERE id = ?",
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      const user = existingUsers[0];

      // Không cho phép xóa superadmin (trừ khi là superadmin khác)
      if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Không thể xóa superadmin" });
      }

      // Xóa user (CASCADE sẽ xóa các bản ghi liên quan)
      await pool.execute("DELETE FROM users WHERE id = ?", [id]);

      res.json({ message: "Xóa người dùng thành công" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // Cập nhật trạng thái premium của người dùng
  updateUserPremiumStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isPremium } = req.body;

      if (typeof isPremium !== 'boolean') {
        return res.status(400).json({ message: 'isPremium phải là kiểu boolean' });
      }

      const result = await User.updatePremiumStatus(id, isPremium);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      res.json({ message: 'Cập nhật trạng thái premium thành công' });
    } catch (error) {
      console.error('Error updating user premium status:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // Thống kê người dùng
  getUserStats: async (req, res) => {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_users,
          COUNT(CASE WHEN is_verified = FALSE THEN 1 END) as unverified_users,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_users,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_today,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
        FROM users
      `);

      const [recentUsers] = await pool.execute(`
        SELECT 
          id, email, display_name, role, created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      res.json({
        stats: stats[0],
        recentUsers
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
};

module.exports = adminController;