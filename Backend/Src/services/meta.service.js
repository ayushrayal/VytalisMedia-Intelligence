const User = require("../models/user.model");
const logger = require("../utils/logger.util");
const { invalidateUserCache } = require("../utils/user-cache.util");

// ====================================================
// PRIVATE SERVICE HELPER FUNCTIONS (UNEXPORTED)
// ====================================================

/**
 * Internal helper to find a Meta account object by accountId.
 *
 * @param {Array} accounts - Meta accounts array
 * @param {string} accountId - Meta account ID to search
 * @returns {Object|undefined} Matched Meta account or undefined
 */
const findMetaAccount = (accounts, accountId) => {
  const cleanAccountId = accountId ? accountId.trim() : "";
  return accounts.find((acc) => acc.accountId === cleanAccountId);
};

/**
 * Internal helper to find a Meta account index by accountId.
 *
 * @param {Array} accounts - Meta accounts array
 * @param {string} accountId - Meta account ID to search
 * @returns {number} Index of matched account or -1
 */
const findMetaAccountIndex = (accounts, accountId) => {
  const cleanAccountId = accountId ? accountId.trim() : "";
  return accounts.findIndex((acc) => acc.accountId === cleanAccountId);
};

/**
 * Internal helper to check if an accountId is duplicated across Meta accounts.
 * Optionally excludes a specific target accountId (used during updates).
 *
 * @param {Array} accounts - Meta accounts array
 * @param {string} accountId - Account ID to check
 * @param {string|null} excludeAccountId - Account ID to ignore during check
 * @returns {boolean} True if duplicate exists, false otherwise
 */
const isDuplicateAccountId = (accounts, accountId, excludeAccountId = null) => {
  const cleanAccountId = accountId ? accountId.trim() : "";
  const cleanExcludeId = excludeAccountId ? excludeAccountId.trim() : null;

  return accounts.some((acc) => {
    if (cleanExcludeId && acc.accountId === cleanExcludeId) {
      return false;
    }
    return acc.accountId === cleanAccountId;
  });
};

// ====================================================
// DOMAIN SERVICE METHODS
// ====================================================

/**
 * Adds a new Meta account for the authenticated user.
 * Automatically sets user.preferences.activeMetaAccount on the FIRST added account.
 *
 * @param {string} userId - Authenticated user ID
 * @param {Object} payload - Account payload
 * @param {string} payload.accountId - Meta account ID
 * @param {string} payload.accountName - Meta account display name
 * @returns {Promise<Object>} Added Meta account object
 */
const addMetaAccount = async (userOrId, { accountId, accountName }) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Add Meta account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountId = accountId.trim();
  const cleanAccountName = accountName.trim();

  // Check for duplicate accountId per target integration user
  if (!targetUser.integrations) targetUser.integrations = { meta: [], shopify: [] };
  if (!targetUser.integrations.meta) targetUser.integrations.meta = [];

  if (isDuplicateAccountId(targetUser.integrations.meta, cleanAccountId)) {
    logger.warn(`Add Meta account failed: Duplicate accountId ${cleanAccountId} for user ${targetUser._id}`);
    const err = new Error("Meta account with this accountId already exists");
    err.statusCode = 409;
    throw err;
  }

  const isFirstAccount = targetUser.integrations.meta.length === 0;

  targetUser.integrations.meta.push({
    accountId: cleanAccountId,
    accountName: cleanAccountName,
    connectedAt: new Date(),
  });

  // First Account Rule: Automatically set preferred active Meta account
  if (isFirstAccount) {
    if (!targetUser.preferences) targetUser.preferences = {};
    targetUser.preferences.activeMetaAccount = cleanAccountId;
  }

  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  const addedAccount = targetUser.integrations.meta[targetUser.integrations.meta.length - 1];
  return addedAccount;
};

const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");

/**
 * Retrieves all Meta accounts and preferred active Meta account for authenticated user.
 * Automatically resolves parent Organization/Client integrations for Members.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @returns {Promise<Object>} Object containing accounts array and activeMetaAccount preference
 */
const getAllMetaAccounts = async (userOrId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Get Meta accounts failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  return {
    accounts: targetUser.integrations?.meta || [],
    activeMetaAccount: targetUser.preferences?.activeMetaAccount || null,
  };
};

/**
 * Retrieves a single Meta account by accountId for authenticated user.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountId - Meta account ID
 * @returns {Promise<Object>} Matched Meta account object
 */
const getMetaAccountById = async (userOrId, accountId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Get Meta account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const account = findMetaAccount(targetUser.integrations?.meta || [], accountId);
  if (!account) {
    logger.warn(`Get Meta account failed: Account ${accountId} not found for user ${user._id}`);
    const err = new Error("Meta account not found");
    err.statusCode = 404;
    throw err;
  }

  return account;
};

/**
 * Updates accountName and/or accountId of a Meta account by accountId.
 * Automatically synchronizes user.preferences.activeMetaAccount if preferred account's accountId changes.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountIdParam - Current Meta account ID from URL params
 * @param {Object} payload - Update payload
 * @param {string} [payload.accountId] - Optional new account ID
 * @param {string} [payload.accountName] - Optional new display name
 * @returns {Promise<Object>} Updated Meta account object
 */
const updateMetaAccount = async (userOrId, accountIdParam, { accountId: newAccountId, accountName }) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Update Meta account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanParamId = accountIdParam.trim();
  const account = findMetaAccount(targetUser.integrations?.meta || [], cleanParamId);

  if (!account) {
    logger.warn(`Update Meta account failed: Account ${cleanParamId} not found for user ${user._id}`);
    const err = new Error("Meta account not found");
    err.statusCode = 404;
    throw err;
  }

  const cleanNewAccountId = newAccountId ? newAccountId.trim() : null;
  const cleanAccountName = accountName ? accountName.trim() : null;

  // Check duplicate if accountId is changing
  if (cleanNewAccountId && cleanNewAccountId !== account.accountId) {
    if (isDuplicateAccountId(targetUser.integrations.meta, cleanNewAccountId, cleanParamId)) {
      logger.warn(`Update Meta account failed: Duplicate target accountId ${cleanNewAccountId} for user ${targetUser._id}`);
      const err = new Error("Meta account with this accountId already exists");
      err.statusCode = 409;
      throw err;
    }
  }

  const isPreferredAccount = targetUser.preferences?.activeMetaAccount === account.accountId;

  if (cleanNewAccountId) {
    account.accountId = cleanNewAccountId;
  }

  if (cleanAccountName) {
    account.accountName = cleanAccountName;
  }

  // Sync preference if preferred account's accountId changed
  if (isPreferredAccount && cleanNewAccountId) {
    if (!targetUser.preferences) targetUser.preferences = {};
    targetUser.preferences.activeMetaAccount = cleanNewAccountId;
  }

  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  return account;
};

/**
 * Deletes a single Meta account by accountId.
 * Automatically synchronizes user.preferences.activeMetaAccount if preferred account is deleted.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountId - Meta account ID
 * @returns {Promise<Object>} Deleted Meta account object
 */
const deleteMetaAccount = async (userOrId, accountId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Delete Meta account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountId = accountId.trim();
  const index = findMetaAccountIndex(targetUser.integrations?.meta || [], cleanAccountId);

  if (index === -1) {
    logger.warn(`Delete Meta account failed: Account ${cleanAccountId} not found for user ${user._id}`);
    const err = new Error("Meta account not found");
    err.statusCode = 404;
    throw err;
  }

  const isPreferredAccount = targetUser.preferences?.activeMetaAccount === cleanAccountId;

  const [deletedAccount] = targetUser.integrations.meta.splice(index, 1);

  // Delete Synchronization Rule: If preferred account is deleted
  if (isPreferredAccount) {
    if (targetUser.integrations.meta.length > 0) {
      targetUser.preferences.activeMetaAccount = targetUser.integrations.meta[0].accountId;
    } else {
      targetUser.preferences.activeMetaAccount = null;
    }
  }

  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  return deletedAccount;
};

/**
 * Deletes all Meta accounts for authenticated user.
 * Resets user.preferences.activeMetaAccount to null.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @returns {Promise<Object>} Object containing deletedCount
 */
const deleteAllMetaAccounts = async (userOrId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Delete all Meta accounts failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const deletedCount = targetUser.integrations?.meta?.length || 0;
  if (targetUser.integrations) targetUser.integrations.meta = [];
  if (targetUser.preferences) targetUser.preferences.activeMetaAccount = null;

  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  return { deletedCount };
};

/**
 * Sets preferred active Meta account for authenticated user.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountId - Target Meta account ID to activate
 * @returns {Promise<Object>} Object containing activeMetaAccount and matched account
 */
const setActiveMetaAccount = async (userOrId, accountId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Set active Meta account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountId = accountId.trim();
  const account = findMetaAccount(targetUser.integrations?.meta || [], cleanAccountId);

  if (!account) {
    logger.warn(`Set active Meta account failed: Account ${cleanAccountId} not found for user ${user._id}`);
    const err = new Error("Meta account not found");
    err.statusCode = 404;
    throw err;
  }

  if (targetUser.preferences?.activeMetaAccount === cleanAccountId) {
    return {
      activeMetaAccount: cleanAccountId,
      account,
    };
  }

  if (!targetUser.preferences) targetUser.preferences = {};
  targetUser.preferences.activeMetaAccount = cleanAccountId;
  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  return {
    activeMetaAccount: cleanAccountId,
    account,
  };
};

/**
 * Retrieves customizable creative card KPI preferences for authenticated user.
 */
const getCreativeCardPreferences = async (userOrId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const defaultPrimary = ["spend", "purchases", "cost_per_result", "purchase_roas"];
  const defaultVideo = ["hook_rate", "hold_rate"];

  const prefs = targetUser.preferences?.creativeCardPreferences || {};

  return {
    primaryMetrics: Array.isArray(prefs.primaryMetrics) && prefs.primaryMetrics.length > 0
      ? prefs.primaryMetrics
      : defaultPrimary,
    videoMetrics: Array.isArray(prefs.videoMetrics) && prefs.videoMetrics.length > 0
      ? prefs.videoMetrics
      : defaultVideo,
    showFacebookLink: prefs.showFacebookLink !== undefined ? Boolean(prefs.showFacebookLink) : true,
    showInstagramLink: prefs.showInstagramLink !== undefined ? Boolean(prefs.showInstagramLink) : true,
    showHookHoldRates: prefs.showHookHoldRates !== undefined ? Boolean(prefs.showHookHoldRates) : true,
    winningRoasThreshold: prefs.winningRoasThreshold !== undefined && !isNaN(Number(prefs.winningRoasThreshold)) ? Number(prefs.winningRoasThreshold) : 1.0,
    poorRoasThreshold: prefs.poorRoasThreshold !== undefined && !isNaN(Number(prefs.poorRoasThreshold)) ? Number(prefs.poorRoasThreshold) : 1.0,
  };
};

/**
 * Updates customizable creative card KPI preferences for authenticated user.
 */
const updateCreativeCardPreferences = async (userOrId, { primaryMetrics, videoMetrics, showFacebookLink, showInstagramLink, showHookHoldRates, winningRoasThreshold, poorRoasThreshold }) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const defaultPrimary = ["spend", "purchases", "cost_per_result", "purchase_roas"];
  const defaultVideo = ["hook_rate", "hold_rate"];

  if (!targetUser.preferences) {
    targetUser.preferences = {};
  }

  targetUser.preferences.creativeCardPreferences = {
    primaryMetrics: Array.isArray(primaryMetrics) && primaryMetrics.length > 0
      ? primaryMetrics.slice(0, 4)
      : defaultPrimary,
    videoMetrics: Array.isArray(videoMetrics) && videoMetrics.length > 0
      ? videoMetrics.slice(0, 2)
      : defaultVideo,
    showFacebookLink: showFacebookLink !== undefined ? Boolean(showFacebookLink) : true,
    showInstagramLink: showInstagramLink !== undefined ? Boolean(showInstagramLink) : true,
    showHookHoldRates: showHookHoldRates !== undefined ? Boolean(showHookHoldRates) : true,
    winningRoasThreshold: winningRoasThreshold !== undefined && !isNaN(Number(winningRoasThreshold)) ? Number(winningRoasThreshold) : 1.0,
    poorRoasThreshold: poorRoasThreshold !== undefined && !isNaN(Number(poorRoasThreshold)) ? Number(poorRoasThreshold) : 1.0,
  };

  await targetUser.save();
  invalidateUserCache(targetUser._id);
  if (user._id && String(user._id) !== String(targetUser._id)) invalidateUserCache(user._id);

  return targetUser.preferences.creativeCardPreferences;
};

module.exports = {
  addMetaAccount,
  getAllMetaAccounts,
  getMetaAccountById,
  updateMetaAccount,
  deleteMetaAccount,
  deleteAllMetaAccounts,
  setActiveMetaAccount,
  getCreativeCardPreferences,
  updateCreativeCardPreferences,
};
