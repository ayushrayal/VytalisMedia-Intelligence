/**
 * Dashboard Aggregation Service for Vytalis Intelligence (Phase 3 - Task #16).
 * Orchestrates parallel, error-isolated dashboard aggregation calls across Meta, Shopify,
 * and Attribution modules while reusing Task #14/15 context & permission caches.
 */

const metaAnalyticsService = require("./meta-analytics.service");
const shopifyDataService = require("./shopify-data.service");
const attributionService = require("./attribution.service");
const logger = require("../utils/logger.util");

/**
 * Aggregates top-level Meta, Shopify, and Attribution overview analytics in parallel.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user object
 * @param {Object} options.query - Query parameters ({ datePreset, dateFrom, dateTo, organizationId })
 * @returns {Promise<Object>} Aggregated overview analytics payload
 */
const getDashboardOverviewAggregation = async ({ user, query = {} }) => {
  const [metaRes, shopifyRes, attributionRes] = await Promise.allSettled([
    metaAnalyticsService.getAnalyticsData({ user, endpoint: "overview", query }),
    shopifyDataService.getShopifyData({ user, endpoint: "overview", query }),
    attributionService.getAttributionOverview({ user, query }),
  ]);

  const metaPayload =
    metaRes.status === "fulfilled"
      ? { status: "success", data: metaRes.value.data, meta: metaRes.value.meta }
      : { status: "error", data: [], error: metaRes.reason?.message || "Meta analytics unavailable" };

  const shopifyPayload =
    shopifyRes.status === "fulfilled"
      ? { status: "success", data: shopifyRes.value.data, meta: shopifyRes.value.meta }
      : { status: "error", data: [], error: shopifyRes.reason?.message || "Shopify analytics unavailable" };

  const attributionPayload =
    attributionRes.status === "fulfilled"
      ? { status: "success", data: attributionRes.value.data, meta: attributionRes.value.meta }
      : { status: "error", data: null, error: attributionRes.reason?.message || "Attribution analytics unavailable" };

  return {
    meta: metaPayload,
    shopify: shopifyPayload,
    attribution: attributionPayload,
  };
};

module.exports = {
  getDashboardOverviewAggregation,
};
