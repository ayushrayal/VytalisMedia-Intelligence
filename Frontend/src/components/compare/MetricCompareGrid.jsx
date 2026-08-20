import React from "react";
import MetricCompareCard from "./MetricCompareCard.jsx";

/**
 * MetricCompareGrid Component.
 * Responsive grid wrapper for MetricCompareCards (4 cols desktop, 2 cols tablet, 1 col mobile).
 */
export const MetricCompareGrid = ({ metrics = [] }) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;

  return (
    <div
      className="metric-compare-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "16px",
        marginBottom: "28px",
      }}
    >
      {metrics.map((metric) => (
        <MetricCompareCard key={metric.metricKey || metric.label} metric={metric} />
      ))}
      <style>{`
        @media (min-width: 1024px) {
          .metric-compare-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .metric-compare-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 639px) {
          .metric-compare-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MetricCompareGrid;
