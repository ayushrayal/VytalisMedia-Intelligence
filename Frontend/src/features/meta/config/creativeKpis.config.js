import { getActionValue } from "../utils/actionParser.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { getHookRate, getHoldRate } from "../components/CreativeCard.jsx";
import { extractCreativeRoas } from "../components/WinningCreativesSection.jsx";

export const DEFAULT_CREATIVE_CARD_PREFERENCES = {
  primaryMetrics: ["spend", "purchases", "cost_per_result", "purchase_roas"],
  videoMetrics: ["hook_rate", "hold_rate"],
  showFacebookLink: true,
  showInstagramLink: true,
  showHookHoldRates: true,
  winningRoasThreshold: 1.0,
  poorRoasThreshold: 1.0,
};

export const PRIMARY_KPI_LIMIT = 4;
export const VIDEO_KPI_LIMIT = 2;

/**
 * Registry of all available Primary KPI definitions for Meta Ad Creatives.
 */
export const CREATIVE_PRIMARY_KPIS = [
  {
    id: "spend",
    label: "Spend",
    category: "primary",
    format: "currency",
    getValue: (creative) => getActionValue(creative.spend || creative.amount_spent),
  },
  {
    id: "purchases",
    label: "Purchases",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.purchases || creative.actions_omni_purchase),
  },
  {
    id: "purchase_conversion_value",
    label: "Purchase Value",
    category: "primary",
    format: "currency",
    getValue: (creative) => getActionValue(creative.purchase_conversion_value || creative.action_values_omni_purchase),
  },
  {
    id: "purchase_roas",
    label: "ROAS",
    category: "primary",
    format: "roas",
    getValue: (creative) => extractCreativeRoas(creative),
  },
  {
    id: "cost_per_result",
    label: "Cost / Result",
    category: "primary",
    format: "currency",
    getValue: (creative) => getActionValue(creative.cost_per_result || creative.cost_per_action_type_omni_purchase),
  },
  {
    id: "ctr",
    label: "CTR",
    category: "primary",
    format: "percentage",
    getValue: (creative) => getActionValue(creative.ctr || creative.inline_link_click_ctr),
  },
  {
    id: "cpc",
    label: "CPC",
    category: "primary",
    format: "currency",
    getValue: (creative) => getActionValue(creative.cpc || creative.cost_per_inline_link_click),
  },
  {
    id: "cpm",
    label: "CPM",
    category: "primary",
    format: "currency",
    getValue: (creative) => getActionValue(creative.cpm),
  },
  {
    id: "impressions",
    label: "Impressions",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.impressions),
  },
  {
    id: "reach",
    label: "Reach",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.reach),
  },
  {
    id: "frequency",
    label: "Frequency",
    category: "primary",
    format: "decimal",
    getValue: (creative) => getActionValue(creative.frequency),
  },
  {
    id: "clicks",
    label: "Clicks",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.clicks),
  },
  {
    id: "link_clicks",
    label: "Link Clicks",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.link_clicks || creative.link_click_actions || creative.inline_link_clicks),
  },
  {
    id: "actions_add_to_cart",
    label: "Add to Cart",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.actions_add_to_cart || creative.add_to_cart),
  },
  {
    id: "actions_initiate_checkout",
    label: "Initiate Checkout",
    category: "primary",
    format: "number",
    getValue: (creative) => getActionValue(creative.actions_initiate_checkout || creative.initiate_checkout),
  },
];

/**
 * Registry of all available Video KPI definitions for Meta Ad Creatives.
 */
export const CREATIVE_VIDEO_KPIS = [
  {
    id: "hook_rate",
    label: "Hook Rate",
    category: "video",
    format: "percentage",
    getValue: (creative) => getHookRate(creative),
  },
  {
    id: "hold_rate",
    label: "Hold Rate",
    category: "video",
    format: "percentage",
    getValue: (creative) => getHoldRate(creative),
  },
  {
    id: "actions_video_view",
    label: "3-Sec Plays",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.actions_video_view || creative.video_3_sec_watched_actions),
  },
  {
    id: "video_thruplay_watched_actions_video_view",
    label: "ThruPlay",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_thruplay_watched_actions_video_view || creative.video_thruplay_watched_actions),
  },
  {
    id: "video_p25_watched_actions_video_view",
    label: "25% Watched",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_p25_watched_actions_video_view || creative.video_p25_watched_actions),
  },
  {
    id: "video_p50_watched_actions_video_view",
    label: "50% Watched",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_p50_watched_actions_video_view || creative.video_p50_watched_actions),
  },
  {
    id: "video_p75_watched_actions_video_view",
    label: "75% Watched",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_p75_watched_actions_video_view || creative.video_p75_watched_actions),
  },
  {
    id: "video_p95_watched_actions_video_view",
    label: "95% Watched",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_p95_watched_actions_video_view || creative.video_p95_watched_actions),
  },
  {
    id: "video_p100_watched_actions_video_view",
    label: "100% Watched",
    category: "video",
    format: "number",
    getValue: (creative) => getActionValue(creative.video_p100_watched_actions_video_view || creative.video_p100_watched_actions),
  },
  {
    id: "video_avg_time_watched_actions_video_view",
    label: "Avg Watch Time",
    category: "video",
    format: "time",
    getValue: (creative) => getActionValue(creative.video_avg_time_watched_actions_video_view || creative.video_avg_time_watched_actions),
  },
];

/**
 * Combined map of all KPI definitions keyed by metric ID.
 */
export const ALL_CREATIVE_KPIS_MAP = [...CREATIVE_PRIMARY_KPIS, ...CREATIVE_VIDEO_KPIS].reduce((acc, kpi) => {
  acc[kpi.id] = kpi;
  return acc;
}, {});

/**
 * Format helper for KPI values adhering to semantic nulls ("–" for null/undefined/missing, exact 0/formatted string for values).
 */
export const formatKpiDisplayValue = (kpiDef, creative, currency = "INR") => {
  if (!kpiDef || !creative) return "–";

  const rawVal = kpiDef.getValue(creative);

  if (rawVal === null || rawVal === undefined || isNaN(Number(rawVal))) {
    return "–";
  }

  const val = Number(rawVal);

  switch (kpiDef.format) {
    case "currency":
      return formatCurrency(val, currency);
    case "number":
      return formatNumber(val);
    case "percentage":
      return `${val.toFixed(2).replace(/\.00$/, "")}%`;
    case "roas":
      return `${val.toFixed(2).replace(/\.00$/, "")}x`;
    case "decimal":
      return val.toFixed(2).replace(/\.00$/, "");
    case "time":
      return `${Math.round(val)} sec`;
    default:
      return String(val);
  }
};
