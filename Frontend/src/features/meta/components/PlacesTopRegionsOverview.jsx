import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesTopRegionsOverview Component.
 * Displays Top 5 Regions in rich card format with an interactive metric selector:
 * [ Spend ] [ Reach ] [ Clicks ] [ CTR ]
 */
export const PlacesTopRegionsOverview = ({ regionsData = [], currency = "INR" }) => {
  const [mode, setMode] = useState("highSpend"); // "highSpend" | "lowSpend" | "highCtr" | "lowCtr"

  // Dynamically compute top 5 regions based on selected ranking mode
  const displayedRegions = useMemo(() => {
    if (!regionsData || regionsData.length === 0) return [];
    const list = [...regionsData];

    if (mode === "highSpend") {
      return list.sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 5);
    }
    if (mode === "lowSpend") {
      const spenders = list.filter((r) => Number(r.spend || 0) > 0);
      const targetPool = spenders.length >= 5 ? spenders : list;
      return targetPool.sort((a, b) => (a.spend || 0) - (b.spend || 0)).slice(0, 5);
    }
    if (mode === "highCtr") {
      return list.sort((a, b) => (b.ctr || 0) - (a.ctr || 0)).slice(0, 5);
    }
    if (mode === "lowCtr") {
      const activeImpr = list.filter((r) => Number(r.impressions || 0) > 0);
      const targetPool = activeImpr.length >= 5 ? activeImpr : list;
      return targetPool.sort((a, b) => (a.ctr || 0) - (b.ctr || 0)).slice(0, 5);
    }

    return list.slice(0, 5);
  }, [regionsData, mode]);

  const modeLabels = {
    highSpend: "High Spend",
    lowSpend: "Low Spend",
    highCtr: "High CTR",
    lowCtr: "Low CTR",
  };

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
            Top 5 Regions Overview
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Geographic regions ranked by {modeLabels[mode]}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: "flex", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", borderRadius: "6px", padding: "2px", border: "1px solid var(--color-border, #E5E7EB)", gap: "2px" }}>
          {[
            { id: "highSpend", label: "High Spend" },
            { id: "highCtr", label: "High CTR" },
          ].map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  color: active ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  fontWeight: active ? "700" : "500",
                  fontSize: "0.75rem",
                  cursor: "pointer",
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

      {/* Top 5 Region Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        {displayedRegions.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.85rem", gridColumn: "1 / -1" }}>
            No regional geographic data available.
          </div>
        ) : (
          displayedRegions.map((region, idx) => (
            <div
              key={region.region || idx}
              style={{
                backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                borderRadius: "10px",
                border: "1px solid var(--color-border, #E5E7EB)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0A84FF", backgroundColor: "rgba(10, 132, 255, 0.08)", padding: "2px 8px", borderRadius: "999px" }}>
                  #{idx + 1} Region
                </span>
                {region.country && (
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", fontWeight: "600" }}>
                    {region.country}
                  </span>
                )}
              </div>

              <div>
                <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {region.region || "Unknown Region"}
                </h5>
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border, #E5E7EB)", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ color: "var(--color-text-primary, #0F172A)", fontWeight: mode.includes("Spend") ? "750" : "600" }}>
                    {formatCurrency(region.spend, currency)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Reach</span>
                  <strong style={{ color: "var(--color-text-primary, #0F172A)", fontWeight: "600" }}>
                    {formatNumber(region.reach)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ color: "var(--color-text-primary, #0F172A)", fontWeight: "600" }}>
                    {formatNumber(region.clicks)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ color: "#0A84FF", fontWeight: mode.includes("Ctr") ? "750" : "600" }}>
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
