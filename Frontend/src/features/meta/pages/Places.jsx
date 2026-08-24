import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { getPlaces } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import PlacesKpiCards from "../components/PlacesKpiCards.jsx";
import PlacesTopRegionsOverview from "../components/PlacesTopRegionsOverview.jsx";
import PlacesRegionalCharts from "../components/PlacesRegionalCharts.jsx";
import PlacesInsightsAndHighlights from "../components/PlacesInsightsAndHighlights.jsx";
import PlacesDetailedTable from "../components/PlacesDetailedTable.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import Select from "../../../components/ui/Select.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Places Component (Meta Places / Geographic Metrics).
 * Transformed into a decision-oriented geographic analytics dashboard with:
 * - 5 Summary KPI cards with weighted CTR
 * - Top 5 Regions Overview cards with metric selector
 * - Regional Spend & Performance horizontal bar charts
 * - Best Region, Most Efficient Region, and dynamic insights
 * - Top Performing vs. Needs Attention comparison
 * - Country filter support (if multiple countries exist in payload)
 * - Detailed Geographic Table with frontend column sorting
 */
export const Places = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Filter States
  const [spendFilter, setSpendFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPlaces(dateParams);
      if (res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
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

  // Extract distinct countries for optional country selector
  const distinctCountries = useMemo(() => {
    const set = new Set();
    data.forEach((row) => {
      if (row.country && row.country.trim()) {
        set.add(row.country.trim());
      }
    });
    return Array.from(set);
  }, [data]);

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);
      const matchesCountry = countryFilter === "all" || (row.country && row.country.trim() === countryFilter);
      return matchesSpend && matchesCountry;
    });
  }, [data, spendFilter, countryFilter]);

  // Detect currency from payload
  const currency = useMemo(() => {
    const found = filteredData.find((r) => r.currency);
    return found ? found.currency : "INR";
  }, [filteredData]);

  // Aggregated Regional Data (combines duplicates by region name)
  const aggregatedRegions = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const reg = String(row.region || "Unknown Region").trim();
      if (!map[reg]) {
        map[reg] = {
          region: reg,
          country: row.country || "",
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
          currency: row.currency || currency,
        };
      }
      map[reg].spend += Number(row.spend || 0);
      map[reg].impressions += Number(row.impressions || 0);
      map[reg].reach += Number(row.reach || 0);
      map[reg].clicks += Number(row.clicks || 0);
    });

    return Object.values(map).map((r) => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    }));
  }, [filteredData, currency]);

  // Total Summary Metrics
  const { totalSpend, totalReach, totalImpressions, totalClicks, overallCtr } = useMemo(() => {
    let spendSum = 0;
    let reachSum = 0;
    let imprSum = 0;
    let clickSum = 0;

    aggregatedRegions.forEach((r) => {
      spendSum += r.spend;
      reachSum += r.reach;
      imprSum += r.impressions;
      clickSum += r.clicks;
    });

    const ctr = imprSum > 0 ? (clickSum / imprSum) * 100 : 0;

    return {
      totalSpend: spendSum,
      totalReach: reachSum,
      totalImpressions: imprSum,
      totalClicks: clickSum,
      overallCtr: ctr,
    };
  }, [aggregatedRegions]);

  // Candidate pool of meaningful / high-spend regions
  const highSpendRegions = useMemo(() => {
    if (aggregatedRegions.length === 0) return [];

    // Sort regions by spend descending
    const sortedBySpend = [...aggregatedRegions].sort((a, b) => b.spend - a.spend);

    // If total regions <= 3, consider all regions with spend > 0 (or all if spend is 0)
    if (sortedBySpend.length <= 3) {
      const withSpend = sortedBySpend.filter((r) => r.spend > 0);
      return withSpend.length > 0 ? withSpend : sortedBySpend;
    }

    const maxSpend = sortedBySpend[0].spend;
    const avgSpend = totalSpend / sortedBySpend.length;

    // Meaningful spend threshold: regions with spend >= 25% of average spend or >= 10% of max spend
    const threshold = Math.max(1, Math.min(avgSpend * 0.25, maxSpend * 0.10));

    let pool = sortedBySpend.filter((r) => r.spend >= threshold && r.spend > 0);

    // Fallback: Ensure at least top 3 spenders are included if strict threshold yields < 3
    if (pool.length < 3) {
      const fallbackCount = Math.max(3, Math.ceil(sortedBySpend.length * 0.5));
      const spenders = sortedBySpend.filter((r) => r.spend > 0);
      pool = spenders.slice(0, fallbackCount);
      if (pool.length === 0) pool = sortedBySpend.slice(0, 3);
    }
    return pool;
  }, [aggregatedRegions, totalSpend]);

  // Top Performing Regions List (High-spend regions ranked by CTR)
  const topRegionsList = useMemo(() => {
    if (highSpendRegions.length === 0) return [];
    return [...highSpendRegions].sort((a, b) => b.ctr - a.ctr).slice(0, 3);
  }, [highSpendRegions]);

  // Best Performing Region (Top 1 high-spend region ranked by CTR)
  const bestRegion = useMemo(() => {
    return topRegionsList[0] || null;
  }, [topRegionsList]);

  // Most Efficient Region (Lowest CPC among high-spend regions with clicks > 0)
  const efficientRegion = useMemo(() => {
    if (highSpendRegions.length === 0) return null;
    let candidates = highSpendRegions.filter((r) => r.clicks > 0 && r.cpc > 0);
    if (candidates.length === 0) {
      candidates = aggregatedRegions.filter((r) => r.clicks > 0 && r.cpc > 0);
    }
    if (candidates.length === 0) return null;

    // Lower CPC = more efficient. Secondary signal: CTR
    return candidates.sort((a, b) => {
      if (a.cpc !== b.cpc) return a.cpc - b.cpc;
      return b.ctr - a.ctr;
    })[0];
  }, [highSpendRegions, aggregatedRegions]);

  // Needs Attention Regions (High spend, low CTR relative to high-spend average / overall CTR)
  const needsAttentionList = useMemo(() => {
    if (highSpendRegions.length === 0) return [];

    const avgHighSpendCtr =
      highSpendRegions.reduce((sum, r) => sum + r.ctr, 0) / highSpendRegions.length;

    const targetCtr = overallCtr > 0 ? Math.min(avgHighSpendCtr, overallCtr) : avgHighSpendCtr;
    let candidates = highSpendRegions.filter((r) => r.ctr < avgHighSpendCtr || r.ctr < targetCtr);

    if (candidates.length === 0 && highSpendRegions.length > 1) {
      const maxCtr = Math.max(...highSpendRegions.map((r) => r.ctr));
      candidates = highSpendRegions.filter((r) => r.ctr < maxCtr * 0.85);
    }

    // Rank results by: 1. Higher spend first, 2. Lower CTR second
    return [...candidates]
      .sort((a, b) => {
        if (b.spend !== a.spend) {
          return b.spend - a.spend;
        }
        return a.ctr - b.ctr;
      })
      .slice(0, 3);
  }, [highSpendRegions, overallCtr]);

  // Dynamic Rule-based Insights generated strictly from payload data & high-spend regions
  const insights = useMemo(() => {
    if (aggregatedRegions.length === 0) return [];
    const list = [];

    // Insight 1: Highest spend region
    const topSpendRegion = [...aggregatedRegions].sort((a, b) => b.spend - a.spend)[0];
    if (topSpendRegion && topSpendRegion.spend > 0) {
      const pct = totalSpend > 0 ? ((topSpendRegion.spend / totalSpend) * 100).toFixed(0) : 0;
      list.push(`${topSpendRegion.region} accounts for the largest share of regional spend (${pct}% of total spend).`);
    }

    // Insight 2: Strongest CTR among high-spend regions
    if (bestRegion && bestRegion.ctr > 0) {
      list.push(`${bestRegion.region} achieved the strongest CTR (${formatPercentage(bestRegion.ctr)}) among high-spend regions.`);
    }

    // Insight 3: High-spend region with comparatively weak CTR
    const weakRegion = needsAttentionList[0];
    if (weakRegion) {
      list.push(`${weakRegion.region} has significant spend but comparatively low CTR (${formatPercentage(weakRegion.ctr)}) and may need optimization.`);
    } else if (bestRegion) {
      list.push(`All high-spend regions are maintaining healthy performance across campaigns.`);
    }

    return list;
  }, [aggregatedRegions, bestRegion, needsAttentionList, totalSpend, currency]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Meta Places / Geographic Metrics"
        subtitle="Geographic delivery, reach, and regional performance breakdown"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />

            {/* Optional Country Selector if multiple countries exist */}
            {distinctCountries.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                  Country:
                </span>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    style={{
                      height: "36px",
                      padding: "0 28px 0 10px",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      border: countryFilter !== "all" ? "1px solid #0A84FF" : "1px solid #E5E7EB",
                      color: countryFilter !== "all" ? "#0A84FF" : "#0F172A",
                      fontSize: "13px",
                      fontWeight: countryFilter !== "all" ? "600" : "500",
                      outline: "none",
                      cursor: "pointer",
                      boxShadow: countryFilter !== "all" ? "0 0 0 2px rgba(10, 132, 255, 0.12)" : "0 1px 2px rgba(15, 23, 42, 0.03)",
                      transition: "all 0.15s ease",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                  >
                    <option value="all">All Countries</option>
                    {distinctCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: countryFilter !== "all" ? "#0A84FF" : "#64748B", pointerEvents: "none" }} />
                </div>
              </div>
            )}
          </div>
        }
      />

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="meta-places" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>

          {/* Skeleton Top 5 Overview */}
          <Skeleton height="200px" />

          {/* Skeleton Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            <Skeleton height="280px" />
            <Skeleton height="280px" />
          </div>

          <Skeleton height="240px" />
          <Skeleton height="320px" />
        </div>
      ) : error ? (
        <ErrorState message="Unable to load geographic data" onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Geographic Data Found" description="No location metrics were returned for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No location records match your selected spend or country filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSpendFilter("all");
                setCountryFilter("all");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <>
          {/* 1. GEOGRAPHIC SUMMARY KPI CARDS */}
          <PlacesKpiCards
            totalSpend={totalSpend}
            totalReach={totalReach}
            totalImpressions={totalImpressions}
            totalClicks={totalClicks}
            currency={currency}
          />

          {/* 2. TOP 5 REGIONS OVERVIEW */}
          <PlacesTopRegionsOverview
            regionsData={aggregatedRegions}
            currency={currency}
          />

          {/* 3. REGIONAL SPEND & PERFORMANCE CHARTS */}
          <PlacesRegionalCharts
            regionsData={aggregatedRegions}
            currency={currency}
          />

          {/* 4. INSIGHTS, BEST REGION & EFFICIENCY HIGHLIGHTS */}
          <PlacesInsightsAndHighlights
            bestRegion={bestRegion}
            efficientRegion={efficientRegion}
            insights={insights}
            topRegionsList={topRegionsList}
            needsAttentionList={needsAttentionList}
            currency={currency}
          />

          {/* 5. DETAILED GEOGRAPHIC TABLE */}
          <PlacesDetailedTable
            data={aggregatedRegions}
            currency={currency}
          />
        </>
      )}
    </div>
  );
};

export default Places;
