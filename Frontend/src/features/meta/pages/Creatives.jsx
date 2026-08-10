import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCreatives } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Creatives Page Component.
 * Features:
 * - Card grid breakdown for visual ad creative assets
 * - Desktop 4-column, Tablet 2-column, Mobile 1-column responsive layout
 * - Client-side pagination (Default: 12 per page, options: 12, 24, 48)
 * - Persistent pagination state across CreativeDetailsDrawer open/close actions
 */
export const Creatives = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Drawer Detail State
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCreatives(dateParams);
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
      // Spend Filter
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      // Status Filter (if status exists on row)
      const rawStatus = row.effective_status || row.ad_status || row.status;
      let matchesStatus = true;
      if (rawStatus && statusFilter !== "all") {
        const normStatus = getNormalizedStatus(rawStatus);
        matchesStatus = normStatus === statusFilter;
      }

      return matchesSpend && matchesStatus;
    });
  }, [data, spendFilter, statusFilter]);

  // Reset page to 1 whenever filters or underlying data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, spendFilter, statusFilter]);

  // Page Reset Safety clamp
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Slices paginated subset of 12/24/48 cards for rendering
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSpendFilter("all");
    setStatusFilter("all");
  };

  const hasStatusField = useMemo(() => {
    return data.some((row) => row.effective_status || row.ad_status || row.status);
  }, [data]);

  const handleCardClick = (creative) => {
    setSelectedCreative(creative);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Meta Ad Creatives"
        subtitle="Visual ad creative performance & engagement metrics"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            {hasStatusField && <StatusFilter value={statusFilter} onChange={setStatusFilter} />}
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          <Skeleton height="260px" />
          <Skeleton height="260px" />
          <Skeleton height="260px" />
          <Skeleton height="260px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Ad Creatives Found" description="No ad creative performance records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No ad creative records match your selected spend or status filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Creative Cards Grid (4 columns desktop, 2 tablet, 1 mobile) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {paginatedData.map((row, idx) => {
              const imageUrl = row.thumbnail_url || row.image_url;
              const rawStatus = row.effective_status || row.ad_status || row.status;
              return (
                <div
                  key={idx}
                  onClick={() => handleCardClick(row)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "var(--radius-card, 12px)",
                    border: "1px solid var(--color-border, #E5E7EB)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-card, 0 4px 6px -1px rgba(0, 0, 0, 0.04))";
                    e.currentTarget.style.borderColor = "#0A84FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))";
                    e.currentTarget.style.borderColor = "var(--color-border, #E5E7EB)";
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={row.ad_name || "Creative"}
                      style={{ width: "100%", height: "180px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "150px",
                        backgroundColor: "var(--color-surface-subtle, #F1F5F9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-secondary, #64748B)",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        gap: "6px",
                      }}
                    >
                      <ImageIcon size={18} />
                      Creative Asset
                    </div>
                  )}
                  <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <h4 style={{ margin: 0, color: "var(--color-text-primary, #0F172A)", fontSize: "0.95rem", fontWeight: "650" }}>{row.ad_name || "Unnamed Ad"}</h4>
                      {rawStatus && <StatusBadge status={rawStatus} />}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                      Campaign: {row.campaign || "-"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", padding: "12px", borderRadius: "8px", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", fontSize: "0.825rem" }}>
                      <div>
                        <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.72rem", display: "block" }}>Spend</span>
                        <strong style={{ color: "var(--color-text-primary, #0F172A)" }}>{formatCurrency(row.spend, row.currency)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.72rem", display: "block" }}>Clicks</span>
                        <strong style={{ color: "var(--color-text-primary, #0F172A)" }}>{formatNumber(row.clicks)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.72rem", display: "block" }}>CTR</span>
                        <strong style={{ color: "var(--color-text-primary, #0F172A)" }}>{formatPercentage(row.ctr)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.72rem", display: "block" }}>CPC</span>
                        <strong style={{ color: "var(--color-text-primary, #0F172A)" }}>{formatCurrency(row.cpc, row.currency)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Creative Grid Pagination Controls Container */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "var(--radius-card, 12px)", border: "1px solid var(--color-border, #E5E7EB)", overflow: "hidden", boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))" }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredData.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[12, 24, 48]}
            />
          </div>
        </div>
      )}

      {/* Right-Side Detail Drawer */}
      <CreativeDetailsDrawer
        creative={selectedCreative}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default Creatives;
