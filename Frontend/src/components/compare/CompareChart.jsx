import React from "react";

/**
 * CompareChart Component.
 * Percentage-change visual bar chart displaying relative metric growth/decline.
 */
export const CompareChart = ({ metrics = [] }) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;

  // Filter metrics that have percentageChange calculated
  const validMetrics = metrics.filter(
    (m) => m && (m.percentageChange !== null || m.performance === "New" || m.performance === "Improved" || m.performance === "Declined")
  );

  if (validMetrics.length === 0) return null;

  // Find max percentage absolute value for scaling
  const maxAbsPct = Math.max(
    ...validMetrics.map((m) => (m.percentageChange !== null ? Math.abs(m.percentageChange) : 50)),
    20
  );

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "20px 24px",
        marginBottom: "28px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
        Percentage Change Overview
      </h3>
      <p style={{ margin: "0 0 20px 0", fontSize: "12.5px", color: "#64748B" }}>
        Visual comparison of percentage growth and decline across key performance indicators.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {validMetrics.map((m) => {
          const pct = m.percentageChange ?? 0;
          const absPct = Math.abs(pct);
          const barWidthPct = Math.min((absPct / maxAbsPct) * 100, 100);

          // Color classification based on Business Direction Category
          let barColor = "#64748B"; // Neutral default
          if (m.performance === "Improved") {
            barColor = "#16A34A"; // Positive green
          } else if (m.performance === "Declined") {
            barColor = "#DC2626"; // Negative red
          } else if (m.performance === "Increased" || m.performance === "Decreased") {
            barColor = "#0A84FF"; // Neutral blue
          } else if (m.performance === "New") {
            barColor = "#0284C7"; // Cyan
          }

          return (
            <div key={m.metricKey || m.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr 90px", alignItems: "center", gap: "14px" }}>
              {/* Metric Label */}
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {m.label}
              </span>

              {/* Bar Container */}
              <div
                style={{
                  height: "22px",
                  backgroundColor: "var(--color-background, #F1F5F9)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${barWidthPct}%`,
                    backgroundColor: barColor,
                    borderRadius: "6px",
                    transition: "width 0.4s ease-out",
                  }}
                />
              </div>

              {/* Percentage & Status Badge */}
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: barColor,
                  }}
                >
                  {m.performance === "New" ? "New" : `${pct > 0 ? "+" : ""}${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompareChart;
