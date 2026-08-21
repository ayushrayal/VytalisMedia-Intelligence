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

const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");

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
  const { integrationUser } = await getEffectiveIntegrationContext(user, query.organizationId);
  const targetUser = integrationUser || user;

  // 1. Validate authenticated user & activeShopifyAccount preference
  if (!targetUser || !targetUser.preferences || !targetUser.preferences.activeShopifyAccount) {
    const error = new Error("No active Shopify account configured for this Organization");
    error.statusCode = 404;
    throw error;
  }

  const activeShopifyAccount = targetUser.preferences.activeShopifyAccount.trim();
  if (!activeShopifyAccount) {
    const error = new Error("No active Shopify account configured for this Organization");
    error.statusCode = 404;
    throw error;
  }

  const userId = targetUser._id ? targetUser._id.toString() : "anonymous";

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

  if (rawPreset === "this_month") {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const calculatedFrom = `${year}-${month}-01`;
    const calculatedTo = `${year}-${month}-${day}`;

    datePreset = "this_month";
    dateFrom = calculatedFrom;
    dateTo = calculatedTo;
    dateRangeKey = `this_month_${calculatedFrom}_${calculatedTo}`;
    dateRangeMeta = { type: "preset", value: "this_month", dateFrom: calculatedFrom, dateTo: calculatedTo };
  } else if (rawPreset) {
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

/**
 * Fetches Shopify comparison data comparing Period A and Period B.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object
 * @param {Object} options.query - Date query params ({ dateFrom1, dateTo1, dateFrom2, dateTo2, datePreset })
 * @returns {Promise<Object>} Comparison payload with metrics, summary, key changes, and insights
 */
const getShopifyComparison = async ({ user, query = {} }) => {
  const compareCalc = require("../utils/compare-calculator.util");

  let pAFrom = query.dateFrom1 || query.date_from1 || query.dateFromA;
  let pATo = query.dateTo1 || query.date_to1 || query.dateToA;
  let pBFrom = query.dateFrom2 || query.date_from2 || query.dateFromB;
  let pBTo = query.dateTo2 || query.date_to2 || query.dateToB;

  if ((query.datePreset || query.preset) && (!pAFrom || !pATo || !pBFrom || !pBTo)) {
    const preset = query.datePreset || query.preset;
    const presetRanges = compareCalc.buildPresetDateRanges(preset);
    pAFrom = presetRanges.dateFrom1;
    pATo = presetRanges.dateTo1;
    pBFrom = presetRanges.dateFrom2;
    pBTo = presetRanges.dateTo2;
  }

  // 1. Normalize date order
  const normA = compareCalc.normalizeDateOrder(pAFrom, pATo);
  const normB = compareCalc.normalizeDateOrder(pBFrom, pBTo);

  pAFrom = normA.dateFrom;
  pATo = normA.dateTo;
  pBFrom = normB.dateFrom;
  pBTo = normB.dateTo;

  // 2. Authoritatively validate equal calendar day counts
  compareCalc.validateEqualPeriodLengths(pAFrom, pATo, pBFrom, pBTo);

  // 3. Fetch Period A and Period B bundles concurrently
  const [overviewA, ordersA, customersA, overviewB, ordersB, customersB] = await Promise.all([
    getShopifyData({ user, endpoint: "overview", query: { dateFrom: pAFrom, dateTo: pATo } }),
    getShopifyData({ user, endpoint: "orders", query: { dateFrom: pAFrom, dateTo: pATo } }),
    getShopifyData({ user, endpoint: "customers", query: { dateFrom: pAFrom, dateTo: pATo } }),
    getShopifyData({ user, endpoint: "overview", query: { dateFrom: pBFrom, dateTo: pBTo } }),
    getShopifyData({ user, endpoint: "orders", query: { dateFrom: pBFrom, dateTo: pBTo } }),
    getShopifyData({ user, endpoint: "customers", query: { dateFrom: pBFrom, dateTo: pBTo } }),
  ]);

  // Aggregate Shopify metrics using canonical logic
  const aggregateShopifyBundle = (ovRes, ordRes, custRes) => {
    const ovRows = Array.isArray(ovRes?.data) ? ovRes.data : [];
    const ordRows = Array.isArray(ordRes?.data) ? ordRes.data : [];
    const custRows = Array.isArray(custRes?.data) ? custRes.data : [];

    let grossSales = 0;
    let netSales = 0;
    let ordersCount = 0;
    let discounts = 0;

    ovRows.forEach((r) => {
      grossSales += Number(r.order_gross_sales || r.gross_sales || 0);
      netSales += Number(r.order_net_sales || r.net_sales || 0);
      ordersCount += Number(r.order_count || r.order_total_count || 0);
      discounts += Number(r.order_total_discounts || 0);
    });

    const totalOrders = ordersCount || ordRows.length || 0;

    let prepaidCount = 0;
    let prepaidValue = 0;
    let codCount = 0;
    let codValue = 0;
    let cancelledCount = 0;
    let cancelledValue = 0;

    ordRows.forEach((o) => {
      const finStatus = (o.order_financial_status || "").toUpperCase();
      const orderPrice = Number(o.order_total_price || o.order_net_sales || 0);

      if (o.order_cancelled_at !== null && o.order_cancelled_at !== undefined && String(o.order_cancelled_at).trim() !== "") {
        cancelledCount += 1;
        cancelledValue += Math.abs(orderPrice);
      }

      if (finStatus === "PAID" || o.order_fully_paid === true) {
        prepaidCount += 1;
        prepaidValue += orderPrice;
      } else if (finStatus === "PENDING" || o.order_unpaid === true) {
        codCount += 1;
        codValue += orderPrice;
      }
    });

    const customerSet = new Set();
    custRows.forEach((c) => {
      const id = c.customer_id || c.customer_email || c.order_email || c.email;
      if (id) customerSet.add(String(id).trim().toLowerCase());
    });
    const uniqueCustomers = customerSet.size;

    const totals = { grossSales, netSales, orders: totalOrders, discounts };
    const breakdown = { prepaidCount, prepaidValue, codCount, codValue, cancelledCount, cancelledValue };
    const derived = compareCalc.computeShopifyDerivedMetrics(totals, breakdown);

    const aov = totalOrders > 0 ? netSales / totalOrders : 0;

    return {
      totals,
      breakdown,
      derived,
      uniqueCustomers,
      aov,
    };
  };

  const bundleA = aggregateShopifyBundle(overviewA, ordersA, customersA);
  const bundleB = aggregateShopifyBundle(overviewB, ordersB, customersB);

  // Compute 7-status metric comparison map strictly adhering to categories
  const metricsMap = {
    gross_sales: compareCalc.computeMetricComparison({ metricKey: "gross_sales", label: "Gross Sales", valueA: bundleA.totals.grossSales, valueB: bundleB.totals.grossSales, formatType: "currency" }),
    net_sales: compareCalc.computeMetricComparison({ metricKey: "net_sales", label: "Net Sales", valueA: bundleA.totals.netSales, valueB: bundleB.totals.netSales, formatType: "currency" }),
    orders: compareCalc.computeMetricComparison({ metricKey: "orders", label: "Total Orders", valueA: bundleA.totals.orders, valueB: bundleB.totals.orders, formatType: "number" }),
    discounts: compareCalc.computeMetricComparison({ metricKey: "discounts", label: "Total Discounts", valueA: bundleA.totals.discounts, valueB: bundleB.totals.discounts, formatType: "currency" }),
    customers: compareCalc.computeMetricComparison({ metricKey: "customers", label: "Total Customers", valueA: bundleA.uniqueCustomers, valueB: bundleB.uniqueCustomers, formatType: "number" }),
    prepaid_orders: compareCalc.computeMetricComparison({ metricKey: "prepaid_orders", label: "Prepaid Orders", valueA: bundleA.breakdown.prepaidValue, valueB: bundleB.breakdown.prepaidValue, formatType: "currency" }),
    cod_orders: compareCalc.computeMetricComparison({ metricKey: "cod_orders", label: "COD Orders", valueA: bundleA.breakdown.codValue, valueB: bundleB.breakdown.codValue, formatType: "currency" }),
    cancelled_orders: compareCalc.computeMetricComparison({ metricKey: "cancelled_orders", label: "Cancelled Orders", valueA: bundleA.breakdown.cancelledValue, valueB: bundleB.breakdown.cancelledValue, formatType: "currency" }),
    aov: compareCalc.computeMetricComparison({ metricKey: "aov", label: "Average Order Value", valueA: bundleA.aov, valueB: bundleB.aov, formatType: "currency" }),
    cancellation_rate: compareCalc.computeMetricComparison({ metricKey: "cancellation_rate", label: "Cancellation Rate", valueA: bundleA.derived.cancellationRate, valueB: bundleB.derived.cancellationRate, formatType: "percentage" }),
    cod_share: compareCalc.computeMetricComparison({ metricKey: "cod_share", label: "COD Share", valueA: bundleA.derived.codShare, valueB: bundleB.derived.codShare, formatType: "percentage" }),
    prepaid_share: compareCalc.computeMetricComparison({ metricKey: "prepaid_share", label: "Prepaid Share", valueA: bundleA.derived.prepaidShare, valueB: bundleB.derived.prepaidShare, formatType: "percentage" }),
  };

  const metricsList = Object.values(metricsMap);
  const summaryText = compareCalc.generateShopifySummary(metricsMap);
  const keyChanges = compareCalc.generateKeyChanges(metricsList);
  const insights = compareCalc.generateShopifyInsights(metricsMap);

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
  getShopifyData,
  getShopifyComparison,
};

