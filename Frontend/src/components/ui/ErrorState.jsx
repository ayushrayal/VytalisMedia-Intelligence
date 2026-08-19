import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { getUserFriendlyErrorMessage } from "../../utils/error.js";

/**
 * Generic ErrorState UI Primitive.
 * Professional SaaS error alert container.
 */
export const ErrorState = ({
  title = "Failed to load data",
  message = "Unable to load data. Please try again.",
  onRetry,
}) => {
  const safeMessage = getUserFriendlyErrorMessage(message);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 24px",
        textAlign: "center",
        backgroundColor: "rgba(220, 38, 38, 0.04)",
        borderRadius: "var(--radius-card, 12px)",
        border: "1px solid rgba(220, 38, 38, 0.16)",
        color: "var(--color-error, #DC2626)",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          backgroundColor: "rgba(220, 38, 38, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#DC2626",
          marginBottom: "12px",
        }}
      >
        <AlertCircle size={22} strokeWidth={2} />
      </div>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#DC2626", fontWeight: "650" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--color-text-secondary, #64748B)", maxWidth: "450px" }}>
        {safeMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            height: "36px",
            padding: "0 16px",
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-button, 8px)",
            fontSize: "0.825rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <RotateCcw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
