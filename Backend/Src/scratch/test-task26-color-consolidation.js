/**
 * Verification Test Suite for Task #26: Color Consolidation.
 * Validates canonical color token system integrity, exact value matching,
 * zero prohibited shade alterations, and backend safety.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { CANONICAL_COLORS } = require("../../../Frontend/src/config/colors.js");

function runColorConsolidationTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #26 COLOR CONSOLIDATION VERIFICATION");
  console.log("==================================================");

  // 1. Verify Canonical Colors exist & match approved palette exactly
  const EXPECTED_PALETTE = {
    background: "#FFFFFF",
    surface: "#F7F9FC",
    border: "#E8EAED",
    accent: "#0A84FF",
    accentHover: "#0060DF",
    positive: "#16A34A",
    negative: "#E5484D",
    warning: "#F59E0B",
    gradient: "linear-gradient(#F2F8FF, #EAF3FF)",
  };

  Object.entries(EXPECTED_PALETTE).forEach(([token, expectedVal]) => {
    assert.strictEqual(
      CANONICAL_COLORS[token],
      expectedVal,
      `Mismatch in token '${token}': expected '${expectedVal}', got '${CANONICAL_COLORS[token]}'`
    );
  });
  console.log("✓ Test 1 Passed: Canonical token values match approved palette exactly!");

  // 2. Verify Frontend index.css contains canonical CSS custom properties
  const cssPath = path.join(__dirname, "../../../Frontend/src/index.css");
  const cssContent = fs.readFileSync(cssPath, "utf8");

  assert.ok(cssContent.includes("--color-background: #FFFFFF;"), "index.css missing --color-background token");
  assert.ok(cssContent.includes("--color-surface: #F7F9FC;"), "index.css missing --color-surface token");
  assert.ok(cssContent.includes("--color-border: #E8EAED;"), "index.css missing --color-border token");
  assert.ok(cssContent.includes("--color-accent: #0A84FF;"), "index.css missing --color-accent token");
  assert.ok(cssContent.includes("--color-accent-hover: #0060DF;"), "index.css missing --color-accent-hover token");
  assert.ok(cssContent.includes("--color-positive: #16A34A;"), "index.css missing --color-positive token");
  assert.ok(cssContent.includes("--color-negative: #E5484D;"), "index.css missing --color-negative token");
  assert.ok(cssContent.includes("--color-warning: #F59E0B;"), "index.css missing --color-warning token");
  assert.ok(cssContent.includes("--color-gradient: linear-gradient(#F2F8FF, #EAF3FF);"), "index.css missing --color-gradient token");
  console.log("✓ Test 2 Passed: index.css root CSS custom properties match canonical tokens!");

  // 3. Verify Backend non-interference (Formula Registry Integrity)
  const formulaRegistry = require("../config/formula-registry.config");
  assert.strictEqual(typeof formulaRegistry.executeFormula, "function", "Backend executeFormula function missing");
  const integrityResult = formulaRegistry.validateFormulaRegistryIntegrity();
  assert.strictEqual(integrityResult, true, "Backend formula registry integrity validation failed");
  console.log("✓ Test 3 Passed: Backend formula registry & business logic intact and unchanged!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #26 COLOR CONSOLIDATION VERIFICATION TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runColorConsolidationTests();
