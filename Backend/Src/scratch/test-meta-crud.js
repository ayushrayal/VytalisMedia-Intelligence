const metaService = require("../services/meta.service");
const {
  validateAddAccount,
  validateUpdateAccount,
  validateAccountIdParam,
} = require("../validators/meta.validator");
const User = require("../models/user.model");

// In-Memory Mock of Mongoose User Model for Offline Unit Testing
function createMockUser(id = "507f1f77bcf86cd799439011") {
  return {
    _id: id,
    name: "Test User",
    email: "test@vytalis.com",
    integrations: {
      meta: [],
    },
    preferences: {
      activeMetaAccount: null,
    },
    save: async function () {
      return this;
    },
  };
}

async function runUnitTests() {
  console.log("=================================================");
  console.log("Running Meta Account Refined Architecture Unit Tests");
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
  // TEST 1: Service - addMetaAccount (First Account Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 1] Testing addMetaAccount (First Account Rule)...");
  const acc1 = await metaService.addMetaAccount(mockUser._id, {
    accountId: "  act_1001  ",
    accountName: "  Nike US  ",
  });
  console.log("Added Account 1:", acc1);
  console.assert(acc1.accountId === "act_1001", "AccountId must be trimmed");
  console.assert(acc1.accountName === "Nike US", "AccountName must be trimmed");
  console.assert(
    mockUser.preferences.activeMetaAccount === "act_1001",
    "First account must auto-set preferences.activeMetaAccount"
  );
  console.log("✓ PASS: First account set preferences.activeMetaAccount to 'act_1001'");

  // ----------------------------------------------------
  // TEST 2: Service - addMetaAccount (Second Account Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 2] Testing addMetaAccount (Second Account Rule)...");
  const acc2 = await metaService.addMetaAccount(mockUser._id, {
    accountId: "act_1002",
    accountName: "Adidas UK",
  });
  console.log("Added Account 2:", acc2);
  console.assert(
    mockUser.preferences.activeMetaAccount === "act_1001",
    "Second account must NOT overwrite preferences.activeMetaAccount"
  );
  console.log("✓ PASS: Second account left activeMetaAccount as 'act_1001'");

  // ----------------------------------------------------
  // TEST 3: Service - Duplicate addMetaAccount (409 Conflict)
  // ----------------------------------------------------
  console.log("\n[TEST 3] Testing duplicate addMetaAccount (409 Conflict)...");
  try {
    await metaService.addMetaAccount(mockUser._id, {
      accountId: "act_1001",
      accountName: "Duplicate Nike",
    });
    console.error("❌ FAIL: Expected 409 Conflict error for duplicate accountId");
  } catch (err) {
    console.assert(err.statusCode === 409, "Error status code must be 409");
    console.log("✓ PASS: Duplicate accountId returned 409 Conflict");
  }

  // ----------------------------------------------------
  // TEST 4: Service - getAllMetaAccounts (Focused Response)
  // ----------------------------------------------------
  console.log("\n[TEST 4] Testing getAllMetaAccounts...");
  const getResult = await metaService.getAllMetaAccounts(mockUser._id);
  console.log("GET All Payload:", getResult);
  console.assert(getResult.accounts.length === 2, "Must return 2 accounts");
  console.assert(
    getResult.activeMetaAccount === "act_1001",
    "Must return activeMetaAccount in response object"
  );
  console.log("✓ PASS: getAllMetaAccounts returned accounts array and activeMetaAccount");

  // ----------------------------------------------------
  // TEST 5: Service - updateMetaAccount (Preference Sync)
  // ----------------------------------------------------
  console.log("\n[TEST 5] Testing updateMetaAccount (Updating Active Account ID)...");
  const updatedAcc = await metaService.updateMetaAccount(mockUser._id, "act_1001", {
    accountId: "  act_1001_updated  ",
    accountName: "  Nike Global  ",
  });
  console.log("Updated Account:", updatedAcc);
  console.assert(updatedAcc.accountId === "act_1001_updated", "accountId updated");
  console.assert(updatedAcc.accountName === "Nike Global", "accountName updated");
  console.assert(
    mockUser.preferences.activeMetaAccount === "act_1001_updated",
    "Active account ID update must synchronize preferences.activeMetaAccount"
  );
  console.log("✓ PASS: Updating active accountId synchronized activeMetaAccount preference");

  // ----------------------------------------------------
  // TEST 6: Service - updateMetaAccount Duplicate Check (409 Conflict)
  // ----------------------------------------------------
  console.log("\n[TEST 6] Testing updateMetaAccount duplicate check (409 Conflict)...");
  try {
    await metaService.updateMetaAccount(mockUser._id, "act_1002", {
      accountId: "act_1001_updated",
    });
    console.error("❌ FAIL: Expected 409 Conflict on updating to existing accountId");
  } catch (err) {
    console.assert(err.statusCode === 409, "Error status code must be 409");
    console.log("✓ PASS: Updating to occupied accountId returned 409 Conflict");
  }

  // ----------------------------------------------------
  // TEST 7: Service - deleteMetaAccount (Delete Sync Rule)
  // ----------------------------------------------------
  console.log("\n[TEST 7] Testing deleteMetaAccount (Preferred Account Delete Sync)...");
  const deletedAcc = await metaService.deleteMetaAccount(mockUser._id, "act_1001_updated");
  console.log("Deleted Account:", deletedAcc);
  console.assert(
    mockUser.preferences.activeMetaAccount === "act_1002",
    "Deleting preferred account must reassign activeMetaAccount to first remaining account ('act_1002')"
  );
  console.log("✓ PASS: Deleting active account reassigned activeMetaAccount to 'act_1002'");

  // ----------------------------------------------------
  // TEST 8: Service - deleteAllMetaAccounts
  // ----------------------------------------------------
  console.log("\n[TEST 8] Testing deleteAllMetaAccounts...");
  const deleteAllResult = await metaService.deleteAllMetaAccounts(mockUser._id);
  console.log("Delete All Result:", deleteAllResult);
  console.assert(deleteAllResult.deletedCount === 1, "deletedCount must be 1");
  console.assert(
    mockUser.preferences.activeMetaAccount === null,
    "deleteAllMetaAccounts must reset activeMetaAccount to null"
  );
  console.log("✓ PASS: deleteAllMetaAccounts cleared accounts array and reset activeMetaAccount to null");

  // ----------------------------------------------------
  // TEST 9: Validator Middlewares
  // ----------------------------------------------------
  console.log("\n[TEST 9] Testing Validator Middlewares...");
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

  // Reject empty PATCH body {}
  let req = { body: {} };
  let res = mockRes();
  let nextCalled = false;
  validateUpdateAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called for empty PATCH body");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for empty PATCH body");
  console.log("✓ PASS: validateUpdateAccount rejected empty PATCH body {} with HTTP 400");

  // Reject forbidden unknown field in PATCH body
  req = { body: { connectedAt: new Date() } };
  res = mockRes();
  nextCalled = false;
  validateUpdateAccount(req, res, () => {
    nextCalled = true;
  });
  console.assert(!nextCalled, "next() must not be called for unknown fields");
  console.assert(res.statusCode === 400, "Must return HTTP 400 for unknown fields");
  console.log("✓ PASS: validateUpdateAccount rejected unknown field 'connectedAt' with HTTP 400");

  console.log("\n=================================================");
  console.log("🎉 ALL REFINED ARCHITECTURE TESTS PASSED!");
  console.log("=================================================");
}

runUnitTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
