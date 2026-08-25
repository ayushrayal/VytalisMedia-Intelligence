/**
 * Shopify Customer Cohort Calculator Utility for Vytalis Intelligence.
 * Pure mathematical aggregation module for Customer Cohort Analysis & Retention Matrix (P1G).
 *
 * ABSOLUTE DATA INTEGRITY & MATURITY RULES:
 * 1. Customer Identity: order_customer_id -> fallback to order_email (trim + lowercase) when missing.
 * 2. Earliest Observed Purchase Date: earliest order_created_at per customer in available dataset.
 * 3. Distinct Customer Deduplication: 1 customer counted once per retention period regardless of order count.
 * 4. Distinct Order Deduplication: Deduplicated by order_id to prevent line-item duplication.
 * 5. Cohort Period Maturity: A retention period (M1, M2, M3 / W1, W2) is mature IF AND ONLY IF the
 *    complete calendar month/week for that period has fully elapsed before the observation end date.
 *    Partially elapsed periods return isMature: false and null rates -> rendered as "Insufficient Historical Data".
 * 6. Canonical Revenue: Uses order_net_sales per order.
 */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Returns year and month index (0-indexed) from an ISO date string or Date object.
 */
const getYearMonth = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
};

/**
 * Calculates calendar month diff between two dates (date2 - date1).
 */
const getMonthDiff = (year1, month1, year2, month2) => {
  return (year2 - year1) * 12 + (month2 - month1);
};

/**
 * Gets ISO week start (Monday) date string YYYY-MM-DD.
 */
const getWeekStartStr = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dayStr = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dayStr}`;
};

/**
 * Calculates week diff between two week start dates.
 */
const getWeekDiff = (weekStartStr1, weekStartStr2) => {
  const d1 = new Date(weekStartStr1);
  const d2 = new Date(weekStartStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
};

/**
 * Checks if a monthly cohort period (pIdx) is fully mature relative to observationEndDate.
 * M0 (pIdx 0) is always mature when cohort exists.
 * M1, M2, M3... require that the complete target calendar month has fully elapsed.
 */
const isMonthlyPeriodMature = (cohortStartYear, cohortStartMonth, pIdx, observationEndDate) => {
  if (pIdx === 0) return true; // M0 is cohort creation month

  const totalTargetMonth = cohortStartMonth + pIdx;
  const targetYear = cohortStartYear + Math.floor(totalTargetMonth / 12);
  const targetMonth = totalTargetMonth % 12;

  // End of target month at 23:59:59.999 UTC (day 0 of month + 1)
  const targetMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

  return observationEndDate.getTime() >= targetMonthEnd.getTime();
};

/**
 * Checks if a weekly cohort period (pIdx) is fully mature relative to observationEndDate.
 * W0 (pIdx 0) is always mature when cohort week exists.
 * W1, W2... require that the complete target week (Monday to Sunday) has fully elapsed.
 */
const isWeeklyPeriodMature = (cohortWeekStartStr, pIdx, observationEndDate) => {
  if (pIdx === 0) return true; // W0 is cohort creation week

  const wStart = new Date(cohortWeekStartStr);
  if (isNaN(wStart.getTime())) return false;

  // Target week Monday + pIdx * 7 days
  const targetWeekStart = new Date(wStart.getTime() + pIdx * 7 * 24 * 60 * 60 * 1000);
  // Target week Sunday end at 23:59:59.999 UTC (start + 6 days + 23:59:59.999)
  const targetWeekEnd = new Date(targetWeekStart.getTime() + (6 * 24 * 60 * 60 * 1000) + (23 * 3600 * 1000) + (59 * 60 * 1000) + 999);

  return observationEndDate.getTime() >= targetWeekEnd.getTime();
};

/**
 * Formats a monthly cohort key ("2026-05") into human-readable label ("May 2026").
 */
const formatMonthlyCohortLabel = (cohortKey) => {
  const [yearStr, monthStr] = cohortKey.split("-");
  const mIdx = Number(monthStr) - 1;
  if (mIdx >= 0 && mIdx < 12) {
    return `${MONTH_NAMES[mIdx]} ${yearStr}`;
  }
  return cohortKey;
};

/**
 * Formats a weekly cohort key ("2026-05-25") into human-readable label ("Wk of May 25, 2026").
 */
const formatWeeklyCohortLabel = (weekStartStr) => {
  const d = new Date(weekStartStr);
  if (isNaN(d.getTime())) return weekStartStr;
  const m = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const y = d.getUTCFullYear();
  return `Wk of ${m} ${day}, ${y}`;
};

/**
 * Main Cohort Calculation Function.
 *
 * @param {Object} params
 * @param {Array} params.ordersData - Raw order records fetched from Windsor connector
 * @param {string} params.periodType - "monthly" | "weekly"
 * @returns {Object} Structured aggregated cohort analytics response
 */
const calculateShopifyCohorts = ({ ordersData = [], periodType = "monthly" } = {}) => {
  const normPeriodType = periodType === "weekly" ? "weekly" : "monthly";

  if (!Array.isArray(ordersData) || ordersData.length === 0) {
    return {
      periodType: normPeriodType,
      cohorts: [],
      summary: {
        totalCohorts: 0,
        avgM1Retention: null,
        avgM3Retention: null,
        bestRetainingCohort: null,
        largestCohort: null,
      },
      dataAvailability: {
        historicalOrders: false,
        earliestObservedPurchaseDates: false,
        revenue: false,
      },
      limitations: [
        "Based on available Shopify history — No order records were found for the requested period.",
      ],
      insights: [],
    };
  }

  // 1. Deduplicate Orders by order_id
  const orderMap = {};
  ordersData.forEach((row) => {
    const oId = row.order_id || row.order_name;
    if (oId !== null && oId !== undefined && String(oId).trim() !== "") {
      const cleanId = String(oId).trim();
      if (!orderMap[cleanId]) {
        orderMap[cleanId] = row;
      }
    }
  });

  const uniqueOrders = Object.values(orderMap);

  // 2. Resolve Customer Identity & Group Orders per Customer
  // Identity Priority: order_customer_id -> fallback to order_email.trim().toLowerCase()
  const customerOrdersMap = {};
  let maxOrderDateMs = 0;

  uniqueOrders.forEach((order) => {
    const custId = order.order_customer_id;
    const email = order.order_email;

    let custKey = null;
    if (custId !== null && custId !== undefined && String(custId).trim() !== "") {
      custKey = `id:${String(custId).trim()}`;
    } else if (email !== null && email !== undefined && String(email).trim() !== "") {
      custKey = `email:${String(email).trim().toLowerCase()}`;
    }

    if (!custKey) return; // Skip invalid records missing both identifiers

    const createdTime = new Date(order.order_created_at).getTime();
    if (isNaN(createdTime)) return;

    if (createdTime > maxOrderDateMs) {
      maxOrderDateMs = createdTime;
    }

    if (!customerOrdersMap[custKey]) {
      customerOrdersMap[custKey] = [];
    }

    customerOrdersMap[custKey].push({
      orderId: order.order_id || order.order_name,
      createdAt: order.order_created_at,
      timeMs: createdTime,
      netSales: Number(order.order_net_sales !== undefined && order.order_net_sales !== null ? order.order_net_sales : order.order_total_price || 0),
    });
  });

  const observationEndDate = maxOrderDateMs > 0 ? new Date(maxOrderDateMs) : new Date();

  // 3. Determine Earliest Observed Purchase Date per Customer & Group into Cohorts
  const cohortsMap = {};

  Object.keys(customerOrdersMap).forEach((custKey) => {
    const orders = customerOrdersMap[custKey].sort((a, b) => a.timeMs - b.timeMs);
    const earliestOrder = orders[0];
    const earliestDate = earliestOrder.createdAt;

    let cohortKey = "";
    let cohortLabel = "";
    let cohortStartYear = 0;
    let cohortStartMonth = 0;
    let cohortWeekStart = "";

    if (normPeriodType === "monthly") {
      const ym = getYearMonth(earliestDate);
      if (!ym) return;
      cohortStartYear = ym.year;
      cohortStartMonth = ym.month;
      cohortKey = `${ym.year}-${String(ym.month + 1).padStart(2, "0")}`;
      cohortLabel = formatMonthlyCohortLabel(cohortKey);
    } else {
      cohortWeekStart = getWeekStartStr(earliestDate);
      if (!cohortWeekStart) return;
      cohortKey = cohortWeekStart;
      cohortLabel = formatWeeklyCohortLabel(cohortWeekStart);
    }

    if (!cohortsMap[cohortKey]) {
      cohortsMap[cohortKey] = {
        cohortKey,
        cohortLabel,
        cohortStartYear,
        cohortStartMonth,
        cohortWeekStart,
        earliestObservedPurchaseDate: earliestDate,
        customers: {}, // custKey -> customer order array
      };
    }

    cohortsMap[cohortKey].customers[custKey] = orders;
  });

  // Sort Cohort Keys chronologically
  const sortedCohortKeys = Object.keys(cohortsMap).sort();
  if (sortedCohortKeys.length === 0) {
    return {
      periodType: normPeriodType,
      cohorts: [],
      summary: { totalCohorts: 0, avgM1Retention: null, avgM3Retention: null, bestRetainingCohort: null, largestCohort: null },
      dataAvailability: { historicalOrders: true, earliestObservedPurchaseDates: true, revenue: true },
      limitations: ["Based on available Shopify history — No valid customer cohorts formed."],
      insights: [],
    };
  }

  // Maximum period index to render in the table (e.g. M0 to M4 or W0 to W8)
  const maxPeriodIndex = normPeriodType === "monthly" ? 4 : 8;

  // 4. Build Aggregated Cohort Matrix with Strict Complete-Calendar-Period Maturity Rules
  const aggregatedCohorts = sortedCohortKeys.map((cohortKey) => {
    const cData = cohortsMap[cohortKey];
    const customerKeys = Object.keys(cData.customers);
    const cohortSize = customerKeys.length;

    // Initialize period buckets
    const periodBuckets = {};
    for (let pIdx = 0; pIdx <= maxPeriodIndex; pIdx++) {
      let mature = false;
      if (normPeriodType === "monthly") {
        mature = isMonthlyPeriodMature(cData.cohortStartYear, cData.cohortStartMonth, pIdx, observationEndDate);
      } else {
        mature = isWeeklyPeriodMature(cData.cohortWeekStart, pIdx, observationEndDate);
      }

      periodBuckets[pIdx] = {
        periodIndex: pIdx,
        retainedCustomerSet: new Set(),
        revenue: 0,
        isMature: mature,
      };
    }

    // Process all orders for cohort customers
    customerKeys.forEach((cKey) => {
      const cOrders = cData.customers[cKey];

      cOrders.forEach((o) => {
        let pIdx = -1;
        if (normPeriodType === "monthly") {
          const ym = getYearMonth(o.createdAt);
          if (ym) {
            pIdx = getMonthDiff(cData.cohortStartYear, cData.cohortStartMonth, ym.year, ym.month);
          }
        } else {
          const wStart = getWeekStartStr(o.createdAt);
          if (wStart) {
            pIdx = getWeekDiff(cData.cohortWeekStart, wStart);
          }
        }

        if (pIdx >= 0 && pIdx <= maxPeriodIndex) {
          periodBuckets[pIdx].retainedCustomerSet.add(cKey);
          periodBuckets[pIdx].revenue += o.netSales;
        }
      });
    });

    // Format periods array for output
    const periods = [];
    for (let pIdx = 0; pIdx <= maxPeriodIndex; pIdx++) {
      const bucket = periodBuckets[pIdx];

      if (pIdx === 0) {
        // M0 / W0 is 100% by definition when cohort exists
        periods.push({
          periodIndex: 0,
          periodLabel: normPeriodType === "monthly" ? "M0" : "W0",
          retainedCustomers: cohortSize,
          retentionRate: 100.0,
          revenue: bucket.revenue,
          isMature: true,
          status: "mature",
        });
      } else if (bucket.isMature) {
        // MATURE PERIOD: calculate exact retention rate & revenue
        const count = bucket.retainedCustomerSet.size;
        const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
        periods.push({
          periodIndex: pIdx,
          periodLabel: normPeriodType === "monthly" ? `M${pIdx}` : `W${pIdx}`,
          retainedCustomers: count,
          retentionRate: rate,
          revenue: bucket.revenue,
          isMature: true,
          status: "mature",
        });
      } else {
        // IMMATURE PERIOD: Must state Insufficient Historical Data (never 0% or ₹0.00)
        periods.push({
          periodIndex: pIdx,
          periodLabel: normPeriodType === "monthly" ? `M${pIdx}` : `W${pIdx}`,
          retainedCustomers: null,
          retentionRate: null,
          revenue: null,
          isMature: false,
          status: "immature",
        });
      }
    }

    return {
      cohortKey,
      cohortLabel: cData.cohortLabel,
      cohortSize,
      m0Revenue: periodBuckets[0].revenue,
      periods,
    };
  });

  // 5. Calculate Summary Metrics (Strictly using MATURE cohorts only)
  const totalCohorts = aggregatedCohorts.length;

  // Average M1 / W1 Retention among MATURE cohorts ONLY
  const m1Rates = aggregatedCohorts
    .map((c) => c.periods.find((p) => p.periodIndex === 1))
    .filter((p) => p && p.isMature === true && p.retentionRate !== null)
    .map((p) => p.retentionRate);

  const avgM1Retention = m1Rates.length > 0
    ? Number((m1Rates.reduce((a, b) => a + b, 0) / m1Rates.length).toFixed(1))
    : null;

  // Average M3 / W3 Retention among MATURE cohorts ONLY
  const m3Rates = aggregatedCohorts
    .map((c) => c.periods.find((p) => p.periodIndex === 3))
    .filter((p) => p && p.isMature === true && p.retentionRate !== null)
    .map((p) => p.retentionRate);

  const avgM3Retention = m3Rates.length > 0
    ? Number((m3Rates.reduce((a, b) => a + b, 0) / m3Rates.length).toFixed(1))
    : null;

  // Top Retaining Cohort: Only MATURE M1 cohorts may compete!
  let bestRetainingCohort = null;
  let bestRate = -1;

  aggregatedCohorts.forEach((c) => {
    const m1 = c.periods.find((p) => p.periodIndex === 1);
    if (m1 && m1.isMature === true && m1.retentionRate !== null && m1.retentionRate > bestRate) {
      bestRate = m1.retentionRate;
      bestRetainingCohort = `${c.cohortLabel} (${m1.retentionRate}%)`;
    }
  });

  // Largest Cohort by original size
  let largestCohortObj = null;
  aggregatedCohorts.forEach((c) => {
    if (!largestCohortObj || c.cohortSize > largestCohortObj.cohortSize) {
      largestCohortObj = c;
    }
  });

  const largestCohort = largestCohortObj ? `${largestCohortObj.cohortLabel} (${largestCohortObj.cohortSize} buyers)` : null;

  // 6. Deterministic Business Insights (Using MATURE cohorts ONLY)
  const insights = [];

  if (avgM1Retention !== null) {
    insights.push({
      id: "avg_m1_retention_insight",
      type: avgM1Retention >= 15 ? "positive" : "warning",
      title: `Average ${normPeriodType === "monthly" ? "Month 1" : "Week 1"} Retention`,
      description: `Across mature cohorts, an average of ${avgM1Retention}% of customers returned to place a second order in ${normPeriodType === "monthly" ? "Month 1" : "Week 1"}.`,
    });
  }

  if (bestRetainingCohort !== null) {
    insights.push({
      id: "best_cohort_insight",
      type: "positive",
      title: "Top Retaining Customer Cohort",
      description: `${bestRetainingCohort} demonstrated the highest repeat customer retention rate in period 1 among mature cohorts.`,
    });
  }

  if (m3Rates.length === 0) {
    insights.push({
      id: "m3_data_limitation_notice",
      type: "neutral",
      title: "Historical Depth Notice",
      description: `Long-term retention (period 3+) cannot be computed for recent cohorts because historical observation has not yet fully matured.`,
    });
  }

  return {
    periodType: normPeriodType,
    cohorts: aggregatedCohorts,
    summary: {
      totalCohorts,
      avgM1Retention,
      avgM3Retention,
      bestRetainingCohort,
      largestCohort,
    },
    dataAvailability: {
      historicalOrders: true,
      earliestObservedPurchaseDates: true,
      revenue: true,
    },
    limitations: [
      "Based on available Shopify history — Historical data available: approximately 90 days.",
    ],
    insights,
  };
};

module.exports = {
  calculateShopifyCohorts,
  formatMonthlyCohortLabel,
  formatWeeklyCohortLabel,
  isMonthlyPeriodMature,
  isWeeklyPeriodMature,
};
