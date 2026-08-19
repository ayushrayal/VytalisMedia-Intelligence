/**
 * Meta Ad Creatives Aggregation Utility.
 * Aggregates daily creative performance records based on date range selection:
 * 
 * - SINGLE-DAY DATE RANGE (startDate === endDate, "today", "yesterday"):
 *   Returns records exactly as received (no aggregation, no averaging).
 * 
 * - MULTI-DAY DATE RANGE ("last_7d", "last_30d", "this_month", custom multi-day range):
 *   Groups records belonging to the same creative using Creative ID -> video_id -> ad_id hierarchy.
 *   - Cumulative Count / Monetary metrics: SUM
 *   - Average Watch Time: WEIGHTED AVERAGE based on Video Plays
 *   - Derived Rates (Hook Rate, Hold Rate, CTR, CPC, CPM, ROAS, Cost per Result): Calculated from aggregated totals
 *   - Non-numeric metadata: Preserved from primary record
 *   - Date: Formatted as "minDate – maxDate"
 */

/**
 * Safely extracts a numeric value from a record property,
 * supporting numbers, numeric strings, or Meta API action arrays/objects.
 *
 * @param {any} val - Value from API record
 * @returns {number|null} Parsed numeric value or null if invalid/missing
 */
export const extractNumericValue = (val) => {
  if (val === null || val === undefined || val === "") return null;
  
  if (typeof val === "number") {
    return isNaN(val) ? null : val;
  }

  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }

  // Meta API action array structure: [{ action_type: "...", value: "1045" }]
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const first = val[0];
    if (first && first.value !== undefined) {
      const parsed = parseFloat(first.value);
      return isNaN(parsed) ? null : parsed;
    }
  }

  // Meta API single action object structure: { action_type: "...", value: "1045" }
  if (typeof val === "object" && val.value !== undefined) {
    const parsed = parseFloat(val.value);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
};

/**
 * Determines whether a date range selection represents a single calendar day.
 *
 * @param {Object} dateParams - Date filter parameters { datePreset } OR { dateFrom, dateTo }
 * @param {Array} [records] - Optional raw records array for fallback verification
 * @returns {boolean} True if date range is exactly one calendar day
 */
export const checkIsSingleDay = (dateParams, records) => {
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

/**
 * Extracts unique identity grouping key based on strict fallback hierarchy:
 * 1. creativeId (creative_id / creativeId)
 * 2. videoId (video_id / videoId)
 * 3. adId (ad_id / adId / id)
 */
export const getCreativeGroupKey = (record) => {
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

/**
 * Aggregates creative records by unique creative identity for multi-day date ranges.
 * 
 * @param {Array} records - Array of raw creative performance records
 * @param {boolean} isSingleDay - Whether the date range is a single calendar day
 * @returns {Array} Array of aggregated creative objects (1 per unique creative)
 */
export const aggregateCreativesData = (records, isSingleDay) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  // 1. Single-day range: return raw records directly without aggregation
  if (isSingleDay) {
    return records;
  }

  // 2. Multi-day range: group records by unique creative identity using O(N) Map
  const grouped = new Map();

  for (const record of records) {
    if (!record) continue;
    const key = getCreativeGroupKey(record);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(record);
  }

  const aggregatedResult = [];

  // Metrics that must be SUMMED across days (including verified Windsor field names)
  const sumKeys = new Set([
    "spend",
    "amount_spent",
    "purchases",
    "actions_omni_purchase",
    "purchase_conversion_value",
    "action_values_omni_purchase",
    "reach",
    "impressions",
    "clicks",
    "link_clicks",
    "link_click_actions",
    "inline_link_clicks",
    "actions_add_to_cart",
    "add_to_cart",
    "actions_initiate_checkout",
    "initiate_checkout",
    "video_play_actions_video_view",
    "video_play_actions",
    "video_views",
    "video_plays",
    "actions_video_view",
    "video_3_sec_watched_actions",
    "video_3_sec_views",
    "video_3_sec_watched",
    "video_thruplay_watched_actions_video_view",
    "video_thruplay_watched_actions",
    "video_thruplay_watched",
    "thruplay",
    "video_p25_watched_actions_video_view",
    "video_p25_watched_actions",
    "video_p25_watched",
    "p25",
    "video_p50_watched_actions_video_view",
    "video_p50_watched_actions",
    "video_p50_watched",
    "p50",
    "video_p75_watched_actions_video_view",
    "video_p75_watched_actions",
    "video_p75_watched",
    "p75",
    "video_p95_watched_actions_video_view",
    "video_p95_watched_actions",
    "video_p95_watched",
    "p95",
    "video_p100_watched_actions_video_view",
    "video_p100_watched_actions",
    "video_p100_watched",
    "p100",
  ]);

  // Keys that are metadata/identity and should be preserved from primary record
  const metadataKeys = new Set([
    "ad_id",
    "creative_id",
    "id",
    "ad_name",
    "creative_name",
    "name",
    "campaign",
    "campaign_name",
    "campaign_id",
    "adset_name",
    "adset_id",
    "status",
    "effective_status",
    "ad_effective_status",
    "ad_status",
    "adset_status",
    "campaign_status",
    "currency",
    "thumbnail_url",
    "image_url",
    "media_type",
    "creative_type",
    "type",
    "video_id",
    "video_url",
    "object_story_spec",
    "facebook_permalink_url",
    "instagram_permalink_url",
    "date",
  ]);

  // Special rate keys that will be recalculated from aggregated totals
  const derivedRateKeys = new Set([
    "ctr",
    "cpc",
    "cpm",
    "purchase_roas",
    "cost_per_result",
    "frequency",
    "hook_rate",
    "hold_rate",
    "unique_outbound_clicks_ctr_outbound_click",
    "unique_outbound_clicks_ctr",
  ]);

  // Watch time keys (handled via weighted average)
  const watchTimeKeys = new Set([
    "video_avg_time_watched_actions_video_view",
    "video_avg_time_watched_actions",
    "video_avg_time_watched",
    "avg_watch_time",
  ]);

  grouped.forEach((groupRecords) => {
    if (groupRecords.length === 0) return;

    const primaryRecord = groupRecords[0];
    const aggregated = { ...primaryRecord };

    // Format date range (minDate – maxDate)
    const dates = groupRecords
      .map((r) => r.date)
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      aggregated.date = minDate === maxDate ? minDate : `${minDate} – ${maxDate}`;
    }

    // Collect all property keys present across all records in this group
    const allKeys = new Set();
    groupRecords.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));

    // 1. Sum additive count metrics
    allKeys.forEach((keyName) => {
      if (metadataKeys.has(keyName) || derivedRateKeys.has(keyName) || watchTimeKeys.has(keyName)) {
        return;
      }

      if (sumKeys.has(keyName)) {
        const validValues = groupRecords
          .map((r) => extractNumericValue(r[keyName]))
          .filter((val) => val !== null && !isNaN(val));

        if (validValues.length > 0) {
          aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
        } else if (!(keyName in primaryRecord)) {
          aggregated[keyName] = null;
        }
      }
    });

    // Explicitly SUM all standard sum metric keys if present in any record
    sumKeys.forEach((keyName) => {
      const validValues = groupRecords
        .map((r) => extractNumericValue(r[keyName]))
        .filter((val) => val !== null && !isNaN(val));

      if (validValues.length > 0) {
        aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
      }
    });

    // 2. Calculate Weighted Average Watch Time: SUM(avgWatchTime * videoPlays) / SUM(videoPlays)
    let weightedWatchTimeSum = 0;
    let watchTimePlaysSum = 0;
    let hasValidWatchRecord = false;

    for (const r of groupRecords) {
      const plays = extractNumericValue(
        r.video_play_actions_video_view || r.video_play_actions || r.video_views || r.video_plays
      );
      const watchTime = extractNumericValue(
        r.video_avg_time_watched_actions_video_view ||
        r.video_avg_time_watched_actions ||
        r.video_avg_time_watched ||
        r.avg_watch_time
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

    // 3. Recalculate derived rates from aggregated totals
    const totalSpend = extractNumericValue(aggregated.spend ?? aggregated.amount_spent);
    const totalImpressions = extractNumericValue(aggregated.impressions);
    const totalClicks = extractNumericValue(aggregated.clicks);
    const totalPurchases = extractNumericValue(aggregated.purchases ?? aggregated.actions_omni_purchase);
    const totalPurchaseValue = extractNumericValue(aggregated.purchase_conversion_value ?? aggregated.action_values_omni_purchase);
    const totalReach = extractNumericValue(aggregated.reach);

    // Verified Windsor 3-sec plays (actions_video_view)
    const total3SecPlays = extractNumericValue(
      aggregated.actions_video_view ?? aggregated.video_3_sec_watched_actions ?? aggregated.video_3_sec_views
    );

    // Verified Windsor ThruPlay (video_thruplay_watched_actions_video_view)
    const totalThruplay = extractNumericValue(
      aggregated.video_thruplay_watched_actions_video_view ?? aggregated.video_thruplay_watched_actions ?? aggregated.thruplay
    );

    // CTR
    aggregated.ctr =
      totalImpressions !== null && totalImpressions > 0 && totalClicks !== null
        ? (totalClicks / totalImpressions) * 100
        : null;

    // CPC
    aggregated.cpc =
      totalClicks !== null && totalClicks > 0 && totalSpend !== null
        ? totalSpend / totalClicks
        : null;

    // CPM
    aggregated.cpm =
      totalImpressions !== null && totalImpressions > 0 && totalSpend !== null
        ? (totalSpend / totalImpressions) * 1000
        : null;

    // Purchase ROAS (evidence-based: 0 only when totalSpend > 0 and (totalPurchaseValue === 0 || totalPurchases === 0))
    if (totalSpend !== null && totalSpend > 0) {
      if (totalPurchaseValue !== null && totalPurchaseValue > 0) {
        aggregated.purchase_roas = totalPurchaseValue / totalSpend;
      } else if (totalPurchaseValue === 0 || totalPurchases === 0) {
        aggregated.purchase_roas = 0;
      } else {
        aggregated.purchase_roas = null;
      }
    } else {
      aggregated.purchase_roas = null;
    }

    // Cost per Result
    aggregated.cost_per_result =
      totalPurchases !== null && totalPurchases > 0 && totalSpend !== null
        ? totalSpend / totalPurchases
        : null;

    // Frequency
    aggregated.frequency =
      totalReach !== null && totalReach > 0 && totalImpressions !== null
        ? totalImpressions / totalReach
        : null;

    // Hook Rate = (3-Second Video Plays / Impressions) * 100
    if (total3SecPlays !== null && total3SecPlays > 0 && totalImpressions !== null && totalImpressions > 0) {
      aggregated.hook_rate = Math.round(((total3SecPlays / totalImpressions) * 100) * 100) / 100;
    } else {
      aggregated.hook_rate = null;
    }

    // Hold Rate = (ThruPlay / 3-Second Video Plays) * 100
    if (totalThruplay !== null && totalThruplay > 0 && total3SecPlays !== null && total3SecPlays > 0) {
      aggregated.hold_rate = Math.round(((totalThruplay / total3SecPlays) * 100) * 100) / 100;
    } else {
      aggregated.hold_rate = null;
    }

    aggregatedResult.push(aggregated);
  });

  return aggregatedResult;
};
