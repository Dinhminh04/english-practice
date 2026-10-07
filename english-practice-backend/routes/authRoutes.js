const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const authController = require("../controllers/authController");

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    try {
      console.log("Google auth successful, user:", req.user);

      if (!req.user || !req.user.id) {
        return res.redirect(process.env.FRONTEND_URL + "/login?error=no_user");
      }

      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      console.log("Token generated successfully, redirecting to frontend");

      // Đảm bảo có role và id
      const role = req.user.role || "user";
      const id = req.user.id;

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${token}&role=${role}&id=${id}`
      );
    } catch (error) {
      console.error("Token generation error:", error);
      res.redirect(process.env.FRONTEND_URL + "/login?error=token_error");
    }
  }
);

// Facebook OAuth routes
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: process.env.FRONTEND_URL + "/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    try {
      console.log("Facebook auth successful, user:", req.user);

      if (!req.user || !req.user.id) {
        return res.redirect(process.env.FRONTEND_URL + "/login?error=no_user");
      }

      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      console.log("Facebook token generated successfully");
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${token}&role=${req.user.role}&id=${req.user.id}`
      );
    } catch (error) {
      console.error("Facebook token error:", error);
      res.redirect(process.env.FRONTEND_URL + "/login?error=token_error");
    }
  }
);

// Register route
router.post("/register", authController.register);

// Login route 
router.post("/login", authController.login);

// Verify email route
router.get("/verify-email", authController.verifyEmail);

// Forgot password route
router.post("/forgot-password", authController.forgotPassword);

// Reset password route
router.post("/reset-password", authController.resetPassword);

module.exports = router;
