const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateSignup, validateLogin } = require("../validators/auth.validator");
const { protect } = require("../middleware/auth.middleware");

// Public authentication endpoints
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);

// Protected authentication endpoints
router.get("/me", protect, authController.getMe);

module.exports = router;
