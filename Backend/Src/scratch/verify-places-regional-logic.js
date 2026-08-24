const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const windsorProvider = require("../providers/windsor.provider");

const runPlacesVerification = async () => {
  try {
    await connectDB();
    await cacheUtil.connect();

    console.log("===============================================================================");
    console.log("META PLACES REGIONAL RANKING LOGIC VERIFICATION");
    console.log("===============================================================================\n");

    const datePreset = "last_7d";
    // Fetch raw places data directly from Windsor provider for test account
    const rawPlaces = await windsorProvider.fetchData({
      connector: "facebook",
      fields: ["country", "region", "spend", "impressions", "reach", "clicks", "ctr", "cpc", "currency"],
      datePreset,
      filters: [],
    });

    console.log(`Raw Places API Payload Rows: ${rawPlaces.length}\n`);

    // STEP 1: Aggregate Data by Region
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

    // STEP 2: Sort ALL Regions by Spend DESC
    const spendRankedRegions = [...aggregatedRegions].sort((a, b) => (b.spend || 0) - (a.spend || 0));

    // STEP 3: High Spend Analysis Pool (Top 10 by Spend)
    const highSpendPool = spendRankedRegions.slice(0, 10);
    const highSpendPoolNames = new Set(highSpendPool.map(r => r.region));

    // Top 5 Regions for Overview
    const top5SpendRegions = spendRankedRegions.slice(0, 5);

    // Derived Performance & Highlights
    const bestRegion = [...highSpendPool].sort((a, b) => (b.ctr || 0) - (a.ctr || 0))[0] || null;

    const efficientRegionCandidates = highSpendPool.filter(r => r.clicks > 0 && r.cpc > 0);
    const efficientRegion = efficientRegionCandidates.sort((a, b) => {
      if (a.cpc !== b.cpc) return a.cpc - b.cpc;
      return b.ctr - a.ctr;
    })[0] || null;

    const ctrPerformance = [...highSpendPool].sort((a, b) => (b.ctr || 0) - (a.ctr || 0));
    const cpcPerformance = [...efficientRegionCandidates].sort((a, b) => a.cpc - b.cpc);

    // PRINT VERIFICATION TABLE FOR ALL REGIONS
    console.log("--- REGIONAL VERIFICATION TABLE ---");
    const verificationTable = spendRankedRegions.map((r, idx) => ({
      "Spend Rank": `#${idx + 1}`,
      "Region": r.region,
      "Spend": `₹${r.spend.toFixed(2)}`,
      "Clicks": r.clicks,
      "Impressions": r.impressions,
      "CTR": `${r.ctr.toFixed(2)}%`,
      "CPC": `₹${r.cpc.toFixed(2)}`,
      "Reach": r.reach,
      "Included in High-Spend Pool": highSpendPoolNames.has(r.region) ? "YES" : "NO",
    }));

    console.table(verificationTable);

    console.log("\n===============================================================================");
    console.log("EXPLICIT REPORTING OF FINDINGS:");
    console.log("===============================================================================");
    console.log(`1. Top 10 Regions by Spend:\n${highSpendPool.map((r, i) => `   #${i+1} ${r.region} (Spend: ₹${r.spend.toFixed(2)})`).join("\n")}`);
    console.log(`\n2. Top 5 Regions used in Top Regions Overview (ALWAYS Fixed to Top 5 Spenders):\n${top5SpendRegions.map((r, i) => `   #${i+1} ${r.region} (Spend: ₹${r.spend.toFixed(2)})`).join("\n")}`);
    console.log(`\n3. Best Performing Region:\n   Region: ${bestRegion?.region} | CTR: ${bestRegion?.ctr.toFixed(2)}% | Spend: ₹${bestRegion?.spend.toFixed(2)} | Reason: Highest CTR among high-spend pool`);
    console.log(`\n4. Most Efficient Region:\n   Region: ${efficientRegion?.region} | CPC: ₹${efficientRegion?.cpc.toFixed(2)} | Spend: ₹${efficientRegion?.spend.toFixed(2)} | Reason: Lowest CPC among high-spend pool`);
    console.log(`\n5. Regional Performance CTR Ordering (Top 10 High-Spend Pool):\n${ctrPerformance.map((r, i) => `   #${i+1} ${r.region} (CTR: ${r.ctr.toFixed(2)}%, Spend: ₹${r.spend.toFixed(2)})`).join("\n")}`);
    console.log(`\n6. Regional Performance CPC Ordering (Top 10 High-Spend Pool):\n${cpcPerformance.map((r, i) => `   #${i+1} ${r.region} (CPC: ₹${r.cpc.toFixed(2)}, Spend: ₹${r.spend.toFixed(2)})`).join("\n")}`);
    
    // Check if any low-spend region entered highSpendPool
    const minPoolSpend = highSpendPool[highSpendPool.length - 1]?.spend || 0;
    console.log(`\n7. Low-spend Outlier Check: Min Spend in High-Spend Pool is ₹${minPoolSpend.toFixed(2)}. Outliers (< ₹${minPoolSpend.toFixed(2)}) excluded from performance ranking: YES.`);

  } catch (err) {
    console.error("Error running places verification:", err);
  } finally {
    await cacheUtil.disconnect().catch(() => {});
    process.exit(0);
  }
};

runPlacesVerification();
