/**
 * Request Builder utility for Windsor API integrations.
 * Constructs properly encoded, parameter-safe Windsor connector request URLs.
 */

const WINDSOR_CONSTANTS = require("../config/meta-constants.config");

/**
 * Builds a complete Windsor API request URL for a given connector and query parameters.
 *
 * @param {Object} options
 * @param {string} [options.connector=facebook] - Windsor connector identifier
 * @param {string|Array<string>} options.fields - Requested fields (array or comma-separated string)
 * @param {string} [options.dateFrom] - Start date (YYYY-MM-DD)
 * @param {string} [options.dateTo] - End date (YYYY-MM-DD)
 * @param {string} [options.datePreset] - Windsor date preset identifier (e.g. last_7d)
 * @param {Array<Array<string>>} [options.filters] - Array of filter tuples e.g. [["account_id", "eq", "12345"]]
 * @returns {string} Full URL string ready for HTTP request execution
 */
const buildWindsorRequest = ({
  connector = WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
  fields = [],
  dateFrom = null,
  dateTo = null,
  datePreset = null,
  filters = null,
} = {}) => {
  const apiKey = process.env.WINDSOR_API_KEY || "";
  const baseWindsorUrl = process.env.WINDSOR_BASE_URL || WINDSOR_CONSTANTS.BASE_URL;
  const baseUrl = `${baseWindsorUrl}/${connector}`;

  const queryParams = new URLSearchParams();

  // API Key
  if (apiKey) {
    queryParams.append("api_key", apiKey);
  }

  // Date Parameters
  if (dateFrom) {
    queryParams.append("date_from", dateFrom);
  }
  if (dateTo) {
    queryParams.append("date_to", dateTo);
  }
  if (datePreset && !dateFrom && !dateTo) {
    queryParams.append("date_preset", datePreset);
  }

  // Fields
  let fieldsStr = "";
  if (Array.isArray(fields)) {
    fieldsStr = fields.join(",");
  } else if (typeof fields === "string") {
    fieldsStr = fields;
  }
  if (fieldsStr) {
    queryParams.append("fields", fieldsStr);
  }

  // Filters (Windsor expects JSON stringified filter array, e.g. filter=[["account_id","eq","359804707990884"]])
  if (filters && Array.isArray(filters) && filters.length > 0) {
    queryParams.append("filter", JSON.stringify(filters));
  }

  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Specialized builder wrapper for Facebook connector requests.
 */
const buildFacebookRequest = (options = {}) => {
  return buildWindsorRequest({
    ...options,
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
  });
};

module.exports = {
  buildWindsorRequest,
  buildFacebookRequest,
};
