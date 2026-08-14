import React from "react";
import { GROUP_COLORS, formatMetric } from "../utils/attribution.js";

/**
 * AttributionDistribution Component.
 * Horizontal stacked bar visualization answering "Where are my orders coming from?".
 */
export const AttributionDistribution = ({ groups = {}, totalOrders = 0 }) => {
  const metaOrders = groups.meta?.orders || 0;
  const googleOrders = groups.google?.orders || 0;
  const notAttrOrders = groups.not_attribution?.orders || 0;

  const metaPct = groups.meta?.percentageOfOrders || (totalOrders > 0 ? (metaOrders / totalOrders) * 100 : 0);
  const googlePct = groups.google?.percentageOfOrders || (totalOrders > 0 ? (googleOrders / totalOrders) * 100 : 0);
  const notAttrPct = groups.not_attribution?.percentageOfOrders || (totalOrders > 0 ? (notAttrOrders / totalOrders) * 100 : 0);

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
            Visual Channel Distribution
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
            Order share distribution across top-level attribution groups
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: GROUP_COLORS.meta.primary }} />
            <span style={{ color: "#0F172A", fontWeight: "600" }}>Meta</span>
            <span style={{ color: "#64748B" }}>({metaPct.toFixed(1)}%)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: GROUP_COLORS.google.primary }} />
            <span style={{ color: "#0F172A", fontWeight: "600" }}>Google</span>
            <span style={{ color: "#64748B" }}>({googlePct.toFixed(1)}%)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: GROUP_COLORS.not_attribution.primary }} />
            <span style={{ color: "#0F172A", fontWeight: "600" }}>Not Attribution</span>
            <span style={{ color: "#64748B" }}>({notAttrPct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Stacked Bar */}
      <div style={{ width: "100%", height: "14px", backgroundColor: "#F1F5F9", borderRadius: "7px", overflow: "hidden", display: "flex" }}>
        {totalOrders > 0 ? (
          <>
            <div
              style={{
                width: `${metaPct}%`,
                height: "100%",
                backgroundColor: GROUP_COLORS.meta.primary,
                transition: "width 0.4s ease",
              }}
              title={`Meta: ${formatMetric(metaOrders, "number")} orders (${metaPct.toFixed(1)}%)`}
            />
            <div
              style={{
                width: `${googlePct}%`,
                height: "100%",
                backgroundColor: GROUP_COLORS.google.primary,
                transition: "width 0.4s ease",
              }}
              title={`Google: ${formatMetric(googleOrders, "number")} orders (${googlePct.toFixed(1)}%)`}
            />
            <div
              style={{
                width: `${notAttrPct}%`,
                height: "100%",
                backgroundColor: GROUP_COLORS.not_attribution.primary,
                transition: "width 0.4s ease",
              }}
              title={`Not Attribution: ${formatMetric(notAttrOrders, "number")} orders (${notAttrPct.toFixed(1)}%)`}
            />
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#E2E8F0" }} />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12px", color: "#64748B" }}>
        <span>Meta: {formatMetric(metaOrders, "number")} orders</span>
        <span>Google: {formatMetric(googleOrders, "number")} orders</span>
        <span>Not Attribution: {formatMetric(notAttrOrders, "number")} orders</span>
      </div>
    </div>
  );
};

export default AttributionDistribution;
