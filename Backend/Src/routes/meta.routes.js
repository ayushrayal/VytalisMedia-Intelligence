const express = require("express");
const router = express.Router();
const metaController = require("../controllers/meta.controller");
const {
  validateAddAccount,
  validateSetActiveMetaAccount,
  validateUpdateAccount,
  validateAccountIdParam,
} = require("../validators/meta.validator");
const {
  validateAnalyticsRequest,
  validateCampaignDetailsRequest,
} = require("../validators/meta-analytics.validator");
const { protect } = require("../middleware/auth.middleware");

// Protect all Meta account and analytics routes with JWT authentication
router.use(protect);

/**
 * @route   GET /api/meta/campaigns/:campaignId/details
 * @desc    Fetch Meta campaign details, ad sets, creatives, and performance breakdown
 * @access  Private
 */
router.get(
  "/campaigns/:campaignId/details",
  validateCampaignDetailsRequest,
  metaController.getCampaignDetails
);

/**
 * @route   GET /api/meta/analytics/:endpoint
 * @desc    Fetch Meta analytics data (overview, campaigns, adsets, creatives, audience, places)
 * @access  Private
 */
router.get(
  "/analytics/:endpoint",
  validateAnalyticsRequest,
  metaController.getAnalyticsData
);

/**
 * @route   POST /api/meta/accounts
 * @desc    Add a new Meta account
 * @access  Private
 */
router.post("/accounts", validateAddAccount, metaController.addAccount);

/**
 * @route   GET /api/meta/accounts
 * @desc    Retrieve all Meta accounts for authenticated user
 * @access  Private
 */
router.get("/accounts", metaController.getAllAccounts);

/**
 * @route   DELETE /api/meta/accounts
 * @desc    Delete all Meta accounts for authenticated user
 * @access  Private
 */
router.delete("/accounts", metaController.deleteAllAccounts);

/**
 * @route   PATCH /api/meta/accounts/active
 * @desc    Set current preferred active Meta account
 * @access  Private
 */
router.patch(
  "/accounts/active",
  protect,
  validateSetActiveMetaAccount,
  metaController.setActiveAccount
);

/**
 * @route   GET /api/meta/accounts/:accountId
 * @desc    Retrieve a single Meta account by accountId
 * @access  Private
 */
router.get("/accounts/:accountId", validateAccountIdParam, metaController.getAccountById);

/**
 * @route   PATCH /api/meta/accounts/:accountId
 * @desc    Update Meta account display name
 * @access  Private
 */
router.patch(
  "/accounts/:accountId",
  validateAccountIdParam,
  validateUpdateAccount,
  metaController.updateAccount
);

/**
 * @route   DELETE /api/meta/accounts/:accountId
 * @desc    Delete a single Meta account by accountId
 * @access  Private
 */
router.delete(
  "/accounts/:accountId",
  validateAccountIdParam,
  metaController.deleteAccount
);

module.exports = router;
