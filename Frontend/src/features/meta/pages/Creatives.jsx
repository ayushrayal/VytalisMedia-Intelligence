import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCreatives, getCreativeCardPreferences, updateCreativeCardPreferences } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CreativeCard from "../components/CreativeCard.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import CustomizeCardsModal from "../components/CustomizeCardsModal.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { getErrorMessage } from "../../../utils/error.js";
import { Sliders, LayoutGrid } from "lucide-react";
import { getCreativePreferences, saveCreativePreferences } from "../../../utils/creativePreferences.js";
import { checkIsSingleDay, aggregateCreativesData } from "../utils/creativeAggregator.js";

/**
 * Creatives Page Component.
 * Features:
 * 1. Creative Gallery - main paginated visual ad creative breakdown grid
 * 2. Winning Creatives - filtered section for creatives with ROAS above threshold (highest ROAS first)
 * 3. Poor Performers - filtered section for creatives with ROAS below threshold (worst ROAS first)
 * - 100% Client-side derived dataset without redundant backend API calls
 * - Persistent threshold & KPI preferences across page reloads
 */
export const Creatives = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // User Preference State - Lazy initialization directly from localStorage on Frame 1
  const [cardPreferences, setCardPreferences] = useState(() => getCreativePreferences());
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Drawer Detail State
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch creative performance records
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

  // Optionally sync customizable card KPI preferences from backend on mount ONLY if no local saved preference exists
  const fetchPreferences = useCallback(async () => {
    try {
      const hasLocalCustomization = localStorage.getItem("vytalis_creative_card_preferences");
      if (!hasLocalCustomization) {
        const res = await getCreativeCardPreferences();
        if (res.data && typeof res.data === "object" && res.data.primaryMetrics?.length > 0) {
          const saved = saveCreativePreferences(res.data);
          setCardPreferences(saved || res.data);
        }
      }
    } catch (err) {
      // Backend sync error fallback to local storage state
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save updated preferences immediately to localStorage and React state, then sync to backend
  const handleSavePreferences = async (newPrefs) => {
    const saved = saveCreativePreferences(newPrefs);
    setCardPreferences(saved || newPrefs);

    try {
      await updateCreativeCardPreferences(newPrefs);
    } catch (err) {
      console.warn("Backend preference sync warning:", err);
    }
  };

  const handleWinningThresholdChange = (val) => {
    const updated = { ...cardPreferences, winningRoasThreshold: val };
    handleSavePreferences(updated);
  };

  const handlePoorThresholdChange = (val) => {
    const updated = { ...cardPreferences, poorRoasThreshold: val };
    handleSavePreferences(updated);
  };

  // Determine if selected date range represents a single calendar day
  const isSingleDay = useMemo(() => {
    return checkIsSingleDay(dateParams, data);
  }, [dateParams, data]);

  // Aggregate raw dataset based on date range (multi-day aggregates to 1 card per creative)
  const aggregatedData = useMemo(() => {
    return aggregateCreativesData(data, isSingleDay);
  }, [data, isSingleDay]);

  // Combined Single Filtered Dataset
  const filteredData = useMemo(() => {
    return aggregatedData.filter((row) => {
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
  }, [aggregatedData, statusFilter, spendFilter]);

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
        title="Meta Ad All Creatives"
        subtitle="Visual ad creative performance & engagement metrics"
        actions={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #E5E7EB)",
                backgroundColor: "#FFFFFF",
                color: "var(--color-text-primary, #0F172A)",
                fontSize: "0.825rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                transition: "all 0.15s ease",
              }}
            >
              <Sliders size={14} color="#0A84FF" />
              <span>Customize Cards</span>
            </button>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="meta-creatives" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            <Skeleton height="360px" />
            <Skeleton height="360px" />
            <Skeleton height="360px" />
            <Skeleton height="360px" />
          </div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* SECTION 1: CREATIVE GALLERY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LayoutGrid size={18} color="#0A84FF" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0F172A" }}>
                  Creative Gallery
                </h3>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Showing {paginatedData.length} of {filteredData.length} Creatives
              </span>
            </div>

            {/* Creative Cards Grid (4 columns desktop, 2 tablet, 1 mobile) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {paginatedData.map((row, idx) => {
                const creativeKey = `gallery-${row.ad_id || row.id || "creative"}-${row.date || ""}-${idx}`;
                return (
                  <CreativeCard
                    key={creativeKey}
                    creative={row}
                    preferences={cardPreferences}
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
        </div>
      )}

      {/* Customize Cards Preference Modal */}
      <CustomizeCardsModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentPreferences={cardPreferences}
        onSave={handleSavePreferences}
      />

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
