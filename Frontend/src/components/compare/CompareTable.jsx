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

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "13.5px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border, #E8ECF2)", color: "#64748B" }}>
              <th style={{ padding: "12px 14px", fontWeight: "600" }}>Metric</th>
              <th style={{ padding: "12px 14px", fontWeight: "600" }}>Period A</th>
              <th style={{ padding: "12px 14px", fontWeight: "600" }}>Period B</th>
              <th style={{ padding: "12px 14px", fontWeight: "600" }}>Change</th>
              <th style={{ padding: "12px 14px", fontWeight: "600" }}>Performance</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => {
              const valAStr = formatMetricVal(m.valueA, m.metricKey, m.formatType);
              const valBStr = formatMetricVal(m.valueB, m.metricKey, m.formatType);

              let badgeColor = "#64748B";
              let badgeBg = "rgba(100, 116, 139, 0.08)";

              if (m.performance === "Improved") {
                badgeColor = "#16A34A";
                badgeBg = "rgba(22, 163, 74, 0.08)";
              } else if (m.performance === "Declined") {
                badgeColor = "#DC2626";
                badgeBg = "rgba(220, 38, 38, 0.08)";
              } else if (m.performance === "Increased" || m.performance === "Decreased") {
                badgeColor = "#0A84FF";
                badgeBg = "rgba(10, 132, 255, 0.08)";
              } else if (m.performance === "New") {
                badgeColor = "#0284C7";
                badgeBg = "rgba(2, 132, 199, 0.08)";
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
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0F172A" }}>
                    {m.label}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0F172A" }}>
                    {valAStr}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>
                    {valBStr}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: badgeColor }}>
                    {changeStr}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {m.performance}
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
