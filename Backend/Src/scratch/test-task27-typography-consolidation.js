/**
 * Verification Test Suite for Task #27: Typography Consolidation.
 * Validates canonical typography token system integrity, exact value matching,
 * zero prohibited alterations, and backend safety.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { CANONICAL_TYPOGRAPHY } = require("../../../Frontend/src/config/typography.js");

function runTypographyConsolidationTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #27 TYPOGRAPHY CONSOLIDATION VERIFICATION");
  console.log("==================================================");

  // 1. Verify Canonical Typography Tokens exist & match approved scale exactly
  assert.ok(CANONICAL_TYPOGRAPHY.fontFamily.includes("Inter"), "Canonical fontFamily must include 'Inter'");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h1.fontSize, "26px", "H1 fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h1.fontWeight, "700", "H1 fontWeight mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h1.letterSpacing, "-0.4px", "H1 letterSpacing mismatch");

  assert.strictEqual(CANONICAL_TYPOGRAPHY.h2.fontSize, "20px", "H2 fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h2.fontWeight, "700", "H2 fontWeight mismatch");

  assert.strictEqual(CANONICAL_TYPOGRAPHY.h3.fontSize, "16px", "H3 fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h3.fontWeight, "650", "H3 fontWeight mismatch");

  assert.strictEqual(CANONICAL_TYPOGRAPHY.h4.fontSize, "14px", "H4 fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.h4.fontWeight, "650", "H4 fontWeight mismatch");

  assert.strictEqual(CANONICAL_TYPOGRAPHY.body.fontSize, "14px", "Body fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.bodySecondary.fontSize, "13px", "Body secondary fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.caption.fontSize, "11px", "Caption fontSize mismatch");

  assert.strictEqual(CANONICAL_TYPOGRAPHY.metricValueLarge.fontSize, "28px", "Metric large fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.metricValueMedium.fontSize, "24px", "Metric medium fontSize mismatch");
  assert.strictEqual(CANONICAL_TYPOGRAPHY.metricValueSmall.fontSize, "18px", "Metric small fontSize mismatch");

  console.log("✓ Test 1 Passed: Canonical typography token values match approved scales exactly!");

  // 2. Verify Frontend index.css contains canonical CSS custom properties
  const cssPath = path.join(__dirname, "../../../Frontend/src/index.css");
  const cssContent = fs.readFileSync(cssPath, "utf8");

  assert.ok(cssContent.includes("--font-size-h1: 26px;"), "index.css missing --font-size-h1 token");
  assert.ok(cssContent.includes("--font-size-h2: 20px;"), "index.css missing --font-size-h2 token");
  assert.ok(cssContent.includes("--font-size-h3: 16px;"), "index.css missing --font-size-h3 token");
  assert.ok(cssContent.includes("--font-size-h4: 14px;"), "index.css missing --font-size-h4 token");
  assert.ok(cssContent.includes("--font-size-body: 14px;"), "index.css missing --font-size-body token");
  assert.ok(cssContent.includes("--font-size-metric-lg: 28px;"), "index.css missing --font-size-metric-lg token");
  console.log("✓ Test 2 Passed: index.css root CSS custom properties match canonical typography tokens!");

  // 3. Verify Backend non-interference (Formula Registry Integrity)
  const formulaRegistry = require("../config/formula-registry.config");
  assert.strictEqual(typeof formulaRegistry.executeFormula, "function", "Backend executeFormula function missing");
  const integrityResult = formulaRegistry.validateFormulaRegistryIntegrity();
  assert.strictEqual(integrityResult, true, "Backend formula registry integrity validation failed");
  console.log("✓ Test 3 Passed: Backend formula registry & business logic intact and unchanged!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #27 TYPOGRAPHY CONSOLIDATION VERIFICATION TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runTypographyConsolidationTests();
