const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require("dotenv");
dotenv.config();

const facebookAdapter = require("../adapters/facebook.adapter");

async function testOverviewPurchases() {
  try {
    const res = await facebookAdapter.fetchOverview({
      activeMetaAccount: "359804707990884",
      datePreset: "last_7d",
    });

    console.log("=== OVERVIEW ROWS COUNT ===", res.length);
    if (res.length > 0) {
      console.log("=== FIRST ROW SAMPLE ===");
      console.log(JSON.stringify(res[0], null, 2));
    }
  } catch (err) {
    console.error("Error testing fetchOverview:", err.message);
  }
}

testOverviewPurchases();
