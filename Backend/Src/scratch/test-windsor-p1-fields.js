const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const windsorProvider = require("../providers/windsor.provider");

async function run() {
  const activeShopifyAccount = "jsbhealthcare.myshopify.com";

  // Test field list 1: products endpoint
  const testProductFields = async (fieldList) => {
    try {
      const rows = await windsorProvider.fetchData({
        connector: "shopify",
        fields: fieldList,
        datePreset: "last_7d",
        filters: [["account_name", "eq", activeShopifyAccount]],
      });
      console.log(`Success for product fields [${fieldList.join(", ")}]: ${rows.length} rows returned.`);
      if (rows.length > 0) console.log("Sample:", rows[0]);
    } catch (err) {
      console.log(`Failed for product fields [${fieldList.join(", ")}]: ${err.message}`);
    }
  };

  // Test field list 2: orders endpoint
  const testOrderFields = async (fieldList) => {
    try {
      const rows = await windsorProvider.fetchData({
        connector: "shopify",
        fields: fieldList,
        datePreset: "last_7d",
        filters: [["account_name", "eq", activeShopifyAccount]],
      });
      console.log(`Success for order fields [${fieldList.join(", ")}]: ${rows.length} rows returned.`);
      if (rows.length > 0) console.log("Sample:", rows[0]);
    } catch (err) {
      console.log(`Failed for order fields [${fieldList.join(", ")}]: ${err.message}`);
    }
  };

  console.log("--- Testing Product Fields ---");
  await testProductFields([
    "account_name",
    "order_id",
    "line_item__product_id",
    "line_item__name",
    "line_item__quantity",
    "line_item__price",
    "line_item__total_discount",
    "line_item__sku",
    "line_item__variant_compare_at_price",
  ]);

  console.log("\n--- Testing Order Fields ---");
  await testOrderFields([
    "account_name",
    "order_id",
    "order_created_at",
    "order_financial_status",
    "order_gross_sales",
    "order_net_sales",
    "order_total_discounts",
    "order_total_price",
    "order_cancel_reason",
    "order_cancelled_at",
  ]);
}

run();
