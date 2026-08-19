/**
 * Meta Ad Sets Aggregation Utility for Frontend.
 * Groups ad set performance records by adset_id, sums additive count and currency metrics,
 * recalculates derived metrics (CTR, CPC, CPM, ROAS, Cost per Result, Frequency),
 * and produces 1 unique record per adset_id.
 */

export const extractNumericValue = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (Array.isArray(val) && val.length > 0 && val[0] && val[0].value !== undefined) {
    const parsed = parseFloat(val[0].value);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof val === "object" && val.value !== undefined) {
    const parsed = parseFloat(val.value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Aggregates raw or daily ad set records by adset_id.
 *
 * @param {Array} records - Ad set records from API
 * @returns {Array} Array of aggregated unique ad set objects (1 per adset_id)
 */
export const aggregateAdSetsData = (records) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const groupMap = new Map();

  for (const row of records) {
    if (!row || typeof row !== "object") continue;
    const adsetId = String(row.adset_id || row.id || row.ad_set_id || "").trim();
    if (!adsetId) continue;

    if (!groupMap.has(adsetId)) {
      groupMap.set(adsetId, []);
    }
    groupMap.get(adsetId).push(row);
  }

  const helperSum = (rows, extractor) => {
    let hasVal = false;
    let total = 0;
    for (const r of rows) {
      const v = extractor(r);
      if (v !== null && v !== undefined && !isNaN(Number(v))) {
        hasVal = true;
        total += Number(v);
      }
    }
    return hasVal ? total : null;
  };

  const aggregatedList = [];

  for (const [adsetId, rows] of groupMap.entries()) {
    const firstRow = rows[0];
    const adsetName =
      rows.find((r) => r.adset_name || r.name)?.adset_name ||
      rows.find((r) => r.adset_name || r.name)?.name ||
      "Unnamed Ad Set";

    const campaignId =
      rows.find((r) => r.campaign_id || r.campaignId)?.campaign_id ||
      rows.find((r) => r.campaign_id || r.campaignId)?.campaignId ||
      "";

    const campaignName =
      rows.find((r) => r.campaign || r.campaign_name)?.campaign ||
      rows.find((r) => r.campaign || r.campaign_name)?.campaign_name ||
      "";

    // Resolve Status: prioritize "ACTIVE" if present in any row
    let status = "ACTIVE";
    const statuses = rows
      .map((r) => (r.effective_status || r.adset_status || r.status || "").toString().toUpperCase())
      .filter(Boolean);

    if (statuses.includes("ACTIVE")) {
      status = "ACTIVE";
    } else if (statuses.length > 0) {
      status = statuses[0];
    }

    const currency = rows.find((r) => r.currency)?.currency || "INR";

    // Sum additive count and monetary metrics
    const spend = helperSum(rows, (r) => extractNumericValue(r.spend));
    const impressions = helperSum(rows, (r) => extractNumericValue(r.impressions));
    const clicks = helperSum(rows, (r) => extractNumericValue(r.clicks));
    const link_clicks = helperSum(rows, (r) => extractNumericValue(r.link_clicks));
    const purchases = helperSum(rows, (r) => extractNumericValue(r.purchases ?? r.actions_omni_purchase));
    const purchase_conversion_value = helperSum(
      rows,
      (r) => extractNumericValue(r.purchase_conversion_value ?? r.action_values_omni_purchase)
    );
    const actions_add_to_cart = helperSum(
      rows,
      (r) => extractNumericValue(r.actions_add_to_cart ?? r.add_to_cart)
    );
    const actions_initiate_checkout = helperSum(
      rows,
      (r) => extractNumericValue(r.actions_initiate_checkout ?? r.initiate_checkout)
    );

    // Reach: MAX fallback (non-additive across breakdown rows)
    const reachVals = rows.map((r) => extractNumericValue(r.reach)).filter((v) => v !== null);
    const reach = reachVals.length > 0 ? Math.max(...reachVals) : null;

    // Recalculate derived metrics
    const ctr =
      impressions !== null && impressions > 0 && clicks !== null ? (clicks / impressions) * 100 : null;
    const cpc = clicks !== null && clicks > 0 && spend !== null ? spend / clicks : null;
    const cpm = impressions !== null && impressions > 0 && spend !== null ? (spend / impressions) * 1000 : null;
    const purchase_roas =
      spend !== null && spend > 0 && purchase_conversion_value !== null
        ? purchase_conversion_value / spend
        : null;
    const cost_per_result =
      purchases !== null && purchases > 0 && spend !== null ? spend / purchases : null;

    const frequency = reach !== null && reach > 0 && impressions !== null ? impressions / reach : null;

    const unique_outbound_clicks_ctr_outbound_click =
      rows
        .map((r) => extractNumericValue(r.unique_outbound_clicks_ctr_outbound_click ?? r.unique_outbound_clicks_ctr))
        .find((v) => v !== null) ?? null;

    aggregatedList.push({
      ...firstRow,
      id: adsetId,
      adset_id: adsetId,
      name: adsetName,
      adset_name: adsetName,
      campaign_id: campaignId,
      campaign: campaignName,
      campaign_name: campaignName,
      status,
      effective_status: status,
      adset_status: status,
      spend,
      impressions,
      reach,
      clicks,
      link_clicks,
      ctr,
      cpc,
      cpm,
      frequency,
      actions_add_to_cart,
      actions_initiate_checkout,
      unique_outbound_clicks_ctr_outbound_click,
      purchases,
      purchase_conversion_value,
      cost_per_result,
      purchase_roas,
      roas: purchase_roas,
      currency,
    });
  }

  return aggregatedList;
};
