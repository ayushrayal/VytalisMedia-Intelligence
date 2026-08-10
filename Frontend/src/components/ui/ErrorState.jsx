import React from "react";

/**
 * Generic ErrorState UI Primitive.
 * Uses #E5484D error token with clean light styling.
 */
export const ErrorState = ({
  title = "Failed to load data",
  message = "An error occurred while fetching information. Please try again.",
  onRetry,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 24px",
        textAlign: "center",
        backgroundColor: "var(--color-error-light, rgba(229, 72, 77, 0.08))",
        borderRadius: "var(--radius-card, 16px)",
        border: "1px solid rgba(229, 72, 77, 0.20)",
        color: "var(--color-error, #E5484D)",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", color: "var(--color-error, #E5484D)", fontWeight: "650" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "var(--color-text-secondary, #64748B)", maxWidth: "450px" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            height: "40px",
            padding: "0 18px",
            backgroundColor: "var(--color-error, #E5484D)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-button, 10px)",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
