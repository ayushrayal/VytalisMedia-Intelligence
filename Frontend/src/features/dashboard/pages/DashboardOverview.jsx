import React, { useState, useEffect } from "react";
import { getMetaOverview } from "../../meta/services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import AccountSwitcher from "../../meta/components/AccountSwitcher.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import { Wallet, Eye, MousePointer2, Target, ShoppingBag } from "lucide-react";
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
    { spend: 0, impressions: 0, clicks: 0, currency: "INR" }
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
        <h3 style={{ margin: "0 0 16px 0", color: "var(--color-text-primary, #0F172A)", fontSize: "1.1rem", fontWeight: "650" }}>
          Meta Performance Summary (Last 7 Days)
        </h3>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <MetricCard title="Ad Spend" value={formatCurrency(totals.spend, totals.currency)} icon={Wallet} accentColor="#16A34A" />
            <MetricCard title="Impressions" value={formatNumber(totals.impressions)} icon={Eye} accentColor="#8B5CF6" />
            <MetricCard title="Clicks" value={formatNumber(totals.clicks)} icon={MousePointer2} accentColor="#EC4899" />
            <MetricCard title="Avg CTR" value={formatPercentage(avgCtr)} icon={Target} accentColor="#0A84FF" />
          </div>
        )}
      </div>

      {/* Product Integration Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-card, 12px)",
          border: "1px solid var(--color-border, #E5E7EB)",
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "rgba(22, 163, 74, 0.08)",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={22} strokeWidth={2} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: "var(--color-text-primary, #0F172A)", fontSize: "1.05rem", fontWeight: "700" }}>
              Shopify Store Integration
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)" }}>
              Connect your e-commerce store to unlock revenue attribution, ROAS, and cross-channel funnel metrics.
            </p>
          </div>
        </div>

        <span
          style={{
            padding: "4px 12px",
            borderRadius: "var(--radius-pill, 999px)",
            backgroundColor: "var(--color-primary-light, rgba(10, 132, 255, 0.08))",
            color: "#0A84FF",
            fontSize: "0.78rem",
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
