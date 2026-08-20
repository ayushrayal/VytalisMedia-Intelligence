import React from "react";
import MetricCompareCard from "./MetricCompareCard.jsx";

/**
 * MetricCompareGrid Component.
 * Responsive grid wrapper for MetricCompareCards.
 */
export const MetricCompareGrid = ({ metrics = [] }) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
        marginBottom: "28px",
      }}
    >
      {metrics.map((metric) => (
        <MetricCompareCard key={metric.metricKey || metric.label} metric={metric} />
      ))}
    </div>
  );
};

export default MetricCompareGrid;
