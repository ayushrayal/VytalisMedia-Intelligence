import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCampaigns } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CampaignDetailsDrawer from "../components/CampaignDetailsDrawer.jsx";
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

/**
 * Campaigns Page Component.
 * Features:
 * - Table delivery & performance breakdown
 * - Global dataset column sorting (Spend, CTR, CPC, Clicks, Reach, Name, etc.)
 * - Client-side pagination (Default: 10 per page, options: 10, 25, 50)
 * - Persistent pagination state across drawer open/close actions
 */
export const Campaigns = () => {
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

  // Drawer States
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [isCampaignDrawerOpen, setIsCampaignDrawerOpen] = useState(false);

  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isCreativeDrawerOpen, setIsCreativeDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCampaigns(dateParams);
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
      // 1. Spend Filter (numeric >= threshold)
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      // 2. Status Filter (normalized match)
      const rawStatus = row.campaign_status || row.campaign_effective_status || row.effective_status || row.status || "ACTIVE";
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

      if (["spend", "impressions", "reach", "clicks", "ctr", "cpc"].includes(sortField)) {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === "campaign") {
        valA = String(a.campaign || a.campaign_name || "").toLowerCase();
        valB = String(b.campaign || b.campaign_name || "").toLowerCase();
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Reset page to 1 whenever filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, spendFilter, statusFilter, sortField, sortOrder]);

  // Page Reset Safety clamp
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

  const handleRowClick = (row) => {
    const id = row.campaign_id || row.id || row.campaign;
    setSelectedCampaignId(id);
    setIsCampaignDrawerOpen(true);
  };

  const handleSelectCreative = (creative) => {
    setSelectedCreative(creative);
    setIsCreativeDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Meta Campaigns"
        subtitle="Campaign-level delivery and performance breakdown"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <Skeleton height="320px" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Campaigns Found" description="No campaign records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No campaign records match your selected spend or status filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "var(--radius-card, 16px)", border: "1px solid var(--color-border, #E8EAED)", overflow: "hidden", boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "var(--color-surface, #F7F9FC)", color: "var(--color-text-secondary, #64748B)" }}>
                  {[
                    { field: "campaign", label: "Campaign Name", align: "left" },
                    { field: "campaign_status", label: "Status", align: "left" },
                    { field: "campaign_objective", label: "Objective", align: "left" },
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
                {paginatedData.map((row, idx) => {
                  const rawStatus = row.campaign_status || row.campaign_effective_status || row.effective_status || row.status || "ACTIVE";
                  return (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(row)}
                      style={{
                        borderBottom: "1px solid var(--color-border, #E8EAED)",
                        transition: "background-color 0.15s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface-hover, #F2F8FF)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "14px 18px", fontWeight: "600" }}>{row.campaign || row.campaign_name || "-"}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={rawStatus} />
                      </td>
                      <td style={{ padding: "14px 18px" }}>{row.campaign_objective || "-"}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
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

      {/* Campaign Details Drawer */}
      <CampaignDetailsDrawer
        campaignId={selectedCampaignId}
        isOpen={isCampaignDrawerOpen}
        onClose={() => setIsCampaignDrawerOpen(false)}
        dateParams={dateParams}
        onSelectCreative={handleSelectCreative}
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

export default Campaigns;
