import React, { useState, useEffect, useMemo } from "react";
import CreativeCard from "./CreativeCard.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import { Trophy, Filter, Check } from "lucide-react";

import { extractNumericValue } from "../utils/creativeAggregator.js";

export const extractCreativeRoas = (creative) => {
  if (!creative) return null;

  // 1. Explicit purchase_roas / roas metric (nullish coalescing preserves 0)
  const raw = creative.purchase_roas ?? creative.purchase_roas_omni_purchase ?? creative.roas;
  const numericRoas = extractNumericValue(raw);
  if (numericRoas !== null && !isNaN(numericRoas) && isFinite(numericRoas)) {
    return numericRoas;
  }

  // 2. Evidence-based calculation using nullish coalescing for metric fallback
  const spend = extractNumericValue(creative.spend ?? creative.amount_spent);
  if (spend === null || spend <= 0) return null;

  const purchases = extractNumericValue(creative.purchases ?? creative.actions_omni_purchase);
  const purchaseValue = extractNumericValue(
    creative.purchase_conversion_value ??
    creative.action_values_omni_purchase ??
    creative.purchaseValue ??
    creative.purchase_value
  );

  if (purchaseValue !== null && purchaseValue > 0) {
    return purchaseValue / spend;
  }

  if (purchaseValue === 0 || purchases === 0) {
    return 0;
  }

  return null;
};

const PREDEFINED_WINNING_OPTIONS = [
  { label: "Above 1x", value: 1.0 },
  { label: "Above 1.5x", value: 1.5 },
  { label: "Above 2x", value: 2.0 },
  { label: "Above 2.5x", value: 2.5 },
  { label: "Above 3x", value: 3.0 },
  { label: "Above 3.5x", value: 3.5 },
  { label: "Above 4x", value: 4.0 },
  { label: "Above 4.5x", value: 4.5 },
  { label: "Above 5x", value: 5.0 },
  { label: "Custom", value: "custom" },
];

export const WinningCreativesSection = ({ creatives, preferences, onCardClick, onThresholdChange }) => {
  const thresholdVal = Number(preferences?.winningRoasThreshold ?? 1.0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(String(thresholdVal));

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Determine current dropdown select value
  const matchedOption = PREDEFINED_WINNING_OPTIONS.find(
    (opt) => opt.value !== "custom" && Number(opt.value) === thresholdVal
  );

  const selectedSelectVal = isCustomMode ? "custom" : matchedOption ? String(matchedOption.value) : "custom";

  // Filter dataset by ROAS > thresholdVal (Strictly greater than) and sort Descending (highest first)
  const winningCreatives = useMemo(() => {
    if (!Array.isArray(creatives)) return [];
    return [...creatives]
      .filter((item) => {
        const roas = extractCreativeRoas(item);
        return roas !== null && roas > thresholdVal;
      })
      .sort((a, b) => (extractCreativeRoas(b) ?? 0) - (extractCreativeRoas(a) ?? 0));
  }, [creatives, thresholdVal]);

  // Reset pagination to page 1 whenever filter, threshold, or underlying dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [creatives, thresholdVal]);

  const totalPages = Math.ceil(winningCreatives.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Slice paginated subset ONLY AFTER filtering and sorting
  const paginatedWinningCreatives = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return winningCreatives.slice(start, start + pageSize);
  }, [winningCreatives, currentPage, pageSize]);

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const num = Number(val);
      if (!isNaN(num)) {
        onThresholdChange(num);
      }
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const num = Number(customInputValue);
    if (!isNaN(num) && num >= 0) {
      onThresholdChange(num);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginTop: "16px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid #F1F5F9",
          paddingBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trophy size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0F172A" }}>
                Winning Creatives
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  color: "#10B981",
                }}
              >
                {winningCreatives.length} {winningCreatives.length === 1 ? "Creative" : "Creatives"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
              ROAS above <strong>{thresholdVal.toFixed(2)}x</strong> (sorted highest first)
            </p>
          </div>
        </div>

        {/* Threshold Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748B" />
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>
              Threshold:
            </span>
          </div>

          <select
            value={selectedSelectVal}
            onChange={handleDropdownChange}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              fontSize: "0.825rem",
              fontWeight: "600",
              color: "#0F172A",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {PREDEFINED_WINNING_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isCustomMode && (
            <form onSubmit={handleCustomSubmit} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.05"
                min="0"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                placeholder="e.g. 4.25"
                style={{
                  width: "80px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.825rem",
                  fontWeight: "600",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Apply
                <Check size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Grid or Empty State */}
      {winningCreatives.length === 0 ? (
        <div
          style={{
            padding: "36px 20px",
            borderRadius: "12px",
            backgroundColor: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Trophy size={32} color="#94A3B8" />
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#334155" }}>
            No winning creatives found
          </h4>
          <p style={{ margin: 0, fontSize: "0.825rem", color: "#64748B" }}>
            No creatives currently have ROAS above <strong>{thresholdVal.toFixed(2)}x</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {paginatedWinningCreatives.map((row, idx) => {
              const creativeKey = `winning-${row.ad_id || row.id || "creative"}-${row.date || ""}-${idx}`;
              return (
                <CreativeCard
                  key={creativeKey}
                  creative={row}
                  preferences={preferences}
                  variant="winning"
                  onClick={() => onCardClick(row)}
                />
              );
            })}
          </div>

          {/* Reusable Pagination Controls Container */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-card, 12px)",
              border: "1px solid var(--color-border, #E5E7EB)",
              overflow: "hidden",
              boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
            }}
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={winningCreatives.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[12, 24, 36, 48]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WinningCreativesSection;
