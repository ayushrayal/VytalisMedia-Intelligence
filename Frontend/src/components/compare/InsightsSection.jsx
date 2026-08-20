import React from "react";
import { Lightbulb } from "lucide-react";

/**
 * InsightsSection Component.
 * Displays data-backed contextual insights.
 */
export const InsightsSection = ({ insights = [] }) => {
  if (!Array.isArray(insights) || insights.length === 0) return null;

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
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <Lightbulb size={18} color="#F59E0B" />
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
          Insights & Context
        </h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              borderLeft: "3px solid #0A84FF",
              backgroundColor: "var(--color-background, #F8FAFC)",
              fontSize: "13.5px",
              lineHeight: "1.5",
              color: "#334155",
            }}
          >
            {insight}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsSection;
