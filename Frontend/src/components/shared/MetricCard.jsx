import React from "react";

/**
 * Shared MetricCard component.
 * Card background #F7F9FC, border #E8EAED, radius 16px, padding 20px-24px.
 * KPI value: 28px-34px (fontWeight 700).
 */
export const MetricCard = ({ label, value, subtitle, icon, style = {} }) => {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface, #F7F9FC)",
        border: "1px solid var(--color-border, #E8EAED)",
        borderRadius: "var(--radius-card, 16px)",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>{label}</span>
        {icon && <span style={{ fontSize: "1.25rem", color: "var(--color-primary, #0A84FF)" }}>{icon}</span>}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--color-text-primary, #111827)", letterSpacing: "-0.6px" }}>
        {value !== undefined && value !== null ? value : "-"}
      </div>
      {subtitle && (
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)" }}>{subtitle}</span>
      )}
    </div>
  );
};

export default MetricCard;
