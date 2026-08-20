import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import { Calendar, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Format Date object to YYYY-MM-DD string strictly.
 */
const formatDateISO = (d) => {
  if (!d || isNaN(new Date(d).getTime())) return "";
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Calculates calendar days between two ISO date strings (inclusive).
 */
const calculateDays = (fromStr, toStr) => {
  if (!fromStr || !toStr) return 0;
  let d1 = new Date(`${fromStr}T00:00:00Z`);
  let d2 = new Date(`${toStr}T00:00:00Z`);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  if (d1 > d2) {
    const temp = d1;
    d1 = d2;
    d2 = temp;
  }
  const diffTime = Math.abs(d2 - d1);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Generates equal-length preset ranges.
 */
const getPresetRanges = (presetKey) => {
  const now = new Date();
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (presetKey === "last_7d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 6);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 6);

    return {
      pAFrom: formatDate(pAStart),
      pATo: formatDate(pAEnd),
      pBFrom: formatDate(pBStart),
      pBTo: formatDate(pBEnd),
    };
  }

  if (presetKey === "last_14d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 13);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 13);

    return {
      pAFrom: formatDate(pAStart),
      pATo: formatDate(pAEnd),
      pBFrom: formatDate(pBStart),
      pBTo: formatDate(pBEnd),
    };
  }

  if (presetKey === "last_30d") {
    const pAEnd = new Date(now);
    pAEnd.setDate(pAEnd.getDate() - 1);
    const pAStart = new Date(pAEnd);
    pAStart.setDate(pAStart.getDate() - 29);

    const pBEnd = new Date(pAStart);
    pBEnd.setDate(pBEnd.getDate() - 1);
    const pBStart = new Date(pBEnd);
    pBStart.setDate(pBStart.getDate() - 29);

    return {
      pAFrom: formatDate(pAStart),
      pATo: formatDate(pAEnd),
      pBFrom: formatDate(pBStart),
      pBTo: formatDate(pBEnd),
    };
  }

  if (presetKey === "this_month") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const pAStart = new Date(currentYear, currentMonth, 1);
    const pAEnd = new Date(currentYear, currentMonth, currentDay);
    const dayCount = Math.round((pAEnd - pAStart) / (1000 * 60 * 60 * 24)) + 1;

    const pBStart = new Date(currentYear, currentMonth - 1, 1);
    const pBEnd = new Date(pBStart);
    pBEnd.setDate(pBStart.getDate() + dayCount - 1);

    return {
      pAFrom: formatDate(pAStart),
      pATo: formatDate(pAEnd),
      pBFrom: formatDate(pBStart),
      pBTo: formatDate(pBEnd),
    };
  }

  return getPresetRanges("last_7d");
};

export const DateRangeCompareSelector = ({ onCompare, loading = false, initialPreset = "last_7d" }) => {
  const [activePreset, setActivePreset] = useState(initialPreset);
  const [dateFromA, setDateFromA] = useState("");
  const [dateToA, setDateToA] = useState("");
  const [dateFromB, setDateFromB] = useState("");
  const [dateToB, setDateToB] = useState("");

  const [validationError, setValidationError] = useState(null);

  // Apply default preset on mount
  useEffect(() => {
    const ranges = getPresetRanges(initialPreset);
    setDateFromA(ranges.pAFrom);
    setDateToA(ranges.pATo);
    setDateFromB(ranges.pBFrom);
    setDateToB(ranges.pBTo);
  }, [initialPreset]);

  // Handle Preset Button Click
  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey);
    setValidationError(null);
    const ranges = getPresetRanges(presetKey);
    setDateFromA(ranges.pAFrom);
    setDateToA(ranges.pATo);
    setDateFromB(ranges.pBFrom);
    setDateToB(ranges.pBTo);
  };

  // Perform client validation & submission
  const handleCompareClick = () => {
    setValidationError(null);

    if (!dateFromA || !dateToA || !dateFromB || !dateToB) {
      setValidationError("Please select start and end dates for both Period A and Period B.");
      return;
    }

    // Reversible date order normalization
    let normAFrom = dateFromA;
    let normATo = dateToA;
    if (new Date(normAFrom) > new Date(normATo)) {
      normAFrom = dateToA;
      normATo = dateFromA;
      setDateFromA(normAFrom);
      setDateToA(normATo);
    }

    let normBFrom = dateFromB;
    let normBTo = dateToB;
    if (new Date(normBFrom) > new Date(normBTo)) {
      normBFrom = dateToB;
      normBTo = dateFromB;
      setDateFromB(normBFrom);
      setDateToB(normBTo);
    }

    const daysA = calculateDays(normAFrom, normATo);
    const daysB = calculateDays(normBFrom, normBTo);

    if (daysA === 0 || daysB === 0) {
      setValidationError("Please enter valid calendar dates.");
      return;
    }

    if (daysA !== daysB) {
      setValidationError("Comparison periods must contain the same number of days.");
      return;
    }

    onCompare({
      dateFrom1: normAFrom,
      dateTo1: normATo,
      dateFrom2: normBFrom,
      dateTo2: normBTo,
      preset: activePreset,
    });
  };

  const daysA = calculateDays(dateFromA, dateToA);
  const daysB = calculateDays(dateFromB, dateToB);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Preset Buttons Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
          Quick Presets:
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { key: "last_7d", label: "Last 7 Days vs Previous 7 Days" },
            { key: "last_14d", label: "Last 14 Days vs Previous 14 Days" },
            { key: "last_30d", label: "Last 30 Days vs Previous 30 Days" },
            { key: "this_month", label: "This Month vs Previous Month" },
          ].map((preset) => {
            const isSelected = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectPreset(preset.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #0A84FF" : "1px solid var(--color-border, #E8ECF2)",
                  backgroundColor: isSelected ? "rgba(10, 132, 255, 0.08)" : "transparent",
                  color: isSelected ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  fontSize: "12.5px",
                  fontWeight: isSelected ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Period Input Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "end" }}>
        {/* Period A Selector */}
        <div
          style={{
            backgroundColor: "var(--color-background, #F8FAFC)",
            padding: "14px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-border, #E8ECF2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Period A
            </span>
            {daysA > 0 && (
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#0A84FF", backgroundColor: "rgba(10, 132, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                {daysA} {daysA === 1 ? "day" : "days"}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px" }}>
            <input
              type="date"
              value={dateFromA}
              onChange={(e) => { setDateFromA(e.target.value); setActivePreset("custom"); setValidationError(null); }}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            />
            <ArrowRight size={14} color="#94A3B8" />
            <input
              type="date"
              value={dateToA}
              onChange={(e) => { setDateToA(e.target.value); setActivePreset("custom"); setValidationError(null); }}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            />
          </div>
        </div>

        {/* Period B Selector */}
        <div
          style={{
            backgroundColor: "var(--color-background, #F8FAFC)",
            padding: "14px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-border, #E8ECF2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Period B
            </span>
            {daysB > 0 && (
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748B", backgroundColor: "rgba(100, 116, 139, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                {daysB} {daysB === 1 ? "day" : "days"}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px" }}>
            <input
              type="date"
              value={dateFromB}
              onChange={(e) => { setDateFromB(e.target.value); setActivePreset("custom"); setValidationError(null); }}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            />
            <ArrowRight size={14} color="#94A3B8" />
            <input
              type="date"
              value={dateToB}
              onChange={(e) => { setDateToB(e.target.value); setActivePreset("custom"); setValidationError(null); }}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <div>
          <Button
            type="button"
            onClick={handleCompareClick}
            isLoading={loading}
            disabled={loading}
            style={{ width: "100%", height: "42px" }}
          >
            {loading ? "Comparing..." : "Compare"}
          </Button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            backgroundColor: "rgba(225, 29, 72, 0.08)",
            border: "1px solid rgba(225, 29, 72, 0.2)",
            borderRadius: "6px",
            color: "#E11D48",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};

export default DateRangeCompareSelector;
