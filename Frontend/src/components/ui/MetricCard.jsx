import React from "react";

/**
 * Reusable MetricCard Primitive for Vytalis Intelligence.
 * Premium B2B SaaS metric card matching Linear / Stripe design language.
 */
export const MetricCard = ({
  title,
  label, // alias for title
  value,
  subtitle,
  trend,
  trendPositive = true,
  icon: IconComponent,
  accentColor = "#0A84FF",
  onClick,
}) => {
  const displayTitle = title || label || "Metric";

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = "#0A84FF";
          e.currentTarget.style.backgroundColor = "#FAFCFF";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.backgroundColor = "#FFFFFF";
        }
      }}
    >
      {/* Top Row: Circular Icon Pill & Label */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {IconComponent && (
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: `${accentColor}12`, // 8% - 10% opacity tint
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconComponent size={17} strokeWidth={2.2} />
          </div>
        )}
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
          {displayTitle}
        </span>
      </div>

      {/* Metric Value & Subtitle */}
      <div>
        <div
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#0F172A",
            letterSpacing: "-0.5px",
            lineHeight: "1.2",
          }}
        >
          {value !== null && value !== undefined && value !== "" ? value : "—"}
        </div>

        {/* Subtitle / Context */}
        {(subtitle || trend) && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px" }}>
            {trend && (
              <span
                style={{
                  fontWeight: "600",
                  color: trendPositive ? "#16A34A" : "#DC2626",
                  backgroundColor: trendPositive ? "rgba(22, 163, 74, 0.08)" : "rgba(220, 38, 38, 0.08)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                {trend}
              </span>
            )}
            {subtitle && (
              <span style={{ color: "#94A3B8" }}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
