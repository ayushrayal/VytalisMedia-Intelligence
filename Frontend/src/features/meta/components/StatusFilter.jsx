import React from "react";

/**
 * Reusable StatusFilter component for Meta analytics pages.
 * Options: All, Active, Paused, Ad Set Paused, Campaign Paused.
 */
export const StatusFilter = ({ value, onChange }) => {
  const isFiltered = value !== "all";

  const options = [
    { value: "all", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
    { value: "ADSET_PAUSED", label: "Ad Set Paused" },
    { value: "CAMPAIGN_PAUSED", label: "Campaign Paused" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "600" }}>
        Status:
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StatusFilter;
