const User = require("../models/user.model");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * GET /api/profile
 * Get current authenticated user profile
 */
const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Profile retrieved successfully", {
      user: req.user.toJSON ? req.user.toJSON() : req.user,
      attributionEnabled: Boolean(req.user.attributionEnabled),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/upgrade-role
 * Upgrade the authenticated client user to admin role using ADMIN_UPGRADE_KEY
 */
const upgradeRole = async (req, res, next) => {
  try {
    const { key } = req.body || {};
    const expectedKey = process.env.ADMIN_UPGRADE_KEY;

    if (!expectedKey) {
      logger.error("ADMIN_UPGRADE_KEY is not defined in environment variables");
      return sendError(res, 500, "Server environment configuration error");
    }

    if (!key || typeof key !== "string" || key.trim() !== expectedKey.trim()) {
      logger.warn(`Invalid admin upgrade key attempt for user ${req.user._id}`);
      return sendError(res, 401, "Invalid administrator access key.");
    }

    const hasExistingRootAdmin = await User.exists({ isRootAdmin: true });

    req.user.role = "admin";
    if (!hasExistingRootAdmin) {
      req.user.isRootAdmin = true;
      logger.info(`User ${req.user._id} (${req.user.email}) designated as Root Administrator`);
    }

    await req.user.save();

    logger.info(`User ${req.user._id} (${req.user.email}) successfully upgraded to admin role`);

    return sendSuccess(res, 200, "Account role successfully upgraded to Administrator", {
      user: req.user.toJSON(),
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

/**
 * PUT /api/profile/navigation-preferences
 * Save authenticated user's personal navigation UI preferences (hiddenFeatures array)
 */
const updateNavigationPreferences = async (req, res, next) => {
  try {
    const { hiddenFeatures } = req.body || {};

    if (!Array.isArray(hiddenFeatures)) {
      return sendError(res, 400, "hiddenFeatures must be an array of feature keys.");
    }

    if (!req.user.preferences) {
      req.user.preferences = {};
    }

    req.user.preferences.hiddenFeatures = hiddenFeatures.filter(
      (item) => typeof item === "string"
    );

    await req.user.save();
    logger.info(`Navigation preferences updated for user ${req.user._id}`);

    return sendSuccess(
      res,
      200,
      "Navigation preferences updated successfully",
      {
        user: req.user.toJSON ? req.user.toJSON() : req.user,
        hiddenFeatures: req.user.preferences.hiddenFeatures,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  upgradeRole,
  getKpiPreferences,
  updateKpiPreferences,
  updateNavigationPreferences,
};
