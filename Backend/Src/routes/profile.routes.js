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
 * @route   POST /api/profile/upgrade-role
 * @desc    Upgrade user role to admin using secret access key
 * @access  Private
 */
router.post("/upgrade-role", profileController.upgradeRole);

/**
 * @route   GET /api/profile/kpi-preferences
 * @desc    Get dashboard KPI card preferences
 * @access  Private
 */
router.get("/kpi-preferences", profileController.getKpiPreferences);

/**
 * @route   PUT /api/profile/kpi-preferences
 * @desc    Update dashboard KPI card preferences
 * @access  Private
 */
router.put("/kpi-preferences", profileController.updateKpiPreferences);

/**
 * @route   PUT /api/profile/navigation-preferences
 * @desc    Update personal navigation UI preferences (hiddenFeatures)
 * @access  Private
 */
router.put("/navigation-preferences", profileController.updateNavigationPreferences);

module.exports = router;
