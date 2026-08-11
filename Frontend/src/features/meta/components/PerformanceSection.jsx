import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getActionValue, calculateCpm } from "../utils/actionParser.js";

export const PerformanceSection = ({ creative }) => {
  const currency = creative.currency || "INR";
  const spend = creative.spend;
  const impressions = creative.impressions;
  const reach = creative.reach;
  const clicks = creative.clicks;
  const linkClicks = getActionValue(creative.link_clicks || creative.link_click_actions || creative.inline_link_clicks);
  const ctr = creative.ctr;
  const cpc = creative.cpc;
  const cpm = creative.cpm || calculateCpm(spend || 0, impressions || 0);
  const frequency = creative.frequency;

  const costPerResult = creative.cost_per_result;
  const purchases = creative.purchases;
  const purchaseValue = creative.purchase_conversion_value;
  const purchaseRoas = creative.purchase_roas;

  const avgPurchaseValue =
    purchases > 0 && purchaseValue !== null && purchaseValue !== undefined
      ? purchaseValue / purchases
      : null;

  const addToCart = creative.actions_add_to_cart ?? creative.add_to_cart;
  const checkoutInitiated = creative.actions_initiate_checkout ?? creative.initiate_checkout;
  const uniqueOutboundCtr = creative.unique_outbound_clicks_ctr_outbound_click ?? creative.unique_outbound_clicks_ctr;

  const formatVal = (val, type) => {
    if (val === null || val === undefined || val === "" || (typeof val === "number" && isNaN(val))) {
      return "—";
    }
    const num = Number(val);
    if (type === "currency") return formatCurrency(num, currency);
    if (type === "percentage") return formatPercentage(num);
    if (type === "number") return formatNumber(num);
    if (type === "roas") return `${num.toFixed(2)}x`;
    if (type === "decimal") return num.toFixed(2);
    return num.toLocaleString();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. PERFORMANCE SECTION */}
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Performance Metrics
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <MetricCard label="Spend" value={formatVal(spend, "currency")} />
          <MetricCard label="Cost per Result" value={formatVal(costPerResult, "currency")} />
          <MetricCard label="Purchases" value={formatVal(purchases, "number")} />
          <MetricCard label="Purchase Value" value={formatVal(purchaseValue, "currency")} />
          <MetricCard label="Purchase ROAS" value={formatVal(purchaseRoas, "roas")} />
          <MetricCard label="Avg Purchase Value" value={formatVal(avgPurchaseValue, "currency")} />
        </div>
      </div>

      {/* 2. FUNNEL SECTION */}
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Conversion Funnel
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <MetricCard label="Add to Cart" value={formatVal(addToCart, "number")} />
          <MetricCard label="Checkout Initiated" value={formatVal(checkoutInitiated, "number")} />
          <MetricCard label="Purchases" value={formatVal(purchases, "number")} />
        </div>
      </div>

      {/* 3. DELIVERY SECTION */}
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Delivery & Efficiency
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <MetricCard label="Reach" value={formatVal(reach, "number")} />
          <MetricCard label="Impressions" value={formatVal(impressions, "number")} />
          <MetricCard label="Clicks" value={formatVal(clicks, "number")} />
          {linkClicks > 0 && <MetricCard label="Link Clicks" value={formatVal(linkClicks, "number")} />}
          <MetricCard label="CTR" value={formatVal(ctr, "percentage")} />
          <MetricCard label="Unique Outbound CTR" value={formatVal(uniqueOutboundCtr, "percentage")} />
          <MetricCard label="CPC" value={formatVal(cpc, "currency")} />
          <MetricCard label="Frequency" value={formatVal(frequency, "decimal")} />
          <MetricCard label="CPM" value={formatVal(cpm, "currency")} />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }) => (
  <div
    style={{
      backgroundColor: "var(--color-surface, #F7F9FC)",
      borderRadius: "12px",
      border: "1px solid var(--color-border, #E8EAED)",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}
  >
    <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "500" }}>{label}</span>
    <strong style={{ fontSize: "1.1rem", color: "#0F172A", fontWeight: "700" }}>
      {value !== undefined && value !== null ? value : "—"}
    </strong>
  </div>
);

export default PerformanceSection;
