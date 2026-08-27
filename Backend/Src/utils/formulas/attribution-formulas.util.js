/**
 * Pure Canonical Formula Implementations for Attribution & Composite Metrics (Phase 2 - Task #10).
 * Deterministic, side-effect free calculation functions for Composite derived metrics.
 */

const parseNumericInput = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
};

/**
 * formula.attribution.total_orders
 */
const calculateAttributionTotalOrders = (inputs = {}) => {
  const count = parseNumericInput(inputs.total_orders ?? inputs["attribution.total_orders"] ?? inputs.orders_count);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing attribution total_orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.attribution.net_revenue
 */
const calculateAttributionNetRevenue = (inputs = {}) => {
  const rev = parseNumericInput(inputs.net_revenue ?? inputs["attribution.net_revenue"] ?? inputs.net_sales);
  if (rev === null) {
    return { value: null, status: "invalid_input", reason: "Missing attribution net_revenue input" };
  }
  return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.attribution.paid_orders
 */
const calculateAttributionPaidOrders = (inputs = {}) => {
  const count = parseNumericInput(inputs.paid_orders ?? inputs["attribution.paid_orders"]);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing attribution paid_orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.attribution.organic_orders
 */
const calculateAttributionOrganicOrders = (inputs = {}) => {
  const count = parseNumericInput(inputs.organic_orders ?? inputs["attribution.organic_orders"]);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing attribution organic_orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.composite.blended_roas
 * Mathematical Definition: Shopify Net Sales / Meta Spend
 * Distinct from meta.roas (which uses Meta Purchase Value / Meta Spend).
 */
const calculateBlendedRoas = (inputs = {}) => {
  const netSales = parseNumericInput(inputs.net_sales ?? inputs["shopify.net_sales"]);
  const metaSpend = parseNumericInput(inputs.meta_spend ?? inputs.spend ?? inputs["meta.spend"]);

  if (netSales === null || metaSpend === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric net_sales/meta_spend input" };
  }

  if (metaSpend <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because Meta ad spend equals zero or negative" };
  }

  if (netSales === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero blended ROAS (Meta spend > 0, Shopify netSales = 0)" };
  }

  const roas = netSales / metaSpend;
  return { value: roas, status: "valid", reason: null };
};

/**
 * formula.composite.blended_cac
 * Mathematical Definition: Meta Spend / Total Shopify Orders
 * Distinct from meta.cpa (which uses Meta Spend / Meta Purchases).
 */
const calculateBlendedCac = (inputs = {}) => {
  const metaSpend = parseNumericInput(inputs.meta_spend ?? inputs.spend ?? inputs["meta.spend"]);
  const totalOrders = parseNumericInput(inputs.orders_count ?? inputs.total_orders ?? inputs["shopify.orders_count"]);

  if (metaSpend === null || totalOrders === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric meta_spend/orders_count input" };
  }

  if (totalOrders <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because total Shopify orders equal zero or negative" };
  }

  if (metaSpend === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero blended CAC (Shopify orders > 0, Meta spend = 0)" };
  }

  const cac = metaSpend / totalOrders;
  return { value: cac, status: "valid", reason: null };
};

module.exports = {
  calculateAttributionTotalOrders,
  calculateAttributionNetRevenue,
  calculateAttributionPaidOrders,
  calculateAttributionOrganicOrders,
  calculateBlendedRoas,
  calculateBlendedCac,
};
