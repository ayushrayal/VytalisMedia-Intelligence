import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getActionValue, calculateCpm } from "../utils/actionParser.js";

export const PerformanceSection = ({ creative }) => {
  const currency = creative.currency || "USD";
  const spend = Number(creative.spend || 0);
  const impressions = Number(creative.impressions || 0);
  const reach = Number(creative.reach || 0);
  const clicks = Number(creative.clicks || 0);
  const linkClicks = getActionValue(creative.link_clicks || creative.link_click_actions || creative.inline_link_clicks);
  const ctr = creative.ctr;
  const cpc = creative.cpc;
  const cpm = creative.cpm || calculateCpm(spend, impressions);
  const frequency = creative.frequency ? Number(creative.frequency).toFixed(2) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Performance Metrics
      </h4>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <MetricCard label="Spend" value={formatCurrency(spend, currency)} />
        <MetricCard label="Impressions" value={formatNumber(impressions)} />
        <MetricCard label="Reach" value={formatNumber(reach)} />
        <MetricCard label="Clicks" value={formatNumber(clicks)} />
        {linkClicks > 0 && <MetricCard label="Link Clicks" value={formatNumber(linkClicks)} />}
        <MetricCard label="CTR" value={formatPercentage(ctr)} />
        <MetricCard label="CPC" value={formatCurrency(cpc, currency)} />
        <MetricCard label="CPM" value={formatCurrency(cpm, currency)} />
        {frequency && <MetricCard label="Frequency" value={frequency} />}
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
    <strong style={{ fontSize: "1.15rem", color: "#0F172A", fontWeight: "700" }}>
      {value !== undefined && value !== null ? value : "-"}
    </strong>
  </div>
);

export default PerformanceSection;
