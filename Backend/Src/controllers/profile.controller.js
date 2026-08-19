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

module.exports = {
  getProfile,
  enableAttribution,
};
