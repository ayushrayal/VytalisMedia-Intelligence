import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getMetaOverview } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/shared/MetricCard.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
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

  // Local Spend Filter State
  const [spendFilter, setSpendFilter] = useState("all");

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

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      return spendFilter === "all" || numericSpend >= Number(spendFilter);
    });
  }, [data, spendFilter]);

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
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
          </div>
        }
      />

      {meta && (
        <div style={{ marginBottom: "20px", fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)", display: "flex", gap: "8px", alignItems: "center" }}>
          <span>Source:</span>
          <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill, 999px)", backgroundColor: "var(--color-primary-light, #EAF3FF)", color: "var(--color-primary-hover, #0060DF)", fontWeight: "600" }}>
            {meta.source}
          </span>
          <span style={{ marginLeft: "8px" }}>Cached: {new Date(meta.cachedAt).toLocaleTimeString()}</span>
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
          {/* KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <MetricCard label="Total Spend" value={formatCurrency(totals.spend, totals.currency)} icon="💰" />
            <MetricCard label="Impressions" value={formatNumber(totals.impressions)} icon="👁️" />
            <MetricCard label="Reach" value={formatNumber(totals.reach)} icon="🎯" />
            <MetricCard label="Clicks" value={formatNumber(totals.clicks)} icon="🖱️" />
            <MetricCard label="Average CTR" value={formatPercentage(avgCtr)} icon="📈" />
            <MetricCard label="Average CPC" value={formatCurrency(avgCpc, totals.currency)} icon="🏷️" />
          </div>

          {/* Daily Performance Card */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "var(--radius-card, 16px)", border: "1px solid var(--color-border, #E8EAED)", padding: "24px", overflowX: "auto", boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))" }}>
            <h3 style={{ margin: "0 0 18px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.15rem", fontWeight: "650" }}>Daily Performance Breakdown</h3>

            {filteredData.length === 0 ? (
              <EmptyState
                title="No matching results found"
                description="No daily performance records match your selected spend filter."
                action={
                  <Button variant="outline" onClick={() => setSpendFilter("all")}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "var(--color-surface, #F7F9FC)", color: "var(--color-text-secondary, #64748B)" }}>
                    <th style={{ padding: "12px 14px" }}>Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Spend</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Impressions</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Reach</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Clicks</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>CTR</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", transition: "background-color 0.15s ease" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "600" }}>{row.date}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaOverview;
