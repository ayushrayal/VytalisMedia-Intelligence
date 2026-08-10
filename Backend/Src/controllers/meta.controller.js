const metaService = require("../services/meta.service");
const metaAnalyticsService = require("../services/meta-analytics.service");
const { sendSuccess } = require("../utils/api-response.util");

/**
 * Handles request to add a new Meta account.
 * Endpoint: POST /api/meta/accounts
 */
const addAccount = async (req, res, next) => {
  try {
    const { accountId, accountName } = req.body;
    const account = await metaService.addMetaAccount(req.user._id, {
      accountId,
      accountName,
    });

    return sendSuccess(res, 201, "Meta account added successfully", account);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to retrieve all Meta accounts and activeMetaAccount preference.
 * Endpoint: GET /api/meta/accounts
 */
const getAllAccounts = async (req, res, next) => {
  try {
    const result = await metaService.getAllMetaAccounts(req.user._id);

    return sendSuccess(res, 200, "Meta accounts retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to retrieve a single Meta account by accountId.
 * Endpoint: GET /api/meta/accounts/:accountId
 */
const getAccountById = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const account = await metaService.getMetaAccountById(req.user._id, accountId);

    return sendSuccess(res, 200, "Meta account retrieved successfully", account);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to update a Meta account's display name and/or accountId.
 * Endpoint: PATCH /api/meta/accounts/:accountId
 */
const updateAccount = async (req, res, next) => {
  try {
    const { accountId: targetAccountId } = req.params;
    const { accountId: newAccountId, accountName } = req.body;

    const updatedAccount = await metaService.updateMetaAccount(
      req.user._id,
      targetAccountId,
      { accountId: newAccountId, accountName }
    );

    return sendSuccess(res, 200, "Meta account updated successfully", updatedAccount);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to delete a single Meta account by accountId.
 * Endpoint: DELETE /api/meta/accounts/:accountId
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const deletedAccount = await metaService.deleteMetaAccount(
      req.user._id,
      accountId
    );

    return sendSuccess(res, 200, "Meta account deleted successfully", deletedAccount);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to delete all Meta accounts for authenticated user.
 * Endpoint: DELETE /api/meta/accounts
 */
const deleteAllAccounts = async (req, res, next) => {
  try {
    const result = await metaService.deleteAllMetaAccounts(req.user._id);

    return sendSuccess(
      res,
      200,
      "All Meta accounts deleted successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Meta analytics data (overview, campaigns, adsets, creatives, audience, places).
 * Endpoint: GET /api/meta/analytics/:endpoint
 */
const getAnalyticsData = async (req, res, next) => {
  try {
    const { endpoint } = req.params;
    const result = await metaAnalyticsService.getAnalyticsData({
      user: req.user,
      endpoint,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Analytics data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to set preferred active Meta account for authenticated user.
 * Endpoint: PATCH /api/meta/accounts/active
 */
const setActiveAccount = async (req, res, next) => {
  try {
    const { accountId } = req.body;
    const result = await metaService.setActiveMetaAccount(
      req.user._id,
      accountId
    );

    return sendSuccess(
      res,
      200,
      "Active Meta account updated successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  deleteAllAccounts,
  getAnalyticsData,
  setActiveAccount,
};
