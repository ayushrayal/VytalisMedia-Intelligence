const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyAdapter = require("../adapters/shopify.adapter");

async function run() {
  try {
    const activeShopifyAccount = "jsbhealthcare.myshopify.com";
    console.log("Testing fetchInventory with ZERO date parameters...");
    const rows = await shopifyAdapter.fetchInventory({ activeShopifyAccount });
    console.log(`Step 1 Fix Verified Success: ${rows.length} inventory catalog rows returned!`);
  } catch (err) {
    console.error("Step 1 Error:", err.message);
  }
}

run();
