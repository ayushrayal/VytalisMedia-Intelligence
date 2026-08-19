import React, { useState, useEffect, useCallback, useMemo } from "react";
import ColumnCustomizer from "../../../components/table/ColumnCustomizer.jsx";
import useColumnPreferences from "../../../hooks/useColumnPreferences.js";
import { ADSET_COLUMNS } from "../../../config/tableColumns.js";
import { getAdsets } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import AdSetDetailsDrawer from "../components/AdSetDetailsDrawer.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";
import { aggregateAdSetsData } from "../utils/adsetAggregator.js";

/**
 * AdSets Page Component.
 * Features:
 * - Reusable Column Customization System with localStorage persistence
 * - Ad set audience delivery and performance table
 * - Global dataset sorting (Ad Set Name, Campaign, Status, Spend, Impressions, Reach, Clicks, CTR, CPC)
 * - Sticky first column for Ad Set Name
 * - Client-side pagination (Default: 10 per page, options: 10, 25, 50)
 */
export const AdSets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Column Preference Hook for Ad Sets
  const {
    allColumns,
    orderedKeys,
    visibleKeys,
    visibleColumns,
    savePreferences,
    resetToDefaults,
  } = useColumnPreferences("vytalis_adset_columns", ADSET_COLUMNS);

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting State
  const [sortField, setSortField] = useState("spend");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Hover state for sticky cell background styling
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Drawer States
  const [selectedAdSet, setSelectedAdSet] = useState(null);
  const [isAdSetDrawerOpen, setIsAdSetDrawerOpen] = useState(false);

  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isCreativeDrawerOpen, setIsCreativeDrawerOpen] = useState(false);

  const handleRowClick = (row) => {
    setSelectedAdSet(row);
    setIsAdSetDrawerOpen(true);
  };

  const handleSelectCreative = (creative) => {
    setSelectedCreative(creative);
    setIsCreativeDrawerOpen(true);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdsets(dateParams);
      if (res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregated Unique Ad Sets Dataset (grouped by adset_id)
  const aggregatedData = useMemo(() => {
    return aggregateAdSetsData(data);
  }, [data]);

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return aggregatedData.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      const rawStatus = row.effective_status || row.adset_status || row.status || "ACTIVE";
      const normStatus = getNormalizedStatus(rawStatus);
      const matchesStatus = statusFilter === "all" || normStatus === statusFilter;

      return matchesSpend && matchesStatus;
    });
  }, [aggregatedData, spendFilter, statusFilter]);

  // 1. Sort complete dataset FIRST before pagination
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (["spend", "impressions", "reach", "clicks", "ctr", "cpc", "cpm", "frequency", "purchases", "purchase_conversion_value", "cost_per_result", "purchase_roas", "actions_add_to_cart", "actions_initiate_checkout", "unique_outbound_clicks_ctr_outbound_click"].includes(sortField)) {
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
  }, [filteredData, sortField, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, spendFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 2. Slice paginated subset for DOM rendering
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return <span style={{ marginLeft: "4px", color: "#0A84FF" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  const handleClearFilters = () => {
    setSpendFilter("all");
    setStatusFilter("all");
  };

  // Cell Renderer function for ad set fields
  const renderCellContent = (row, colId) => {
    const rawAddToCart = row.actions_add_to_cart ?? row.add_to_cart;
    const rawCheckout = row.actions_initiate_checkout ?? row.initiate_checkout;
    const rawUniqueCtr = row.unique_outbound_clicks_ctr_outbound_click ?? row.unique_outbound_clicks_ctr;
    const rawStatus = row.effective_status || row.adset_status || row.status || "ACTIVE";
    const adsetId = row.adset_id || row.id;

    switch (colId) {
      case "adset_name":
        return (
          <>
            <strong style={{ fontWeight: "600", color: "#0F172A", display: "block" }}>
              {row.adset_name || row.adset || "—"}
            </strong>
            {adsetId && (
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "400" }}>
                ID: {adsetId}
              </span>
            )}
          </>
        );
      case "campaign":
        return <span style={{ color: "#64748B" }}>{row.campaign || "—"}</span>;
      case "status":
        return <StatusBadge status={rawStatus} />;
      case "spend":
        return formatCurrency(row.spend, row.currency);
      case "cost_per_result":
        return row.cost_per_result !== null && row.cost_per_result !== undefined
          ? formatCurrency(row.cost_per_result, row.currency)
          : "—";
      case "purchases":
        return row.purchases !== null && row.purchases !== undefined
          ? formatNumber(row.purchases)
          : "—";
      case "purchase_conversion_value":
        return row.purchase_conversion_value !== null && row.purchase_conversion_value !== undefined
          ? formatCurrency(row.purchase_conversion_value, row.currency)
          : "—";
      case "purchase_roas":
        return row.purchase_roas !== null && row.purchase_roas !== undefined ? (
          <span style={{ color: "#16A34A", fontWeight: "600" }}>
            {`${Number(row.purchase_roas).toFixed(2)}x`}
          </span>
        ) : (
          "—"
        );
      case "actions_add_to_cart":
        return rawAddToCart !== null && rawAddToCart !== undefined
          ? formatNumber(rawAddToCart)
          : "—";
      case "actions_initiate_checkout":
        return rawCheckout !== null && rawCheckout !== undefined
          ? formatNumber(rawCheckout)
          : "—";
      case "reach":
        return formatNumber(row.reach);
      case "impressions":
        return formatNumber(row.impressions);
      case "clicks":
        return formatNumber(row.clicks);
      case "ctr":
        return formatPercentage(row.ctr);
      case "unique_outbound_clicks_ctr_outbound_click":
        return rawUniqueCtr !== null && rawUniqueCtr !== undefined
          ? formatPercentage(rawUniqueCtr)
          : "—";
      case "cpc":
        return formatCurrency(row.cpc, row.currency);
      case "cpm":
        return row.cpm !== null && row.cpm !== undefined
          ? formatCurrency(row.cpm, row.currency)
          : "—";
      case "frequency":
        return row.frequency !== null && row.frequency !== undefined
          ? Number(row.frequency).toFixed(2)
          : "—";
      default:
        return row[colId] !== undefined && row[colId] !== null ? String(row[colId]) : "—";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Meta Ad Sets"
        subtitle="Ad Set target audience delivery and performance"
        actions={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Column Customizer Button & Panel */}
            <ColumnCustomizer
              allColumns={allColumns}
              orderedKeys={orderedKeys}
              visibleKeys={visibleKeys}
              onApply={savePreferences}
              onReset={resetToDefaults}
            />

            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <Skeleton height="360px" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Ad Sets Found" description="No ad set records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No ad set records match your selected spend or status filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, color: "#0F172A", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left", backgroundColor: "#F1F5F9", color: "#64748B", whiteSpace: "nowrap" }}>
                  {visibleColumns.map((col, colIdx) => {
                    const isSticky = colIdx === 0;
                    return (
                      <th
                        key={col.id}
                        onClick={() => handleSort(col.id)}
                        style={{
                          padding: "12px 16px",
                          textAlign: col.align,
                          cursor: "pointer",
                          userSelect: "none",
                          fontWeight: sortField === col.id ? "700" : "600",
                          color: sortField === col.id ? "#0A84FF" : "#64748B",
                          whiteSpace: "nowrap",
                          position: isSticky ? "sticky" : "static",
                          left: isSticky ? 0 : "auto",
                          backgroundColor: "#F1F5F9",
                          zIndex: isSticky ? 2 : 1,
                          borderBottom: "1px solid #E5E7EB",
                          boxShadow: isSticky ? "2px 0 5px rgba(15, 23, 42, 0.04)" : "none",
                        }}
                      >
                        {col.label}
                        {renderSortIndicator(col.id)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => {
                  const isHovered = hoveredIndex === idx;

                  return (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(row)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        transition: "background-color 0.15s ease",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        backgroundColor: isHovered ? "#F8FAFC" : "transparent",
                      }}
                    >
                      {visibleColumns.map((col, colIdx) => {
                        const isSticky = colIdx === 0;
                        return (
                          <td
                            key={col.id}
                            style={{
                              padding: "12px 16px",
                              textAlign: col.align,
                              fontWeight: ["spend", "cost_per_result", "purchases", "purchase_conversion_value", "ctr", "cpc", "cpm"].includes(col.id) ? "600" : "normal",
                              position: isSticky ? "sticky" : "static",
                              left: isSticky ? 0 : "auto",
                              backgroundColor: isSticky ? (isHovered ? "#F8FAFC" : "#FFFFFF") : "transparent",
                              zIndex: isSticky ? 1 : 0,
                              borderBottom: "1px solid #E5E7EB",
                              boxShadow: isSticky ? "2px 0 5px rgba(15, 23, 42, 0.04)" : "none",
                            }}
                          >
                            {renderCellContent(row, col.id)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
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
      )}

      {/* Ad Set Details Drawer */}
      <AdSetDetailsDrawer
        adset={selectedAdSet}
        isOpen={isAdSetDrawerOpen}
        onClose={() => setIsAdSetDrawerOpen(false)}
        dateParams={dateParams}
        onSelectCreative={handleSelectCreative}
        spendFilter={spendFilter}
        statusFilter={statusFilter}
      />

      {/* Nested Creative Details Drawer */}
      <CreativeDetailsDrawer
        creative={selectedCreative}
        isOpen={isCreativeDrawerOpen}
        onClose={() => setIsCreativeDrawerOpen(false)}
      />
    </div>
  );
};

export default AdSets;

