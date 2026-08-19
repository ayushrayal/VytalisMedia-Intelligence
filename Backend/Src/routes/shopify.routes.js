const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const {
  validateAddAccount,
  validateSetActiveShopifyAccount,
  validateUpdateAccount,
  validateAccountIdParam,
} = require("../validators/shopify.validator");
const { validateShopifyDataRequest } = require("../validators/shopify-data.validator");
const { protect, requireShopifyAccess } = require("../middleware/auth.middleware");

// Protect all Shopify account and data routes with JWT authentication & Shopify feature access
router.use(protect);
router.use(requireShopifyAccess);

/**
 * @route   GET /api/shopify/overview
 * @desc    Fetch Shopify overview analytics data
 * @access  Private
 */
router.get("/overview", validateShopifyDataRequest, shopifyController.getOverview);

/**
 * @route   GET /api/shopify/orders
 * @desc    Fetch Shopify orders analytics data
 * @access  Private
 */
router.get("/orders", validateShopifyDataRequest, shopifyController.getOrders);

/**
 * @route   GET /api/shopify/products
 * @desc    Fetch Shopify products analytics data
 * @access  Private
 */
router.get("/products", validateShopifyDataRequest, shopifyController.getProducts);

/**
 * @route   GET /api/shopify/customers
 * @desc    Fetch Shopify customers analytics data
 * @access  Private
 */
router.get("/customers", validateShopifyDataRequest, shopifyController.getCustomers);

/**
 * @route   GET /api/shopify/location
 * @desc    Fetch Shopify location analytics data
 * @access  Private
 */
router.get("/location", validateShopifyDataRequest, shopifyController.getLocation);

/**
 * @route   POST /api/shopify/accounts
 * @desc    Add a new Shopify account (requires shopName and accountName)
 * @access  Private
 */
router.post("/accounts", validateAddAccount, shopifyController.addAccount);

/**
 * @route   GET /api/shopify/accounts
 * @desc    Retrieve all Shopify accounts and activeShopifyAccount preference for authenticated user
 * @access  Private
 */
router.get("/accounts", shopifyController.getAllAccounts);

/**
 * @route   PATCH /api/shopify/accounts/active
 * @route   PUT /api/shopify/accounts/active
 * @desc    Set current preferred active Shopify account
 * @access  Private
 */
router.patch(
  "/accounts/active",
  validateSetActiveShopifyAccount,
  shopifyController.setActiveAccount
);
router.put(
  "/accounts/active",
  validateSetActiveShopifyAccount,
  shopifyController.setActiveAccount
);

/**
 * @route   GET /api/shopify/accounts/:id
 * @desc    Retrieve a single Shopify account by accountName identifier
 * @access  Private
 */
router.get("/accounts/:id", validateAccountIdParam, shopifyController.getAccountById);

/**
 * @route   PUT /api/shopify/accounts/:id
 * @route   PATCH /api/shopify/accounts/:id
 * @desc    Update Shopify account display name (shopName) and/or domain identifier (accountName)
 * @access  Private
 */
router.put(
  "/accounts/:id",
  validateAccountIdParam,
  validateUpdateAccount,
  shopifyController.updateAccount
);
router.patch(
  "/accounts/:id",
  validateAccountIdParam,
  validateUpdateAccount,
  shopifyController.updateAccount
);

/**
 * @route   DELETE /api/shopify/accounts/:id
 * @desc    Delete a single Shopify account by accountName identifier
 * @access  Private
 */
router.delete(
  "/accounts/:id",
  validateAccountIdParam,
  shopifyController.deleteAccount
);

module.exports = router;
