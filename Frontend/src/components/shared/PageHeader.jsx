import React from "react";

/**
 * Shared PageHeader component.
 * Page title 26px (fontWeight 700), subtitle 14px #64748B.
 */
export const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px", lineHeight: "1.2" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
