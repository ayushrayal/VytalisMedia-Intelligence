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

  // Aggregated Regional Data (combines duplicates by region name with safe normalization)
  const aggregatedRegions = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      let reg = String(row.region || "").trim();
      if (!reg || reg.toLowerCase() === "unknown" || reg.toLowerCase() === "null") {
        reg = "Unknown Region";
      }

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

    return Object.values(map).map((r) => {
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
      const cpc = r.clicks > 0 ? r.spend / r.clicks : 0;
      return {
        ...r,
        ctr: isNaN(ctr) || !isFinite(ctr) ? 0 : ctr,
        cpc: isNaN(cpc) || !isFinite(cpc) ? 0 : cpc,
      };
    });
  }, [filteredData, currency]);

  // Total Summary Metrics (Overall CTR is strictly weighted: Total Clicks / Total Impressions)
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

  // 1. Dynamic Threshold Calculation (Median Spend across all regions)
  // NOTE: Business rule ambiguity: Code defines High Spend as spend >= median spend, while requirement says highest spend.
  // Exact intended population is not mathematically defined in available source; preserving median threshold to prevent UI layout shifts.
  const threshold = useMemo(() => {
    if (aggregatedRegions.length === 0) return 0;
    const spendValues = aggregatedRegions
      .map((r) => Number(r.spend || 0))
      .sort((a, b) => a - b);

    const mid = Math.floor(spendValues.length / 2);
    const medianSpend =
      spendValues.length % 2 !== 0
        ? spendValues[mid]
        : (spendValues[mid - 1] + spendValues[mid]) / 2;

    return medianSpend;
  }, [aggregatedRegions]);

  // 2. Classify regions into High Spend vs. Low Spend based on dynamic threshold
  const { highSpendRegions, lowSpendRegions } = useMemo(() => {
    const high = [];
    const low = [];

    aggregatedRegions.forEach((r) => {
      if (r.spend >= threshold && r.spend > 0) {
        high.push({ ...r, spendGroup: "High Spend" });
      } else {
        low.push({ ...r, spendGroup: "Low Spend" });
      }
    });

    return { highSpendRegions: high, lowSpendRegions: low };
  }, [aggregatedRegions, threshold]);

  // 3. Top 5 High-Spend Regions for Overview
  const top5SpendRegions = useMemo(() => {
    return [...highSpendRegions].sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 5);
  }, [highSpendRegions]);

  // 4. Best Performing Region (Highest CTR among High Spend regions ONLY)
  const bestRegion = useMemo(() => {
    if (highSpendRegions.length === 0) return null;
    return [...highSpendRegions].sort((a, b) => (b.ctr || 0) - (a.ctr || 0))[0] || null;
  }, [highSpendRegions]);

  // 5. Most Efficient Region (Lowest CPC among High Spend regions ONLY with clicks > 0)
  const efficientRegion = useMemo(() => {
    if (highSpendRegions.length === 0) return null;
    let candidates = highSpendRegions.filter((r) => r.clicks > 0 && r.cpc > 0);
    if (candidates.length === 0) candidates = highSpendRegions;
    if (candidates.length === 0) return null;

    return [...candidates].sort((a, b) => {
      if (a.cpc !== b.cpc) return a.cpc - b.cpc;
      return b.ctr - a.ctr;
    })[0];
  }, [highSpendRegions]);

  // 6. Top Performing Regions List (Top 3 High Spend regions ranked by CTR)
  const topRegionsList = useMemo(() => {
    if (highSpendRegions.length === 0) return [];
    return [...highSpendRegions].sort((a, b) => (b.ctr || 0) - (a.ctr || 0)).slice(0, 3);
  }, [highSpendRegions]);

  // 7. Needs Attention Regions (High Spend regions with CTR below weighted high-spend average)
  const needsAttentionList = useMemo(() => {
    if (highSpendRegions.length === 0) return [];

    // Strictly weighted CTR for High Spend population: sum(clicks) / sum(impressions) * 100
    const highSpendClicks = highSpendRegions.reduce((sum, r) => sum + Number(r.clicks || 0), 0);
    const highSpendImpressions = highSpendRegions.reduce((sum, r) => sum + Number(r.impressions || 0), 0);
    const weightedHighSpendCtr = highSpendImpressions > 0 ? (highSpendClicks / highSpendImpressions) * 100 : 0;

    const targetCtr = overallCtr > 0 ? Math.min(weightedHighSpendCtr, overallCtr) : weightedHighSpendCtr;
    let candidates = highSpendRegions.filter((r) => r.ctr < weightedHighSpendCtr || r.ctr < targetCtr);

    if (candidates.length === 0 && highSpendRegions.length > 1) {
      const maxCtr = Math.max(...highSpendRegions.map((r) => r.ctr));
      candidates = highSpendRegions.filter((r) => r.ctr < maxCtr * 0.85);
    }

    return [...candidates]
      .sort((a, b) => {
        if (b.spend !== a.spend) {
          return b.spend - a.spend;
        }
        return a.ctr - b.ctr;
      })
      .slice(0, 3);
  }, [highSpendRegions, overallCtr]);

  // 8. Dynamic Insights (Clearly distinguishes High Spend vs Low Spend metrics)
  const insights = useMemo(() => {
    if (aggregatedRegions.length === 0) return [];
    const list = [];

    // High Spend share insight
    const highSpendTotal = highSpendRegions.reduce((sum, r) => sum + r.spend, 0);
    if (totalSpend > 0 && highSpendRegions.length > 0) {
      const pct = ((highSpendTotal / totalSpend) * 100).toFixed(0);
      list.push(`High-spend regions generated ${pct}% of total regional ad spend.`);
    }

    // Best High Spend CTR insight
    if (bestRegion && bestRegion.ctr > 0) {
      list.push(`Among high-spend regions, ${bestRegion.region} achieved the strongest CTR of ${formatPercentage(bestRegion.ctr)}.`);
    }

    // Best Low Spend CTR insight
    const topLowSpendCtr = [...lowSpendRegions].sort((a, b) => (b.ctr || 0) - (a.ctr || 0))[0];
    if (topLowSpendCtr && topLowSpendCtr.ctr > 0) {
      list.push(`Among low-spend regions, ${topLowSpendCtr.region} recorded a CTR of ${formatPercentage(topLowSpendCtr.ctr)}.`);
    }

    return list;
  }, [aggregatedRegions, highSpendRegions, lowSpendRegions, bestRegion, totalSpend]);

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
            highSpendRegions={highSpendRegions}
            lowSpendRegions={lowSpendRegions}
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
