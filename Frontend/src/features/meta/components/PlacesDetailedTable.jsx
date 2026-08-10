import React, { useState, useEffect, useMemo } from "react";
import Pagination from "../../../components/ui/Pagination.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesDetailedTable Component.
 * Full detailed geographic table with frontend sorting, rows-per-page selector (10, 25, 50),
 * proper pagination, and responsive horizontal scrolling.
 */
export const PlacesDetailedTable = ({ data = [], currency = "INR" }) => {
  const [sortField, setSortField] = useState("spend");
  const [sortOrder, setSortOrder] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination to page 1 whenever underlying dataset or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // 1. Sort complete dataset FIRST before pagination
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

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
  }, [data, sortField, sortOrder]);

  // 2. Slice paginated subset for rendering
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return <span style={{ marginLeft: "4px", color: "#0A84FF" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-card, 16px)",
        border: "1px solid var(--color-border, #E8EAED)",
        overflow: "hidden",
        boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
      }}
    >
      {/* Table Card Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border, #E8EAED)", backgroundColor: "var(--color-surface, #F7F9FC)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
            Detailed Geographic Data
          </h4>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
            Location metrics breakdown ({data.length.toLocaleString()} total records) · Click column header to sort
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "#FFFFFF", color: "var(--color-text-secondary, #64748B)" }}>
              {[
                { field: "country", label: "Country", align: "left" },
                { field: "region", label: "Region", align: "left" },
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
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted, #94A3B8)" }}>
                  No geographic records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
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
                  <td style={{ padding: "14px 18px", fontWeight: "700" }}>
                    {row.country ? (
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          backgroundColor: "var(--color-surface, #F7F9FC)",
                          color: "var(--color-text-secondary, #64748B)",
                          border: "1px solid var(--color-border, #E8EAED)",
                        }}
                      >
                        {row.country}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "600", color: "var(--color-text-primary, #111827)" }}>
                    {row.region || "Unknown Region"}
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

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
};

export default PlacesDetailedTable;
