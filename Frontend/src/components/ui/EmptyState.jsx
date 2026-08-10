import React from "react";

/**
 * Generic EmptyState UI Primitive.
 * Clean #FFFFFF / #F7F9FC light surface.
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
        backgroundColor: "var(--color-surface, #F7F9FC)",
        borderRadius: "var(--radius-card, 16px)",
        border: "1px dashed var(--color-border, #E8EAED)",
        color: "var(--color-text-secondary, #64748B)",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "var(--color-text-primary, #111827)", fontWeight: "650" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.9rem", color: "var(--color-text-secondary, #64748B)", maxWidth: "400px" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
