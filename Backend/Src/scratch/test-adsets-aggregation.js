/**
 * Test script to verify backend Ad Sets normalization & aggregation logic.
 * Simulates 9 raw Windsor rows representing 4 unique adset_ids.
 */

const { normalizeAndAggregateAdSets } = require("../adapters/facebook.adapter");

const mockCampaignId = "238512345678901";

// 9 raw Windsor records for 4 unique adset_ids
const mockRawWindsorAdSets = [
  // AdSet 1 (3 rows)
  {
    adset_id: "120251283809630058",
    adset_name: "Retargeting - Purchase 30d",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 1000.50,
    impressions: 50000,
    reach: 30000,
    clicks: 1200,
    actions_omni_purchase: 10,
    action_values_omni_purchase: 5000.00,
    actions_add_to_cart: 45,
    actions_initiate_checkout: 20,
    currency: "INR",
  },
  {
    adset_id: "120251283809630058",
    adset_name: "Retargeting - Purchase 30d",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 800.25,
    impressions: 40000,
    reach: 25000,
    clicks: 900,
    actions_omni_purchase: 8,
    action_values_omni_purchase: 4000.00,
    actions_add_to_cart: 35,
    actions_initiate_checkout: 15,
    currency: "INR",
  },
  {
    adset_id: "120251283809630058",
    adset_name: "Retargeting - Purchase 30d",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 500.25,
    impressions: 25000,
    reach: 18000,
    clicks: 600,
    actions_omni_purchase: 5,
    action_values_omni_purchase: 2500.00,
    actions_add_to_cart: 20,
    actions_initiate_checkout: 10,
    currency: "INR",
  },

  // AdSet 2 (2 rows)
  {
    adset_id: "120251284954080058",
    adset_name: "Broad Audience - LAL 1%",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 1500.00,
    impressions: 75000,
    reach: 50000,
    clicks: 1800,
    actions_omni_purchase: 15,
    action_values_omni_purchase: 7500.00,
    actions_add_to_cart: 60,
    actions_initiate_checkout: 30,
    currency: "INR",
  },
  {
    adset_id: "120251284954080058",
    adset_name: "Broad Audience - LAL 1%",
    campaign_id: mockCampaignId,
    effective_status: "PAUSED",
    spend: 500.00,
    impressions: 25000,
    reach: 20000,
    clicks: 600,
    actions_omni_purchase: 5,
    action_values_omni_purchase: 2500.00,
    actions_add_to_cart: 20,
    actions_initiate_checkout: 10,
    currency: "INR",
  },

  // AdSet 3 (2 rows)
  {
    adset_id: "1202512878899730058",
    adset_name: "Interest - Fitness & Health",
    campaign_id: mockCampaignId,
    effective_status: "PAUSED",
    spend: 300.00,
    impressions: 15000,
    reach: 12000,
    clicks: 300,
    actions_omni_purchase: 2,
    action_values_omni_purchase: 1000.00,
    actions_add_to_cart: 10,
    actions_initiate_checkout: 5,
    currency: "INR",
  },
  {
    adset_id: "1202512878899730058",
    adset_name: "Interest - Fitness & Health",
    campaign_id: mockCampaignId,
    effective_status: "PAUSED",
    spend: 200.00,
    impressions: 10000,
    reach: 8000,
    clicks: 200,
    actions_omni_purchase: 1,
    action_values_omni_purchase: 500.00,
    actions_add_to_cart: 5,
    actions_initiate_checkout: 2,
    currency: "INR",
  },

  // AdSet 4 (2 rows)
  {
    adset_id: "120251295508370058",
    adset_name: "Engaged Shoppers - Top Cities",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 2000.00,
    impressions: 100000,
    reach: 70000,
    clicks: 2500,
    actions_omni_purchase: 25,
    action_values_omni_purchase: 12500.00,
    actions_add_to_cart: 90,
    actions_initiate_checkout: 40,
    currency: "INR",
  },
  {
    adset_id: "120251295508370058",
    adset_name: "Engaged Shoppers - Top Cities",
    campaign_id: mockCampaignId,
    effective_status: "ACTIVE",
    spend: 1000.00,
    impressions: 50000,
    reach: 35000,
    clicks: 1250,
    actions_omni_purchase: 12,
    action_values_omni_purchase: 6000.00,
    actions_add_to_cart: 40,
    actions_initiate_checkout: 20,
    currency: "INR",
  },
];

console.log(`Input Raw Windsor Rows count: ${mockRawWindsorAdSets.length}`);

const result = normalizeAndAggregateAdSets(mockRawWindsorAdSets, mockCampaignId, "INR");

console.log(`\nOutput Aggregated Ad Sets count: ${result.length}`);
console.log("Aggregated Ad Sets:");
result.forEach((adset, i) => {
  console.log(`\n--- Ad Set [${i + 1}] ---`);
  console.log(`ID: ${adset.id}`);
  console.log(`Name: ${adset.name}`);
  console.log(`Status: ${adset.status}`);
  console.log(`Spend: ${adset.spend} (Expected sum: AdSet1=2301, AdSet2=2000, AdSet3=500, AdSet4=3000)`);
  console.log(`Impressions: ${adset.impressions}`);
  console.log(`Clicks: ${adset.clicks}`);
  console.log(`Purchases: ${adset.purchases}`);
  console.log(`Purchase Value: ${adset.purchase_conversion_value}`);
  console.log(`CTR: ${adset.ctr?.toFixed(4)}%`);
  console.log(`CPC: ${adset.cpc?.toFixed(2)}`);
  console.log(`CPM: ${adset.cpm?.toFixed(2)}`);
  console.log(`ROAS: ${adset.purchase_roas?.toFixed(2)}x`);
  console.log(`Cost Per Result: ${adset.cost_per_result?.toFixed(2)}`);
  console.log(`Reach (MAX fallback): ${adset.reach}`);
  console.log(`Frequency (impressions/reach): ${adset.frequency?.toFixed(2)}`);
});

// Assertions
if (result.length !== 4) {
  console.error(`\n[FAIL] Expected 4 unique adsets, got ${result.length}`);
  process.exit(1);
} else {
  console.log("\n[PASS] Output array contains exactly 4 unique Ad Sets!");
}

const adset1 = result.find(a => a.id === "120251283809630058");
if (adset1 && adset1.spend === 2301 && adset1.impressions === 115000 && adset1.clicks === 2700) {
  console.log("[PASS] AdSet 1 additive metrics summed correctly!");
} else {
  console.error("[FAIL] AdSet 1 additive metrics mismatch:", adset1);
  process.exit(1);
}

// Verify CTR calculation for AdSet 1: 2700 / 115000 * 100 = 2.347826...
const expectedCtr = (2700 / 115000) * 100;
if (Math.abs(adset1.ctr - expectedCtr) < 0.0001) {
  console.log("[PASS] AdSet 1 CTR recalculated correctly!");
} else {
  console.error("[FAIL] AdSet 1 CTR mismatch:", adset1.ctr, "Expected:", expectedCtr);
  process.exit(1);
}

// Verify ROAS calculation for AdSet 1: 11500 / 2301 = 4.9978...
const expectedRoas = 11500 / 2301;
if (Math.abs(adset1.purchase_roas - expectedRoas) < 0.0001) {
  console.log("[PASS] AdSet 1 ROAS recalculated correctly!");
} else {
  console.error("[FAIL] AdSet 1 ROAS mismatch:", adset1.purchase_roas, "Expected:", expectedRoas);
  process.exit(1);
}

// Verify Frequency calculation for AdSet 1: impressions (115000) / reach (30000) = 3.8333...
const expectedFreq = 115000 / 30000;
if (Math.abs(adset1.frequency - expectedFreq) < 0.0001) {
  console.log("[PASS] AdSet 1 Frequency recalculated correctly!");
} else {
  console.error("[FAIL] AdSet 1 Frequency mismatch:", adset1.frequency, "Expected:", expectedFreq);
  process.exit(1);
}

console.log("\n=== ALL UNIT TESTS PASSED SUCCESSFULLY! ===");
