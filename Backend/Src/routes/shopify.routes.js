const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopify.controller");
const {
  validateAddAccount,
  validateSetActiveShopifyAccount,
  validateUpdateAccount,
  validateAccountIdParam,
} = require("../validators/shopify.validator");
const { validateShopifyDataRequest, validateShopifyInventoryRequest } = require("../validators/shopify-data.validator");
const { protect, requireEffectivePermission } = require("../middleware/auth.middleware");
const { requireOrganizationAccess } = require("../middleware/organization-auth.middleware");

// Protect all Shopify account and data routes with JWT authentication & multi-tenant organization isolation
router.use(protect);
router.use(requireOrganizationAccess);
router.use(requireEffectivePermission("shopify.view"));

/**
 * @route   GET /api/shopify/compare
 * @desc    Fetch Shopify comparison analytics data comparing Period A and Period B
 * @access  Private
 */
router.get(
  "/compare",
  requireEffectivePermission("shopify.compare"),
  shopifyController.getShopifyComparison
);

/**
 * @route   GET /api/shopify/overview
 * @desc    Fetch Shopify overview analytics data
 * @access  Private
 */
router.get(
  "/overview",
  requireEffectivePermission("shopify.overview"),
  validateShopifyDataRequest,
  shopifyController.getOverview
);

/**
 * @route   GET /api/shopify/orders
 * @desc    Fetch Shopify orders analytics data
 * @access  Private
 */
router.get(
  "/orders",
  requireEffectivePermission("shopify.orders"),
  validateShopifyDataRequest,
  shopifyController.getOrders
);

/**
 * @route   GET /api/shopify/products
 * @desc    Fetch Shopify products analytics data
 * @access  Private
 */
router.get(
  "/products",
  requireEffectivePermission("shopify.products"),
  validateShopifyDataRequest,
  shopifyController.getProducts
);

/**
 * @route   GET /api/shopify/customers
 * @desc    Fetch Shopify customers analytics data
 * @access  Private
 */
router.get(
  "/customers",
  requireEffectivePermission("shopify.customers"),
  validateShopifyDataRequest,
  shopifyController.getCustomers
);

/**
 * @route   GET /api/shopify/location
 * @desc    Fetch Shopify location analytics data
 * @access  Private
 */
router.get(
  "/location",
  requireEffectivePermission("shopify.location"),
  validateShopifyDataRequest,
  shopifyController.getLocation
);

/**
 * @route   GET /api/shopify/inventory
 * @desc    Fetch Shopify inventory analytics data
 * @access  Private
 */
router.get(
  "/inventory",
  requireEffectivePermission("shopify.products"),
  validateShopifyInventoryRequest,
  shopifyController.getInventory
);

/**
 * Shopify Integration Account Routes
 */
router.post("/accounts", validateAddAccount, shopifyController.addAccount);
router.get("/accounts", shopifyController.getAllAccounts);
router.patch("/accounts/active", validateSetActiveShopifyAccount, shopifyController.setActiveAccount);
router.put("/accounts/active", validateSetActiveShopifyAccount, shopifyController.setActiveAccount);
router.get("/accounts/:id", validateAccountIdParam, shopifyController.getAccountById);
router.put("/accounts/:id", validateAccountIdParam, validateUpdateAccount, shopifyController.updateAccount);
router.patch("/accounts/:id", validateAccountIdParam, validateUpdateAccount, shopifyController.updateAccount);
router.delete("/accounts/:id", validateAccountIdParam, shopifyController.deleteAccount);

module.exports = router;
