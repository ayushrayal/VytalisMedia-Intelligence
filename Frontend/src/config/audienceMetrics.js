import { formatCurrency } from "../utils/formatCurrency.js";
import { formatNumber } from "../utils/formatNumber.js";
import { formatPercentage } from "../utils/formatPercentage.js";

/**
 * Centralized Audience Metric Configuration System.
 * Defines metadata, supported placements, formatting, and calculation helpers
 * for all Meta Audience Demographics metrics.
 */
export const ALL_AUDIENCE_METRICS = [
  {
    key: "reach",
    label: "Reach",
    shortLabel: "Reach",
    description: "Unique users who saw ads",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: false,
    supportsHeatmap: false,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: false,
  },
  {
    key: "spend",
    label: "Spend",
    shortLabel: "Spend",
    description: "Total ad spend across demographic targets",
    format: "currency",
    category: "value",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: false,
  },
  {
    key: "impressions",
    label: "Impressions",
    shortLabel: "Impr.",
    description: "Total ad impressions served",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: false,
    supportsHeatmap: false,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: false,
  },
  {
    key: "clicks",
    label: "Clicks",
    shortLabel: "Clicks",
    description: "Total link/ad clicks",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: false,
    supportsTable: true,
    supportsGender: true,
    supportsAge: false,
    supportsHeatmap: false,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: false,
  },
  {
    key: "ctr",
    label: "CTR",
    shortLabel: "CTR",
    description: "Click-through rate (Clicks / Impressions)",
    format: "percentage",
    category: "efficiency",
    defaultEnabled: true,
    supportsKpi: false,
    supportsTable: true,
    supportsGender: true,
    supportsAge: false,
    supportsHeatmap: false,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: false,
  },
  {
    key: "cpc",
    label: "CPC",
    shortLabel: "CPC",
    description: "Cost per click (Spend / Clicks)",
    format: "currency",
    category: "efficiency",
    defaultEnabled: true,
    supportsKpi: false,
    supportsTable: true,
    supportsGender: true,
    supportsAge: false,
    supportsHeatmap: false,
    sortable: true,
    supportsNull: false,
    sortAscendingIsBest: true,
  },
  {
    key: "add_to_cart",
    label: "Add to Cart",
    shortLabel: "ATC",
    description: "Total add to cart conversion actions",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: false,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: false,
  },
  {
    key: "initiate_checkout",
    label: "Checkout Initiated",
    shortLabel: "IC",
    description: "Total checkout initiation conversion actions",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: false,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: false,
  },
  {
    key: "purchases",
    label: "Purchases",
    shortLabel: "Purchases",
    description: "Total completed purchase conversions",
    format: "number",
    category: "volume",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: false,
  },
  {
    key: "cpr",
    label: "Cost per Result",
    shortLabel: "CPR",
    description: "Cost per purchase conversion (Spend / Purchases)",
    format: "currency",
    category: "efficiency",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: true, // LOW to HIGH is best!
  },
  {
    key: "revenue",
    label: "Revenue",
    shortLabel: "Revenue",
    description: "Total purchase conversion monetary value",
    format: "currency",
    category: "value",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: false,
  },
  {
    key: "roas",
    label: "ROAS",
    shortLabel: "ROAS",
    description: "Return on ad spend (Revenue / Spend)",
    format: "roas",
    category: "efficiency",
    defaultEnabled: true,
    supportsKpi: true,
    supportsTable: true,
    supportsGender: true,
    supportsAge: true,
    supportsHeatmap: true,
    sortable: true,
    supportsNull: true,
    sortAscendingIsBest: false,
  },
];

export const STORAGE_KEY = "vytalis_audience_metric_preferences";

export const DEFAULT_ENABLED_METRIC_KEYS = ALL_AUDIENCE_METRICS.filter(
  (m) => m.defaultEnabled
).map((m) => m.key);

/**
 * Loads user metric preferences from localStorage, falling back to defaults.
 */
export const loadSavedAudienceMetricPreferences = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.enabled) && parsed.enabled.length > 0) {
        return parsed.enabled;
      }
    }
  } catch (err) {
    console.warn("Failed to load audience metric preferences from localStorage:", err);
  }
  return [...DEFAULT_ENABLED_METRIC_KEYS];
};

/**
 * Persists selected metric keys to localStorage.
 */
export const saveAudienceMetricPreferences = (enabledKeys) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled: enabledKeys })
    );
  } catch (err) {
    console.warn("Failed to save audience metric preferences to localStorage:", err);
  }
};

/**
 * Returns single metric config by key.
 */
export const getAudienceMetricConfig = (key) => {
  return ALL_AUDIENCE_METRICS.find((m) => m.key === key) || null;
};

/**
 * Formats a metric value according to its format specification.
 * Preserves difference between null ("—") and 0 ("0", "₹0.00", "0.00x").
 */
export const formatAudienceMetricValue = (value, format, currency = "INR") => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "—";
  }
  const num = Number(value);
  if (format === "currency") {
    return formatCurrency(num, currency);
  }
  if (format === "roas") {
    return `${num.toFixed(2)}x`;
  }
  if (format === "percentage") {
    return formatPercentage(num);
  }
  return formatNumber(num);
};

/**
 * Calculates aggregated Cost per Result: SUM(spend) / SUM(purchases)
 */
export const calculateAggregatedCpr = (spend, purchases) => {
  const s = Number(spend || 0);
  const p = Number(purchases || 0);
  return p > 0 ? s / p : null;
};

/**
 * Calculates aggregated ROAS: SUM(revenue) / SUM(spend)
 */
export const calculateAggregatedRoas = (revenue, spend) => {
  const r = Number(revenue || 0);
  const s = Number(spend || 0);
  return s > 0 ? r / s : null;
};
