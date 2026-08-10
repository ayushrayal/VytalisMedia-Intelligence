import React from "react";

/**
 * Reusable SpendFilter component for Meta analytics pages.
 * Filters numeric spend (>= threshold).
 */
export const SpendFilter = ({ value, onChange }) => {
  const isFiltered = value !== "all";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "600" }}>
        Spend:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: "40px",
          padding: "0 12px",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          border: isFiltered
            ? "1px solid var(--color-primary, #0A84FF)"
            : "1px solid var(--color-border, #E8EAED)",
          color: isFiltered
            ? "var(--color-primary-hover, #0060DF)"
            : "var(--color-text-primary, #111827)",
          fontSize: "0.875rem",
          fontWeight: isFiltered ? "600" : "500",
          outline: "none",
          cursor: "pointer",
          boxShadow: isFiltered ? "0 0 0 2px rgba(10, 132, 255, 0.15)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        <option value="all">All</option>
        <option value="1000">₹1,000+</option>
        <option value="5000">₹5,000+</option>
        <option value="10000">₹10,000+</option>
        <option value="20000">₹20,000+</option>
      </select>
    </div>
  );
};

export default SpendFilter;
