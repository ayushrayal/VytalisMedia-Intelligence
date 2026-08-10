import React from "react";

/**
 * Genuinely shared MetricCard component.
 * Displays KPI label, value, optional subtitle/trend.
 */
export const MetricCard = ({ label, value, subtitle, icon, trend, style = {} }) => {
  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#94a3b8" }}>{label}</span>
        {icon && <span style={{ fontSize: "1.2rem" }}>{icon}</span>}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc" }}>
        {value !== undefined && value !== null ? value : "-"}
      </div>
      {subtitle && (
        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{subtitle}</span>
      )}
    </div>
  );
};

export default MetricCard;
