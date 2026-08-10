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

    normalized.purchases = getNumericOrNull(rawPurchases);
    normalized.purchase_conversion_value = getNumericOrNull(rawValue);
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
const fetchCampaigns = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
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

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return normalizeOverviewData(rawData);
};

/**
 * Fetches Facebook Ad Sets metrics from Windsor.
 */
const fetchAdsets = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
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

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });
};

/**
 * Fetches Facebook Ad Creatives metrics from Windsor.
 */
const fetchCreatives = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
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

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
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

/**
 * Fetches comprehensive details for a single campaign belonging to activeMetaAccount.
 */
const fetchCampaignDetails = async ({ activeMetaAccount, campaignId, datePreset, dateFrom, dateTo }) => {
  // Parallel Windsor fetch for campaign, ad sets, and creatives
  let [campaignsList, adsetsList, creativesList] = await Promise.all([
    fetchCampaigns({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
    fetchAdsets({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
    fetchCreatives({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
  ]);

  let targetCampaign = (campaignsList || []).find(
    (c) => String(c.campaign_id || c.id) === String(campaignId) || String(c.campaign) === String(campaignId)
  );

  if (!targetCampaign) {
    const allCampaigns = await fetchCampaigns({ activeMetaAccount, datePreset, dateFrom, dateTo });
    targetCampaign = (allCampaigns || []).find(
      (c) => String(c.campaign_id || c.id) === String(campaignId) || String(c.campaign) === String(campaignId)
    );
  }

  if (!targetCampaign) {
    const error = new Error(`Campaign '${campaignId}' not found for the active Meta account`);
    error.statusCode = 404;
    throw error;
  }

  const actualCampaignId = String(targetCampaign.campaign_id || targetCampaign.id || campaignId);
  const campaignName = targetCampaign.campaign || targetCampaign.campaign_name;

  if (!adsetsList || adsetsList.length === 0) {
    adsetsList = await fetchAdsets({ activeMetaAccount, datePreset, dateFrom, dateTo });
  }
  if (!creativesList || creativesList.length === 0) {
    creativesList = await fetchCreatives({ activeMetaAccount, datePreset, dateFrom, dateTo });
  }

  const filteredAdSets = (adsetsList || []).filter(
    (a) => String(a.campaign_id) === actualCampaignId || (campaignName && String(a.campaign) === String(campaignName))
  );
  const filteredCreatives = (creativesList || []).filter(
    (cr) => String(cr.campaign_id) === actualCampaignId || (campaignName && String(cr.campaign) === String(campaignName))
  );

  const adSets = filteredAdSets.map((a) => ({
    id: String(a.adset_id || a.id || ""),
    name: a.adset_name || a.name || "Unnamed Ad Set",
    status: a.adset_status || a.effective_status || a.status || "ACTIVE",
    spend: getNumericOrNull(a.spend),
    impressions: getNumericOrNull(a.impressions),
    reach: getNumericOrNull(a.reach),
    clicks: getNumericOrNull(a.clicks),
    ctr: getNumericOrNull(a.ctr),
    cpc: getNumericOrNull(a.cpc),
    currency: a.currency || targetCampaign.currency || "INR",
  }));

  const creatives = filteredCreatives.map((cr) => ({
    id: String(cr.ad_id || cr.creative_id || cr.id || ""),
    ad_name: cr.ad_name || cr.creative_name || "Unnamed Creative",
    ad_id: String(cr.ad_id || cr.creative_id || cr.id || ""),
    effective_status: cr.effective_status || cr.ad_status || cr.status || "ACTIVE",
    thumbnail_url: cr.thumbnail_url || null,
    image_url: cr.image_url || null,
    facebook_permalink_url: cr.facebook_permalink_url || null,
    instagram_permalink_url: cr.instagram_permalink_url || null,
    spend: getNumericOrNull(cr.spend),
    impressions: getNumericOrNull(cr.impressions),
    reach: getNumericOrNull(cr.reach),
    clicks: getNumericOrNull(cr.clicks),
    link_clicks: getNumericOrNull(cr.link_clicks),
    ctr: getNumericOrNull(cr.ctr),
    cpc: getNumericOrNull(cr.cpc),
    cpm: getNumericOrNull(cr.cpm),
    frequency: getNumericOrNull(cr.frequency),
    currency: cr.currency || targetCampaign.currency || "INR",
    video_id: cr.video_id || null,
    video_play_actions: getNumericOrNull(cr.video_play_actions),
    video_p25_watched_actions: getNumericOrNull(cr.video_p25_watched_actions),
    video_p50_watched_actions: getNumericOrNull(cr.video_p50_watched_actions),
    video_p75_watched_actions: getNumericOrNull(cr.video_p75_watched_actions),
    video_p95_watched_actions: getNumericOrNull(cr.video_p95_watched_actions),
    video_p100_watched_actions: getNumericOrNull(cr.video_p100_watched_actions),
    video_avg_time_watched_actions: getNumericOrNull(cr.video_avg_time_watched_actions),
  }));

  const hasCreativeLinkClicks = creatives.some((c) => c.link_clicks !== null);
  const totalLinkClicks = hasCreativeLinkClicks
    ? creatives.reduce((acc, c) => acc + (c.link_clicks || 0), 0)
    : null;

  const performance = {
    spend: getNumericOrNull(targetCampaign.spend),
    impressions: getNumericOrNull(targetCampaign.impressions),
    reach: getNumericOrNull(targetCampaign.reach),
    clicks: getNumericOrNull(targetCampaign.clicks),
    link_clicks: totalLinkClicks !== null ? totalLinkClicks : getNumericOrNull(targetCampaign.link_clicks),
    ctr: getNumericOrNull(targetCampaign.ctr),
    cpc: getNumericOrNull(targetCampaign.cpc),
    cpm: getNumericOrNull(targetCampaign.cpm),
    frequency: getNumericOrNull(targetCampaign.frequency),
    purchases: getNumericOrNull(targetCampaign.purchases),
    purchase_conversion_value: getNumericOrNull(targetCampaign.purchase_conversion_value),
    cost_per_result: getNumericOrNull(targetCampaign.cost_per_result),
    purchase_roas: getNumericOrNull(targetCampaign.purchase_roas),
    currency: targetCampaign.currency || "INR",
  };

  return {
    campaign: {
      id: actualCampaignId,
      name: campaignName || "Unnamed Campaign",
      status: targetCampaign.campaign_status || targetCampaign.campaign_effective_status || targetCampaign.effective_status || "ACTIVE",
      objective: targetCampaign.campaign_objective || "OUTCOME_SALES",
      currency: targetCampaign.currency || "INR",
    },
    adSets,
    creatives,
    performance,
  };
};

module.exports = {
  fetchOverview,
  fetchCampaigns,
  fetchAdsets,
  fetchCreatives,
  fetchAudience,
  fetchPlaces,
  fetchCampaignDetails,
};

