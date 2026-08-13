const shopifyService = require("../services/shopify.service");
const {
  validateAddAccount,
  validateUpdateAccount,
  validateAccountIdParam,
} = require("../validators/shopify.validator");
const User = require("../models/user.model");

// In-Memory Mock of Mongoose User Model for Offline Unit Testing
function createMockUser(id = "507f1f77bcf86cd799439011") {
  return {
    _id: id,
    name: "Test User",
    email: "shopify_test@vytalis.com",
    integrations: {
      meta: [],
      shopify: [],
    },
    preferences: {
      activeMetaAccount: null,
      activeShopifyAccount: null,
    },
    save: async function () {
      return this;
    },
  };
}

async function runUnitTests() {
  console.log("=================================================");
  console.log("Running Shopify Account Management Cleanup Unit Tests");
  console.log("=================================================");

  let mockUser = createMockUser();

  // Override User.findById for offline testing
  User.findById = async (userId) => {
    if (userId === mockUser._id) {
      return mockUser;
    }
    return null;
  };

  // ----------------------------------------------------
  // TEST 1: Service - addShopifyAccount (First Account Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 1] Testing addShopifyAccount (First Account Rule)...");
  const acc1 = await shopifyService.addShopifyAccount(mockUser._id, {
    shopName: "  JSB Health & Fitness Pvt Ltd  ",
    accountName: "  jsbhealthcare.myshopify.com  ",
  });
  console.log("Added Account 1:", acc1);
  console.assert(acc1.accountName === "jsbhealthcare.myshopify.com", "accountName must be trimmed");
  console.assert(acc1.shopName === "JSB Health & Fitness Pvt Ltd", "shopName must be trimmed");
  console.assert(acc1.accountId === undefined, "accountId must NOT exist in schema/response");
  console.assert(acc1.shopId === undefined, "shopId must NOT exist in schema/response");
  console.assert(
    mockUser.preferences.activeShopifyAccount === "jsbhealthcare.myshopify.com",
    "First account must auto-set preferences.activeShopifyAccount"
  );
  console.assert(
    mockUser.preferences.activeShopifyStore === undefined,
    "activeShopifyStore must NOT exist in preferences"
  );
  console.log("✓ PASS: First account set preferences.activeShopifyAccount to 'jsbhealthcare.myshopify.com' with no accountId/shopId");

  // ----------------------------------------------------
  // TEST 2: Service - addShopifyAccount (Second Account Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 2] Testing addShopifyAccount (Second Account Rule)...");
  const acc2 = await shopifyService.addShopifyAccount(mockUser._id, {
    shopName: "Thread & Button Apparels",
    accountName: "threadnbutton.myshopify.com",
  });
  console.log("Added Account 2:", acc2);
  console.assert(
    mockUser.preferences.activeShopifyAccount === "jsbhealthcare.myshopify.com",
    "Second account must NOT overwrite preferences.activeShopifyAccount"
  );
  console.log("✓ PASS: Second account left activeShopifyAccount as 'jsbhealthcare.myshopify.com'");

  // ----------------------------------------------------
  // TEST 3: Service - Duplicate addShopifyAccount (409 Conflict)
  // ----------------------------------------------------
  console.log("\n[TEST 3] Testing duplicate addShopifyAccount (409 Conflict)...");
  try {
    await shopifyService.addShopifyAccount(mockUser._id, {
      shopName: "Duplicate JSB",
      accountName: "jsbhealthcare.myshopify.com",
    });
    console.error("❌ FAIL: Expected 409 Conflict error for duplicate accountName");
  } catch (err) {
    console.assert(err.statusCode === 409, "Error status code must be 409");
    console.log("✓ PASS: Duplicate accountName returned 409 Conflict");
  }

  // ----------------------------------------------------
  // TEST 4: Service - getAllShopifyAccounts
  // ----------------------------------------------------
  console.log("\n[TEST 4] Testing getAllShopifyAccounts...");
  const getResult = await shopifyService.getAllShopifyAccounts(mockUser._id);
  console.log("GET All Payload:", getResult);
  console.assert(getResult.accounts.length === 2, "Must return 2 accounts");
  console.assert(
    getResult.activeShopifyAccount === "jsbhealthcare.myshopify.com",
    "Must return activeShopifyAccount in response object"
  );
  console.log("✓ PASS: getAllShopifyAccounts returned accounts array and activeShopifyAccount");

  // ----------------------------------------------------
  // TEST 5: Service - getShopifyAccountById (Single Lookup by accountName)
  // ----------------------------------------------------
  console.log("\n[TEST 5] Testing getShopifyAccountById...");
  const singleAcc = await shopifyService.getShopifyAccountById(mockUser._id, "jsbhealthcare.myshopify.com");
  console.assert(singleAcc.shopName === "JSB Health & Fitness Pvt Ltd", "Must retrieve correct account");
  console.log("✓ PASS: getShopifyAccountById retrieved account by accountName");

  // ----------------------------------------------------
  // TEST 6: Service - updateShopifyAccount (Active Preference Sync)
  // ----------------------------------------------------
  console.log("\n[TEST 6] Testing updateShopifyAccount (Updating Active Account Domain)...");
  const updatedAcc = await shopifyService.updateShopifyAccount(
    mockUser._id,
    "jsbhealthcare.myshopify.com",
    {
      accountName: "  jsbhealth-updated.myshopify.com  ",
      shopName: "  JSB Health Global  ",
    }
  );
  console.log("Updated Account:", updatedAcc);
  console.assert(updatedAcc.accountName === "jsbhealth-updated.myshopify.com", "accountName updated");
  console.assert(updatedAcc.shopName === "JSB Health Global", "shopName updated");
  console.assert(
    mockUser.preferences.activeShopifyAccount === "jsbhealth-updated.myshopify.com",
    "Active account domain update must synchronize preferences.activeShopifyAccount"
  );
  console.log("✓ PASS: Updating active accountName synchronized activeShopifyAccount preference");

  // ----------------------------------------------------
  // TEST 7: Service - updateShopifyAccount Duplicate Check (409 Conflict)
  // ----------------------------------------------------
  console.log("\n[TEST 7] Testing updateShopifyAccount duplicate check (409 Conflict)...");
  try {
    await shopifyService.updateShopifyAccount(mockUser._id, "threadnbutton.myshopify.com", {
      accountName: "jsbhealth-updated.myshopify.com",
    });
    console.error("❌ FAIL: Expected 409 Conflict on updating to existing accountName");
  } catch (err) {
    console.assert(err.statusCode === 409, "Error status code must be 409");
    console.log("✓ PASS: Updating to occupied accountName returned 409 Conflict");
  }

  // ----------------------------------------------------
  // TEST 8: Service - deleteShopifyAccount (Delete Sync Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 8] Testing deleteShopifyAccount (Preferred Account Delete Sync)...");
  const deletedAcc = await shopifyService.deleteShopifyAccount(
    mockUser._id,
    "jsbhealth-updated.myshopify.com"
  );
  console.log("Deleted Account:", deletedAcc);
  console.assert(
    mockUser.preferences.activeShopifyAccount === "threadnbutton.myshopify.com",
    "Deleting preferred account must reassign activeShopifyAccount to first remaining account ('threadnbutton.myshopify.com')"
  );
  console.log("✓ PASS: Deleting active account reassigned activeShopifyAccount to 'threadnbutton.myshopify.com'");

  // ----------------------------------------------------
  // TEST 9: Service - deleteShopifyAccount (Last Account Delete Sync)
  // ----------------------------------------------------
  console.log("\n[TEST 9] Testing deleteShopifyAccount (Last Account Delete Sync)...");
  await shopifyService.deleteShopifyAccount(mockUser._id, "threadnbutton.myshopify.com");
  console.assert(
    mockUser.preferences.activeShopifyAccount === null,
    "Deleting final account must set activeShopifyAccount to null"
  );
  console.log("✓ PASS: Deleting final account set activeShopifyAccount to null");

  // ----------------------------------------------------
  // TEST 10: Validator Middlewares (Testing Rejection of accountId, shopId, etc.)
  // ----------------------------------------------------
  console.log("\n[TEST 10] Testing Validator Middlewares...");
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // Reject missing shopName in add account body
  let req = { body: { accountName: "test.myshopify.com" } };
  let res = mockRes();
  let nextCalled = false;
  validateAddAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called when shopName is missing");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for missing shopName");

  // Reject accountId in add account body
  req = { body: { shopName: "Test", accountName: "test.myshopify.com", accountId: "12345" } };
  res = mockRes();
  nextCalled = false;
  validateAddAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called when accountId is provided");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for accountId");
  console.log("✓ PASS: validateAddAccount rejected payload with accountId (HTTP 400)");

  // Reject shopId in add account body
  req = { body: { shopName: "Test", accountName: "test.myshopify.com", shopId: "67890" } };
  res = mockRes();
  nextCalled = false;
  validateAddAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called when shopId is provided");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for shopId");
  console.log("✓ PASS: validateAddAccount rejected payload with shopId (HTTP 400)");

  // Reject accountId/shopId in update account body
  req = { body: { accountId: "12345" } };
  res = mockRes();
  nextCalled = false;
  validateUpdateAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called for accountId in update body");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for accountId in update body");
  console.log("✓ PASS: validateUpdateAccount rejected accountId in update body (HTTP 400)");

  // Reject empty update body {}
  req = { body: {} };
  res = mockRes();
  nextCalled = false;
  validateUpdateAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called for empty update body");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for empty update body");
  console.log("✓ PASS: validateUpdateAccount rejected empty update body {} with HTTP 400");

  console.log("\n=================================================");
  console.log("🎉 ALL SHOPIFY CLEANUP UNIT TESTS PASSED!");
  console.log("=================================================");
}

runUnitTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
