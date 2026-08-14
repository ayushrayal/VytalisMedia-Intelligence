/**
 * Validator middleware for Attribution API requests in Vytalis Intelligence.
 */

const { sendError } = require("../utils/api-response.util");

const ALLOWED_PRESETS = ["last_7d", "last_30d", "last_90d", "last_year", "today", "yesterday", "this_month"];

/**
 * Validates strictly if a date string is a real calendar date in YYYY-MM-DD format.
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
 * Middleware validating Attribution requests query parameters.
 */
const validateAttributionRequest = (req, res, next) => {
  const query = req.query || {};
  const body = req.body || {};
  const params = req.params || {};

  // 1. Reject explicit account override attempts by client
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
      return sendError(res, 400, `Account identifier '${field}' must not be supplied by client`);
    }
  }

  // 2. Date parameters
  const datePreset = (query.datePreset || query.date_preset || "").trim();
  const dateFrom = (query.dateFrom || query.date_from || "").trim();
  const dateTo = (query.dateTo || query.date_to || "").trim();

  // Reject ambiguous combination of datePreset AND custom date range
  if (datePreset && (dateFrom || dateTo)) {
    return sendError(
      res,
      400,
      "Ambiguous date parameters. Cannot supply both datePreset and custom date range (dateFrom/dateTo)"
    );
  }

  // Reject partial custom date range
  if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
    return sendError(
      res,
      400,
      "Both dateFrom and dateTo must be provided for a custom date range"
    );
  }

  // Preset validation
  if (datePreset) {
    if (!ALLOWED_PRESETS.includes(datePreset.toLowerCase())) {
      return sendError(
        res,
        400,
        `Unsupported datePreset '${datePreset}'. Allowed presets: ${ALLOWED_PRESETS.join(", ")}`
      );
    }
  }

  // Custom date range validation
  if (dateFrom && dateTo) {
    if (!isValidCalendarDate(dateFrom)) {
      return sendError(res, 400, "dateFrom must be a valid calendar date in YYYY-MM-DD format");
    }
    if (!isValidCalendarDate(dateTo)) {
      return sendError(res, 400, "dateTo must be a valid calendar date in YYYY-MM-DD format");
    }
    if (dateFrom > dateTo) {
      return sendError(res, 400, "dateFrom cannot be later than dateTo");
    }
  }

  next();
};

module.exports = {
  validateAttributionRequest,
};
