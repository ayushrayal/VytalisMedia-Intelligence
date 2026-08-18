const assert = require("assert");

// Inline copy of helper logic for Node test execution
const extractNumericValue = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const first = val[0];
    if (first && first.value !== undefined) {
      const parsed = parseFloat(first.value);
      return isNaN(parsed) ? null : parsed;
    }
  }
  if (typeof val === "object" && val.value !== undefined) {
    const parsed = parseFloat(val.value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const checkIsSingleDay = (dateParams, records) => {
  if (dateParams) {
    if (dateParams.dateFrom && dateParams.dateTo) {
      return dateParams.dateFrom === dateParams.dateTo;
    }
    if (dateParams.datePreset) {
      if (dateParams.datePreset === "today" || dateParams.datePreset === "yesterday") {
        return true;
      }
      return false;
    }
  }
  if (Array.isArray(records) && records.length > 0) {
    const uniqueDates = new Set(records.map((r) => r.date).filter(Boolean));
    return uniqueDates.size <= 1;
  }
  return false;
};

const aggregateCreativesData = (records, isSingleDay) => {
  if (!Array.isArray(records) || records.length === 0) return [];
  if (isSingleDay) return records;

  const grouped = new Map();
  for (const record of records) {
    if (!record) continue;
    const key = String(
      record.ad_id || record.creative_id || record.id || record.ad_name || record.creative_name || record.name || "creative"
    ).trim();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  }

  const aggregatedResult = [];
  const sumKeys = new Set(["spend", "amount_spent"]);
  const metadataKeys = new Set([
    "ad_id", "creative_id", "id", "ad_name", "creative_name", "name", "campaign", "campaign_name",
    "campaign_id", "adset_name", "adset_id", "status", "effective_status", "ad_effective_status",
    "ad_status", "adset_status", "campaign_status", "currency", "thumbnail_url", "image_url",
    "media_type", "creative_type", "type", "video_id", "video_url", "object_story_spec",
    "facebook_permalink_url", "instagram_permalink_url", "date"
  ]);

  grouped.forEach((groupRecords) => {
    if (groupRecords.length === 0) return;
    if (groupRecords.length === 1) {
      aggregatedResult.push(groupRecords[0]);
      return;
    }

    const primaryRecord = groupRecords[0];
    const aggregated = { ...primaryRecord };
    const dates = groupRecords.map((r) => r.date).filter(Boolean).sort();
    if (dates.length > 0) {
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      aggregated.date = minDate === maxDate ? minDate : `${minDate} – ${maxDate}`;
    }

    const allKeys = new Set();
    groupRecords.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));

    allKeys.forEach((keyName) => {
      if (metadataKeys.has(keyName)) return;

      const isSumMetric = sumKeys.has(keyName);
      const validValues = groupRecords
        .map((r) => extractNumericValue(r[keyName]))
        .filter((val) => val !== null && !isNaN(val));

      if (validValues.length > 0) {
        if (isSumMetric) {
          aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
        } else {
          const sum = validValues.reduce((a, b) => a + b, 0);
          aggregated[keyName] = sum / validValues.length;
        }
      } else {
        if (!(keyName in primaryRecord)) {
          aggregated[keyName] = null;
        }
      }
    });

    aggregatedResult.push(aggregated);
  });

  return aggregatedResult;
};

// ==========================================
// TEST SUITE EXECUTION
// ==========================================

console.log("Running Creative Aggregator Verification Tests...\n");

// Test 1: Single Day Detection
assert.strictEqual(checkIsSingleDay({ dateFrom: "2026-08-10", dateTo: "2026-08-10" }), true, "Custom single day must be singleDay=true");
assert.strictEqual(checkIsSingleDay({ dateFrom: "2026-08-10", dateTo: "2026-08-16" }), false, "Custom range must be singleDay=false");
assert.strictEqual(checkIsSingleDay({ datePreset: "today" }), true, "Today preset must be singleDay=true");
assert.strictEqual(checkIsSingleDay({ datePreset: "yesterday" }), true, "Yesterday preset must be singleDay=true");
assert.strictEqual(checkIsSingleDay({ datePreset: "last_7d" }), false, "last_7d must be singleDay=false");
assert.strictEqual(checkIsSingleDay({ datePreset: "last_30d" }), false, "last_30d must be singleDay=false");
console.log("✓ Single Day Detection Tests Passed.");

// Test 2: Single Day Pass-Through (no averaging)
const singleDayData = [
  { ad_id: "101", date: "2026-08-10", spend: 3000, purchases: 5 },
  { ad_id: "101", date: "2026-08-10", spend: 3000, purchases: 5 }
];
const singleDayResult = aggregateCreativesData(singleDayData, true);
assert.strictEqual(singleDayResult.length, 2, "Single-day must preserve exact raw records");
assert.strictEqual(singleDayResult[0].spend, 3000);
console.log("✓ Single Day Pass-Through Tests Passed.");

// Test 3: Multi-Day Aggregation (SUM Spend, AVERAGE Metrics, Ignored Nulls)
const multiDayData = [
  { ad_id: "101", ad_name: "Creative Video A", date: "2026-08-10", spend: 3000, purchases: 5, purchase_roas: 5.0, cost_per_result: 600 },
  { ad_id: "101", ad_name: "Creative Video A", date: "2026-08-11", spend: 4000, purchases: null, purchase_roas: null, cost_per_result: null },
  { ad_id: "101", ad_name: "Creative Video A", date: "2026-08-12", spend: 5000, purchases: 7, purchase_roas: 4.2, cost_per_result: 714.28 },
  { ad_id: "202", ad_name: "Creative Image B", date: "2026-08-10", spend: 1000, purchases: 2, purchase_roas: 2.0, cost_per_result: 500 }
];
const multiDayResult = aggregateCreativesData(multiDayData, false);

assert.strictEqual(multiDayResult.length, 2, "Multi-day must collapse duplicate creatives into 1 card per creative");

const creativeA = multiDayResult.find(r => r.ad_id === "101");
assert.ok(creativeA, "Creative 101 must exist");
assert.strictEqual(creativeA.spend, 12000, "Spend must be SUM: 3000 + 4000 + 5000 = 12000");
assert.strictEqual(creativeA.purchases, 6, "Purchases average ignoring null: (5 + 7) / 2 = 6");
assert.strictEqual(creativeA.purchase_roas, 4.6, "ROAS average ignoring null: (5.0 + 4.2) / 2 = 4.6");
assert.strictEqual(creativeA.date, "2026-08-10 – 2026-08-12", "Date display must show minDate – maxDate range");

console.log("✓ Multi-Day Aggregation Tests Passed.");
console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
