import { http } from "../../../lib/http.js";

/**
 * Builds normalized query string for Shopify Analytics API requests.
 * STRICT CONTRACT: Never sends date_preset together with date_from/date_to.
 */
export const buildShopifyQueryString = (params = {}) => {
  const query = new URLSearchParams();
  if (params.datePreset || params.date_preset) {
    query.append("date_preset", params.datePreset || params.date_preset);
  } else if ((params.dateFrom || params.date_from) && (params.dateTo || params.date_to)) {
    query.append("date_from", params.dateFrom || params.date_from);
    query.append("date_to", params.dateTo || params.date_to);
  }
  const str = query.toString();
  return str ? `?${str}` : "";
};

export const getShopifyOverview = (params = {}) => {
  const q = buildShopifyQueryString(params);
  return http.get(`/shopify/overview${q}`);
};

export const getShopifyOrders = (params = {}) => {
  const q = buildShopifyQueryString(params);
  return http.get(`/shopify/orders${q}`);
};

export const getShopifyProducts = (params = {}) => {
  const q = buildShopifyQueryString(params);
  return http.get(`/shopify/products${q}`);
};

export const getShopifyCustomers = (params = {}) => {
  const q = buildShopifyQueryString(params);
  return http.get(`/shopify/customers${q}`);
};

export const getShopifyLocation = (params = {}) => {
  const q = buildShopifyQueryString(params);
  return http.get(`/shopify/location${q}`);
};

export const getShopifyOverviewBundle = async (params = {}) => {
  const [overviewRes, ordersRes, customersRes] = await Promise.allSettled([
    getShopifyOverview(params),
    getShopifyOrders(params),
    getShopifyCustomers(params),
  ]);

  return {
    overviewData: overviewRes.status === "fulfilled" && Array.isArray(overviewRes.value?.data) ? overviewRes.value.data : [],
    ordersData: ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data) ? ordersRes.value.data : [],
    customersData: customersRes.status === "fulfilled" && Array.isArray(customersRes.value?.data) ? customersRes.value.data : [],
  };
};
