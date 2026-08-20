import React from "react";
import { Loader2 } from "lucide-react";

/**
 * CompareLoadingIndicator Component.
 * Compact, non-blocking inline indicator displayed directly below the DateRangeCompareSelector.
 */
export const CompareLoadingIndicator = ({ message = "Comparing performance..." }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 18px",
        marginBottom: "20px",
        backgroundColor: "rgba(10, 132, 255, 0.05)",
        border: "1px solid rgba(10, 132, 255, 0.18)",
        borderRadius: "8px",
        color: "#0A84FF",
        fontSize: "13.5px",
        fontWeight: "600",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
      }}
    >
      <Loader2 size={18} style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />
      <span>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CompareLoadingIndicator;
