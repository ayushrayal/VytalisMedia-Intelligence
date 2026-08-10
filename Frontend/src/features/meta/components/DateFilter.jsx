import React, { useState } from "react";
import { buildDateParams, getTodayISO } from "../../../utils/date.js";

/**
 * Meta Feature DateFilter component.
 * Height: 42px, Radius: 10px, Surface: #FFFFFF, Border: #E8EAED.
 * 
 * STRICT CONTRACT: Never sends datePreset together with dateFrom/dateTo.
 */
export const DateFilter = ({ onChange, initialPreset = "last_7d" }) => {
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [isCustom, setIsCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(getTodayISO());
  const [customTo, setCustomTo] = useState(getTodayISO());

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setSelectedPreset(val);

    if (val === "custom") {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    const params = buildDateParams({ type: "preset", value: val });
    if (onChange) {
      onChange(params);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customFrom || !customTo) {
      alert("Both From and To dates are required for a custom range.");
      return;
    }

    const params = buildDateParams({
      type: "custom",
      dateFrom: customFrom,
      dateTo: customTo,
    });

    if (onChange) {
      onChange(params);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "600" }}>Date Range:</span>
        <select
          value={selectedPreset}
          onChange={handlePresetChange}
          style={{
            height: "42px",
            padding: "0 14px",
            borderRadius: "var(--radius-input, 10px)",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border, #E8EAED)",
            color: "var(--color-text-primary, #111827)",
            fontSize: "0.875rem",
            fontWeight: "500",
            outline: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7d">Last 7 Days</option>
          <option value="last_30d">Last 30 Days</option>
          <option value="this_month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {isCustom && (
        <form
          onSubmit={handleApplyCustom}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{
              height: "42px",
              padding: "0 10px",
              borderRadius: "var(--radius-input, 10px)",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--color-border, #E8EAED)",
              color: "var(--color-text-primary, #111827)",
              fontSize: "0.85rem",
            }}
          />
          <span style={{ color: "var(--color-text-secondary, #64748B)", fontSize: "0.85rem" }}>to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              height: "42px",
              padding: "0 10px",
              borderRadius: "var(--radius-input, 10px)",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--color-border, #E8EAED)",
              color: "var(--color-text-primary, #111827)",
              fontSize: "0.85rem",
            }}
          />
          <button
            type="submit"
            style={{
              height: "42px",
              padding: "0 14px",
              backgroundColor: "var(--color-primary, #0A84FF)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-button, 10px)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};

export default DateFilter;
