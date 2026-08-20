import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceGenderDistribution Component.
 * Displays:
 * 1. Donut Chart for Audience Gender Share
 * 2. Bar Comparison with expanded metric selector (Reach, Spend, Impressions, Clicks, CTR, Add to Cart, Checkout Initiated, Purchases, Cost per Result, Revenue, ROAS)
 */
export const AudienceGenderDistribution = ({ genderData = [], currency = "INR" }) => {
  const [metric, setMetric] = useState("reach");
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const maleItem = genderData.find((g) => g.gender === "male") || { gender: "male", spend: 0, reach: 0, impressions: 0, clicks: 0, ctr: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 };
  const femaleItem = genderData.find((g) => g.gender === "female") || { gender: "female", spend: 0, reach: 0, impressions: 0, clicks: 0, ctr: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 };
  const unknownItem = genderData.find((g) => g.gender === "unknown") || { gender: "unknown", spend: 0, reach: 0, impressions: 0, clicks: 0, ctr: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 };

  const totalReach = (maleItem.reach || 0) + (femaleItem.reach || 0) + (unknownItem.reach || 0);

  const segments = [
    { label: "Male", gender: "male", val: maleItem.reach || 0, color: "#0A84FF" },
    { label: "Female", gender: "female", val: femaleItem.reach || 0, color: "#EC4899" },
    { label: "Unknown", gender: "unknown", val: unknownItem.reach || 0, color: "#94A3B8" },
  ].filter((s) => s.val > 0 || totalReach === 0);

  // SVG Donut Calculations
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const donutPaths = segments.map((seg) => {
    const pct = totalReach > 0 ? seg.val / totalReach : 1 / (segments.length || 1);
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;

    return {
      ...seg,
      pct,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const getMetricVal = (item, metricKey) => {
    if (!item) return null;
    if (metricKey === "cpr") {
      const p = item.purchases || 0;
      const s = item.spend || 0;
      return p > 0 ? s / p : null;
    }
    if (metricKey === "roas") {
      const s = item.spend || 0;
      const r = item.revenue || 0;
      return s > 0 ? r / s : null;
    }
    return item[metricKey] ?? 0;
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

  const maxVal = Math.max(
    Number(getMetricVal(maleItem, metric)) || 0,
    Number(getMetricVal(femaleItem, metric)) || 0,
    Number(getMetricVal(unknownItem, metric)) || 0,
    1
  );

  const metricOptions = [
    { id: "reach", label: "Reach" },
    { id: "spend", label: "Spend" },
    { id: "impressions", label: "Impressions" },
    { id: "clicks", label: "Clicks" },
    { id: "ctr", label: "CTR" },
    { id: "add_to_cart", label: "Add to Cart" },
    { id: "initiate_checkout", label: "Checkout Initiated" },
    { id: "purchases", label: "Purchases" },
    { id: "cpr", label: "Cost per Result" },
    { id: "revenue", label: "Revenue" },
    { id: "roas", label: "ROAS" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
      }}
    >
      {/* 1. DONUT CHART - GENDER DISTRIBUTION */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Gender Distribution
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Audience reach share by gender
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "20px", padding: "10px 0" }}>
          {/* SVG Donut */}
          <div style={{ position: "relative", width: "160px", height: "160px" }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
              {donutPaths.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  style={{
                    transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                    cursor: "pointer",
                    opacity: hoveredSegment && hoveredSegment !== seg.gender ? 0.5 : 1,
                  }}
                  onMouseEnter={() => setHoveredSegment(seg.gender)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
                {formatNumber(totalReach)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)" }}>Total Reach</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "140px" }}>
            {donutPaths.map((seg, idx) => {
              const pctStr = (seg.pct * 100).toFixed(1);
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSegment(seg.gender)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    backgroundColor: hoveredSegment === seg.gender ? "var(--color-surface-subtle, #F1F5F9)" : "transparent",
                    transition: "background-color 0.15s ease",
                    cursor: "pointer",
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
                      {formatNumber(seg.val)}
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

          {/* Metric Selector Pills (Flex Wrap) */}
          <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "6px", padding: "4px", border: "1px solid var(--color-border, #E5E7EB)", gap: "4px" }}>
            {metricOptions.map((m) => {
              const active = metric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
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

        {/* Bar Comparison Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
          {[
            { label: "Male", item: maleItem, color: "#0A84FF" },
            { label: "Female", item: femaleItem, color: "#EC4899" },
            { label: "Unknown", item: unknownItem, color: "#94A3B8" },
          ].map((row, idx) => {
            const rawVal = getMetricVal(row.item, metric);
            const numVal = Number(rawVal) || 0;
            const pctFill = Math.min(100, Math.max(0, (numVal / maxVal) * 100));

            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: "600", color: "var(--color-text-primary, #0F172A)" }}>
                    {row.label}
                  </span>
                  <strong style={{ color: "var(--color-text-primary, #0F172A)" }}>
                    {formatDisplayVal(rawVal, metric)}
                  </strong>
                </div>

                <div
                  style={{
                    height: "10px",
                    width: "100%",
                    backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border, #E5E7EB)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pctFill}%`,
                      backgroundColor: row.color,
                      borderRadius: "999px",
                      transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
