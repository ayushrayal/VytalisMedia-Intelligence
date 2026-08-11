import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAdsets } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * AdSets Page Component.
 * Features:
 * - Ad set audience delivery and performance table
 * - Global dataset sorting (Ad Set Name, Campaign, Status, Spend, Impressions, Reach, Clicks, CTR, CPC)
 * - Client-side pagination (Default: 10 per page, options: 10, 25, 50)
 */
export const AdSets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting State
  const [sortField, setSortField] = useState("spend");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      const rawStatus = row.effective_status || row.adset_status || row.status || "ACTIVE";
      const normStatus = getNormalizedStatus(rawStatus);
      const matchesStatus = statusFilter === "all" || normStatus === statusFilter;

      return matchesSpend && matchesStatus;
    });
  }, [data, spendFilter, statusFilter]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Meta Ad Sets"
        subtitle="Ad Set target audience delivery and performance"
        actions={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
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
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#0F172A", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left", backgroundColor: "#F1F5F9", color: "#64748B", whiteSpace: "nowrap" }}>
                  {[
                    { field: "adset_name", label: "Ad Set Name", align: "left" },
                    { field: "campaign", label: "Campaign", align: "left" },
                    { field: "status", label: "Status", align: "left" },
                    { field: "spend", label: "Spend", align: "right" },
                    { field: "actions_add_to_cart", label: "Add to Cart", align: "right" },
                    { field: "actions_initiate_checkout", label: "Checkout Initiated", align: "right" },
                    { field: "reach", label: "Reach", align: "right" },
                    { field: "impressions", label: "Impressions", align: "right" },
                    { field: "clicks", label: "Clicks", align: "right" },
                    { field: "ctr", label: "CTR", align: "right" },
                    { field: "unique_outbound_clicks_ctr_outbound_click", label: "Unique Outbound CTR", align: "right" },
                    { field: "cpc", label: "CPC", align: "right" },
                    { field: "cpm", label: "CPM", align: "right" },
                    { field: "frequency", label: "Frequency", align: "right" },
                  ].map((col) => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      style={{
                        padding: "12px 16px",
                        textAlign: col.align,
                        cursor: "pointer",
                        userSelect: "none",
                        fontWeight: sortField === col.field ? "700" : "600",
                        color: sortField === col.field ? "#0A84FF" : "#64748B",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                      {renderSortIndicator(col.field)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => {
                  const rawStatus = row.effective_status || row.adset_status || row.status || "ACTIVE";
                  const adsetId = row.adset_id || row.id;

                  const rawAddToCart = row.actions_add_to_cart ?? row.add_to_cart;
                  const rawCheckout = row.actions_initiate_checkout ?? row.initiate_checkout;
                  const rawUniqueCtr = row.unique_outbound_clicks_ctr_outbound_click ?? row.unique_outbound_clicks_ctr;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        transition: "background-color 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ fontWeight: "600", color: "#0F172A", display: "block" }}>
                          {row.adset_name || row.adset || "-"}
                        </strong>
                        {adsetId && (
                          <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "400" }}>
                            ID: {adsetId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>{row.campaign || "-"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={rawStatus} />
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {rawAddToCart !== null && rawAddToCart !== undefined ? formatNumber(rawAddToCart) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {rawCheckout !== null && rawCheckout !== undefined ? formatNumber(rawCheckout) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>
                        {rawUniqueCtr !== null && rawUniqueCtr !== undefined ? formatPercentage(rawUniqueCtr) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>
                        {row.cpm !== null && row.cpm !== undefined ? formatCurrency(row.cpm, row.currency) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {row.frequency !== null && row.frequency !== undefined ? Number(row.frequency).toFixed(2) : "—"}
                      </td>
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
    </div>
  );
};

export default AdSets;
