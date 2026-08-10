import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Reusable StatusFilter component for Meta analytics pages.
 * Height: 36px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
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
      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
        Status:
      </span>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            height: "36px",
            padding: "0 28px 0 10px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            border: isFiltered
              ? "1px solid #0A84FF"
              : "1px solid #E5E7EB",
            color: isFiltered
              ? "#0A84FF"
              : "#0F172A",
            fontSize: "13px",
            fontWeight: isFiltered ? "600" : "500",
            outline: "none",
            cursor: "pointer",
            boxShadow: isFiltered ? "0 0 0 2px rgba(10, 132, 255, 0.12)" : "0 1px 2px rgba(15, 23, 42, 0.03)",
            transition: "all 0.15s ease",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: isFiltered ? "#0A84FF" : "#64748B", pointerEvents: "none" }} />
      </div>
    </div>
  );
};

export default StatusFilter;
