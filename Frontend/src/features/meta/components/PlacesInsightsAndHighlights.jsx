import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesInsightsAndHighlights Component.
 * Contains:
 * 1. Best Performing Region Card (Highest CTR)
 * 2. Most Efficient Region Card (Lowest CPC with min traffic threshold)
 * 3. Dynamic Geographic Insights
 * 4. Top Performing vs. Needs Attention Comparison
 */
export const PlacesInsightsAndHighlights = ({
  bestRegion = null,
  efficientRegion = null,
  insights = [],
  topRegionsList = [],
  needsAttentionList = [],
  currency = "INR",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Highlights Grid (Best Region + Efficient Region + Insights) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* 1. Best Performing Region Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
            background: "linear-gradient(135deg, #F2F8FF, #FFFFFF)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "750", color: "#0A84FF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🏆 Best Performing Region
            </span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(10, 132, 255, 0.1)", color: "#0A84FF", padding: "3px 8px", borderRadius: "999px", fontWeight: "600" }}>
              Highest CTR
            </span>
          </div>

          {bestRegion ? (
            <>
              <div style={{ fontSize: "1.35rem", fontWeight: "750", color: "var(--color-text-primary, #111827)" }}>
                {bestRegion.region}
                {bestRegion.country && (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)", fontWeight: "normal", marginLeft: "8px" }}>
                    ({bestRegion.country})
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border, #E8EAED)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ fontSize: "1rem", color: "#0A84FF", fontWeight: "750" }}>{formatPercentage(bestRegion.ctr)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CPC</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatCurrency(bestRegion.cpc, currency)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatNumber(bestRegion.clicks)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatCurrency(bestRegion.spend, currency)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "0.88rem", color: "var(--color-text-muted, #94A3B8)" }}>
              No regional data available.
            </div>
          )}
        </div>

        {/* 2. Most Efficient Region Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
            background: "linear-gradient(135deg, #DCFCE7 0%, #FFFFFF 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "750", color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ⚡ Most Efficient Region
            </span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(22, 163, 74, 0.12)", color: "#16A34A", padding: "3px 8px", borderRadius: "999px", fontWeight: "600" }}>
              Lowest CPC
            </span>
          </div>

          {efficientRegion ? (
            <>
              <div style={{ fontSize: "1.35rem", fontWeight: "750", color: "var(--color-text-primary, #111827)" }}>
                {efficientRegion.region}
                {efficientRegion.country && (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)", fontWeight: "normal", marginLeft: "8px" }}>
                    ({efficientRegion.country})
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border, #E8EAED)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CPC</span>
                  <strong style={{ fontSize: "1rem", color: "#16A34A", fontWeight: "750" }}>{formatCurrency(efficientRegion.cpc, currency)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatPercentage(efficientRegion.ctr)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatNumber(efficientRegion.clicks)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Spend</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-text-primary, #111827)" }}>{formatCurrency(efficientRegion.spend, currency)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "0.88rem", color: "var(--color-text-muted, #94A3B8)" }}>
              No efficiency data available.
            </div>
          )}
        </div>

        {/* 3. Geographic Insights Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>💡</span>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Geographic Insights
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

      {/* Top vs. Needs Attention Comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Top Regions */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>💚</span>
            <h4 style={{ margin: 0, fontSize: "1.02rem", fontWeight: "700", color: "#16A34A" }}>
              Top Performing Regions
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topRegionsList.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94A3B8)" }}>
                No data available.
              </div>
            ) : (
              topRegionsList.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(22, 163, 74, 0.05)",
                    border: "1px solid rgba(22, 163, 74, 0.15)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", color: "var(--color-text-primary, #111827)", fontSize: "0.9rem" }}>
                      {r.region}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>
                      Spend: {formatCurrency(r.spend, currency)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: "750", color: "#16A34A", fontSize: "0.9rem", display: "block" }}>
                      {formatPercentage(r.ctr)} CTR
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)" }}>
                      CPC: {formatCurrency(r.cpc, currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <h4 style={{ margin: 0, fontSize: "1.02rem", fontWeight: "700", color: "#F59E0B" }}>
              Needs Attention (High Spend, Low CTR)
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {needsAttentionList.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94A3B8)", padding: "10px 0" }}>
                All high-spend regions are delivering healthy performance!
              </div>
            ) : (
              needsAttentionList.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(245, 158, 11, 0.05)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", color: "var(--color-text-primary, #111827)", fontSize: "0.9rem" }}>
                      {r.region}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>
                      Spend: {formatCurrency(r.spend, currency)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: "750", color: "#E5484D", fontSize: "0.9rem", display: "block" }}>
                      {formatPercentage(r.ctr)} CTR
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)" }}>
                      CPC: {formatCurrency(r.cpc, currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacesInsightsAndHighlights;
