import React, { useState } from "react";
import { buildDateParams, getTodayISO } from "../../../utils/date.js";
import { ChevronDown } from "lucide-react";

/**
 * Meta Feature DateFilter component.
 * Height: 36px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
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
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Date Range:</span>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            style={{
              height: "36px",
              padding: "0 28px 0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              color: "#0F172A",
              fontSize: "13px",
              fontWeight: "500",
              outline: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7d">Last 7 Days</option>
            <option value="last_30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
        </div>
      </div>

      {isCustom && (
        <form
          onSubmit={handleApplyCustom}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{
              height: "36px",
              padding: "0 8px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              color: "#0F172A",
              fontSize: "12px",
            }}
          />
          <span style={{ color: "#64748B", fontSize: "12px" }}>to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              height: "36px",
              padding: "0 8px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              color: "#0F172A",
              fontSize: "12px",
            }}
          />
          <button
            type="submit"
            style={{
              height: "36px",
              padding: "0 12px",
              backgroundColor: "#0A84FF",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
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
