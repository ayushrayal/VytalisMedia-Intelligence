import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCreatives } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CreativeCard from "../components/CreativeCard.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Creatives Page Component.
 * Features:
 * - Premium card grid breakdown for visual ad creative assets
 * - Desktop 4-column, Tablet 2-column, Mobile 1-column responsive layout
 * - Segmented Control filter for All / Images / Videos
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

  // Combined Single Filtered Dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Status Filter
      const rawStatus = row.effective_status || row.ad_effective_status || row.ad_status || row.status || row.adset_status || row.campaign_status;
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const normStatus = getNormalizedStatus(rawStatus);
        matchesStatus = normStatus === statusFilter;
      }

      // 2. Spend Filter
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      return matchesStatus && matchesSpend;
    });
  }, [data, statusFilter, spendFilter]);

  // Reset pagination to page 1 whenever ANY filter or underlying dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, statusFilter, spendFilter, dateParams]);

  // Calculate total pages based strictly on FILTERED dataset length
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Slice paginated subset ONLY AFTER filtering
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSpendFilter("all");
    setStatusFilter("all");
  };

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
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          <Skeleton height="360px" />
          <Skeleton height="360px" />
          <Skeleton height="360px" />
          <Skeleton height="360px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Ad Creatives Found" description="No ad creative performance records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No creatives found"
          description="Try changing your filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Creative Cards Grid (4 columns desktop, 2 tablet, 1 mobile) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {paginatedData.map((row, idx) => {
              const creativeKey = `${row.ad_id || row.id || "creative"}-${row.date || ""}-${idx}`;
              return (
                <CreativeCard
                  key={creativeKey}
                  creative={row}
                  onClick={() => handleCardClick(row)}
                />
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
