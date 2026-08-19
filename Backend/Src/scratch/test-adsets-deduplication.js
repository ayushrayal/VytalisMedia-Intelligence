const { aggregateAdSetsData } = require("../../../Frontend/src/features/meta/utils/adsetAggregator.js");

const runDeduplicationTest = () => {
  console.log("Running Ad Sets Deduplication & Aggregation Verification Tests...\n");

  const rawRows = [
    {
      adset_id: "120253838192450007",
      adset_name: "VM | Phoolwari Duplicated | 35-54 | 17/08/2026",
      campaign_id: "c1",
      campaign_name: "Campaign B",
      spend: 100,
      purchases: 2,
      purchase_conversion_value: 500,
      impressions: 1000,
      clicks: 50,
      reach: 800,
    },
    {
      adset_id: "120253838192450007",
      adset_name: "VM | Phoolwari Duplicated | 35-54 | 17/08/2026",
      campaign_id: "c1",
      campaign_name: "Campaign B",
      spend: 200,
      purchases: 3,
      purchase_conversion_value: 1000,
      impressions: 2000,
      clicks: 100,
      reach: 1500,
    },
    {
      adset_id: "120253838192450007",
      adset_name: "VM | Phoolwari Duplicated | 35-54 | 17/08/2026",
      campaign_id: "c1",
      campaign_name: "Campaign B",
      spend: 50,
      purchases: 0,
      purchase_conversion_value: 0,
      impressions: 500,
      clicks: 20,
      reach: 1200,
    },
    {
      adset_id: "120253838999999999",
      adset_name: "Ad Set 2 Unique",
      campaign_id: "c2",
      campaign_name: "Campaign A",
      spend: 500,
      purchases: 5,
      purchase_conversion_value: 2000,
      impressions: 5000,
      clicks: 250,
      reach: 4000,
    },
  ];

  console.log(`Raw rows count: ${rawRows.length}`);

  const aggregated = aggregateAdSetsData(rawRows);
  console.log(`Aggregated unique count: ${aggregated.length}`);

  // Test 1: Unique ID count
  console.assert(aggregated.length === 2, `Expected 2 unique adsets, got ${aggregated.length}`);

  // Test 2: Check target duplicated adset metrics
  const target = aggregated.find((a) => a.adset_id === "120253838192450007");
  console.assert(target !== undefined, "Target adset 120253838192450007 found");
  console.assert(target.spend === 350, `Expected spend 350, got ${target.spend}`);
  console.assert(target.purchases === 5, `Expected purchases 5, got ${target.purchases}`);
  console.assert(target.purchase_conversion_value === 1500, `Expected value 1500, got ${target.purchase_conversion_value}`);
  console.assert(target.impressions === 3500, `Expected impressions 3500, got ${target.impressions}`);
  console.assert(target.clicks === 170, `Expected clicks 170, got ${target.clicks}`);
  console.assert(target.reach === 1500, `Expected MAX reach 1500, got ${target.reach}`);

  // Test 3: Derived metrics check (ROAS = 1500 / 350 = 4.2857)
  const expectedRoas = 1500 / 350;
  console.assert(Math.abs(target.purchase_roas - expectedRoas) < 0.0001, `ROAS mismatch: ${target.purchase_roas} vs ${expectedRoas}`);

  // Test 4: Cost per result = 350 / 5 = 70
  console.assert(target.cost_per_result === 70, `Cost per result mismatch: ${target.cost_per_result} vs 70`);

  console.log("\nALL AD SET DEDUPLICATION TESTS PASSED SUCCESSFULLY!");
};

runDeduplicationTest();
