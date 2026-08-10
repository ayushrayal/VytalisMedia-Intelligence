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
 * Format raw date string ("2026-08-11") into short date ("Aug 11").
 */
const formatShortDate = (rawDateStr) => {
  if (!rawDateStr) return "";
  try {
    const parts = String(rawDateStr).trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    const d = new Date(rawDateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return rawDateStr;
  } catch {
    return rawDateStr;
  }
};

/**
 * Format raw date string ("2026-08-11") into full tooltip date ("Aug 11, 2026").
 */
const formatFullDate = (rawDateStr) => {
  if (!rawDateStr) return "";
  try {
    const parts = String(rawDateStr).trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    }
    const d = new Date(rawDateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return rawDateStr;
  } catch {
    return rawDateStr;
  }
};

/**
 * MetaOverview Page Component.
 * Premium B2B SaaS Hierarchy:
 * 1. Page Context & Filters
 * 2. Executive Performance Summary (Top 4 Metrics)
 * 3. Performance Trend (Linear/Stripe Quality Visualization with Dates Strictly Inside Card)
 * 4. Purchase Performance Group
 * 5. Volume & Efficiency Group
 * 6. Daily Performance Breakdown Table
 */
export const MetaOverview = () => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Spend Filter State
  const [spendFilter, setSpendFilter] = useState("all");

  // Trend Metric Selector State ("spend" | "value" | "purchases")
  const [trendMetric, setTrendMetric] = useState("spend");
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Responsive Window Width for Dynamic X-Axis Label Densities
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Daily records sorted by date ascending for trend chart
  const sortedTrendData = useMemo(() => {
    return [...filteredData].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [filteredData]);

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

  // Derived Ratios
  const overallCostPerResult = totals.purchases > 0 ? totals.spend / totals.purchases : null;
  const overallPurchaseRoas = totals.spend > 0 ? totals.purchaseValue / totals.spend : null;
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

  // Trend Chart Point Calculations
  const trendPoints = useMemo(() => {
    if (sortedTrendData.length === 0) return [];
    return sortedTrendData.map((row) => {
      let val = 0;
      if (trendMetric === "spend") val = Number(row.spend || 0);
      else if (trendMetric === "value") val = Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
      else if (trendMetric === "purchases") val = Number(row.purchases ?? row.actions_omni_purchase ?? 0);
      return { date: row.date, value: val, row };
    });
  }, [sortedTrendData, trendMetric]);

  const maxTrendVal = useMemo(() => {
    if (trendPoints.length === 0) return 1;
    const max = Math.max(...trendPoints.map((p) => p.value));
    return max > 0 ? max : 1;
  }, [trendPoints]);

  // Dynamically Thinned Visible X-Axis Label Indices
  const visibleLabelIndices = useMemo(() => {
    const total = trendPoints.length;
    if (total === 0) return [];

    let maxLabels = 7;
    if (windowWidth < 480) maxLabels = 4;
    else if (windowWidth < 768) maxLabels = 5;
    else if (windowWidth < 1024) maxLabels = 6;

    if (total <= maxLabels) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const stride = Math.ceil((total - 1) / (maxLabels - 1));
    const indices = [];
    for (let i = 0; i < total; i += stride) {
      indices.push(i);
    }

    if (indices[indices.length - 1] !== total - 1) {
      if (total - 1 - indices[indices.length - 1] < Math.floor(stride / 2)) {
        indices[indices.length - 1] = total - 1;
      } else {
        indices.push(total - 1);
      }
    }

    return indices;
  }, [trendPoints.length, windowWidth]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* 1. PAGE CONTEXT & FILTERS */}
      <div>
        <PageHeader
          title="Meta Overview"
          subtitle="Performance analytics for connected Meta accounts"
          actions={
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <AccountSwitcher onAccountSwitched={fetchData} />
              <DateFilter onChange={(params) => setDateParams(params)} />
              <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            </div>
          }
        />

        {meta && (
          <div style={{ marginTop: "-16px", marginBottom: "16px", fontSize: "12px", color: "var(--color-text-muted, #94A3B8)", display: "flex", gap: "8px", alignItems: "center" }}>
            <span>Source:</span>
            <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill, 999px)", backgroundColor: "var(--color-primary-light, rgba(10, 132, 255, 0.08))", color: "#0A84FF", fontWeight: "600" }}>
              {meta.source}
            </span>
            <span style={{ marginLeft: "6px" }}>Cached: {new Date(meta.cachedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Skeleton height="90px" />
            <Skeleton height="90px" />
            <Skeleton height="90px" />
            <Skeleton height="90px" />
          </div>
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Overview Metrics Found" description="No Meta overview records were returned for this date range." />
      ) : (
        <>
          {/* 2. EXECUTIVE PERFORMANCE SUMMARY (Top 4 Key Metrics) */}
          <div>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
              Performance Summary
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <MetricCard title="Spend" value={formatCurrency(totals.spend, totals.currency)} icon={Wallet} accentColor="#16A34A" />
              <MetricCard title="Purchases" value={formatNumber(totals.purchases)} icon={ShoppingBag} accentColor="#16A34A" />
              <MetricCard title="Purchase Conversion Value" value={formatCurrency(totals.purchaseValue, totals.currency)} icon={DollarSign} accentColor="#16A34A" />
              <MetricCard
                title="Purchase ROAS"
                value={overallPurchaseRoas !== null ? `${overallPurchaseRoas.toFixed(2)}x` : "—"}
                icon={TrendingUp}
                accentColor="#16A34A"
              />
            </div>
          </div>

          {/* 3. PERFORMANCE TREND CARD (Dates Strictly Inside White Card Boundary) */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              padding: "28px 32px 28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            {/* Header: Title, Subtitle, Segmented Switcher */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
                  Performance Trend
                </h3>
                <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                  Daily breakdown across selected date range
                </p>
              </div>

              {/* Segmented Metric Selector */}
              <div style={{ display: "flex", backgroundColor: "#F1F5F9", borderRadius: "8px", padding: "3px", border: "1px solid #E5E7EB", gap: "2px" }}>
                {[
                  { id: "spend", label: "Spend" },
                  { id: "value", label: "Revenue" },
                  { id: "purchases", label: "Purchases" },
                ].map((m) => {
                  const active = trendMetric === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setTrendMetric(m.id)}
                      style={{
                        padding: "6px 14px",
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor: active ? "#FFFFFF" : "transparent",
                        color: active ? "#0A84FF" : "#64748B",
                        fontWeight: active ? "600" : "500",
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: active ? "0 1px 3px rgba(0, 0, 0, 0.06)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG Trend Chart Canvas */}
            {trendPoints.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
                No trend data points available.
              </div>
            ) : (
              <div>
                <div style={{ position: "relative", width: "100%", height: "200px" }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="20" x2="800" y2="20" stroke="#E2E8F0" strokeDasharray="4 4" />
                    <line x1="0" y1="65" x2="800" y2="65" stroke="#E2E8F0" strokeDasharray="4 4" />
                    <line x1="0" y1="110" x2="800" y2="110" stroke="#E2E8F0" strokeDasharray="4 4" />
                    <line x1="0" y1="155" x2="800" y2="155" stroke="#E2E8F0" strokeDasharray="4 4" />

                    {/* Line & Area Path Calculation */}
                    {(() => {
                      const width = 800;
                      const height = 155;
                      const topPadding = 20;
                      const count = trendPoints.length;

                      const coords = trendPoints.map((pt, idx) => {
                        const x = count === 1 ? width / 2 : (idx / (count - 1)) * width;
                        const y = height - (pt.value / maxTrendVal) * (height - topPadding) + topPadding;
                        return { x, y, pt };
                      });

                      const lineString = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
                      const areaString = `${lineString} L ${coords[coords.length - 1].x.toFixed(1)},${height} L ${coords[0].x.toFixed(1)},${height} Z`;

                      return (
                        <g>
                          <path d={areaString} fill="url(#trendGradient)" />
                          <path d={lineString} fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Interactive Data Dots (ALL data points remain rendered) */}
                          {coords.map((c, idx) => (
                            <g key={idx} onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)}>
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={hoveredPointIndex === idx ? "6.5" : "4"}
                                fill="#FFFFFF"
                                stroke="#0A84FF"
                                strokeWidth={hoveredPointIndex === idx ? "3" : "2.5"}
                                style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                              />
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Active Hover Tooltip Callout */}
                  {hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-42px",
                        left: `${Math.min(88, Math.max(12, (hoveredPointIndex / (trendPoints.length - 1 || 1)) * 100))}%`,
                        transform: "translateX(-50%)",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
                        pointerEvents: "none",
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        whiteSpace: "nowrap",
                        transition: "left 0.1s ease",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                        {formatFullDate(trendPoints[hoveredPointIndex].date)}
                      </span>
                      <span style={{ fontSize: "13px", color: "#0F172A", fontWeight: "700" }}>
                        {trendMetric === "purchases"
                          ? formatNumber(trendPoints[hoveredPointIndex].value)
                          : formatCurrency(trendPoints[hoveredPointIndex].value, totals.currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* X-Axis Date Labels Container (Sitting comfortably INSIDE white card boundary) */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "20px",
                    marginTop: "16px",
                    fontSize: "12px",
                    color: "#64748B",
                  }}
                >
                  {visibleLabelIndices.map((idx) => {
                    const p = trendPoints[idx];
                    if (!p) return null;
                    const pct = trendPoints.length > 1 ? (idx / (trendPoints.length - 1)) * 100 : 50;

                    let transform = "translateX(-50%)";
                    if (pct === 0) transform = "translateX(0%)";
                    else if (pct === 100) transform = "translateX(-100%)";

                    const isHovered = hoveredPointIndex === idx;

                    return (
                      <span
                        key={idx}
                        style={{
                          position: "absolute",
                          left: `${pct}%`,
                          transform,
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                          fontWeight: isHovered ? "700" : "500",
                          color: isHovered ? "#0A84FF" : "#64748B",
                          lineHeight: 1,
                          userSelect: "none",
                          transition: "color 0.15s ease",
                        }}
                      >
                        {formatShortDate(p.date)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. PURCHASE PERFORMANCE GROUP */}
          <div>
            <h3 style={{ margin: "12px 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
              Purchase Performance
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <MetricCard title="Purchases" value={formatNumber(totals.purchases)} icon={ShoppingBag} accentColor="#16A34A" />
              <MetricCard title="Purchase Value" value={formatCurrency(totals.purchaseValue, totals.currency)} icon={DollarSign} accentColor="#16A34A" />
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

          {/* 5. VOLUME & EFFICIENCY GROUP */}
          <div>
            <h3 style={{ margin: "12px 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
              Volume & Efficiency
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <MetricCard title="Total Spend" value={formatCurrency(totals.spend, totals.currency)} icon={Wallet} accentColor="#16A34A" />
              <MetricCard title="Impressions" value={formatNumber(totals.impressions)} icon={Eye} accentColor="#8B5CF6" />
              <MetricCard title="Reach" value={formatNumber(totals.reach)} icon={Users} accentColor="#0A84FF" />
              <MetricCard title="Clicks" value={formatNumber(totals.clicks)} icon={MousePointer2} accentColor="#EC4899" />
              <MetricCard title="Average CTR" value={formatPercentage(avgCtr)} icon={BarChart3} accentColor="#0A84FF" />
              <MetricCard title="Average CPC" value={formatCurrency(avgCpc, totals.currency)} icon={Tag} accentColor="#8B5CF6" />
            </div>
          </div>

          {/* 6. DAILY PERFORMANCE BREAKDOWN TABLE */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", backgroundColor: "var(--color-surface-subtle, #F1F5F9)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Daily Performance
              </h3>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary, #64748B)" }}>
                {filteredData.length} daily records
              </span>
            </div>

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
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#0F172A", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left", backgroundColor: "#FFFFFF", color: "#64748B" }}>
                      <th style={{ padding: "12px 18px", fontWeight: "600" }}>Date</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Spend</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Purchases</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Purchase Value</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>ROAS</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Impressions</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Reach</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Clicks</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>CTR</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, idx) => {
                      const rowPurchases = Number(row.purchases ?? row.actions_omni_purchase ?? 0);
                      const rowValue = Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
                      const rowRoas = row.purchase_roas ?? row.purchase_roas_omni_purchase;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid #E5E7EB",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--color-surface-subtle, #F1F5F9)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "12px 18px", fontWeight: "600" }}>{formatShortDate(row.date)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatNumber(rowPurchases)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(rowValue, row.currency)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right", color: "#16A34A" }}>
                            {rowRoas !== null && rowRoas !== undefined ? `${Number(rowRoas).toFixed(2)}x` : "—"}
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                          <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MetaOverview;
