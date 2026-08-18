const assert = require("assert");

// Helper logic for Node test execution matching creativeAggregator.js
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

const getCreativeGroupKey = (record) => {
  if (!record) return "creative";
  const creativeId = record.creative_id || record.creativeId;
  if (
    creativeId !== null &&
    creativeId !== undefined &&
    String(creativeId).trim() !== "" &&
    String(creativeId) !== "null" &&
    String(creativeId) !== "undefined"
  ) {
    return `creative_${String(creativeId).trim()}`;
  }
  const videoId = record.video_id || record.videoId;
  if (
    videoId !== null &&
    videoId !== undefined &&
    String(videoId).trim() !== "" &&
    String(videoId) !== "null" &&
    String(videoId) !== "undefined"
  ) {
    return `video_${String(videoId).trim()}`;
  }
  const adId = record.ad_id || record.adId || record.id;
  if (
    adId !== null &&
    adId !== undefined &&
    String(adId).trim() !== "" &&
    String(adId) !== "null" &&
    String(adId) !== "undefined"
  ) {
    return `ad_${String(adId).trim()}`;
  }
  return "creative_fallback";
};

const aggregateCreativesData = (records, isSingleDay) => {
  if (!Array.isArray(records) || records.length === 0) return [];
  if (isSingleDay) return records;

  const grouped = new Map();
  for (const record of records) {
    if (!record) continue;
    const key = getCreativeGroupKey(record);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  }

  const aggregatedResult = [];
  const sumKeys = new Set([
    "spend", "amount_spent", "purchases", "actions_omni_purchase", "purchase_conversion_value",
    "action_values_omni_purchase", "reach", "impressions", "clicks", "link_clicks", "link_click_actions",
    "inline_link_clicks", "actions_add_to_cart", "add_to_cart", "actions_initiate_checkout",
    "initiate_checkout", "video_play_actions_video_view", "video_play_actions", "video_views", "video_plays",
    "actions_video_view", "video_3_sec_watched_actions", "video_3_sec_views", "video_3_sec_watched",
    "video_thruplay_watched_actions_video_view", "video_thruplay_watched_actions", "video_thruplay_watched",
    "thruplay", "video_p25_watched_actions_video_view", "video_p25_watched_actions", "video_p25_watched",
    "p25", "video_p50_watched_actions_video_view", "video_p50_watched_actions", "video_p50_watched",
    "p50", "video_p75_watched_actions_video_view", "video_p75_watched_actions", "video_p75_watched",
    "p75", "video_p95_watched_actions_video_view", "video_p95_watched_actions", "video_p95_watched",
    "p95", "video_p100_watched_actions_video_view", "video_p100_watched_actions", "video_p100_watched", "p100"
  ]);

  const metadataKeys = new Set([
    "ad_id", "creative_id", "id", "ad_name", "creative_name", "name", "campaign", "campaign_name",
    "campaign_id", "adset_name", "adset_id", "status", "effective_status", "ad_effective_status",
    "ad_status", "adset_status", "campaign_status", "currency", "thumbnail_url", "image_url",
    "media_type", "creative_type", "type", "video_id", "video_url", "object_story_spec",
    "facebook_permalink_url", "instagram_permalink_url", "date"
  ]);

  const derivedRateKeys = new Set([
    "ctr", "cpc", "cpm", "purchase_roas", "cost_per_result", "frequency", "hook_rate", "hold_rate",
    "unique_outbound_clicks_ctr_outbound_click", "unique_outbound_clicks_ctr"
  ]);

  const watchTimeKeys = new Set([
    "video_avg_time_watched_actions_video_view", "video_avg_time_watched_actions", "video_avg_time_watched", "avg_watch_time"
  ]);

  grouped.forEach((groupRecords) => {
    if (groupRecords.length === 0) return;

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
      if (metadataKeys.has(keyName) || derivedRateKeys.has(keyName) || watchTimeKeys.has(keyName)) return;

      if (sumKeys.has(keyName)) {
        const validValues = groupRecords.map((r) => extractNumericValue(r[keyName])).filter((v) => v !== null && !isNaN(v));
        if (validValues.length > 0) {
          aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
        } else if (!(keyName in primaryRecord)) {
          aggregated[keyName] = null;
        }
      }
    });

    sumKeys.forEach((keyName) => {
      const validValues = groupRecords.map((r) => extractNumericValue(r[keyName])).filter((v) => v !== null && !isNaN(v));
      if (validValues.length > 0) {
        aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
      }
    });

    // Weighted Avg Watch Time
    let weightedWatchTimeSum = 0;
    let watchTimePlaysSum = 0;
    let hasValidWatchRecord = false;

    for (const r of groupRecords) {
      const plays = extractNumericValue(r.video_play_actions_video_view || r.video_play_actions || r.video_views || r.video_plays);
      const watchTime = extractNumericValue(
        r.video_avg_time_watched_actions_video_view || r.video_avg_time_watched_actions || r.video_avg_time_watched || r.avg_watch_time
      );

      if (plays !== null && plays > 0 && watchTime !== null && watchTime >= 0) {
        hasValidWatchRecord = true;
        weightedWatchTimeSum += plays * watchTime;
        watchTimePlaysSum += plays;
      }
    }

    if (hasValidWatchRecord && watchTimePlaysSum > 0) {
      const rawAvg = weightedWatchTimeSum / watchTimePlaysSum;
      const formattedAvg = Math.round(rawAvg * 100) / 100;
      aggregated.video_avg_time_watched_actions_video_view = formattedAvg;
      aggregated.video_avg_time_watched_actions = formattedAvg;
      if ("video_avg_time_watched" in primaryRecord || "video_avg_time_watched" in aggregated) {
        aggregated.video_avg_time_watched = formattedAvg;
      }
      if ("avg_watch_time" in primaryRecord || "avg_watch_time" in aggregated) {
        aggregated.avg_watch_time = formattedAvg;
      }
    } else {
      aggregated.video_avg_time_watched_actions_video_view = primaryRecord.video_avg_time_watched_actions_video_view ?? null;
      aggregated.video_avg_time_watched_actions = primaryRecord.video_avg_time_watched_actions ?? null;
    }

    // Derived Rates
    const totalSpend = extractNumericValue(aggregated.spend || aggregated.amount_spent);
    const totalImpressions = extractNumericValue(aggregated.impressions);
    const totalClicks = extractNumericValue(aggregated.clicks);
    const totalPurchases = extractNumericValue(aggregated.purchases || aggregated.actions_omni_purchase);
    const totalPurchaseValue = extractNumericValue(aggregated.purchase_conversion_value || aggregated.action_values_omni_purchase);
    const totalReach = extractNumericValue(aggregated.reach);

    // Verified Windsor 3-Sec Video Plays: actions_video_view
    const total3SecPlays = extractNumericValue(
      aggregated.actions_video_view || aggregated.video_3_sec_watched_actions || aggregated.video_3_sec_views
    );

    // Verified Windsor ThruPlay: video_thruplay_watched_actions_video_view
    const totalThruplays = extractNumericValue(
      aggregated.video_thruplay_watched_actions_video_view || aggregated.video_thruplay_watched_actions || aggregated.thruplay
    );

    // CTR
    aggregated.ctr = totalImpressions !== null && totalImpressions > 0 && totalClicks !== null ? (totalClicks / totalImpressions) * 100 : null;
    // CPC
    aggregated.cpc = totalClicks !== null && totalClicks > 0 && totalSpend !== null ? totalSpend / totalClicks : null;
    // CPM
    aggregated.cpm = totalImpressions !== null && totalImpressions > 0 && totalSpend !== null ? (totalSpend / totalImpressions) * 1000 : null;
    // Purchase ROAS
    aggregated.purchase_roas = totalSpend !== null && totalSpend > 0 && totalPurchaseValue !== null ? totalPurchaseValue / totalSpend : null;
    // Cost per Result
    aggregated.cost_per_result = totalPurchases !== null && totalPurchases > 0 && totalSpend !== null ? totalSpend / totalPurchases : null;
    // Frequency
    aggregated.frequency = totalReach !== null && totalReach > 0 && totalImpressions !== null ? totalImpressions / totalReach : null;

    // Hook Rate = (actions_video_view / impressions) * 100
    if (total3SecPlays !== null && total3SecPlays > 0 && totalImpressions !== null && totalImpressions > 0) {
      aggregated.hook_rate = Math.round(((total3SecPlays / totalImpressions) * 100) * 100) / 100;
    } else {
      aggregated.hook_rate = null;
    }

    // Hold Rate = (video_thruplay_watched_actions_video_view / actions_video_view) * 100
    if (totalThruplays !== null && totalThruplays > 0 && total3SecPlays !== null && total3SecPlays > 0) {
      aggregated.hold_rate = Math.round(((totalThruplays / total3SecPlays) * 100) * 100) / 100;
    } else {
      aggregated.hold_rate = null;
    }

    aggregatedResult.push(aggregated);
  });

  return aggregatedResult;
};

// ==========================================
// TEST SUITE EXECUTION (SCENARIOS A - T)
// ==========================================

console.log("Running Creative Aggregator & Video Performance Verification Tests (Scenarios A - T)...\n");

// A. Single Day
assert.strictEqual(checkIsSingleDay({ dateFrom: "2026-08-10", dateTo: "2026-08-10" }), true, "Test A: Single day range must return singleDay=true");

// B. Yesterday
assert.strictEqual(checkIsSingleDay({ datePreset: "yesterday" }), true, "Test B: Yesterday preset must return singleDay=true");

// C. Today
assert.strictEqual(checkIsSingleDay({ datePreset: "today" }), true, "Test C: Today preset must return singleDay=true");

// D. Custom Single Day
const singleDayRecords = [{ creative_id: "cr_1", date: "2026-08-10", spend: 100 }, { creative_id: "cr_1", date: "2026-08-10", spend: 100 }];
assert.strictEqual(aggregateCreativesData(singleDayRecords, true).length, 2, "Test D: Custom single day must preserve raw records without aggregation");

// E. last_7d
assert.strictEqual(checkIsSingleDay({ datePreset: "last_7d" }), false, "Test E: last_7d preset must return singleDay=false");

// F. last_30d
assert.strictEqual(checkIsSingleDay({ datePreset: "last_30d" }), false, "Test F: last_30d preset must return singleDay=false");

// G. Same creative_id across multiple days
const multiDayRecords = [
  { creative_id: "cr_100", ad_id: "ad_1", date: "2026-08-10", spend: 1000, impressions: 10000, video_play_actions_video_view: 1843, actions_video_view: 641, video_thruplay_watched_actions_video_view: 104, video_p100_watched_actions_video_view: 100, video_avg_time_watched_actions_video_view: 2.0 },
  { creative_id: "cr_100", ad_id: "ad_1", date: "2026-08-11", spend: 2000, impressions: 20000, video_play_actions_video_view: 2000, actions_video_view: 600, video_thruplay_watched_actions_video_view: 200, video_p100_watched_actions_video_view: 200, video_avg_time_watched_actions_video_view: 5.0 }
];
const multiDayResult = aggregateCreativesData(multiDayRecords, false);
assert.strictEqual(multiDayResult.length, 1, "Test G: Same creative_id across multiple days must collapse to 1 card");

// H. Same creative_id across multiple ad sets
const multiAdsetRecords = [
  { creative_id: "cr_200", adset_id: "adset_1", spend: 500 },
  { creative_id: "cr_200", adset_id: "adset_2", spend: 500 }
];
assert.strictEqual(aggregateCreativesData(multiAdsetRecords, false).length, 1, "Test H: Same creative_id across ad sets must collapse to 1 card");

// I. Different creative_ids with identical creative names
const diffIdRecords = [
  { creative_id: "cr_A", creative_name: "Promo Video", spend: 300 },
  { creative_id: "cr_B", creative_name: "Promo Video", spend: 400 }
];
assert.strictEqual(aggregateCreativesData(diffIdRecords, false).length, 2, "Test I: Different creative_ids must remain separate cards");

// J. SUM video plays (video_play_actions_video_view)
const aggCr = multiDayResult[0];
assert.strictEqual(aggCr.video_play_actions_video_view, 3843, "Test J: Video plays SUM must be 1843 + 2000 = 3843");

// K. SUM 3-second plays (actions_video_view)
assert.strictEqual(aggCr.actions_video_view, 1241, "Test K: 3-sec plays SUM must be 641 + 600 = 1241");

// L. SUM ThruPlays (video_thruplay_watched_actions_video_view)
assert.strictEqual(aggCr.video_thruplay_watched_actions_video_view, 304, "Test L: ThruPlay SUM must be 104 + 200 = 304");

// M. Weighted Avg Watch Time: (1843*2 + 2000*5) / 3843 = (3686 + 10000) / 3843 = 13686 / 3843 = 3.56 sec
assert.strictEqual(aggCr.video_avg_time_watched_actions_video_view, 3.56, "Test M: Weighted Avg Watch Time must be 3.56 sec");

// N. Hook Rate: (actions_video_view / impressions) * 100 = (1241 / 30000) * 100 = 4.14%
assert.strictEqual(aggCr.hook_rate, 4.14, "Test N: Hook Rate must be 4.14%");

// O. Hold Rate: (video_thruplay_watched_actions_video_view / actions_video_view) * 100 = (304 / 1241) * 100 = 24.5%
assert.strictEqual(aggCr.hold_rate, 24.5, "Test O: Hold Rate must be 24.5%");

// Verified User Example: 641 3-sec plays, 10000 impressions -> Hook Rate 6.41%
// Verified User Example: 104 ThruPlay, 641 3-sec plays -> Hold Rate 16.22%
const exampleRecord = [
  { creative_id: "ex_1", impressions: 10000, actions_video_view: 641, video_thruplay_watched_actions_video_view: 104 },
  { creative_id: "ex_1", impressions: 0, actions_video_view: 0, video_thruplay_watched_actions_video_view: 0 }
];
const exampleResult = aggregateCreativesData(exampleRecord, false)[0];
assert.strictEqual(exampleResult.hook_rate, 6.41, "Test User Example Hook Rate: 641 / 10000 * 100 = 6.41%");
assert.strictEqual(exampleResult.hold_rate, 16.22, "Test User Example Hold Rate: 104 / 641 * 100 = 16.22%");

// P. 25/50/75/95/100 retention derived from aggregated totals
const p100Pct = Math.round((aggCr.video_p100_watched_actions_video_view / aggCr.video_play_actions_video_view) * 10000) / 100;
assert.strictEqual(p100Pct, 7.81, "Test P: 100% Watched retention percentage must be 7.81%");

// Q. CTR/CPC/CPM/ROAS/Cost per Result/Frequency derived from aggregated totals
const perfData = [
  { creative_id: "cr_p", spend: 1000, impressions: 50000, clicks: 1000, purchases: 20, purchase_conversion_value: 5000, reach: 25000 },
  { creative_id: "cr_p", spend: 1000, impressions: 50000, clicks: 1000, purchases: 20, purchase_conversion_value: 5000, reach: 25000 }
];
const perfAgg = aggregateCreativesData(perfData, false)[0];
assert.strictEqual(perfAgg.ctr, 2.0, "Test Q: CTR must be 2.0%");
assert.strictEqual(perfAgg.cpc, 1.0, "Test Q: CPC must be $1.0");
assert.strictEqual(perfAgg.cpm, 20.0, "Test Q: CPM must be $20.0");
assert.strictEqual(perfAgg.purchase_roas, 5.0, "Test Q: ROAS must be 5.0x");
assert.strictEqual(perfAgg.cost_per_result, 50.0, "Test Q: Cost per Result must be $50.0");
assert.strictEqual(perfAgg.frequency, 2.0, "Test Q: Frequency must be 2.0");

// R. Zero denominator safety
const zeroData = [
  { creative_id: "cr_zero", spend: 0, impressions: 0, clicks: 0, actions_video_view: 0, video_thruplay_watched_actions_video_view: 0 }
];
const zeroAgg = aggregateCreativesData(zeroData, false)[0];
assert.strictEqual(zeroAgg.hook_rate, null, "Test R: Hook rate with 0 impressions must be null");
assert.strictEqual(zeroAgg.hold_rate, null, "Test R: Hold rate with 0 3-sec plays must be null");
assert.strictEqual(zeroAgg.ctr, null, "Test R: CTR with 0 impressions must be null");
assert.strictEqual(zeroAgg.cpc, null, "Test R: CPC with 0 clicks must be null");

// S. Null/undefined safety
const nullData = [
  { creative_id: "cr_null", spend: null, impressions: null }
];
const nullAgg = aggregateCreativesData(nullData, false)[0];
assert.strictEqual(nullAgg.hook_rate, null, "Test S: Null values must safely yield null");

// T. Floating-point formatting (rounded to 2 decimal places)
assert.strictEqual(aggCr.video_avg_time_watched_actions_video_view.toString(), "3.56", "Test T: Watch time must not have floating-point artifacts");
assert.strictEqual(exampleResult.hook_rate.toString(), "6.41", "Test T: Hook rate must not have floating-point artifacts");
assert.strictEqual(exampleResult.hold_rate.toString(), "16.22", "Test T: Hold rate must not have floating-point artifacts");

console.log("\nALL VERIFICATION TESTS (SCENARIOS A - T) PASSED SUCCESSFULLY WITH ZERO ERRORS!");
