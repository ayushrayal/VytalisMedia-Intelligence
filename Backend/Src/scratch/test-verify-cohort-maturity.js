const assert = require("assert");
const { calculateShopifyCohorts, isMonthlyPeriodMature } = require("../utils/shopify-cohort-calculator.util");

function runCohortMaturityTestSuite() {
  console.log("=== RUNNING P1G COHORT MATURITY & INTEGRITY TEST SUITE ===");

  const obsDate = new Date("2026-08-25T15:00:00Z");

  // Test 1: Direct Unit Test on isMonthlyPeriodMature for observation end date 2026-08-25
  console.log("\n[Test 1] Testing isMonthlyPeriodMature for observation end date 2026-08-25...");

  // May 2026 Cohort (startYear: 2026, startMonth: 4)
  assert.strictEqual(isMonthlyPeriodMature(2026, 4, 0, obsDate), true, "May 2026 M0 must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 4, 1, obsDate), true, "May 2026 M1 (June) must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 4, 2, obsDate), true, "May 2026 M2 (July) must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 4, 3, obsDate), false, "May 2026 M3 (August) must be IMMATURE on Aug 25!");

  // June 2026 Cohort (startYear: 2026, startMonth: 5)
  assert.strictEqual(isMonthlyPeriodMature(2026, 5, 0, obsDate), true, "June 2026 M0 must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 5, 1, obsDate), true, "June 2026 M1 (July) must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 5, 2, obsDate), false, "June 2026 M2 (August) must be IMMATURE on Aug 25!");

  // July 2026 Cohort (startYear: 2026, startMonth: 6)
  assert.strictEqual(isMonthlyPeriodMature(2026, 6, 0, obsDate), true, "July 2026 M0 must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 6, 1, obsDate), false, "July 2026 M1 (August) must be IMMATURE on Aug 25!");

  // August 2026 Cohort (startYear: 2026, startMonth: 7)
  assert.strictEqual(isMonthlyPeriodMature(2026, 7, 0, obsDate), true, "August 2026 M0 must be mature");
  assert.strictEqual(isMonthlyPeriodMature(2026, 7, 1, obsDate), false, "August 2026 M1 (September) must be IMMATURE on Aug 25!");

  console.log("✓ Test 1 passed: Monthly maturity calculations match user specifications exactly.");

  // Test 2: Full Cohort Aggregation Test with Mock Orders ending 2026-08-25
  console.log("\n[Test 2] Testing full cohort calculation for dataset ending 2026-08-25...");
  const mockOrders = [
    // May cohort
    { order_id: "O1", order_customer_id: "C1", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 1000 },
    { order_id: "O2", order_customer_id: "C1", order_created_at: "2026-06-15T10:00:00Z", order_net_sales: 500 }, // M1 mature
    { order_id: "O3", order_customer_id: "C1", order_created_at: "2026-07-20T10:00:00Z", order_net_sales: 300 }, // M2 mature
    { order_id: "O4", order_customer_id: "C1", order_created_at: "2026-08-10T10:00:00Z", order_net_sales: 200 }, // M3 immature!

    // June cohort
    { order_id: "O5", order_customer_id: "C2", order_created_at: "2026-06-10T10:00:00Z", order_net_sales: 800 },
    { order_id: "O6", order_customer_id: "C2", order_created_at: "2026-07-15T10:00:00Z", order_net_sales: 400 }, // M1 mature

    // July cohort
    { order_id: "O7", order_customer_id: "C3", order_created_at: "2026-07-05T10:00:00Z", order_net_sales: 600 },

    // August cohort (observation end date = 2026-08-25)
    { order_id: "O8", order_customer_id: "C4", order_created_at: "2026-08-25T15:00:00Z", order_net_sales: 400 },
  ];

  const res = calculateShopifyCohorts({ ordersData: mockOrders, periodType: "monthly" });

  const mayCohort = res.cohorts.find(c => c.cohortKey === "2026-05");
  const juneCohort = res.cohorts.find(c => c.cohortKey === "2026-06");
  const julyCohort = res.cohorts.find(c => c.cohortKey === "2026-07");
  const augustCohort = res.cohorts.find(c => c.cohortKey === "2026-08");

  // Verify May Cohort
  assert.strictEqual(mayCohort.periods[0].isMature, true, "May M0 mature");
  assert.strictEqual(mayCohort.periods[1].isMature, true, "May M1 mature");
  assert.strictEqual(mayCohort.periods[1].retentionRate, 100.0, "May M1 100% retention");
  assert.strictEqual(mayCohort.periods[2].isMature, true, "May M2 mature");
  assert.strictEqual(mayCohort.periods[3].isMature, false, "May M3 IMMATURE");
  assert.strictEqual(mayCohort.periods[3].retentionRate, null, "May M3 retention rate null");

  // Verify June Cohort
  assert.strictEqual(juneCohort.periods[1].isMature, true, "June M1 mature");
  assert.strictEqual(juneCohort.periods[2].isMature, false, "June M2 IMMATURE");

  // Verify July Cohort
  assert.strictEqual(julyCohort.periods[1].isMature, false, "July M1 IMMATURE");

  // Verify August Cohort
  assert.strictEqual(augustCohort.periods[1].isMature, false, "August M1 IMMATURE");

  // Verify Summary KPIs
  console.log("  Summary KPI results:", res.summary);
  assert.strictEqual(res.summary.avgM1Retention, 100.0, "Avg M1 calculated only across mature May and June M1 cohorts");
  assert.strictEqual(res.summary.avgM3Retention, null, "Avg M3 must be null (Insufficient Historical Data) since May M3 is immature");

  console.log("✓ Test 2 passed: Cohort matrix, periods, and summary KPIs strictly exclude immature cohorts.");

  console.log("\nALL P1G COHORT MATURITY TESTS PASSED PERFECTLY!");
}

runCohortMaturityTestSuite();
