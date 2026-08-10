/**
 * Standardized API response builder for Vytalis Intelligence.
 * Guarantees every API response strictly adheres to the architectural response contract.
 */

/**
 * Sends a standardized success HTTP response.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g. 200, 201)
 * @param {string} message - Human-readable success message
 * @param {Object|Array|null} data - Payload data object
 * @param {Object|null} meta - Metadata object (pagination, filters, etc.)
 */
const sendSuccess = (res, statusCode = 200, message = "", data = {}, meta = null) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
    meta: meta,
    errors: null,
  });
};

/**
 * Sends a standardized error HTTP response.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 409, 500)
 * @param {string} message - Error summary message
 * @param {Array|Object|null} errors - Array or object of detailed error objects/messages
 */
const sendError = (res, statusCode = 500, message = "", errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message: message,
    data: null,
    meta: null,
    errors: errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
