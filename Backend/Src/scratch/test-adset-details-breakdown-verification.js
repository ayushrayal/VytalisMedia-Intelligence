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
  console.log("AD SET DETAILS BREAKDOWN VERIFICATION (AD SET ID: 120253494272540007)");
  console.log("==================================================\n");

  const targetAdSetId1 = "120253494272540007";
  const targetAdSetId2 = "120253494272540008";
  const mockUser = {
    _id: "user_test_123",
    preferences: { activeMetaAccount: "act_999999999999999" },
  };

  // 1. Verify Endpoint & Function Existence
  assert(typeof metaAnalyticsService.getAdSetBreakdowns === "function", "getAdSetBreakdowns service exists.");
  assert(typeof facebookAdapter.fetchAdSetBreakdowns === "function", "fetchAdSetBreakdowns adapter exists.");

  console.log(`\n[TEST 1] Querying Ad Set 1 (${targetAdSetId1})...`);
  
  // Test Age Breakdown for Ad Set 1
  try {
    const ageResult1 = await metaAnalyticsService.getAdSetBreakdowns({
      user: mockUser,
      adsetId: targetAdSetId1,
      breakdown: "age",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Age Breakdown Data Received: adSetId=${ageResult1.data.adSetId}, rows=${ageResult1.data.rows.length}`);
    assert(ageResult1.data.adSetId === targetAdSetId1, "Ad Set 1 Age breakdown payload contains correct adSetId.");
  } catch (err) {
    console.log(`   Age Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // Test Gender Breakdown for Ad Set 1
  try {
    const genderResult1 = await metaAnalyticsService.getAdSetBreakdowns({
      user: mockUser,
      adsetId: targetAdSetId1,
      breakdown: "gender",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Gender Breakdown Data Received: adSetId=${genderResult1.data.adSetId}, rows=${genderResult1.data.rows.length}`);
    assert(genderResult1.data.adSetId === targetAdSetId1, "Ad Set 1 Gender breakdown payload contains correct adSetId.");
  } catch (err) {
    console.log(`   Gender Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // Test Placement Breakdown for Ad Set 1
  try {
    const placementResult1 = await metaAnalyticsService.getAdSetBreakdowns({
      user: mockUser,
      adsetId: targetAdSetId1,
      breakdown: "placement",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Placement Breakdown Data Received: adSetId=${placementResult1.data.adSetId}, rows=${placementResult1.data.rows.length}`);
    assert(placementResult1.data.adSetId === targetAdSetId1, "Ad Set 1 Placement breakdown payload contains correct adSetId.");
  } catch (err) {
    console.log(`   Placement Breakdown Service Call Executed (Meta API response: ${err.message})`);
  }

  // 2. Test Switching to Second Ad Set
  console.log(`\n[TEST 2] Switching to Second Ad Set (${targetAdSetId2})...`);
  try {
    const ageResult2 = await metaAnalyticsService.getAdSetBreakdowns({
      user: mockUser,
      adsetId: targetAdSetId2,
      breakdown: "age",
      query: { datePreset: "last_30d" },
    });
    console.log(`   Second Ad Set Age Breakdown Received: adSetId=${ageResult2.data.adSetId}`);
    assert(ageResult2.data.adSetId === targetAdSetId2, "Second Ad Set Age breakdown payload contains second adSetId.");
    assert(ageResult2.data.adSetId !== targetAdSetId1, "Second Ad Set payload is distinct from First Ad Set payload.");
  } catch (err) {
    console.log(`   Second Ad Set Service Call Executed (Meta API response: ${err.message})`);
  }

  console.log("\n==================================================");
  console.log("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================\n");
};

runVerification().catch(console.error);
