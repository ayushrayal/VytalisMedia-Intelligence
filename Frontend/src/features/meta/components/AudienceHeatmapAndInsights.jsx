import React, { useState } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceHeatmapAndInsights Component.
 * Contains:
 * 1. Demographic Heatmap Matrix (Age x Gender) with metric selector
 * 2. Top Performing Segment Card (Highest CTR)
 * 3. Dynamic Rule-based Audience Insights
 */
export const AudienceHeatmapAndInsights = ({
  matrixData = [],
  topSegment = null,
  insights = [],
  currency = "INR",
}) => {
  const [metric, setMetric] = useState("spend"); // "spend" | "add_to_cart" | "initiate_checkout" | "purchases" | "cpr" | "revenue" | "roas"

  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];
  const genders = ["male", "female", "unknown"];

  const metricOptions = [
    { id: "spend", label: "Spend" },
    { id: "add_to_cart", label: "Add to Cart" },
    { id: "initiate_checkout", label: "Checkout Initiated" },
    { id: "purchases", label: "Purchases" },
    { id: "cpr", label: "Cost per Result" },
    { id: "revenue", label: "Revenue" },
    { id: "roas", label: "ROAS" },
  ];

  const getCellMetricVal = (age, gender, metricKey) => {
    const matchedRows = matrixData.filter(
      (r) =>
        String(r.age || "Unknown").trim() === age &&
        String(r.gender || "unknown").trim().toLowerCase() === gender
    );

    if (matchedRows.length === 0) return null;

    let spendSum = 0;
    let revSum = 0;
    let purSum = 0;
    let atcSum = 0;
    let icSum = 0;

    matchedRows.forEach((r) => {
      spendSum += Number(r.spend || 0);
      revSum += Number(r.purchase_conversion_value || r.revenue || 0);
      purSum += Number(r.purchases || 0);
      atcSum += Number(r.actions_add_to_cart || r.add_to_cart || 0);
      icSum += Number(r.actions_initiate_checkout || r.initiate_checkout || 0);
    });

    if (metricKey === "spend") return spendSum;
    if (metricKey === "revenue") return revSum;
    if (metricKey === "purchases") return purSum;
    if (metricKey === "add_to_cart") return atcSum;
    if (metricKey === "initiate_checkout") return icSum;

    if (metricKey === "cpr") {
      return purSum > 0 ? spendSum / purSum : null;
    }
    if (metricKey === "roas") {
      return spendSum > 0 ? revSum / spendSum : null;
    }

    return null;
  };

  // Find max cell value for shading scale
  let maxCellValue = 1;
  ageGroups.forEach((age) => {
    genders.forEach((gender) => {
      const val = getCellMetricVal(age, gender, metric);
      if (val !== null && val > maxCellValue) maxCellValue = val;
    });
  });

  const formatDisplayVal = (val, metricKey) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    const num = Number(val);
    if (metricKey === "spend" || metricKey === "revenue" || metricKey === "cpr") {
      return formatCurrency(num, currency);
    }
    if (metricKey === "roas") {
      return `${num.toFixed(2)}x`;
    }
    return formatNumber(num);
  };

  const getIntensityColor = (value) => {
    if (value === null || value === undefined || value <= 0) return "var(--color-surface-subtle, #F1F5F9)";
    const ratio = Math.min(1, Math.max(0.1, value / maxCellValue));
    if (ratio > 0.75) return "#0A84FF";
    if (ratio > 0.5) return "#3B9EFF";
    if (ratio > 0.25) return "#7CC0FF";
    return "#D0E7FF";
  };

  const getTextColor = (value) => {
    if (value === null || value === undefined || value <= 0) return "var(--color-text-muted, #94A3B8)";
    const ratio = Math.min(1, Math.max(0.1, value / maxCellValue));
    return ratio > 0.5 ? "#FFFFFF" : "#0F172A";
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
          borderRadius: "var(--radius-card, 12px)",
          border: "1px solid var(--color-border, #E5E7EB)",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          gridColumn: "span 2",
          boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Demographic Heatmap
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Intensity matrix across age and gender segments
            </span>
          </div>

          {/* Metric Selector Pills (Flex Wrap) */}
          <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "6px", padding: "4px", border: "1px solid var(--color-border, #E5E7EB)", gap: "4px" }}>
            {metricOptions.map((m) => {
              const active = metric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  style={{
                    padding: "4px 10px",
                    border: "none",
                    borderRadius: "4px",
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

        {/* Matrix Grid Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "6px", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", textAlign: "left" }}>
                  Age Group
                </th>
                {genders.map((g) => (
                  <th
                    key={g}
                    style={{
                      padding: "6px 12px",
                      textTransform: "capitalize",
                      fontSize: "0.825rem",
                      fontWeight: "700",
                      color: g === "male" ? "#0A84FF" : g === "female" ? "#EC4899" : "#64748B",
                      textAlign: "center",
                    }}
                  >
                    {g === "male" ? "Male" : g === "female" ? "Female" : "Unknown"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ageGroups.map((age) => (
                <tr key={age}>
                  <td style={{ padding: "8px 12px", fontWeight: "650", color: "var(--color-text-primary, #0F172A)", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "6px", width: "100px" }}>
                    {age}
                  </td>
                  {genders.map((gender) => {
                    const val = getCellMetricVal(age, gender, metric);
                    const bg = getIntensityColor(val);
                    const textColor = getTextColor(val);

                    return (
                      <td
                        key={gender}
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          backgroundColor: bg,
                          color: textColor,
                          borderRadius: "6px",
                          fontWeight: "700",
                          transition: "transform 0.15s ease",
                          cursor: "pointer",
                        }}
                        title={`${age} · ${gender}: ${formatDisplayVal(val, metric)}`}
                      >
                        {formatDisplayVal(val, metric)}
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
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 12px)",
            border: "1px solid var(--color-border, #E5E7EB)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0A84FF", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={15} /> Top Performing Segment
            </span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(10, 132, 255, 0.08)", color: "#0A84FF", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
              Highest CTR
            </span>
          </div>

          {topSegment ? (
            <>
              <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", textTransform: "capitalize" }}>
                {topSegment.age} · {topSegment.gender}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border, #E5E7EB)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ fontSize: "1rem", color: "#0A84FF", fontWeight: "700" }}>{formatPercentage(topSegment.ctr)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #0F172A)" }}>{formatCurrency(topSegment.spend, currency)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #0F172A)" }}>{formatNumber(topSegment.clicks)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Reach</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #0F172A)" }}>{formatNumber(topSegment.reach)}</strong>
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
            borderRadius: "var(--radius-card, 12px)",
            border: "1px solid var(--color-border, #E5E7EB)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            flex: 1,
            boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lightbulb size={18} color="#0A84FF" />
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
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
                    borderRadius: "8px",
                    backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                    borderLeft: "3px solid #0A84FF",
                    fontSize: "0.825rem",
                    color: "var(--color-text-primary, #0F172A)",
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
