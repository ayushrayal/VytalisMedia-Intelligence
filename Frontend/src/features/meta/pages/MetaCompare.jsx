import React, { useState, useCallback } from "react";
import { getMetaCompare } from "../services/meta.api.js";
import CompareHeader from "../../../components/compare/CompareHeader.jsx";
import DateRangeCompareSelector from "../../../components/compare/DateRangeCompareSelector.jsx";
import CompareLoadingIndicator from "../../../components/compare/CompareLoadingIndicator.jsx";
import PerformanceSummaryCard from "../../../components/compare/PerformanceSummaryCard.jsx";
import KeyChangesList from "../../../components/compare/KeyChangesList.jsx";
import InsightsSection from "../../../components/compare/InsightsSection.jsx";
import CompareChart from "../../../components/compare/CompareChart.jsx";
import MetricCompareGrid from "../../../components/compare/MetricCompareGrid.jsx";
import CompareTable from "../../../components/compare/CompareTable.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { getErrorMessage } from "../../../utils/error.js";

export const MetaCompare = () => {
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active date params for comparison
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

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

  const hasData = compareData && Array.isArray(compareData.metrics) && compareData.metrics.length > 0;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page Header */}
      <CompareHeader
        title="Meta Performance Compare"
        subtitle="Compare Meta advertising performance across two periods to analyze ROI, CPA, and conversion efficiency."
      />

      {/* Date Range Compare Selector */}
      <DateRangeCompareSelector
        onCompare={handleCompareTrigger}
        loading={loading}
        initialPreset="last_7d"
      />

      {/* Inline Loading Indicator */}
      {loading && <CompareLoadingIndicator message="Comparing Meta performance..." />}

      {/* Inline Error State */}
      {error && (
        <div style={{ marginBottom: "20px" }}>
          <ErrorState message={error} onRetry={() => fetchCompareData(dateParams)} />
        </div>
      )}

      {/* Results or Neutral Initial State */}
      {!hasData && !loading && !error ? (
        <EmptyState
          title="Ready to Compare"
          description="Select your preferred comparison date ranges or a quick preset above and click Compare to analyze performance changes."
        />
      ) : hasData ? (
        <>
          {/* Performance Summary Card */}
          <PerformanceSummaryCard
            summary={compareData.summary}
            periodA={compareData.periodA}
            periodB={compareData.periodB}
          />

          {/* Key Changes & Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <KeyChangesList keyChanges={compareData.keyChanges} />
            <InsightsSection insights={compareData.insights} />
          </div>

          {/* Compare Visual Chart */}
          <CompareChart metrics={compareData.metrics} />

          {/* Metric Comparison Cards Grid */}
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
            Metric Comparison Cards
          </h3>
          <MetricCompareGrid metrics={compareData.metrics} />

          {/* Detailed Comparison Table */}
          <CompareTable metrics={compareData.metrics} />
        </>
      ) : null}
    </div>
  );
};

export default MetaCompare;
