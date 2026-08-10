/**
 * Meta Analytics Service for Vytalis Intelligence.
 * Core orchestration service for user preference validation, date normalization,
 * Redis caching, and adapter invocation.
 * 
 * Contains ZERO provider-specific field definitions, Windsor syntax, or Express req/res objects.
 */

const facebookAdapter = require("../adapters/facebook.adapter");
const cacheUtil = require("../utils/cache.util");
const { normalizeDateParams } = require("../utils/date-normalizer.util");
const { META_ENDPOINTS } = require("../config/meta-endpoints.config");
const { calculateJitteredTtl } = require("../config/cache.config");
const logger = require("../utils/logger.util");

/**
 * Fetches Meta analytics data for a specific endpoint with Redis caching.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object containing preferences
 * @param {string} options.endpoint - Analytics endpoint key (e.g. "overview", "campaigns")
 * @param {Object} options.query - Raw query parameters ({ datePreset, dateFrom, dateTo })
 * @returns {Promise<Object>} Object containing data array and meta metadata
 */
const getAnalyticsData = async ({ user, endpoint, query = {} }) => {
  // 1. Validate authenticated user & activeMetaAccount preference
  if (!user || !user.preferences || !user.preferences.activeMetaAccount) {
    const error = new Error("No active Meta account selected");
    error.statusCode = 400;
    throw error;
  }

  const activeMetaAccount = user.preferences.activeMetaAccount;
  const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : "anonymous";

  // 2. Validate endpoint configuration
  const endpointConfig = META_ENDPOINTS[endpoint];
  if (!endpointConfig) {
    const error = new Error(`Unsupported analytics endpoint: '${endpoint}'`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Normalize date parameters
  const { dateRangeKey, datePreset, dateFrom, dateTo } = normalizeDateParams({
    datePreset: query.datePreset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });

  // 4. Generate deterministic Redis key
  // Format: meta:{userId}:{activeMetaAccount}:{endpoint}:{dateRange}
  const cacheKey = `meta:${userId}:${activeMetaAccount}:${endpoint}:${dateRangeKey}`;

  // 5. Check Redis cache safely (Redis HIT vs MISS vs ERROR)
  try {
    const cached = await cacheUtil.get(cacheKey);
    if (cached && cached.data) {
      // Cache HIT: Preserve original cachedAt & expiresAt, return with source = "redis"
      return {
        data: cached.data,
        meta: {
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
          source: "redis",
        },
      };
    }
  } catch (cacheErr) {
    logger.warn(`[Redis ERROR] Cache lookup failed for key ${cacheKey}: ${cacheErr.message}`);
  }

  // 6. Cache MISS: Invoke Facebook Adapter
  const adapterMethodName = endpointConfig.adapterMethod;
  if (typeof facebookAdapter[adapterMethodName] !== "function") {
    const error = new Error(`Adapter method '${adapterMethodName}' is not defined on Facebook Adapter`);
    error.statusCode = 500;
    throw error;
  }

  const rawData = await facebookAdapter[adapterMethodName]({
    activeMetaAccount,
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
  };

  // 8. Store in Redis
  await cacheUtil.set(cacheKey, cachePayload, jitteredTtl);

  // 9. Return fresh data response
  return {
    data: rawData,
    meta: {
      cachedAt,
      expiresAt,
      source: "windsor",
    },
  };
};

module.exports = {
  getAnalyticsData,
};
