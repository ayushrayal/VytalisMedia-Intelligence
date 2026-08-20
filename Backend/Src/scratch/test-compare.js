const compareCalc = require("../utils/compare-calculator.util");
const assert = require("assert");

console.log("Running Performance Compare Verification Tests...\n");

// Test A: 20-Day MTD Comparison
const daysTestA = compareCalc.validateEqualPeriodLengths("2026-08-01", "2026-08-20", "2026-07-01", "2026-07-20");
assert.strictEqual(daysTestA.daysA, 20);
assert.strictEqual(daysTestA.daysB, 20);
console.log("✓ Test A Passed: 20-Day MTD comparison equal length validated.");

// Test B: Reversed Date Normalization
const normB = compareCalc.normalizeDateOrder("2026-08-20", "2026-08-15");
assert.strictEqual(normB.dateFrom, "2026-08-15");
assert.strictEqual(normB.dateTo, "2026-08-20");
console.log("✓ Test B Passed: Reversed date order normalized automatically.");

// Test C: Unequal Period Length Rejection
try {
  compareCalc.validateEqualPeriodLengths("2026-08-01", "2026-08-20", "2026-07-01", "2026-07-14");
  assert.fail("Should have thrown error for unequal lengths");
} catch (err) {
  assert.strictEqual(err.message, "Comparison periods must contain the same number of days.");
  console.log("✓ Test C Passed: Unequal period lengths correctly rejected.");
}

// Test D: Shopify Cancellation Rate Rate-vs-Raw Logic
const resRate = compareCalc.computeMetricComparison({ metricKey: "cancellation_rate", label: "Cancellation Rate", valueA: 6, valueB: 10 });
assert.strictEqual(resRate.performance, "Improved");
assert.strictEqual(resRate.directionCategory, "LOWER_IS_BETTER");

const resRawCancelled = compareCalc.computeMetricComparison({ metricKey: "cancelled_orders", label: "Cancelled Orders", valueA: 12, valueB: 10 });
assert.strictEqual(resRawCancelled.performance, "Increased");
assert.strictEqual(resRawCancelled.directionCategory, "CONTEXTUAL");
console.log("✓ Test D Passed: Cancellation Rate (LOWER_IS_BETTER) vs Cancelled Orders (CONTEXTUAL) verified.");

// Test E: Zero Period B Handling
const resZeroB = compareCalc.computeMetricComparison({ metricKey: "purchases", label: "Purchases", valueA: 100, valueB: 0 });
assert.strictEqual(resZeroB.performance, "New");
assert.strictEqual(resZeroB.percentageChange, null);
console.log("✓ Test E Passed: Zero Period B handled safely as 'New'.");

// Test F: Zero Period A & B Handling
const resZeroAB = compareCalc.computeMetricComparison({ metricKey: "purchases", label: "Purchases", valueA: 0, valueB: 0 });
assert.strictEqual(resZeroAB.performance, "No Change");
assert.strictEqual(resZeroAB.percentageChange, 0);
console.log("✓ Test F Passed: Zero Period A & B handled as 'No Change'.");

// Test G: Missing/Null Period B Handling
const resNullB = compareCalc.computeMetricComparison({ metricKey: "purchases", label: "Purchases", valueA: 100, valueB: null });
assert.strictEqual(resNullB.performance, "No Previous Data");
assert.strictEqual(resNullB.percentageChange, null);
console.log("✓ Test G Passed: Null Period B handled as 'No Previous Data'.");

// Test H: Spend Increase Visual Classification
const resSpend = compareCalc.computeMetricComparison({ metricKey: "spend", label: "Spend", valueA: 120, valueB: 100 });
assert.strictEqual(resSpend.performance, "Increased");
assert.strictEqual(resSpend.directionCategory, "CONTEXTUAL");
console.log("✓ Test H Passed: Spend increase classified as 'Increased' (CONTEXTUAL).");

// Test I: CPA Decrease Visual Classification
const resCpa = compareCalc.computeMetricComparison({ metricKey: "cost_per_result", label: "CPA", valueA: 80, valueB: 100 });
assert.strictEqual(resCpa.performance, "Improved");
assert.strictEqual(resCpa.directionCategory, "LOWER_IS_BETTER");
console.log("✓ Test I Passed: CPA decrease classified as 'Improved' (LOWER_IS_BETTER).");

// Test J: ROAS Increase Visual Classification
const resRoas = compareCalc.computeMetricComparison({ metricKey: "purchase_roas", label: "ROAS", valueA: 3.5, valueB: 3.0 });
assert.strictEqual(resRoas.performance, "Improved");
assert.strictEqual(resRoas.directionCategory, "HIGHER_IS_BETTER");
console.log("✓ Test J Passed: ROAS increase classified as 'Improved' (HIGHER_IS_BETTER).");

// Test K: Prepaid Orders Category Check
const resPrepaid = compareCalc.computeMetricComparison({ metricKey: "prepaid_orders", label: "Prepaid Orders", valueA: 115, valueB: 100 });
assert.strictEqual(resPrepaid.performance, "Increased");
assert.strictEqual(resPrepaid.directionCategory, "CONTEXTUAL");
console.log("✓ Test K Passed: Prepaid Orders strictly classified as 'CONTEXTUAL'.");

console.log("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
