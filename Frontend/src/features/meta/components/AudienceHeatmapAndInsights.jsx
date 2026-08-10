import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceHeatmapAndInsights Component.
 * Contains:
 * 1. Age + Gender Matrix Heatmap with metric selector
 * 2. Top Performing Audience Card
 * 3. Rule-based Audience Insights generated strictly from payload data
 */
export const AudienceHeatmapAndInsights = ({
  matrixData = [],
  topSegment = null,
  insights = [],
  currency = "INR",
}) => {
  const [metric, setMetric] = useState("spend"); // "spend" | "reach" | "clicks" | "ctr"

  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const genders = ["male", "female"];

  // Find max cell value in matrix for metric shading scale
  let maxCellValue = 1;
  matrixData.forEach((row) => {
    const val = row[metric] || 0;
    if (val > maxCellValue) maxCellValue = val;
  });

  const getCellData = (age, gender) => {
    return (
      matrixData.find(
        (r) =>
          String(r.age || "").trim() === age &&
          String(r.gender || "").trim().toLowerCase() === gender
      ) || null
    );
  };

  const getFormattedValue = (val, metricKey) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    if (metricKey === "spend") return formatCurrency(val, currency);
    if (metricKey === "ctr") return formatPercentage(val);
    return formatNumber(val);
  };

  const getIntensityColor = (value) => {
    if (!value || value <= 0) return "var(--color-surface, #F7F9FC)";
    const ratio = Math.min(1, Math.max(0.1, value / maxCellValue));
    // Color scale: soft light blue to vibrant Vytalis primary blue #0A84FF
    if (ratio > 0.75) return "#0A84FF";
    if (ratio > 0.5) return "#3B9EFF";
    if (ratio > 0.25) return "#7CC0FF";
    return "#D0E7FF";
  };

  const getTextColor = (value) => {
    if (!value || value <= 0) return "var(--color-text-muted, #94A3B8)";
    const ratio = Math.min(1, Math.max(0.1, value / maxCellValue));
    return ratio > 0.5 ? "#FFFFFF" : "#111827";
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
      }}
    >
      {/* 1. AGE + GENDER HEATMAP */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          gridColumn: "span 2",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Demographic Heatmap
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Intensity matrix across age and gender segments
            </span>
          </div>

          {/* Metric Selector Pills */}
          <div style={{ display: "flex", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", padding: "3px", border: "1px solid var(--color-border, #E8EAED)", gap: "2px" }}>
            {[
              { id: "spend", label: "Spend" },
              { id: "reach", label: "Reach" },
              { id: "clicks", label: "Clicks" },
              { id: "ctr", label: "CTR" },
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

        {/* Matrix Grid Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "6px", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px", textTransform: "uppercase", fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", textAlign: "left" }}>
                  Age Group
                </th>
                {genders.map((g) => (
                  <th
                    key={g}
                    style={{
                      padding: "8px 12px",
                      textTransform: "capitalize",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: g === "male" ? "#0A84FF" : "#EC4899",
                      textAlign: "center",
                    }}
                  >
                    {g === "male" ? "👨 Male" : "👩 Female"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ageGroups.map((age) => (
                <tr key={age}>
                  <td style={{ padding: "8px 12px", fontWeight: "700", color: "var(--color-text-primary, #111827)", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", width: "100px" }}>
                    {age}
                  </td>
                  {genders.map((gender) => {
                    const cell = getCellData(age, gender);
                    const val = cell ? cell[metric] : null;
                    const bg = getIntensityColor(val);
                    const textColor = getTextColor(val);

                    return (
                      <td
                        key={gender}
                        style={{
                          padding: "14px 16px",
                          textAlign: "center",
                          backgroundColor: bg,
                          color: textColor,
                          borderRadius: "8px",
                          fontWeight: "700",
                          transition: "transform 0.15s ease",
                          cursor: "pointer",
                        }}
                        title={`${age} · ${gender}: ${getFormattedValue(val, metric)}`}
                      >
                        {getFormattedValue(val, metric)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. TOP PERFORMING AUDIENCE & AUDIENCE INSIGHTS SIDEBAR */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Segment Card */}
        <div
          style={{
            backgroundColor: "linear-gradient(135deg, #0A84FF, #0060DF)",
            background: "var(--gradient-hero, linear-gradient(#F2F8FF, #EAF3FF))",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid rgba(10, 132, 255, 0.2)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0A84FF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ⭐ Top Performing Audience
            </span>
            <span style={{ fontSize: "0.78rem", backgroundColor: "rgba(10, 132, 255, 0.1)", color: "#0A84FF", padding: "3px 8px", borderRadius: "999px", fontWeight: "600" }}>
              Highest CTR
            </span>
          </div>

          {topSegment ? (
            <>
              <div style={{ fontSize: "1.4rem", fontWeight: "750", color: "var(--color-text-primary, #111827)", textTransform: "capitalize" }}>
                {topSegment.age} · {topSegment.gender}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border, #E8EAED)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ fontSize: "1rem", color: "#0A84FF", fontWeight: "750" }}>{formatPercentage(topSegment.ctr)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatCurrency(topSegment.spend, currency)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatNumber(topSegment.clicks)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Reach</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatNumber(topSegment.reach)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "0.88rem", color: "var(--color-text-muted, #94A3B8)" }}>
              No audience segment data available.
            </div>
          )}
        </div>

        {/* Audience Insights Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            flex: 1,
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>💡</span>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Audience Insights
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {insights.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94A3B8)" }}>
                No insights available.
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "var(--color-surface, #F7F9FC)",
                    borderLeft: "3px solid #0A84FF",
                    fontSize: "0.85rem",
                    color: "var(--color-text-primary, #111827)",
                    fontWeight: "500",
                    lineHeight: "1.4",
                  }}
                >
                  {insight}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceHeatmapAndInsights;
