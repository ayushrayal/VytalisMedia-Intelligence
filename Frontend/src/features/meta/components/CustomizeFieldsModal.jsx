import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check, RefreshCw, X } from "lucide-react";
import {
  ALL_AUDIENCE_METRICS,
  DEFAULT_ENABLED_METRIC_KEYS,
  saveAudienceMetricPreferences,
} from "../../../config/audienceMetrics.js";

/**
 * CustomizeFieldsModal Component.
 * Interactive field selector popover/modal for enabling/disabling metrics in /meta/audience.
 * Operates purely on client state + localStorage with ZERO API calls.
 */
export const CustomizeFieldsModal = ({ activeMetricKeys = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMetric = (key) => {
    let next;
    if (activeMetricKeys.includes(key)) {
      next = activeMetricKeys.filter((k) => k !== key);
    } else {
      next = [...activeMetricKeys, key];
    }
    saveAudienceMetricPreferences(next);
    onChange(next);
  };

  const handleSelectAll = () => {
    const allKeys = ALL_AUDIENCE_METRICS.map((m) => m.key);
    saveAudienceMetricPreferences(allKeys);
    onChange(allKeys);
  };

  const handleResetDefault = () => {
    saveAudienceMetricPreferences(DEFAULT_ENABLED_METRIC_KEYS);
    onChange([...DEFAULT_ENABLED_METRIC_KEYS]);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Customize Fields Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "36px",
          padding: "0 14px",
          borderRadius: "8px",
          backgroundColor: isOpen ? "rgba(10, 132, 255, 0.08)" : "#FFFFFF",
          border: isOpen ? "1px solid #0A84FF" : "1px solid var(--color-border, #E5E7EB)",
          color: isOpen ? "#0A84FF" : "var(--color-text-primary, #0F172A)",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
          transition: "all 0.15s ease",
        }}
      >
        <SlidersHorizontal size={15} color={isOpen ? "#0A84FF" : "#64748B"} />
        <span>Customize Fields</span>
        <span
          style={{
            marginLeft: "4px",
            backgroundColor: "#0A84FF",
            color: "#FFFFFF",
            borderRadius: "999px",
            padding: "1px 6px",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          {activeMetricKeys.length}
        </span>
      </button>

      {/* Popover Content */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid var(--color-border, #E5E7EB)",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
            zIndex: 100,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#0F172A" }}>
                Customize Metrics
              </h4>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                Select fields to display across cards, charts, and tables
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ border: "none", backgroundColor: "transparent", cursor: "pointer", color: "#94A3B8", padding: "2px" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#334155",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <Check size={13} /> Select All
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#334155",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <RefreshCw size={13} /> Reset Default
            </button>
          </div>

          {/* Metric Checklist */}
          <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px" }}>
            {ALL_AUDIENCE_METRICS.map((metric) => {
              const isChecked = activeMetricKeys.includes(metric.key);
              return (
                <label
                  key={metric.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor: isChecked ? "rgba(10, 132, 255, 0.04)" : "transparent",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = "#F1F5F9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMetric(metric.key)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#0A84FF",
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: isChecked ? "700" : "500", color: "#0F172A" }}>
                        {metric.label}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          backgroundColor:
                            metric.category === "value"
                              ? "rgba(16, 185, 129, 0.1)"
                              : metric.category === "efficiency"
                              ? "rgba(10, 132, 255, 0.1)"
                              : "#F1F5F9",
                          color:
                            metric.category === "value"
                              ? "#10B981"
                              : metric.category === "efficiency"
                              ? "#0A84FF"
                              : "#64748B",
                        }}
                      >
                        {metric.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "1px" }}>
                      {metric.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeFieldsModal;
