/**
 * Constants configuration for Shopify / Windsor integrations.
 * Centralizes connector names, URLs, default parameter values, and verified fields.
 */

const SHOPIFY_CONSTANTS = {
  CONNECTOR_SHOPIFY: "shopify",
  BASE_URL: "https://connectors.windsor.ai",
  DEFAULT_DATE_PRESET: "last_7d",
  VERIFIED_FIELDS: [
    "account_id",
    "account_name",
    "shop_id",
    "shop_name",
    "shop_timezone",
  ],
};

module.exports = SHOPIFY_CONSTANTS;
