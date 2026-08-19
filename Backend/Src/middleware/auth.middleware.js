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
 * Express middleware to restrict access to Attribution API endpoints.
 * Requires Boolean(req.user.attributionEnabled) === true.
 */
const requireAttributionAccess = (req, res, next) => {
  if (!req.user || Boolean(req.user.attributionEnabled) !== true) {
    logger.warn(`Attribution access denied for user ${req.user?._id || "unknown"}`);
    return sendError(res, 403, "Attribution access is not enabled for this account");
  }
  next();
};

module.exports = {
  protect,
  requireAttributionAccess,
};
