import React, { useState, useEffect } from "react";
import { formatAudienceMetricValue } from "../../../config/audienceMetrics.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceGenderDistribution Component.
 * Visualizes gender distribution breakdown (Male vs Female vs Unknown)
 * with dynamic metric selector driven by active metric configuration.
 */
export const AudienceGenderDistribution = ({
  genderData = [],
  enabledMetrics = [],
  currency = "INR",
}) => {
  // Filter metrics that support gender breakdown
  const genderMetrics = enabledMetrics.filter((m) => m && m.supportsGender);

  // Default selected metric key
  const [metric, setMetric] = useState("spend");

  // Keep metric selection valid if active enabled metrics change
  useEffect(() => {
    if (genderMetrics.length > 0) {
      const exists = genderMetrics.some((m) => m.key === metric);
      if (!exists) {
        setMetric(genderMetrics[0].key);
      }
    }
  }, [genderMetrics, metric]);

  const activeMetricObj = genderMetrics.find((m) => m.key === metric) || genderMetrics[0] || null;

  // Total Metric Sum
  const totalVal = genderData.reduce((acc, curr) => {
    let val = Number(curr[metric] || 0);
    if (metric === "cpr") {
      val = curr.purchases > 0 ? Number(curr.spend || 0) / Number(curr.purchases) : 0;
    } else if (metric === "roas") {
      val = curr.spend > 0 ? Number(curr.revenue || 0) / Number(curr.spend) : 0;
    }
    return acc + val;
  }, 0);

  // Gender Segments calculation
  const maleItem = genderData.find((d) => String(d.gender).toLowerCase() === "male");
  const femaleItem = genderData.find((d) => String(d.gender).toLowerCase() === "female");
  const unknownItem = genderData.find(
    (d) => String(d.gender).toLowerCase() === "unknown" || (String(d.gender).toLowerCase() !== "male" && String(d.gender).toLowerCase() !== "female")
  );

  const getSegmentVal = (item) => {
    if (!item) return 0;
    if (metric === "cpr") {
      return item.purchases > 0 ? Number(item.spend || 0) / Number(item.purchases) : 0;
    }
    if (metric === "roas") {
      return item.spend > 0 ? Number(item.revenue || 0) / Number(item.spend) : 0;
    }
    return Number(item[metric] || 0);
  };

  const maleVal = getSegmentVal(maleItem);
  const femaleVal = getSegmentVal(femaleItem);
  const unknownVal = getSegmentVal(unknownItem);

  const segments = [
    { label: "Male", val: maleVal, color: "#0A84FF" },
    { label: "Female", val: femaleVal, color: "#EC4899" },
    ...(unknownVal > 0 ? [{ label: "Unknown", val: unknownVal, color: "#64748B" }] : []),
  ];

  const maxSegmentVal = Math.max(1, maleVal, femaleVal, unknownVal);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
      }}
    >
      {/* 1. PIE / DONUT BREAKDOWN CARD */}
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
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
            Gender Breakdown
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Share of {activeMetricObj ? activeMetricObj.label.toLowerCase() : "audience"} by gender
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              height: "12px",
              width: "100%",
              backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
              borderRadius: "999px",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {segments.map((seg) => {
              const pct = totalVal > 0 ? (seg.val / totalVal) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={seg.label}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: seg.color,
                    height: "100%",
                    transition: "width 0.3s ease",
                  }}
                  title={`${seg.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Segment Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {segments.map((seg) => {
              const pctStr = totalVal > 0 ? ((seg.val / totalVal) * 100).toFixed(1) : "0.0";
              const formattedVal = activeMetricObj
                ? formatAudienceMetricValue(seg.val, activeMetricObj.format, currency)
                : formatNumber(seg.val);

              return (
                <div
                  key={seg.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: seg.color }} />
                    <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "var(--color-text-primary, #0F172A)" }}>
                      {seg.label}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "0.825rem", color: "var(--color-text-primary, #0F172A)", display: "block" }}>
                      {pctStr}%
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)" }}>
                      {formattedVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. BAR CHART - GENDER PERFORMANCE COMPARISON */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Gender Comparison
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Metric breakdown by gender
            </span>
          </div>

          {/* Dynamic Metric Selector Pills (Flex Wrap - No Scrollbar) */}
          <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "6px", padding: "4px", border: "1px solid var(--color-border, #E5E7EB)", gap: "4px" }}>
            {genderMetrics.map((m) => {
              const active = metric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  style={{
                    padding: "4px 9px",
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

        {/* Horizontal Bar Visualizations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
          {segments.map((seg) => {
            const widthPct = Math.min(100, Math.max(2, (seg.val / maxSegmentVal) * 100));
            const formattedVal = activeMetricObj
              ? formatAudienceMetricValue(seg.val, activeMetricObj.format, currency)
              : formatNumber(seg.val);

            return (
              <div key={seg.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                  <span style={{ fontWeight: "600", color: "var(--color-text-primary, #0F172A)" }}>
                    {seg.label}
                  </span>
                  <span style={{ fontWeight: "700", color: seg.color }}>
                    {formattedVal}
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    width: "100%",
                    backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      backgroundColor: seg.color,
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AudienceGenderDistribution;
