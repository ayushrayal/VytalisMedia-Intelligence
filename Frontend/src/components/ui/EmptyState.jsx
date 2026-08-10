import React from "react";

/**
 * Generic EmptyState UI Primitive.
 * Displayed when an API returns an empty array or no records exist.
 */
export const EmptyState = ({
  title = "No data available",
  description = "No records found for the selected date range.",
  icon = "📭",
  action = null,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        backgroundColor: "#1e293b",
        borderRadius: "12px",
        border: "1px border-dashed #334155",
        color: "#94a3b8",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#f8fafc" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.9rem", color: "#94a3b8", maxWidth: "400px" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
