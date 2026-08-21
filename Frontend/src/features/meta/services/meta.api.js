/**
 * Meta Feature API Service for Vytalis Intelligence frontend.
 * Centralized Meta account management & Meta analytics endpoints calls.
 * 
 * IMPORTANT:
 * Analytics request functions receive ONLY date parameters.
 * They MUST NEVER accept or send accountId.
 * Target account selection is handled strictly on backend from user.preferences.activeMetaAccount.
 */

import { http } from "../../../lib/http.js";

/**
 * Builds clean URL query string from parameter object.
 */
const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
      query.append(key, params[key]);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
};

// ==========================================
// META ACCOUNT MANAGEMENT APIs
// ==========================================

export const getMetaAccounts = async () => {
  return await http.get("/meta/accounts");
};

export const addMetaAccount = async ({ accountId, accountName }) => {
  return await http.post("/meta/accounts", { accountId, accountName });
};

export const setActiveMetaAccount = async (accountId) => {
  return await http.patch("/meta/accounts/active", { accountId });
};

export const getMetaAccountById = async (accountId) => {
  return await http.get(`/meta/accounts/${accountId}`);
};

export const updateMetaAccount = async (accountId, data) => {
  return await http.patch(`/meta/accounts/${accountId}`, data);
};

export const deleteMetaAccount = async (accountId) => {
  return await http.delete(`/meta/accounts/${accountId}`);
};

// ==========================================
// META ANALYTICS APIs (No accountId allowed!)
// ==========================================

export const getMetaOverview = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/overview${query}`);
};

export const getCampaigns = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/campaigns${query}`);
};

export const getAdsets = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/adsets${query}`);
};

export const getCreatives = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/creatives${query}`);
};

export const getAudience = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/audience${query}`);
};

export const getCampaignDetails = async (campaignId, params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/campaigns/${encodeURIComponent(campaignId)}/details${query}`);
};

export const getCampaignBreakdowns = async (campaignId, params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/campaigns/${encodeURIComponent(campaignId)}/breakdowns${query}`);
};

export const getPlaces = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/analytics/places${query}`);
};

export const getMetaCompare = async (params = {}) => {
  const query = buildQueryString(params);
  return await http.get(`/meta/compare${query}`);
};

export const getCreativeCardPreferences = async () => {
  return await http.get("/meta/preferences/creative-card");
};

export const updateCreativeCardPreferences = async (preferences) => {
  return await http.put("/meta/preferences/creative-card", preferences);
};


