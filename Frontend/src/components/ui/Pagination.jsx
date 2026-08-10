import React, { useMemo } from "react";

/**
 * Reusable SaaS Pagination Component for Vytalis Intelligence.
 *
 * Supports:
 * - Intelligent page range generation with ellipsis (e.g. 1 ... 4 5 6 ... 246)
 * - Accessible ← Previous and Next → buttons
 * - Rows per page selector dropdown (10, 25, 50)
 * - Mobile responsive layout
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  // Compute item index bounds for display (1-indexed)
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);

  // Generate intelligent page numbers array with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showLeftEllipsis = safeCurrentPage > 4;
    const showRightEllipsis = safeCurrentPage < totalPages - 3;

    pages.push(1);

    if (showLeftEllipsis) {
      pages.push("...");
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (showRightEllipsis) {
      pages.push("...");
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  if (totalItems === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderTop: "1px solid var(--color-border, #E8EAED)",
        backgroundColor: "var(--color-surface, #F7F9FC)",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "0.85rem",
        color: "var(--color-text-secondary, #64748B)",
      }}
    >
      {/* Left Info & Page Size Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span>
          Showing <strong>{startIndex.toLocaleString()}</strong>–<strong>{endIndex.toLocaleString()}</strong> of{" "}
          <strong>{totalItems.toLocaleString()}</strong>
        </span>

        {onPageSizeChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label htmlFor="page-size-select" style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)" }}>
              Rows per page:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Select rows per page"
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid var(--color-border, #E8EAED)",
                backgroundColor: "#FFFFFF",
                color: "var(--color-text-primary, #111827)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Controls: Previous / Page Numbers / Next */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Previous Button */}
        <button
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Go to previous page"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--color-border, #E8EAED)",
            backgroundColor: safeCurrentPage <= 1 ? "transparent" : "#FFFFFF",
            color: safeCurrentPage <= 1 ? "var(--color-text-muted, #94A3B8)" : "var(--color-text-primary, #111827)",
            fontSize: "0.8rem",
            fontWeight: "600",
            cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            opacity: safeCurrentPage <= 1 ? 0.6 : 1,
          }}
        >
          ← Previous
        </button>

        {/* Page Number Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: "4px 6px",
                    color: "var(--color-text-muted, #94A3B8)",
                    fontSize: "0.8rem",
                  }}
                >
                  …
                </span>
              );
            }

            const isSelected = page === safeCurrentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange && onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={isSelected ? "page" : undefined}
                style={{
                  minWidth: "30px",
                  height: "30px",
                  padding: "0 6px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #0A84FF" : "1px solid var(--color-border, #E8EAED)",
                  backgroundColor: isSelected ? "#0A84FF" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "var(--color-text-primary, #111827)",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages || totalPages === 0}
          aria-label="Go to next page"
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--color-border, #E8EAED)",
            backgroundColor: safeCurrentPage >= totalPages || totalPages === 0 ? "transparent" : "#FFFFFF",
            color: safeCurrentPage >= totalPages || totalPages === 0 ? "var(--color-text-muted, #94A3B8)" : "var(--color-text-primary, #111827)",
            fontSize: "0.8rem",
            fontWeight: "600",
            cursor: safeCurrentPage >= totalPages || totalPages === 0 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            opacity: safeCurrentPage >= totalPages || totalPages === 0 ? 0.6 : 1,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
