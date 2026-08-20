import React from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

/**
 * KeyChangesList Component.
 * Renders key metric highlights with status icons (✓ improved, ⚠ warning, • contextual).
 */
export const KeyChangesList = ({ keyChanges = [] }) => {
  if (!Array.isArray(keyChanges) || keyChanges.length === 0) return null;

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
      <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
        Key Changes
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {keyChanges.map((item, idx) => {
          const isPositive = item.iconType === "positive" || item.performance === "Improved";
          const isNegative = item.iconType === "negative" || item.performance === "Declined";

          const iconColor = isPositive ? "#16A34A" : isNegative ? "#DC2626" : "#64748B";
          const bgColor = isPositive ? "rgba(22, 163, 74, 0.06)" : isNegative ? "rgba(220, 38, 38, 0.06)" : "rgba(100, 116, 139, 0.06)";

          const IconComponent = isPositive ? CheckCircle2 : isNegative ? AlertTriangle : Info;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: bgColor,
              }}
            >
              <IconComponent size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13.5px", fontWeight: "500", color: "#1E293B" }}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyChangesList;
