import React from "react";
import { Search, X, Filter } from "lucide-react";

/**
 * MetricFilterBar Component.
 * Purely client-side simplified movement filter chips ([All] [Increased] [Decreased] [No Change]) & metric search toolbar.
 */
export const MetricFilterBar = ({
  selectedStatus = "All",
  onSelectStatus,
  searchQuery = "",
  onSearchChange,
  totalMetricsCount = 0,
  filteredMetricsCount = 0,
  onClearFilters,
}) => {
  const statusOptions = [
    { key: "All", label: "All" },
    { key: "Increased", label: "Increased", color: "#16A34A", bg: "rgba(22, 163, 74, 0.08)" },
    { key: "Decreased", label: "Decreased", color: "#DC2626", bg: "rgba(220, 38, 38, 0.08)" },
    { key: "No Change", label: "No Change", color: "#64748B", bg: "rgba(100, 116, 139, 0.08)" },
  ];

  const hasActiveFilters = selectedStatus !== "All" || (searchQuery && searchQuery.trim() !== "");

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "16px 20px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Top row: Movement Filter Chips & Search Input */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
        {/* Movement Filter Chips Container */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "4px", flex: 1, minWidth: "260px" }}>
          <Filter size={15} color="#94A3B8" style={{ flexShrink: 0, marginRight: "4px" }} />
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.key;
            const chipColor = opt.color || "#0A84FF";
            const chipBg = opt.bg || "rgba(10, 132, 255, 0.08)";

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelectStatus(opt.key)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "6px",
                  border: isSelected ? `1px solid ${chipColor}` : "1px solid var(--color-border, #E8ECF2)",
                  backgroundColor: isSelected ? chipBg : "transparent",
                  color: isSelected ? chipColor : "var(--color-text-secondary, #64748B)",
                  fontSize: "12.5px",
                  fontWeight: isSelected ? "700" : "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search Input & Clear Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: "200px" }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search metrics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 28px 6px 30px",
                fontSize: "12.5px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "#94A3B8",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #CBD5E1)",
                backgroundColor: "#F8FAFC",
                color: "#64748B",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Filter Result Count */}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
        <span>
          Showing <strong style={{ color: "#0F172A" }}>{filteredMetricsCount}</strong> of <strong style={{ color: "#0F172A" }}>{totalMetricsCount}</strong> metrics
        </span>
        {hasActiveFilters && (
          <span style={{ fontSize: "11.5px", color: "#0A84FF", fontWeight: "600" }}>
            Filter active: {selectedStatus !== "All" ? selectedStatus : ""} {searchQuery ? `"${searchQuery}"` : ""}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricFilterBar;
