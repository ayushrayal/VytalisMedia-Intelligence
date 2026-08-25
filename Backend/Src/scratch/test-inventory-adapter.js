const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyAdapter = require("../adapters/shopify.adapter");

async function run() {
  try {
    const activeShopifyAccount = "jsbhealthcare.myshopify.com";
    console.log("Testing fetchInventory adapter method...");
    const rows = await shopifyAdapter.fetchInventory({ activeShopifyAccount });
    console.log(`Inventory Adapter Success: ${rows.length} rows returned.`);
    if (rows.length > 0) {
      console.log("Sample inventory row:", rows[0]);
    }
  } catch (err) {
    console.error("Inventory Adapter Error:", err.message);
  }
}

run();
