import React from "react";
import DashboardWidget from "./DashboardWidget.jsx";
import EmptyDashboardState from "./EmptyDashboardState.jsx";

/**
 * DashboardGrid Component.
 * Dynamically arranges active dashboard widgets in desktop 4-column KPI grids,
 * full-width trend cards, and 3-column lower analytics grids.
 */
export const DashboardGrid = ({
  visibleWidgets = [],
  totals,
  overallCostPerResult,
  overallPurchaseRoas,
  avgCtr,
  avgCpc,
  sparklines,
  trendChanges,
  trendPoints,
  maxTrendVal,
  trendMetric,
  setTrendMetric,
  hoveredPointIndex,
  setHoveredPointIndex,
  visibleLabelIndices,
  topCampaigns,
  topAdsets,
  placementsBreakdown,
  placementColors,
  navigate,
  onOpenCustomizer,
  onResetDefault,
}) => {
  if (!visibleWidgets || visibleWidgets.length === 0) {
    return (
      <EmptyDashboardState
        onOpenCustomizer={onOpenCustomizer}
        onResetDefault={onResetDefault}
      />
    );
  }

  // Separate active widgets into metrics vs full-width vs section cards
  const metricWidgets = visibleWidgets.filter((w) => w.type === "metric");
  const chartWidgets = visibleWidgets.filter((w) => w.type === "chart");
  const lowerAnalyticsWidgets = visibleWidgets.filter(
    (w) => w.type === "table" || w.type === "breakdown"
  );

  const sharedProps = {
    totals,
    overallCostPerResult,
    overallPurchaseRoas,
    avgCtr,
    avgCpc,
    sparklines,
    trendChanges,
    trendPoints,
    maxTrendVal,
    trendMetric,
    setTrendMetric,
    hoveredPointIndex,
    setHoveredPointIndex,
    visibleLabelIndices,
    topCampaigns,
    topAdsets,
    placementsBreakdown,
    placementColors,
    navigate,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. KPI Metric Cards Grid (Desktop: 4 columns, Tablet: 2 columns, Mobile: 1 column) */}
      {metricWidgets.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {metricWidgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} {...sharedProps} />
          ))}
        </div>
      )}

      {/* 2. Full-Width Charts (Performance Trend) */}
      {chartWidgets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {chartWidgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} {...sharedProps} />
          ))}
        </div>
      )}

      {/* 3. Lower Analytics Cards (Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column) */}
      {lowerAnalyticsWidgets.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {lowerAnalyticsWidgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} {...sharedProps} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;
