const User = require("../models/user.model");
const { verifyAccessToken } = require("../utils/jwt.util");
const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * Express middleware to protect routes with JWT authentication.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    logger.warn("Authentication failed: Authorization token missing");
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
    logger.warn(`Authentication failed: Invalid token - ${error.message}`);
    return sendError(res, 401, "Not authorized, token failed");
  }
};

module.exports = {
  protect,
};
