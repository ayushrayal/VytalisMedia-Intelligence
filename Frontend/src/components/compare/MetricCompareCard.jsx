import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Sparkles } from "lucide-react";
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

/**
 * MetricCompareCard Component.
 */
export const MetricCompareCard = ({ metric }) => {
  if (!metric) return null;

  const { metricKey, label, valueA, valueB, percentageChange, performance, formatType } = metric;

  const valAStr = formatMetricVal(valueA, metricKey, formatType);
  const valBStr = formatMetricVal(valueB, metricKey, formatType);

  // Status Styling Logic
  let badgeColor = "#64748B";
  let badgeBg = "rgba(100, 116, 139, 0.08)";
  let DirectionIcon = Minus;

  if (performance === "Improved") {
    badgeColor = "#16A34A";
    badgeBg = "rgba(22, 163, 74, 0.08)";
    DirectionIcon = ArrowUpRight;
  } else if (performance === "Declined") {
    badgeColor = "#DC2626";
    badgeBg = "rgba(220, 38, 38, 0.08)";
    DirectionIcon = ArrowDownRight;
  } else if (performance === "Increased") {
    badgeColor = "#0A84FF";
    badgeBg = "rgba(10, 132, 255, 0.08)";
    DirectionIcon = ArrowUpRight;
  } else if (performance === "Decreased") {
    badgeColor = "#0A84FF";
    badgeBg = "rgba(10, 132, 255, 0.08)";
    DirectionIcon = ArrowDownRight;
  } else if (performance === "New") {
    badgeColor = "#0284C7";
    badgeBg = "rgba(2, 132, 199, 0.08)";
    DirectionIcon = Sparkles;
  }

  const showPct = percentageChange !== null && percentageChange !== undefined && performance !== "New" && performance !== "No Previous Data" && performance !== "No Change";

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid var(--color-border, #E8ECF2)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Card Header: Title & Status Badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "14px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
          {label}
        </span>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 8px",
            borderRadius: "6px",
            backgroundColor: badgeBg,
            color: badgeColor,
            fontSize: "11.5px",
            fontWeight: "700",
            whiteSpace: "nowrap",
          }}
        >
          {showPct ? (
            <>
              <DirectionIcon size={13} />
              <span>{percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}</span>
            </>
          ) : (
            <span>{performance}</span>
          )}
        </div>
      </div>

      {/* Primary Current (Period A) Value */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A", lineHeight: "1.2" }}>
          {valAStr}
        </div>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8" }}>
          Period A
        </span>
      </div>

      {/* Secondary Previous (Period B) Value & Explicit Performance Label */}
      <div
        style={{
          paddingTop: "10px",
          borderTop: "1px solid var(--color-border, #F1F5F9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
        }}
      >
        <div>
          <span style={{ color: "#64748B" }}>Period B: </span>
          <span style={{ fontWeight: "600", color: "#334155" }}>{valBStr}</span>
        </div>
        <span style={{ fontWeight: "700", color: badgeColor, fontSize: "11.5px" }}>
          {performance}
        </span>
      </div>
    </div>
  );
};

export default MetricCompareCard;
