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
 * Fetches Facebook Campaigns metrics from Windsor.
 */
const fetchCampaigns = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "account_id",
    "account_name",
    "campaign_id",
    "campaign",
    "campaign_status",
    "campaign_effective_status",
    "campaign_objective",
    "buying_type",
    "campaign_daily_budget",
    "campaign_lifetime_budget",
    "spend",
    "clicks",
    "impressions",
    "reach",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
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
 * Fetches Facebook AdSets metrics from Windsor.
 */
const fetchAdsets = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "campaign",
    "campaign_id",
    "adset_id",
    "adset_name",
    "effective_status",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
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
 * Fetches Facebook Audience Demographics (age, gender) metrics from Windsor.
 */
const fetchAudience = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
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
 * Fetches Facebook Place / Geographic metrics from Windsor.
 */
const fetchPlaces = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "country",
    "region",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
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
