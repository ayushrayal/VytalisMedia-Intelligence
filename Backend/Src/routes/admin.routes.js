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
 * @route   POST /api/admin/users
 * @desc    Admin creates a new Client user with assigned Meta account
 * @access  Private (Admin Only)
 */
router.post("/users", adminController.createUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Permanently delete a user account
 * @access  Private (Admin Only)
 */
router.delete("/users/:userId", adminController.deleteUser);

/**
 * @route   PATCH /api/admin/users/:userId/role
 * @desc    Promote client to Admin or demote Admin to Client (Root Admin only)
 * @access  Private (Root Admin Only)
 */
router.patch("/users/:userId/role", adminController.updateUserRole);

/**
 * @route   PATCH /api/admin/users/:userId/features
 * @desc    Toggle Shopify and Attribution feature access for a specific user
 * @access  Private (Admin Only)
 */
router.patch("/users/:userId/features", adminController.updateUserFeatures);

module.exports = router;
