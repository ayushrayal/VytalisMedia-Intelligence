const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");

const testTodayApi = async () => {
  console.log("=== TESTING WINDSOR API FOR TODAY PRESET ===");
  const activeMetaAccount = "359804707990884";
  
  const recordsToday = await fetchCreatives({
    activeMetaAccount,
    datePreset: "today",
  });

  console.log(`Raw records for datePreset="today": ${recordsToday.length}`);
  
  const dates = new Set(recordsToday.map(r => r.date));
  console.log(`Unique dates in datePreset="today" response:`, Array.from(dates));

  recordsToday.slice(0, 5).forEach((cr, idx) => {
    console.log(`Record #${idx + 1}: date=${cr.date}, ad_name="${cr.ad_name}", spend=${cr.spend}`);
  });

  process.exit(0);
};

testTodayApi();
