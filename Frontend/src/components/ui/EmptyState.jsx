import React from "react";
import { Inbox } from "lucide-react";

/**
 * Generic EmptyState UI Primitive.
 * Professional SaaS empty state with stroke Lucide icons.
 */
export const EmptyState = ({
  title = "No data available",
  description = "No records found for the selected date range.",
  icon: CustomIcon,
  action = null,
}) => {
  const IconToRender = CustomIcon || Inbox;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderRadius: "var(--radius-card, 12px)",
        border: "1px dashed var(--color-border, #E5E7EB)",
        color: "var(--color-text-secondary, #64748B)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted, #94A3B8)",
          marginBottom: "14px",
        }}
      >
        <IconToRender size={24} strokeWidth={1.75} />
      </div>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "var(--color-text-primary, #0F172A)", fontWeight: "650" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--color-text-secondary, #64748B)", maxWidth: "400px" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
