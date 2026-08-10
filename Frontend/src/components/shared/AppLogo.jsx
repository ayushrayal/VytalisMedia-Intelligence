import React from "react";

/**
 * Genuinely shared AppLogo component.
 */
export const AppLogo = ({ size = "md" }) => {
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.75rem" : "1.35rem";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: size === "sm" ? "24px" : size === "lg" ? "36px" : "28px",
          height: size === "sm" ? "24px" : size === "lg" ? "36px" : "28px",
          borderRadius: "6px",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: size === "sm" ? "0.75rem" : "1rem",
        }}
      >
        V
      </div>
      <span
        style={{
          fontSize,
          fontWeight: "700",
          background: "linear-gradient(90deg, #f8fafc 0%, #cbd5e1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px",
        }}
      >
        Vytalis Intelligence
      </span>
    </div>
  );
};

export default AppLogo;
