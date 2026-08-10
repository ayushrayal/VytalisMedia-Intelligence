import React from "react";

/**
 * Reusable MetricCard Component for Vytalis SaaS Analytics.
 *
 * Displays a clean, data-focused KPI card with:
 * - Small section label
 * - Subtle monochrome Lucide icon
 * - Large crisp metric value
 * - Optional comparison trend badge (e.g. ↑ 12.4% vs previous period)
 * - Muted subtitle / helper text
 */
export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor,
}) => {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderRadius: "var(--radius-card, 12px)",
        border: "1px solid var(--color-border, #E5E7EB)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Header: Title + Subtle Lucide Icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)", letterSpacing: "-0.1px" }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: accentColor ? `${accentColor}12` : "var(--color-surface-subtle, #F1F5F9)",
              color: accentColor || "var(--color-text-secondary, #64748B)",
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Metric Value & Trend */}
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", letterSpacing: "-0.4px", lineHeight: "1.2" }}>
          {value}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
          {trend && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "600",
                color: trend.positive === false ? "#DC2626" : "#16A34A",
                backgroundColor: trend.positive === false ? "rgba(220, 38, 38, 0.08)" : "rgba(22, 163, 74, 0.08)",
                padding: "2px 6px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)" }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
