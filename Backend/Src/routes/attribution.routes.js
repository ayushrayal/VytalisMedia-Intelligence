/**
 * Attribution Routes for Vytalis Intelligence.
 * Exposes endpoints for attribution overview and order listings.
 */

const express = require("express");
const router = express.Router();
const attributionController = require("../controllers/attribution.controller");
const { validateAttributionRequest } = require("../validators/attribution.validator");
const { protect, requireEffectivePermission } = require("../middleware/auth.middleware");
const { requireOrganizationAccess } = require("../middleware/organization-auth.middleware");

// Protect all Attribution endpoints with JWT authentication, org isolation, & attribution.view permission
router.use(protect);
router.use(requireOrganizationAccess);
router.use(requireEffectivePermission("attribution.view"));

/**
 * @route   GET /api/attribution/overview
 * @desc    Fetch Attribution overview (totals, top-level groups, channels, daily breakdown)
 * @access  Private
 */
router.get("/overview", validateAttributionRequest, attributionController.getOverview);

/**
 * @route   GET /api/attribution/orders
 * @desc    Fetch paginated Attribution order-level records
 * @access  Private
 */
router.get("/orders", validateAttributionRequest, attributionController.getOrders);

module.exports = router;
