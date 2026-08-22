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
  validateCampaignBreakdownsRequest,
  validateAdSetBreakdownsRequest,
  validateAdBreakdownsRequest,
} = require("../validators/meta-analytics.validator");
const { protect, requireEffectivePermission } = require("../middleware/auth.middleware");
const { requireOrganizationAccess } = require("../middleware/organization-auth.middleware");

// Protect all Meta routes with JWT authentication & multi-tenant organization isolation
router.use(protect);
router.use(requireOrganizationAccess);

/**
 * Dynamic permission check middleware for /analytics/:endpoint
 */
const requireMetaEndpointPermission = (req, res, next) => {
  const endpoint = req.params.endpoint ? req.params.endpoint.toLowerCase() : "";
  const permKeyMap = {
    overview: "meta.overview",
    campaigns: "meta.campaigns",
    adsets: "meta.adsets",
    creatives: "meta.creatives",
    audience: "meta.audience",
    places: "meta.places",
  };
  const permKey = permKeyMap[endpoint] || "meta.view";
  return requireEffectivePermission(permKey)(req, res, next);
};

/**
 * @route   GET /api/meta/preferences/creative-card
 * @desc    Fetch customizable creative card KPI preferences
 * @access  Private
 */
router.get(
  "/preferences/creative-card",
  requireEffectivePermission("meta.creatives"),
  metaController.getCreativeCardPreferences
);

/**
 * @route   PUT /api/meta/preferences/creative-card
 * @desc    Update customizable creative card KPI preferences
 * @access  Private
 */
router.put(
  "/preferences/creative-card",
  requireEffectivePermission("meta.creatives"),
  metaController.updateCreativeCardPreferences
);

/**
 * @route   GET /api/meta/campaigns/:campaignId/details
 * @desc    Fetch Meta campaign details, ad sets, creatives, and performance breakdown
 * @access  Private
 */
router.get(
  "/campaigns/:campaignId/details",
  requireEffectivePermission("meta.campaigns"),
  validateCampaignDetailsRequest,
  metaController.getCampaignDetails
);

/**
 * @route   GET /api/meta/campaigns/:campaignId/breakdowns
 * @desc    Fetch campaign-scoped breakdown insights (age, gender, placement)
 * @access  Private
 */
router.get(
  "/campaigns/:campaignId/breakdowns",
  requireEffectivePermission("meta.campaigns"),
  validateCampaignBreakdownsRequest,
  metaController.getCampaignBreakdowns
);

/**
 * @route   GET /api/meta/adsets/:adsetId/breakdowns
 * @desc    Fetch adset-scoped breakdown insights (age, gender, placement)
 * @access  Private
 */
router.get(
  "/adsets/:adsetId/breakdowns",
  requireEffectivePermission("meta.adsets"),
  validateAdSetBreakdownsRequest,
  metaController.getAdSetBreakdowns
);

/**
 * @route   GET /api/meta/ads/:adId/breakdowns
 * @desc    Fetch ad-scoped breakdown insights (age, gender, placement)
 * @access  Private
 */
router.get(
  "/ads/:adId/breakdowns",
  requireEffectivePermission("meta.creatives"),
  validateAdBreakdownsRequest,
  metaController.getAdBreakdowns
);

/**
 * @route   GET /api/meta/compare
 * @desc    Fetch Meta comparison analytics data comparing Period A and Period B
 * @access  Private
 */
router.get(
  "/compare",
  requireEffectivePermission("meta.compare"),
  metaController.getMetaComparison
);

/**
 * @route   GET /api/meta/analytics/:endpoint
 * @desc    Fetch Meta analytics data (overview, campaigns, adsets, creatives, audience, places)
 * @access  Private
 */
router.get(
  "/analytics/:endpoint",
  validateAnalyticsRequest,
  requireMetaEndpointPermission,
  metaController.getAnalyticsData
);

/**
 * Account Integration Routes (require meta.view permission)
 */
router.post("/accounts", requireEffectivePermission("meta.view"), validateAddAccount, metaController.addAccount);
router.get("/accounts", requireEffectivePermission("meta.view"), metaController.getAllAccounts);
router.delete("/accounts", requireEffectivePermission("meta.view"), metaController.deleteAllAccounts);
router.patch(
  "/accounts/active",
  requireEffectivePermission("meta.view"),
  validateSetActiveMetaAccount,
  metaController.setActiveAccount
);
router.get("/accounts/:accountId", requireEffectivePermission("meta.view"), validateAccountIdParam, metaController.getAccountById);
router.patch(
  "/accounts/:accountId",
  requireEffectivePermission("meta.view"),
  validateAccountIdParam,
  validateUpdateAccount,
  metaController.updateAccount
);
router.delete(
  "/accounts/:accountId",
  requireEffectivePermission("meta.view"),
  validateAccountIdParam,
  metaController.deleteAccount
);

module.exports = router;
