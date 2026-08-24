const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const windsorProvider = require("../providers/windsor.provider");

const testSpendDistribution = async () => {
  try {
    await connectDB();
    await cacheUtil.connect();

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
        map[reg] = { region: reg, spend: 0, impressions: 0, clicks: 0, reach: 0 };
      }
      map[reg].spend += Number(row.spend || 0);
      map[reg].impressions += Number(row.impressions || 0);
      map[reg].clicks += Number(row.clicks || 0);
    });

    const regions = Object.values(map).map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    })).sort((a, b) => b.spend - a.spend);

    const nonZeroRegions = regions.filter(r => r.spend > 0);
    const totalSpend = regions.reduce((s, r) => s + r.spend, 0);
    const avgSpend = totalSpend / nonZeroRegions.length;

    // Percentile calculations
    const spends = nonZeroRegions.map(r => r.spend).sort((a, b) => a - b);
    const p50 = spends[Math.floor(spends.length * 0.50)];
    const p75 = spends[Math.floor(spends.length * 0.75)];
    const p90 = spends[Math.floor(spends.length * 0.90)];
    const p95 = spends[Math.floor(spends.length * 0.95)];

    console.log(`Total Regions: ${regions.length}`);
    console.log(`Non-Zero Spend Regions: ${nonZeroRegions.length}`);
    console.log(`Total Spend: ₹${totalSpend.toFixed(2)}`);
    console.log(`Average Spend per active region: ₹${avgSpend.toFixed(2)}`);
    console.log(`P50 (Median): ₹${p50.toFixed(2)}`);
    console.log(`P75: ₹${p75.toFixed(2)}`);
    console.log(`P90: ₹${p90.toFixed(2)}`);
    console.log(`P95: ₹${p95.toFixed(2)}`);

    // Let's test classifying with p90 vs p75 vs avgSpend
    const thresholds = [
      { name: "Median (P50)", val: p50 },
      { name: "Average Spend", val: avgSpend },
      { name: "P75", val: p75 },
      { name: "P90", val: p90 },
      { name: "P95", val: p95 },
    ];

    thresholds.forEach(t => {
      const high = regions.filter(r => r.spend >= t.val && r.spend > 0);
      const low = regions.filter(r => r.spend < t.val);
      const highTopCtr = [...high].sort((a, b) => b.ctr - a.ctr).slice(0, 3);
      console.log(`\n--- Threshold ${t.name} (₹${t.val.toFixed(2)}) ---`);
      console.log(`  High Spend Regions Count: ${high.length} | Low Spend Regions Count: ${low.length}`);
      console.log(`  High Spend Top 3 CTR:`);
      highTopCtr.forEach((r, i) => console.log(`    #${i+1} ${r.region} (CTR: ${r.ctr.toFixed(2)}%, Spend: ₹${r.spend.toFixed(2)})`));
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await cacheUtil.disconnect().catch(() => {});
    process.exit(0);
  }
};

testSpendDistribution();
