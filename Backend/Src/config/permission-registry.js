/**
 * Centralized Permission Registry for Vytalis Intelligence Backend.
 * Serves as the single source of truth for permission keys and role default permission sets.
 */

const PERMISSION_KEYS = {
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
  SHOPIFY_INVENTORY: "shopify.inventory",
  SHOPIFY_COMPARE: "shopify.compare",

  ATTRIBUTION_VIEW: "attribution.view",

  USER_MANAGEMENT_ADMINS: "user_management.admins",
  USER_MANAGEMENT_CLIENTS: "user_management.clients",
  USER_MANAGEMENT_MEMBERS: "user_management.members",
};

const ALL_PERMISSION_KEYS = Object.values(PERMISSION_KEYS);

/**
 * Returns default permission assignments map for a given role.
 *
 * @param {string} role - "root_admin" | "admin" | "client" | "member"
 * @returns {Record<string, boolean>} Permission key -> boolean map
 */
const getDefaultPermissions = (role) => {
  const permissions = {};
  ALL_PERMISSION_KEYS.forEach((key) => {
    permissions[key] = false;
  });

  if (role === "root_admin") {
    ALL_PERMISSION_KEYS.forEach((key) => {
      permissions[key] = true;
    });
    return permissions;
  }

  if (role === "admin") {
    // Admins get full feature access + client & member management by default
    ALL_PERMISSION_KEYS.forEach((key) => {
      permissions[key] = true;
    });
    // Admins do not manage other Admins unless granted by Root
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_ADMINS] = false;
    return permissions;
  }

  if (role === "client") {
    // Clients get full Dashboard, Meta, Shopify, Attribution features by default
    permissions[PERMISSION_KEYS.DASHBOARD_VIEW] = true;
    permissions[PERMISSION_KEYS.META_VIEW] = true;
    permissions[PERMISSION_KEYS.META_OVERVIEW] = true;
    permissions[PERMISSION_KEYS.META_CAMPAIGNS] = true;
    permissions[PERMISSION_KEYS.META_ADSETS] = true;
    permissions[PERMISSION_KEYS.META_CREATIVES] = true;
    permissions[PERMISSION_KEYS.META_WINNING_CREATIVES] = true;
    permissions[PERMISSION_KEYS.META_POOR_PERFORMERS] = true;
    permissions[PERMISSION_KEYS.META_AUDIENCE] = true;
    permissions[PERMISSION_KEYS.META_PLACES] = true;
    permissions[PERMISSION_KEYS.META_COMPARE] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_VIEW] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_OVERVIEW] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_ORDERS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_PRODUCTS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_CUSTOMERS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_LOCATION] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_INVENTORY] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_COMPARE] = true;
    permissions[PERMISSION_KEYS.ATTRIBUTION_VIEW] = true;
    // Clients CANNOT manage users
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_ADMINS] = false;
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_CLIENTS] = false;
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_MEMBERS] = false;
    return permissions;
  }

  if (role === "member") {
    // Members inherit client permissions, default to basic views
    permissions[PERMISSION_KEYS.DASHBOARD_VIEW] = true;
    permissions[PERMISSION_KEYS.META_VIEW] = true;
    permissions[PERMISSION_KEYS.META_OVERVIEW] = true;
    permissions[PERMISSION_KEYS.META_CAMPAIGNS] = true;
    permissions[PERMISSION_KEYS.META_ADSETS] = true;
    permissions[PERMISSION_KEYS.META_CREATIVES] = true;
    permissions[PERMISSION_KEYS.META_WINNING_CREATIVES] = true;
    permissions[PERMISSION_KEYS.META_POOR_PERFORMERS] = true;
    permissions[PERMISSION_KEYS.META_AUDIENCE] = true;
    permissions[PERMISSION_KEYS.META_PLACES] = true;
    permissions[PERMISSION_KEYS.META_COMPARE] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_VIEW] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_OVERVIEW] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_ORDERS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_PRODUCTS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_CUSTOMERS] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_LOCATION] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_INVENTORY] = true;
    permissions[PERMISSION_KEYS.SHOPIFY_COMPARE] = true;
    permissions[PERMISSION_KEYS.ATTRIBUTION_VIEW] = true;
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_ADMINS] = false;
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_CLIENTS] = false;
    permissions[PERMISSION_KEYS.USER_MANAGEMENT_MEMBERS] = false;
    return permissions;
  }

  return permissions;
};

module.exports = {
  PERMISSION_KEYS,
  ALL_PERMISSION_KEYS,
  getDefaultPermissions,
};
