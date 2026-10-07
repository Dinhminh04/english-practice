const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserPremiumStatus
} = require("../controllers/adminController");

const router = express.Router();

// Tất cả routes đều yêu cầu auth và admin privileges
router.use(auth);

// User management routes
router.get("/users", getUsers);
router.get("/users/stats", getUserStats);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/premium", updateUserPremiumStatus);

module.exports = router;