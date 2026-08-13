const { ALLOWED_SHOPIFY_PRESETS } = require("../config/shopify-endpoints.config");
const { sendError } = require("../utils/api-response.util");

/**
 * Validates strictly if a date string is a real calendar date in YYYY-MM-DD format.
 * Correctly rejects impossible dates such as 2026-02-31 or invalid calendar strings.
 *
 * @param {string} dateStr - Date string YYYY-MM-DD
 * @returns {boolean} True if real calendar date, false otherwise
 */
const isValidCalendarDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return false;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const [year, month, day] = trimmed.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));

  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

/**
 * Middleware validating Shopify analytics data endpoint requests.
 */
const validateShopifyDataRequest = (req, res, next) => {
  const query = req.query || {};
  const body = req.body || {};
  const params = req.params || {};

  // 1. Explicitly reject any client-supplied account override attempts
  const forbiddenFields = [
    "accountName",
    "account_name",
    "accountId",
    "account_id",
    "shopId",
    "shop_id",
  ];

  for (const field of forbiddenFields) {
    if (query[field] !== undefined || body[field] !== undefined || params[field] !== undefined) {
      return sendError(res, 400, `Account identifier '${field}' must not be supplied by the client`);
    }
  }

  // 2. Extract date parameters supporting both camelCase and snake_case
  const datePreset = (query.datePreset || query.date_preset || "").trim();
  const dateFrom = (query.dateFrom || query.date_from || "").trim();
  const dateTo = (query.dateTo || query.date_to || "").trim();

  // Reject ambiguous combination of datePreset AND custom date range
  if (datePreset && (dateFrom || dateTo)) {
    return sendError(
      res,
      400,
      "Ambiguous date parameters. Cannot supply both date_preset and custom date range (date_from/date_to)"
    );
  }

  // Reject partial custom date range
  if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
    return sendError(
      res,
      400,
      "Both date_from and date_to must be provided for a custom date range"
    );
  }

  // Reject missing date parameters entirely
  if (!datePreset && !dateFrom && !dateTo) {
    return sendError(
      res,
      400,
      "Date parameters are required. Supply date_preset or both date_from and date_to"
    );
  }

  // 3. Validate Preset if provided
  if (datePreset) {
    if (!ALLOWED_SHOPIFY_PRESETS.includes(datePreset.toLowerCase())) {
      return sendError(
        res,
        400,
        `Unsupported date_preset '${datePreset}'. Allowed presets: ${ALLOWED_SHOPIFY_PRESETS.join(", ")}`
      );
    }
  }

  // 4. Validate Custom Date Range if provided
  if (dateFrom && dateTo) {
    if (!isValidCalendarDate(dateFrom)) {
      return sendError(res, 400, "date_from must be a valid calendar date in YYYY-MM-DD format");
    }

    if (!isValidCalendarDate(dateTo)) {
      return sendError(res, 400, "date_to must be a valid calendar date in YYYY-MM-DD format");
    }

    if (dateFrom > dateTo) {
      return sendError(res, 400, "date_from cannot be after date_to");
    }
  }

  next();
};

module.exports = {
  isValidCalendarDate,
  validateShopifyDataRequest,
};
