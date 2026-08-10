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

      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc", fontSize: "1.2rem" }}>
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

      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          border: "1px border-dashed #334155",
          padding: "24px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#cbd5e1" }}>Shopify Integration</h4>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          Shopify store connection and revenue analytics will be available in future updates.
        </p>
      </div>
    </div>
  );
};

export default DashboardOverview;
