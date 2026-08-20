import React from "react";
import { formatCurrencyINR } from "../../utils/formatCurrency.js";
import { formatNumber } from "../../utils/formatNumber.js";

const formatMetricVal = (val, metricKey, formatType) => {
  if (val === null || val === undefined) return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";

  if (formatType === "currency" || ["spend", "purchase_conversion_value", "cost_per_result", "cpc", "cpm", "gross_sales", "net_sales", "discounts", "prepaid_orders", "cod_orders", "cancelled_orders", "aov"].includes(metricKey)) {
    return formatCurrencyINR(num);
  }
  if (formatType === "roas" || metricKey === "purchase_roas") {
    return `${num.toFixed(2)}x`;
  }
  if (formatType === "percentage" || ["ctr", "cancellation_rate", "cod_share", "prepaid_share"].includes(metricKey)) {
    return `${num.toFixed(1)}%`;
  }
  if (metricKey === "frequency") {
    return `${num.toFixed(2)}`;
  }
  return formatNumber(num);
};

export const CompareTable = ({ metrics = [] }) => {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;

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
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
        Detailed Comparison Breakdown
      </h3>

      {/* Horizontally scrollable wrapper for mobile */}
      <div style={{ overflowX: "auto", maxHeight: "600px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "13.5px",
          }}
        >
          {/* Sticky Header */}
          <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#FFFFFF" }}>
            <tr style={{ borderBottom: "2px solid var(--color-border, #E8ECF2)", color: "#64748B" }}>
              <th style={{ padding: "12px 14px", fontWeight: "600", textAlign: "left" }}>Metric</th>
              <th style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>Period A</th>
              <th style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>Period B</th>
              <th style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>Change</th>
              <th style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>Movement</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => {
              const valAStr = formatMetricVal(m.valueA, m.metricKey, m.formatType);
              const valBStr = formatMetricVal(m.valueB, m.metricKey, m.formatType);

              // Raw numerical movement calculation (Period A vs Period B)
              let movement = "No Change";
              let badgeColor = "#64748B"; // Gray
              let badgeBg = "rgba(100, 116, 139, 0.08)";

              if (m.valueB === null || m.valueB === undefined) {
                movement = "No Previous Data";
                badgeColor = "#94A3B8";
                badgeBg = "rgba(148, 163, 184, 0.08)";
              } else {
                const numA = Number(m.valueA) || 0;
                const numB = Number(m.valueB) || 0;

                if (numA > numB || m.performance === "New") {
                  movement = "Increased";
                  badgeColor = "#16A34A"; // Green
                  badgeBg = "rgba(22, 163, 74, 0.08)";
                } else if (numA < numB) {
                  movement = "Decreased";
                  badgeColor = "#DC2626"; // Red
                  badgeBg = "rgba(220, 38, 38, 0.08)";
                } else {
                  movement = "No Change";
                  badgeColor = "#64748B"; // Gray
                  badgeBg = "rgba(100, 116, 139, 0.08)";
                }
              }

              let changeStr = "—";
              if (m.percentageChange !== null && m.percentageChange !== undefined) {
                changeStr = `${m.percentageChange > 0 ? "+" : ""}${m.percentageChange}%`;
              } else if (m.performance === "New") {
                changeStr = "New";
              }

              return (
                <tr
                  key={m.metricKey || idx}
                  style={{
                    borderBottom: "1px solid var(--color-border, #F1F5F9)",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-background, #F8FAFC)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0F172A", textAlign: "left" }}>
                    {m.label}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0F172A", textAlign: "right" }}>
                    {valAStr}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569", textAlign: "right" }}>
                    {valBStr}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: badgeColor, textAlign: "right" }}>
                    {changeStr}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-block",
                      }}
                    >
                      {movement}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareTable;
