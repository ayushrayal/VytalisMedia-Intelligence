import { http } from "../../../lib/http.js";

/**
 * Builds URL search parameters string from a key-value params object.
 */
const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  }
  const str = query.toString();
  return str ? `?${str}` : "";
};

/**
 * Fetches Attribution Overview metrics from backend.
 * GET /api/attribution/overview
 *
 * @param {Object} [params={}] - Date and query parameters
 * @returns {Promise<Object>} API response object containing overview data and meta
 */
export const getAttributionOverview = async (params = {}) => {
  const queryStr = buildQueryString(params);
  return await http.get(`/attribution/overview${queryStr}`);
};

/**
 * Fetches paginated Attribution Orders from backend.
 * GET /api/attribution/orders
 *
 * @param {Object} [params={}] - Query, pagination, and filter parameters
 * @returns {Promise<Object>} API response object containing orders list and meta
 */
export const getAttributionOrders = async (params = {}) => {
  const queryStr = buildQueryString(params);
  return await http.get(`/attribution/orders${queryStr}`);
};
