import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceAgePerformance Component.
 * Displays Age Group Performance with an interactive metric selector:
 * [ Spend ] [ Add to Cart ] [ Checkout Initiated ] [ Purchases ] [ Cost per Result ] [ Revenue ] [ ROAS ]
 * 
 * Sorting Rule:
 * - Cost per Result sorts LOW -> HIGH (#1 = lowest cost per result)
 * - All other metrics sort HIGH -> LOW (#1 = highest value)
 */
export const AudienceAgePerformance = ({ ageGroupData = [], currency = "INR" }) => {
  const [metric, setMetric] = useState("spend"); // "spend" | "add_to_cart" | "initiate_checkout" | "purchases" | "cpr" | "revenue" | "roas"

  const metricOptions = [
    { id: "spend", label: "Spend" },
    { id: "add_to_cart", label: "Add to Cart" },
    { id: "initiate_checkout", label: "Checkout Initiated" },
    { id: "purchases", label: "Purchases" },
    { id: "cpr", label: "Cost per Result" },
    { id: "revenue", label: "Revenue" },
    { id: "roas", label: "ROAS" },
  ];

  const getMetricVal = (row, metricKey) => {
    if (!row) return null;
    if (metricKey === "cpr") {
      const p = row.purchases || 0;
      const s = row.spend || 0;
      return p > 0 ? s / p : null;
    }
    if (metricKey === "roas") {
      const s = row.spend || 0;
      const r = row.revenue || 0;
      return s > 0 ? r / s : null;
    }
    return row[metricKey] ?? 0;
  };

  const formatDisplayVal = (val, metricKey) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    const num = Number(val);
    if (metricKey === "spend" || metricKey === "revenue" || metricKey === "cpr") {
      return formatCurrency(num, currency);
    }
    if (metricKey === "roas") {
      return `${num.toFixed(2)}x`;
    }
    if (metricKey === "ctr") {
      return formatPercentage(num);
    }
    return formatNumber(num);
  };

  // Sort age group data based on metric type
  const sortedAgeData = [...ageGroupData].sort((a, b) => {
    const valA = getMetricVal(a, metric);
    const valB = getMetricVal(b, metric);

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;

    // Exception: Cost per Result sorts LOW -> HIGH (#1 = lowest cost)
    if (metric === "cpr") {
      return valA - valB;
    }
    // Standard: Volume/Value metrics sort HIGH -> LOW (#1 = highest value)
    return valB - valA;
  });

  const validVals = sortedAgeData.map((d) => getMetricVal(d, metric)).filter((v) => v !== null && !isNaN(Number(v)));
  const maxVal = validVals.length > 0 ? Math.max(...validVals.map(Number), 1) : 1;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-card, 16px)",
        border: "1px solid var(--color-border, #E8EAED)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
      }}
    >
      {/* Section Header + Metric Selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
            Age Group Performance
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Performance ranking across age brackets ({metric === "cpr" ? "Sorted Low → High" : "Sorted High → Low"})
          </span>
        </div>

        {/* Metric Selector Pills */}
        <div style={{ display: "flex", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", padding: "3px", border: "1px solid var(--color-border, #E8EAED)", gap: "2px", flexWrap: "wrap" }}>
          {metricOptions.map((m) => {
            const active = metric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                style={{
                  padding: "5px 12px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  color: active ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  fontWeight: active ? "700" : "500",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: active ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Age Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {sortedAgeData.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.85rem" }}>
            No age group data available.
          </div>
        ) : (
          sortedAgeData.map((row, idx) => {
            const rawVal = getMetricVal(row, metric);
            const numVal = Number(rawVal) || 0;
            const pctMax = rawVal !== null ? Math.min(100, Math.max(3, (numVal / maxVal) * 100)) : 0;

            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0A84FF", width: "18px" }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
                      {row.age}
                    </span>
                  </div>

                  <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>
                    {formatDisplayVal(rawVal, metric)}
                  </strong>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: "10px",
                    width: "100%",
                    backgroundColor: "var(--color-surface, #F7F9FC)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border, #E8EAED)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pctMax}%`,
                      backgroundColor: idx === 0 ? "#0A84FF" : idx === 1 ? "rgba(10, 132, 255, 0.8)" : "rgba(10, 132, 255, 0.55)",
                      borderRadius: "999px",
                      transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AudienceAgePerformance;
