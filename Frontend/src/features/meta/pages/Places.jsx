import React, { useState, useEffect, useCallback, useMemo } from "react";
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

  // Best Performing Region (Highest CTR)
  const bestRegion = useMemo(() => {
    if (aggregatedRegions.length === 0) return null;
    const sorted = [...aggregatedRegions].sort((a, b) => b.ctr - a.ctr);
    return sorted[0] || null;
  }, [aggregatedRegions]);

  // Most Efficient Region (Lowest CPC with min traffic threshold)
  const efficientRegion = useMemo(() => {
    if (aggregatedRegions.length === 0) return null;
    // Filter regions with clicks >= 5 or fallback to clicks > 0
    let candidates = aggregatedRegions.filter((r) => r.clicks >= 5 && r.cpc > 0);
    if (candidates.length === 0) {
      candidates = aggregatedRegions.filter((r) => r.clicks > 0 && r.cpc > 0);
    }
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => a.cpc - b.cpc)[0];
  }, [aggregatedRegions]);

  // Top Performing Regions List (Top 3 by CTR)
  const topRegionsList = useMemo(() => {
    return [...aggregatedRegions].sort((a, b) => b.ctr - a.ctr).slice(0, 3);
  }, [aggregatedRegions]);

  // Needs Attention Regions (Significant spend but CTR < overall average)
  const needsAttentionList = useMemo(() => {
    if (aggregatedRegions.length === 0) return [];
    const sortedBySpend = [...aggregatedRegions].sort((a, b) => b.spend - a.spend);
    const medianSpend = sortedBySpend[Math.floor(sortedBySpend.length / 2)]?.spend || 0;

    return aggregatedRegions
      .filter((r) => r.spend >= Math.max(10, medianSpend) && r.ctr < (overallCtr > 0 ? overallCtr : 1.5))
      .sort((a, b) => a.ctr - b.ctr)
      .slice(0, 3);
  }, [aggregatedRegions, overallCtr]);

  // Dynamic Rule-based Insights generated strictly from payload data
  const insights = useMemo(() => {
    if (aggregatedRegions.length === 0) return [];
    const list = [];

    // 1. Largest Spend Share
    const topSpendRegion = [...aggregatedRegions].sort((a, b) => b.spend - a.spend)[0];
    if (topSpendRegion && totalSpend > 0) {
      const pct = ((topSpendRegion.spend / totalSpend) * 100).toFixed(0);
      list.push(`${topSpendRegion.region} accounts for the largest share of regional spend (${pct}% of total spend).`);
    }

    // 2. Highest CTR Region
    if (bestRegion && bestRegion.ctr > 0) {
      list.push(`${bestRegion.region} achieved the strongest CTR (${formatPercentage(bestRegion.ctr)}) among regional targets.`);
    }

    // 3. Most Efficient Reach / CPC
    if (efficientRegion && efficientRegion.cpc > 0) {
      list.push(`${efficientRegion.region} generated ${formatNumber(efficientRegion.reach)} reach while maintaining an efficient CPC of ${formatCurrency(efficientRegion.cpc, currency)}.`);
    }

    return list;
  }, [aggregatedRegions, bestRegion, efficientRegion, totalSpend, currency]);

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
              <Select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Countries" },
                  ...distinctCountries.map((c) => ({ value: c, label: c })),
                ]}
              />
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
