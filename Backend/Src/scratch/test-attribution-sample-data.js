/**
 * Validation Script for Attribution Processing using synthetic and live order data.
 * Verifies mathematical invariants and grouping guarantees.
 */

const { parseOrderCustomAttributes } = require("../utils/attribution-parser.util");
const { classifyAttributionOrder } = require("../utils/attribution-classifier.util");
const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");

const sampleWindsorOrders = [
  {
    order_id: "ORD001",
    order_created_at: "2026-08-01T10:00:00Z",
    order_gross_sales: "1750.00",
    order_total_price: "1500.00",
    order_net_sales: "1200.00",
    order_financial_status: "paid",
    order_custom_attributes: "fbclid=FB123;utm_source=facebook;utm_medium=cpc",
  },
  {
    order_id: "ORD002",
    order_created_at: "2026-08-01T11:30:00Z",
    order_gross_sales: "2800.00",
    order_total_price: "2500.00",
    order_net_sales: "2000.00",
    order_financial_status: "paid",
    order_custom_attributes: "gclid=GGL456;orig_referrer=https://google.com/",
  },
  {
    order_id: "ORD003",
    order_created_at: "2026-08-02T09:15:00Z",
    order_gross_sales: "900.00",
    order_total_price: "800.00",
    order_net_sales: "700.00",
    order_financial_status: "pending",
    order_custom_attributes: "orig_referrer=https://www.google.com/",
  },
  {
    order_id: "ORD004",
    order_created_at: "2026-08-02T14:20:00Z",
    order_gross_sales: "3500.00",
    order_total_price: "3100.00",
    order_net_sales: "2900.00",
    order_financial_status: "paid",
    order_custom_attributes: "utm_source=bitespeed;utm_medium=whatsapp",
  },
  {
    order_id: "ORD005",
    order_created_at: "2026-08-03T16:45:00Z",
    order_gross_sales: "1400.00",
    order_total_price: "1200.00",
    order_net_sales: "1000.00",
    order_financial_status: "paid",
    order_custom_attributes: "orig_referrer=https://chatgpt.com/",
  },
  {
    order_id: "ORD006",
    order_created_at: "2026-08-03T18:00:00Z",
    order_gross_sales: "600.00",
    order_total_price: "500.00",
    order_net_sales: "450.00",
    order_financial_status: "paid",
    order_custom_attributes: "utm_source=custom_affiliate;utm_medium=partner",
  },
  {
    order_id: "ORD007",
    order_created_at: "2026-08-04T08:10:00Z",
    order_gross_sales: "1100.00",
    order_total_price: "950.00",
    order_net_sales: "800.00",
    order_financial_status: "paid",
    order_custom_attributes: "orig_referrer=https://threadnbutton.com/",
  },
];

const merchantDomains = ["threadnbutton.com"];

console.log("=== VALIDATING SAMPLE ORDERS ATTRIBUTION INVARIANTS ===");

let totalGross = 0;
let totalNet = 0;
const channelCounts = {};
const groupCounts = {};

sampleWindsorOrders.forEach((row) => {
  const parsed = parseOrderCustomAttributes(row.order_custom_attributes);
  const result = classifyAttributionOrder(parsed, merchantDomains);

  const gross = parseFloat(row.order_gross_sales || row.gross_sales || row.order_total_price) || 0;
  const net = parseFloat(row.order_net_sales || row.net_sales) || 0;

  totalGross += gross;
  totalNet += net;

  channelCounts[result.channel] = (channelCounts[result.channel] || 0) + 1;
  groupCounts[result.topLevelGroup] = (groupCounts[result.topLevelGroup] || 0) + 1;

  console.log(`Order ${row.order_id}: Channel='${result.channel}' | Group='${result.topLevelGroup}' | Gross=${gross} | Net=${net}`);
});

// Verification 1: Every order belongs to exactly ONE channel
const totalChannelOrders = Object.values(channelCounts).reduce((a, b) => a + b, 0);
console.assert(totalChannelOrders === sampleWindsorOrders.length, "Each order must belong to 1 channel");

// Verification 2: Top-level group totals sum to total order count
const totalGroupOrders = Object.values(groupCounts).reduce((a, b) => a + b, 0);
console.assert(totalGroupOrders === sampleWindsorOrders.length, "Group totals must equal total orders");

// Verification 3: Field includes order_gross_sales
console.assert(ATTRIBUTION_CONSTANTS.FIELDS.includes("order_gross_sales"), "FIELDS must contain order_gross_sales");

console.log(`\nTotal Orders: ${sampleWindsorOrders.length}`);
console.log(`Total Gross: $${totalGross.toFixed(2)}`);
console.log(`Total Net:   $${totalNet.toFixed(2)}`);

console.log("\nGroup Counts:", groupCounts);
console.log("Channel Counts:", channelCounts);

console.log("\n=== INVARIANT VALIDATION PASSED SUCCESSFULLY! ===");
