/**
 * Meta Ad Creatives Aggregation Utility.
 * Aggregates daily creative performance records based on date range selection:
 * 
 * - SINGLE-DAY DATE RANGE (startDate === endDate, "today", "yesterday"):
 *   Returns records exactly as received (no aggregation, no averaging).
 * 
 * - MULTI-DAY DATE RANGE ("last_7d", "last_30d", "this_month", custom multi-day range):
 *   Groups records belonging to the same creative/ad ID into ONE card.
 *   - Amount Spent / Spend: SUM
 *   - All other performance metrics: AVERAGE across available daily records (ignoring null/missing values)
 *   - Non-numeric metadata: Preserved from primary record
 *   - Date: Formatted as "YYYY-MM-DD – YYYY-MM-DD"
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
    // Custom range: single day if dateFrom === dateTo
    if (dateParams.dateFrom && dateParams.dateTo) {
      return dateParams.dateFrom === dateParams.dateTo;
    }

    // Presets
    if (dateParams.datePreset) {
      if (dateParams.datePreset === "today" || dateParams.datePreset === "yesterday") {
        return true;
      }
      return false; // "last_7d", "last_30d", "this_month", etc. are multi-day
    }
  }

  // Fallback check on dataset dates if dateParams is unpopulated
  if (Array.isArray(records) && records.length > 0) {
    const uniqueDates = new Set(records.map((r) => r.date).filter(Boolean));
    return uniqueDates.size <= 1;
  }

  return false;
};

/**
 * Aggregates creative records by unique creative/ad ID for multi-day date ranges.
 * 
 * @param {Array} records - Array of raw creative performance records
 * @param {boolean} isSingleDay - Whether the date range is a single calendar day
 * @returns {Array} Array of aggregated creative objects (1 per unique creative/ad)
 */
export const aggregateCreativesData = (records, isSingleDay) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  // 1. Single-day range: return records directly without aggregation or averaging
  if (isSingleDay) {
    return records;
  }

  // 2. Multi-day range: group records by unique creative/ad ID using O(N) Map
  const grouped = new Map();

  for (const record of records) {
    if (!record) continue;

    // Unique identity key: ad_id -> creative_id -> id -> ad_name -> creative_name -> name
    const key = String(
      record.ad_id ||
      record.creative_id ||
      record.id ||
      record.ad_name ||
      record.creative_name ||
      record.name ||
      "creative"
    ).trim();

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(record);
  }

  // 3. Aggregate each group into a single creative card object
  const aggregatedResult = [];

  // Keys that naturally sum (monetary spend totals)
  const sumKeys = new Set(["spend", "amount_spent"]);

  // Metadata / Identity / URL keys to preserve without numeric averaging
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

  grouped.forEach((groupRecords) => {
    if (groupRecords.length === 0) return;

    // Single record in multi-day group: no aggregation needed
    if (groupRecords.length === 1) {
      aggregatedResult.push(groupRecords[0]);
      return;
    }

    // Base object built from primary record
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

    allKeys.forEach((keyName) => {
      if (metadataKeys.has(keyName)) return;

      const isSumMetric = sumKeys.has(keyName);

      // Extract valid numeric values across available daily records
      const validValues = groupRecords
        .map((r) => extractNumericValue(r[keyName]))
        .filter((val) => val !== null && !isNaN(val));

      if (validValues.length > 0) {
        if (isSumMetric) {
          // SUM for monetary spend
          aggregated[keyName] = validValues.reduce((a, b) => a + b, 0);
        } else {
          // AVERAGE for all other performance metrics (ignoring missing/null records in denominator)
          const sum = validValues.reduce((a, b) => a + b, 0);
          aggregated[keyName] = sum / validValues.length;
        }
      } else {
        // If no record had valid numeric data for this field, preserve null/original
        if (!(keyName in primaryRecord)) {
          aggregated[keyName] = null;
        }
      }
    });

    aggregatedResult.push(aggregated);
  });

  return aggregatedResult;
};
