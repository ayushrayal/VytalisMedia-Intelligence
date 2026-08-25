/**
 * Shopify Adapter for Vytalis Intelligence.
 * Translates domain Shopify analytics requests into Windsor Shopify connector queries.
 *
 * SOLE OWNER of provider-specific Windsor field mappings and Shopify account filter structures.
 */

const windsorProvider = require("../providers/windsor.provider");
const { SHOPIFY_ENDPOINTS } = require("../config/shopify-endpoints.config");

/**
 * Builds standard equality filter array for activeShopifyAccount.
 * Format: [["account_name", "eq", activeShopifyAccount]]
 */
const buildAccountFilter = (activeShopifyAccount) => {
  return [["account_name", "eq", activeShopifyAccount]];
};

/**
 * Fetches Shopify Overview metrics from Windsor.
 */
const fetchOverview = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.overview.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Orders metrics from Windsor.
 */
const fetchOrders = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.orders.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Products metrics from Windsor.
 */
const fetchProducts = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.products.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Customers metrics from Windsor.
 */
const fetchCustomers = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.customers.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Location metrics from Windsor.
 */
const fetchLocation = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.location.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Inventory metrics from Windsor.
 */
const fetchInventory = async ({ activeShopifyAccount, datePreset = "last_90d", dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.inventory.fields,
    datePreset: dateFrom && dateTo ? undefined : (datePreset || "last_90d"),
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Refunds metrics from Windsor.
 */
const fetchRefunds = async ({ activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.refunds.fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

/**
 * Fetches Shopify Cohorts historical order data from Windsor (last_90d lookback).
 */
const fetchCohorts = async ({ activeShopifyAccount }) => {
  return await windsorProvider.fetchData({
    connector: "shopify",
    fields: SHOPIFY_ENDPOINTS.cohorts.fields,
    datePreset: "last_90d",
    filters: buildAccountFilter(activeShopifyAccount),
  });
};

module.exports = {
  fetchOverview,
  fetchOrders,
  fetchProducts,
  fetchCustomers,
  fetchLocation,
  fetchInventory,
  fetchRefunds,
  fetchCohorts,
};
