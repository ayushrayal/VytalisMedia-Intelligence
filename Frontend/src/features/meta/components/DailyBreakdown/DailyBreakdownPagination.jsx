import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DailyBreakdownPagination Component.
 * Supports configurable rows per page (10, 25, 50, 100, All) and page navigation controls.
 */
export const DailyBreakdownPagination = ({
  totalRecords = 0,
  currentPage = 1,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}) => {
  if (totalRecords === 0) return null;

  const isAll = rowsPerPage === "all";
  const limit = isAll ? totalRecords : Number(rowsPerPage);
  const totalPages = isAll ? 1 : Math.ceil(totalRecords / limit);

  const startIndex = totalRecords === 0 ? 0 : isAll ? 1 : (currentPage - 1) * limit + 1;
  const endIndex = isAll ? totalRecords : Math.min(currentPage * limit, totalRecords);

  // Generate visible page numbers list
  const pageNumbers = [];
  if (!isAll && totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pageNumbers.push(i);
      } else if (
        (i === currentPage - 2 && i > 1) ||
        (i === currentPage + 2 && i < totalPages)
      ) {
        pageNumbers.push("...");
      }
    }
  }

  // Remove contiguous duplicate ellipsis
  const filteredPageNumbers = pageNumbers.filter(
    (item, index) => item !== "..." || pageNumbers[index - 1] !== "..."
  );

  return (
    <div
      style={{
        padding: "14px 20px",
        borderTop: "1px solid #E5E7EB",
        backgroundColor: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "13px",
        color: "#64748B",
      }}
    >
      {/* 1. Showing Records Range */}
      <div>
        Showing <strong style={{ color: "#0F172A" }}>{startIndex}–{endIndex}</strong> of{" "}
        <strong style={{ color: "#0F172A" }}>{totalRecords}</strong>
      </div>

      {/* 2. Rows Per Page Selector & Page Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* Rows Per Page Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              const val = e.target.value === "all" ? "all" : Number(e.target.value);
              onRowsPerPageChange(val);
            }}
            style={{
              height: "32px",
              padding: "0 8px",
              borderRadius: "6px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#0F172A",
              fontSize: "13px",
              fontWeight: "600",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Navigation Page Buttons (Hidden if "All" is selected) */}
        {!isAll && totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Previous Button */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "32px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: currentPage <= 1 ? "#CBD5E1" : "#0F172A",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page Number Buttons */}
            {filteredPageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "#94A3B8" }}>
                    ...
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  style={{
                    height: "32px",
                    minWidth: "32px",
                    padding: "0 6px",
                    borderRadius: "6px",
                    border: isCurrent ? "1px solid #1683FF" : "1px solid #E2E8F0",
                    backgroundColor: isCurrent ? "#1683FF" : "#FFFFFF",
                    color: isCurrent ? "#FFFFFF" : "#0F172A",
                    fontSize: "12.5px",
                    fontWeight: isCurrent ? "650" : "500",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "32px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: currentPage >= totalPages ? "#CBD5E1" : "#0F172A",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBreakdownPagination;
