import React from "react";

/**
 * Shared PageHeader component.
 * Page title 28px–32px (fontWeight 700), subtitle #64748B.
 */
export const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", letterSpacing: "-0.5px" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--color-text-secondary, #64748B)" }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
};

export default PageHeader;
