import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceAgePerformance Component.
 * Displays Age Group Performance with an interactive metric selector:
 * [ Spend ] [ Reach ] [ Impressions ] [ Clicks ] [ CTR ] [ CPC ]
 */
export const AudienceAgePerformance = ({ ageGroupData = [], currency = "INR" }) => {
  const [metric, setMetric] = useState("spend"); // "spend" | "reach" | "impressions" | "clicks" | "ctr" | "cpc"

  // Standard ordered age brackets
  const ageOrder = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];

  // Sort/normalize data according to ageOrder or metric value
  const sortedAgeData = [...ageGroupData].sort((a, b) => {
    const valA = a[metric] || 0;
    const valB = b[metric] || 0;
    return valB - valA;
  });

  const maxVal = Math.max(...sortedAgeData.map((d) => d[metric] || 0), 1);
  const totalVal = sortedAgeData.reduce((sum, d) => sum + (d[metric] || 0), 0);

  const getFormattedValue = (val, metricKey) => {
    if (metricKey === "spend" || metricKey === "cpc") return formatCurrency(val, currency);
    if (metricKey === "ctr") return formatPercentage(val);
    return formatNumber(val);
  };

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
            Performance metrics distribution across age brackets
          </span>
        </div>

        {/* Metric Selector Pills */}
        <div style={{ display: "flex", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", padding: "3px", border: "1px solid var(--color-border, #E8EAED)", gap: "2px", flexWrap: "wrap" }}>
          {[
            { id: "spend", label: "Spend" },
            { id: "reach", label: "Reach" },
            { id: "impressions", label: "Impressions" },
            { id: "clicks", label: "Clicks" },
            { id: "ctr", label: "CTR" },
            { id: "cpc", label: "CPC" },
          ].map((m) => {
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
            const rawVal = row[metric] || 0;
            const pctMax = Math.min(100, Math.max(3, (rawVal / maxVal) * 100));
            const pctTotal = totalVal > 0 && metric !== "ctr" && metric !== "cpc" ? ((rawVal / totalVal) * 100).toFixed(1) : null;

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

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {pctTotal && (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)" }}>
                        {pctTotal}% share
                      </span>
                    )}
                    <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>
                      {getFormattedValue(rawVal, metric)}
                    </strong>
                  </div>
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
