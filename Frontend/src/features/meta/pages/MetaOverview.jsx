import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMetaOverview, getCampaigns, getAdsets, getPlaces } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { useDashboardLayout } from "../../../hooks/useDashboardLayout.js";
import DashboardGrid from "../../../components/dashboard/DashboardGrid.jsx";
import DashboardCustomizer from "../../../components/dashboard/DashboardCustomizer.jsx";
import { SlidersHorizontal, RefreshCw, Clock3 } from "lucide-react";
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
 * MetaOverview Orchestration Component.
 * Integrates premium customizable dashboard grid, right drawer settings,
 * date/account filters, and preserved analytics data logic.
 */
export const MetaOverview = () => {
  const navigate = useNavigate();

  // Custom Dashboard Layout Hook
  const {
    orderedIds,
    visibleIds,
    visibleWidgets,
    isCustomizing,
    savedBadge,
    openCustomizer,
    closeCustomizer,
    toggleWidget,
    moveWidget,
    resetToDefault,
  } = useDashboardLayout();

  // State Management
  const [overviewData, setOverviewData] = useState([]);
  const [campaignsData, setCampaignsData] = useState([]);
  const [adsetsData, setAdsetsData] = useState([]);
  const [placesData, setPlacesData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });
  const [spendFilter, setSpendFilter] = useState("all");

  // Trend Metric Selector ("spend" | "value" | "purchases")
  const [trendMetric, setTrendMetric] = useState("spend");
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Responsive Window Width for Dynamic X-Axis Labels
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Parallel Data Fetching for All Meta Datasets
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const [overviewRes, campaignsRes, adsetsRes, placesRes] = await Promise.allSettled([
          getMetaOverview(dateParams),
          getCampaigns(dateParams),
          getAdsets(dateParams),
          getPlaces(dateParams),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value?.data) {
          setOverviewData(Array.isArray(overviewRes.value.data) ? overviewRes.value.data : []);
          setMeta(overviewRes.value.meta || null);
        } else if (overviewRes.status === "rejected") {
          throw overviewRes.reason;
        }

        if (campaignsRes.status === "fulfilled" && campaignsRes.value?.data) {
          setCampaignsData(Array.isArray(campaignsRes.value.data) ? campaignsRes.value.data : []);
        }

        if (adsetsRes.status === "fulfilled" && adsetsRes.value?.data) {
          setAdsetsData(Array.isArray(adsetsRes.value.data) ? adsetsRes.value.data : []);
        }

        if (placesRes.status === "fulfilled" && placesRes.value?.data) {
          setPlacesData(Array.isArray(placesRes.value.data) ? placesRes.value.data : []);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateParams]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Filtered Overview Array
  const filteredOverviewData = useMemo(() => {
    return overviewData.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      return spendFilter === "all" || numericSpend >= Number(spendFilter);
    });
  }, [overviewData, spendFilter]);

  // Daily records sorted by date ascending for trend chart
  const sortedTrendData = useMemo(() => {
    return [...filteredOverviewData].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [filteredOverviewData]);

  // Total Aggregations
  const totals = useMemo(() => {
    let rawUniqueCtr = null;
    let rawCpm = null;
    let hasAddToCart = false;
    let hasCheckoutInit = false;

    const sumTotals = overviewData.reduce(
      (acc, row) => {
        acc.spend += Number(row.spend || 0);
        acc.impressions += Number(row.impressions || 0);
        acc.reach += Number(row.reach || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.purchases += Number(row.purchases ?? row.actions_omni_purchase ?? 0);
        acc.purchaseValue += Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);

        const cartVal = row.actions_add_to_cart ?? row.add_to_cart;
        if (cartVal !== null && cartVal !== undefined) {
          hasAddToCart = true;
          acc.addToCart += Number(cartVal);
        }

        const checkoutVal = row.actions_initiate_checkout ?? row.initiate_checkout;
        if (checkoutVal !== null && checkoutVal !== undefined) {
          hasCheckoutInit = true;
          acc.checkoutInitiated += Number(checkoutVal);
        }

        if (row.unique_outbound_clicks_ctr_outbound_click !== undefined && row.unique_outbound_clicks_ctr_outbound_click !== null) {
          rawUniqueCtr = row.unique_outbound_clicks_ctr_outbound_click;
        }
        if (row.cpm !== undefined && row.cpm !== null) {
          rawCpm = row.cpm;
        }

        acc.currency = row.currency || acc.currency;
        return acc;
      },
      { spend: 0, impressions: 0, reach: 0, clicks: 0, purchases: 0, purchaseValue: 0, addToCart: 0, checkoutInitiated: 0, currency: "INR" }
    );

    return {
      ...sumTotals,
      addToCart: hasAddToCart ? sumTotals.addToCart : null,
      checkoutInitiated: hasCheckoutInit ? sumTotals.checkoutInitiated : null,
      uniqueOutboundCtr: rawUniqueCtr,
      cpm: rawCpm,
    };
  }, [overviewData]);

  // Derived Ratios
  const overallCostPerResult = totals.purchases > 0 ? totals.spend / totals.purchases : null;
  const overallPurchaseRoas = totals.spend > 0 ? totals.purchaseValue / totals.spend : null;
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

  // Trend Sparklines Data
  const sparklines = useMemo(() => {
    const spends = sortedTrendData.map((d) => Number(d.spend || 0));
    const imps = sortedTrendData.map((d) => Number(d.impressions || 0));
    const purchs = sortedTrendData.map((d) => Number(d.purchases ?? d.actions_omni_purchase ?? 0));
    const vals = sortedTrendData.map((d) => Number(d.purchase_conversion_value ?? d.action_values_omni_purchase ?? 0));
    const reach = sortedTrendData.map((d) => Number(d.reach || 0));
    const clicks = sortedTrendData.map((d) => Number(d.clicks || 0));
    return { spends, imps, purchs, vals, reach, clicks };
  }, [sortedTrendData]);

  // Calculated Period Change (% comparison between first half and second half)
  const calcTrendChange = useCallback((arr = []) => {
    if (arr.length < 4) return null;
    const mid = Math.floor(arr.length / 2);
    const firstHalf = arr.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalf = arr.slice(mid).reduce((a, b) => a + b, 0);
    if (firstHalf === 0) return null;
    const pct = ((secondHalf - firstHalf) / firstHalf) * 100;
    return Number(pct.toFixed(1));
  }, []);

  const trendChanges = useMemo(
    () => ({
      spend: calcTrendChange(sparklines.spends),
      impressions: calcTrendChange(sparklines.imps),
      purchases: calcTrendChange(sparklines.purchs),
      value: calcTrendChange(sparklines.vals),
      reach: calcTrendChange(sparklines.reach),
      clicks: calcTrendChange(sparklines.clicks),
    }),
    [sparklines, calcTrendChange]
  );

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

  // Dynamically Thinned X-Axis Label Indices
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

  // Top 5 Campaigns sorted by spend
  const topCampaigns = useMemo(() => {
    return [...campaignsData]
      .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
      .slice(0, 5);
  }, [campaignsData]);

  // Top 5 Ad Sets sorted by spend
  const topAdsets = useMemo(() => {
    return [...adsetsData]
      .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
      .slice(0, 5);
  }, [adsetsData]);

  // Placements / Regional Breakdown Data for Donut Chart
  const placementsBreakdown = useMemo(() => {
    if (!placesData || placesData.length === 0) return [];
    const aggregated = {};
    let totalSpendAll = 0;

    placesData.forEach((row) => {
      const name = row.region || row.country || row.publisher_platform || row.placement || "Other";
      const spend = Number(row.spend || 0);
      aggregated[name] = (aggregated[name] || 0) + spend;
      totalSpendAll += spend;
    });

    const items = Object.entries(aggregated)
      .map(([name, spend]) => ({
        name,
        spend,
        pct: totalSpendAll > 0 ? (spend / totalSpendAll) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend);

    if (items.length <= 4) return items;

    const top3 = items.slice(0, 3);
    const othersSpend = items.slice(3).reduce((sum, item) => sum + item.spend, 0);
    const othersPct = totalSpendAll > 0 ? (othersSpend / totalSpendAll) * 100 : 0;

    return [...top3, { name: "Other Placements", spend: othersSpend, pct: othersPct }];
  }, [placesData]);

  const placementColors = ["#0A84FF", "#16A34A", "#6366F1", "#F59E0B"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. PAGE HEADER & TOOLBAR */}
      <div>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px", lineHeight: "1.2" }}>
            Meta Overview
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Track and analyze your Meta (Facebook & Instagram) ad performance.
          </p>
        </div>

        {/* Toolbar Container */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Left Filters Group */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <DateFilter onChange={(params) => setDateParams(params)} />
            <AccountSwitcher onAccountSwitched={() => fetchData(false)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
          </div>

          {/* Right Actions Group: Customize (20px gap) Refresh (8px gap) Cached */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            {/* Customize Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginRight: "12px" }}>
              <label style={{ fontSize: "12px", color: "transparent", userSelect: "none", lineHeight: 1 }}>
                Action
              </label>
              <button
                type="button"
                onClick={openCustomizer}
                aria-label="Customize Dashboard"
                style={{
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "9px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #0A84FF",
                  color: "#0A84FF",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(10, 132, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
              >
                <SlidersHorizontal size={16} color="#0A84FF" />
                Customize
              </button>
            </div>

            {/* Refresh Icon Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "transparent", userSelect: "none", lineHeight: 1 }}>
                Refresh
              </label>
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                aria-label="Refresh data"
                title="Refresh data"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "9px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#334155",
                  cursor: refreshing ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = "#F8FAFC";
                    e.currentTarget.style.borderColor = "#CBD5E1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#E2E8F0";
                  }
                }}
              >
                <RefreshCw
                  size={16}
                  color="#334155"
                  className={refreshing ? "spin" : ""}
                  style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
                />
              </button>
            </div>

            {/* Cached Status Indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "transparent", userSelect: "none", lineHeight: 1 }}>
                Status
              </label>
              <div
                style={{
                  height: "44px",
                  padding: "0 12px",
                  borderRadius: "9px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#64748B",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Clock3 size={15} color="#64748B" />
                <span>
                  {meta && meta.cachedAt
                    ? `Cached ${new Date(meta.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Cached"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="320px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            <Skeleton height="260px" />
            <Skeleton height="260px" />
            <Skeleton height="260px" />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchData(false)} />
      ) : overviewData.length === 0 ? (
        <EmptyState
          title="No Meta Overview Data"
          description="No performance records were found for the selected account and date range."
        />
      ) : (
        <>
          {/* 2. DYNAMIC CUSTOMIZABLE DASHBOARD GRID */}
          <DashboardGrid
            visibleWidgets={visibleWidgets}
            totals={totals}
            overallCostPerResult={overallCostPerResult}
            overallPurchaseRoas={overallPurchaseRoas}
            avgCtr={avgCtr}
            avgCpc={avgCpc}
            sparklines={sparklines}
            trendChanges={trendChanges}
            trendPoints={trendPoints}
            maxTrendVal={maxTrendVal}
            trendMetric={trendMetric}
            setTrendMetric={setTrendMetric}
            hoveredPointIndex={hoveredPointIndex}
            setHoveredPointIndex={setHoveredPointIndex}
            visibleLabelIndices={visibleLabelIndices}
            topCampaigns={topCampaigns}
            topAdsets={topAdsets}
            placementsBreakdown={placementsBreakdown}
            placementColors={placementColors}
            navigate={navigate}
            onOpenCustomizer={openCustomizer}
            onResetDefault={resetToDefault}
          />

          {/* 3. DAILY PERFORMANCE BREAKDOWN TABLE */}
          {visibleWidgets.length > 0 && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #E5E7EB",
                  backgroundColor: "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                  Daily Breakdown
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {filteredOverviewData.length} records
                </span>
              </div>

              {filteredOverviewData.length === 0 ? (
                <EmptyState
                  title="No matching records"
                  description="No daily performance records match your active spend filter."
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
                      <tr style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left", backgroundColor: "#FFFFFF", color: "#64748B", whiteSpace: "nowrap" }}>
                        <th style={{ padding: "12px 18px", fontWeight: "600" }}>Date</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Spend</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Add to Cart</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Checkout Initiated</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Purchases</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Purchase Value</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>ROAS</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Impressions</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Reach</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Clicks</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>CTR</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>Unique Outbound CTR</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>CPC</th>
                        <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600" }}>CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOverviewData.map((row, idx) => {
                        const rowPurchases = Number(row.purchases ?? row.actions_omni_purchase ?? 0);
                        const rowValue = Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
                        const rowRoas = row.purchase_roas ?? row.purchase_roas_omni_purchase;
                        const rowAddToCart = row.actions_add_to_cart ?? row.add_to_cart;
                        const rowCheckout = row.actions_initiate_checkout ?? row.initiate_checkout;
                        const rowUniqueOutboundCtr = row.unique_outbound_clicks_ctr_outbound_click ?? row.unique_outbound_clicks_ctr;

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid #E5E7EB",
                              transition: "background-color 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F8FAFC";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <td style={{ padding: "12px 18px", fontWeight: "600" }}>{formatShortDate(row.date)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>
                              {rowAddToCart !== null && rowAddToCart !== undefined ? formatNumber(rowAddToCart) : "—"}
                            </td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>
                              {rowCheckout !== null && rowCheckout !== undefined ? formatNumber(rowCheckout) : "—"}
                            </td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatNumber(rowPurchases)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(rowValue, row.currency)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right", color: "#16A34A" }}>
                              {rowRoas !== null && rowRoas !== undefined ? `${Number(rowRoas).toFixed(2)}x` : "—"}
                            </td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>
                              {rowUniqueOutboundCtr !== null && rowUniqueOutboundCtr !== undefined ? formatPercentage(rowUniqueOutboundCtr) : "—"}
                            </td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                            <td style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>
                              {row.cpm !== null && row.cpm !== undefined ? formatCurrency(row.cpm, row.currency) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* RIGHT-SIDE DASHBOARD CUSTOMIZER DRAWER */}
      <DashboardCustomizer
        isOpen={isCustomizing}
        onClose={closeCustomizer}
        orderedIds={orderedIds}
        visibleIds={visibleIds}
        onToggleWidget={toggleWidget}
        onMoveWidget={moveWidget}
        onResetDefault={resetToDefault}
        savedBadge={savedBadge}
      />
    </div>
  );
};

export default MetaOverview;
