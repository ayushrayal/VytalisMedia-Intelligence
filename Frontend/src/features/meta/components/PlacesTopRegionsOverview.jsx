import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesTopRegionsOverview Component.
 * Displays Top 5 Regions in rich card format with an interactive metric selector:
 * [ Spend ] [ Reach ] [ Clicks ] [ CTR ]
 */
export const PlacesTopRegionsOverview = ({ regionsData = [], currency = "INR" }) => {
  const [metric, setMetric] = useState("spend"); // "spend" | "reach" | "clicks" | "ctr"

  // Sort top 5 regions by selected metric
  const sortedTopRegions = [...regionsData]
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-card, 16px)",
        border: "1px solid var(--color-border, #E8EAED)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
            Top 5 Regions Overview
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Highest performing geographic regions ranked by selected metric
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

      {/* Top 5 Region Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        {sortedTopRegions.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.85rem", gridColumn: "1 / -1" }}>
            No regional geographic data available.
          </div>
        ) : (
          sortedTopRegions.map((region, idx) => (
            <div
              key={region.region || idx}
              style={{
                backgroundColor: "var(--color-surface, #F7F9FC)",
                borderRadius: "12px",
                border: "1px solid var(--color-border, #E8EAED)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "750", color: "#0A84FF", backgroundColor: "rgba(10, 132, 255, 0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                  #{idx + 1} Region
                </span>
                {region.country && (
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", fontWeight: "600" }}>
                    {region.country}
                  </span>
                )}
              </div>

              <div>
                <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {region.region || "Unknown Region"}
                </h5>
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "6px", borderTop: "1px solid var(--color-border, #E8EAED)", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ color: "var(--color-text-primary, #111827)", fontWeight: metric === "spend" ? "750" : "600" }}>
                    {formatCurrency(region.spend, currency)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Reach</span>
                  <strong style={{ color: "var(--color-text-primary, #111827)", fontWeight: metric === "reach" ? "750" : "600" }}>
                    {formatNumber(region.reach)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ color: "var(--color-text-primary, #111827)", fontWeight: metric === "clicks" ? "750" : "600" }}>
                    {formatNumber(region.clicks)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ color: "#0A84FF", fontWeight: metric === "ctr" ? "750" : "600" }}>
                    {formatPercentage(region.ctr)}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlacesTopRegionsOverview;
