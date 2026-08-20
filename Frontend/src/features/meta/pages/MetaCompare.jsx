import React, { useState, useCallback } from "react";
import { getMetaCompare } from "../services/meta.api.js";
import CompareHeader from "../../../components/compare/CompareHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateRangeCompareSelector from "../../../components/compare/DateRangeCompareSelector.jsx";
import MetricFilterBar from "../../../components/compare/MetricFilterBar.jsx";
import PerformanceSummaryCard from "../../../components/compare/PerformanceSummaryCard.jsx";
import KeyChangesList from "../../../components/compare/KeyChangesList.jsx";
import InsightsSection from "../../../components/compare/InsightsSection.jsx";
import CompareChart from "../../../components/compare/CompareChart.jsx";
import MetricCompareGrid from "../../../components/compare/MetricCompareGrid.jsx";
import CompareTable from "../../../components/compare/CompareTable.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { getErrorMessage } from "../../../utils/error.js";

export const MetaCompare = () => {
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);

  // Active date params for comparison
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Metric filter states
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCompareData = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMetaCompare(params);
      if (res && res.data) {
        setCompareData(res.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompareTrigger = (newParams) => {
    setDateParams(newParams);
    fetchCompareData(newParams);
  };

  // When Meta account changes, immediately invalidate current results & re-fetch
  const handleAccountSwitched = useCallback(() => {
    setCompareData(null);
    setError(null);
    if (dateParams) {
      fetchCompareData(dateParams);
    }
  }, [dateParams, fetchCompareData]);

  const hasData = compareData && Array.isArray(compareData.metrics) && compareData.metrics.length > 0;

  // Client-side numerical movement filter logic (Period A vs Period B)
  const allMetrics = compareData?.metrics || [];
  const filteredMetrics = allMetrics.filter((m) => {
    if (!m) return false;

    // Movement Filter
    let matchesMovement = true;
    if (selectedStatus !== "All") {
      if (m.valueB === null || m.valueB === undefined) {
        matchesMovement = false;
      } else {
        const valA = Number(m.valueA) || 0;
        const valB = Number(m.valueB) || 0;

        if (selectedStatus === "Increased") {
          matchesMovement = valA > valB || m.performance === "New";
        } else if (selectedStatus === "Decreased") {
          matchesMovement = valA < valB;
        } else if (selectedStatus === "No Change") {
          matchesMovement = valA === valB && m.performance !== "New";
        }
      }
    }

    // Search Query Filter
    const matchesSearch = !searchQuery || !searchQuery.trim() || (m.label && m.label.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return matchesMovement && matchesSearch;
  });

  const isFiltered = selectedStatus !== "All" || Boolean(searchQuery && searchQuery.trim());

  const handleClearFilters = () => {
    setSelectedStatus("All");
    setSearchQuery("");
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page Header & Meta Account Switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <CompareHeader
          title="Meta Performance Compare"
          subtitle="Compare Meta advertising performance across two periods to analyze ROI, CPA, and conversion efficiency."
        />
        <AccountSwitcher onAccountSwitched={handleAccountSwitched} />
      </div>

      {/* Date Range Compare Selector */}
      <DateRangeCompareSelector
        onCompare={handleCompareTrigger}
        loading={loading}
        initialPreset="last_7d"
      />

      {/* Contextual Progress Loader */}
      {isDisplayLoading ? (
        <div style={{ minHeight: "240px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
          <ContextualLoader
            isLoading={loading}
            onComplete={handleComplete}
            label="Comparing Meta performance..."
            section="meta-compare"
            minHeight="auto"
          />
        </div>
      ) : error ? (
        <div style={{ marginBottom: "20px" }}>
          <ErrorState message={error} onRetry={() => fetchCompareData(dateParams)} />
        </div>
      ) : !hasData ? (
        <EmptyState
          title="Ready to Compare"
          description="Select your preferred comparison date ranges or a quick preset above and click Compare to analyze performance changes."
        />
      ) : (
        <>
          {/* Performance Summary Card */}
          <PerformanceSummaryCard
            summary={compareData.summary}
            periodA={compareData.periodA}
            periodB={compareData.periodB}
          />

          {/* Metric Filter & Search Bar */}
          <MetricFilterBar
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalMetricsCount={allMetrics.length}
            filteredMetricsCount={filteredMetrics.length}
            onClearFilters={handleClearFilters}
          />

          {/* Key Changes & Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            <KeyChangesList keyChanges={compareData.keyChanges} />
            <InsightsSection insights={compareData.insights} />
          </div>

          {filteredMetrics.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid var(--color-border, #E8ECF2)",
                padding: "36px 24px",
                textAlign: "center",
                color: "#64748B",
                marginBottom: "28px",
              }}
            >
              <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
                No metrics match your current filters.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {/* Percentage Change Overview Chart */}
              <CompareChart metrics={filteredMetrics} isFiltered={isFiltered} />

              {/* Metric Comparison Cards Grid */}
              <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                Metric Comparison Cards
              </h3>
              <MetricCompareGrid metrics={filteredMetrics} />

              {/* Detailed Comparison Table */}
              <CompareTable metrics={filteredMetrics} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MetaCompare;
