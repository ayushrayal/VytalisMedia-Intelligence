/**
 * Task #9 - Metric Registry Verification & Validation Suite
 * Verifies backend Metric Registry structure, uniqueness, inputs reference validity,
 * and semantic constraints without modifying business logic or querying external providers.
 */

const assert = require("assert");
const {
  METRIC_REGISTRY,
  ALLOWED_PLATFORMS,
  ALLOWED_UNITS,
  ALLOWED_TYPES,
  validateMetricRegistryIntegrity,
} = require("../config/metric-registry.config");

async function runMetricRegistryValidationTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #9 METRIC REGISTRY VALIDATION TESTS");
  console.log("==================================================");

  // 1. Validate Module Self-Check Function
  assert.doesNotThrow(() => {
    validateMetricRegistryIntegrity();
  }, "Registry self-check validation must pass without throwing");
  console.log("✓ Test 1 Passed: Module integrity check passed cleanly!");

  const entries = Object.entries(METRIC_REGISTRY);
  const totalEntries = entries.length;
  console.log(`Verified ${totalEntries} distinct metric entries in backend registry.`);
  assert.ok(totalEntries >= 50, "Expected at least 50 comprehensive metric entries");

  // 2. Uniqueness & Required Properties Check
  const idSet = new Set();
  const canonicalNameSet = new Set();

  entries.forEach(([key, entry]) => {
    // Uniqueness
    assert.strictEqual(key, entry.id, `Key '${key}' must equal entry.id '${entry.id}'`);
    assert.ok(!idSet.has(entry.id), `Duplicate metric ID found: '${entry.id}'`);
    idSet.add(entry.id);

    // Required Metadata Fields
    assert.ok(entry.canonicalName && typeof entry.canonicalName === "string", `Metric '${key}' missing canonicalName`);
    assert.ok(entry.displayName && typeof entry.displayName === "string", `Metric '${key}' missing displayName`);
    assert.ok(entry.description && typeof entry.description === "string", `Metric '${key}' missing description`);
    assert.ok(ALLOWED_PLATFORMS.includes(entry.platform), `Metric '${key}' has invalid platform '${entry.platform}'`);
    assert.ok(ALLOWED_TYPES.includes(entry.type), `Metric '${key}' has invalid type '${entry.type}'`);
    assert.ok(ALLOWED_UNITS.includes(entry.unit), `Metric '${key}' has invalid unit '${entry.unit}'`);
    assert.ok(entry.zeroSemantics && typeof entry.zeroSemantics.isValidZero === "boolean", `Metric '${key}' missing zeroSemantics.isValidZero`);
    assert.ok(entry.dateDependency && typeof entry.dateDependency.isDateDependent === "boolean", `Metric '${key}' missing dateDependency.isDateDependent`);

    // Derived / Composite Formula ID Rule
    if (entry.type === "raw") {
      assert.strictEqual(entry.formulaId, null, `Raw metric '${key}' should have formulaId: null`);
    } else {
      assert.ok(entry.formulaId && typeof entry.formulaId === "string", `Derived/composite metric '${key}' must have non-empty formulaId string`);
    }

    // Input References Rule
    if (Array.isArray(entry.requiredInputs)) {
      entry.requiredInputs.forEach((inputId) => {
        assert.ok(METRIC_REGISTRY[inputId], `Metric '${key}' references non-existent input '${inputId}'`);
      });
    }
  });

  console.log("✓ Test 2 Passed: Uniqueness and required metadata properties verified!");

  // 3. Specific Metric Distinction Tests
  // A. ROAS distinction
  const metaRoas = METRIC_REGISTRY["meta.roas"];
  const blendedRoas = METRIC_REGISTRY["composite.blended_roas"];
  assert.notStrictEqual(metaRoas.id, blendedRoas.id);
  assert.strictEqual(metaRoas.platform, "meta");
  assert.strictEqual(blendedRoas.platform, "composite");
  assert.deepStrictEqual(metaRoas.requiredInputs, ["meta.purchase_value", "meta.spend"]);
  assert.deepStrictEqual(blendedRoas.requiredInputs, ["shopify.net_sales", "meta.spend"]);
  console.log("✓ Test 3 Passed: meta.roas and composite.blended_roas are explicitly distinct!");

  // B. AOV distinction
  const shopifyAov = METRIC_REGISTRY["shopify.aov"];
  const customerAov = METRIC_REGISTRY["shopify.customer_lifetime_aov"];
  assert.notStrictEqual(shopifyAov.id, customerAov.id);
  assert.strictEqual(shopifyAov.dateDependency.isDateDependent, true);
  assert.strictEqual(customerAov.dateDependency.isDateDependent, false);
  console.log("✓ Test 4 Passed: shopify.aov and shopify.customer_lifetime_aov are explicitly distinct!");

  // C. CTR distinction
  const metaCtr = METRIC_REGISTRY["meta.ctr"];
  const uniqueCtr = METRIC_REGISTRY["meta.unique_outbound_ctr"];
  assert.notStrictEqual(metaCtr.id, uniqueCtr.id);
  assert.strictEqual(metaCtr.type, "derived");
  assert.strictEqual(uniqueCtr.type, "raw");
  console.log("✓ Test 5 Passed: meta.ctr and meta.unique_outbound_ctr are explicitly distinct!");

  // D. Cohort 4-State Zero Semantics
  const cohortRetention = METRIC_REGISTRY["cohort.retention_rate"];
  assert.strictEqual(cohortRetention.zeroSemantics.isValidZero, true);
  assert.ok(cohortRetention.zeroSemantics.nullMeaning.includes("Not Mature"));
  console.log("✓ Test 6 Passed: Cohort 4-state zero vs immature semantics verified!");

  console.log("--------------------------------------------------");
  console.log("ALL METRIC REGISTRY VALIDATION TESTS PASSED CLEANLY!");
  console.log("--------------------------------------------------");
}

runMetricRegistryValidationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ METRIC REGISTRY VALIDATION FAILED:", err);
    process.exit(1);
  });
