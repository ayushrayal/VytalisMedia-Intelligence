const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const windsorProvider = require("../providers/windsor.provider");

const testTopRegionsModes = async () => {
  try {
    await connectDB();
    await cacheUtil.connect();

    console.log("===============================================================================");
    console.log("TESTING TOP 5 REGIONS OVERVIEW 4 RANKING MODES");
    console.log("===============================================================================\n");

    const datePreset = "last_7d";
    const rawPlaces = await windsorProvider.fetchData({
      connector: "facebook",
      fields: ["country", "region", "spend", "impressions", "reach", "clicks", "ctr", "cpc", "currency"],
      datePreset,
      filters: [],
    });

    const map = {};
    rawPlaces.forEach((row) => {
      let reg = String(row.region || "").trim();
      if (!reg || reg.toLowerCase() === "unknown" || reg.toLowerCase() === "null") {
        reg = "Unknown Region";
      }

      if (!map[reg]) {
        map[reg] = {
          region: reg,
          country: row.country || "",
          spend: 0,
          impressions: 0,
          clicks: 0,
          reach: 0,
        };
      }

      map[reg].spend += Number(row.spend || 0);
      map[reg].impressions += Number(row.impressions || 0);
      map[reg].clicks += Number(row.clicks || 0);
      map[reg].reach += Number(row.reach || 0);
    });

    const aggregatedRegions = Object.values(map).map((r) => {
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
      const cpc = r.clicks > 0 ? r.spend / r.clicks : 0;
      return {
        ...r,
        ctr: isNaN(ctr) || !isFinite(ctr) ? 0 : ctr,
        cpc: isNaN(cpc) || !isFinite(cpc) ? 0 : cpc,
      };
    });

    // MODE 1: High Spend (Spend DESC)
    const highSpend = [...aggregatedRegions]
      .sort((a, b) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 5);

    // MODE 2: Low Spend (Spend ASC, filtering spend > 0 or taking non-zero spenders)
    const spenders = aggregatedRegions.filter((r) => r.spend > 0);
    const lowSpend = [...spenders]
      .sort((a, b) => (a.spend || 0) - (b.spend || 0))
      .slice(0, 5);

    // MODE 3: High CTR (CTR DESC)
    const highCtr = [...aggregatedRegions]
      .sort((a, b) => (b.ctr || 0) - (a.ctr || 0))
      .slice(0, 5);

    // MODE 4: Low CTR (CTR ASC, filtering impressions > 0)
    const activeImpr = aggregatedRegions.filter((r) => r.impressions > 0);
    const lowCtr = [...activeImpr]
      .sort((a, b) => (a.ctr || 0) - (b.ctr || 0))
      .slice(0, 5);

    console.log("--- 1. HIGH SPEND (Spend DESC) ---");
    highSpend.forEach((r, i) => console.log(`  #${i+1} ${r.region} | Spend: ₹${r.spend.toFixed(2)} | CTR: ${r.ctr.toFixed(2)}% | Clicks: ${r.clicks}`));

    console.log("\n--- 2. LOW SPEND (Spend ASC) ---");
    lowSpend.forEach((r, i) => console.log(`  #${i+1} ${r.region} | Spend: ₹${r.spend.toFixed(2)} | CTR: ${r.ctr.toFixed(2)}% | Clicks: ${r.clicks}`));

    console.log("\n--- 3. HIGH CTR (CTR DESC) ---");
    highCtr.forEach((r, i) => console.log(`  #${i+1} ${r.region} | CTR: ${r.ctr.toFixed(2)}% | Spend: ₹${r.spend.toFixed(2)} | Clicks: ${r.clicks}`));

    console.log("\n--- 4. LOW CTR (CTR ASC) ---");
    lowCtr.forEach((r, i) => console.log(`  #${i+1} ${r.region} | CTR: ${r.ctr.toFixed(2)}% | Spend: ₹${r.spend.toFixed(2)} | Impressions: ${r.impressions}`));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await cacheUtil.disconnect().catch(() => {});
    process.exit(0);
  }
};

testTopRegionsModes();
