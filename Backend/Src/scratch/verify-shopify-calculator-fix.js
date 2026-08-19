// Verification script for Shopify Calculator Cancelled Orders fix

const mockCancelledOrders = [
  { order_name: "#17581", order_cancelled_at: "2026-08-01T10:00:00Z", order_total_price: "3213.39" },
  { order_name: "#17590", order_cancelled_at: "2026-08-02T10:00:00Z", order_total_price: "3927.68" },
  { order_name: "#17590", order_cancelled_at: "2026-08-02T10:00:00Z", order_total_price: "-4499.00" },
  { order_name: "#17581", order_cancelled_at: "2026-08-01T10:00:00Z", order_total_price: "-3699.00" },
  { order_name: "#17586", order_cancelled_at: "2026-08-03T10:00:00Z", order_total_price: "-3699.00" },
];

function calculateShopifyOrderBreakdown(ordersData = [], totalOrdersCount = 0) {
  let prepaidCount = 0;
  let prepaidValue = 0;
  let codCount = 0;
  let codValue = 0;
  let cancelledCount = 0;
  let cancelledValue = 0;

  const countDenominator = totalOrdersCount || ordersData.length || 1;

  (ordersData || []).forEach((order) => {
    const finStatus = (order.order_financial_status || "").toUpperCase();
    const orderPrice = Number(order.order_total_price || order.order_net_sales || 0);

    if (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") {
      cancelledCount += 1;
      cancelledValue += Math.abs(orderPrice);
    }

    if (finStatus === "PAID" || order.order_fully_paid === true) {
      prepaidCount += 1;
      prepaidValue += orderPrice;
    } else if (finStatus === "PENDING" || order.order_unpaid === true) {
      codCount += 1;
      codValue += orderPrice;
    }
  });

  return {
    prepaidCount,
    prepaidValue,
    prepaidPct: ((prepaidCount / countDenominator) * 100).toFixed(1),
    codCount,
    codValue,
    codPct: ((codCount / countDenominator) * 100).toFixed(1),
    cancelledCount,
    cancelledValue,
    cancelledPct: ((cancelledCount / countDenominator) * 100).toFixed(1),
  };
}

const result = calculateShopifyOrderBreakdown(mockCancelledOrders, 5);

console.log("Mock Test Results:");
console.log("cancelledCount:", result.cancelledCount);
console.log("cancelledValue:", result.cancelledValue);

const expectedValue = 3213.39 + 3927.68 + 4499.00 + 3699.00 + 3699.00;
console.log("Expected Value (sum of Math.abs):", expectedValue);

if (result.cancelledCount === 5 && Math.abs(result.cancelledValue - expectedValue) < 0.01) {
  console.log("✓ TEST PASSED: Cancelled orders count and Math.abs amount calculation are correct!");
} else {
  console.error("❌ TEST FAILED!");
  process.exit(1);
}
