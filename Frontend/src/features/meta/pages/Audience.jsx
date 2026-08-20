import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAudience } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
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
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Audience Component (Meta Audience Demographics).
 * Complete Business Analytics Workspace focusing on:
 * Spend, Add to Cart, Checkout Initiated, Purchases, Cost per Result, Revenue, and ROAS.
 */
export const Audience = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Spend Filter State
  const [spendFilter, setSpendFilter] = useState("all");

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

  // Total Metrics & Gender Breakdown
  const {
    totalReach,
    totalSpend,
    maleSpend,
    femaleSpend,
    maleRevenue,
    femaleRevenue,
    maleReach,
    femaleReach,
  } = useMemo(() => {
    let reachSum = 0;
    let spendSum = 0;
    let mSpend = 0;
    let fSpend = 0;
    let mRev = 0;
    let fRev = 0;
    let mReach = 0;
    let fReach = 0;

    filteredData.forEach((row) => {
      const r = Number(row.reach || 0);
      const s = Number(row.spend || 0);
      const rev = Number(row.purchase_conversion_value || row.revenue || 0);
      const gender = String(row.gender || "").toLowerCase().trim();

      reachSum += r;
      spendSum += s;

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
      totalSpend: spendSum,
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
        cpr: purchases > 0 ? spend / purchases : null,
        roas: spend > 0 ? revenue / spend : null,
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
      cpr: g.purchases > 0 ? g.spend / g.purchases : null,
      roas: g.spend > 0 ? g.revenue / g.spend : null,
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
        cpr: item.purchases > 0 ? item.spend / item.purchases : null,
        roas: item.spend > 0 ? item.revenue / item.spend : null,
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

  // Top Performing Segment (highest CTR)
  const topSegment = useMemo(() => {
    if (matrixData.length === 0) return null;
    const sorted = [...matrixData].sort((a, b) => (b.ctr || 0) - (a.ctr || 0));
    return sorted[0] || null;
  }, [matrixData]);

  // Rule-based Insights generated strictly from current payload data
  const insights = useMemo(() => {
    if (filteredData.length === 0) return [];
    const list = [];

    // 1. Spend Dominance by Age Group
    if (ageGroupSummary.length > 0) {
      const topAgeBySpend = [...ageGroupSummary].sort((a, b) => b.spend - a.spend)[0];
      if (topAgeBySpend && totalSpend > 0) {
        const pct = ((topAgeBySpend.spend / totalSpend) * 100).toFixed(0);
        list.push(`Age group ${topAgeBySpend.age} accounts for ${pct}% of total demographic spend.`);
      }
    }

    // 2. Best ROAS Age Group
    if (ageGroupSummary.length > 0) {
      const validRoasAges = ageGroupSummary.filter((a) => a.roas !== null && a.roas > 0);
      if (validRoasAges.length > 0) {
        const topRoasAge = [...validRoasAges].sort((a, b) => b.roas - a.roas)[0];
        list.push(`Age group ${topRoasAge.age} achieved the best ROAS at ${topRoasAge.roas.toFixed(2)}x.`);
      }
    }

    // 3. Lowest Cost per Result Age Group
    if (ageGroupSummary.length > 0) {
      const validCprAges = ageGroupSummary.filter((a) => a.cpr !== null && a.cpr > 0);
      if (validCprAges.length > 0) {
        const topCprAge = [...validCprAges].sort((a, b) => a.cpr - b.cpr)[0];
        list.push(`Age group ${topCprAge.age} achieved the lowest Cost per Result at ${formatCurrency(topCprAge.cpr, currency)}.`);
      }
    }

    // 4. Highest CTR Segment
    if (topSegment && topSegment.ctr > 0) {
      list.push(`${topSegment.gender.toUpperCase()} ${topSegment.age} achieved the highest CTR at ${formatPercentage(topSegment.ctr)}.`);
    }

    // 5. Gender Reach Dominance
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

          {/* Skeleton Visualizations */}
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
          {/* 1. AUDIENCE SUMMARY KPI CARDS */}
          <AudienceKpiCards
            maleSpend={maleSpend}
            femaleSpend={femaleSpend}
            maleRevenue={maleRevenue}
            femaleRevenue={femaleRevenue}
            bestRoasSegment={bestRoasSegment}
            currency={currency}
          />

          {/* 2. GENDER DISTRIBUTION & COMPARISON */}
          <AudienceGenderDistribution
            genderData={genderSummary}
            currency={currency}
          />

          {/* 3. AGE GROUP PERFORMANCE */}
          <AudienceAgePerformance
            ageGroupData={ageGroupSummary}
            currency={currency}
          />

          {/* 4. AGE + GENDER HEATMAP & INSIGHTS */}
          <AudienceHeatmapAndInsights
            matrixData={matrixData}
            topSegment={topSegment}
            insights={insights}
            currency={currency}
          />

          {/* 5. AGE GROUP SUMMARY & DETAILED TABLES */}
          <AudienceTablesSection
            ageGroupSummary={ageGroupSummary}
            detailedData={filteredData}
            currency={currency}
          />
        </>
      )}
    </div>
  );
};

export default Audience;
