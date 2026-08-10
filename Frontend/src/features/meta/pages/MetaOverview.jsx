import React, { useState, useEffect, useCallback } from "react";
import { getMetaOverview } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/shared/MetricCard.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

export const MetaOverview = () => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMetaOverview(dateParams);
      if (res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta || null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate overall metrics if data array contains rows
  const totals = data.reduce(
    (acc, row) => {
      acc.spend += Number(row.spend || 0);
      acc.impressions += Number(row.impressions || 0);
      acc.reach += Number(row.reach || 0);
      acc.clicks += Number(row.clicks || 0);
      acc.currency = row.currency || acc.currency;
      return acc;
    },
    { spend: 0, impressions: 0, reach: 0, clicks: 0, currency: "USD" }
  );

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

  return (
    <div>
      <PageHeader
        title="Meta Overview"
        subtitle="Performance analytics for connected Meta Ad Account"
        actions={
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
          </div>
        }
      />

      {meta && (
        <div style={{ marginBottom: "16px", fontSize: "0.8rem", color: "#64748b" }}>
          Source: <strong style={{ color: "#818cf8" }}>{meta.source}</strong> | Cached At: {new Date(meta.cachedAt).toLocaleTimeString()}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Overview Metrics Found" description="No Meta overview records were returned for this date range." />
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <MetricCard label="Total Spend" value={formatCurrency(totals.spend, totals.currency)} icon="💰" />
            <MetricCard label="Impressions" value={formatNumber(totals.impressions)} icon="👁️" />
            <MetricCard label="Reach" value={formatNumber(totals.reach)} icon="🎯" />
            <MetricCard label="Clicks" value={formatNumber(totals.clicks)} icon="🖱️" />
            <MetricCard label="Average CTR" value={formatPercentage(avgCtr)} icon="📈" />
            <MetricCard label="Average CPC" value={formatCurrency(avgCpc, totals.currency)} icon="🏷️" />
          </div>

          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "1px solid #334155", padding: "16px", overflowX: "auto" }}>
            <h4 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Daily Performance Breakdown</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#f8fafc", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Date</th>
                  <th style={{ padding: "10px" }}>Spend</th>
                  <th style={{ padding: "10px" }}>Impressions</th>
                  <th style={{ padding: "10px" }}>Reach</th>
                  <th style={{ padding: "10px" }}>Clicks</th>
                  <th style={{ padding: "10px" }}>CTR</th>
                  <th style={{ padding: "10px" }}>CPC</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "10px" }}>{row.date}</td>
                    <td style={{ padding: "10px" }}>{formatCurrency(row.spend, row.currency)}</td>
                    <td style={{ padding: "10px" }}>{formatNumber(row.impressions)}</td>
                    <td style={{ padding: "10px" }}>{formatNumber(row.reach)}</td>
                    <td style={{ padding: "10px" }}>{formatNumber(row.clicks)}</td>
                    <td style={{ padding: "10px" }}>{formatPercentage(row.ctr)}</td>
                    <td style={{ padding: "10px" }}>{formatCurrency(row.cpc, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaOverview;
