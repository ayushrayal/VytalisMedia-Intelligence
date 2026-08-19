const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { protect } = require("../middleware/auth.middleware");

// Protect all Profile endpoints with JWT authentication
router.use(protect);

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/", profileController.getProfile);

/**
 * @route   POST /api/profile/attribution/enable
 * @route   POST /api/profile/attribution/unlock
 * @desc    Unlock Attribution access for the authenticated user
 * @access  Private
 */
router.post("/attribution/enable", profileController.enableAttribution);
router.post("/attribution/unlock", profileController.enableAttribution);

module.exports = router;
