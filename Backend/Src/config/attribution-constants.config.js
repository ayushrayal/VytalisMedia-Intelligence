/**
 * Constants and configuration for the Attribution feature in Vytalis Intelligence.
 */

const ATTRIBUTION_CONSTANTS = {
  CONNECTOR_SHOPIFY: "shopify",
  BASE_TTL: 300,

  // Required Windsor fields for Attribution order analysis
  FIELDS: [
    "account_name",
    "order_id",
    "order_created_at",
    "order_net_sales",
    "order_gross_sales",
    "order_total_price",
    "order_financial_status",
    "order_custom_attributes",
  ],

  // 7 Canonical Raw Channels
  CHANNELS: {
    META_ADS: "Meta Ads",
    GOOGLE_ADS: "Google Ads",
    GOOGLE_ORGANIC: "Google Organic",
    CRM_WHATSAPP_EMAIL: "CRM / WhatsApp / Email",
    AI_LLM_REFERRAL: "AI / LLM Referral",
    OTHER_TAGGED: "Other (Tagged)",
    NOT_ATTRIBUTED: "Not Attributed",
  },

  // 3 Top-Level UI Groups
  GROUPS: {
    META: "meta",
    GOOGLE: "google",
    NOT_ATTRIBUTION: "not_attribution",
  },

  // Mapping from Raw Channel label to Top-Level UI Group
  CHANNEL_TO_GROUP_MAP: {
    "Meta Ads": "meta",
    "Google Ads": "google",
    "Google Organic": "not_attribution",
    "CRM / WhatsApp / Email": "not_attribution",
    "AI / LLM Referral": "not_attribution",
    "Other (Tagged)": "not_attribution",
    "Not Attributed": "not_attribution",
  },

  // Meta Ads Match Keywords
  META_SOURCES: ["meta", "facebook", "fb", "instagram", "ig_"],
  META_MEDIUMS: ["facebook", "instagram"],

  // Google Ads Match Keywords
  GOOGLE_PAID_SOURCES: ["google", "youtube"],
  GOOGLE_PAID_MEDIUMS: ["cpc", "ppc", "paid", "paidsearch", "paid_search", "display", "pmax"],

  // Google Organic Referrer Hosts
  GOOGLE_ORGANIC_HOSTS: ["google.", "youtube.", "syndicatedsearch"],

  // CRM / Email / WhatsApp Match Keywords
  BITESPEED_SOURCE: "bitespeed",
  KWIKENGAGE_SOURCE: "kwikengage",
  CRM_SOURCES: ["bitespeed", "kwikengage"],
  CRM_MEDIUMS: ["whatsapp", "email", "sms"],


  // AI / LLM Referral Keywords
  AI_LLM_KEYWORDS: ["chatgpt", "perplexity", "gemini", "claude", "copilot"],
};

module.exports = ATTRIBUTION_CONSTANTS;
