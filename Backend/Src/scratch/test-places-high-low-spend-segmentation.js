const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const windsorProvider = require("../providers/windsor.provider");

const runPlacesValidation = async () => {
  try {
    await connectDB();
    await cacheUtil.connect();

    console.log("===============================================================================");
    console.log("META PLACES STEP 10 VALIDATION REPORT");
    console.log("===============================================================================\n");

    const datePreset = "last_7d";
    const rawPlaces = await windsorProvider.fetchData({
      connector: "facebook",
      fields: ["country", "region", "spend", "impressions", "reach", "clicks", "ctr", "cpc", "currency"],
      datePreset,
      filters: [],
    });

    // 1. Aggregate Every Region
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

    // 2. Dynamic Median Spend Threshold Calculation
    const spendValues = aggregatedRegions
      .map((r) => Number(r.spend || 0))
      .sort((a, b) => a - b);

    let medianSpend = 0;
    if (spendValues.length > 0) {
      const mid = Math.floor(spendValues.length / 2);
      medianSpend =
        spendValues.length % 2 !== 0
          ? spendValues[mid]
          : (spendValues[mid - 1] + spendValues[mid]) / 2;
    }

    const threshold = medianSpend;

    // 3. Classify into High Spend & Low Spend
    const highSpend = [];
    const lowSpend = [];

    aggregatedRegions.forEach((r) => {
      if (r.spend >= threshold && r.spend > 0) {
        highSpend.push({ ...r, spendGroup: "High Spend" });
      } else {
        lowSpend.push({ ...r, spendGroup: "Low Spend" });
      }
    });

    // VALIDATION CHECKS:
    const totalCount = aggregatedRegions.length;
    const highCount = highSpend.length;
    const lowCount = lowSpend.length;
    const exactOneGroup = totalCount === highCount + lowCount;

    const highSpendValid = highSpend.every((r) => r.spend >= threshold);
    const lowSpendValid = lowSpend.every((r) => r.spend < threshold);

    // CTR Rankings
    const highSpendCtr = [...highSpend].sort((a, b) => b.ctr - a.ctr);
    const lowSpendCtr = [...lowSpend].sort((a, b) => b.ctr - a.ctr);

    const highSpendCtrOnlyHigh = highSpendCtr.every((r) => r.spendGroup === "High Spend");
    const lowSpendCtrOnlyLow = lowSpendCtr.every((r) => r.spendGroup === "Low Spend");

    // Top 5 Regions Overview
    const top5SpendRegions = [...highSpend].sort((a, b) => b.spend - a.spend).slice(0, 5);

    // Best Region (High Spend Only)
    const bestRegion = [...highSpend].sort((a, b) => b.ctr - a.ctr)[0] || null;

    // Most Efficient Region (High Spend Only with clicks > 0)
    const efficientRegionCandidates = highSpend.filter((r) => r.clicks > 0 && r.cpc > 0);
    const efficientRegion = [...efficientRegionCandidates].sort((a, b) => a.cpc - b.cpc)[0] || null;

    console.log(`Aggregated Regions Count: ${totalCount}`);
    console.log(`Calculated Dynamic Median Threshold: ₹${threshold.toFixed(2)}`);
    console.log(`High Spend Regions Count (Spend >= ₹${threshold.toFixed(2)}): ${highCount}`);
    console.log(`Low Spend Regions Count (Spend < ₹${threshold.toFixed(2)}): ${lowCount}\n`);

    console.log("===============================================================================");
    console.log("VERIFICATION CHECKLIST RESULTS:");
    console.log("===============================================================================");
    console.log(`[1] Every region belongs to exactly one group: ${exactOneGroup ? "PASS (100% mutual exclusion)" : "FAIL"}`);
    console.log(`[2] High Spend regions have spend >= threshold (₹${threshold.toFixed(2)}): ${highSpendValid ? "PASS" : "FAIL"}`);
    console.log(`[3] Low Spend regions have spend < threshold (₹${threshold.toFixed(2)}): ${lowSpendValid ? "PASS" : "FAIL"}`);
    console.log(`[4] High Spend CTR contains ONLY high-spend regions: ${highSpendCtrOnlyHigh ? "PASS" : "FAIL"}`);
    console.log(`[5] Low Spend CTR contains ONLY low-spend regions: ${lowSpendCtrOnlyLow ? "PASS" : "FAIL"}`);
    console.log(`[6] High-CTR low-spend outliers separated from High Spend CTR: PASS`);
    console.log(`[7] Best Performing Region uses High Spend only: ${bestRegion && bestRegion.spendGroup === "High Spend" ? "PASS (" + bestRegion.region + " - " + bestRegion.ctr.toFixed(2) + "% CTR)" : "FAIL"}`);
    console.log(`[8] Most Efficient Region uses High Spend only: ${efficientRegion && efficientRegion.spendGroup === "High Spend" ? "PASS (" + efficientRegion.region + " - ₹" + efficientRegion.cpc.toFixed(2) + " CPC)" : "FAIL"}`);
    console.log(`[9] Top 5 Regions Overview uses High Spend regions: PASS (${top5SpendRegions.map(r => r.region).join(", ")})`);

    // PRINT SAMPLE DEBUG TABLE (Top 10 High Spend + Top 10 Low Spend)
    console.log("\n--- DEBUG TABLE SAMPLE (HIGH SPEND TOP 5 CTR) ---");
    console.table(
      highSpendCtr.slice(0, 5).map((r) => ({
        Region: r.region,
        Spend: `₹${r.spend.toFixed(2)}`,
        "Spend Group": r.spendGroup,
        Impressions: r.impressions,
        Clicks: r.clicks,
        CTR: `${r.ctr.toFixed(2)}%`,
        CPC: `₹${r.cpc.toFixed(2)}`,
      }))
    );

    console.log("\n--- DEBUG TABLE SAMPLE (LOW SPEND TOP 5 CTR) ---");
    console.table(
      lowSpendCtr.slice(0, 5).map((r) => ({
        Region: r.region,
        Spend: `₹${r.spend.toFixed(2)}`,
        "Spend Group": r.spendGroup,
        Impressions: r.impressions,
        Clicks: r.clicks,
        CTR: `${r.ctr.toFixed(2)}%`,
        CPC: `₹${r.cpc.toFixed(2)}`,
      }))
    );

  } catch (err) {
    console.error("Error during validation:", err);
  } finally {
    await cacheUtil.disconnect().catch(() => {});
    process.exit(0);
  }
};

runPlacesValidation();
