/**
 * Windsor Provider layer for Vytalis Intelligence.
 * Sole layer responsible for external Windsor API HTTP communications via axios.
 * 
 * Strictly isolated: Has zero knowledge of Express, MongoDB, Redis, User preferences, or Controllers.
 */

const axios = require("axios");
const { buildWindsorRequest } = require("../utils/request-builder.util");
const logger = require("../utils/logger.util");

/**
 * Executes an HTTP GET request to the Windsor API endpoint.
 *
 * @param {Object} options
 * @param {string} options.connector - Connector identifier (e.g. "facebook")
 * @param {Array<string>|string} options.fields - Provider field list
 * @param {string} [options.dateFrom] - Start date YYYY-MM-DD
 * @param {string} [options.dateTo] - End date YYYY-MM-DD
 * @param {string} [options.datePreset] - Windsor date preset identifier
 * @param {Array<Array<string>>} [options.filters] - Windsor filter tuples
 * @returns {Promise<Array<Object>>} Extracted data array from Windsor response
 */
const fetchData = async ({
  connector,
  fields,
  dateFrom,
  dateTo,
  datePreset,
  filters,
}) => {
  const url = buildWindsorRequest({
    connector,
    fields,
    dateFrom,
    dateTo,
    datePreset,
    filters,
  });

  const startTime = Date.now();

  try {
    const timeoutMs = parseInt(process.env.WINDSOR_API_TIMEOUT, 10) || 15000;
    const response = await axios.get(url, {
      timeout: timeoutMs,
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return response.data || [];
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(
      `[Windsor REQUEST ERROR] Connector: ${connector} | ${responseTime}ms | Error: ${error.message}`
    );

    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.message || error.response.statusText;
      const providerError = new Error(`Windsor Provider API failed with status ${status}: ${errorMsg}`);
      providerError.statusCode = status >= 400 && status < 500 ? 400 : 502;
      throw providerError;
    }

    const networkError = new Error(`Windsor Provider connection error: ${error.message}`);
    networkError.statusCode = 502;
    throw networkError;
  }
};

module.exports = {
  fetchData,
};
