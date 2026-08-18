const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");

const testDates = async () => {
  const activeMetaAccount = "359804707990884";

  console.log("--- TEST 1: dateFrom=2026-08-18, dateTo=2026-08-18 (Today 2026-08-18) ---");
  try {
    const res1 = await fetchCreatives({ activeMetaAccount, dateFrom: "2026-08-18", dateTo: "2026-08-18" });
    console.log(`Success! Records returned for 2026-08-18: ${res1.length}`);
    if (res1.length > 0) {
      console.log(`Sample date: ${res1[0].date}, spend: ${res1[0].spend}`);
    }
  } catch (err) {
    console.error("Test 1 Failed:", err.message);
  }

  console.log("\n--- TEST 2: dateFrom=2026-08-17, dateTo=2026-08-17 (Yesterday 2026-08-17) ---");
  try {
    const res2 = await fetchCreatives({ activeMetaAccount, dateFrom: "2026-08-17", dateTo: "2026-08-17" });
    console.log(`Success! Records returned for 2026-08-17: ${res2.length}`);
    if (res2.length > 0) {
      res2.slice(0, 5).forEach(r => {
        console.log(`- ad_name: "${r.ad_name}", date: ${r.date}, spend: ${r.spend}`);
      });
    }
  } catch (err) {
    console.error("Test 2 Failed:", err.message);
  }

  console.log("\n--- TEST 3: datePreset=last_7d ---");
  try {
    const res3 = await fetchCreatives({ activeMetaAccount, datePreset: "last_7d" });
    console.log(`Success! Records returned for last_7d: ${res3.length}`);
  } catch (err) {
    console.error("Test 3 Failed:", err.message);
  }

  process.exit(0);
};

testDates();
