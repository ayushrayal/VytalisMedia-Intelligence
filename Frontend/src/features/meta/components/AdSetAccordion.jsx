import React from "react";
import { ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * Metric Formatter displaying '—' for unavailable (null/undefined) metrics.
 */
const formatMetric = (val, type, currency = "INR") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "—";
  }
  const num = Number(val);
  switch (type) {
    case "currency":
      return formatCurrency(num, currency);
    case "percentage":
      return formatPercentage(num);
    case "roas":
      return `${num.toFixed(2)}x`;
    case "number":
      return formatNumber(num);
    case "decimal":
      return num.toFixed(2);
    default:
      return num.toLocaleString();
  }
};

/**
 * AdSetAccordion Component.
 * Vytalis Light Theme Expandable Row for Meta Ad Set details.
 * Controlled externally by parent AdSetAccordionList component.
 */
export const AdSetAccordion = ({
  adset = {},
  isExpanded = false,
  onToggle,
  currency = "INR",
  dateParams = {},
}) => {
  const rawAddToCart = adset.actions_add_to_cart ?? adset.add_to_cart;
  const rawCheckout = adset.actions_initiate_checkout ?? adset.initiate_checkout;
  const rawUniqueCtr = adset.unique_outbound_clicks_ctr_outbound_click ?? adset.unique_outbound_clicks_ctr;

  const spendVal = adset.spend;
  const roasVal = adset.purchase_roas;

  // Calculate Average Purchase Value if purchases & purchase_conversion_value exist
  const purchasesVal = adset.purchases;
  const purchaseValueVal = adset.purchase_conversion_value;
  let avgPurchaseValue = null;
  if (
    purchasesVal &&
    Number(purchasesVal) > 0 &&
    purchaseValueVal &&
    Number(purchaseValueVal) > 0
  ) {
    avgPurchaseValue = Number(purchaseValueVal) / Number(purchasesVal);
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5EAF0",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* COLLAPSED HEADER ROW */}
      <div
        onClick={onToggle}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          cursor: "pointer",
          userSelect: "none",
          backgroundColor: isExpanded ? "#F8FAFC" : "#FFFFFF",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = "#F8FAFC";
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = "#FFFFFF";
        }}
      >
        {/* Left Info: Name, Status & Subtitle */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h4
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "600",
                color: "#0F172A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {adset.name || adset.adset_name || "Unnamed Ad Set"}
            </h4>
            <StatusBadge status={adset.status || adset.effective_status || "ACTIVE"} />
          </div>

          <div
            style={{
              fontSize: "11.5px",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span>Targeting: Core Audience Stack</span>
            {adset.id && <span>ID: {adset.id}</span>}
          </div>
        </div>

        {/* Right Quick Metrics: Spend & ROAS */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "10.5px", color: "#64748B", display: "block", textTransform: "uppercase", fontWeight: "600" }}>
              Spend
            </span>
            <strong style={{ fontSize: "14px", fontWeight: "650", color: "#0F172A" }}>
              {formatMetric(spendVal, "currency", currency)}
            </strong>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "10.5px", color: "#64748B", display: "block", textTransform: "uppercase", fontWeight: "600" }}>
              ROAS
            </span>
            <strong style={{ fontSize: "14px", fontWeight: "650", color: roasVal ? "#16A34A" : "#0F172A" }}>
              {formatMetric(roasVal, "roas")}
            </strong>
          </div>

          {/* Chevron Icon Indicator */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* EXPANDED ACCORDION BODY */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: "20px",
            borderTop: "1px solid #E5EAF0",
            backgroundColor: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {/* SECTION 1: PERFORMANCE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "700",
                color: "#64748B",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              PERFORMANCE
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={metricCardStyle}>
                <span style={labelStyle}>Amount Spent</span>
                <strong style={valueStyle}>{formatMetric(adset.spend, "currency", currency)}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Cost / Result</span>
                <strong style={valueStyle}>{formatMetric(adset.cost_per_result, "currency", currency)}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Purchases</span>
                <strong style={valueStyle}>{formatMetric(adset.purchases, "number")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Purchase Value</span>
                <strong style={valueStyle}>{formatMetric(adset.purchase_conversion_value, "currency", currency)}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Purchase ROAS</span>
                <strong style={{ ...valueStyle, color: "#16A34A" }}>
                  {formatMetric(adset.purchase_roas, "roas")}
                </strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Avg Purchase Value</span>
                <strong style={valueStyle}>
                  {avgPurchaseValue !== null ? formatCurrency(avgPurchaseValue, currency) : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* SECTION 2: FUNNEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "700",
                color: "#64748B",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              FUNNEL
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={metricCardStyle}>
                <span style={labelStyle}>Add to Cart</span>
                <strong style={valueStyle}>{formatMetric(rawAddToCart, "number")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Checkout Initiated</span>
                <strong style={valueStyle}>{formatMetric(rawCheckout, "number")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Purchases</span>
                <strong style={valueStyle}>{formatMetric(adset.purchases, "number")}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 3: DELIVERY & EFFICIENCY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "700",
                color: "#64748B",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              DELIVERY & EFFICIENCY
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={metricCardStyle}>
                <span style={labelStyle}>Reach</span>
                <strong style={valueStyle}>{formatMetric(adset.reach, "number")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Impressions</span>
                <strong style={valueStyle}>{formatMetric(adset.impressions, "number")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>CTR</span>
                <strong style={{ ...valueStyle, color: "#1683FF" }}>{formatMetric(adset.ctr, "percentage")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Unique Outbound CTR</span>
                <strong style={{ ...valueStyle, color: "#1683FF" }}>{formatMetric(rawUniqueCtr, "percentage")}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>CPC</span>
                <strong style={valueStyle}>{formatMetric(adset.cpc, "currency", currency)}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>CPM</span>
                <strong style={valueStyle}>{formatMetric(adset.cpm, "currency", currency)}</strong>
              </div>

              <div style={metricCardStyle}>
                <span style={labelStyle}>Frequency</span>
                <strong style={valueStyle}>{formatMetric(adset.frequency, "decimal")}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const metricCardStyle = {
  backgroundColor: "#F7F9FC",
  border: "1px solid #E7ECF2",
  borderRadius: "10px",
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "500",
  color: "#718096",
};

const valueStyle = {
  fontSize: "15px",
  fontWeight: "650",
  color: "#0F172A",
};

export default AdSetAccordion;
