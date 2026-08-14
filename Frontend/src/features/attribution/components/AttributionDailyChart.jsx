import React, { useState } from "react";
import { formatMetric, GROUP_COLORS } from "../utils/attribution.js";

/**
 * AttributionDailyChart Component.
 * Professional daily performance visualizer with metric toggle (Orders vs Revenue).
 */
export const AttributionDailyChart = ({ dailyData = [], currency = "INR" }) => {
  const [metricMode, setMetricMode] = useState("orders"); // "orders" | "revenue"
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);

  if (!Array.isArray(dailyData) || dailyData.length === 0) {
    return null;
  }

  // Calculate maximum total value per day for bar height scaling
  const maxDayVal = Math.max(
    1,
    ...dailyData.map((d) => (metricMode === "orders" ? d.totalOrders || 0 : d.netRevenue || d.grossRevenue || 0))
  );

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      {/* Header Row: Title & Metric Mode Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
            Daily Attribution Performance
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
            Attribution trends over time across Meta, Google, and Not Attribution
          </p>
        </div>

        {/* Metric Selector Toggle Pills */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#F1F5F9",
            borderRadius: "8px",
            padding: "3px",
          }}
        >
          <button
            type="button"
            onClick={() => setMetricMode("orders")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "orders" ? "#FFFFFF" : "transparent",
              color: metricMode === "orders" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "orders" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("revenue")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "revenue" ? "#FFFFFF" : "transparent",
              color: metricMode === "revenue" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "revenue" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Revenue
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: GROUP_COLORS.meta.primary }} />
          <span style={{ color: "#475569", fontWeight: "500" }}>Meta</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: GROUP_COLORS.google.primary }} />
          <span style={{ color: "#475569", fontWeight: "500" }}>Google</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: GROUP_COLORS.not_attribution.primary }} />
          <span style={{ color: "#475569", fontWeight: "500" }}>Not Attribution</span>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div style={{ position: "relative", height: "180px", width: "100%", marginTop: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            height: "140px",
            gap: dailyData.length > 20 ? "4px" : "12px",
            justifyContent: "space-between",
          }}
        >
          {dailyData.map((d, idx) => {
            const metaVal = d.channels?.["Meta Ads"]?.[metricMode === "orders" ? "orderCount" : "netRevenue"] || 0;
            const googleVal = d.channels?.["Google Ads"]?.[metricMode === "orders" ? "orderCount" : "netRevenue"] || 0;

            const totalDay = metricMode === "orders" ? d.totalOrders || 0 : d.netRevenue || d.grossRevenue || 0;
            const notAttrVal = Math.max(0, totalDay - (metaVal + googleVal));

            const totalHeightPct = Math.min(100, Math.max(4, (totalDay / maxDayVal) * 100));
            const isHovered = activeHoverIdx === idx;

            return (
              <div
                key={d.date || idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                  position: "relative",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      marginBottom: "8px",
                      backgroundColor: "#0F172A",
                      color: "#FFFFFF",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ fontWeight: "700", borderBottom: "1px solid #334155", paddingBottom: "4px", marginBottom: "4px" }}>
                      {d.date}
                    </div>
                    <div>Meta: {formatMetric(metaVal, metricMode === "orders" ? "number" : "currency", currency)}</div>
                    <div>Google: {formatMetric(googleVal, metricMode === "orders" ? "number" : "currency", currency)}</div>
                    <div>Not Attribution: {formatMetric(notAttrVal, metricMode === "orders" ? "number" : "currency", currency)}</div>
                    <div style={{ fontWeight: "700", marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #334155" }}>
                      Total: {formatMetric(totalDay, metricMode === "orders" ? "number" : "currency", currency)}
                    </div>
                  </div>
                )}

                {/* Stacked Vertical Bar */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "28px",
                    height: `${totalHeightPct}%`,
                    display: "flex",
                    flexDirection: "column-reverse",
                    borderRadius: "4px 4px 0 0",
                    overflow: "hidden",
                    backgroundColor: "#F1F5F9",
                    transition: "transform 0.15s ease",
                    transform: isHovered ? "scaleY(1.05)" : "none",
                  }}
                >
                  {totalDay > 0 && (
                    <>
                      <div style={{ height: `${(metaVal / totalDay) * 100}%`, backgroundColor: GROUP_COLORS.meta.primary }} />
                      <div style={{ height: `${(googleVal / totalDay) * 100}%`, backgroundColor: GROUP_COLORS.google.primary }} />
                      <div style={{ height: `${(notAttrVal / totalDay) * 100}%`, backgroundColor: GROUP_COLORS.not_attribution.primary }} />
                    </>
                  )}
                </div>

                {/* X-Axis Date Label */}
                <span
                  style={{
                    fontSize: "10px",
                    color: isHovered ? "#0F172A" : "#94A3B8",
                    fontWeight: isHovered ? "600" : "500",
                    marginTop: "6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "40px",
                  }}
                >
                  {d.date ? d.date.split("-").slice(1).join("/") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttributionDailyChart;
