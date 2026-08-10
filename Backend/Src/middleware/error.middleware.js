const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * Global Express error handling middleware.
 * Ensures every unhandled exception or thrown service error strictly adheres
 * to the standardized Vytalis error API response contract.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`[Global Error Handler] Status: ${statusCode} - Message: ${message}`);
  if (process.env.NODE_ENV !== "production" && err.stack) {
    logger.error(err.stack);
  }

  return sendError(res, statusCode, message, err.errors || null);
};

module.exports = errorHandler;
