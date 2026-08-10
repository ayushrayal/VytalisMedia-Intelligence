/**
 * Facebook Adapter for Vytalis Intelligence.
 * Translates domain Meta analytics requests into Windsor Facebook connector queries.
 * 
 * SOLE OWNER of provider-specific Windsor field arrays and Facebook filter structures.
 */

const windsorProvider = require("../providers/windsor.provider");
const WINDSOR_CONSTANTS = require("../config/meta-constants.config");

/**
 * Builds standard equality filter array for activeMetaAccount.
 * Format: [["account_id", "eq", activeMetaAccount]]
 */
const buildAccountFilter = (activeMetaAccount) => {
  return [["account_id", "eq", activeMetaAccount]];
};

/**
 * Safely extracts a numeric value or returns null/fallback.
 */
const getNumericOrNull = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const first = val[0];
    if (first && first.value !== undefined) {
      const parsed = parseFloat(first.value);
      return isNaN(parsed) ? null : parsed;
    }
  }
  if (typeof val === "object" && val.value !== undefined) {
    const parsed = parseFloat(val.value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Normalizes raw Windsor overview response data.
 * Maps provider fields to clean application domain properties:
 * - actions_omni_purchase -> purchases
 * - action_values_omni_purchase -> purchase_conversion_value
 * - cost_per_action_type_omni_purchase -> cost_per_result
 * - purchase_roas_omni_purchase -> purchase_roas
 */
const normalizeOverviewData = (rawData) => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((row) => {
    const normalized = { ...row };

    const rawPurchases = row.actions_omni_purchase ?? row.purchases;
    const rawValue = row.action_values_omni_purchase ?? row.purchase_conversion_value;
    const rawCost = row.cost_per_action_type_omni_purchase ?? row.cost_per_result;
    const rawRoas = row.purchase_roas_omni_purchase ?? row.purchase_roas;

    normalized.purchases = getNumericOrNull(rawPurchases) ?? 0;
    normalized.purchase_conversion_value = getNumericOrNull(rawValue) ?? 0;
    normalized.cost_per_result = getNumericOrNull(rawCost);
    normalized.purchase_roas = getNumericOrNull(rawRoas);

    return normalized;
  });
};

/**
 * Fetches Facebook Account Overview metrics from Windsor.
 */
const fetchOverview = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
  ];

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });

  return normalizeOverviewData(rawData);
};

/**
 * Fetches Facebook Campaigns metrics from Windsor.
 */
const fetchCampaigns = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "campaign",
    "campaign_id",
    "campaign_status",
    "campaign_effective_status",
    "campaign_objective",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

/**
 * Fetches Facebook Ad Sets metrics from Windsor.
 */
const fetchAdsets = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "adset_name",
    "adset_id",
    "campaign",
    "campaign_id",
    "effective_status",
    "adset_status",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

/**
 * Fetches Facebook Ad Creatives metrics from Windsor.
 */
const fetchCreatives = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "campaign",
    "campaign_id",
    "adset_name",
    "adset_id",
    "ad_name",
    "ad_id",
    "effective_status",
    "thumbnail_url",
    "image_url",
    "video_id",
    "object_story_spec",
    "facebook_permalink_url",
    "instagram_permalink_url",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "video_play_actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p95_watched_actions",
    "video_p100_watched_actions",
    "video_avg_time_watched_actions",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

/**
 * Fetches Facebook Audience demographics metrics from Windsor.
 */
const fetchAudience = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "age",
    "gender",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

/**
 * Fetches Facebook Places geographic metrics from Windsor.
 */
const fetchPlaces = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "country",
    "region",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

module.exports = {
  fetchOverview,
  fetchCampaigns,
  fetchAdsets,
  fetchCreatives,
  fetchAudience,
  fetchPlaces,
};
