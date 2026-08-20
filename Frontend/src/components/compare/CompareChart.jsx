import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Channel Priority Metric Ordering Lists
 */
const META_PRIORITY = [
  "purchase_roas",
  "cost_per_result",
  "purchases",
  "purchase_conversion_value",
  "spend",
  "ctr",
  "cpc",
  "cpm",
  "actions_add_to_cart",
  "actions_initiate_checkout",
  "reach",
  "impressions",
  "clicks",
];

const SHOPIFY_PRIORITY = [
  "net_sales",
  "orders",
  "aov",
  "cancellation_rate",
  "gross_sales",
  "customers",
  "cod_share",
  "prepaid_share",
  "discounts",
  "cancelled_orders",
  "cod_orders",
  "prepaid_orders",
];

export const CompareChart = ({ metrics = [], isFiltered = false }) => {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(metrics) || metrics.length === 0) return null;

  // Detect channel based on metric keys present
  const isMeta = metrics.some((m) => ["purchase_roas", "cost_per_result", "spend"].includes(m.metricKey));
  const priorityList = isMeta ? META_PRIORITY : SHOPIFY_PRIORITY;

  // Filter metrics with valid percentage change or status
  const validMetrics = metrics.filter(
    (m) => m && (m.percentageChange !== null || m.performance === "New" || m.performance === "Improved" || m.performance === "Declined" || m.performance === "Increased" || m.performance === "Decreased")
  );

  if (validMetrics.length === 0) return null;

  // Sort metrics by channel priority
  const sortedMetrics = [...validMetrics].sort((a, b) => {
    const idxA = priorityList.indexOf(a.metricKey);
    const idxB = priorityList.indexOf(b.metricKey);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  // When filtered or search active: show all matching metrics. Otherwise show top 8 by default unless expanded.
  const displayMetrics = isFiltered || showAll ? sortedMetrics : sortedMetrics.slice(0, 8);
  const hasMore = !isFiltered && sortedMetrics.length > 8;

  // Max absolute percentage calculation for bar scaling
  const maxAbsPct = Math.max(
    ...sortedMetrics.map((m) => (m.percentageChange !== null ? Math.abs(m.percentageChange) : 50)),
    20
  );

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "20px 24px",
        marginBottom: "28px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
          Percentage Change Overview
        </h3>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#0A84FF",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <span>{showAll ? "Show less" : "Show all metrics"}</span>
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      <p style={{ margin: "0 0 20px 0", fontSize: "12.5px", color: "#64748B" }}>
        Visual comparison of percentage growth and decline across key performance indicators.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {displayMetrics.map((m) => {
          const pct = m.percentageChange ?? 0;
          const absPct = Math.abs(pct);
          const barWidthPct = Math.min((absPct / maxAbsPct) * 100, 100);

          const numA = Number(m.valueA) || 0;
          const numB = Number(m.valueB) || 0;

          // Color classification based strictly on raw numerical movement
          let barColor = "#64748B"; // Gray default for No Change
          if (numA > numB || m.performance === "New") {
            barColor = "#16A34A"; // Positive movement (Green)
          } else if (numA < numB) {
            barColor = "#DC2626"; // Negative movement (Red)
          } else {
            barColor = "#64748B"; // No Change (Gray)
          }

          return (
            <div key={m.metricKey || m.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px", alignItems: "center", gap: "14px" }}>
              {/* Metric Label */}
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {m.label}
              </span>

              {/* Bar Container */}
              <div
                style={{
                  height: "22px",
                  backgroundColor: "var(--color-background, #F1F5F9)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${barWidthPct}%`,
                    backgroundColor: barColor,
                    borderRadius: "6px",
                    transition: "width 0.4s ease-out",
                  }}
                />
              </div>

              {/* Percentage & Status Badge */}
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: barColor,
                  }}
                >
                  {m.performance === "New" ? "New" : `${pct > 0 ? "+" : ""}${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompareChart;
