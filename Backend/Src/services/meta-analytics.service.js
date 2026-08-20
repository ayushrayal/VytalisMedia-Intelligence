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

/**
 * Fetches comprehensive campaign details (adsets, creatives, performance) for a specific campaign with Redis caching.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object containing preferences
 * @param {string} options.campaignId - Target campaign ID
 * @param {Object} options.query - Raw query parameters ({ datePreset, dateFrom, dateTo })
 * @returns {Promise<Object>} Object containing campaign details and meta metadata
 */
const getCampaignDetails = async ({ user, campaignId, query = {} }) => {
  if (!user || !user.preferences || !user.preferences.activeMetaAccount) {
    const error = new Error("No active Meta account selected");
    error.statusCode = 400;
    throw error;
  }

  const activeMetaAccount = user.preferences.activeMetaAccount;
  const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : "anonymous";

  const { dateRangeKey, datePreset, dateFrom, dateTo } = normalizeDateParams({
    datePreset: query.datePreset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });

  const cacheKey = `meta:${userId}:${activeMetaAccount}:campaign_details:${campaignId}:${dateRangeKey}`;

  try {
    const cached = await cacheUtil.get(cacheKey);
    if (cached && cached.data) {
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

  const rawData = await facebookAdapter.fetchCampaignDetails({
    activeMetaAccount,
    campaignId,
    datePreset,
    dateFrom,
    dateTo,
  });

  const baseTtl = 300; // 5 minutes
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

  await cacheUtil.set(cacheKey, cachePayload, jitteredTtl);

  return {
    data: rawData,
    meta: {
      cachedAt,
      expiresAt,
      source: "windsor",
    },
  };
};

/**
 * Fetches Meta comparison data comparing Period A and Period B.
 * 
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object
 * @param {Object} options.query - Date query params ({ dateFrom1, dateTo1, dateFrom2, dateTo2, datePreset })
 * @returns {Promise<Object>} Comparison payload with metrics, summary, key changes, and insights
 */
const getMetaComparison = async ({ user, query = {} }) => {
  const compareCalc = require("../utils/compare-calculator.util");

  let pAFrom = query.dateFrom1 || query.date_from1 || query.dateFromA;
  let pATo = query.dateTo1 || query.date_to1 || query.dateToA;
  let pBFrom = query.dateFrom2 || query.date_from2 || query.dateFromB;
  let pBTo = query.dateTo2 || query.date_to2 || query.dateToB;

  // Handle Preset mode
  if ((query.datePreset || query.preset) && (!pAFrom || !pATo || !pBFrom || !pBTo)) {
    const preset = query.datePreset || query.preset;
    const presetRanges = compareCalc.buildPresetDateRanges(preset);
    pAFrom = presetRanges.dateFrom1;
    pATo = presetRanges.dateTo1;
    pBFrom = presetRanges.dateFrom2;
    pBTo = presetRanges.dateTo2;
  }

  // 1. Normalize date order for each period
  const normA = compareCalc.normalizeDateOrder(pAFrom, pATo);
  const normB = compareCalc.normalizeDateOrder(pBFrom, pBTo);

  pAFrom = normA.dateFrom;
  pATo = normA.dateTo;
  pBFrom = normB.dateFrom;
  pBTo = normB.dateTo;

  // 2. Authoritatively validate equal calendar day counts
  compareCalc.validateEqualPeriodLengths(pAFrom, pATo, pBFrom, pBTo);

  // 3. Fetch Period A and Period B overview data concurrently
  const [resA, resB] = await Promise.all([
    getAnalyticsData({ user, endpoint: "overview", query: { dateFrom: pAFrom, dateTo: pATo } }),
    getAnalyticsData({ user, endpoint: "overview", query: { dateFrom: pBFrom, dateTo: pBTo } }),
  ]);

  const rowsA = Array.isArray(resA?.data) ? resA.data : [];
  const rowsB = Array.isArray(resB?.data) ? resB.data : [];

  // Helper to aggregate Meta overview rows using exact same overview rules
  const aggregateMetaRows = (rows) => {
    let rawUniqueCtr = null;
    let rawCpm = null;
    let currency = "INR";

    const sums = rows.reduce(
      (acc, row) => {
        acc.spend += Number(row.spend || 0);
        acc.impressions += Number(row.impressions || 0);
        acc.reach += Number(row.reach || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.purchases += Number(row.purchases ?? row.actions_omni_purchase ?? 0);
        acc.purchaseValue += Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
        acc.addToCart += Number(row.actions_add_to_cart ?? row.add_to_cart ?? 0);
        acc.checkoutInitiated += Number(row.actions_initiate_checkout ?? row.initiate_checkout ?? 0);

        if (row.unique_outbound_clicks_ctr_outbound_click !== undefined && row.unique_outbound_clicks_ctr_outbound_click !== null) {
          rawUniqueCtr = Number(row.unique_outbound_clicks_ctr_outbound_click);
        }
        if (row.cpm !== undefined && row.cpm !== null) {
          rawCpm = Number(row.cpm);
        }

        if (row.currency) currency = row.currency;
        return acc;
      },
      { spend: 0, impressions: 0, reach: 0, clicks: 0, purchases: 0, purchaseValue: 0, addToCart: 0, checkoutInitiated: 0 }
    );

    const roas = sums.spend > 0 ? sums.purchaseValue / sums.spend : 0;
    const cpa = sums.purchases > 0 ? sums.spend / sums.purchases : 0;
    const ctr = sums.impressions > 0 ? (sums.clicks / sums.impressions) * 100 : 0;
    const cpc = sums.clicks > 0 ? sums.spend / sums.clicks : 0;
    const cpm = rawCpm !== null ? rawCpm : sums.impressions > 0 ? (sums.spend / sums.impressions) * 1000 : 0;
    const frequency = sums.reach > 0 ? sums.impressions / sums.reach : 1;

    return {
      spend: sums.spend,
      impressions: sums.impressions,
      reach: sums.reach,
      clicks: sums.clicks,
      purchases: sums.purchases,
      purchaseValue: sums.purchaseValue,
      roas,
      cpa,
      ctr,
      cpc,
      cpm,
      addToCart: sums.addToCart,
      checkoutInitiated: sums.checkoutInitiated,
      frequency,
      currency,
    };
  };

  const totalsA = aggregateMetaRows(rowsA);
  const totalsB = aggregateMetaRows(rowsB);

  // Compute 7-status metric comparison map
  const metricsMap = {
    spend: compareCalc.computeMetricComparison({ metricKey: "spend", label: "Amount Spent", valueA: totalsA.spend, valueB: totalsB.spend, formatType: "currency" }),
    impressions: compareCalc.computeMetricComparison({ metricKey: "impressions", label: "Impressions", valueA: totalsA.impressions, valueB: totalsB.impressions, formatType: "number" }),
    reach: compareCalc.computeMetricComparison({ metricKey: "reach", label: "Reach", valueA: totalsA.reach, valueB: totalsB.reach, formatType: "number" }),
    purchases: compareCalc.computeMetricComparison({ metricKey: "purchases", label: "Purchases", valueA: totalsA.purchases, valueB: totalsB.purchases, formatType: "number" }),
    purchase_conversion_value: compareCalc.computeMetricComparison({ metricKey: "purchase_conversion_value", label: "Purchase Value", valueA: totalsA.purchaseValue, valueB: totalsB.purchaseValue, formatType: "currency" }),
    purchase_roas: compareCalc.computeMetricComparison({ metricKey: "purchase_roas", label: "Purchase ROAS", valueA: totalsA.roas, valueB: totalsB.roas, formatType: "roas" }),
    clicks: compareCalc.computeMetricComparison({ metricKey: "clicks", label: "Clicks", valueA: totalsA.clicks, valueB: totalsB.clicks, formatType: "number" }),
    ctr: compareCalc.computeMetricComparison({ metricKey: "ctr", label: "CTR", valueA: totalsA.ctr, valueB: totalsB.ctr, formatType: "percentage" }),
    cpc: compareCalc.computeMetricComparison({ metricKey: "cpc", label: "CPC", valueA: totalsA.cpc, valueB: totalsB.cpc, formatType: "currency" }),
    cost_per_result: compareCalc.computeMetricComparison({ metricKey: "cost_per_result", label: "Cost per Purchase (CPA)", valueA: totalsA.cpa, valueB: totalsB.cpa, formatType: "currency" }),
    cpm: compareCalc.computeMetricComparison({ metricKey: "cpm", label: "CPM", valueA: totalsA.cpm, valueB: totalsB.cpm, formatType: "currency" }),
    actions_add_to_cart: compareCalc.computeMetricComparison({ metricKey: "actions_add_to_cart", label: "Add to Cart", valueA: totalsA.addToCart, valueB: totalsB.addToCart, formatType: "number" }),
    actions_initiate_checkout: compareCalc.computeMetricComparison({ metricKey: "actions_initiate_checkout", label: "Checkout Initiated", valueA: totalsA.checkoutInitiated, valueB: totalsB.checkoutInitiated, formatType: "number" }),
    frequency: compareCalc.computeMetricComparison({ metricKey: "frequency", label: "Frequency", valueA: totalsA.frequency, valueB: totalsB.frequency, formatType: "decimal" }),
  };

  const metricsList = Object.values(metricsMap);
  const summaryText = compareCalc.generateMetaSummary(metricsMap);
  const keyChanges = compareCalc.generateKeyChanges(metricsList);
  const insights = compareCalc.generateMetaInsights(metricsMap);

  return {
    periodA: { dateFrom: pAFrom, dateTo: pATo },
    periodB: { dateFrom: pBFrom, dateTo: pBTo },
    summary: summaryText,
    keyChanges,
    insights,
    metrics: metricsList,
    metricsMap,
  };
};

module.exports = {
  getAnalyticsData,
  getCampaignDetails,
  getMetaComparison,
};


