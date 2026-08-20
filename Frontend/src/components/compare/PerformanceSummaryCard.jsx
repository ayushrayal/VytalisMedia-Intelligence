import React from "react";
import { Sparkles } from "lucide-react";

/**
 * PerformanceSummaryCard Component.
 * Displays high-level data-driven performance summary text.
 */
export const PerformanceSummaryCard = ({ summary = "", periodA, periodB }) => {
  if (!summary) return null;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "rgba(10, 132, 255, 0.1)",
            color: "#0A84FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
            Performance Summary
          </h3>
          {periodA && periodB && (
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Comparing Period A ({periodA.dateFrom} → {periodA.dateTo}) vs Period B ({periodB.dateFrom} → {periodB.dateTo})
            </span>
          )}
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#334155",
          fontWeight: "500",
        }}
      >
        {summary}
      </p>
    </div>
  );
};

export default PerformanceSummaryCard;
