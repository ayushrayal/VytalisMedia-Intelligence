const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateSignup, validateLogin } = require("../validators/auth.validator");
const { protect } = require("../middleware/auth.middleware");
const { signupRateLimiter, loginRateLimiter } = require("../middleware/rate-limit.middleware");

// Public authentication endpoints with IP rate limiters
router.post("/signup", signupRateLimiter, validateSignup, authController.signup);
router.post("/login", loginRateLimiter, validateLogin, authController.login);

// Session refresh and revocation endpoints
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Protected authentication profile endpoint
router.get("/me", protect, authController.getMe);

module.exports = router;
