const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");
const { aggregateCreativesData } = require("../../../Frontend/src/features/meta/utils/creativeAggregator");

const testSingleDay = async () => {
  const activeMetaAccount = "359804707990884";
  
  console.log("=== TESTING SINGLE DAY (2026-08-17) WITH AGGREGATION ===");
  const raw17 = await fetchCreatives({ activeMetaAccount, dateFrom: "2026-08-17", dateTo: "2026-08-17" });
  console.log(`Raw records for 2026-08-17: ${raw17.length}`);

  const agg17 = aggregateCreativesData(raw17, false); // Group by creative identity
  console.log(`Aggregated creative cards for 2026-08-17: ${agg17.length}\n`);

  agg17.forEach((cr, idx) => {
    console.log(`Card #${idx + 1}: ad_name="${cr.ad_name}", date=${cr.date}, spend=${cr.spend}`);
  });

  process.exit(0);
};

testSingleDay();
