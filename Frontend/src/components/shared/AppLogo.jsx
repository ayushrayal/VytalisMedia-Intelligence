import React from "react";

/**
 * Shared AppLogo component.
 * Black rounded icon with white "V", strong Vytalis Intelligence typography with spacious tracking.
 */
export const AppLogo = ({ size = "md" }) => {
  const iconDim = size === "sm" ? "28px" : size === "lg" ? "40px" : "34px";
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.45rem" : "1.2rem";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* Black Icon Container with White V */}
      <div
        style={{
          width: iconDim,
          height: iconDim,
          borderRadius: "10px",
          backgroundColor: "#0A92FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontWeight: "800",
          fontSize: size === "sm" ? "0.85rem" : size === "lg" ? "1.25rem" : "1.05rem",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
          flexShrink: 0,
        }}
      >
        V
      </div>

      {/* Typography with Spacing between Vytalis and INTELLIGENCE */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <span
          style={{
            fontSize,
            fontWeight: "700",
            color: "#0F172A",
            letterSpacing: "-0.4px",
            lineHeight: "1.1",
          }}
        >
          Vytalis
        </span>
        <span
          style={{
            fontSize: size === "sm" ? "0.6rem" : size === "lg" ? "0.8rem" : "0.7rem",
            fontWeight: "600",
            color: "#64748B",
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            lineHeight: "1.1",
          }}
        >
          INTELLIGENCE
        </span>
      </div>
    </div>
  );
};

export default AppLogo;
