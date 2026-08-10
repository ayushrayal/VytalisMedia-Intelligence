import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getMetaOverview } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import {
  ShoppingBag,
  DollarSign,
  Target,
  TrendingUp,
  Wallet,
  Eye,
  Users,
  MousePointer2,
  BarChart3,
  Tag,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * MetaOverview Page Component.
 * Features:
 * - Purchase Performance Group (Purchases, Conversion Value, Cost per Result, Purchase ROAS)
 * - Volume & Efficiency Group (Spend, Impressions, Reach, Clicks, Avg CTR, Avg CPC)
 * - Daily Performance breakdown table
 */
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

  // Total Aggregations
  const totals = data.reduce(
    (acc, row) => {
      acc.spend += Number(row.spend || 0);
      acc.impressions += Number(row.impressions || 0);
      acc.reach += Number(row.reach || 0);
      acc.clicks += Number(row.clicks || 0);
      acc.purchases += Number(row.purchases ?? row.actions_omni_purchase ?? 0);
      acc.purchaseValue += Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
      acc.currency = row.currency || acc.currency;
      return acc;
    },
    { spend: 0, impressions: 0, reach: 0, clicks: 0, purchases: 0, purchaseValue: 0, currency: "INR" }
  );

  // Derived Aggregate Ratios
  const overallCostPerResult = totals.purchases > 0 ? totals.spend / totals.purchases : null;
  const overallPurchaseRoas = totals.spend > 0 ? totals.purchaseValue / totals.spend : null;

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
          <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill, 999px)", backgroundColor: "var(--color-primary-light, rgba(10, 132, 255, 0.08))", color: "#0A84FF", fontWeight: "600" }}>
            {meta.source}
          </span>
          <span style={{ marginLeft: "8px" }}>Cached: {new Date(meta.cachedAt).toLocaleTimeString()}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="320px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Overview Metrics Found" description="No Meta overview records were returned for this date range." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Group 1: Purchase Performance */}
          <div>
            <h4 style={{ margin: "0 0 14px 0", fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary, #64748B)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Purchase Performance
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <MetricCard title="Purchases" value={formatNumber(totals.purchases)} icon={ShoppingBag} accentColor="#16A34A" />
              <MetricCard title="Conversion Value" value={formatCurrency(totals.purchaseValue, totals.currency)} icon={DollarSign} accentColor="#16A34A" />
              <MetricCard
                title="Cost per Result"
                value={overallCostPerResult !== null ? formatCurrency(overallCostPerResult, totals.currency) : "—"}
                icon={Target}
                accentColor="#0A84FF"
              />
              <MetricCard
                title="Purchase ROAS"
                value={overallPurchaseRoas !== null ? `${overallPurchaseRoas.toFixed(2)}x` : "—"}
                icon={TrendingUp}
                accentColor="#16A34A"
              />
            </div>
          </div>

          {/* Group 2: Volume & Efficiency Metrics */}
          <div>
            <h4 style={{ margin: "0 0 14px 0", fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary, #64748B)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Volume & Efficiency
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <MetricCard title="Total Spend" value={formatCurrency(totals.spend, totals.currency)} icon={Wallet} accentColor="#16A34A" />
              <MetricCard title="Impressions" value={formatNumber(totals.impressions)} icon={Eye} accentColor="#8B5CF6" />
              <MetricCard title="Reach" value={formatNumber(totals.reach)} icon={Users} accentColor="#0A84FF" />
              <MetricCard title="Clicks" value={formatNumber(totals.clicks)} icon={MousePointer2} accentColor="#EC4899" />
              <MetricCard title="Average CTR" value={formatPercentage(avgCtr)} icon={BarChart3} accentColor="#0A84FF" />
              <MetricCard title="Average CPC" value={formatCurrency(avgCpc, totals.currency)} icon={Tag} accentColor="#8B5CF6" />
            </div>
          </div>

          {/* Daily Performance Breakdown Table Card */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "var(--radius-card, 12px)", border: "1px solid var(--color-border, #E5E7EB)", padding: "24px", overflowX: "auto", boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))" }}>
            <h3 style={{ margin: "0 0 18px 0", color: "var(--color-text-primary, #0F172A)", fontSize: "1.05rem", fontWeight: "700" }}>Daily Performance Breakdown</h3>

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
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #0F172A)", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", textAlign: "left", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", color: "var(--color-text-secondary, #64748B)" }}>
                    <th style={{ padding: "12px 14px" }}>Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Spend</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Purchases</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Purchase Value</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>ROAS</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Impressions</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Reach</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Clicks</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>CTR</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => {
                    const rowPurchases = Number(row.purchases ?? row.actions_omni_purchase ?? 0);
                    const rowValue = Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
                    const rowRoas = row.purchase_roas ?? row.purchase_roas_omni_purchase;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E5E7EB)", transition: "background-color 0.15s ease" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "600" }}>{row.date}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatNumber(rowPurchases)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(rowValue, row.currency)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right", color: "#16A34A" }}>
                          {rowRoas !== null && rowRoas !== undefined ? `${Number(rowRoas).toFixed(2)}x` : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                      </tr>
                    );
                  })}
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
