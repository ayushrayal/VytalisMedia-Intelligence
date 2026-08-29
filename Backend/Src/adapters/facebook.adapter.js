/**
 * Facebook Adapter for Vytalis Intelligence.
 * Translates domain Meta analytics requests into Windsor Facebook connector queries.
 * 
 * SOLE OWNER of provider-specific Windsor field arrays and Facebook filter structures.
 */

const windsorProvider = require("../providers/windsor.provider");
const WINDSOR_CONSTANTS = require("../config/meta-constants.config");

/**
 * Builds standard equality filter array for activeMetaAccount.
 * Format: [["account_id", "eq", activeMetaAccount]]
 */
const buildAccountFilter = (activeMetaAccount) => {
  return [["account_id", "eq", activeMetaAccount]];
};

/**
 * Safely extracts a numeric value or returns null/fallback.
 */
const getNumericOrNull = (val) => {
  if (val === null || val === undefined) return null;
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

/**
 * Normalizes provider metric fields for a single record.
 * Preserves all row properties while mapping raw provider fields to clean domain properties.
 */
const normalizeRowMetrics = (row) => {
  if (!row || typeof row !== "object") return row;
  const normalized = { ...row };

  const rawPurchases = row.actions_omni_purchase ?? row.actions_purchase ?? row.purchases;
  const rawValue = row.action_values_omni_purchase ?? row.action_values_purchase ?? row.purchase_conversion_value;
  const rawCost = row.cost_per_action_type_omni_purchase ?? row.cost_per_result;
  const rawRoas = row.purchase_roas_omni_purchase ?? row.purchase_roas;

  const rawAddToCart = row.actions_add_to_cart ?? row.add_to_cart;
  const rawInitiateCheckout = row.actions_initiate_checkout ?? row.initiate_checkout;
  const rawUniqueOutboundCtr = row.unique_outbound_clicks_ctr_outbound_click ?? row.unique_outbound_clicks_ctr;

  normalized.purchases = getNumericOrNull(rawPurchases);
  normalized.purchase_conversion_value = getNumericOrNull(rawValue);
  normalized.cost_per_result = getNumericOrNull(rawCost);
  normalized.purchase_roas = getNumericOrNull(rawRoas);

  normalized.actions_add_to_cart = getNumericOrNull(rawAddToCart);
  normalized.actions_initiate_checkout = getNumericOrNull(rawInitiateCheckout);
  normalized.unique_outbound_clicks_ctr_outbound_click = getNumericOrNull(rawUniqueOutboundCtr);
  normalized.cpm = getNumericOrNull(row.cpm);

  normalized.adset_id = row.adset_id ? String(row.adset_id) : row.adsetId ? String(row.adsetId) : null;
  normalized.adset_name = row.adset_name || row.adsetName || row.adset || null;
  normalized.campaign_id = row.campaign_id ? String(row.campaign_id) : row.campaignId ? String(row.campaignId) : null;
  normalized.campaign_name = row.campaign_name || row.campaign || null;
  normalized.creative_id = row.creative_id ? String(row.creative_id) : row.creativeId ? String(row.creativeId) : row.ad_id ? String(row.ad_id) : row.adId ? String(row.adId) : row.id ? String(row.id) : null;
  normalized.creative_name = row.creative_name || row.ad_name || row.name || null;

  return normalized;
};

/**
 * Normalizes raw Windsor overview response data array.
 */
const normalizeOverviewData = (rawData) => {
  if (!Array.isArray(rawData)) return [];
  return rawData.map(normalizeRowMetrics);
};

/**
 * Fetches Facebook Account Overview metrics from Windsor.
 */
const fetchOverview = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "date",
    "currency",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ];

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });

  return normalizeOverviewData(rawData);
};

/**
 * Fetches Facebook Campaigns metrics from Windsor.
 */
const fetchCampaigns = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
  const fields = [
    "campaign",
    "campaign_id",
    "campaign_status",
    "campaign_effective_status",
    "campaign_objective",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ];

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return normalizeOverviewData(rawData);
};

/**
 * Fetches Facebook Ad Sets metrics from Windsor.
 */
const fetchAdsets = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
  const fields = [
    "adset_name",
    "adset_id",
    "campaign",
    "campaign_id",
    "effective_status",
    "adset_status",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ];

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  const normalizedRows = (rawData || []).map(normalizeRowMetrics);
  return normalizeAndAggregateAdSets(normalizedRows, campaignId);
};

/**
 * Fetches Facebook Ad Creatives metrics from Windsor.
 */
const fetchCreatives = async ({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }) => {
  const fields = [
    "date",
    "currency",
    "campaign",
    "campaign_id",
    "adset_name",
    "adset_id",
    "ad_name",
    "ad_id",
    "effective_status",
    "thumbnail_url",
    "image_url",
    "video_id",
    "object_story_spec",
    "facebook_permalink_url",
    "instagram_permalink_url",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions_video_view",
    "video_play_actions_video_view",
    "video_thruplay_watched_actions_video_view",
    "video_p25_watched_actions_video_view",
    "video_p50_watched_actions_video_view",
    "video_p75_watched_actions_video_view",
    "video_p95_watched_actions_video_view",
    "video_p100_watched_actions_video_view",
    "video_avg_time_watched_actions_video_view",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ];

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return (rawData || []).map(normalizeRowMetrics);
};

/**
 * Fetches Facebook Audience demographics metrics from Windsor.
 */
const fetchAudience = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "age",
    "gender",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "actions_purchase",
    "action_values_purchase",
  ];

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });

  return (rawData || []).map(normalizeRowMetrics);
};

/**
 * Fetches Facebook Places geographic metrics from Windsor.
 */
const fetchPlaces = async ({ activeMetaAccount, datePreset, dateFrom, dateTo }) => {
  const fields = [
    "country",
    "region",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ];

  return await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters: buildAccountFilter(activeMetaAccount),
  });
};

/**
 * Normalizes and aggregates raw Windsor ad set records for a specific campaign.
 * Groups records by canonical key `${campaign_id}_${adset_id}`, sums additive count/value metrics,
 * recalculates derived metrics (CTR, CPC, CPM, ROAS, Cost Per Result, Frequency),
 * handles reach as non-additive (using MAX non-null reach as a fallback estimate),
 * and resolves effective status consistently.
 *
 * @param {Array<Object>} rawAdSets - Array of raw ad set rows from Windsor
 * @param {string} targetCampaignId - Canonical ID of the campaign
 * @param {string} [defaultCurrency="INR"] - Fallback currency if not specified on row
 * @returns {Array<Object>} Array of normalized unique Ad Set objects
 */
const normalizeAndAggregateAdSets = (rawAdSets, targetCampaignId, defaultCurrency = "INR") => {
  if (!Array.isArray(rawAdSets) || rawAdSets.length === 0) return [];

  // Group records by canonical key `${campaign_id}_${adset_id}`
  const groupedMap = new Map();

  for (const row of rawAdSets) {
    if (!row || typeof row !== "object") continue;
    const adsetId = String(row.adset_id || row.id || "").trim();
    if (!adsetId) continue;

    const cId = String(row.campaign_id || targetCampaignId || "").trim();
    const groupKey = `${cId}_${adsetId}`;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, []);
    }
    groupedMap.get(groupKey).push(row);
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

  const aggregatedAdSets = [];

  for (const [groupKey, rows] of groupedMap.entries()) {
    const firstRow = rows[0];
    const adsetId = String(firstRow.adset_id || firstRow.id || "");
    const adsetName =
      rows.find((r) => r.adset_name || r.name)?.adset_name ||
      rows.find((r) => r.adset_name || r.name)?.name ||
      "Unnamed Ad Set";

    // Resolve Status: prioritize "ACTIVE" if present in any row, else first non-empty status, or fallback to "ACTIVE"
    let status = "ACTIVE";
    const statuses = rows
      .map((r) => (r.adset_status || r.effective_status || r.status || "").toString().toUpperCase())
      .filter(Boolean);
    if (statuses.includes("ACTIVE")) {
      status = "ACTIVE";
    } else if (statuses.length > 0) {
      status = statuses[0];
    }

    const currency = rows.find((r) => r.currency)?.currency || defaultCurrency || "INR";

    // 1. Single-pass accumulator for additive count and currency metrics
    let hasSpend = false, spendSum = 0;
    let hasImpressions = false, impressionsSum = 0;
    let hasClicks = false, clicksSum = 0;
    let hasLinkClicks = false, linkClicksSum = 0;
    let hasPurchases = false, purchasesSum = 0;
    let hasPurchaseValue = false, purchaseValueSum = 0;
    let hasAddToCart = false, addToCartSum = 0;
    let hasInitiateCheckout = false, initiateCheckoutSum = 0;

    let unique_outbound_clicks_ctr_outbound_click = null;
    const reachVals = [];

    for (const r of rows) {
      const vSpend = getNumericOrNull(r.spend);
      if (vSpend !== null) { hasSpend = true; spendSum += vSpend; }

      const vImp = getNumericOrNull(r.impressions);
      if (vImp !== null) { hasImpressions = true; impressionsSum += vImp; }

      const vClk = getNumericOrNull(r.clicks);
      if (vClk !== null) { hasClicks = true; clicksSum += vClk; }

      const vLnk = getNumericOrNull(r.link_clicks);
      if (vLnk !== null) { hasLinkClicks = true; linkClicksSum += vLnk; }

      const vPur = getNumericOrNull(r.purchases ?? r.actions_omni_purchase);
      if (vPur !== null) { hasPurchases = true; purchasesSum += vPur; }

      const vVal = getNumericOrNull(r.purchase_conversion_value ?? r.action_values_omni_purchase);
      if (vVal !== null) { hasPurchaseValue = true; purchaseValueSum += vVal; }

      const vCart = getNumericOrNull(r.actions_add_to_cart ?? r.add_to_cart);
      if (vCart !== null) { hasAddToCart = true; addToCartSum += vCart; }

      const vChk = getNumericOrNull(r.actions_initiate_checkout ?? r.initiate_checkout);
      if (vChk !== null) { hasInitiateCheckout = true; initiateCheckoutSum += vChk; }

      if (unique_outbound_clicks_ctr_outbound_click === null) {
        const uCtr = getNumericOrNull(r.unique_outbound_clicks_ctr_outbound_click ?? r.unique_outbound_clicks_ctr);
        if (uCtr !== null) unique_outbound_clicks_ctr_outbound_click = uCtr;
      }

      const rReach = getNumericOrNull(r.reach);
      if (rReach !== null) reachVals.push(rReach);
    }

    const spend = hasSpend ? spendSum : null;
    const impressions = hasImpressions ? impressionsSum : null;
    const clicks = hasClicks ? clicksSum : null;
    const link_clicks = hasLinkClicks ? linkClicksSum : null;
    const purchases = hasPurchases ? purchasesSum : null;
    const purchase_conversion_value = hasPurchaseValue ? purchaseValueSum : null;
    const actions_add_to_cart = hasAddToCart ? addToCartSum : null;
    const actions_initiate_checkout = hasInitiateCheckout ? initiateCheckoutSum : null;

    // Reach is non-additive across breakdown/date records.
    // MAX(reach) is used as a fallback estimate without claiming to be an exact aggregate across disjoint breakdown segments.
    const reach = reachVals.length > 0 ? Math.max(...reachVals) : null;

    // 2. Recalculate derived metrics
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

    // Frequency: Do not sum. If reach and impressions available, frequency = impressions / reach
    const frequency = reach !== null && reach > 0 && impressions !== null ? impressions / reach : null;

    const campaignId = rows.find((r) => r.campaign_id || r.campaignId)?.campaign_id || targetCampaignId || "";
    const campaignName = rows.find((r) => r.campaign || r.campaign_name)?.campaign || rows.find((r) => r.campaign || r.campaign_name)?.campaign_name || "";

    aggregatedAdSets.push({
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

  return aggregatedAdSets;
};

/**
 * Fetches comprehensive details for a single campaign belonging to activeMetaAccount.
 */
const fetchCampaignDetails = async ({ activeMetaAccount, campaignId, datePreset, dateFrom, dateTo }) => {
  // Parallel Windsor fetch for campaign, ad sets, and creatives
  let [campaignsList, adsetsList, creativesList] = await Promise.all([
    fetchCampaigns({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
    fetchAdsets({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
    fetchCreatives({ activeMetaAccount, datePreset, dateFrom, dateTo, campaignId }),
  ]);

  let targetCampaign = (campaignsList || []).find(
    (c) => String(c.campaign_id || c.id) === String(campaignId) || String(c.campaign) === String(campaignId)
  );

  if (!targetCampaign) {
    const allCampaigns = await fetchCampaigns({ activeMetaAccount, datePreset, dateFrom, dateTo });
    targetCampaign = (allCampaigns || []).find(
      (c) => String(c.campaign_id || c.id) === String(campaignId) || String(c.campaign) === String(campaignId)
    );
  }

  if (!targetCampaign) {
    const error = new Error(`Campaign '${campaignId}' not found for the active Meta account`);
    error.statusCode = 404;
    throw error;
  }

  const actualCampaignId = String(targetCampaign.campaign_id || targetCampaign.id || campaignId);
  const campaignName = targetCampaign.campaign || targetCampaign.campaign_name;

  if (!adsetsList || adsetsList.length === 0) {
    adsetsList = await fetchAdsets({ activeMetaAccount, datePreset, dateFrom, dateTo });
  }
  if (!creativesList || creativesList.length === 0) {
    creativesList = await fetchCreatives({ activeMetaAccount, datePreset, dateFrom, dateTo });
  }

  const filteredAdSets = (adsetsList || []).filter(
    (a) => String(a.campaign_id) === actualCampaignId || (campaignName && String(a.campaign) === String(campaignName))
  );
  const filteredCreatives = (creativesList || []).filter(
    (cr) => String(cr.campaign_id) === actualCampaignId || (campaignName && String(cr.campaign) === String(campaignName))
  );

  const adSets = normalizeAndAggregateAdSets(filteredAdSets, actualCampaignId, targetCampaign.currency || "INR");

  const creatives = filteredCreatives.map((cr) => ({
    id: String(cr.ad_id || cr.creative_id || cr.id || ""),
    ad_name: cr.ad_name || cr.creative_name || "Unnamed Creative",
    ad_id: String(cr.ad_id || cr.creative_id || cr.id || ""),
    adset_id: cr.adset_id ? String(cr.adset_id) : cr.adsetId ? String(cr.adsetId) : null,
    adset_name: cr.adset_name || cr.adsetName || cr.adset || null,
    effective_status: cr.effective_status || cr.ad_status || cr.status || "ACTIVE",
    media_type: cr.media_type || cr.creative_type || ((
      (cr.video_id && String(cr.video_id).trim() !== "" && String(cr.video_id) !== "null" && String(cr.video_id) !== "0") ||
      (cr.video_url && String(cr.video_url).trim() !== "" && String(cr.video_url) !== "null") ||
      (cr.object_story_spec && typeof cr.object_story_spec === "object" && cr.object_story_spec.video_data) ||
      (cr.object_story_spec && typeof cr.object_story_spec === "string" && cr.object_story_spec.includes('"video_data"'))
    ) ? "VIDEO" : "IMAGE"),
    thumbnail_url: cr.thumbnail_url || null,
    image_url: cr.image_url || null,
    facebook_permalink_url: cr.facebook_permalink_url || null,
    instagram_permalink_url: cr.instagram_permalink_url || null,
    spend: getNumericOrNull(cr.spend),
    impressions: getNumericOrNull(cr.impressions),
    reach: getNumericOrNull(cr.reach),
    clicks: getNumericOrNull(cr.clicks),
    link_clicks: getNumericOrNull(cr.link_clicks),
    ctr: getNumericOrNull(cr.ctr),
    cpc: getNumericOrNull(cr.cpc),
    cpm: getNumericOrNull(cr.cpm),
    frequency: getNumericOrNull(cr.frequency),
    actions_add_to_cart: getNumericOrNull(cr.actions_add_to_cart ?? cr.add_to_cart),
    actions_initiate_checkout: getNumericOrNull(cr.actions_initiate_checkout ?? cr.initiate_checkout),
    unique_outbound_clicks_ctr_outbound_click: getNumericOrNull(cr.unique_outbound_clicks_ctr_outbound_click ?? cr.unique_outbound_clicks_ctr),
    purchases: getNumericOrNull(cr.purchases ?? cr.actions_omni_purchase),
    purchase_conversion_value: getNumericOrNull(cr.purchase_conversion_value ?? cr.action_values_omni_purchase),
    cost_per_result: getNumericOrNull(cr.cost_per_result ?? cr.cost_per_action_type_omni_purchase),
    purchase_roas: getNumericOrNull(cr.purchase_roas ?? cr.purchase_roas_omni_purchase),
    currency: cr.currency || targetCampaign.currency || "INR",
    video_id: cr.video_id || null,
    actions_video_view: getNumericOrNull(cr.actions_video_view ?? cr.video_3_sec_watched_actions),
    video_play_actions_video_view: getNumericOrNull(cr.video_play_actions_video_view ?? cr.video_play_actions ?? cr.video_views),
    video_thruplay_watched_actions_video_view: getNumericOrNull(cr.video_thruplay_watched_actions_video_view ?? cr.video_thruplay_watched_actions),
    video_p25_watched_actions_video_view: getNumericOrNull(cr.video_p25_watched_actions_video_view ?? cr.video_p25_watched_actions),
    video_p50_watched_actions_video_view: getNumericOrNull(cr.video_p50_watched_actions_video_view ?? cr.video_p50_watched_actions),
    video_p75_watched_actions_video_view: getNumericOrNull(cr.video_p75_watched_actions_video_view ?? cr.video_p75_watched_actions),
    video_p95_watched_actions_video_view: getNumericOrNull(cr.video_p95_watched_actions_video_view ?? cr.video_p95_watched_actions),
    video_p100_watched_actions_video_view: getNumericOrNull(cr.video_p100_watched_actions_video_view ?? cr.video_p100_watched_actions),
    video_avg_time_watched_actions_video_view: getNumericOrNull(cr.video_avg_time_watched_actions_video_view ?? cr.video_avg_time_watched_actions),
    // Standard aliases for frontend compatibility
    video_play_actions: getNumericOrNull(cr.video_play_actions_video_view ?? cr.video_play_actions ?? cr.video_views),
    video_3_sec_watched_actions: getNumericOrNull(cr.actions_video_view ?? cr.video_3_sec_watched_actions),
    video_thruplay_watched_actions: getNumericOrNull(cr.video_thruplay_watched_actions_video_view ?? cr.video_thruplay_watched_actions),
    video_p25_watched_actions: getNumericOrNull(cr.video_p25_watched_actions_video_view ?? cr.video_p25_watched_actions),
    video_p50_watched_actions: getNumericOrNull(cr.video_p50_watched_actions_video_view ?? cr.video_p50_watched_actions),
    video_p75_watched_actions: getNumericOrNull(cr.video_p75_watched_actions_video_view ?? cr.video_p75_watched_actions),
    video_p95_watched_actions: getNumericOrNull(cr.video_p95_watched_actions_video_view ?? cr.video_p95_watched_actions),
    video_p100_watched_actions: getNumericOrNull(cr.video_p100_watched_actions_video_view ?? cr.video_p100_watched_actions),
    video_avg_time_watched_actions: getNumericOrNull(cr.video_avg_time_watched_actions_video_view ?? cr.video_avg_time_watched_actions),
  }));

  const hasCreativeLinkClicks = creatives.some((c) => c.link_clicks !== null);
  const totalLinkClicks = hasCreativeLinkClicks
    ? creatives.reduce((acc, c) => acc + (c.link_clicks || 0), 0)
    : null;

  const performance = {
    spend: getNumericOrNull(targetCampaign.spend),
    impressions: getNumericOrNull(targetCampaign.impressions),
    reach: getNumericOrNull(targetCampaign.reach),
    clicks: getNumericOrNull(targetCampaign.clicks),
    link_clicks: totalLinkClicks !== null ? totalLinkClicks : getNumericOrNull(targetCampaign.link_clicks),
    ctr: getNumericOrNull(targetCampaign.ctr),
    cpc: getNumericOrNull(targetCampaign.cpc),
    cpm: getNumericOrNull(targetCampaign.cpm),
    frequency: getNumericOrNull(targetCampaign.frequency),
    purchases: getNumericOrNull(targetCampaign.purchases),
    purchase_conversion_value: getNumericOrNull(targetCampaign.purchase_conversion_value),
    cost_per_result: getNumericOrNull(targetCampaign.cost_per_result),
    purchase_roas: getNumericOrNull(targetCampaign.purchase_roas),
    actions_add_to_cart: getNumericOrNull(targetCampaign.actions_add_to_cart ?? targetCampaign.add_to_cart),
    actions_initiate_checkout: getNumericOrNull(targetCampaign.actions_initiate_checkout ?? targetCampaign.initiate_checkout),
    unique_outbound_clicks_ctr_outbound_click: getNumericOrNull(targetCampaign.unique_outbound_clicks_ctr_outbound_click ?? targetCampaign.unique_outbound_clicks_ctr),
    currency: targetCampaign.currency || "INR",
  };

  return {
    campaign: {
      id: actualCampaignId,
      name: campaignName || "Unnamed Campaign",
      status: targetCampaign.campaign_status || targetCampaign.campaign_effective_status || targetCampaign.effective_status || "ACTIVE",
      objective: targetCampaign.campaign_objective || "OUTCOME_SALES",
      currency: targetCampaign.currency || "INR",
    },
    adSets,
    creatives,
    performance,
  };
};

/**
 * Format helper for Placement platform_position dimension.
 */
const formatPlacementLabel = (row) => {
  if (!row || typeof row !== "object") return "Unknown Placement";
  const pos = (row.platform_position || row.placement || "").toString().trim();
  const platform = (row.publisher_platform || "").toString().trim();

  if (pos) {
    const normPos = pos.toLowerCase();
    const map = {
      facebook_feed: "Facebook Feed",
      feed: platform.toLowerCase() === "instagram" ? "Instagram Feed" : "Facebook Feed",
      instagram_feed: "Instagram Feed",
      instagram_reels: "Instagram Reels",
      facebook_reels: "Facebook Reels",
      reels: platform.toLowerCase() === "instagram" ? "Instagram Reels" : "Facebook Reels",
      instagram_stories: "Instagram Stories",
      facebook_stories: "Facebook Stories",
      stories: platform.toLowerCase() === "instagram" ? "Instagram Stories" : "Facebook Stories",
      audience_network: "Audience Network",
      an_classic: "Audience Network",
      right_hand_column: "Facebook Right Column",
      instant_article: "Facebook Instant Articles",
      marketplace: "Facebook Marketplace",
      search: "Facebook Search Results",
      explore: "Instagram Explore",
    };

    if (map[normPos]) return map[normPos];

    return normPos
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  if (platform) {
    const pNorm = platform.toLowerCase();
    if (pNorm === "facebook") return "Facebook";
    if (pNorm === "instagram") return "Instagram";
    if (pNorm === "audience_network") return "Audience Network";
    if (pNorm === "messenger") return "Messenger";
    return platform.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  return "Unknown Placement";
};

const formatGenderLabel = (rawGender) => {
  if (!rawGender) return "Unknown";
  const g = String(rawGender).toLowerCase().trim();
  if (g === "male" || g === "m") return "Male";
  if (g === "female" || g === "f") return "Female";
  return "Unknown";
};

const formatAgeLabel = (rawAge) => {
  if (!rawAge) return "Unknown";
  return String(rawAge).trim();
};

/**
 * Fetches campaign-scoped breakdown data (age, gender, placement) from Windsor.
 */
const fetchCampaignBreakdowns = async ({
  activeMetaAccount,
  campaignId,
  breakdown = "age",
  datePreset,
  dateFrom,
  dateTo,
}) => {
  const fieldsMap = {
    age: [
      "age",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    gender: [
      "gender",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    placement: [
      "publisher_platform",
      "platform_position",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
  };

  const cleanBreakdown = (breakdown || "age").toLowerCase().trim();
  const fields = fieldsMap[cleanBreakdown] || fieldsMap.age;

  const filters = buildAccountFilter(activeMetaAccount);
  if (campaignId) {
    filters.push(["campaign_id", "eq", campaignId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return normalizeAndAggregateBreakdowns(rawData, cleanBreakdown);
};

/**
 * Fetches adset-scoped breakdown data (age, gender, placement) from Windsor.
 * Scoped directly to adset_id at the data-provider level.
 */
const fetchAdSetBreakdowns = async ({
  activeMetaAccount,
  adSetId,
  breakdown = "age",
  datePreset,
  dateFrom,
  dateTo,
}) => {
  const fieldsMap = {
    age: [
      "age",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    gender: [
      "gender",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    placement: [
      "publisher_platform",
      "platform_position",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
  };

  const cleanBreakdown = (breakdown || "age").toLowerCase().trim();
  const fields = fieldsMap[cleanBreakdown] || fieldsMap.age;

  const filters = buildAccountFilter(activeMetaAccount);
  if (adSetId) {
    filters.push(["adset_id", "eq", adSetId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return normalizeAndAggregateBreakdowns(rawData, cleanBreakdown);
};

/**
 * Fetches ad-scoped breakdown data (age, gender, placement) from Windsor.
 * Scoped directly to ad_id at the data-provider level.
 */
const fetchAdBreakdowns = async ({
  activeMetaAccount,
  adId,
  breakdown = "age",
  datePreset,
  dateFrom,
  dateTo,
}) => {
  const fieldsMap = {
    age: [
      "age",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    gender: [
      "gender",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
    placement: [
      "publisher_platform",
      "platform_position",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "currency",
      "actions_purchase",
      "action_values_purchase",
    ],
  };

  const cleanBreakdown = (breakdown || "age").toLowerCase().trim();
  const fields = fieldsMap[cleanBreakdown] || fieldsMap.age;

  const filters = buildAccountFilter(activeMetaAccount);
  if (adId) {
    filters.push(["ad_id", "eq", adId]);
  }

  const rawData = await windsorProvider.fetchData({
    connector: WINDSOR_CONSTANTS.CONNECTOR_FACEBOOK,
    fields,
    datePreset,
    dateFrom,
    dateTo,
    filters,
  });

  return normalizeAndAggregateBreakdowns(rawData, cleanBreakdown);
};

const normalizeAndAggregateBreakdowns = (rawData, breakdown) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const groupedMap = new Map();

  for (const row of rawData) {
    if (!row || typeof row !== "object") continue;

    let label = "Unknown";
    if (breakdown === "age") {
      label = formatAgeLabel(row.age);
    } else if (breakdown === "gender") {
      label = formatGenderLabel(row.gender);
    } else if (breakdown === "placement") {
      label = formatPlacementLabel(row);
    }

    if (!groupedMap.has(label)) {
      groupedMap.set(label, []);
    }
    groupedMap.get(label).push(row);
  }

  const results = [];

  for (const [label, rows] of groupedMap.entries()) {
    let hasSpend = false, spendSum = 0;
    let hasImpressions = false, impressionsSum = 0;
    let hasPurchases = false, purchasesSum = 0;
    let hasPurchaseValue = false, purchaseValueSum = 0;
    const reachVals = [];

    for (const r of rows) {
      const vSpend = getNumericOrNull(r.spend);
      if (vSpend !== null) { hasSpend = true; spendSum += vSpend; }

      const vImp = getNumericOrNull(r.impressions);
      if (vImp !== null) { hasImpressions = true; impressionsSum += vImp; }

      const vPur = getNumericOrNull(r.actions_omni_purchase ?? r.actions_purchase ?? r.purchases);
      if (vPur !== null) { hasPurchases = true; purchasesSum += vPur; }

      const vVal = getNumericOrNull(r.action_values_omni_purchase ?? r.action_values_purchase ?? r.purchase_conversion_value);
      if (vVal !== null) { hasPurchaseValue = true; purchaseValueSum += vVal; }

      const vReach = getNumericOrNull(r.reach);
      if (vReach !== null && !isNaN(vReach)) reachVals.push(vReach);
    }

    const spend = hasSpend ? spendSum : null;
    const impressions = hasImpressions ? impressionsSum : null;
    const purchases = hasPurchases ? purchasesSum : null;
    const purchaseValue = hasPurchaseValue ? purchaseValueSum : null;

    // Reach: Non-additive. NEVER fabricate or estimate. Return null if not provided by source.
    const reach = reachVals.length > 0 ? Math.max(...reachVals) : null;

    // ROAS: Must NEVER be summed. Always calculated from aggregated totals: purchaseValue / spend.
    const roas =
      spend !== null && spend > 0 && purchaseValue !== null && purchaseValue > 0
        ? purchaseValue / spend
        : null;

    results.push({
      label,
      reach: reach !== null ? Math.round(reach) : null,
      impressions: impressions !== null ? Math.round(impressions) : 0,
      spend: spend !== null ? Number(spend.toFixed(2)) : 0,
      purchases: purchases !== null ? Math.round(purchases) : 0,
      purchaseValue: purchaseValue !== null ? Number(purchaseValue.toFixed(2)) : 0,
      roas: roas !== null ? Number(roas.toFixed(2)) : null,
    });
  }

  // Sort breakdown data by Spend HIGH -> LOW by default
  results.sort((a, b) => (b.spend || 0) - (a.spend || 0));

  return results;
};

module.exports = {
  fetchOverview,
  fetchCampaigns,
  fetchAdsets,
  fetchCreatives,
  fetchAudience,
  fetchPlaces,
  fetchCampaignDetails,
  fetchCampaignBreakdowns,
  fetchAdSetBreakdowns,
  fetchAdBreakdowns,
  normalizeAndAggregateAdSets,
};

