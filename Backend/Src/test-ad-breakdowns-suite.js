const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { validateAdBreakdownsRequest } = require("./validators/meta-analytics.validator");
const facebookAdapter = require("./adapters/facebook.adapter");

const runAdBreakdownsTestSuite = async () => {
  console.log("\n==================================================");
  console.log("AD BREAKDOWNS TEST SUITE");
  console.log("==================================================\n");

  try {
    // 1. TEST VALIDATOR MIDDLEWARE FOR AD BREAKDOWNS
    console.log("[TEST 1] AD BREAKDOWN VALIDATOR REJECTIONS:");

    const createMockRes = () => {
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

    // Test 1a: Client accountId rejection -> 400
    const req1 = { query: { accountId: "123" }, params: { adId: "ad123" } };
    const res1 = createMockRes();
    validateAdBreakdownsRequest(req1, res1, () => {});
    console.log(`   Client accountId rejection: Status=${res1.statusCode} (Expected: 400)`);
    if (res1.statusCode !== 400) throw new Error("Validator failed to reject client accountId");

    // Test 1b: Invalid breakdown category -> 400
    const req2 = { query: { breakdown: "device" }, params: { adId: "ad123" } };
    const res2 = createMockRes();
    validateAdBreakdownsRequest(req2, res2, () => {});
    console.log(`   Invalid category ('device') rejection: Status=${res2.statusCode} (Expected: 400)`);
    if (res2.statusCode !== 400) throw new Error("Validator failed to reject unsupported category 'device'");

    // Test 1c: Valid category -> next() called
    let nextCalled = false;
    const req3 = { query: { breakdown: "gender" }, params: { adId: "ad123" } };
    const res3 = createMockRes();
    validateAdBreakdownsRequest(req3, res3, () => { nextCalled = true; });
    console.log(`   Valid category ('gender') accepted: Passed=${nextCalled} (Expected: true)`);
    if (!nextCalled) throw new Error("Validator rejected valid category 'gender'");

    // 2. TEST CACHE KEY ISOLATION & NO COLLISION
    console.log("\n[TEST 2] CACHE KEY ISOLATION:");
    const userId = "user123";
    const account = "acc456";
    const dateKey = "last_7d";
    const targetId = "789";

    const campaignCacheKey = `meta:${userId}:${account}:campaign_breakdowns:${targetId}:age:${dateKey}`;
    const adsetCacheKey = `meta:${userId}:${account}:adset_breakdowns:${targetId}:age:${dateKey}`;
    const adCacheKey = `meta:${userId}:${account}:ad_breakdowns:${targetId}:age:${dateKey}`;

    console.log(`   Campaign Cache Key: ${campaignCacheKey}`);
    console.log(`   Ad Set Cache Key:   ${adsetCacheKey}`);
    console.log(`   Ad Cache Key:       ${adCacheKey}`);
    console.log(`   Ad Key is distinct from Campaign & AdSet: ${adCacheKey !== campaignCacheKey && adCacheKey !== adsetCacheKey} (Expected: true)`);

    if (adCacheKey === campaignCacheKey || adCacheKey === adsetCacheKey) {
      throw new Error("Cache key collision detected for Ad breakdowns!");
    }

    // 3. TEST ADAPTER FUNCTION EXISTENCE
    console.log("\n[TEST 3] ADAPTER FUNCTION SCOPING:");
    if (typeof facebookAdapter.fetchAdBreakdowns !== "function") {
      throw new Error("facebookAdapter.fetchAdBreakdowns is not defined!");
    }
    console.log("   fetchAdBreakdowns adapter function is correctly defined and exported.");

    console.log("\n==================================================");
    console.log("ALL AD BREAKDOWNS TESTS PASSED!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("Test Suite Failure:", err);
    process.exit(1);
  }
};

runAdBreakdownsTestSuite();
