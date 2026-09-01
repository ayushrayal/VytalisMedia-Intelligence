/**
 * Core Performance Compare Calculation Engine for Vytalis Intelligence.
 * Handles date normalization, equal period length enforcement, safe percentage calculation,
 * standardized 7-status evaluation, derived metrics, and automated insights.
 */

const { executeFormula } = require("../config/formula-registry.config");

/**
 * Normalizes date parameters so dateFrom <= dateTo.
 * Reversible date orders (e.g. 2026-08-20 -> 2026-08-15) are automatically swapped.
 */
const normalizeDateOrder = (rawFrom, rawTo) => {
  if (!rawFrom || !rawTo) return { dateFrom: rawFrom, dateTo: rawTo };
  const dFrom = new Date(rawFrom);
  const dTo = new Date(rawTo);
  if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
    return { dateFrom: rawFrom, dateTo: rawTo };
  }
  if (dFrom > dTo) {
    return { dateFrom: rawTo, dateTo: rawFrom };
  }
  return { dateFrom: rawFrom, dateTo: rawTo };
};

/**
 * Calculates calendar days between dateFrom and dateTo (inclusive of start and end day).
 */
const calculateDaysBetween = (rawFrom, rawTo) => {
  const { dateFrom, dateTo } = normalizeDateOrder(rawFrom, rawTo);
  const d1 = new Date(`${dateFrom}T00:00:00Z`);
  const d2 = new Date(`${dateTo}T00:00:00Z`);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diffTime = Math.abs(d2 - d1);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Validates that Period A and Period B contain the exact same number of calendar days.
 * Throws a 400 status error if day counts differ or dates are unparseable.
 */
const validateEqualPeriodLengths = (pAFrom, pATo, pBFrom, pBTo) => {
  if (!pAFrom || !pATo || !pBFrom || !pBTo) {
    const error = new Error("All date boundaries for Period A and Period B are required.");
    error.statusCode = 400;
    throw error;
  }

  const daysA = calculateDaysBetween(pAFrom, pATo);
  const daysB = calculateDaysBetween(pBFrom, pBTo);

  if (daysA === 0 || daysB === 0) {
    const error = new Error("Invalid date range specified.");
    error.statusCode = 400;
    throw error;
  }

  if (daysA !== daysB) {
    const error = new Error("Comparison periods must contain the same number of days.");
    error.statusCode = 400;
    throw error;
  }

  return { daysA, daysB };
};

/**
 * Generates equal-duration date ranges for predefined presets.
 * For "this_month" (Month-to-Date):
 * e.g., if today is Aug 20: Period A = Aug 1 → Aug 20 (20d), Period B = Jul 1 → Jul 20 (20d).
 */
const buildPresetDateRanges = (preset) => {
  const now = new Date();
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (preset === "last_7d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 6);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 6);

    return {
      dateFrom1: formatDate(pAStart),
      dateTo1: formatDate(pAEnd),
      dateFrom2: formatDate(pBStart),
      dateTo2: formatDate(pBEnd),
    };
  }

  if (preset === "last_14d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 13);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 13);

    return {
      dateFrom1: formatDate(pAStart),
      dateTo1: formatDate(pAEnd),
      dateFrom2: formatDate(pBStart),
      dateTo2: formatDate(pBEnd),
    };
  }

  if (preset === "last_30d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 29);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 29);

    return {
      dateFrom1: formatDate(pAStart),
      dateTo1: formatDate(pAEnd),
      dateFrom2: formatDate(pBStart),
      dateTo2: formatDate(pBEnd),
    };
  }

  if (preset === "this_month") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    const currentDay = now.getDate();

    const pAStart = new Date(currentYear, currentMonth, 1);
    const pAEnd = new Date(currentYear, currentMonth, currentDay);
    const dayCount = Math.round((pAEnd - pAStart) / (1000 * 60 * 60 * 24)) + 1;

    // Previous month start
    const pBStart = new Date(currentYear, currentMonth - 1, 1);

    // Ensure exact equal day count matching Period A
    const pBEnd = new Date(pBStart);
    pBEnd.setDate(pBStart.getDate() + dayCount - 1);

    return {
      dateFrom1: formatDate(pAStart),
      dateTo1: formatDate(pAEnd),
      dateFrom2: formatDate(pBStart),
      dateTo2: formatDate(pBEnd),
    };
  }

  // Fallback default: last 7 days
  return buildPresetDateRanges("last_7d");
};

// ==========================================
// METRIC CATEGORY DIRECTION MATRIX
// ==========================================
// Every metric MUST belong to EXACTLY ONE category.

const METRIC_DIRECTIONS = {
  // HIGHER_IS_BETTER
  spend_roas: "HIGHER_IS_BETTER",
  purchase_roas: "HIGHER_IS_BETTER",
  purchases: "HIGHER_IS_BETTER",
  purchase_conversion_value: "HIGHER_IS_BETTER",
  purchase_value: "HIGHER_IS_BETTER",
  ctr: "HIGHER_IS_BETTER",
  reach: "HIGHER_IS_BETTER",
  impressions: "HIGHER_IS_BETTER",
  clicks: "HIGHER_IS_BETTER",
  actions_add_to_cart: "HIGHER_IS_BETTER",
  add_to_cart: "HIGHER_IS_BETTER",
  actions_initiate_checkout: "HIGHER_IS_BETTER",
  checkout_initiated: "HIGHER_IS_BETTER",
  net_sales: "HIGHER_IS_BETTER",
  gross_sales: "HIGHER_IS_BETTER",
  orders: "HIGHER_IS_BETTER",
  total_orders: "HIGHER_IS_BETTER",
  customers: "HIGHER_IS_BETTER",
  total_customers: "HIGHER_IS_BETTER",

  // LOWER_IS_BETTER
  cost_per_result: "LOWER_IS_BETTER",
  cpa: "LOWER_IS_BETTER",
  cpc: "LOWER_IS_BETTER",
  cpm: "LOWER_IS_BETTER",
  cancellation_rate: "LOWER_IS_BETTER",

  // CONTEXTUAL
  spend: "CONTEXTUAL",
  amount_spent: "CONTEXTUAL",
  discounts: "CONTEXTUAL",
  total_discounts: "CONTEXTUAL",
  cod_orders: "CONTEXTUAL",
  prepaid_orders: "CONTEXTUAL",
  aov: "CONTEXTUAL",
  average_order_value: "CONTEXTUAL",
  cod_share: "CONTEXTUAL",
  prepaid_share: "CONTEXTUAL",
  cancelled_orders: "CONTEXTUAL",
  frequency: "CONTEXTUAL",
};

/**
 * Computes metric comparison details enforcing the 7-status system.
 * 
 * Statuses:
 * - "No Previous Data": valB is null/undefined/unavailable
 * - "New": valB === 0 && valA > 0
 * - "No Change": valA === valB (or valB === 0 && valA === 0)
 * - "Improved": Business metric moved favorably
 * - "Declined": Business metric moved unfavorably
 * - "Increased": Contextual metric increased
 * - "Decreased": Contextual metric decreased
 */
const computeMetricComparison = ({ metricKey, label, valueA, valueB, formatType = "number", currency = "INR" }) => {
  const directionCategory = METRIC_DIRECTIONS[metricKey] || "CONTEXTUAL";

  // Check Case 3A: Missing/Null Current Data
  if (valueA === null || valueA === undefined) {
    return {
      metricKey,
      label,
      valueA: null,
      valueB,
      change: null,
      percentageChange: null,
      performance: "No Current Data",
      directionCategory,
    };
  }

  // Check Case 3B: Missing/Null Previous Data
  if (valueB === null || valueB === undefined) {
    return {
      metricKey,
      label,
      valueA,
      valueB: null,
      change: null,
      percentageChange: null,
      performance: "No Previous Data",
      directionCategory,
    };
  }

  const numA = Number(valueA);
  const numB = Number(valueB);
  const change = numA - numB;

  // Check Case 1: Zero Previous Value & Positive Current Value -> "New"
  if (numB === 0 && numA > 0) {
    return {
      metricKey,
      label,
      valueA: numA,
      valueB: 0,
      change: numA,
      percentageChange: null,
      performance: "New",
      directionCategory,
    };
  }

  // Check Case 2: Zero Difference -> "No Change"
  if (numA === numB) {
    return {
      metricKey,
      label,
      valueA: numA,
      valueB: numB,
      change: 0,
      percentageChange: 0,
      performance: "No Change",
      directionCategory,
    };
  }

  // Calculate percentage change safely (numB !== 0)
  const percentageChange = Number((((numA - numB) / numB) * 100).toFixed(1));

  let performance = "No Change";

  if (directionCategory === "HIGHER_IS_BETTER") {
    performance = numA > numB ? "Improved" : "Declined";
  } else if (directionCategory === "LOWER_IS_BETTER") {
    performance = numA < numB ? "Improved" : "Declined";
  } else {
    // CONTEXTUAL
    performance = numA > numB ? "Increased" : "Decreased";
  }

  return {
    metricKey,
    label,
    valueA: numA,
    valueB: numB,
    change,
    percentageChange,
    performance,
    directionCategory,
  };
};

const computeShopifyDerivedMetrics = (totals, breakdown) => {
  const totalOrders = totals.orders || 0;

  const cancelRes = executeFormula("formula.shopify.cancellation_rate", { cancelled_orders: breakdown.cancelledCount, orders_count: totalOrders });
  const codShareRes = executeFormula("formula.shopify.share_of_sales", { entity_sales: breakdown.codCount, total_sales: totalOrders });
  const prepaidShareRes = executeFormula("formula.shopify.share_of_sales", { entity_sales: breakdown.prepaidCount, total_sales: totalOrders });

  const cancellationRate = cancelRes.value !== null ? Number(cancelRes.value.toFixed(1)) : null;
  const codShare = codShareRes.value !== null ? Number(codShareRes.value.toFixed(1)) : null;
  const prepaidShare = prepaidShareRes.value !== null ? Number(prepaidShareRes.value.toFixed(1)) : null;

  return {
    cancellationRate,
    codShare,
    prepaidShare,
  };
};

/**
 * Generates prioritized Meta Performance Summary text based on actual metrics.
 * Priority: 1. ROAS, 2. CPA, 3. Purchases, 4. Purchase Value, 5. Spend, 6. CTR.
 */
const generateMetaSummary = (metricsMap) => {
  const roas = metricsMap.purchase_roas;
  const cpa = metricsMap.cost_per_result;
  const purchases = metricsMap.purchases;
  const purchaseValue = metricsMap.purchase_conversion_value;
  const spend = metricsMap.spend;

  const phrases = [];

  if (roas && roas.performance !== "No Change" && roas.performance !== "No Previous Data") {
    const changeStr = roas.percentageChange !== null ? `${Math.abs(roas.percentageChange)}%` : "";
    if (roas.performance === "Improved") {
      phrases.push(`Purchase ROAS improved by ${changeStr}`.trim());
    } else if (roas.performance === "Declined") {
      phrases.push(`Purchase ROAS declined by ${changeStr}`.trim());
    }
  }

  if (cpa && cpa.performance !== "No Change" && cpa.performance !== "No Previous Data") {
    const changeStr = cpa.percentageChange !== null ? `${Math.abs(cpa.percentageChange)}%` : "";
    if (cpa.performance === "Improved") {
      phrases.push(`Cost per Purchase decreased by ${changeStr}`.trim());
    } else if (cpa.performance === "Declined") {
      phrases.push(`Cost per Purchase increased by ${changeStr}`.trim());
    }
  }

  if (purchases && purchases.performance !== "No Change" && purchases.performance !== "No Previous Data") {
    const changeStr = purchases.percentageChange !== null ? `by ${Math.abs(purchases.percentageChange)}%` : "";
    if (purchases.performance === "Improved") {
      phrases.push(`Purchases increased ${changeStr}`.trim());
    } else if (purchases.performance === "Declined") {
      phrases.push(`Purchases declined ${changeStr}`.trim());
    }
  }

  if (purchaseValue && purchaseValue.performance !== "No Change" && purchaseValue.performance !== "No Previous Data" && phrases.length < 3) {
    const changeStr = purchaseValue.percentageChange !== null ? `${Math.abs(purchaseValue.percentageChange)}%` : "";
    if (purchaseValue.performance === "Improved") {
      phrases.push(`Purchase Value grew by ${changeStr}`.trim());
    }
  }

  if (spend && spend.performance !== "No Change" && spend.performance !== "No Previous Data" && phrases.length < 3) {
    const changeStr = spend.percentageChange !== null ? `${Math.abs(spend.percentageChange)}%` : "";
    phrases.push(`Total spend ${spend.performance.toLowerCase()} by ${changeStr}`.trim());
  }

  if (phrases.length === 0) {
    return "Performance remained consistent across both periods with no significant fluctuations in major KPI indicators.";
  }

  return phrases.join(" while ") + ".";
};

/**
 * Generates prioritized Shopify Performance Summary text based on actual metrics.
 * Priority: 1. Net Sales, 2. Total Orders, 3. AOV, 4. Cancellation Rate, 5. COD/Prepaid Mix.
 */
const generateShopifySummary = (metricsMap) => {
  const netSales = metricsMap.net_sales;
  const orders = metricsMap.orders;
  const aov = metricsMap.aov;
  const cancelRate = metricsMap.cancellation_rate;

  const phrases = [];

  if (netSales && netSales.performance !== "No Change" && netSales.performance !== "No Previous Data") {
    const changeStr = netSales.percentageChange !== null ? `${Math.abs(netSales.percentageChange)}%` : "";
    if (netSales.performance === "Improved") {
      phrases.push(`Net Sales increased by ${changeStr}`.trim());
    } else if (netSales.performance === "Declined") {
      phrases.push(`Net Sales decreased by ${changeStr}`.trim());
    }
  }

  if (orders && orders.performance !== "No Change" && orders.performance !== "No Previous Data") {
    const changeStr = orders.percentageChange !== null ? `${Math.abs(orders.percentageChange)}%` : "";
    if (orders.performance === "Improved") {
      phrases.push(`Total Orders grew by ${changeStr}`.trim());
    } else if (orders.performance === "Declined") {
      phrases.push(`Total Orders declined by ${changeStr}`.trim());
    }
  }

  if (aov && aov.performance !== "No Change" && aov.performance !== "No Previous Data" && phrases.length < 3) {
    const changeStr = aov.percentageChange !== null ? `${Math.abs(aov.percentageChange)}%` : "";
    phrases.push(`Average Order Value ${aov.performance.toLowerCase()} by ${changeStr}`.trim());
  }

  if (cancelRate && cancelRate.performance !== "No Change" && cancelRate.performance !== "No Previous Data" && phrases.length < 3) {
    if (cancelRate.performance === "Improved") {
      phrases.push(`Cancellation Rate improved from ${cancelRate.valueB}% to ${cancelRate.valueA}%`);
    } else if (cancelRate.performance === "Declined") {
      phrases.push(`Cancellation Rate increased from ${cancelRate.valueB}% to ${cancelRate.valueA}%`);
    }
  }

  if (phrases.length === 0) {
    return "Shopify performance remained stable with no major changes in revenue, order volume, or customer checkout mix.";
  }

  return phrases.join(" while ") + ".";
};

/**
 * Extracts Key Changes array for bulleted display.
 */
const generateKeyChanges = (metricsList) => {
  const highlights = [];

  metricsList.forEach((m) => {
    if (!m || m.performance === "No Change" || m.performance === "No Previous Data") return;

    let iconType = "neutral"; // "positive" | "negative" | "neutral"
    if (m.performance === "Improved") iconType = "positive";
    else if (m.performance === "Declined") iconType = "negative";

    let labelText = "";
    if (m.percentageChange !== null) {
      const formattedPct = `${m.percentageChange > 0 ? "+" : ""}${m.percentageChange}%`;
      labelText = `${m.label} ${m.performance.toLowerCase()} by ${formattedPct}`;
    } else if (m.performance === "New") {
      labelText = `${m.label} is new in Period A`;
    } else {
      labelText = `${m.label} changed to ${m.valueA}`;
    }

    highlights.push({
      metricKey: m.metricKey,
      label: m.label,
      text: labelText,
      iconType,
      performance: m.performance,
    });
  });

  return highlights.slice(0, 5);
};

/**
 * Generates cautious automated insights for Meta.
 */
const generateMetaInsights = (metricsMap) => {
  const insights = [];
  const spend = metricsMap.spend;
  const roas = metricsMap.purchase_roas;
  const purchases = metricsMap.purchases;
  const ctr = metricsMap.ctr;
  const cpa = metricsMap.cost_per_result;

  if (spend && roas && spend.percentageChange > 10 && roas.performance === "Declined") {
    insights.push(
      `Spend increased by ${spend.percentageChange}% while Purchase ROAS declined by ${Math.abs(roas.percentageChange)}%, which may indicate reduced advertising efficiency as budget scaled during Period A.`
    );
  } else if (spend && roas && spend.performance === "Decreased" && roas.performance === "Improved") {
    insights.push(
      `Purchase ROAS improved by ${roas.percentageChange}% even as spend decreased by ${Math.abs(spend.percentageChange)}%, suggesting improved ad targeting efficiency.`
    );
  }

  if (ctr && purchases && ctr.performance === "Improved" && purchases.performance === "Declined") {
    insights.push(
      `Click-through rate (CTR) improved by ${ctr.percentageChange}% while purchases declined by ${Math.abs(purchases.percentageChange)}%, which could suggest strong ad engagement but weaker landing page or checkout conversion efficiency.`
    );
  }

  if (cpa && cpa.performance === "Improved") {
    insights.push(
      `Cost per Purchase (CPA) decreased by ${Math.abs(cpa.percentageChange)}%, indicating stronger conversion profitability during Period A.`
    );
  }

  if (insights.length === 0) {
    insights.push("Core marketing metrics maintained stable efficiency between the two selected periods.");
  }

  return insights;
};

/**
 * Generates cautious automated insights for Shopify.
 */
const generateShopifyInsights = (metricsMap) => {
  const insights = [];
  const netSales = metricsMap.net_sales;
  const orders = metricsMap.orders;
  const cancelRate = metricsMap.cancellation_rate;
  const codShare = metricsMap.cod_share;
  const prepaidShare = metricsMap.prepaid_share;

  if (netSales && orders && netSales.percentageChange > orders.percentageChange && orders.percentageChange > 0) {
    insights.push(
      `Net Sales grew faster (${netSales.percentageChange}%) than order volume (${orders.percentageChange}%), which appears to be driven by higher average revenue per order during Period A.`
    );
  } else if (orders && netSales && orders.percentageChange > netSales.percentageChange) {
    insights.push(
      `Order volume grew faster (${orders.percentageChange}%) than net revenue (${netSales.percentageChange}%), which may indicate lower average order value or higher discount usage.`
    );
  }

  if (cancelRate && cancelRate.performance === "Improved") {
    insights.push(
      `Cancellation Rate decreased from ${cancelRate.valueB}% to ${cancelRate.valueA}% despite order volume shifts, which may suggest improved customer order retention.`
    );
  }

  if (prepaidShare && Math.abs(prepaidShare.change) >= 2) {
    insights.push(
      `Prepaid order share shifted from ${prepaidShare.valueB}% to ${prepaidShare.valueA}%, indicating a shift in payment mix worth monitoring alongside order realization.`
    );
  } else if (codShare && Math.abs(codShare.change) >= 2) {
    insights.push(
      `COD share shifted from ${codShare.valueB}% to ${codShare.valueA}%, indicating a shift in payment mix worth monitoring.`
    );
  }

  if (insights.length === 0) {
    insights.push("Overall sales performance and customer checkout mix remained consistent between the selected comparison periods.");
  }

  return insights;
};

module.exports = {
  normalizeDateOrder,
  calculateDaysBetween,
  validateEqualPeriodLengths,
  buildPresetDateRanges,
  METRIC_DIRECTIONS,
  computeMetricComparison,
  computeShopifyDerivedMetrics,
  generateMetaSummary,
  generateShopifySummary,
  generateKeyChanges,
  generateMetaInsights,
  generateShopifyInsights,
};
