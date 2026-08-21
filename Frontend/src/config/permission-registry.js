/**
 * Centralized Permission Registry for Vytalis Intelligence Frontend.
 * Matches backend permission keys exactly.
 */

export const PERMISSION_KEYS = {
  DASHBOARD_VIEW: "dashboard.view",

  META_VIEW: "meta.view",
  META_OVERVIEW: "meta.overview",
  META_CAMPAIGNS: "meta.campaigns",
  META_ADSETS: "meta.adsets",
  META_CREATIVES: "meta.creatives",
  META_WINNING_CREATIVES: "meta.winning_creatives",
  META_POOR_PERFORMERS: "meta.poor_performers",
  META_AUDIENCE: "meta.audience",
  META_PLACES: "meta.places",
  META_COMPARE: "meta.compare",

  SHOPIFY_VIEW: "shopify.view",
  SHOPIFY_OVERVIEW: "shopify.overview",
  SHOPIFY_ORDERS: "shopify.orders",
  SHOPIFY_PRODUCTS: "shopify.products",
  SHOPIFY_CUSTOMERS: "shopify.customers",
  SHOPIFY_LOCATION: "shopify.location",
  SHOPIFY_COMPARE: "shopify.compare",

  ATTRIBUTION_VIEW: "attribution.view",

  USER_MANAGEMENT_ADMINS: "user_management.admins",
  USER_MANAGEMENT_CLIENTS: "user_management.clients",
  USER_MANAGEMENT_MEMBERS: "user_management.members",
};

export const ALL_PERMISSION_KEYS = Object.values(PERMISSION_KEYS);

export const PERMISSION_LABELS = {
  [PERMISSION_KEYS.DASHBOARD_VIEW]: "Dashboard Overview",

  [PERMISSION_KEYS.META_VIEW]: "Meta Integration Module",
  [PERMISSION_KEYS.META_OVERVIEW]: "Meta Overview",
  [PERMISSION_KEYS.META_CAMPAIGNS]: "Meta Campaigns",
  [PERMISSION_KEYS.META_ADSETS]: "Meta Ad Sets",
  [PERMISSION_KEYS.META_CREATIVES]: "Meta Creatives Gallery",
  [PERMISSION_KEYS.META_WINNING_CREATIVES]: "Meta Winning Creatives",
  [PERMISSION_KEYS.META_POOR_PERFORMERS]: "Meta Poor Performers",
  [PERMISSION_KEYS.META_AUDIENCE]: "Meta Audience",
  [PERMISSION_KEYS.META_PLACES]: "Meta Places",
  [PERMISSION_KEYS.META_COMPARE]: "Meta Compare",

  [PERMISSION_KEYS.SHOPIFY_VIEW]: "Shopify Integration Module",
  [PERMISSION_KEYS.SHOPIFY_OVERVIEW]: "Shopify Overview",
  [PERMISSION_KEYS.SHOPIFY_ORDERS]: "Shopify Orders",
  [PERMISSION_KEYS.SHOPIFY_PRODUCTS]: "Shopify Products",
  [PERMISSION_KEYS.SHOPIFY_CUSTOMERS]: "Shopify Customers",
  [PERMISSION_KEYS.SHOPIFY_LOCATION]: "Shopify Location",
  [PERMISSION_KEYS.SHOPIFY_COMPARE]: "Shopify Compare",

  [PERMISSION_KEYS.ATTRIBUTION_VIEW]: "Attribution Engine",

  [PERMISSION_KEYS.USER_MANAGEMENT_ADMINS]: "Manage Admins",
  [PERMISSION_KEYS.USER_MANAGEMENT_CLIENTS]: "Manage Clients",
  [PERMISSION_KEYS.USER_MANAGEMENT_MEMBERS]: "Manage Members",
};
