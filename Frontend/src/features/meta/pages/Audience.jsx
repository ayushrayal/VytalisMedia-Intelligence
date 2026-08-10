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
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Audience Component (Meta Audience Demographics).
 * Transformed into a premium analytics dashboard with:
 * - Summary KPI cards
 * - Gender distribution donut chart & bar comparison
 * - Age group performance bar visualization
 * - Demographic heatmap & rule-based insights
 * - Age group summary table
 * - Detailed demographics table with frontend sorting
 */
export const Audience = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const { totalReach, totalSpend, maleReach, femaleReach } = useMemo(() => {
    let reachSum = 0;
    let spendSum = 0;
    let mReach = 0;
    let fReach = 0;

    filteredData.forEach((row) => {
      const r = Number(row.reach || 0);
      const s = Number(row.spend || 0);
      const gender = String(row.gender || "").toLowerCase().trim();

      reachSum += r;
      spendSum += s;

      if (gender === "male") mReach += r;
      else if (gender === "female") fReach += r;
    });

    return {
      totalReach: reachSum,
      totalSpend: spendSum,
      maleReach: mReach,
      femaleReach: fReach,
    };
  }, [filteredData]);

  // Aggregated Gender Summary Data
  const genderSummary = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const g = String(row.gender || "unknown").toLowerCase().trim();
      if (!map[g]) {
        map[g] = { gender: g, spend: 0, reach: 0, impressions: 0, clicks: 0 };
      }
      map[g].spend += Number(row.spend || 0);
      map[g].reach += Number(row.reach || 0);
      map[g].impressions += Number(row.impressions || 0);
      map[g].clicks += Number(row.clicks || 0);
    });

    return Object.values(map).map((g) => ({
      ...g,
      ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
      cpc: g.clicks > 0 ? g.spend / g.clicks : 0,
    }));
  }, [filteredData]);

  // Aggregated Age Group Summary Data
  const ageGroupSummary = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const age = String(row.age || "Unknown").trim();
      if (!map[age]) {
        map[age] = { age, spend: 0, reach: 0, impressions: 0, clicks: 0 };
      }
      map[age].spend += Number(row.spend || 0);
      map[age].reach += Number(row.reach || 0);
      map[age].impressions += Number(row.impressions || 0);
      map[age].clicks += Number(row.clicks || 0);
    });

    const ageOrder = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Unknown"];

    return Object.values(map)
      .map((item) => ({
        ...item,
        ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
        cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
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

  // Normalized Matrix Data (Age x Gender)
  const matrixData = useMemo(() => {
    return filteredData.map((row) => ({
      age: String(row.age || "Unknown").trim(),
      gender: String(row.gender || "unknown").toLowerCase().trim(),
      spend: Number(row.spend || 0),
      impressions: Number(row.impressions || 0),
      reach: Number(row.reach || 0),
      clicks: Number(row.clicks || 0),
      ctr: Number(row.ctr || (row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0)),
      cpc: Number(row.cpc || (row.clicks > 0 ? row.spend / row.clicks : 0)),
    }));
  }, [filteredData]);

  // Top Performing Segment (highest CTR with min clicks/impressions)
  const topSegment = useMemo(() => {
    if (matrixData.length === 0) return null;
    const sorted = [...matrixData].sort((a, b) => (b.ctr || 0) - (a.ctr || 0));
    return sorted[0] || null;
  }, [matrixData]);

  // Rule-based Insights generated strictly from payload data
  const insights = useMemo(() => {
    if (filteredData.length === 0) return [];
    const list = [];

    // 1. Spend Dominance by Age
    if (ageGroupSummary.length > 0) {
      const topAgeBySpend = [...ageGroupSummary].sort((a, b) => b.spend - a.spend)[0];
      if (topAgeBySpend && totalSpend > 0) {
        const pct = ((topAgeBySpend.spend / totalSpend) * 100).toFixed(0);
        list.push(`Age group ${topAgeBySpend.age} accounts for ${pct}% of total demographic spend.`);
      }
    }

    // 2. Highest CTR Segment
    if (topSegment && topSegment.ctr > 0) {
      list.push(`${topSegment.gender.toUpperCase()} ${topSegment.age} achieved the highest CTR at ${formatPercentage(topSegment.ctr)}.`);
    }

    // 3. Highest Clicks Segment
    const topClickSegment = [...matrixData].sort((a, b) => b.clicks - a.clicks)[0];
    if (topClickSegment && topClickSegment.clicks > 0) {
      list.push(`${topClickSegment.gender.toUpperCase()} ${topClickSegment.age} generated the highest click volume (${topClickSegment.clicks.toLocaleString()} clicks).`);
    }

    // 4. Gender Reach Dominance
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
  }, [filteredData, ageGroupSummary, matrixData, topSegment, totalSpend, totalReach, maleReach, femaleReach]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Meta Audience Demographics"
        subtitle="Demographic audience breakdown by age group and gender"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Skeleton KPI Grid */}
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
            totalReach={totalReach}
            totalSpend={totalSpend}
            maleReach={maleReach}
            femaleReach={femaleReach}
            topSegment={topSegment}
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
