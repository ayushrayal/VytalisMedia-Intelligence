import React from "react";

/**
 * Genuinely shared PageHeader component.
 */
export const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "#94a3b8" }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>{actions}</div>}
    </div>
  );
};

export default PageHeader;
