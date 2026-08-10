import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Reusable SpendFilter component for Meta analytics pages.
 * Height: 36px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
 * Filters numeric spend (>= threshold).
 */
export const SpendFilter = ({ value, onChange }) => {
  const isFiltered = value !== "all";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
        Spend:
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
          <option value="all">All</option>
          <option value="1000">₹1,000+</option>
          <option value="5000">₹5,000+</option>
          <option value="10000">₹10,000+</option>
          <option value="20000">₹20,000+</option>
        </select>
        <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: isFiltered ? "#0A84FF" : "#64748B", pointerEvents: "none" }} />
      </div>
    </div>
  );
};

export default SpendFilter;
