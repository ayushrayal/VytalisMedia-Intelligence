import React from "react";

/**
 * Shared AppLogo component.
 * Blue rounded icon with white "V", strong Vytalis Intelligence typography.
 */
export const AppLogo = ({ size = "md" }) => {
  const iconDim = size === "sm" ? "26px" : size === "lg" ? "38px" : "32px";
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.45rem" : "1.2rem";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: iconDim,
          height: iconDim,
          borderRadius: "10px",
          backgroundColor: "var(--color-primary, #0A84FF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontWeight: "800",
          fontSize: size === "sm" ? "0.8rem" : size === "lg" ? "1.2rem" : "1rem",
          boxShadow: "0 2px 6px rgba(10, 132, 255, 0.25)",
        }}
      >
        V
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span
          style={{
            fontSize,
            fontWeight: "700",
            color: "var(--color-text-primary, #111827)",
            letterSpacing: "-0.4px",
          }}
        >
          Vytalis
        </span>
        <span
          style={{
            fontSize: size === "sm" ? "0.65rem" : size === "lg" ? "0.85rem" : "0.75rem",
            fontWeight: "600",
            color: "var(--color-text-secondary, #64748B)",
            letterSpacing: "0.2px",
            textTransform: "uppercase",
          }}
        >
          Intelligence
        </span>
      </div>
    </div>
  );
};

export default AppLogo;
