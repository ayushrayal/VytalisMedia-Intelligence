import React, { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { formatAudienceMetricValue, calculateAggregatedCpr, calculateAggregatedRoas } from "../../../config/audienceMetrics.js";

/**
 * AudienceTablesSection Component.
 * Dynamic tabular breakdown driven strictly by active metric configuration.
 * Contains:
 * 1. Age Group Summary Table (Aggregates male + female + unknown for each age group)
 * 2. Detailed Demographics Table with compact Gender Filter & dynamic column raw numeric sorting
 */
export const AudienceTablesSection = ({
  ageGroupSummary = [],
  detailedData = [],
  enabledMetrics = [],
  currency = "INR",
}) => {
  // Filter metrics that support table placement
  const tableMetrics = enabledMetrics.filter((m) => m && m.supportsTable);

  // Detailed Table State
  const [genderFilter, setGenderFilter] = useState("all");
  const [detailedSortField, setDetailedSortField] = useState("spend");
  const [detailedSortOrder, setDetailedSortOrder] = useState("desc");

  // Summary Table State
  const [summarySortField, setSummarySortField] = useState("spend");
  const [summarySortOrder, setSummarySortOrder] = useState("desc");

  // Client-side Gender Filter for Detailed Table
  const filteredDetailedData = useMemo(() => {
    return detailedData.filter((row) => {
      if (!row) return false;
      const g = String(row.gender || "unknown").toLowerCase().trim();
      if (genderFilter === "all") return true;
      if (genderFilter === "male") return g === "male";
      if (genderFilter === "female") return g === "female";
      if (genderFilter === "unknown") return g === "unknown" || (g !== "male" && g !== "female");
      return true;
    });
  }, [detailedData, genderFilter]);

  const handleDetailedSort = (field) => {
    if (detailedSortField === field) {
      if (detailedSortOrder === "desc") setDetailedSortOrder("asc");
      else if (detailedSortOrder === "asc") {
        setDetailedSortField(null);
        setDetailedSortOrder(null);
      }
    } else {
      setDetailedSortField(field);
      setDetailedSortOrder("desc");
    }
  };

  const handleSummarySort = (field) => {
    if (summarySortField === field) {
      if (summarySortOrder === "desc") setSummarySortOrder("asc");
      else if (summarySortOrder === "asc") {
        setSummarySortField(null);
        setSummarySortOrder(null);
      }
    } else {
      setSummarySortField(field);
      setSummarySortOrder("desc");
    }
  };

  const getMetricRawVal = (row, field) => {
    if (!row) return null;
    const spend = Number(row.spend || 0);
    const purchases = Number(row.purchases || 0);
    const revenue = Number(row.purchase_conversion_value || row.revenue || 0);

    if (field === "cpr") {
      return calculateAggregatedCpr(spend, purchases);
    }
    if (field === "roas") {
      return calculateAggregatedRoas(revenue, spend);
    }
    if (field === "add_to_cart") {
      return Number(row.actions_add_to_cart ?? row.add_to_cart ?? 0);
    }
    if (field === "initiate_checkout") {
      return Number(row.actions_initiate_checkout ?? row.initiate_checkout ?? 0);
    }
    if (field === "revenue") {
      return revenue;
    }
    return row[field] !== undefined && row[field] !== null ? Number(row[field]) : null;
  };

  // Sorted Detailed Data (Numeric comparison)
  const sortedDetailedData = useMemo(() => {
    if (!detailedSortField || !detailedSortOrder) return filteredDetailedData;

    return [...filteredDetailedData].sort((a, b) => {
      if (["age", "gender"].includes(detailedSortField)) {
        const valA = String(a[detailedSortField] || "").toLowerCase();
        const valB = String(b[detailedSortField] || "").toLowerCase();
        if (valA < valB) return detailedSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return detailedSortOrder === "asc" ? 1 : -1;
        return 0;
      }

      const numA = getMetricRawVal(a, detailedSortField);
      const numB = getMetricRawVal(b, detailedSortField);

      if (numA === null && numB === null) return 0;
      if (numA === null) return 1; // Place nulls at end
      if (numB === null) return -1;

      return detailedSortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [filteredDetailedData, detailedSortField, detailedSortOrder]);

  // Sorted Summary Data
  const sortedSummaryData = useMemo(() => {
    if (!summarySortField || !summarySortOrder) return ageGroupSummary;

    return [...ageGroupSummary].sort((a, b) => {
      if (summarySortField === "age") {
        const valA = String(a.age || "").toLowerCase();
        const valB = String(b.age || "").toLowerCase();
        if (valA < valB) return summarySortOrder === "asc" ? -1 : 1;
        if (valA > valB) return summarySortOrder === "asc" ? 1 : -1;
        return 0;
      }

      const numA = getMetricRawVal(a, summarySortField);
      const numB = getMetricRawVal(b, summarySortField);

      if (numA === null && numB === null) return 0;
      if (numA === null) return 1;
      if (numB === null) return -1;

      return summarySortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [ageGroupSummary, summarySortField, summarySortOrder]);

  const renderSortIndicator = (currentField, activeField, activeOrder) => {
    if (activeField !== currentField) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return <span style={{ marginLeft: "4px", color: "#0A84FF" }}>{activeOrder === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. AGE GROUP SUMMARY TABLE */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 12px)",
          border: "1px solid var(--color-border, #E5E7EB)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border, #E5E7EB)", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Age Group Summary
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Aggregated overview by age group (Male + Female + Unknown combined)
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #0F172A)", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", textAlign: "left", backgroundColor: "#FFFFFF", color: "var(--color-text-secondary, #64748B)" }}>
                <th
                  onClick={() => handleSummarySort("age")}
                  style={{
                    padding: "12px 18px",
                    cursor: "pointer",
                    userSelect: "none",
                    fontWeight: summarySortField === "age" ? "700" : "600",
                    color: summarySortField === "age" ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  }}
                >
                  Age Group
                  {renderSortIndicator("age", summarySortField, summarySortOrder)}
                </th>
                {tableMetrics.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSummarySort(col.key)}
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      fontWeight: summarySortField === col.key ? "700" : "600",
                      color: summarySortField === col.key ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    }}
                  >
                    {col.label}
                    {renderSortIndicator(col.key, summarySortField, summarySortOrder)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSummaryData.length === 0 ? (
                <tr>
                  <td colSpan={tableMetrics.length + 1} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                    No age group data available.
                  </td>
                </tr>
              ) : (
                sortedSummaryData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", transition: "background-color 0.15s ease" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "650" }}>{row.age}</td>
                    {tableMetrics.map((col) => {
                      const val = getMetricRawVal(row, col.key);
                      const formatted = formatAudienceMetricValue(val, col.format, currency);
                      return (
                        <td key={col.key} style={{ padding: "12px 18px", fontWeight: ["spend", "revenue", "cpr", "roas"].includes(col.key) ? "600" : "400", textAlign: "right" }}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. DETAILED DEMOGRAPHICS TABLE */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 12px)",
          border: "1px solid var(--color-border, #E5E7EB)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border, #E5E7EB)", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              Detailed Demographics Data
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Exact demographic breakdown ({sortedDetailedData.length} records) · Click header to sort
            </span>
          </div>

          {/* Gender Filter Chips Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#94A3B8" style={{ marginRight: "4px" }} />
            {[
              { id: "all", label: "All" },
              { id: "male", label: "Male" },
              { id: "female", label: "Female" },
              { id: "unknown", label: "Unknown" },
            ].map((chip) => {
              const active = genderFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setGenderFilter(chip.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: active ? "1px solid #0A84FF" : "1px solid var(--color-border, #CBD5E1)",
                    backgroundColor: active ? "rgba(10, 132, 255, 0.08)" : "#FFFFFF",
                    color: active ? "#0A84FF" : "#64748B",
                    fontSize: "12px",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: "auto", maxHeight: "600px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #0F172A)", fontSize: "0.85rem" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 5, backgroundColor: "#FFFFFF" }}>
              <tr style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", textAlign: "left", color: "var(--color-text-secondary, #64748B)" }}>
                <th
                  onClick={() => handleDetailedSort("age")}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: detailedSortField === "age" ? "700" : "600",
                    color: detailedSortField === "age" ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  }}
                >
                  Age Group
                  {renderSortIndicator("age", detailedSortField, detailedSortOrder)}
                </th>
                <th
                  onClick={() => handleDetailedSort("gender")}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: detailedSortField === "gender" ? "700" : "600",
                    color: detailedSortField === "gender" ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  }}
                >
                  Gender
                  {renderSortIndicator("gender", detailedSortField, detailedSortOrder)}
                </th>

                {/* Dynamic Configured Metric Columns */}
                {tableMetrics.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleDetailedSort(col.key)}
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      fontWeight: detailedSortField === col.key ? "700" : "600",
                      color: detailedSortField === col.key ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    }}
                  >
                    {col.label}
                    {renderSortIndicator(col.key, detailedSortField, detailedSortOrder)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDetailedData.length === 0 ? (
                <tr>
                  <td colSpan={tableMetrics.length + 2} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                    No demographic records match your current filters.
                  </td>
                </tr>
              ) : (
                sortedDetailedData.map((row, idx) => {
                  const gStr = String(row.gender || "unknown").toLowerCase();
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid var(--color-border, #E5E7EB)",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface-subtle, #F1F5F9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>{row.age || "Unknown"}</td>
                      <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor:
                              gStr === "male"
                                ? "rgba(10, 132, 255, 0.08)"
                                : gStr === "female"
                                ? "rgba(236, 72, 153, 0.08)"
                                : "var(--color-surface-subtle, #F1F5F9)",
                            color:
                              gStr === "male"
                                ? "#0A84FF"
                                : gStr === "female"
                                ? "#EC4899"
                                : "var(--color-text-secondary, #64748B)",
                          }}
                        >
                          {gStr === "male" ? "Male" : gStr === "female" ? "Female" : row.gender || "Unknown"}
                        </span>
                      </td>

                      {/* Dynamic Metric Cells */}
                      {tableMetrics.map((col) => {
                        const val = getMetricRawVal(row, col.key);
                        const formatted = formatAudienceMetricValue(val, col.format, currency);
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontWeight: ["spend", "revenue", "cpr", "roas", "ctr"].includes(col.key) ? "600" : "400",
                            }}
                          >
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AudienceTablesSection;
