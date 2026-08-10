import React from "react";

/**
 * Generic ErrorState UI Primitive.
 * Displayed when an API request fails.
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
        backgroundColor: "#2d1a24",
        borderRadius: "12px",
        border: "1px solid #831843",
        color: "#f43f5e",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", color: "#fda4af" }}>{title}</h4>
      <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "#fecdd3", maxWidth: "450px" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            backgroundColor: "#e11d48",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
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
