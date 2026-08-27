/**
 * Pure Canonical Formula Implementations for Cohort Analytics (Phase 2 - Task #10).
 * Deterministic, side-effect free calculation functions for Cohort derived metrics.
 */

const parseNumericInput = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
};

/**
 * formula.cohort.size
 * Mathematical Definition: Count of initial buyers acquired in cohort period.
 */
const calculateCohortSize = (inputs = {}) => {
  const size = parseNumericInput(inputs.cohort_size ?? inputs["cohort.size"] ?? inputs.cohortSize);
  if (size === null) {
    return { value: null, status: "invalid_input", reason: "Missing cohort_size input" };
  }
  return { value: size, status: size === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.cohort.retention_rate
 * Mathematical Definition: (Retained Customers in Period N / Cohort Size) * 100
 * Strictly respects cohort period maturity.
 */
const calculateCohortRetentionRate = (inputs = {}) => {
  const isMature = inputs.isMature !== false; // defaults to true if not specified
  const cohortSize = parseNumericInput(inputs.cohort_size ?? inputs["cohort.size"] ?? inputs.cohortSize);
  const retainedCount = parseNumericInput(inputs.retained_customers ?? inputs.retainedCustomers);

  if (!isMature) {
    return { value: null, status: "immature", reason: "Cohort period is Not Mature (observation period has not fully elapsed)" };
  }

  if (cohortSize === null || retainedCount === null) {
    return { value: null, status: "invalid_input", reason: "Missing cohortSize or retainedCustomers input" };
  }

  if (cohortSize <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because cohort size is zero or negative" };
  }

  if (retainedCount === 0) {
    return { value: 0.0, status: "zero", reason: "Mature cohort observation completed with zero repeat customers (0.0%)" };
  }

  const rate = (retainedCount / cohortSize) * 100;
  return { value: rate, status: "valid", reason: null };
};

/**
 * formula.cohort.revenue
 * Mathematical Definition: Sum of repeat purchase net sales revenue in period N.
 * Strictly respects cohort period maturity.
 */
const calculateCohortRevenue = (inputs = {}) => {
  const isMature = inputs.isMature !== false;
  const revenue = parseNumericInput(inputs.revenue ?? inputs["cohort.revenue"]);

  if (!isMature) {
    return { value: null, status: "immature", reason: "Cohort period is Not Mature (observation period has not fully elapsed)" };
  }

  if (revenue === null) {
    return { value: null, status: "invalid_input", reason: "Missing cohort revenue input" };
  }

  if (revenue === 0) {
    return { value: 0.0, status: "zero", reason: "Mature cohort observation completed with ₹0.00 repeat sales revenue" };
  }

  return { value: revenue, status: "valid", reason: null };
};

module.exports = {
  calculateCohortSize,
  calculateCohortRetentionRate,
  calculateCohortRevenue,
};
