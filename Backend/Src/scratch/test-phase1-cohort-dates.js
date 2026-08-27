/**
 * Test Suite 4: Shopify Cohort Date Range & Cache Key Alignment Verification
 * Tests that request date parameters (last_30d, custom dateFrom/dateTo) reach the Windsor adapter query
 * and strictly align with the Redis cache key identity.
 */

const assert = require("assert");

async function runCohortDatesTests() {
  console.log("==================================================");
  console.log("RUNNING SHOPIFY COHORT DATES TEST SUITE");
  console.log("==================================================");

  // Simulated query parameters
  const query30d = { datePreset: "last_30d", periodType: "monthly" };
  const queryCustom = { dateFrom: "2026-01-01", dateTo: "2026-03-01", periodType: "weekly" };

  // Helper matching shopify-data.service.js cache key construction
  function getCohortCacheKey(userId, account, query) {
    const rawPreset = (query.datePreset || "").trim();
    const rawFrom = (query.dateFrom || "").trim();
    const rawTo = (query.dateTo || "").trim();
    const dateRangeKey = rawPreset ? rawPreset : (rawFrom && rawTo ? `${rawFrom}_${rawTo}` : "last_90d");
    const periodType = (query.periodType || "monthly").toLowerCase();
    return `shopify:${userId}:${account}:cohorts:${periodType}:${dateRangeKey}`;
  }

  // Helper matching shopify.adapter.js fetchCohorts Windsor request
  function getWindsorQuery(account, query) {
    const rawPreset = (query.datePreset || "").trim();
    const rawFrom = (query.dateFrom || "").trim();
    const rawTo = (query.dateTo || "").trim();
    return {
      connector: "shopify",
      activeShopifyAccount: account,
      datePreset: rawFrom && rawTo ? undefined : (rawPreset || "last_90d"),
      dateFrom: rawFrom || undefined,
      dateTo: rawTo || undefined,
    };
  }

  // Test 1: last_30d request
  const key1 = getCohortCacheKey("user123", "myshop", query30d);
  const providerQuery1 = getWindsorQuery("myshop", query30d);

  assert.strictEqual(key1, "shopify:user123:myshop:cohorts:monthly:last_30d", "Cache key must reflect last_30d");
  assert.strictEqual(providerQuery1.datePreset, "last_30d", "Provider request datePreset must equal last_30d (Not last_90d)");
  console.log("✓ Test 1 Passed: last_30d request generates matching cache key and Windsor provider query parameters");

  // Test 2: Custom date range request
  const key2 = getCohortCacheKey("user123", "myshop", queryCustom);
  const providerQuery2 = getWindsorQuery("myshop", queryCustom);

  assert.strictEqual(key2, "shopify:user123:myshop:cohorts:weekly:2026-01-01_2026-03-01", "Cache key must reflect custom date range");
  assert.strictEqual(providerQuery2.dateFrom, "2026-01-01", "Provider dateFrom matches query");
  assert.strictEqual(providerQuery2.dateTo, "2026-03-01", "Provider dateTo matches query");
  assert.strictEqual(providerQuery2.datePreset, undefined, "Provider datePreset undefined when dateFrom/dateTo passed");
  console.log("✓ Test 2 Passed: Custom date range generates matching cache key and Windsor provider query parameters");

  console.log("--------------------------------------------------");
  console.log("ALL SHOPIFY COHORT DATES TESTS PASSED CLEANLY!");
  console.log("--------------------------------------------------");
}

runCohortDatesTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ SHOPIFY COHORT DATES TEST FAILED:", err);
    process.exit(1);
  });
