/**
 * Date Normalizer utility for Vytalis Intelligence analytics requests.
 * Ensures consistent, deterministic date range representations for Redis cache keys.
 */

const WINDSOR_CONSTANTS = require("../config/meta-constants.config");

/**
 * Formats an ISO string or date input to YYYY-MM-DD format strictly.
 *
 * @param {string} dateStr - Raw date string input
 * @returns {string|null} Canonical YYYY-MM-DD date string or null if invalid
 */
const formatCanonicalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toISOString().split("T")[0];
};

/**
 * Normalizes date parameters to generate deterministic cache key components.
 *
 * @param {Object} params - Object containing optional datePreset, dateFrom, dateTo
 * @returns {Object} { dateRangeKey, datePreset, dateFrom, dateTo }
 */
const normalizeDateParams = ({ datePreset, dateFrom, dateTo } = {}) => {
  const normPreset = datePreset && typeof datePreset === "string" ? datePreset.trim() : null;
  const normFrom = formatCanonicalDate(dateFrom);
  const normTo = formatCanonicalDate(dateTo);

  let dateRangeKey = "";

  if (normFrom && normTo) {
    dateRangeKey = `${normFrom}_${normTo}`;
  } else if (normPreset) {
    dateRangeKey = normPreset;
  } else {
    dateRangeKey = WINDSOR_CONSTANTS.DEFAULT_DATE_PRESET;
  }

  return {
    dateRangeKey,
    datePreset: normPreset || (normFrom && normTo ? null : WINDSOR_CONSTANTS.DEFAULT_DATE_PRESET),
    dateFrom: normFrom,
    dateTo: normTo,
  };
};

module.exports = {
  formatCanonicalDate,
  normalizeDateParams,
};
