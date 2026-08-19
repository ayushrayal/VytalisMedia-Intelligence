const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, requireAdmin } = require("../middleware/auth.middleware");

// Require JWT Authentication and Admin Privileges for all routes in this router
router.use(protect);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Fetch all registered users with role and feature access flags
 * @access  Private (Admin Only)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   PATCH /api/admin/users/:userId/features
 * @desc    Toggle Shopify and Attribution feature access for a specific user
 * @access  Private (Admin Only)
 */
router.patch("/users/:userId/features", adminController.updateUserFeatures);

module.exports = router;
