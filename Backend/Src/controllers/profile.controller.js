const { sendSuccess, sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * GET /api/profile
 * Get current authenticated user profile
 */
const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Profile retrieved successfully", {
      user: req.user,
      attributionEnabled: Boolean(req.user.attributionEnabled),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/attribution/enable
 * Enable Attribution analytics for the authenticated user account
 *
 * Rules:
 * - Compares accessKey against process.env.ATTRIBUTION_ACCESS_KEY || "VytalisAttribution@2026".
 * - Uses authenticated user from JWT (req.user._id). Never accepts userId from req.body.
 * - Returns 401 if accessKey is invalid.
 */
const enableAttribution = async (req, res, next) => {
  try {
    const { accessKey } = req.body || {};
    const expectedKey = process.env.ATTRIBUTION_ACCESS_KEY || "VytalisAttribution@2026";

    if (!accessKey || accessKey.trim() !== expectedKey.trim()) {
      logger.warn(`Invalid access key attempt for user ${req.user._id}`);
      return sendError(res, 401, "Invalid access key");
    }

    // Update ONLY the authenticated user from JWT
    req.user.attributionEnabled = true;
    await req.user.save();

    logger.info(`Attribution enabled successfully for user ${req.user._id}`);

    return sendSuccess(res, 200, "Attribution analytics unlocked successfully", {
      attributionEnabled: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_META_METRICS = [
  "amount-spent",
  "impressions",
  "reach",
  "purchases",
  "purchase-value",
  "clicks",
  "ctr",
  "cpm",
  "cpc",
  "frequency",
  "add-to-cart",
  "checkout-initiated",
  "purchase-roas",
  "cost-per-purchase",
];

const ALLOWED_SHOPIFY_METRICS = [
  "grossSales",
  "netSales",
  "orders",
  "discounts",
  "customers",
  "aov",
  "prepaid",
  "cod",
  "cancelled",
];

/**
 * GET /api/profile/kpi-preferences
 * Retrieve authenticated user's KPI card preferences for Business Dashboard
 */
const getKpiPreferences = async (req, res, next) => {
  try {
    const kpiPrefs = req.user.preferences?.kpiPreferences || {
      meta: ["amount-spent", "impressions", "purchases", "purchase-value", "reach"],
      shopify: ["grossSales", "netSales", "orders", "discounts", "customers"],
    };

    return sendSuccess(res, 200, "KPI preferences retrieved successfully", kpiPrefs);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/kpi-preferences
 * Save authenticated user's KPI card preferences for Business Dashboard
 */
const updateKpiPreferences = async (req, res, next) => {
  try {
    const { meta, shopify } = req.body || {};

    if (!Array.isArray(meta) || meta.length === 0 || meta.length > 5) {
      return sendError(res, 400, "Meta metrics selection must contain between 1 and 5 items.");
    }

    if (!Array.isArray(shopify) || shopify.length === 0 || shopify.length > 5) {
      return sendError(res, 400, "Shopify metrics selection must contain between 1 and 5 items.");
    }

    // Whitelist Validation
    const validMeta = meta.filter((id) => ALLOWED_META_METRICS.includes(id));
    const validShopify = shopify.filter((id) => ALLOWED_SHOPIFY_METRICS.includes(id));

    if (validMeta.length === 0) {
      return sendError(res, 400, "Invalid Meta metric selection.");
    }
    if (validShopify.length === 0) {
      return sendError(res, 400, "Invalid Shopify metric selection.");
    }

    if (!req.user.preferences) {
      req.user.preferences = {};
    }

    req.user.preferences.kpiPreferences = {
      meta: validMeta,
      shopify: validShopify,
    };

    await req.user.save();
    logger.info(`KPI preferences updated for user ${req.user._id}`);

    return sendSuccess(res, 200, "KPI preferences updated successfully", req.user.preferences.kpiPreferences);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  enableAttribution,
  getKpiPreferences,
  updateKpiPreferences,
};
