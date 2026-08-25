const assert = require("assert");
const { calculateShopifyCohorts } = require("../utils/shopify-cohort-calculator.util");

function runP1GCohortTestSuite() {
  console.log("=== RUNNING P1G COHORT ANALYSIS TEST SUITE ===");

  // Test 1: Single order customer
  const mockSingleOrder = [
    { order_id: "O1", order_customer_id: "C1", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 100 },
  ];
  const res1 = calculateShopifyCohorts({ ordersData: mockSingleOrder, periodType: "monthly" });
  assert.strictEqual(res1.cohorts.length, 1, "Should form 1 cohort (2026-05)");
  assert.strictEqual(res1.cohorts[0].cohortSize, 1, "Cohort size should be 1");
  assert.strictEqual(res1.cohorts[0].periods[0].retentionRate, 100.0, "M0 retention rate should be 100%");
  console.log("✓ Test 1 passed: Single order customer cohort created with M0 = 100%.");

  // Test 2: Customer with 2 orders across 2 months
  const mockTwoOrders = [
    { order_id: "O1", order_customer_id: "C1", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 100 },
    { order_id: "O2", order_customer_id: "C1", order_created_at: "2026-06-15T10:00:00Z", order_net_sales: 150 },
  ];
  const res2 = calculateShopifyCohorts({ ordersData: mockTwoOrders, periodType: "monthly" });
  assert.strictEqual(res2.cohorts[0].periods[0].retainedCustomers, 1, "M0 retained count = 1");
  assert.strictEqual(res2.cohorts[0].periods[1].retainedCustomers, 1, "M1 retained count = 1");
  assert.strictEqual(res2.cohorts[0].periods[1].retentionRate, 100.0, "M1 retention rate = 100%");
  assert.strictEqual(res2.cohorts[0].periods[1].revenue, 150, "M1 revenue = 150");
  console.log("✓ Test 2 passed: Repeat customer across months correctly tracked in M0 and M1.");

  // Test 3: Customer with 5 orders in 1 month -> counts as ONE retained customer
  const mockMultiOrders1Month = [
    { order_id: "O1", order_customer_id: "C1", order_created_at: "2026-05-01T10:00:00Z", order_net_sales: 10 },
    { order_id: "O2", order_customer_id: "C1", order_created_at: "2026-05-05T10:00:00Z", order_net_sales: 20 },
    { order_id: "O3", order_customer_id: "C1", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 30 },
    { order_id: "O4", order_customer_id: "C1", order_created_at: "2026-05-15T10:00:00Z", order_net_sales: 40 },
    { order_id: "O5", order_customer_id: "C1", order_created_at: "2026-05-20T10:00:00Z", order_net_sales: 50 },
  ];
  const res3 = calculateShopifyCohorts({ ordersData: mockMultiOrders1Month, periodType: "monthly" });
  assert.strictEqual(res3.cohorts[0].cohortSize, 1, "Customer counted ONCE in cohort size");
  assert.strictEqual(res3.cohorts[0].periods[0].retainedCustomers, 1, "Customer counted ONCE in M0 retained customers");
  assert.strictEqual(res3.cohorts[0].periods[0].revenue, 150, "M0 revenue sums all net sales (150)");
  console.log("✓ Test 3 passed: 5 orders in 1 month counts as 1 retained customer.");

  // Test 4: Line item duplication (same order_id in multiple rows)
  const mockDuplicatedOrder = [
    { order_id: "O10", order_customer_id: "C2", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 50, line_item: "Item A" },
    { order_id: "O10", order_customer_id: "C2", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 50, line_item: "Item B" },
  ];
  const res4 = calculateShopifyCohorts({ ordersData: mockDuplicatedOrder, periodType: "monthly" });
  assert.strictEqual(res4.cohorts[0].cohortSize, 1, "Order deduplication prevents double counting size");
  assert.strictEqual(res4.cohorts[0].periods[0].revenue, 50, "Order deduplication prevents double counting revenue");
  console.log("✓ Test 4 passed: Line item order_id duplication deduplicated correctly.");

  // Test 5: Customer identity resolution (order_customer_id priority, email fallback)
  const mockEmailFallback = [
    { order_id: "O20", order_customer_id: null, order_email: " Test@Example.com ", order_created_at: "2026-05-10T10:00:00Z", order_net_sales: 80 },
    { order_id: "O21", order_customer_id: null, order_email: "test@example.com", order_created_at: "2026-06-10T10:00:00Z", order_net_sales: 90 },
  ];
  const res5 = calculateShopifyCohorts({ ordersData: mockEmailFallback, periodType: "monthly" });
  assert.strictEqual(res5.cohorts[0].cohortSize, 1, "Fallback email trimmed & lowercased resolves to same customer");
  assert.strictEqual(res5.cohorts[0].periods[1].retainedCustomers, 1, "Customer recognized in M1 via normalized email fallback");
  console.log("✓ Test 5 passed: Email fallback normalized and resolved correctly.");

  // Test 6: Cohort Maturity Test (Immature periods return null / isMature: false)
  const mockImmatureCohort = [
    { order_id: "O30", order_customer_id: "C30", order_created_at: "2026-08-22T10:00:00Z", order_net_sales: 200 },
  ];
  const res6 = calculateShopifyCohorts({ ordersData: mockImmatureCohort, periodType: "monthly" });
  const m1Period = res6.cohorts[0].periods.find(p => p.periodIndex === 1);
  assert.strictEqual(m1Period.isMature, false, "M1 should be marked immature since observation end is 2026-08-22");
  assert.strictEqual(m1Period.retentionRate, null, "Immature M1 retention rate must be null (Insufficient Historical Data)");
  console.log("✓ Test 6 passed: Immature cohort period returns isMature: false and null rate.");

  // Test 7: Empty dataset test (Zero division check)
  const res7 = calculateShopifyCohorts({ ordersData: [], periodType: "monthly" });
  assert.strictEqual(res7.summary.totalCohorts, 0, "0 cohorts for empty dataset");
  assert.strictEqual(res7.summary.avgM1Retention, null, "avgM1Retention null for empty dataset");
  console.log("✓ Test 7 passed: Empty dataset handled cleanly without NaN/Infinity.");

  console.log("\nALL P1G COHORT TEST SUITE CASES PASSED SUCCESSFULLY!");
}

runP1GCohortTestSuite();
