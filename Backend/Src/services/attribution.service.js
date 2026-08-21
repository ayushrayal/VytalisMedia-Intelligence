/**
 * Attribution Service for Vytalis Intelligence.
 * Handles Shopify account validation, date range normalization, Redis caching,
 * Windsor adapter invocation, order custom attributes parsing, 7-rule classification,
 * top-level UI group aggregation, and paginated order-level attribution data.
 */

const attributionAdapter = require("../adapters/attribution.adapter");
const cacheUtil = require("../utils/cache.util");
const { parseOrderCustomAttributes } = require("../utils/attribution-parser.util");
const { classifyAttributionOrder, normalizeReferrer } = require("../utils/attribution-classifier.util");
const { normalizeDateParams } = require("../utils/date-normalizer.util");
const { calculateJitteredTtl } = require("../config/cache.config");
const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");
const logger = require("../utils/logger.util");

const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");

/**
 * Extracts verified merchant domains from authenticated user object.
 */
const extractMerchantDomains = (user) => {
  const domains = [];
  if (user && user.integrations && Array.isArray(user.integrations.shopify)) {
    for (const item of user.integrations.shopify) {
      if (item.accountName) domains.push(item.accountName.trim());
      if (item.shopName) domains.push(item.shopName.trim());
    }
  }
  return [...new Set(domains)].filter(Boolean);
};

/**
 * Safely computes percentage guarded against division by zero.
 */
const safePercentage = (numerator, denominator) => {
  if (!denominator || denominator <= 0 || isNaN(numerator)) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
};

/**
 * Resolves date range parameters specifically supporting "this_month" calendar month-to-date calculation.
 */
const resolveAttributionDateParams = (query = {}) => {
  const rawPreset = (query.datePreset || query.date_preset || "").trim();
  const rawFrom = (query.dateFrom || query.date_from || "").trim();
  const rawTo = (query.dateTo || query.date_to || "").trim();

  if (rawPreset === "this_month") {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const dateFrom = `${year}-${month}-01`;
    const dateTo = `${year}-${month}-${day}`;

    return {
      dateRangeKey: `this_month_${dateFrom}_${dateTo}`,
      datePreset: "this_month",
      dateFrom,
      dateTo,
    };
  }

  return normalizeDateParams({
    datePreset: rawPreset,
    dateFrom: rawFrom,
    dateTo: rawTo,
  });
};

/**
 * Fetches and classifies raw Windsor Shopify orders for a user and date range.
 * Shared helper to avoid fetching Windsor multiple times for identical date ranges.
 */
const getProcessedAttributionOrders = async ({ user, activeShopifyAccount, datePreset, dateFrom, dateTo }) => {
  const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : "anonymous";
  const resolved = resolveAttributionDateParams({ datePreset, dateFrom, dateTo });
  const dateRangeKey = resolved.dateRangeKey;
  const reqPreset = resolved.datePreset;
  const reqFrom = resolved.dateFrom;
  const reqTo = resolved.dateTo;

  // Cache key for processed raw orders array
  const baseCacheKey = `attribution:raw_processed:v2:${userId}:${activeShopifyAccount}:${dateRangeKey}`;

  try {
    const cached = await cacheUtil.get(baseCacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
  } catch (cacheErr) {
    logger.warn(`[Redis ERROR] Raw processed orders lookup failed: ${cacheErr.message}`);
  }

  const rawData = await attributionAdapter.fetchAttributionOrders({
    activeShopifyAccount,
    datePreset: reqPreset,
    dateFrom: reqFrom,
    dateTo: reqTo,
  });

  const merchantDomains = extractMerchantDomains(user);

  const processedOrders = (rawData || []).map((row) => {
    const orderId = String(row.order_id || row.id || "");
    const createdAt = row.order_created_at || null;
    const grossRevenue = parseFloat(row.order_gross_sales || row.gross_sales || row.order_total_price) || 0;
    const netRevenue = parseFloat(row.order_net_sales || row.net_sales) || 0;
    const paymentStatus = (row.order_financial_status || "unknown").toLowerCase();

    const parsedAttr = parseOrderCustomAttributes(row.order_custom_attributes);
    const classification = classifyAttributionOrder(parsedAttr, merchantDomains);

    return {
      orderId,
      createdAt,
      grossRevenue,
      netRevenue,
      paymentStatus,
      channel: classification.channel,
      topLevelGroup: classification.topLevelGroup,
      hadClickId: classification.hadClickId,
      utmSource: parsedAttr.utm_source,
      utmMedium: parsedAttr.utm_medium,
      utmCampaign: parsedAttr.utm_campaign,
      utmContent: parsedAttr.utm_content,
      referrerHost: normalizeReferrer(parsedAttr.orig_referrer),
    };
  });

  const jitteredTtl = calculateJitteredTtl(ATTRIBUTION_CONSTANTS.BASE_TTL);
  await cacheUtil.set(baseCacheKey, processedOrders, jitteredTtl);

  return processedOrders;
};

/**
 * GET /api/attribution/overview
 * Returns overall totals, top-level UI groups, 7 channels breakdown, and daily breakdown.
 */
const getAttributionOverview = async ({ user, query = {} }) => {
  const { integrationUser } = await getEffectiveIntegrationContext(user, query.organizationId);
  const targetUser = integrationUser || user;

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
  const { dateRangeKey, datePreset, dateFrom, dateTo } = resolveAttributionDateParams(query);

  // Redis cache key includes userId, activeShopifyAccount, dateRangeKey
  const overviewCacheKey = `attribution:overview:v2:${userId}:${activeShopifyAccount}:${dateRangeKey}`;

  try {
    const cached = await cacheUtil.get(overviewCacheKey);
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
    logger.warn(`[Redis ERROR] Cache lookup failed for ${overviewCacheKey}: ${cacheErr.message}`);
  }

  const orders = await getProcessedAttributionOrders({
    user,
    activeShopifyAccount,
    datePreset,
    dateFrom,
    dateTo,
  });

  // A. Overall Totals
  const totalOrders = orders.length;
  let grossRevenue = 0;
  let netRevenue = 0;

  for (const o of orders) {
    grossRevenue += o.grossRevenue;
    netRevenue += o.netRevenue;
  }

  grossRevenue = Number(grossRevenue.toFixed(2));
  netRevenue = Number(netRevenue.toFixed(2));

  // B. Top-level Groups Totals (meta, google, not_attribution)
  const groupStats = {
    [ATTRIBUTION_CONSTANTS.GROUPS.META]: { orders: 0, grossRevenue: 0, netRevenue: 0 },
    [ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE]: { orders: 0, grossRevenue: 0, netRevenue: 0 },
    [ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION]: { orders: 0, grossRevenue: 0, netRevenue: 0 },
  };

  // C. Channel-level Breakdown (7 Raw Channels)
  const channelStats = {};
  for (const chName of Object.values(ATTRIBUTION_CONSTANTS.CHANNELS)) {
    channelStats[chName] = {
      channel: chName,
      topLevelGroup: ATTRIBUTION_CONSTANTS.CHANNEL_TO_GROUP_MAP[chName],
      orderCount: 0,
      grossRevenue: 0,
      netRevenue: 0,
    };
  }

  // D. Daily Breakdown
  const dailyMap = {};

  for (const o of orders) {
    // Accumulate Groups
    const groupKey = o.topLevelGroup || ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION;
    if (groupStats[groupKey]) {
      groupStats[groupKey].orders += 1;
      groupStats[groupKey].grossRevenue += o.grossRevenue;
      groupStats[groupKey].netRevenue += o.netRevenue;
    }

    // Accumulate Channels
    const chName = o.channel || ATTRIBUTION_CONSTANTS.CHANNELS.NOT_ATTRIBUTED;
    if (channelStats[chName]) {
      channelStats[chName].orderCount += 1;
      channelStats[chName].grossRevenue += o.grossRevenue;
      channelStats[chName].netRevenue += o.netRevenue;
    }

    // Accumulate Daily
    const dateStr = o.createdAt ? o.createdAt.split("T")[0] : "unknown";
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: dateStr,
        totalOrders: 0,
        grossRevenue: 0,
        netRevenue: 0,
        channels: {},
      };
      for (const c of Object.values(ATTRIBUTION_CONSTANTS.CHANNELS)) {
        dailyMap[dateStr].channels[c] = { orderCount: 0, grossRevenue: 0, netRevenue: 0 };
      }
    }

    dailyMap[dateStr].totalOrders += 1;
    dailyMap[dateStr].grossRevenue += o.grossRevenue;
    dailyMap[dateStr].netRevenue += o.netRevenue;

    if (dailyMap[dateStr].channels[chName]) {
      dailyMap[dateStr].channels[chName].orderCount += 1;
      dailyMap[dateStr].channels[chName].grossRevenue += o.grossRevenue;
      dailyMap[dateStr].channels[chName].netRevenue += o.netRevenue;
    }
  }

  // Format Top-Level Groups with Percentages
  const formattedGroups = {};
  for (const [gKey, gVal] of Object.entries(groupStats)) {
    const gGross = Number(gVal.grossRevenue.toFixed(2));
    const gNet = Number(gVal.netRevenue.toFixed(2));
    formattedGroups[gKey] = {
      orders: gVal.orders,
      grossRevenue: gGross,
      netRevenue: gNet,
      percentageOfOrders: safePercentage(gVal.orders, totalOrders),
      percentageOfGrossRevenue: safePercentage(gGross, grossRevenue),
      percentageOfNetRevenue: safePercentage(gNet, netRevenue),
      percentageOfRevenue: safePercentage(gNet, netRevenue),
    };
  }

  // Format Channels with Percentages
  const formattedChannels = Object.values(channelStats).map((ch) => {
    const chGross = Number(ch.grossRevenue.toFixed(2));
    const chNet = Number(ch.netRevenue.toFixed(2));
    return {
      channel: ch.channel,
      topLevelGroup: ch.topLevelGroup,
      orderCount: ch.orderCount,
      grossRevenue: chGross,
      netRevenue: chNet,
      percentageOfOrders: safePercentage(ch.orderCount, totalOrders),
      percentageOfGrossRevenue: safePercentage(chGross, grossRevenue),
      percentageOfNetRevenue: safePercentage(chNet, netRevenue),
      percentageOfRevenue: safePercentage(chNet, netRevenue),
    };
  });

  // Format Daily Breakdown sorted chronologically
  const formattedDaily = Object.keys(dailyMap)
    .sort()
    .map((dateKey) => {
      const day = dailyMap[dateKey];
      const dayChannels = {};
      for (const [cKey, cVal] of Object.entries(day.channels)) {
        dayChannels[cKey] = {
          orderCount: cVal.orderCount,
          grossRevenue: Number(cVal.grossRevenue.toFixed(2)),
          netRevenue: Number(cVal.netRevenue.toFixed(2)),
        };
      }
      return {
        date: day.date,
        totalOrders: day.totalOrders,
        grossRevenue: Number(day.grossRevenue.toFixed(2)),
        netRevenue: Number(day.netRevenue.toFixed(2)),
        channels: dayChannels,
      };
    });

  const responseData = {
    overall: {
      totalOrders,
      grossRevenue,
      netRevenue,
    },
    groups: formattedGroups,
    channels: formattedChannels,
    daily: formattedDaily,
  };

  const jitteredTtl = calculateJitteredTtl(ATTRIBUTION_CONSTANTS.BASE_TTL);
  const now = new Date();
  const cachedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + jitteredTtl * 1000).toISOString();

  await cacheUtil.set(
    overviewCacheKey,
    { data: responseData, cachedAt, expiresAt, source: "windsor" },
    jitteredTtl
  );

  return {
    data: responseData,
    meta: {
      cachedAt,
      expiresAt,
      source: "windsor",
    },
  };
};

/**
 * GET /api/attribution/orders
 * Returns paginated, filtered order attribution list.
 * Includes all response-affecting parameters in Redis cache key.
 */
const getAttributionOrders = async ({ user, query = {} }) => {
  const { integrationUser } = await getEffectiveIntegrationContext(user, query.organizationId);
  const targetUser = integrationUser || user;

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
  const { dateRangeKey, datePreset, dateFrom, dateTo } = resolveAttributionDateParams(query);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const channelFilter = (query.channel || "").trim();
  const groupFilter = (query.group || "").trim();
  const financialStatusFilter = (query.financialStatus || query.paymentStatus || "").trim().toLowerCase();
  const searchFilter = (query.search || "").trim().toLowerCase();

  // Construct deterministic Redis key containing ALL response-affecting parameters
  const ordersCacheKey = `attribution:orders:v2:${userId}:${activeShopifyAccount}:${dateRangeKey}:${page}:${limit}:${channelFilter}:${groupFilter}:${financialStatusFilter}:${searchFilter}`;

  try {
    const cached = await cacheUtil.get(ordersCacheKey);
    if (cached && cached.data) {
      return {
        data: cached.data,
        meta: cached.meta,
      };
    }
  } catch (cacheErr) {
    logger.warn(`[Redis ERROR] Cache lookup failed for ${ordersCacheKey}: ${cacheErr.message}`);
  }

  const orders = await getProcessedAttributionOrders({
    user,
    activeShopifyAccount,
    datePreset,
    dateFrom,
    dateTo,
  });

  // Apply filters
  let filtered = orders;

  if (channelFilter) {
    filtered = filtered.filter(
      (o) => o.channel.toLowerCase() === channelFilter.toLowerCase()
    );
  }

  if (groupFilter) {
    filtered = filtered.filter(
      (o) => o.topLevelGroup.toLowerCase() === groupFilter.toLowerCase()
    );
  }

  if (financialStatusFilter) {
    filtered = filtered.filter(
      (o) => o.paymentStatus.toLowerCase() === financialStatusFilter
    );
  }

  if (searchFilter) {
    filtered = filtered.filter((o) => {
      const matchId = o.orderId.toLowerCase().includes(searchFilter);
      const matchSource = (o.utmSource || "").toLowerCase().includes(searchFilter);
      const matchCampaign = (o.utmCampaign || "").toLowerCase().includes(searchFilter);
      return matchId || matchSource || matchCampaign;
    });
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedOrders = filtered.slice(startIndex, startIndex + limit).map((o) => ({
    orderId: o.orderId,
    createdAt: o.createdAt,
    grossRevenue: o.grossRevenue,
    netRevenue: o.netRevenue,
    paymentStatus: o.paymentStatus,
    channel: o.channel,
    topLevelGroup: o.topLevelGroup,
    subChannel: o.channel,
    utmSource: o.utmSource,
    utmMedium: o.utmMedium,
    utmCampaign: o.utmCampaign,
    referrerHost: o.referrerHost,
    hadClickId: o.hadClickId,
  }));

  const jitteredTtl = calculateJitteredTtl(ATTRIBUTION_CONSTANTS.BASE_TTL);
  const now = new Date();
  const cachedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + jitteredTtl * 1000).toISOString();

  const responsePayload = {
    data: paginatedOrders,
    meta: {
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
      cachedAt,
      expiresAt,
      source: "windsor",
    },
  };

  await cacheUtil.set(ordersCacheKey, responsePayload, jitteredTtl);

  return responsePayload;
};

module.exports = {
  getAttributionOverview,
  getAttributionOrders,
};
