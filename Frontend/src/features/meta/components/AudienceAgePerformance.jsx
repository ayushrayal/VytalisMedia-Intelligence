import React, { useState, useEffect } from "react";
import { formatAudienceMetricValue } from "../../../config/audienceMetrics.js";
import { formatNumber } from "../../../utils/formatNumber.js";

/**
 * AudienceAgePerformance Component.
 * Visualizes age group performance rankings using dynamic metric configuration.
 * Cost per Result ranks LOW -> HIGH (#1 = lowest CPR). All other metrics rank HIGH -> LOW.
 */
export const AudienceAgePerformance = ({
  ageGroupData = [],
  enabledMetrics = [],
  currency = "INR",
}) => {
  // Filter metrics that support age group breakdown
  const ageMetrics = enabledMetrics.filter((m) => m && m.supportsAge);

  const [metric, setMetric] = useState("spend");

  // Keep metric selection valid if active enabled metrics change
  useEffect(() => {
    if (ageMetrics.length > 0) {
      const exists = ageMetrics.some((m) => m.key === metric);
      if (!exists) {
        setMetric(ageMetrics[0].key);
      }
    }
  }, [ageMetrics, metric]);

  const activeMetricObj = ageMetrics.find((m) => m.key === metric) || ageMetrics[0] || null;

  const getMetricVal = (item) => {
    if (!item) return null;
    if (metric === "cpr") {
      return item.purchases > 0 ? Number(item.spend || 0) / Number(item.purchases) : null;
    }
    if (metric === "roas") {
      return item.spend > 0 ? Number(item.revenue || 0) / Number(item.spend) : null;
    }
    return item[metric] !== undefined && item[metric] !== null ? Number(item[metric]) : null;
  };

  // Sort age group records based on active metric
  // Exception Rule: Cost per Result sorts LOW -> HIGH (#1 = lowest cost).
  const sortedAgeData = [...ageGroupData].sort((a, b) => {
    const valA = getMetricVal(a);
    const valB = getMetricVal(b);

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1; // Put nulls at end
    if (valB === null) return -1;

    if (metric === "cpr") {
      return valA - valB; // LOW to HIGH
    }
    return valB - valA; // HIGH to LOW
  });

  // Calculate max metric value for relative bar scaling
  let maxMetricVal = 1;
  ageGroupData.forEach((item) => {
    const v = getMetricVal(item);
    if (v !== null && v > maxMetricVal) maxMetricVal = v;
  });

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-card, 12px)",
        border: "1px solid var(--color-border, #E5E7EB)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
            Age Group Performance
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Age cohort rankings · {metric === "cpr" ? "Sorted Low → High (#1 = lowest acquisition cost)" : "Sorted High → Low"}
          </span>
        </div>

        {/* Dynamic Metric Selector Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", padding: "3px", border: "1px solid var(--color-border, #E8EAED)", gap: "2px" }}>
          {ageMetrics.map((m) => {
            const active = metric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  color: active ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  fontWeight: active ? "700" : "500",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: active ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Age Group Ranking Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sortedAgeData.length === 0 ? (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94A3B8)", padding: "12px 0" }}>
            No age group performance data available.
          </div>
        ) : (
          sortedAgeData.map((item, idx) => {
            const val = getMetricVal(item);
            const formattedVal = activeMetricObj
              ? formatAudienceMetricValue(val, activeMetricObj.format, currency)
              : formatNumber(val || 0);

            const widthPct = val !== null && val > 0 ? Math.min(100, Math.max(3, (val / maxMetricVal) * 100)) : 0;
            const isTopRanked = idx === 0;

            return (
              <div
                key={item.age}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Rank Badge */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: isTopRanked ? "rgba(10, 132, 255, 0.12)" : "var(--color-surface-subtle, #F1F5F9)",
                    color: isTopRanked ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  #{idx + 1}
                </div>

                {/* Age Group Label */}
                <div style={{ width: "65px", fontWeight: "650", fontSize: "0.85rem", color: "var(--color-text-primary, #0F172A)", flexShrink: 0 }}>
                  {item.age}
                </div>

                {/* Progress Bar Container */}
                <div style={{ flex: 1, height: "8px", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      backgroundColor: isTopRanked ? "#0A84FF" : "rgba(10, 132, 255, 0.45)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Formatted Metric Value */}
                <div
                  style={{
                    width: "110px",
                    textAlign: "right",
                    fontWeight: isTopRanked ? "700" : "600",
                    fontSize: "0.85rem",
                    color: isTopRanked ? "#0A84FF" : "var(--color-text-primary, #0F172A)",
                    flexShrink: 0,
                  }}
                >
                  {formattedVal}
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
