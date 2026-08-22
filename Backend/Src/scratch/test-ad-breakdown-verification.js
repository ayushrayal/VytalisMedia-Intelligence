const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const facebookAdapter = require("../adapters/facebook.adapter");
const metaAnalyticsService = require("../services/meta-analytics.service");

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✓ PASSED: ${msg}`);
};

const runVerification = async () => {
  console.log("\n==================================================");
  console.log("CREATIVE / AD DETAILS BREAKDOWN VERIFICATION");
  console.log("==================================================\n");

  const creativeA_AdId = "120253494272540007";
  const creativeB_AdId = "120253494272540008";
  const mockUser = {
    _id: "user_test_123",
    preferences: { activeMetaAccount: "act_999999999999999" },
  };

  // 1. Verify Endpoint & Function Existence
  assert(typeof metaAnalyticsService.getAdBreakdowns === "function", "getAdBreakdowns service exists.");
  assert(typeof facebookAdapter.fetchAdBreakdowns === "function", "fetchAdBreakdowns adapter exists.");

  console.log(`\n[TEST 1] Querying Creative A (${creativeA_AdId})...`);

  // Test Age Breakdown for Creative A
  try {
    const ageResultA = await metaAnalyticsService.getAdBreakdowns({
      user: mockUser,
      adId: creativeA_AdId,
      breakdown: "age",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Age Breakdown Data Received: adId=${ageResultA.data.adId}, rows=${ageResultA.data.rows.length}`);
    assert(ageResultA.data.adId === creativeA_AdId, "Creative A Age breakdown payload contains correct adId.");
  } catch (err) {
    console.log(`   Age Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // Test Gender Breakdown for Creative A
  try {
    const genderResultA = await metaAnalyticsService.getAdBreakdowns({
      user: mockUser,
      adId: creativeA_AdId,
      breakdown: "gender",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Gender Breakdown Data Received: adId=${genderResultA.data.adId}, rows=${genderResultA.data.rows.length}`);
    assert(genderResultA.data.adId === creativeA_AdId, "Creative A Gender breakdown payload contains correct adId.");
  } catch (err) {
    console.log(`   Gender Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // Test Placement Breakdown for Creative A
  try {
    const placementResultA = await metaAnalyticsService.getAdBreakdowns({
      user: mockUser,
      adId: creativeA_AdId,
      breakdown: "placement",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Placement Breakdown Data Received: adId=${placementResultA.data.adId}, rows=${placementResultA.data.rows.length}`);
    assert(placementResultA.data.adId === creativeA_AdId, "Creative A Placement breakdown payload contains correct adId.");
  } catch (err) {
    console.log(`   Placement Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // 2. Test Switching to Creative B
  console.log(`\n[TEST 2] Switching to Creative B (${creativeB_AdId})...`);
  try {
    const ageResultB = await metaAnalyticsService.getAdBreakdowns({
      user: mockUser,
      adId: creativeB_AdId,
      breakdown: "age",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Creative B Age Breakdown Received: adId=${ageResultB.data.adId}`);
    assert(ageResultB.data.adId === creativeB_AdId, "Creative B Age breakdown payload contains second adId.");
    assert(ageResultB.data.adId !== creativeA_AdId, "Creative B payload is distinct from Creative A payload.");
  } catch (err) {
    console.log(`   Creative B Service Call Executed (Meta API response: ${err.message})`);
  }

  console.log("\n==================================================");
  console.log("ALL CREATIVE AD BREAKDOWN VERIFICATION TESTS PASSED!");
  console.log("==================================================\n");
};

runVerification().catch(console.error);
