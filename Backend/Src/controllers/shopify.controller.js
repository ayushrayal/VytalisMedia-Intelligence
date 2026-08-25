const shopifyService = require("../services/shopify.service");
const shopifyDataService = require("../services/shopify-data.service");
const { sendSuccess } = require("../utils/api-response.util");

/**
 * Handles request to add a new Shopify account.
 * Endpoint: POST /api/shopify/accounts
 */
const addAccount = async (req, res, next) => {
  try {
    const { shopName, accountName } = req.body;
    const account = await shopifyService.addShopifyAccount(req.user, {
      shopName,
      accountName,
    });

    return sendSuccess(res, 201, "Shopify account added successfully", account);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to retrieve all Shopify accounts and activeShopifyAccount preference.
 * Endpoint: GET /api/shopify/accounts
 */
const getAllAccounts = async (req, res, next) => {
  try {
    const result = await shopifyService.getAllShopifyAccounts(req.user);

    return sendSuccess(res, 200, "Shopify accounts retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to retrieve a single Shopify account by accountName identifier.
 * Endpoint: GET /api/shopify/accounts/:id
 */
const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await shopifyService.getShopifyAccountById(req.user, id);

    return sendSuccess(res, 200, "Shopify account retrieved successfully", account);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to update a Shopify account's shopName and/or accountName.
 * Endpoint: PUT /api/shopify/accounts/:id or PATCH /api/shopify/accounts/:id
 */
const updateAccount = async (req, res, next) => {
  try {
    const { id: targetAccountName } = req.params;
    const { shopName, accountName: newAccountName } = req.body;

    const updatedAccount = await shopifyService.updateShopifyAccount(
      req.user,
      targetAccountName,
      { shopName, accountName: newAccountName }
    );

    return sendSuccess(res, 200, "Shopify account updated successfully", updatedAccount);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to delete a single Shopify account by accountName.
 * Endpoint: DELETE /api/shopify/accounts/:id
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedAccount = await shopifyService.deleteShopifyAccount(
      req.user,
      id
    );

    return sendSuccess(res, 200, "Shopify account deleted successfully", deletedAccount);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request to set preferred active Shopify account for authenticated user.
 * Endpoint: PATCH /api/shopify/accounts/active or PUT /api/shopify/accounts/active
 */
const setActiveAccount = async (req, res, next) => {
  try {
    const { accountName } = req.body;
    const result = await shopifyService.setActiveShopifyAccount(
      req.user,
      accountName
    );

    return sendSuccess(
      res,
      200,
      "Active Shopify account updated successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify overview analytics data.
 * Endpoint: GET /api/shopify/overview
 */
const getOverview = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "overview",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify overview data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify orders analytics data.
 * Endpoint: GET /api/shopify/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "orders",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify orders data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify products analytics data.
 * Endpoint: GET /api/shopify/products
 */
const getProducts = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "products",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify products data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify customers analytics data.
 * Endpoint: GET /api/shopify/customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "customers",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify customers data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify location analytics data.
 * Endpoint: GET /api/shopify/location
 */
const getLocation = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "location",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify location data retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify comparison analytics data comparing Period A and Period B.
 * Endpoint: GET /api/shopify/compare
 */
const getShopifyComparison = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyComparison({
      user: req.user,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify comparison data retrieved successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles request for Shopify inventory analytics data.
 * Endpoint: GET /api/shopify/inventory
 */
const getInventory = async (req, res, next) => {
  try {
    const result = await shopifyDataService.getShopifyData({
      user: req.user,
      endpoint: "inventory",
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Shopify inventory data retrieved successfully.",
      result.data,
      result.meta
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
  setActiveAccount,
  getOverview,
  getOrders,
  getProducts,
  getCustomers,
  getLocation,
  getInventory,
  getShopifyComparison,
};

