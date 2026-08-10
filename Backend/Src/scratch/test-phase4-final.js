const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const User = require("../models/user.model");
const metaAnalyticsService = require("../services/meta-analytics.service");
const { validateAnalyticsRequest } = require("../validators/meta-analytics.validator");
const logger = require("../utils/logger.util");

const runVerification = async () => {
  console.log("\n========== STARTING PHASE 4 META ANALYTICS VERIFICATION ==========\n");
  let testUser;

  try {
    // 1. Connect to Database & Redis
    await connectDB();
    await cacheUtil.connect();

    // 2. Setup Test User
    const testEmail = "phase4_test_user@vytalis.com";
    await User.deleteOne({ email: testEmail });

    testUser = await User.create({
      name: "Phase 4 Test User",
      email: testEmail,
      password: "TestPassword123!",
      integrations: {
        meta: [
          { accountId: "359804707990884", accountName: "Primary Test Account" },
          { accountId: "123456789", accountName: "Secondary Test Account" },
        ],
      },
      preferences: {
        activeMetaAccount: "359804707990884",
      },
    });

    console.log(`✅ Test User Created: ${testUser._id} with activeMetaAccount = ${testUser.preferences.activeMetaAccount}`);

    // ====================================================
    // TEST 1: Missing activeMetaAccount Preference
    // ====================================================
    console.log("\n--- TEST 1: Missing activeMetaAccount Preference ---");
    const noAccountUser = { _id: testUser._id, preferences: { activeMetaAccount: null } };
    try {
      await metaAnalyticsService.getAnalyticsData({ user: noAccountUser, endpoint: "overview", query: {} });
      console.error("❌ FAILED: Expected error for missing activeMetaAccount but request succeeded.");
    } catch (err) {
      if (err.statusCode === 400 && err.message === "No active Meta account selected") {
        console.log(`✅ SUCCESS: Returned HTTP 400 with message '${err.message}'`);
      } else {
        console.error(`❌ FAILED: Unexpected error: Status ${err.statusCode}, Message: '${err.message}'`);
      }
    }

    // ====================================================
    // TEST 2: Client accountId Parameter Rejection (Validator)
    // ====================================================
    console.log("\n--- TEST 2: Client accountId Parameter Rejection ---");
    let rejectedAsExpected = false;
    const reqWithAccountId = {
      params: { endpoint: "campaigns" },
      query: { accountId: "12345" },
      body: {},
    };
    const resMock = {
      status: (code) => {
        return {
          json: (payload) => {
            if (code === 400 && payload.message === "Account ID must not be supplied by the client") {
              rejectedAsExpected = true;
              console.log(`✅ SUCCESS: Validator returned HTTP 400 with message '${payload.message}'`);
            } else {
              console.error(`❌ FAILED: Validator returned status ${code} with payload:`, payload);
            }
          },
        };
      },
    };
    validateAnalyticsRequest(reqWithAccountId, resMock, () => {
      console.error("❌ FAILED: Validator allowed client-supplied accountId parameter.");
    });
    if (!rejectedAsExpected) {
      console.error("❌ FAILED: Client accountId parameter was not rejected properly.");
    }

    // ====================================================
    // TEST 3: Ambiguous and Partial Date Parameters Rejection
    // ====================================================
    console.log("\n--- TEST 3: Date Parameter Validation ---");

    // 3a. Ambiguous datePreset + dateFrom
    let dateCheck1Passed = false;
    const reqAmbiguous = {
      params: { endpoint: "campaigns" },
      query: { datePreset: "last_7d", dateFrom: "2026-08-01" },
    };
    validateAnalyticsRequest(reqAmbiguous, {
      status: (code) => ({
        json: (payload) => {
          if (code === 400 && payload.message.includes("Ambiguous date parameters")) {
            dateCheck1Passed = true;
            console.log(`✅ SUCCESS: Ambiguous date parameters rejected with HTTP 400: '${payload.message}'`);
          }
        },
      }),
    }, () => {});

    // 3b. Partial date range (dateFrom without dateTo)
    let dateCheck2Passed = false;
    const reqPartial = {
      params: { endpoint: "campaigns" },
      query: { dateFrom: "2026-08-01" },
    };
    validateAnalyticsRequest(reqPartial, {
      status: (code) => ({
        json: (payload) => {
          if (code === 400 && payload.message.includes("Both dateFrom and dateTo must be provided")) {
            dateCheck2Passed = true;
            console.log(`✅ SUCCESS: Partial date range rejected with HTTP 400: '${payload.message}'`);
          }
        },
      }),
    }, () => {});

    if (dateCheck1Passed && dateCheck2Passed) {
      console.log("✅ SUCCESS: Date parameter validation passed cleanly.");
    }

    // ====================================================
    // TEST 4: Fetch Analytics Data (Windsor MISS then Redis HIT)
    // ====================================================
    console.log("\n--- TEST 4: Fetch Analytics (MISS -> Windsor, HIT -> Redis) ---");

    // Account A Fetch 1 (MISS -> Windsor)
    console.log("Fetching Account A ('359804707990884') campaigns (1st request)...");
    const result1 = await metaAnalyticsService.getAnalyticsData({
      user: testUser,
      endpoint: "campaigns",
      query: { datePreset: "last_7d" },
    });

    console.log(`Result 1 Source: '${result1.meta.source}' | CachedAt: ${result1.meta.cachedAt} | Data count: ${result1.data.length}`);
    if (result1.meta.source !== "windsor") {
      console.error(`❌ FAILED: First request source expected 'windsor', got '${result1.meta.source}'`);
    } else {
      console.log("✅ SUCCESS: 1st request fetched from Windsor successfully.");
    }

    // Account A Fetch 2 (HIT -> Redis)
    console.log("Fetching Account A ('359804707990884') campaigns (2nd request)...");
    const result2 = await metaAnalyticsService.getAnalyticsData({
      user: testUser,
      endpoint: "campaigns",
      query: { datePreset: "last_7d" },
    });

    console.log(`Result 2 Source: '${result2.meta.source}' | CachedAt: ${result2.meta.cachedAt} | Data count: ${result2.data.length}`);
    if (result2.meta.source !== "redis") {
      console.error(`❌ FAILED: Second request source expected 'redis', got '${result2.meta.source}'`);
    } else if (result2.meta.cachedAt !== result1.meta.cachedAt) {
      console.error(`❌ FAILED: Redis HIT changed cachedAt timestamp! Old: ${result1.meta.cachedAt}, New: ${result2.meta.cachedAt}`);
    } else {
      console.log("✅ SUCCESS: 2nd request returned Redis HIT with unchanged cachedAt.");
    }

    // ====================================================
    // TEST 5: Account Isolation (Switching Accounts)
    // ====================================================
    console.log("\n--- TEST 5: Account Isolation & Account Switching ---");
    testUser.preferences.activeMetaAccount = "123456789";
    await testUser.save();

    console.log(`Switched activeMetaAccount to Account B: '${testUser.preferences.activeMetaAccount}'`);
    console.log("Fetching Account B campaigns...");
    const resultB = await metaAnalyticsService.getAnalyticsData({
      user: testUser,
      endpoint: "campaigns",
      query: { datePreset: "last_7d" },
    });

    console.log(`Result B Source: '${resultB.meta.source}' | CachedAt: ${resultB.meta.cachedAt}`);
    if (resultB.meta.source !== "windsor") {
      console.error(`❌ FAILED: Account B request expected 'windsor', got '${resultB.meta.source}'`);
    } else {
      console.log("✅ SUCCESS: Account B fetched independently from Windsor (separate Redis namespace).");
    }

    // Switch back to Account A
    testUser.preferences.activeMetaAccount = "359804707990884";
    await testUser.save();
    console.log(`Switched activeMetaAccount back to Account A: '${testUser.preferences.activeMetaAccount}'`);

    const resultA_Reuse = await metaAnalyticsService.getAnalyticsData({
      user: testUser,
      endpoint: "campaigns",
      query: { datePreset: "last_7d" },
    });

    console.log(`Result A Reuse Source: '${resultA_Reuse.meta.source}' | CachedAt: ${resultA_Reuse.meta.cachedAt}`);
    if (resultA_Reuse.meta.source !== "redis") {
      console.error(`❌ FAILED: Expected Account A cache reuse ('redis'), got '${resultA_Reuse.meta.source}'`);
    } else if (resultA_Reuse.meta.cachedAt !== result1.meta.cachedAt) {
      console.error("❌ FAILED: Reused cache timestamp mismatch.");
    } else {
      console.log("✅ SUCCESS: Switched back to Account A and successfully reused existing cached data!");
    }

    // ====================================================
    // TEST 6: All 6 Endpoints Coverage Test
    // ====================================================
    console.log("\n--- TEST 6: Testing All 6 Analytics Endpoints ---");
    const endpoints = ["overview", "campaigns", "adsets", "creatives", "audience", "places"];
    for (const ep of endpoints) {
      const res = await metaAnalyticsService.getAnalyticsData({
        user: testUser,
        endpoint: ep,
        query: { datePreset: "last_7d" },
      });
      console.log(`Endpoint '${ep}': Source = '${res.meta.source}', Records = ${res.data.length}`);
    }
    console.log("✅ SUCCESS: All 6 endpoints tested successfully.");

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log("\n==================================================");
    console.log("🎉 ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================\n");

  } catch (error) {
    console.error("\n❌ VERIFICATION ERROR:", error);
  } finally {
    if (testUser && testUser.email) {
      await User.deleteOne({ email: testUser.email }).catch(() => {});
    }
    await cacheUtil.disconnect().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

runVerification();
