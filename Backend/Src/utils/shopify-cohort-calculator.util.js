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
 * @param {string} [params.periodType="monthly"] - Cohort Grouping Granularity ("monthly" | "weekly")
 * @param {string} [params.retentionWindow="30d"] - Exact Observation Retention Window ("30d" | "90d")
 * @returns {Object} Structured aggregated cohort analytics response
 */
const calculateShopifyCohorts = ({ ordersData = [], periodType = "monthly", retentionWindow = "30d" } = {}) => {
  const normPeriodType = periodType === "weekly" ? "weekly" : "monthly";
  const normWindow = retentionWindow === "90d" ? "90d" : "30d";

  if (!Array.isArray(ordersData) || ordersData.length === 0) {
    return {
      periodType: normPeriodType,
      retentionWindow: normWindow,
      cohorts: [],
      summary: {
        totalCohorts: 0,
        avg30DayRetention: null,
        avg90DayRetention: normWindow === "90d" ? null : undefined,
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
  let minOrderDateMs = Infinity;
  let maxOrderDateMs = 0;

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

    if (createdTime < minOrderDateMs) minOrderDateMs = createdTime;
    if (createdTime > maxOrderDateMs) maxOrderDateMs = createdTime;

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

  const sourceStartDateMs = minOrderDateMs !== Infinity ? minOrderDateMs : 0;
  const observationEndDateMs = maxOrderDateMs > 0 ? maxOrderDateMs : Date.now();
  const observationEndDate = new Date(observationEndDateMs);

  // Left-censoring uncertainty threshold: orders within 24 hours of source start date
  const leftCensoringCutoffMs = sourceStartDateMs + (24 * 3600 * 1000);

  // 3. Determine Earliest Observed Purchase Date per Customer & Group into Cohorts
  const cohortsMap = {};

  Object.keys(customerOrdersMap).forEach((custKey) => {
    const orders = customerOrdersMap[custKey].sort((a, b) => a.timeMs - b.timeMs);
    const earliestOrder = orders[0];
    const earliestDateMs = earliestOrder.timeMs;
    const earliestDateStr = earliestOrder.createdAt;

    // Flag left-censoring history uncertainty if earliest purchase is at/near source start
    const historyUncertain = earliestDateMs <= leftCensoringCutoffMs;

    let cohortKey = "";
    let cohortLabel = "";
    let cohortStartYear = 0;
    let cohortStartMonth = 0;
    let cohortWeekStart = "";

    if (normPeriodType === "monthly") {
      const ym = getYearMonth(earliestDateStr);
      if (!ym) return;
      cohortStartYear = ym.year;
      cohortStartMonth = ym.month;
      cohortKey = `${ym.year}-${String(ym.month + 1).padStart(2, "0")}`;
      cohortLabel = formatMonthlyCohortLabel(cohortKey);
    } else {
      cohortWeekStart = getWeekStartStr(earliestDateStr);
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
        earliestObservedPurchaseDate: earliestDateStr,
        maxCustomerFirstDateMs: earliestDateMs,
        customers: {}, // custKey -> { orders, historyUncertain, T_first: earliestDateMs }
      };
    }

    if (earliestDateMs > cohortsMap[cohortKey].maxCustomerFirstDateMs) {
      cohortsMap[cohortKey].maxCustomerFirstDateMs = earliestDateMs;
    }

    cohortsMap[cohortKey].customers[custKey] = {
      orders,
      historyUncertain,
      firstPurchaseMs: earliestDateMs,
    };
  });

  // Sort Cohort Keys chronologically
  const sortedCohortKeys = Object.keys(cohortsMap).sort();
  if (sortedCohortKeys.length === 0) {
    return {
      periodType: normPeriodType,
      retentionWindow: normWindow,
      cohorts: [],
      summary: { totalCohorts: 0, avg30DayRetention: null, avg90DayRetention: normWindow === "90d" ? null : undefined, bestRetainingCohort: null, largestCohort: null },
      dataAvailability: { historicalOrders: true, earliestObservedPurchaseDates: true, revenue: true },
      limitations: ["Based on available Shopify history — No valid customer cohorts formed."],
      insights: [],
    };
  }

  // Define Observation Windows for target mode
  // 30d Mode: Window P1 (0 < Delta t <= 30.000 days)
  // 90d Mode: P1 (0 < Delta t <= 30.000d), P2 (30.000 < Delta t <= 60.000d), P3 (60.000 < Delta t <= 90.000d), Cumulative (0 < Delta t <= 90.000d)
  const windowCount = normWindow === "90d" ? 3 : 1;

  // 4. Build Aggregated Cohort Matrix with Exact Elapsed-Time Retention and Cohort-Level Maturity
  const aggregatedCohorts = sortedCohortKeys.map((cohortKey) => {
    const cData = cohortsMap[cohortKey];
    const allCustomerKeys = Object.keys(cData.customers);

    // Filter valid customers (exclude left-censored historyUncertain customers from acquisition retention denominators)
    const validCustomerKeys = allCustomerKeys.filter((k) => !cData.customers[k].historyUncertain);
    // Fallback to all customers if all in cohort are at edge, preserving count
    const activeCustomerKeys = validCustomerKeys.length > 0 ? validCustomerKeys : allCustomerKeys;
    const cohortSize = activeCustomerKeys.length;

    const maxTFirstMs = cData.maxCustomerFirstDateMs;
    const periods = [];

    if (normPeriodType === "weekly") {
      // WEEKLY MATRIX: W0 to W4 (30d mode) or W0 to W12 (90d mode)
      const maxWeeklyPeriod = normWindow === "90d" ? 12 : 4;

      // Track weekly retention buckets
      const weeklyRetainedSets = {};
      const weeklyRevenue = {};

      for (let p = 0; p <= maxWeeklyPeriod; p++) {
        weeklyRetainedSets[p] = new Set();
        weeklyRevenue[p] = 0;
      }

      activeCustomerKeys.forEach((cKey) => {
        const custData = cData.customers[cKey];
        const tFirst = custData.firstPurchaseMs;

        custData.orders.forEach((o) => {
          if (o.timeMs <= tFirst) return; // Ignore initial Day 0 purchase

          const deltaDays = (o.timeMs - tFirst) / (86400 * 1000);

          for (let p = 1; p <= maxWeeklyPeriod; p++) {
            const minDays = (p - 1) * 7.000;
            const maxDays = p * 7.000;

            if (deltaDays > minDays && deltaDays <= maxDays) {
              weeklyRetainedSets[p].add(cKey);
              weeklyRevenue[p] += o.netSales;
              break; // Count customer at most once per weekly period
            }
          }
        });
      });

      // W0 (Initial Purchase Week)
      periods.push({
        periodIndex: 0,
        periodLabel: "W0",
        retainedCustomers: cohortSize,
        retentionRate: 100.0,
        revenue: activeCustomerKeys.reduce((sum, k) => {
          const firstOrder = cData.customers[k].orders[0];
          return sum + (firstOrder ? firstOrder.netSales : 0);
        }, 0),
        isMature: true,
        status: "mature",
      });

      // W1 to W_max (Weekly Periods)
      for (let p = 1; p <= maxWeeklyPeriod; p++) {
        const isWeeklyMature = observationEndDateMs >= maxTFirstMs + (p * 7 * 86400 * 1000);

        if (isWeeklyMature) {
          const count = weeklyRetainedSets[p].size;
          const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
          periods.push({
            periodIndex: p,
            periodLabel: `W${p}`,
            retainedCustomers: count,
            retentionRate: rate,
            revenue: weeklyRevenue[p],
            isMature: true,
            status: "mature",
          });
        } else {
          periods.push({
            periodIndex: p,
            periodLabel: `W${p}`,
            retainedCustomers: null,
            retentionRate: null,
            revenue: null,
            isMature: false,
            status: "immature",
          });
        }
      }
    } else {
      // MONTHLY MATRIX: Day 0, 0-30 Days (P1), 31-60 Days (P2), 61-90 Days (P3), Cumulative 90 Days
      const is30DayMature = observationEndDateMs >= maxTFirstMs + (30 * 86400 * 1000);
      const is60DayMature = observationEndDateMs >= maxTFirstMs + (60 * 86400 * 1000);
      const is90DayMature = observationEndDateMs >= maxTFirstMs + (90 * 86400 * 1000);

      const p1RetainedSet = new Set();
      const p2RetainedSet = new Set();
      const p3RetainedSet = new Set();
      const cum90RetainedSet = new Set();

      let p1Revenue = 0;
      let p2Revenue = 0;
      let p3Revenue = 0;
      let cum90Revenue = 0;

      activeCustomerKeys.forEach((cKey) => {
        const custData = cData.customers[cKey];
        const tFirst = custData.firstPurchaseMs;

        custData.orders.forEach((o) => {
          if (o.timeMs <= tFirst) return; // Ignore initial Day 0 purchase

          const deltaDays = (o.timeMs - tFirst) / (86400 * 1000);

          // P1 Window: 0 < deltaDays <= 30.000
          if (deltaDays > 0 && deltaDays <= 30.000) {
            p1RetainedSet.add(cKey);
            p1Revenue += o.netSales;
          }

          // P2 Window: 30.000 < deltaDays <= 60.000
          if (deltaDays > 30.000 && deltaDays <= 60.000) {
            p2RetainedSet.add(cKey);
            p2Revenue += o.netSales;
          }

          // P3 Window: 60.000 < deltaDays <= 90.000
          if (deltaDays > 60.000 && deltaDays <= 90.000) {
            p3RetainedSet.add(cKey);
            p3Revenue += o.netSales;
          }

          // Cumulative 90-Day Window: 0 < deltaDays <= 90.000
          if (deltaDays > 0 && deltaDays <= 90.000) {
            cum90RetainedSet.add(cKey);
            cum90Revenue += o.netSales;
          }
        });
      });

      // Day 0 Initial Purchase Period
      periods.push({
        periodIndex: 0,
        periodLabel: "Day 0 (Initial)",
        retainedCustomers: cohortSize,
        retentionRate: 100.0,
        revenue: activeCustomerKeys.reduce((sum, k) => {
          const firstOrder = cData.customers[k].orders[0];
          return sum + (firstOrder ? firstOrder.netSales : 0);
        }, 0),
        isMature: true,
        status: "mature",
      });

      // 0–30 Days Period (P1)
      if (is30DayMature) {
        const count = p1RetainedSet.size;
        const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
        periods.push({
          periodIndex: 1,
          periodLabel: normWindow === "90d" ? "0–30 Days (P1)" : "0–30 Days",
          retainedCustomers: count,
          retentionRate: rate,
          revenue: p1Revenue,
          isMature: true,
          status: "mature",
        });
      } else {
        periods.push({
          periodIndex: 1,
          periodLabel: normWindow === "90d" ? "0–30 Days (P1)" : "0–30 Days",
          retainedCustomers: null,
          retentionRate: null,
          revenue: null,
          isMature: false,
          status: "immature",
        });
      }

      if (normWindow === "90d") {
        // 31–60 Days Period (P2)
        if (is60DayMature) {
          const count = p2RetainedSet.size;
          const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
          periods.push({
            periodIndex: 2,
            periodLabel: "31–60 Days (P2)",
            retainedCustomers: count,
            retentionRate: rate,
            revenue: p2Revenue,
            isMature: true,
            status: "mature",
          });
        } else {
          periods.push({
            periodIndex: 2,
            periodLabel: "31–60 Days (P2)",
            retainedCustomers: null,
            retentionRate: null,
            revenue: null,
            isMature: false,
            status: "immature",
          });
        }

        // 61–90 Days Period (P3)
        if (is90DayMature) {
          const count = p3RetainedSet.size;
          const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
          periods.push({
            periodIndex: 3,
            periodLabel: "61–90 Days (P3)",
            retainedCustomers: count,
            retentionRate: rate,
            revenue: p3Revenue,
            isMature: true,
            status: "mature",
          });
        } else {
          periods.push({
            periodIndex: 3,
            periodLabel: "61–90 Days (P3)",
            retainedCustomers: null,
            retentionRate: null,
            revenue: null,
            isMature: false,
            status: "immature",
          });
        }

        // Cumulative 90 Days Period
        if (is90DayMature) {
          const count = cum90RetainedSet.size;
          const rate = cohortSize > 0 ? Number(((count / cohortSize) * 100).toFixed(1)) : 0;
          periods.push({
            periodIndex: 4,
            periodLabel: "Cumulative 90 Days",
            retainedCustomers: count,
            retentionRate: rate,
            revenue: cum90Revenue,
            isMature: true,
            status: "mature",
          });
        } else {
          periods.push({
            periodIndex: 4,
            periodLabel: "Cumulative 90 Days",
            retainedCustomers: null,
            retentionRate: null,
            revenue: null,
            isMature: false,
            status: "immature",
          });
        }
      }
    }

    return {
      cohortKey,
      cohortLabel: cData.cohortLabel,
      cohortSize,
      m0Revenue: periods[0].revenue,
      periods,
    };
  });

  // 5. Calculate Mode-Specific Summary Metrics (Strictly using MATURE cohorts ONLY)
  const totalCohorts = aggregatedCohorts.length;

  let avg30DayRetention = null;
  let avg90DayRetention = normWindow === "90d" ? null : undefined;
  let targetPeriodIndex = 1;

  if (normPeriodType === "weekly") {
    // Weekly Mode Summary KPIs
    // W1 Retention average across mature W1 cohorts
    const w1Rates = aggregatedCohorts
      .map((c) => c.periods.find((p) => p.periodIndex === 1))
      .filter((p) => p && p.isMature === true && p.retentionRate !== null)
      .map((p) => p.retentionRate);

    avg30DayRetention = w1Rates.length > 0
      ? Number((w1Rates.reduce((a, b) => a + b, 0) / w1Rates.length).toFixed(1))
      : null;

    if (normWindow === "90d") {
      // W12 Retention average across mature W12 cohorts
      targetPeriodIndex = 12;
      const w12Rates = aggregatedCohorts
        .map((c) => c.periods.find((p) => p.periodIndex === 12))
        .filter((p) => p && p.isMature === true && p.retentionRate !== null)
        .map((p) => p.retentionRate);

      avg90DayRetention = w12Rates.length > 0
        ? Number((w12Rates.reduce((a, b) => a + b, 0) / w12Rates.length).toFixed(1))
        : null;
    } else {
      targetPeriodIndex = 4; // W4 for 30d weekly mode
    }
  } else {
    // Monthly Mode Summary KPIs
    // Average 30-Day Retention across MATURE 30-day cohorts
    const rates30d = aggregatedCohorts
      .map((c) => c.periods.find((p) => p.periodIndex === 1))
      .filter((p) => p && p.isMature === true && p.retentionRate !== null)
      .map((p) => p.retentionRate);

    avg30DayRetention = rates30d.length > 0
      ? Number((rates30d.reduce((a, b) => a + b, 0) / rates30d.length).toFixed(1))
      : null;

    if (normWindow === "90d") {
      targetPeriodIndex = 4; // Cumulative 90 days
      const rates90d = aggregatedCohorts
        .map((c) => c.periods.find((p) => p.periodIndex === 4))
        .filter((p) => p && p.isMature === true && p.retentionRate !== null)
        .map((p) => p.retentionRate);

      avg90DayRetention = rates90d.length > 0
        ? Number((rates90d.reduce((a, b) => a + b, 0) / rates90d.length).toFixed(1))
        : null;
    }
  }

  // Top Retaining Cohort: Only MATURE target-period cohorts may compete!
  let bestRetainingCohort = null;
  let bestRate = -1;

  aggregatedCohorts.forEach((c) => {
    const targetPeriod = c.periods.find((p) => p.periodIndex === targetPeriodIndex);
    if (targetPeriod && targetPeriod.isMature === true && targetPeriod.retentionRate !== null && targetPeriod.retentionRate > bestRate) {
      bestRate = targetPeriod.retentionRate;
      bestRetainingCohort = `${c.cohortLabel} (${targetPeriod.retentionRate}%)`;
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

  if (avg30DayRetention !== null) {
    insights.push({
      id: "avg_30d_retention_insight",
      type: avg30DayRetention >= 15 ? "positive" : "warning",
      title: normPeriodType === "weekly" ? "Average Week 1 Retention" : "Average 30-Day Retention",
      description: `Across mature cohorts, an average of ${avg30DayRetention}% of customers returned to place a repeat purchase in ${normPeriodType === "weekly" ? "Week 1" : "30 elapsed days"}.`,
    });
  }

  if (avg90DayRetention !== undefined && avg90DayRetention !== null) {
    insights.push({
      id: "avg_90d_retention_insight",
      type: avg90DayRetention >= 25 ? "positive" : "warning",
      title: normPeriodType === "weekly" ? "Average Week 12 Retention" : "Average 90-Day Cumulative Retention",
      description: `Across mature cohorts, an average of ${avg90DayRetention}% of customers returned to place a repeat purchase in ${normPeriodType === "weekly" ? "Week 12" : "90 elapsed days"}.`,
    });
  }

  if (bestRetainingCohort !== null) {
    insights.push({
      id: "best_cohort_insight",
      type: "positive",
      title: "Top Retaining Customer Cohort",
      description: `${bestRetainingCohort} demonstrated the highest repeat customer retention rate in the selected observation window among mature cohorts.`,
    });
  }

  if (normWindow === "90d" && (avg90DayRetention === null || avg90DayRetention === undefined)) {
    insights.push({
      id: "90d_maturity_notice",
      type: "neutral",
      title: "Maturity Notice",
      description: `Long-term retention cannot be computed for recent cohorts because sufficient observation time has not yet fully elapsed since the latest acquisition in those cohorts.`,
    });
  }

  return {
    periodType: normPeriodType,
    retentionWindow: normWindow,
    cohorts: aggregatedCohorts,
    summary: {
      totalCohorts,
      avg30DayRetention,
      avg90DayRetention,
      bestRetainingCohort,
      largestCohort,
    },
    dataAvailability: {
      historicalOrders: true,
      earliestObservedPurchaseDates: true,
      revenue: true,
    },
    limitations: [
      `Earliest Observed Purchase Cohorts: Retention is measured over ${normPeriodType === "weekly" ? "weekly" : "exact elapsed-day"} observation windows following a customer's earliest observed purchase in Shopify history.`,
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
