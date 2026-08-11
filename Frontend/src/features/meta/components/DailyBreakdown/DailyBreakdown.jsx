import React, { useState, useEffect, useMemo, useCallback } from "react";
import DailyBreakdownCustomizer from "./DailyBreakdownCustomizer.jsx";
import DailyBreakdownTable from "./DailyBreakdownTable.jsx";
import DailyBreakdownPagination from "./DailyBreakdownPagination.jsx";
import {
  DEFAULT_DAILY_BREAKDOWN_FIELD_IDS,
  ALL_DAILY_BREAKDOWN_FIELDS,
  getRowMetricValue,
} from "./dailyBreakdownFields.js";

const SESSION_STORAGE_KEY = "vytalis:meta-overview:daily-breakdown-fields";

/**
 * Main DailyBreakdown Container Component for Meta Overview.
 * Features:
 * - Customizable field column selector ("What do you want to see today?")
 * - Session storage persistence
 * - Numeric/Date column sorting (Ascending / Descending)
 * - Configurable pagination (10, 25, 50, 100, All)
 */
export const DailyBreakdown = ({
  data = [],
  currency = "INR",
  emptyStateAction,
}) => {
  // Load saved field preferences from sessionStorage or fallback to defaults
  const [selectedFields, setSelectedFields] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.includes("date")) {
          const validIds = ALL_DAILY_BREAKDOWN_FIELDS.map((f) => f.id);
          const filtered = parsed.filter((id) => validIds.includes(id));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {
      // Ignore parse errors and fallback
    }
    return DEFAULT_DAILY_BREAKDOWN_FIELD_IDS;
  });

  // Local draft state for Customizer
  const [draftFields, setDraftFields] = useState(selectedFields);

  // Sorting state (default: date descending)
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Save selected fields to sessionStorage when applied
  const handleApply = (newFields) => {
    setSelectedFields(newFields);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newFields));
    } catch {
      // Ignore storage quota errors
    }
  };

  // Reset to predefined default 10 fields
  const handleReset = () => {
    setDraftFields(DEFAULT_DAILY_BREAKDOWN_FIELD_IDS);
    setSelectedFields(DEFAULT_DAILY_BREAKDOWN_FIELD_IDS);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Reset pagination to page 1 whenever total data length or date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Handle column header click for sorting
  const handleSortChange = useCallback(
    (fieldId) => {
      if (sortField === fieldId) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(fieldId);
        setSortDirection("desc");
      }
    },
    [sortField]
  );

  // Sort raw data rows
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const list = [...data];

    list.sort((a, b) => {
      let valA = getRowMetricValue(a, sortField);
      let valB = getRowMetricValue(b, sortField);

      if (valA === null || valA === undefined || valA === "") return 1;
      if (valB === null || valB === undefined || valB === "") return -1;

      if (sortField === "date") {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }
        return sortDirection === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }

      const numA = Number(valA);
      const numB = Number(valB);

      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;

      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return list;
  }, [data, sortField, sortDirection]);

  // Slice data for pagination
  const paginatedData = useMemo(() => {
    if (rowsPerPage === "all") return sortedData;
    const limit = Number(rowsPerPage);
    const startIndex = (currentPage - 1) * limit;
    return sortedData.slice(startIndex, startIndex + limit);
  }, [sortedData, currentPage, rowsPerPage]);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. Header & Customizable Field Selector Controls */}
      <DailyBreakdownCustomizer
        totalRecordsCount={data.length}
        draftFields={draftFields}
        setDraftFields={setDraftFields}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* 2. Dynamic Table View or Empty State */}
      {data.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
            No matching records
          </p>
          <p style={{ margin: 0, fontSize: "13px" }}>
            No daily performance records match your active spend filter or date range.
          </p>
          {emptyStateAction && <div style={{ marginTop: "16px" }}>{emptyStateAction}</div>}
        </div>
      ) : (
        <>
          <DailyBreakdownTable
            data={paginatedData}
            selectedFields={selectedFields}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            currency={currency}
          />

          {/* 3. Pagination Controls */}
          <DailyBreakdownPagination
            totalRecords={data.length}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(newRows) => {
              setRowsPerPage(newRows);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
};

export default DailyBreakdown;
