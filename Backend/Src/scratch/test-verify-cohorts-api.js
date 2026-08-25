const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyDataService = require("../services/shopify-data.service");

async function testCohortsEndpoint() {
  const dummyUser = {
    _id: "test-user-cohorts-123",
    preferences: {
      activeShopifyAccount: "jsbhealthcare.myshopify.com",
    },
  };

  console.log("=== TESTING SHOPIFY COHORTS API ENDPOINT & REDIS CACHING ===");

  // Test 1: Monthly Cohorts
  try {
    console.log("\n[Test 1] Fetching Monthly Cohorts...");
    const resMonthly = await shopifyDataService.getShopifyCohorts({
      user: dummyUser,
      query: { periodType: "monthly" },
    });
    console.log(`  Source: ${resMonthly.meta.source} | CachedAt: ${resMonthly.meta.cachedAt}`);
    console.log(`  Total Cohorts Formed: ${resMonthly.data.summary.totalCohorts}`);
    console.log(`  Summary:`, resMonthly.data.summary);
    if (resMonthly.data.cohorts.length > 0) {
      console.log("  Sample Cohort Row:", resMonthly.data.cohorts[0]);
    }
  } catch (err) {
    console.error("  [Test 1 Failed]:", err.message);
  }

  // Test 2: Weekly Cohorts
  try {
    console.log("\n[Test 2] Fetching Weekly Cohorts...");
    const resWeekly = await shopifyDataService.getShopifyCohorts({
      user: dummyUser,
      query: { periodType: "weekly" },
    });
    console.log(`  Source: ${resWeekly.meta.source} | CachedAt: ${resWeekly.meta.cachedAt}`);
    console.log(`  Total Weekly Cohorts Formed: ${resWeekly.data.summary.totalCohorts}`);
    if (resWeekly.data.cohorts.length > 0) {
      console.log("  Sample Weekly Cohort Row:", resWeekly.data.cohorts[0]);
    }
  } catch (err) {
    console.error("  [Test 2 Failed]:", err.message);
  }

  console.log("\n=== COHORTS API TEST COMPLETED ===");
}

testCohortsEndpoint();
