const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const windsorProvider = require("../providers/windsor.provider");

async function probeHistoricalDepth() {
  const activeShopifyAccount = "jsbhealthcare.myshopify.com";
  console.log("=== PROBING WINDSOR HISTORICAL DEPTH (last_year vs last_90d) ===");

  try {
    const fields = ["account_name", "order_id", "order_created_at", "order_customer_id", "order_net_sales"];

    console.log("Testing datePreset 'last_year'...");
    const ordersYear = await windsorProvider.fetchData({
      connector: "shopify",
      fields,
      datePreset: "last_year",
      filters: [["account_name", "eq", activeShopifyAccount]],
    });

    console.log(`Fetched ${ordersYear.length} order rows for 'last_year'.`);
    if (ordersYear.length > 0) {
      const dates = ordersYear
        .map((o) => o.order_created_at)
        .filter(Boolean)
        .sort();
      console.log(`Historical depth range for 'last_year': ${dates[0]} to ${dates[dates.length - 1]}`);

      // Count orders per YYYY-MM month
      const monthCounts = {};
      ordersYear.forEach((o) => {
        if (o.order_created_at) {
          const ym = o.order_created_at.substring(0, 7); // e.g. "2026-01"
          monthCounts[ym] = (monthCounts[ym] || 0) + 1;
        }
      });
      console.log("Orders count per month in available history:", monthCounts);
    }

  } catch (err) {
    console.error("Error testing historical depth:", err.message);
  }
}

probeHistoricalDepth();
