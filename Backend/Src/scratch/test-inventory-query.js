const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyAdapter = require("../adapters/shopify.adapter");

async function run() {
  try {
    const activeShopifyAccount = "jsbhealthcare.myshopify.com";
    console.log("Testing fetchInventory with datePreset='last_90d'...");
    const rows = await shopifyAdapter.fetchInventory({ activeShopifyAccount, datePreset: "last_90d" });
    console.log(`Success: ${rows.length} rows returned.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
