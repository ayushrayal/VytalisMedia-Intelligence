const User = require("../models/user.model");
const { verifyAccessToken } = require("../utils/jwt.util");
const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");
const { calculateEffectivePermission } = require("../utils/permission-calculator.util");

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

    // 3. User Status Check
    if (user.status === "disabled") {
      logger.warn(`Authentication failed: Disabled user ${user._id} attempted login/access`);
      return sendError(res, 403, "Your account has been disabled.");
    }

    req.user = user;

    // Throttled lastActiveAt update (updates once every 5 minutes during active API usage)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    if (!user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > FIVE_MINUTES_MS) {
      user.lastActiveAt = new Date();
      user.save().catch((err) => {
        logger.warn(`Failed to update lastActiveAt for user ${user._id}: ${err.message}`);
      });
    }

    next();
  } catch (error) {
    logger.warn(`Authentication failed: Invalid access token - ${error.message}`);
    return sendError(res, 401, "Not authorized, token failed");
  }
};

/**
 * Express middleware to restrict access to Root Admin-only API endpoints.
 */
const requireRootAdmin = (req, res, next) => {
  const isRoot = req.user && (req.user.role === "root_admin" || req.user.isRootAdmin === true);
  if (!isRoot) {
    logger.warn(`Root Admin access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "Only the Root Administrator can perform this action.");
  }
  next();
};

/**
 * Express middleware to restrict access to Admin-level API endpoints (Root Admin or Admin).
 */
const requireAdmin = (req, res, next) => {
  const isAdmin = req.user && (req.user.role === "root_admin" || req.user.role === "admin" || req.user.isRootAdmin === true);
  if (!isAdmin) {
    logger.warn(`Admin access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "You don't have permission to access User Management.");
  }
  next();
};

/**
 * Express middleware factory enforcing effective permission checks.
 *
 * @param {string} permissionKey - Key from permission registry (e.g. "meta.places")
 */
const requireEffectivePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 401, "Authentication required");
      }

      // STEP 1: ROOT ADMIN BYPASS MUST HAPPEN FIRST!
      if (req.user.role === "root_admin" || req.user.isRootAdmin === true) {
        req.effectivePermission = {
          allowed: true,
          permissionKey,
          source: "root",
          locked: false,
          lockReason: null,
          reason: "Allowed by Root Admin authority.",
        };
        return next();
      }

      const evalResult = await calculateEffectivePermission(req.user, permissionKey);

      if (!evalResult.allowed) {
        logger.warn(
          `Permission denied for user ${req.user._id} on '${permissionKey}': reason=${evalResult.reason}, lockReason=${evalResult.lockReason}`
        );

        let userMessage = "Your account does not have permission to access this feature.";
        if (evalResult.lockReason === "disabled_by_root_admin") {
          userMessage = "This feature has been globally disabled by the Root Administrator.";
        } else if (evalResult.lockReason === "disabled_by_admin") {
          userMessage = "This feature has been disabled by your supervising Administrator.";
        } else if (evalResult.lockReason === "disabled_by_client") {
          userMessage = "This feature has been disabled by your Client Organization.";
        } else if (evalResult.lockReason === "organization_disabled") {
          userMessage = "Your Client Organization has been disabled.";
        }

        return sendError(res, 403, userMessage, {
          permissionKey,
          lockReason: evalResult.lockReason,
        });
      }

      req.effectivePermission = evalResult;
      next();
    } catch (error) {
      logger.error(`Error calculating effective permission for ${permissionKey}: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Express middleware to restrict access to Client-only API endpoints.
 */
const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== "client") {
    logger.warn(`Client access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "Access denied. Only Client users can access Team Management.");
  }
  next();
};

/**
 * Legacy compatibility helper for Attribution API access
 */
const requireAttributionAccess = requireEffectivePermission("attribution.view");

/**
 * Legacy compatibility helper for Shopify API access
 */
const requireShopifyAccess = requireEffectivePermission("shopify.view");

module.exports = {
  protect,
  requireRootAdmin,
  requireAdmin,
  requireClient,
  requireEffectivePermission,
  requireAttributionAccess,
  requireShopifyAccess,
};

