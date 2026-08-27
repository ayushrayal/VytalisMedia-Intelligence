/**
 * Dashboard Routes for Vytalis Intelligence (Phase 3 - Task #16).
 * Defines aggregated dashboard analytics endpoints.
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");
const { requireOrganizationAccess } = require("../middleware/organization-auth.middleware");

// Protect all dashboard routes with JWT authentication & multi-tenant organization isolation
router.use(protect);
router.use(requireOrganizationAccess);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Fetch aggregated Meta, Shopify, and Attribution overview analytics in one parallel call
 * @access  Private
 */
router.get("/overview", dashboardController.getOverviewAggregation);

module.exports = router;
