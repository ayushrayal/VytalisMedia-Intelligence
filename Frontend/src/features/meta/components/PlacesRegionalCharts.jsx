import React, { useState, useEffect, useMemo } from "react";
import Pagination from "../../../components/ui/Pagination.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesRegionalCharts Component.
 * Contains:
 * 1. Regional Spend Chart (Horizontal Bar Chart with proper Frontend Pagination)
 * 2. Regional Performance Chart (Metric selector: CTR, CPC, Clicks, Reach)
 */
export const PlacesRegionalCharts = ({ regionsData = [], currency = "INR" }) => {
  const [spendPage, setSpendPage] = useState(1);
  const spendPageSize = 10;

  const [perfMetric, setPerfMetric] = useState("ctr"); // "ctr" | "cpc" | "clicks" | "reach"

  // Reset pagination to page 1 whenever underlying dataset changes
  useEffect(() => {
    setSpendPage(1);
  }, [regionsData]);

  // 1. Regional Spend Dataset (Sorted globally by spend)
  const sortedSpendRegions = useMemo(() => {
    return [...regionsData].sort((a, b) => (b.spend || 0) - (a.spend || 0));
  }, [regionsData]);

  // Maximum spend across full dataset for consistent relative bar fill width
  const maxSpend = useMemo(() => {
    return Math.max(...sortedSpendRegions.map((r) => r.spend || 0), 1);
  }, [sortedSpendRegions]);

  // Sliced page data for rendering
  const paginatedSpendRegions = useMemo(() => {
    const startIndex = (spendPage - 1) * spendPageSize;
    return sortedSpendRegions.slice(startIndex, startIndex + spendPageSize);
  }, [sortedSpendRegions, spendPage, spendPageSize]);

  // 2. Regional Performance Dataset
  const sortedPerfRegions = useMemo(() => {
    return [...regionsData]
      .sort((a, b) => {
        if (perfMetric === "cpc") {
          const cpcA = a.cpc || 0;
          const cpcB = b.cpc || 0;
          if (cpcA > 0 && cpcB > 0) return cpcA - cpcB;
          if (cpcA > 0) return -1;
          if (cpcB > 0) return 1;
          return 0;
        }
        return (b[perfMetric] || 0) - (a[perfMetric] || 0);
      })
      .slice(0, 10);
  }, [regionsData, perfMetric]);

  const maxPerfVal = useMemo(() => {
    return Math.max(...sortedPerfRegions.map((r) => r[perfMetric] || 0), 1);
  }, [sortedPerfRegions, perfMetric]);

  const getFormattedValue = (val, metricKey) => {
    if (metricKey === "spend" || metricKey === "cpc") return formatCurrency(val, currency);
    if (metricKey === "ctr") return formatPercentage(val);
    return formatNumber(val);
  };

  const spendTotalPages = Math.ceil(sortedSpendRegions.length / spendPageSize) || 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "20px",
      }}
    >
      {/* 1. REGIONAL SPEND CHART WITH PAGINATION */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ padding: "20px 24px 16px 24px", borderBottom: "1px solid var(--color-border, #E8EAED)" }}>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
            Regional Spend
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Regional ad spend ranked by total spend ({sortedSpendRegions.length} regions)
          </span>
        </div>

        <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {paginatedSpendRegions.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.85rem" }}>
              No spend data available.
            </div>
          ) : (
            paginatedSpendRegions.map((r, idx) => {
              const globalRank = (spendPage - 1) * spendPageSize + idx + 1;
              const pctFill = Math.min(100, Math.max(4, ((r.spend || 0) / maxSpend) * 100));

              return (
                <div key={r.region || idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", maxWidth: "230px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-muted, #94A3B8)", minWidth: "20px" }}>
                        #{globalRank}
                      </span>
                      <span style={{ fontWeight: "600", color: "var(--color-text-primary, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.region || "Unknown"}
                      </span>
                    </div>
                    <strong style={{ color: "var(--color-text-primary, #111827)" }}>
                      {formatCurrency(r.spend, currency)}
                    </strong>
                  </div>

                  <div
                    style={{
                      height: "10px",
                      width: "100%",
                      backgroundColor: "var(--color-surface, #F7F9FC)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      border: "1px solid var(--color-border, #E8EAED)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pctFill}%`,
                        backgroundColor: "#16A34A",
                        borderRadius: "999px",
                        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Regional Spend Pagination Component */}
        <Pagination
          currentPage={spendPage}
          totalPages={spendTotalPages}
          pageSize={spendPageSize}
          totalItems={sortedSpendRegions.length}
          onPageChange={setSpendPage}
        />
      </div>

      {/* 2. REGIONAL PERFORMANCE CHART */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Regional Performance
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Top regions by selected metric
            </span>
          </div>

          {/* Metric Selector Pills */}
          <div style={{ display: "flex", backgroundColor: "var(--color-surface, #F7F9FC)", borderRadius: "8px", padding: "2px", border: "1px solid var(--color-border, #E8EAED)" }}>
            {[
              { id: "ctr", label: "CTR" },
              { id: "cpc", label: "CPC" },
              { id: "clicks", label: "Clicks" },
              { id: "reach", label: "Reach" },
            ].map((m) => {
              const active = perfMetric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPerfMetric(m.id)}
                  style={{
                    padding: "4px 10px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: active ? "#FFFFFF" : "transparent",
                    color: active ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    fontWeight: active ? "700" : "500",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
          {sortedPerfRegions.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.85rem" }}>
              No performance data available.
            </div>
          ) : (
            sortedPerfRegions.map((r, idx) => {
              const rawVal = r[perfMetric] || 0;
              const pctFill = Math.min(100, Math.max(4, (rawVal / maxPerfVal) * 100));

              return (
                <div
                  key={r.region || idx}
                  style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                  title={`${r.region}: ${getFormattedValue(rawVal, perfMetric)} | Spend: ${formatCurrency(r.spend, currency)} | Reach: ${formatNumber(r.reach)} | Clicks: ${formatNumber(r.clicks)}`}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: "600", color: "var(--color-text-primary, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      {r.region || "Unknown"}
                    </span>
                    <strong style={{ color: perfMetric === "ctr" ? "#0A84FF" : "var(--color-text-primary, #111827)" }}>
                      {getFormattedValue(rawVal, perfMetric)}
                    </strong>
                  </div>

                  <div
                    style={{
                      height: "10px",
                      width: "100%",
                      backgroundColor: "var(--color-surface, #F7F9FC)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      border: "1px solid var(--color-border, #E8EAED)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pctFill}%`,
                        backgroundColor: perfMetric === "ctr" ? "#0A84FF" : perfMetric === "cpc" ? "#8B5CF6" : "#EC4899",
                        borderRadius: "999px",
                        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacesRegionalCharts;
