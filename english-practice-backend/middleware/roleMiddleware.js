// Middleware kiểm tra quyền admin hoặc superadmin
const isAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superadmin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Bạn không có quyền truy cập" });
};

// Middleware kiểm tra quyền user (hoặc cao hơn)
const isUser = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "user" ||
      req.user.role === "admin" ||
      req.user.role === "superadmin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Bạn không có quyền truy cập" });
};

// Middleware kiểm tra quyền teacher (hoặc cao hơn)
const isTeacher = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "teacher" ||
      req.user.role === "admin" ||
      req.user.role === "superadmin")
  ) {
    return next();
  }
  return res.status(403).json({ message: "Bạn không có quyền truy cập" });
};

module.exports = { isAdmin, isUser, isTeacher };
