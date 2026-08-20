import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatCurrencyINR } from "../../utils/formatCurrency.js";
import { formatNumber } from "../../utils/formatNumber.js";

/**
 * Format helper for raw metric values based on formatType / metricKey.
 */
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

export const MetricCompareCard = ({ metric }) => {
  if (!metric) return null;

  const { metricKey, label, valueA, valueB, percentageChange, performance, formatType } = metric;

  const valAStr = formatMetricVal(valueA, metricKey, formatType);
  const valBStr = formatMetricVal(valueB, metricKey, formatType);

  // Raw numerical movement calculation (Period A vs Period B)
  let movement = "No Change";
  let badgeColor = "#64748B"; // Gray
  let badgeBg = "rgba(100, 116, 139, 0.08)";
  let DirectionIcon = Minus;

  if (valueB === null || valueB === undefined) {
    movement = "No Previous Data";
    badgeColor = "#94A3B8";
    badgeBg = "rgba(148, 163, 184, 0.08)";
  } else {
    const numA = Number(valueA) || 0;
    const numB = Number(valueB) || 0;

    if (numA > numB || performance === "New") {
      movement = "Increased";
      badgeColor = "#16A34A"; // Green
      badgeBg = "rgba(22, 163, 74, 0.08)";
      DirectionIcon = ArrowUpRight;
    } else if (numA < numB) {
      movement = "Decreased";
      badgeColor = "#DC2626"; // Red
      badgeBg = "rgba(220, 38, 38, 0.08)";
      DirectionIcon = ArrowDownRight;
    } else {
      movement = "No Change";
      badgeColor = "#64748B"; // Gray
      badgeBg = "rgba(100, 116, 139, 0.08)";
      DirectionIcon = Minus;
    }
  }

  const showPct = percentageChange !== null && percentageChange !== undefined && performance !== "New" && movement !== "No Previous Data" && movement !== "No Change";

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Header: Label & Movement Badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B", lineHeight: "1.3", textOverflow: "ellipsis", overflow: "hidden" }}>
          {label}
        </span>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 7px",
            borderRadius: "5px",
            backgroundColor: badgeBg,
            color: badgeColor,
            fontSize: "11px",
            fontWeight: "700",
            whiteSpace: "nowrap",
          }}
        >
          {showPct ? (
            <>
              <DirectionIcon size={12} />
              <span>{percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}</span>
            </>
          ) : (
            <span>{movement}</span>
          )}
        </div>
      </div>

      {/* Period A Primary Value */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A", lineHeight: "1.2" }}>
          {valAStr}
        </div>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8" }}>
          Period A
        </span>
      </div>

      {/* Period B Secondary Value & Movement Label */}
      <div
        style={{
          paddingTop: "8px",
          borderTop: "1px solid var(--color-border, #F1F5F9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11.5px",
        }}
      >
        <div>
          <span style={{ color: "#64748B" }}>Period B: </span>
          <span style={{ fontWeight: "600", color: "#334155" }}>{valBStr}</span>
        </div>
        <span style={{ fontWeight: "700", color: badgeColor }}>
          {movement}
        </span>
      </div>
    </div>
  );
};

export default MetricCompareCard;
