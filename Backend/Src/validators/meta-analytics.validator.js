/**
 * Validator middleware for Meta Analytics endpoint requests.
 * Validates request parameters and enforces architectural constraints.
 * 
 * Contains ZERO database, Redis, or external provider calls.
 */

const { ALLOWED_META_ENDPOINTS } = require("../config/meta-endpoints.config");
const { sendError } = require("../utils/api-response.util");

/**
 * Middleware validating Meta analytics endpoint requests.
 */
const validateAnalyticsRequest = (req, res, next) => {
  // 1. Explicitly reject any client-supplied accountId in query, body, or params
  if (
    (req.query && req.query.accountId !== undefined) ||
    (req.body && req.body.accountId !== undefined) ||
    (req.params && req.params.accountId !== undefined)
  ) {
    return sendError(res, 400, "Account ID must not be supplied by the client");
  }

  // 2. Validate endpoint parameter against allowed whitelist
  const endpoint = req.params.endpoint;
  if (!endpoint || !ALLOWED_META_ENDPOINTS.includes(endpoint.toLowerCase())) {
    return sendError(res, 400, `Unsupported analytics endpoint '${endpoint}'. Allowed endpoints: ${ALLOWED_META_ENDPOINTS.join(", ")}`);
  }

  // 3. Date parameters validation
  const { datePreset, dateFrom, dateTo } = req.query;

  // Reject ambiguous combination of datePreset AND custom date range
  if (datePreset && (dateFrom || dateTo)) {
    return sendError(res, 400, "Ambiguous date parameters. Cannot supply both datePreset and custom date range (dateFrom/dateTo)");
  }

  // Reject partial custom date range
  if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
    return sendError(res, 400, "Both dateFrom and dateTo must be provided for a custom date range");
  }

  // Validate ISO YYYY-MM-DD format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateFrom && !isoDateRegex.test(dateFrom.trim())) {
    return sendError(res, 400, "dateFrom must be a valid date in YYYY-MM-DD format");
  }

  if (dateTo && !isoDateRegex.test(dateTo.trim())) {
    return sendError(res, 400, "dateTo must be a valid date in YYYY-MM-DD format");
  }

  next();
};

module.exports = {
  validateAnalyticsRequest,
};
