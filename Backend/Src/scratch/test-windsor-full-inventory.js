const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const windsorProvider = require("../providers/windsor.provider");

async function run() {
  const activeShopifyAccount = "jsbhealthcare.myshopify.com";
  console.log("Checking available fields across Windsor endpoints...");

  // Test Products / Catalog Fields
  try {
    const products = await windsorProvider.fetchData({
      connector: "shopify",
      fields: [
        "account_name",
        "line_item__product_id",
        "line_item__name",
        "line_item__sku",
        "line_item__quantity",
        "line_item__price",
        "line_item__total_discount",
        "line_item__variant_compare_at_price",
        "line_item__variant_available_for_sale",
      ],
      datePreset: "last_30d",
      filters: [["account_name", "eq", activeShopifyAccount]],
    });
    console.log(`Products Endpoint (${products.length} rows):`);
    if (products.length > 0) console.log("Sample:", products[0]);
  } catch (err) {
    console.log("Products Endpoint Error:", err.message);
  }

  // Test Orders Fields for Refund / Financial Status / Payment / Discounts
  try {
    const orders = await windsorProvider.fetchData({
      connector: "shopify",
      fields: [
        "account_name",
        "order_id",
        "order_name",
        "order_created_at",
        "order_financial_status",
        "order_fulfillment_status",
        "order_gross_sales",
        "order_net_sales",
        "order_total_discounts",
        "order_total_price",
        "order_cancelled_at",
        "order_cancel_reason",
        "order_customer_id",
        "order_customer_number_of_orders",
        "order_new_or_returning_customer",
      ],
      datePreset: "last_30d",
      filters: [["account_name", "eq", activeShopifyAccount]],
    });
    console.log(`\nOrders Endpoint (${orders.length} rows):`);
    if (orders.length > 0) {
      console.log("Sample:", orders[0]);
      const financialStatuses = [...new Set(orders.map(o => o.order_financial_status))];
      console.log("Financial statuses found:", financialStatuses);
      const cancellationReasons = [...new Set(orders.map(o => o.order_cancel_reason))];
      console.log("Cancellation reasons found:", cancellationReasons);
    }
  } catch (err) {
    console.log("Orders Endpoint Error:", err.message);
  }

  // Test Customers Fields for First Purchase Date / Cohort Analysis
  try {
    const customers = await windsorProvider.fetchData({
      connector: "shopify",
      fields: [
        "account_name",
        "customer_id",
        "customer_email",
        "customer_created_at",
        "customer_date",
        "customer_orders_count",
        "customer_total_spent",
      ],
      datePreset: "last_90d",
      filters: [["account_name", "eq", activeShopifyAccount]],
    });
    console.log(`\nCustomers Endpoint (${customers.length} rows):`);
    if (customers.length > 0) console.log("Sample:", customers[0]);
  } catch (err) {
    console.log("Customers Endpoint Error:", err.message);
  }
}

run();
