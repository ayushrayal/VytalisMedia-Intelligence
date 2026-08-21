const User = require("../models/user.model");
const logger = require("../utils/logger.util");

// ====================================================
// PRIVATE SERVICE HELPER FUNCTIONS (UNEXPORTED)
// ====================================================

/**
 * Internal helper to find a Shopify account object by accountName.
 *
 * @param {Array} accounts - Shopify accounts array
 * @param {string} accountName - Shopify accountName to search
 * @returns {Object|undefined} Matched Shopify account or undefined
 */
const findShopifyAccount = (accounts, accountName) => {
  const cleanAccountName = accountName ? accountName.trim() : "";
  return accounts.find((acc) => acc.accountName === cleanAccountName);
};

/**
 * Internal helper to find a Shopify account index by accountName.
 *
 * @param {Array} accounts - Shopify accounts array
 * @param {string} accountName - Shopify accountName to search
 * @returns {number} Index of matched account or -1
 */
const findShopifyAccountIndex = (accounts, accountName) => {
  const cleanAccountName = accountName ? accountName.trim() : "";
  return accounts.findIndex((acc) => acc.accountName === cleanAccountName);
};

/**
 * Internal helper to check if an accountName is duplicated across Shopify accounts.
 * Optionally excludes a specific target accountName (used during updates).
 *
 * @param {Array} accounts - Shopify accounts array
 * @param {string} accountName - accountName domain to check
 * @param {string|null} excludeAccountName - accountName domain to ignore during check
 * @returns {boolean} True if duplicate exists, false otherwise
 */
const isDuplicateAccountName = (accounts, accountName, excludeAccountName = null) => {
  const cleanAccountName = accountName ? accountName.trim() : "";
  const cleanExcludeName = excludeAccountName ? excludeAccountName.trim() : null;

  return accounts.some((acc) => {
    if (cleanExcludeName && acc.accountName === cleanExcludeName) {
      return false;
    }
    return acc.accountName === cleanAccountName;
  });
};

// ====================================================
// DOMAIN SERVICE METHODS
// ====================================================

/**
 * Adds a new Shopify account for the authenticated user.
 * Automatically sets user.preferences.activeShopifyAccount on the FIRST added account.
 *
 * @param {string} userId - Authenticated user ID
 * @param {Object} payload - Account payload
 * @param {string} payload.shopName - Human-readable store display name
 * @param {string} payload.accountName - Shopify myshopify.com store domain identifier
 * @returns {Promise<Object>} Added Shopify account object
 */
const addShopifyAccount = async (userOrId, { shopName, accountName }) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Add Shopify account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountName = accountName.trim();
  const cleanShopName = shopName.trim();

  if (!targetUser.integrations) targetUser.integrations = { meta: [], shopify: [] };
  if (!targetUser.integrations.shopify) targetUser.integrations.shopify = [];

  // Check for duplicate accountName per target user
  if (isDuplicateAccountName(targetUser.integrations.shopify, cleanAccountName)) {
    logger.warn(`Add Shopify account failed: Duplicate accountName ${cleanAccountName} for user ${targetUser._id}`);
    const err = new Error("Shopify account with this accountName already exists");
    err.statusCode = 409;
    throw err;
  }

  const isFirstAccount = targetUser.integrations.shopify.length === 0;

  targetUser.integrations.shopify.push({
    accountName: cleanAccountName,
    shopName: cleanShopName,
    status: "active",
    connectedAt: new Date(),
  });

  // First Account Rule: Automatically set preferred active Shopify account
  if (isFirstAccount) {
    if (!targetUser.preferences) targetUser.preferences = {};
    targetUser.preferences.activeShopifyAccount = cleanAccountName;
  }

  await targetUser.save();

  const addedAccount = targetUser.integrations.shopify[targetUser.integrations.shopify.length - 1];
  return addedAccount;
};

const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");

/**
 * Retrieves all Shopify accounts and preferred active Shopify account for authenticated user.
 * Automatically resolves parent Organization/Client integrations for Members.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @returns {Promise<Object>} Object containing accounts array and activeShopifyAccount preference
 */
const getAllShopifyAccounts = async (userOrId) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Get Shopify accounts failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  return {
    accounts: targetUser.integrations?.shopify || [],
    activeShopifyAccount: targetUser.preferences?.activeShopifyAccount || null,
  };
};

/**
 * Retrieves a single Shopify account by accountName for authenticated user.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountName - Shopify store domain identifier
 * @returns {Promise<Object>} Matched Shopify account object
 */
const getShopifyAccountById = async (userOrId, accountName) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Get Shopify account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const account = findShopifyAccount(targetUser.integrations?.shopify || [], accountName);
  if (!account) {
    logger.warn(`Get Shopify account failed: Account ${accountName} not found for user ${user._id}`);
    const err = new Error("Shopify account not found");
    err.statusCode = 404;
    throw err;
  }

  return account;
};

/**
 * Updates shopName and/or accountName of a Shopify account by accountName.
 * Automatically synchronizes user.preferences.activeShopifyAccount if preferred account's accountName changes.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} targetAccountNameParam - Current Shopify accountName from URL params
 * @param {Object} payload - Update payload
 * @param {string} [payload.shopName] - Optional new store display name
 * @param {string} [payload.accountName] - Optional new store domain identifier
 * @returns {Promise<Object>} Updated Shopify account object
 */
const updateShopifyAccount = async (
  userOrId,
  targetAccountNameParam,
  { shopName, accountName: newAccountName }
) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Update Shopify account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanParamName = targetAccountNameParam.trim();
  const account = findShopifyAccount(targetUser.integrations?.shopify || [], cleanParamName);

  if (!account) {
    logger.warn(`Update Shopify account failed: Account ${cleanParamName} not found for user ${user._id}`);
    const err = new Error("Shopify account not found");
    err.statusCode = 404;
    throw err;
  }

  const cleanNewAccountName = newAccountName ? newAccountName.trim() : null;
  const cleanShopName = shopName ? shopName.trim() : null;

  // Check duplicate if accountName is changing
  if (cleanNewAccountName && cleanNewAccountName !== account.accountName) {
    if (isDuplicateAccountName(targetUser.integrations.shopify, cleanNewAccountName, cleanParamName)) {
      logger.warn(`Update Shopify account failed: Duplicate target accountName ${cleanNewAccountName} for user ${targetUser._id}`);
      const err = new Error("Shopify account with this accountName already exists");
      err.statusCode = 409;
      throw err;
    }
  }

  const isPreferredAccount = targetUser.preferences?.activeShopifyAccount === account.accountName;

  if (cleanNewAccountName) {
    account.accountName = cleanNewAccountName;
  }

  if (cleanShopName) {
    account.shopName = cleanShopName;
  }

  // Sync preference if preferred account's accountName changed
  if (isPreferredAccount && cleanNewAccountName) {
    if (!targetUser.preferences) targetUser.preferences = {};
    targetUser.preferences.activeShopifyAccount = cleanNewAccountName;
  }

  await targetUser.save();

  return account;
};

/**
 * Deletes a single Shopify account by accountName.
 * Automatically synchronizes user.preferences.activeShopifyAccount if preferred account is deleted.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountName - Shopify store domain identifier
 * @returns {Promise<Object>} Deleted Shopify account object
 */
const deleteShopifyAccount = async (userOrId, accountName) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Delete Shopify account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountName = accountName.trim();
  const index = findShopifyAccountIndex(targetUser.integrations?.shopify || [], cleanAccountName);

  if (index === -1) {
    logger.warn(`Delete Shopify account failed: Account ${cleanAccountName} not found for user ${user._id}`);
    const err = new Error("Shopify account not found");
    err.statusCode = 404;
    throw err;
  }

  const isPreferredAccount = targetUser.preferences?.activeShopifyAccount === cleanAccountName;

  const [deletedAccount] = targetUser.integrations.shopify.splice(index, 1);

  // Delete Synchronization Rule: If preferred account is deleted
  if (isPreferredAccount) {
    if (targetUser.integrations.shopify.length > 0) {
      targetUser.preferences.activeShopifyAccount = targetUser.integrations.shopify[0].accountName;
    } else {
      targetUser.preferences.activeShopifyAccount = null;
    }
  }

  await targetUser.save();

  return deletedAccount;
};

/**
 * Sets preferred active Shopify account for authenticated user.
 *
 * @param {string|Object} userOrId - Authenticated user object or ID
 * @param {string} accountName - Target Shopify accountName to activate
 * @returns {Promise<Object>} Object containing activeShopifyAccount and matched account
 */
const setActiveShopifyAccount = async (userOrId, accountName) => {
  const user = typeof userOrId === "object" ? userOrId : await User.findById(userOrId);
  if (!user) {
    logger.warn(`Set active Shopify account failed: User not found`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const { integrationUser } = await getEffectiveIntegrationContext(user);
  const targetUser = integrationUser || user;

  const cleanAccountName = accountName.trim();
  const account = findShopifyAccount(targetUser.integrations?.shopify || [], cleanAccountName);

  if (!account) {
    logger.warn(`Set active Shopify account failed: Account ${cleanAccountName} not found for user ${user._id}`);
    const err = new Error("Shopify account not found");
    err.statusCode = 404;
    throw err;
  }

  if (targetUser.preferences?.activeShopifyAccount === cleanAccountName) {
    return {
      activeShopifyAccount: cleanAccountName,
      account,
    };
  }

  if (!targetUser.preferences) targetUser.preferences = {};
  targetUser.preferences.activeShopifyAccount = cleanAccountName;
  await targetUser.save();

  return {
    activeShopifyAccount: cleanAccountName,
    account,
  };
};

module.exports = {
  addShopifyAccount,
  getAllShopifyAccounts,
  getShopifyAccountById,
  updateShopifyAccount,
  deleteShopifyAccount,
  setActiveShopifyAccount,
};
