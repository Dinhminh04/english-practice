const pool = require("../config/database");

const User = {
  create: async (user) => {
    const query = `
      INSERT INTO users 
      (email, phone, password, verification_token, role, is_premium) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user.email,
      user.phone,
      user.password,
      user.verification_token,
      user.role || "user",
      user.is_premium || false,
    ];
    const [result] = await pool.execute(query, values);
    return result;
  },

  findByEmail: async (email) => {
    const query = "SELECT * FROM users WHERE email = ?";
    const [results] = await pool.execute(query, [email]);
    return results;
  },

  findByGoogleId: async (googleId) => {
    const query = "SELECT * FROM users WHERE google_id = ?";
    const [results] = await pool.execute(query, [googleId]);
    return results;
  },

  findByFacebookId: async (facebookId) => {
    const query = "SELECT * FROM users WHERE facebook_id = ?";
    const [results] = await pool.execute(query, [facebookId]);
    return results;
  },

  updateVerificationStatus: async (userId) => {
    const query =
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?";
    const [result] = await pool.execute(query, [userId]);
    return result;
  },

  updateResetPasswordToken: async (userId, token, expires) => {
    const query =
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?";
    const [result] = await pool.execute(query, [token, expires, userId]);
    return result;
  },

  findByResetPasswordToken: async (token) => {
    const query =
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()";
    const [results] = await pool.execute(query, [token]);
    return results;
  },

  updatePassword: async (userId, password) => {
    const query =
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?";
    const [result] = await pool.execute(query, [password, userId]);
    return result;
  },

  findByVerificationToken: async (token) => {
    const query = "SELECT * FROM users WHERE verification_token = ?";
    const [results] = await pool.execute(query, [token]);
    return results;
  },

  createWithProvider: async (user) => {
    const {
      email,
      google_id = null,
      facebook_id = null,
      display_name = null,
      is_verified = true,
      role = "user",
      is_premium = false,
    } = user;

    const query = `
      INSERT INTO users 
      (email, google_id, facebook_id, display_name, is_verified, role, is_premium) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      email,
      google_id,
      facebook_id,
      display_name,
      is_verified,
      role,
      is_premium,
    ];
    const [result] = await pool.execute(query, params);
    return result;
  },

  findById: async (id) => {
    const query = "SELECT * FROM users WHERE id = ?";
    const [results] = await pool.execute(query, [id]);
    return results;
  },

  updateGoogleId: async (userId, googleId) => {
    const query = "UPDATE users SET google_id = ? WHERE id = ?";
    const [result] = await pool.execute(query, [googleId, userId]);
    return result;
  },

  // Cập nhật thông tin profile (async/await)
  updateProfile: async (id, data) => {
    // Xây dựng query động dựa trên các trường có trong data
    const fields = [];
    const values = [];
    for (const key in data) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result;
  },

  updatePremiumStatus: async (userId, isPremium) => {
    const query = "UPDATE users SET is_premium = ? WHERE id = ?";
    const [result] = await pool.execute(query, [isPremium, userId]);
    return result;
  },

  getAllUsers: async (
    page = 1,
    limit = 10,
    search = "",
    role = "",
    is_verified = ""
  ) => {
    const offset = (page - 1) * limit;

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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);

    // Data query
    const dataQuery = `
    SELECT id, email, phone, display_name, role, avatar, 
           is_verified, created_at, updated_at, is_premium 
    FROM users 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;

    const dataParams = [...params, parseInt(limit), offset];
    const [users] = await pool.execute(dataQuery, dataParams);

    return {
      users,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  },
};

module.exports = User;