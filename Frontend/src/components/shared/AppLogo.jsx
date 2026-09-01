import React from "react";
import viLogo from "../../assets/vilogo.png";

/**
 * Shared AppLogo component.
 * Uses the provided V logo asset (assets/vilogo.png) consistently in place of the former blue rounded-square icon.
 */
export const AppLogo = ({ size = "md" }) => {
  const iconDim = size === "sm" ? "28px" : size === "lg" ? "40px" : "34px";
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.45rem" : "1.2rem";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* V Logo Asset */}
      <img
        src={viLogo}
        alt="Vytalis Logo"
        style={{
          width: iconDim,
          height: iconDim,
          objectFit: "contain",
          borderRadius: "6px",
          flexShrink: 0,
        }}
      />

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
