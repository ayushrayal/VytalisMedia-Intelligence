/**
 * Pure Canonical Formula Implementations for Meta Analytics (Phase 2 - Task #10).
 * Deterministic, side-effect free calculation functions for Meta derived metrics.
 */

/**
 * Helper to safely validate numeric inputs.
 * Returns parsed float or null if unparseable / NaN / Infinite.
 */
const parseNumericInput = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
};

/**
 * formula.meta.ctr
 * Mathematical Definition: (Clicks / Impressions) * 100
 * Required Inputs: clicks, impressions
 */
const calculateMetaCtr = (inputs = {}) => {
  const clicks = parseNumericInput(inputs.clicks ?? inputs["meta.clicks"]);
  const impressions = parseNumericInput(inputs.impressions ?? inputs["meta.impressions"]);

  if (clicks === null || impressions === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric clicks/impressions input" };
  }

  if (impressions <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because impressions equal zero or negative" };
  }

  if (clicks === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero CTR (impressions > 0, clicks = 0)" };
  }

  const ctr = (clicks / impressions) * 100;
  return { value: ctr, status: "valid", reason: null };
};

/**
 * formula.meta.cpc
 * Mathematical Definition: Spend / Clicks
 * Required Inputs: spend, clicks
 */
const calculateMetaCpc = (inputs = {}) => {
  const spend = parseNumericInput(inputs.spend ?? inputs["meta.spend"]);
  const clicks = parseNumericInput(inputs.clicks ?? inputs["meta.clicks"]);

  if (spend === null || clicks === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric spend/clicks input" };
  }

  if (clicks <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because clicks equal zero or negative" };
  }

  if (spend === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero CPC (clicks > 0, spend = 0)" };
  }

  const cpc = spend / clicks;
  return { value: cpc, status: "valid", reason: null };
};

/**
 * formula.meta.cpm
 * Mathematical Definition: (Spend / Impressions) * 1000
 * Required Inputs: spend, impressions
 */
const calculateMetaCpm = (inputs = {}) => {
  const spend = parseNumericInput(inputs.spend ?? inputs["meta.spend"]);
  const impressions = parseNumericInput(inputs.impressions ?? inputs["meta.impressions"]);

  if (spend === null || impressions === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric spend/impressions input" };
  }

  if (impressions <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because impressions equal zero or negative" };
  }

  if (spend === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero CPM (impressions > 0, spend = 0)" };
  }

  const cpm = (spend / impressions) * 1000;
  return { value: cpm, status: "valid", reason: null };
};

/**
 * formula.meta.frequency
 * Mathematical Definition: Impressions / Reach
 * Required Inputs: impressions, reach
 */
const calculateMetaFrequency = (inputs = {}) => {
  const impressions = parseNumericInput(inputs.impressions ?? inputs["meta.impressions"]);
  const reach = parseNumericInput(inputs.reach ?? inputs["meta.reach"]);

  if (impressions === null || reach === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric impressions/reach input" };
  }

  if (reach <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because reach equals zero, negative, or non-aggregatable" };
  }

  const frequency = impressions / reach;
  return { value: frequency, status: "valid", reason: null };
};

/**
 * formula.meta.cpa
 * Mathematical Definition: Spend / Purchases
 * Required Inputs: spend, purchases
 */
const calculateMetaCpa = (inputs = {}) => {
  const spend = parseNumericInput(inputs.spend ?? inputs["meta.spend"]);
  const purchases = parseNumericInput(inputs.purchases ?? inputs["meta.purchases"]);

  if (spend === null || purchases === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric spend/purchases input" };
  }

  if (purchases <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because Meta purchases equal zero" };
  }

  if (spend === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero CPA (purchases > 0, spend = 0)" };
  }

  const cpa = spend / purchases;
  return { value: cpa, status: "valid", reason: null };
};

/**
 * formula.meta.roas
 * Mathematical Definition: Purchase Conversion Value / Spend
 * Required Inputs: purchase_value, spend
 */
const calculateMetaRoas = (inputs = {}) => {
  const purchaseValue = parseNumericInput(inputs.purchase_value ?? inputs["meta.purchase_value"]);
  const spend = parseNumericInput(inputs.spend ?? inputs["meta.spend"]);

  if (purchaseValue === null || spend === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric purchaseValue/spend input" };
  }

  if (spend <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because Meta spend equals zero or negative" };
  }

  if (purchaseValue === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero ROAS (spend > 0, purchaseValue = 0)" };
  }

  const roas = purchaseValue / spend;
  return { value: roas, status: "valid", reason: null };
};

module.exports = {
  calculateMetaCtr,
  calculateMetaCpc,
  calculateMetaCpm,
  calculateMetaFrequency,
  calculateMetaCpa,
  calculateMetaRoas,
};
