import React, { useState } from "react";
import { buildDateParams, getTodayISO, getYesterdayISO } from "../../../utils/date.js";

/**
 * Meta Feature DateFilter component.
 * Allows selecting preset or custom date ranges.
 * 
 * MUST reside in features/meta/components/
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
        <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "500" }}>Date Range:</span>
        <select
          value={selectedPreset}
          onChange={handlePresetChange}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            color: "#f8fafc",
            fontSize: "0.875rem",
            fontWeight: "500",
            outline: "none",
            cursor: "pointer",
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
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              fontSize: "0.85rem",
            }}
          />
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              fontSize: "0.85rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "4px 10px",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
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
