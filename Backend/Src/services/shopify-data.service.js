/**
 * Shopify Data Service for Vytalis Intelligence.
 * Core orchestration service for active Shopify account validation, date range normalization,
 * Redis caching, and adapter invocation.
 *
 * Contains ZERO provider-specific field definitions or Express req/res objects.
 */

const shopifyAdapter = require("../adapters/shopify.adapter");
const cacheUtil = require("../utils/cache.util");
const { SHOPIFY_ENDPOINTS } = require("../config/shopify-endpoints.config");
const { calculateJitteredTtl } = require("../config/cache.config");
const logger = require("../utils/logger.util");

/**
 * Fetches Shopify analytics data for a specific endpoint with Redis caching.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object containing preferences
 * @param {string} options.endpoint - Analytics endpoint key (e.g. "overview", "orders")
 * @param {Object} options.query - Raw query parameters ({ datePreset, date_preset, dateFrom, date_from, dateTo, date_to })
 * @returns {Promise<Object>} Object containing data array and meta metadata
 */
const getShopifyData = async ({ user, endpoint, query = {} }) => {
  // 1. Validate authenticated user & activeShopifyAccount preference
  if (!user || !user.preferences || !user.preferences.activeShopifyAccount) {
    const error = new Error("No active Shopify account configured");
    error.statusCode = 404;
    throw error;
  }

  const activeShopifyAccount = user.preferences.activeShopifyAccount.trim();
  if (!activeShopifyAccount) {
    const error = new Error("No active Shopify account configured");
    error.statusCode = 404;
    throw error;
  }

  const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : "anonymous";

  // 2. Validate endpoint configuration
  const endpointConfig = SHOPIFY_ENDPOINTS[endpoint];
  if (!endpointConfig) {
    const error = new Error(`Unsupported Shopify data endpoint: '${endpoint}'`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Normalize Date Parameters into 3 Modes (Preset, Today/Yesterday date range, Custom range)
  const rawPreset = (query.datePreset || query.date_preset || "").trim();
  const rawFrom = (query.dateFrom || query.date_from || "").trim();
  const rawTo = (query.dateTo || query.date_to || "").trim();

  let dateRangeKey = "";
  let datePreset = null;
  let dateFrom = null;
  let dateTo = null;
  let dateRangeMeta = null;

  if (rawPreset) {
    datePreset = rawPreset;
    dateRangeKey = rawPreset;
    dateRangeMeta = { type: "preset", value: rawPreset };
  } else if (rawFrom && rawTo) {
    dateFrom = rawFrom;
    dateTo = rawTo;
    dateRangeKey = `${rawFrom}_${rawTo}`;
    dateRangeMeta = { type: "custom", dateFrom: rawFrom, dateTo: rawTo };
  } else {
    // Fallback default preset if none supplied
    datePreset = "last_7d";
    dateRangeKey = "last_7d";
    dateRangeMeta = { type: "preset", value: "last_7d" };
  }

  // 4. Generate deterministic Redis cache key
  // Format: shopify:{userId}:{activeShopifyAccount}:{endpoint}:{dateRangeKey}
  const cacheKey = `shopify:${userId}:${activeShopifyAccount}:${endpoint}:${dateRangeKey}`;

  // 5. Check Redis cache safely (Cache HIT vs MISS vs ERROR)
  try {
    const cached = await cacheUtil.get(cacheKey);
    if (cached && cached.data) {
      return {
        data: cached.data,
        meta: {
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
          source: "redis",
          dateRange: cached.dateRange || dateRangeMeta,
        },
      };
    }
  } catch (cacheErr) {
    logger.warn(`[Redis ERROR] Cache lookup failed for key ${cacheKey}: ${cacheErr.message}`);
  }

  // 6. Cache MISS: Invoke Shopify Adapter
  const adapterMethodName = endpointConfig.adapterMethod;
  if (typeof shopifyAdapter[adapterMethodName] !== "function") {
    const error = new Error(`Adapter method '${adapterMethodName}' is not defined on Shopify Adapter`);
    error.statusCode = 500;
    throw error;
  }

  const rawData = await shopifyAdapter[adapterMethodName]({
    activeShopifyAccount,
    datePreset,
    dateFrom,
    dateTo,
  });

  // 7. Calculate jittered TTL & metadata timestamps
  const baseTtl = endpointConfig.baseTtl || 300;
  const jitteredTtl = calculateJitteredTtl(baseTtl);

  const now = new Date();
  const cachedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + jitteredTtl * 1000).toISOString();

  const cachePayload = {
    data: rawData,
    cachedAt,
    expiresAt,
    source: "windsor",
    dateRange: dateRangeMeta,
  };

  // 8. Store in Redis (never caching errors)
  await cacheUtil.set(cacheKey, cachePayload, jitteredTtl);

  // 9. Return fresh data response
  return {
    data: rawData,
    meta: {
      cachedAt,
      expiresAt,
      source: "windsor",
      dateRange: dateRangeMeta,
    },
  };
};

module.exports = {
  getShopifyData,
};
