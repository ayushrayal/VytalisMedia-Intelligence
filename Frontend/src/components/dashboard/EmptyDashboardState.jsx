import React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

/**
 * EmptyDashboardState component displayed when all optional widgets are hidden.
 */
export const EmptyDashboardState = ({ onOpenCustomizer, onResetDefault }) => {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        margin: "20px 0",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#F8FAFC",
          border: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0A84FF",
          marginBottom: "16px",
        }}
      >
        <SlidersHorizontal size={22} />
      </div>

      <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
        Customize your dashboard
      </h3>
      <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748B", maxWidth: "380px", lineHeight: 1.5 }}>
        Add metrics and cards to start building your personalized Meta Overview analytics layout.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={onOpenCustomizer}
          style={{
            height: "38px",
            padding: "0 18px",
            borderRadius: "8px",
            backgroundColor: "#0A84FF",
            color: "#FFFFFF",
            border: "none",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(10, 132, 255, 0.15)",
          }}
        >
          <SlidersHorizontal size={15} /> Add Metrics
        </button>

        <button
          type="button"
          onClick={onResetDefault}
          style={{
            height: "38px",
            padding: "0 16px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            border: "1px solid #E5E7EB",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RotateCcw size={14} /> Reset Default
        </button>
      </div>
    </div>
  );
};

export default EmptyDashboardState;
