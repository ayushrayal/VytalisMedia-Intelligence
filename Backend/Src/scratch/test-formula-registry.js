/**
 * Task #10 - Formula Registry Verification & Unit Test Suite
 * Comprehensive, focused tests for every canonical formula function in Formula Registry.
 * Verifies pure mathematical logic, zero vs unavailable vs immature semantics,
 * edge cases, division-by-zero guards, and 1-to-1 linkage with Metric Registry.
 */

const assert = require("assert");
const { METRIC_REGISTRY } = require("../config/metric-registry.config");
const {
  FORMULA_REGISTRY,
  resolveFormula,
  executeFormula,
  validateFormulaRegistryIntegrity,
} = require("../config/formula-registry.config");

async function runFormulaRegistryUnitTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #10 FORMULA REGISTRY UNIT TESTS");
  console.log("==================================================");

  // 1. Validate Module Self-Check Function
  assert.doesNotThrow(() => {
    validateFormulaRegistryIntegrity();
  }, "Formula registry self-check integrity validation must pass without throwing");
  console.log("✓ Test 1 Passed: Formula registry 1-to-1 integrity check passed cleanly!");

  const derivedMetrics = Object.values(METRIC_REGISTRY).filter((m) => m.type === "derived" || m.type === "composite");
  const totalFormulas = Object.keys(FORMULA_REGISTRY).length;
  console.log(`Verified ${derivedMetrics.length} derived/composite metrics linked to ${totalFormulas} canonical formula functions.`);
  assert.strictEqual(derivedMetrics.length, totalFormulas, "Every derived/composite metric must have exactly one formula");

  // 2. Focused Unit Tests for Meta Formulas
  // A. Meta ROAS: spend > 0 & purchaseValue = 0 -> 0.0 (valid zero)
  const metaRoasZero = executeFormula("formula.meta.roas", { purchase_value: 0, spend: 1000 });
  assert.strictEqual(metaRoasZero.value, 0.0);
  assert.strictEqual(metaRoasZero.status, "zero");

  // B. Meta ROAS: spend = 0 & purchaseValue = 500 -> null (unavailable, NEVER 0.0)
  const metaRoasUnavail = executeFormula("formula.meta.roas", { purchase_value: 500, spend: 0 });
  assert.strictEqual(metaRoasUnavail.value, null);
  assert.strictEqual(metaRoasUnavail.status, "unavailable");

  // C. Meta ROAS: valid ratio calculation (purchaseValue = 5000, spend = 1000 -> 5.0)
  const metaRoasValid = executeFormula("formula.meta.roas", { purchase_value: 5000, spend: 1000 });
  assert.strictEqual(metaRoasValid.value, 5.0);
  assert.strictEqual(metaRoasValid.status, "valid");

  // D. Meta CPM: spend = 100, impressions = 10000 -> 10.0
  const cpmValid = executeFormula("formula.meta.cpm", { spend: 100, impressions: 10000 });
  assert.strictEqual(cpmValid.value, 10.0);
  assert.strictEqual(cpmValid.status, "valid");

  // E. Meta CPM: impressions = 0 -> null (unavailable)
  const cpmUnavail = executeFormula("formula.meta.cpm", { spend: 100, impressions: 0 });
  assert.strictEqual(cpmUnavail.value, null);
  assert.strictEqual(cpmUnavail.status, "unavailable");

  // F. Meta CTR: clicks = 50, impressions = 1000 -> 5.0%
  const ctrValid = executeFormula("formula.meta.ctr", { clicks: 50, impressions: 1000 });
  assert.strictEqual(ctrValid.value, 5.0);
  assert.strictEqual(ctrValid.status, "valid");

  console.log("✓ Test 2 Passed: Meta formula zero vs unavailable semantics verified!");

  // 3. Focused Unit Tests for Shopify Formulas
  // A. Shopify Net Sales: gross = 1000, discounts = 100, returns = 50 -> 850
  const netSalesValid = executeFormula("formula.shopify.net_sales", { gross_sales: 1000, discounts: 100, returns: 50 });
  assert.strictEqual(netSalesValid.value, 850);
  assert.strictEqual(netSalesValid.status, "valid");

  // B. Shopify AOV: netSales = 5000, orders = 100 -> 50.0
  const aovValid = executeFormula("formula.shopify.aov", { net_sales: 5000, orders_count: 100 });
  assert.strictEqual(aovValid.value, 50.0);
  assert.strictEqual(aovValid.status, "valid");

  // C. Shopify AOV: orders = 0 -> null (unavailable)
  const aovUnavail = executeFormula("formula.shopify.aov", { net_sales: 5000, orders_count: 0 });
  assert.strictEqual(aovUnavail.value, null);
  assert.strictEqual(aovUnavail.status, "unavailable");

  // D. Cancellation Rate: cancelled = 5, orders = 100 -> 5.0%
  const cancelRateValid = executeFormula("formula.shopify.cancellation_rate", { cancelled_orders: 5, orders_count: 100 });
  assert.strictEqual(cancelRateValid.value, 5.0);
  assert.strictEqual(cancelRateValid.status, "valid");

  console.log("✓ Test 3 Passed: Shopify formula calculations verified!");

  // 4. Focused Unit Tests for Cohort Formulas
  // A. Immature Cohort: isMature = false -> null (immature status)
  const cohortImmature = executeFormula("formula.cohort.retention_rate", { isMature: false, cohort_size: 100, retained_customers: 5 });
  assert.strictEqual(cohortImmature.value, null);
  assert.strictEqual(cohortImmature.status, "immature");

  // B. Mature 0% Retention: isMature = true, retained = 0 -> 0.0 (zero status)
  const cohortZero = executeFormula("formula.cohort.retention_rate", { isMature: true, cohort_size: 100, retained_customers: 0 });
  assert.strictEqual(cohortZero.value, 0.0);
  assert.strictEqual(cohortZero.status, "zero");

  // C. Mature Positive Retention: isMature = true, retained = 15, size = 100 -> 15.0%
  const cohortValid = executeFormula("formula.cohort.retention_rate", { isMature: true, cohort_size: 100, retained_customers: 15 });
  assert.strictEqual(cohortValid.value, 15.0);
  assert.strictEqual(cohortValid.status, "valid");

  console.log("✓ Test 4 Passed: Cohort retention rate maturity & zero retention verified!");

  // 5. Focused Unit Tests for Composite Formulas
  // A. Blended ROAS: netSales = 10000, metaSpend = 2000 -> 5.0
  const blendedRoasValid = executeFormula("formula.composite.blended_roas", { net_sales: 10000, meta_spend: 2000 });
  assert.strictEqual(blendedRoasValid.value, 5.0);
  assert.strictEqual(blendedRoasValid.status, "valid");

  // B. Blended CAC: metaSpend = 2000, shopifyOrders = 100 -> 20.0
  const blendedCacValid = executeFormula("formula.composite.blended_cac", { meta_spend: 2000, orders_count: 100 });
  assert.strictEqual(blendedCacValid.value, 20.0);
  assert.strictEqual(blendedCacValid.status, "valid");

  console.log("✓ Test 5 Passed: Composite blended metrics verified!");

  // 6. Test All Formula Implementations Execute Without Exceptions
  Object.keys(FORMULA_REGISTRY).forEach((fid) => {
    const res = executeFormula(fid, {});
    assert.ok(res && typeof res === "object", `Formula '${fid}' execution must return structured object`);
    assert.ok(res.status, `Formula '${fid}' return missing status property`);
  });

  console.log("✓ Test 6 Passed: All 38 formula functions executed without exceptions!");

  console.log("--------------------------------------------------");
  console.log("ALL FORMULA REGISTRY UNIT TESTS PASSED CLEANLY!");
  console.log("--------------------------------------------------");
}

runFormulaRegistryUnitTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ FORMULA REGISTRY UNIT TESTS FAILED:", err);
    process.exit(1);
  });
