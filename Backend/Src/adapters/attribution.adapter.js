/**
 * Attribution Adapter for Vytalis Intelligence.
 * Translates domain Attribution analytics requests into Windsor Shopify connector queries.
 *
 * Reuses the existing connected Shopify account credentials without creating duplicate connectors.
 */

const windsorProvider = require("../providers/windsor.provider");
const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");

/**
 * Builds standard equality filter array for activeShopifyAccount.
 * Format: [["account_name", "eq", activeShopifyAccount]]
 */
const buildAccountFilter = (activeShopifyAccount) => {
  return [["account_name", "eq", activeShopifyAccount]];
};

/**
 * Fetches raw Shopify Attribution orders data from Windsor.ai.
 *
 * @param {Object} options
 * @param {string} options.activeShopifyAccount - Selected Shopify account identifier
 * @param {string} [options.datePreset] - Windsor date preset identifier
 * @param {string} [options.dateFrom] - Start date YYYY-MM-DD
 * @param {string} [options.dateTo] - End date YYYY-MM-DD
 * @returns {Promise<Array<Object>>} Extracted raw orders array from Windsor response
 */
const fetchAttributionOrders = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: ATTRIBUTION_CONSTANTS.CONNECTOR_SHOPIFY,
    fields: ATTRIBUTION_CONSTANTS.FIELDS,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

module.exports = {
  fetchAttributionOrders,
};
