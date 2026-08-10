/**
 * Centralized endpoint registry for Meta Analytics.
 * Defines supported endpoint keys, their corresponding adapter methods, and base TTL values (in seconds).
 * 
 * NOTE: This configuration contains ZERO provider-specific field definitions or Windsor syntax.
 * Provider field knowledge belongs exclusively inside Facebook Adapter.
 */

const META_ENDPOINTS = {
  overview: {
    adapterMethod: "fetchOverview",
    baseTtl: 300, // 5 minutes
  },
  campaigns: {
    adapterMethod: "fetchCampaigns",
    baseTtl: 300, // 5 minutes
  },
  adsets: {
    adapterMethod: "fetchAdsets",
    baseTtl: 300, // 5 minutes
  },
  creatives: {
    adapterMethod: "fetchCreatives",
    baseTtl: 600, // 10 minutes
  },
  audience: {
    adapterMethod: "fetchAudience",
    baseTtl: 900, // 15 minutes
  },
  places: {
    adapterMethod: "fetchPlaces",
    baseTtl: 900, // 15 minutes
  },
};

const ALLOWED_META_ENDPOINTS = Object.keys(META_ENDPOINTS);

module.exports = {
  META_ENDPOINTS,
  ALLOWED_META_ENDPOINTS,
};
