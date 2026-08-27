/**
 * Frontend Metric Registry Helper for Vytalis Intelligence (Phase 2 - Task #9).
 * Client-side API consumer that fetches authoritative metric metadata from the backend registry.
 * Contains ZERO duplicate business calculation logic.
 */

import { http } from "../lib/http.js";

// Minimal local fallback metadata map for initial load / offline safety
const MINIMAL_METRIC_FALLBACKS = {
  "meta.spend": { displayName: "Amount Spent", unit: "currency" },
  "meta.impressions": { displayName: "Impressions", unit: "count" },
  "meta.reach": { displayName: "Reach", unit: "count" },
  "meta.clicks": { displayName: "Clicks", unit: "count" },
  "meta.ctr": { displayName: "CTR", unit: "percentage" },
  "meta.cpc": { displayName: "CPC", unit: "currency" },
  "meta.cpm": { displayName: "CPM", unit: "currency_per_thousand" },
  "meta.roas": { displayName: "Purchase ROAS", unit: "ratio" },
  "shopify.gross_sales": { displayName: "Gross Sales", unit: "currency" },
  "shopify.net_sales": { displayName: "Net Sales", unit: "currency" },
  "shopify.orders_count": { displayName: "Total Orders", unit: "currency" },
  "shopify.aov": { displayName: "Average Order Value", unit: "currency" },
  "composite.blended_roas": { displayName: "Blended ROAS", unit: "ratio" },
};

let cachedRegistryMap = null;

/**
 * Fetches authoritative Metric Registry metadata from backend API.
 * Uses in-memory caching to avoid redundant HTTP calls.
 */
export async function getMetricRegistry(forceRefresh = false) {
  if (cachedRegistryMap && !forceRefresh) {
    return cachedRegistryMap;
  }

  try {
    const res = await http.get("/metrics/registry");
    if (res.data && res.data.metricsMap) {
      cachedRegistryMap = res.data.metricsMap;
      return cachedRegistryMap;
    }
  } catch (error) {
    console.warn("[Metric Registry] Failed to fetch backend registry, utilizing minimal fallbacks:", error.message);
  }

  return MINIMAL_METRIC_FALLBACKS;
}

/**
 * Synchronous lookup helper returning cached metadata or minimal fallback.
 */
export function getMetricMetadataSync(metricId) {
  if (cachedRegistryMap && cachedRegistryMap[metricId]) {
    return cachedRegistryMap[metricId];
  }
  return MINIMAL_METRIC_FALLBACKS[metricId] || { displayName: metricId, unit: "count" };
}
