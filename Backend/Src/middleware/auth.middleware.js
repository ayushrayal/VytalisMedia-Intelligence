const User = require("../models/user.model");
const { verifyAccessToken } = require("../utils/jwt.util");
const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * Express middleware to protect routes using JWT authentication.
 * Primary token mechanism: HttpOnly cookies ('access_token').
 */
const protect = async (req, res, next) => {
  let token = null;

  // 1. Primary mechanism: HttpOnly Cookie
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  
  // 2. Temporary migration fallback: Bearer Authorization Header
  // DEPRECATED / TEMPORARY MIGRATION FALLBACK FOR TESTING & API TOOLS
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    logger.warn("Authentication failed: Access token missing");
    return sendError(res, 401, "Not authorized, token missing");
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn(`Authentication failed: User no longer exists for ID ${decoded.id}`);
      return sendError(res, 401, "Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Authentication failed: Invalid access token - ${error.message}`);
    return sendError(res, 401, "Not authorized, token failed");
  }
};

/**
 * Express middleware to restrict access to Admin-only API endpoints.
 * Requires authenticated user database role === "admin".
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    logger.warn(`Admin access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "You don't have permission to access User Management.");
  }
  next();
};

/**
 * Express middleware to restrict access to Attribution API endpoints.
 * Allowed if user is admin OR req.user.attributionEnabled === true.
 */
const requireAttributionAccess = (req, res, next) => {
  const isAllowed = req.user && (req.user.role === "admin" || Boolean(req.user.attributionEnabled) === true);
  if (!isAllowed) {
    logger.warn(`Attribution access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "This feature is not enabled for your account.");
  }
  next();
};

/**
 * Express middleware to restrict access to Shopify API endpoints.
 * Allowed if user is admin OR req.user.shopifyEnabled === true.
 */
const requireShopifyAccess = (req, res, next) => {
  const isAllowed = req.user && (req.user.role === "admin" || Boolean(req.user.shopifyEnabled) === true);
  if (!isAllowed) {
    logger.warn(`Shopify access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "This feature is not enabled for your account.");
  }
  next();
};

module.exports = {
  protect,
  requireAdmin,
  requireAttributionAccess,
  requireShopifyAccess,
};
