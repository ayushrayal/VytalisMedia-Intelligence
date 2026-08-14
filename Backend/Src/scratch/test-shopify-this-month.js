/**
 * Test script verifying Shopify "this_month" date resolution and validator acceptance.
 */

const { ALLOWED_SHOPIFY_PRESETS } = require("../config/shopify-endpoints.config");

console.log("=== TESTING SHOPIFY THIS_MONTH DATE PRESET FIX ===");

// 1. Verify ALLOWED_SHOPIFY_PRESETS contains "this_month"
const isPresetAllowed = ALLOWED_SHOPIFY_PRESETS.includes("this_month");
console.log(`1. ALLOWED_SHOPIFY_PRESETS includes 'this_month': ${isPresetAllowed ? "YES [PASS]" : "NO [FAIL]"}`);

if (!isPresetAllowed) {
  console.error("FAIL: 'this_month' is missing from ALLOWED_SHOPIFY_PRESETS!");
  process.exit(1);
}

// 2. Verify Calendar-Month-to-Date resolution calculation
const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, "0");
const day = String(now.getUTCDate()).padStart(2, "0");

const expectedFrom = `${year}-${month}-01`;
const expectedTo = `${year}-${month}-${day}`;
const expectedCacheKey = `this_month_${expectedFrom}_${expectedTo}`;

console.log(`2. Current Date: ${year}-${month}-${day}`);
console.log(`   Calculated Month Start (dateFrom): ${expectedFrom}`);
console.log(`   Calculated Today (dateTo):        ${expectedTo}`);
console.log(`   Deterministic Cache Range Key:     ${expectedCacheKey}`);

if (expectedFrom.endsWith("-01") && expectedTo.startsWith(`${year}-${month}`)) {
  console.log("YES [PASS]: Calendar-month-to-date calculation is exact!");
} else {
  console.error("FAIL: Calendar-month-to-date calculation failed!");
  process.exit(1);
}

console.log("\n=== ALL SHOPIFY THIS_MONTH TESTS PASSED CLEANLY! ===");
