import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAudience } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import CustomizeFieldsModal from "../components/CustomizeFieldsModal.jsx";
import AudienceKpiCards from "../components/AudienceKpiCards.jsx";
import AudienceGenderDistribution from "../components/AudienceGenderDistribution.jsx";
import AudienceAgePerformance from "../components/AudienceAgePerformance.jsx";
import AudienceHeatmapAndInsights from "../components/AudienceHeatmapAndInsights.jsx";
import AudienceTablesSection from "../components/AudienceTablesSection.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import {
  loadSavedAudienceMetricPreferences,
  getAudienceMetricConfig,
  calculateAggregatedCpr,
  calculateAggregatedRoas,
} from "../../../config/audienceMetrics.js";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Audience Component (Meta Audience Demographics).
 * Configurable Business Analytics Workspace with Centralized Field Customization.
 */
export const Audience = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Spend Filter & Metric Customization State
  const [spendFilter, setSpendFilter] = useState("all");
  const [activeMetricKeys, setActiveMetricKeys] = useState(() => loadSavedAudienceMetricPreferences());

  // Derived Active Metric Configuration Array
  const enabledMetrics = useMemo(() => {
    return activeMetricKeys.map((key) => getAudienceMetricConfig(key)).filter(Boolean);
  }, [activeMetricKeys]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAudience(dateParams);
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

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      return spendFilter === "all" || numericSpend >= Number(spendFilter);
    });
  }, [data, spendFilter]);

  // Detect currency from payload
  const currency = useMemo(() => {
    const found = filteredData.find((r) => r.currency);
    return found ? found.currency : "INR";
  }, [filteredData]);

  // Aggregated Total Summary Metrics
  const {
    totalReach,
    totalImpressions,
    totalClicks,
    totalSpend,
    totalPurchases,
    totalRevenue,
    maleSpend,
    femaleSpend,
    maleRevenue,
    femaleRevenue,
    maleReach,
    femaleReach,
  } = useMemo(() => {
    let reachSum = 0;
    let imprSum = 0;
    let clickSum = 0;
    let spendSum = 0;
    let purSum = 0;
    let revSum = 0;

    let mSpend = 0;
    let fSpend = 0;
    let mRev = 0;
    let fRev = 0;
    let mReach = 0;
    let fReach = 0;

    filteredData.forEach((row) => {
      const r = Number(row.reach || 0);
      const impr = Number(row.impressions || 0);
      const clk = Number(row.clicks || 0);
      const s = Number(row.spend || 0);
      const p = Number(row.purchases || 0);
      const rev = Number(row.purchase_conversion_value || row.revenue || 0);

      const gender = String(row.gender || "").toLowerCase().trim();

      reachSum += r;
      imprSum += impr;
      clickSum += clk;
      spendSum += s;
      purSum += p;
      revSum += rev;

      if (gender === "male") {
        mSpend += s;
        mRev += rev;
        mReach += r;
      } else if (gender === "female") {
        fSpend += s;
        fRev += rev;
        fReach += r;
      }
    });

    return {
      totalReach: reachSum,
      totalImpressions: imprSum,
      totalClicks: clickSum,
      totalSpend: spendSum,
      totalPurchases: purSum,
      totalRevenue: revSum,
      maleSpend: mSpend,
      femaleSpend: fSpend,
      maleRevenue: mRev,
      femaleRevenue: fRev,
      maleReach: mReach,
      femaleReach: fReach,
    };
  }, [filteredData]);

  // Normalized Matrix Data
  const matrixData = useMemo(() => {
    return filteredData.map((row) => {
      const spend = Number(row.spend || 0);
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const purchases = Number(row.purchases || 0);
      const revenue = Number(row.purchase_conversion_value || row.revenue || 0);
      const atc = Number(row.actions_add_to_cart || row.add_to_cart || 0);
      const ic = Number(row.actions_initiate_checkout || row.initiate_checkout || 0);

      return {
        age: String(row.age || "Unknown").trim(),
        gender: String(row.gender || "unknown").toLowerCase().trim(),
        spend,
        impressions,
        reach: Number(row.reach || 0),
        clicks,
        ctr: Number(row.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0)),
        cpc: Number(row.cpc || (clicks > 0 ? spend / clicks : 0)),
        add_to_cart: atc,
        initiate_checkout: ic,
        purchases,
        revenue,
        cpr: calculateAggregatedCpr(spend, purchases),
        roas: calculateAggregatedRoas(revenue, spend),
      };
    });
  }, [filteredData]);

  // Best ROAS Segment calculation
  const bestRoasSegment = useMemo(() => {
    if (matrixData.length === 0) return null;
    const validRoasRows = matrixData.filter((r) => r.roas !== null && r.roas > 0);
    if (validRoasRows.length === 0) return null;
    const sorted = [...validRoasRows].sort((a, b) => b.roas - a.roas);
    return sorted[0];
  }, [matrixData]);

  // Aggregated Gender Summary Data
  const genderSummary = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const g = String(row.gender || "unknown").toLowerCase().trim();
      if (!map[g]) {
        map[g] = { gender: g, spend: 0, reach: 0, impressions: 0, clicks: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 };
      }
      map[g].spend += Number(row.spend || 0);
      map[g].reach += Number(row.reach || 0);
      map[g].impressions += Number(row.impressions || 0);
      map[g].clicks += Number(row.clicks || 0);
      map[g].add_to_cart += Number(row.actions_add_to_cart || row.add_to_cart || 0);
      map[g].initiate_checkout += Number(row.actions_initiate_checkout || row.initiate_checkout || 0);
      map[g].purchases += Number(row.purchases || 0);
      map[g].revenue += Number(row.purchase_conversion_value || row.revenue || 0);
    });

    return Object.values(map).map((g) => ({
      ...g,
      ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
      cpc: g.clicks > 0 ? g.spend / g.clicks : 0,
      cpr: calculateAggregatedCpr(g.spend, g.purchases),
      roas: calculateAggregatedRoas(g.revenue, g.spend),
    }));
  }, [filteredData]);

  // Aggregated Age Group Summary Data (Combines Male + Female + Unknown per age group)
  const ageGroupSummary = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const age = String(row.age || "Unknown").trim();
      if (!map[age]) {
        map[age] = { age, spend: 0, reach: 0, impressions: 0, clicks: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 };
      }
      map[age].spend += Number(row.spend || 0);
      map[age].reach += Number(row.reach || 0);
      map[age].impressions += Number(row.impressions || 0);
      map[age].clicks += Number(row.clicks || 0);
      map[age].add_to_cart += Number(row.actions_add_to_cart || row.add_to_cart || 0);
      map[age].initiate_checkout += Number(row.actions_initiate_checkout || row.initiate_checkout || 0);
      map[age].purchases += Number(row.purchases || 0);
      map[age].revenue += Number(row.purchase_conversion_value || row.revenue || 0);
    });

    const ageOrder = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];

    return Object.values(map)
      .map((item) => ({
        ...item,
        ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
        cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
        cpr: calculateAggregatedCpr(item.spend, item.purchases),
        roas: calculateAggregatedRoas(item.revenue, item.spend),
      }))
      .sort((a, b) => {
        const idxA = ageOrder.indexOf(a.age);
        const idxB = ageOrder.indexOf(b.age);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.age.localeCompare(b.age);
      });
  }, [filteredData]);

  // Top Performing Segment (highest Spend across age + gender segments)
  const topSegment = useMemo(() => {
    if (matrixData.length === 0) return null;

    // Group by age + gender segment to calculate total segment metrics
    const segmentMap = new Map();

    matrixData.forEach((r) => {
      const key = `${r.age}__${r.gender}`;
      if (!segmentMap.has(key)) {
        segmentMap.set(key, {
          age: r.age,
          gender: r.gender,
          spend: 0,
          revenue: 0,
          clicks: 0,
          reach: 0,
          purchases: 0,
          impressions: 0,
          firstIndex: segmentMap.size,
        });
      }
      const item = segmentMap.get(key);
      item.spend += Number(r.spend || 0);
      item.revenue += Number(r.revenue || 0);
      item.clicks += Number(r.clicks || 0);
      item.reach += Number(r.reach || 0);
      item.purchases += Number(r.purchases || 0);
      item.impressions += Number(r.impressions || 0);
    });

    const segments = Array.from(segmentMap.values()).map((s) => ({
      ...s,
      roas: calculateAggregatedRoas(s.revenue, s.spend),
      ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
    }));

    // Stable sort by Spend descending. If spend is tied, use existing data ordering as tie-breaker.
    segments.sort((a, b) => {
      const diff = b.spend - a.spend;
      if (diff !== 0) return diff;
      return a.firstIndex - b.firstIndex;
    });

    return segments[0] || null;
  }, [matrixData]);

  // Dynamic Insights
  const insights = useMemo(() => {
    if (filteredData.length === 0) return [];
    const list = [];

    if (ageGroupSummary.length > 0) {
      const topAgeBySpend = [...ageGroupSummary].sort((a, b) => b.spend - a.spend)[0];
      if (topAgeBySpend && totalSpend > 0) {
        const pct = ((topAgeBySpend.spend / totalSpend) * 100).toFixed(0);
        list.push(`Age group ${topAgeBySpend.age} accounts for ${pct}% of total demographic spend.`);
      }
    }

    if (ageGroupSummary.length > 0) {
      const validRoasAges = ageGroupSummary.filter((a) => a.roas !== null && a.roas > 0);
      if (validRoasAges.length > 0) {
        const topRoasAge = [...validRoasAges].sort((a, b) => b.roas - a.roas)[0];
        list.push(`Age group ${topRoasAge.age} achieved the best ROAS at ${topRoasAge.roas.toFixed(2)}x.`);
      }
    }

    if (ageGroupSummary.length > 0) {
      const validCprAges = ageGroupSummary.filter((a) => a.cpr !== null && a.cpr > 0);
      if (validCprAges.length > 0) {
        const topCprAge = [...validCprAges].sort((a, b) => a.cpr - b.cpr)[0];
        list.push(`Age group ${topCprAge.age} achieved the lowest Cost per Result at ${formatCurrency(topCprAge.cpr, currency)}.`);
      }
    }

    if (topSegment && topSegment.ctr > 0) {
      list.push(`${topSegment.gender.toUpperCase()} ${topSegment.age} achieved the highest CTR at ${formatPercentage(topSegment.ctr)}.`);
    }

    if (totalReach > 0) {
      if (maleReach > femaleReach) {
        const pct = ((maleReach / totalReach) * 100).toFixed(0);
        list.push(`Male audience represents ${pct}% of total audience reach.`);
      } else if (femaleReach > maleReach) {
        const pct = ((femaleReach / totalReach) * 100).toFixed(0);
        list.push(`Female audience represents ${pct}% of total audience reach.`);
      }
    }

    return list;
  }, [filteredData, ageGroupSummary, topSegment, totalSpend, totalReach, maleReach, femaleReach, currency]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Meta Audience Demographics"
        subtitle="Demographic audience breakdown by age group, gender, spend, and conversion funnel metrics"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            <CustomizeFieldsModal activeMetricKeys={activeMetricKeys} onChange={setActiveMetricKeys} />
          </div>
        }
      />

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="meta-audience" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <Skeleton height="280px" />
            <Skeleton height="280px" />
          </div>

          <Skeleton height="240px" />
          <Skeleton height="320px" />
        </div>
      ) : error ? (
        <ErrorState message="Unable to load audience data" onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Audience Demographics Found" description="No demographic data was returned for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No demographic records match your selected spend filter."
          action={
            <Button variant="outline" onClick={() => setSpendFilter("all")}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <>
          {/* 1. AUDIENCE INSIGHT KPI CARDS (DEDICATED DOMAIN INSIGHTS) */}
          <AudienceKpiCards
            maleSpend={maleSpend}
            femaleSpend={femaleSpend}
            maleRevenue={maleRevenue}
            femaleRevenue={femaleRevenue}
            bestRoasSegment={bestRoasSegment}
            currency={currency}
          />

          {/* 2. DYNAMIC GENDER DISTRIBUTION & COMPARISON */}
          <AudienceGenderDistribution
            genderData={genderSummary}
            enabledMetrics={enabledMetrics}
            currency={currency}
          />

          {/* 3. DYNAMIC AGE GROUP PERFORMANCE */}
          <AudienceAgePerformance
            ageGroupData={ageGroupSummary}
            enabledMetrics={enabledMetrics}
            currency={currency}
          />

          {/* 4. DYNAMIC HEATMAP & INSIGHTS */}
          <AudienceHeatmapAndInsights
            matrixData={matrixData}
            enabledMetrics={enabledMetrics}
            topSegment={topSegment}
            insights={insights}
            currency={currency}
          />

          {/* 5. DYNAMIC TABULAR SECTIONS */}
          <AudienceTablesSection
            ageGroupSummary={ageGroupSummary}
            detailedData={filteredData}
            enabledMetrics={enabledMetrics}
            currency={currency}
          />
        </>
      )}
    </div>
  );
};

export default Audience;
