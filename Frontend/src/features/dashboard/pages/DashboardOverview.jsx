import React, { useState, useEffect } from "react";
import { getMetaOverview } from "../../meta/services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/shared/MetricCard.jsx";
import AccountSwitcher from "../../meta/components/AccountSwitcher.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

export const DashboardOverview = () => {
  const [metaData, setMetaData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getMetaOverview({ datePreset: "last_7d" });
      if (res.data && Array.isArray(res.data)) {
        setMetaData(res.data);
      }
    } catch (err) {
      // Fallback silently on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const totals = metaData.reduce(
    (acc, row) => {
      acc.spend += Number(row.spend || 0);
      acc.impressions += Number(row.impressions || 0);
      acc.clicks += Number(row.clicks || 0);
      acc.currency = row.currency || acc.currency;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, currency: "USD" }
  );

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Business Dashboard"
        subtitle="Cross-platform performance overview"
        actions={<AccountSwitcher onAccountSwitched={fetchSummary} />}
      />

      {/* KPI Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 16px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.15rem", fontWeight: "650" }}>
          Meta Performance Summary (Last 7 Days)
        </h3>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard label="Ad Spend" value={formatCurrency(totals.spend, totals.currency)} icon="💳" />
            <MetricCard label="Impressions" value={formatNumber(totals.impressions)} icon="👁️" />
            <MetricCard label="Clicks" value={formatNumber(totals.clicks)} icon="🖱️" />
            <MetricCard label="Avg CTR" value={formatPercentage(avgCtr)} icon="📊" />
          </div>
        )}
      </div>

      {/* Product Integration Card */}
      <div
        style={{
          backgroundColor: "var(--color-surface, #F7F9FC)",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(22, 163, 74, 0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            🛍️
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.1rem", fontWeight: "700" }}>
              Shopify Store Integration
            </h4>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary, #64748B)" }}>
              Connect your e-commerce store to unlock revenue attribution, ROAS, and cross-channel funnel metrics.
            </p>
          </div>
        </div>

        <span
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-pill, 999px)",
            backgroundColor: "var(--color-primary-light, #EAF3FF)",
            color: "var(--color-primary-hover, #0060DF)",
            fontSize: "0.8rem",
            fontWeight: "600",
            letterSpacing: "0.2px",
          }}
        >
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default DashboardOverview;
