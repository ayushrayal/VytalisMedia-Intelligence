import React, { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceTablesSection Component.
 * Contains:
 * 1. Age Group Summary Table (Aggregates male + female + unknown for each age group)
 * 2. Detailed Demographics Table with compact Gender Filter & 14 KPI Column Raw Numeric Sorting
 */
export const AudienceTablesSection = ({ ageGroupSummary = [], detailedData = [], currency = "INR" }) => {
  // Detailed Table State
  const [genderFilter, setGenderFilter] = useState("all"); // "all" | "male" | "female" | "unknown"
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
      return purchases > 0 ? spend / purchases : null;
    }
    if (field === "roas") {
      return spend > 0 ? revenue / spend : null;
    }
    if (field === "add_to_cart") {
      return Number(row.actions_add_to_cart || row.add_to_cart || 0);
    }
    if (field === "initiate_checkout") {
      return Number(row.actions_initiate_checkout || row.initiate_checkout || 0);
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

  const formatCellVal = (val, type) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    const num = Number(val);
    if (type === "currency") return formatCurrency(num, currency);
    if (type === "roas") return `${num.toFixed(2)}x`;
    if (type === "percentage") return formatPercentage(num);
    return formatNumber(num);
  };

  const detailedColumns = [
    { field: "age", label: "Age Group", align: "left", type: "text" },
    { field: "gender", label: "Gender", align: "left", type: "text" },
    { field: "spend", label: "Spend", align: "right", type: "currency" },
    { field: "impressions", label: "Impressions", align: "right", type: "number" },
    { field: "reach", label: "Reach", align: "right", type: "number" },
    { field: "clicks", label: "Clicks", align: "right", type: "number" },
    { field: "ctr", label: "CTR", align: "right", type: "percentage" },
    { field: "cpc", label: "CPC", align: "right", type: "currency" },
    { field: "add_to_cart", label: "Add to Cart", align: "right", type: "number" },
    { field: "initiate_checkout", label: "Checkout Initiated", align: "right", type: "number" },
    { field: "purchases", label: "Purchases", align: "right", type: "number" },
    { field: "cpr", label: "Cost per Result", align: "right", type: "currency" },
    { field: "revenue", label: "Revenue", align: "right", type: "currency" },
    { field: "roas", label: "ROAS", align: "right", type: "roas" },
  ];

  const summaryColumns = [
    { field: "age", label: "Age Group", align: "left", type: "text" },
    { field: "spend", label: "Total Spend", align: "right", type: "currency" },
    { field: "add_to_cart", label: "Total Add to Cart", align: "right", type: "number" },
    { field: "initiate_checkout", label: "Total Checkout Initiated", align: "right", type: "number" },
    { field: "purchases", label: "Total Purchases", align: "right", type: "number" },
    { field: "cpr", label: "Cost per Result", align: "right", type: "currency" },
    { field: "revenue", label: "Total Revenue", align: "right", type: "currency" },
    { field: "roas", label: "ROAS", align: "right", type: "roas" },
  ];

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
                {summaryColumns.map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSummarySort(col.field)}
                    style={{
                      padding: "12px 18px",
                      textAlign: col.align,
                      cursor: "pointer",
                      userSelect: "none",
                      fontWeight: summarySortField === col.field ? "700" : "600",
                      color: summarySortField === col.field ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    }}
                  >
                    {col.label}
                    {renderSortIndicator(col.field, summarySortField, summarySortOrder)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSummaryData.length === 0 ? (
                <tr>
                  <td colSpan={summaryColumns.length} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                    No age group data available.
                  </td>
                </tr>
              ) : (
                sortedSummaryData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", transition: "background-color 0.15s ease" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "650" }}>{row.age}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(row.spend, "currency")}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatCellVal(row.add_to_cart, "number")}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatCellVal(row.initiate_checkout, "number")}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatCellVal(row.purchases, "number")}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "cpr"), "currency")}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(row.revenue, "currency")}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "roas"), "roas")}</td>
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
                {detailedColumns.map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleDetailedSort(col.field)}
                    style={{
                      padding: "12px 16px",
                      textAlign: col.align,
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      fontWeight: detailedSortField === col.field ? "700" : "600",
                      color: detailedSortField === col.field ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    }}
                  >
                    {col.label}
                    {renderSortIndicator(col.field, detailedSortField, detailedSortOrder)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDetailedData.length === 0 ? (
                <tr>
                  <td colSpan={detailedColumns.length} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
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
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(row.spend, "currency")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(row.impressions, "number")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(row.reach, "number")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(row.clicks, "number")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(row.ctr, "percentage")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(row.cpc, "currency")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "add_to_cart"), "number")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "initiate_checkout"), "number")}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatCellVal(row.purchases, "number")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "cpr"), "currency")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "revenue"), "currency")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCellVal(getMetricRawVal(row, "roas"), "roas")}</td>
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
