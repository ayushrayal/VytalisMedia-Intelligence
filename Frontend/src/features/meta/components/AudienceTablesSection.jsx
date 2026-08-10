import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceTablesSection Component.
 * Contains:
 * 1. Age Group Summary Table (Aggregates male + female for each age group with weighted CTR & CPC)
 * 2. Detailed Demographics Table with frontend column sorting & responsive scrolling
 */
export const AudienceTablesSection = ({ ageGroupSummary = [], detailedData = [], currency = "INR" }) => {
  const [sortField, setSortField] = useState("spend");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sort Detailed Data
  const sortedDetailedData = useMemo(() => {
    return [...detailedData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Convert to numbers if numeric metric
      if (["spend", "impressions", "reach", "clicks", "ctr", "cpc"].includes(sortField)) {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [detailedData, sortField, sortOrder]);

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return <span style={{ marginLeft: "4px", color: "#0A84FF" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. AGE GROUP SUMMARY TABLE */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border, #E8EAED)", backgroundColor: "var(--color-surface, #F7F9FC)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Age Group Summary
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Aggregated overview by age group (Male + Female combined)
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "#FFFFFF", color: "var(--color-text-secondary, #64748B)" }}>
                <th style={{ padding: "12px 18px" }}>Age Group</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Total Spend</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Total Reach</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Total Clicks</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Weighted CTR</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Weighted CPC</th>
              </tr>
            </thead>
            <tbody>
              {ageGroupSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                    No age group data available.
                  </td>
                </tr>
              ) : (
                ageGroupSummary.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", transition: "background-color 0.15s ease" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "700" }}>{row.age}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, currency)}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                    <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, currency)}</td>
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
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border, #E8EAED)", backgroundColor: "var(--color-surface, #F7F9FC)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              Detailed Demographics Data
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
              Exact demographic breakdown ({detailedData.length} records) · Click header to sort
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "#FFFFFF", color: "var(--color-text-secondary, #64748B)" }}>
                {[
                  { field: "age", label: "Age Group", align: "left" },
                  { field: "gender", label: "Gender", align: "left" },
                  { field: "spend", label: "Spend", align: "right" },
                  { field: "impressions", label: "Impressions", align: "right" },
                  { field: "reach", label: "Reach", align: "right" },
                  { field: "clicks", label: "Clicks", align: "right" },
                  { field: "ctr", label: "CTR", align: "right" },
                  { field: "cpc", label: "CPC", align: "right" },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    style={{
                      padding: "14px 18px",
                      textAlign: col.align,
                      cursor: "pointer",
                      userSelect: "none",
                      fontWeight: sortField === col.field ? "700" : "600",
                      color: sortField === col.field ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                    }}
                  >
                    {col.label}
                    {renderSortIndicator(col.field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDetailedData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                    No demographic rows found.
                  </td>
                </tr>
              ) : (
                sortedDetailedData.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--color-border, #E8EAED)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-surface-hover, #F2F8FF)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: "600" }}>{row.age || "Unknown"}</td>
                    <td style={{ padding: "14px 18px", textTransform: "capitalize", fontWeight: "500" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          backgroundColor:
                            String(row.gender).toLowerCase() === "male"
                              ? "rgba(10, 132, 255, 0.08)"
                              : String(row.gender).toLowerCase() === "female"
                              ? "rgba(236, 72, 153, 0.08)"
                              : "var(--color-surface, #F7F9FC)",
                          color:
                            String(row.gender).toLowerCase() === "male"
                              ? "#0A84FF"
                              : String(row.gender).toLowerCase() === "female"
                              ? "#EC4899"
                              : "var(--color-text-secondary, #64748B)",
                        }}
                      >
                        {String(row.gender).toLowerCase() === "male"
                          ? "👨 Male"
                          : String(row.gender).toLowerCase() === "female"
                          ? "👩 Female"
                          : row.gender || "Unknown"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency || currency)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency || currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AudienceTablesSection;
