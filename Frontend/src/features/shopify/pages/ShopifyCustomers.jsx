import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { getShopifyCustomers, getShopifyCohorts } from "../services/shopify.api.js";
import useEffectivePermissions from "../../../hooks/useEffectivePermissions.js";
import { PERMISSION_KEYS } from "../../../config/permission-registry.js";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import DateFilter from "../../meta/components/DateFilter.jsx";
import ShopifyAccountSwitcher from "../components/ShopifyAccountSwitcher.jsx";
import ShopifyLockedState from "../components/ShopifyLockedState.jsx";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getErrorMessage } from "../../../utils/error.js";
import { calculateShopifyCustomerMetrics } from "../utils/shopify-calculator.jsx";
import {
  Users,
  UserPlus,
  UserCheck,
  Filter,
  Repeat,
  Crown,
  Grid,
  Calendar,
  Sparkles,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import rupeeImg from "../../../assets/rupee.png";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyCustomers = () => {
  // Main View Mode: "directory" | "cohorts"
  const [viewMode, setViewMode] = useState("directory");

  // Permissions & Outlet Context
  const outletContext = useOutletContext() || {};
  const user = outletContext.user || null;
  const { hasPermission } = useEffectivePermissions(user);
  const canViewCohorts = hasPermission(PERMISSION_KEYS.SHOPIFY_COHORTS);

  // If viewMode is cohorts but user lacks shopify.cohorts permission, fallback to directory
  useEffect(() => {
    if (viewMode === "cohorts" && !canViewCohorts) {
      setViewMode("directory");
    }
  }, [viewMode, canViewCohorts]);

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // ----------------------------------------------------
  // DIRECTORY VIEW STATE
  // ----------------------------------------------------
  const [customersData, setCustomersData] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const { isDisplayLoading: isCustomersDisplayLoading, handleComplete: handleCustomersComplete } = usePageLoading(customersLoading);
  const [customersError, setCustomersError] = useState(null);

  // Customer Filter State: "all" | "single" | "repeat" | "high_value"
  const [customerFilter, setCustomerFilter] = useState("all");

  // Directory Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ----------------------------------------------------
  // COHORTS VIEW STATE (P1G)
  // ----------------------------------------------------
  const [periodType, setPeriodType] = useState("monthly"); // "monthly" | "weekly"
  const [cohortPayload, setCohortPayload] = useState(null);
  const [cohortsLoading, setCohortsLoading] = useState(false);
  const { isDisplayLoading: isCohortsDisplayLoading, handleComplete: handleCohortsComplete } = usePageLoading(cohortsLoading);
  const [cohortsError, setCohortsError] = useState(null);

  const handleAccountsLoaded = useCallback(({ accounts }) => {
    if (accounts.length === 0) {
      setIsLocked(true);
      setCustomersLoading(false);
      setCohortsLoading(false);
    } else {
      setIsLocked(false);
    }
  }, []);

  // Fetch Directory Customers
  const fetchCustomersData = useCallback(async () => {
    if (isLocked) return;
    try {
      setCustomersLoading(true);
      setCustomersError(null);
      const res = await getShopifyCustomers(dateParams);
      if (res.data) {
        setCustomersData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setCustomersError(getErrorMessage(err));
    } finally {
      setCustomersLoading(false);
    }
  }, [dateParams, isLocked]);

  // Fetch Backend Aggregated Cohorts Data
  const fetchCohortsData = useCallback(async () => {
    if (isLocked) return;
    try {
      setCohortsLoading(true);
      setCohortsError(null);
      const res = await getShopifyCohorts({ periodType, ...dateParams });
      if (res.data) {
        setCohortPayload(res.data);
      } else {
        setCohortPayload(null);
      }
    } catch (err) {
      setCohortsError(getErrorMessage(err));
    } finally {
      setCohortsLoading(false);
    }
  }, [dateParams, periodType, isLocked]);

  useEffect(() => {
    if (viewMode === "directory") {
      fetchCustomersData();
    } else if (viewMode === "cohorts") {
      fetchCohortsData();
    }
  }, [viewMode, fetchCustomersData, fetchCohortsData]);

  // Reset pagination when date or customer filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams, customerFilter]);

  // Handle Account Change: Clear cohort state & refetch active view
  const handleAccountChanged = () => {
    setCohortPayload(null);
    if (viewMode === "directory") {
      fetchCustomersData();
    } else {
      fetchCohortsData();
    }
  };

  // Compute Canonical Customer Metrics for Directory
  const customerMetrics = useMemo(() => {
    return calculateShopifyCustomerMetrics(customersData);
  }, [customersData]);

  // Filtered Customers Dataset for Directory
  const filteredCustomers = useMemo(() => {
    if (customerFilter === "all") return customersData;

    return customersData.filter((c) => {
      const ordersCount = Number(c.customer_orders_count || 1);
      const totalSpent = Number(c.customer_total_spent || 0);

      if (customerFilter === "single") return ordersCount === 1;
      if (customerFilter === "repeat") return ordersCount >= 2;
      if (customerFilter === "high_value") {
        return customerMetrics.highValueThreshold > 0 && totalSpent >= customerMetrics.highValueThreshold && totalSpent > 0;
      }
      return true;
    });
  }, [customersData, customerFilter, customerMetrics.highValueThreshold]);

  // Paginated Directory Customers List
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Customers
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Customer spending, repeat purchase rates, customer retention matrix, and cohort analytics.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DateFilter onChange={(params) => setDateParams(params)} />
          <ShopifyAccountSwitcher onAccountChanged={handleAccountChanged} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {/* Main View Mode Selector Tabs: [Customer Directory] [Customer Cohort Analysis] */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setViewMode("directory")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: viewMode === "directory" ? "#0F172A" : "transparent",
            color: viewMode === "directory" ? "#FFFFFF" : "#64748B",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Users size={16} /> Customer Directory
        </button>
        {canViewCohorts && (
          <button
            type="button"
            onClick={() => setViewMode("cohorts")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: viewMode === "cohorts" ? "#0F172A" : "transparent",
              color: viewMode === "cohorts" ? "#FFFFFF" : "#64748B",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Grid size={16} /> Customer Cohort Analysis
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: CUSTOMER DIRECTORY */}
      {/* ==================================================================== */}
      {viewMode === "directory" && (
        <>
          {isCustomersDisplayLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <ContextualLoader isLoading={customersLoading} onComplete={handleCustomersComplete} section="shopify-customers" minHeight="auto" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <Skeleton height="110px" />
                <Skeleton height="110px" />
                <Skeleton height="110px" />
                <Skeleton height="110px" />
                <Skeleton height="110px" />
              </div>
              <Skeleton height="350px" />
            </div>
          ) : customersError ? (
            <ErrorState message={customersError} onRetry={fetchCustomersData} />
          ) : customersData.length === 0 ? (
            <EmptyState
              title="No Customer Records Found"
              description="No customer spending data was returned for the selected date range."
            />
          ) : (
            <>
              {/* Top KPI Cards (5 Cards) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <MetricCard
                  title="Total Customers"
                  value={formatNumber(customerMetrics.totalCustomers)}
                  icon={Users}
                  accentColor="#0F172A"
                  onClick={() => setCustomerFilter("all")}
                />
                <MetricCard
                  title="Single-Order Customers"
                  value={formatNumber(customerMetrics.singleOrderCustomers)}
                  subtitle="Customers with 1 order"
                  icon={UserPlus}
                  accentColor="#0A84FF"
                  onClick={() => setCustomerFilter("single")}
                />
                <MetricCard
                  title="Repeat Customers"
                  value={formatNumber(customerMetrics.repeatCustomers)}
                  subtitle="Customers with 2+ orders"
                  icon={UserCheck}
                  accentColor="#16A34A"
                  onClick={() => setCustomerFilter("repeat")}
                />
                <MetricCard
                  title="Repeat Purchase Rate"
                  value={`${customerMetrics.repeatPurchaseRate}%`}
                  subtitle={`${customerMetrics.repeatCustomers} of ${customerMetrics.totalCustomers} buyers`}
                  icon={Repeat}
                  accentColor="#8B5CF6"
                />
                <MetricCard
                  title="Returning Revenue"
                  value={formatCurrencyINR(customerMetrics.returningRevenue)}
                  subtitle="Revenue from 2+ order customers"
                  icon={RupeeIcon}
                  accentColor="#16A34A"
                />
              </div>

              {/* Customer Type Filter Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Filter size={15} color="#64748B" />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>Filter Segment:</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setCustomerFilter("all")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: customerFilter === "all" ? "#0F172A" : "#F1F5F9",
                        color: customerFilter === "all" ? "#FFFFFF" : "#475569",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      All ({customerMetrics.totalCustomers})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilter("single")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: customerFilter === "single" ? "#0A84FF" : "#F1F5F9",
                        color: customerFilter === "single" ? "#FFFFFF" : "#475569",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Single-Order ({customerMetrics.singleOrderCustomers})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilter("repeat")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: customerFilter === "repeat" ? "#16A34A" : "#F1F5F9",
                        color: customerFilter === "repeat" ? "#FFFFFF" : "#475569",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Repeat ({customerMetrics.repeatCustomers})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilter("high_value")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: customerFilter === "high_value" ? "#8B5CF6" : "#F1F5F9",
                        color: customerFilter === "high_value" ? "#FFFFFF" : "#475569",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Crown size={12} /> High-Value Top 10% ({customerMetrics.highValueCount})
                    </button>
                  </div>
                </div>

                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Showing {filteredCustomers.length} of {customerMetrics.totalCustomers} customers
                </span>
              </div>

              {/* Customers Table with Pagination */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 16px", width: "35%" }}>Customer Name</th>
                        <th style={{ padding: "12px 16px", width: "20%" }}>Segment</th>
                        <th style={{ padding: "12px 16px", width: "15%" }}>Orders Count</th>
                        <th style={{ padding: "12px 16px", width: "15%" }}>Calculated AOV</th>
                        <th style={{ padding: "12px 16px", width: "15%", textAlign: "right" }}>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCustomers.map((c, idx) => {
                        const name = `${c.customer_first_name || ""} ${c.customer_last_name || ""}`.trim() || "Customer";
                        const ordersCount = Number(c.customer_orders_count || 1);
                        const totalSpent = Number(c.customer_total_spent || 0);
                        const aov = ordersCount > 0 ? totalSpent / ordersCount : 0;
                        const isHighValue = customerMetrics.highValueThreshold > 0 && totalSpent >= customerMetrics.highValueThreshold && totalSpent > 0;
                        const isRepeat = ordersCount >= 2;

                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A" }}>
                              {name}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {isHighValue && (
                                  <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                    <Crown size={10} /> High-Value
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: isRepeat ? "rgba(22, 163, 74, 0.1)" : "rgba(10, 132, 255, 0.1)",
                                    color: isRepeat ? "#16A34A" : "#0A84FF",
                                  }}
                                >
                                  {isRepeat ? "Repeat Buyer" : "Single-Order"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                              {ordersCount}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#475569" }}>
                              {formatCurrencyINR(aov)}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", textAlign: "right" }}>
                              {formatCurrencyINR(totalSpent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Component */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: CUSTOMER COHORT ANALYSIS (P1G) */}
      {/* ==================================================================== */}
      {viewMode === "cohorts" && (
        <>
          {/* Controls: Period Selector & Historical Limitation Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "inline-flex", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "10px" }}>
              <button
                type="button"
                onClick={() => setPeriodType("monthly")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: periodType === "monthly" ? "#FFFFFF" : "transparent",
                  color: periodType === "monthly" ? "#0F172A" : "#64748B",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: periodType === "monthly" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Monthly Cohorts
              </button>
              <button
                type="button"
                onClick={() => setPeriodType("weekly")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: periodType === "weekly" ? "#FFFFFF" : "transparent",
                  color: periodType === "weekly" ? "#0F172A" : "#64748B",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: periodType === "weekly" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Weekly Cohorts
              </button>
            </div>
          </div>

          {/* Historical Data Limitation Notice Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "#475569",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <AlertCircle size={18} color="#0A84FF" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "#0F172A", fontWeight: "600" }}>Based on available Shopify history:</strong>{" "}
              Historical order data is available for approximately 90 days (~3 months / 12 weeks). Cohorts are grouped by earliest observed purchase date. Cohort periods that have not yet matured within the observation window display <em>Insufficient Historical Data</em>.
            </div>
          </div>

          {isCohortsDisplayLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <ContextualLoader isLoading={cohortsLoading} onComplete={handleCohortsComplete} section="shopify-cohorts" minHeight="auto" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <Skeleton height="100px" />
                <Skeleton height="100px" />
                <Skeleton height="100px" />
                <Skeleton height="100px" />
                <Skeleton height="100px" />
              </div>
              <Skeleton height="350px" />
            </div>
          ) : cohortsError ? (
            <ErrorState message={cohortsError} onRetry={fetchCohortsData} />
          ) : !cohortPayload || !cohortPayload.cohorts || cohortPayload.cohorts.length === 0 ? (
            <EmptyState
              title="No Cohort Data Found"
              description="No historical customer cohorts could be formed from available order records."
            />
          ) : (
            <>
              {/* Summary Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <MetricCard
                  title="Total Cohorts"
                  value={formatNumber(cohortPayload.summary.totalCohorts)}
                  subtitle={`${periodType === "monthly" ? "Monthly" : "Weekly"} groups`}
                  icon={Grid}
                  accentColor="#0F172A"
                />
                <MetricCard
                  title={`Avg ${periodType === "monthly" ? "Month 1" : "Week 1"} Retention`}
                  value={cohortPayload.summary.avgM1Retention !== null ? `${cohortPayload.summary.avgM1Retention}%` : "Insufficient Historical Data"}
                  subtitle="Mature Period 1 average"
                  icon={Repeat}
                  accentColor="#16A34A"
                />
                <MetricCard
                  title={`Avg ${periodType === "monthly" ? "Month 3" : "Week 3"} Retention`}
                  value={cohortPayload.summary.avgM3Retention !== null ? `${cohortPayload.summary.avgM3Retention}%` : "Insufficient Historical Data"}
                  subtitle="Mature Period 3 average"
                  icon={TrendingUp}
                  accentColor="#0A84FF"
                />
                <MetricCard
                  title="Top Retaining Cohort"
                  value={cohortPayload.summary.bestRetainingCohort || "Insufficient Historical Data"}
                  subtitle="Highest Period 1 retention"
                  icon={Crown}
                  accentColor="#8B5CF6"
                />
                <MetricCard
                  title="Largest Cohort"
                  value={cohortPayload.summary.largestCohort || "—"}
                  subtitle="Most new buyers"
                  icon={Users}
                  accentColor="#0F172A"
                />
              </div>

              {/* SECTION A: COHORT RETENTION MATRIX HEATMAP */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Grid size={18} color="#0A84FF" />
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                      Customer Cohort Retention Matrix
                    </h3>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Retention % = Retained Customers in Period N / Cohort Size × 100
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", width: "160px" }}>Cohort</th>
                        <th style={{ padding: "12px 16px", width: "100px" }}>Buyers</th>
                        {cohortPayload.cohorts[0]?.periods.map((p) => (
                          <th key={p.periodIndex} style={{ padding: "12px 16px" }}>
                            {p.periodLabel}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortPayload.cohorts.map((cohort) => (
                        <tr key={cohort.cohortKey} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#0F172A" }}>
                            {cohort.cohortLabel}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#475569" }}>
                            {formatNumber(cohort.cohortSize)}
                          </td>
                          {cohort.periods.map((p) => {
                            if (p.periodIndex === 0) {
                              return (
                                <td key={p.periodIndex} style={{ padding: "8px" }}>
                                  <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: "6px", backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: "700", fontSize: "12px" }}>
                                    100%
                                  </span>
                                </td>
                              );
                            }

                            if (!p.isMature) {
                              return (
                                <td key={p.periodIndex} style={{ padding: "8px" }}>
                                  <span style={{ fontSize: "11px", color: "#94A3B8", fontStyle: "italic" }} title="Cohort period has not yet matured within the observation window">
                                    Insufficient Historical Data
                                  </span>
                                </td>
                              );
                            }

                            const rate = p.retentionRate;
                            let bgColor = "#F8FAFC";
                            let textColor = "#64748B";

                            if (rate > 20) {
                              bgColor = "rgba(22, 163, 74, 0.18)";
                              textColor = "#15803D";
                            } else if (rate > 10) {
                              bgColor = "rgba(22, 163, 74, 0.10)";
                              textColor = "#16A34A";
                            } else if (rate > 0) {
                              bgColor = "rgba(22, 163, 74, 0.05)";
                              textColor = "#22C55E";
                            }

                            return (
                              <td key={p.periodIndex} style={{ padding: "8px" }}>
                                <div
                                  title={`${cohort.cohortLabel} ${p.periodLabel}: ${p.retainedCustomers} retained of ${cohort.cohortSize} buyers (${rate}% retention) • Net Sales: ${formatCurrencyINR(p.revenue)}`}
                                  style={{
                                    display: "inline-block",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    fontWeight: "600",
                                    fontSize: "12.5px",
                                    width: "70px",
                                  }}
                                >
                                  {rate}%
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: COHORT NET SALES REVENUE TABLE */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <RupeeIcon size={18} />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                    Cohort Net Sales Revenue
                  </h3>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", width: "160px" }}>Cohort</th>
                        {cohortPayload.cohorts[0]?.periods.map((p) => (
                          <th key={p.periodIndex} style={{ padding: "12px 16px" }}>
                            {p.periodLabel} Net Sales
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortPayload.cohorts.map((cohort) => (
                        <tr key={cohort.cohortKey} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#0F172A" }}>
                            {cohort.cohortLabel}
                          </td>
                          {cohort.periods.map((p) => {
                            if (!p.isMature) {
                              return (
                                <td key={p.periodIndex} style={{ padding: "12px 16px", color: "#94A3B8", fontStyle: "italic", fontSize: "11px" }}>
                                  Insufficient Historical Data
                                </td>
                              );
                            }
                            return (
                              <td key={p.periodIndex} style={{ padding: "12px 16px", fontWeight: p.revenue > 0 ? "600" : "400", color: p.revenue > 0 ? "#0F172A" : "#94A3B8" }}>
                                {formatCurrencyINR(p.revenue)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION C: VYTALIS BUSINESS INSIGHTS */}
              {cohortPayload.insights && cohortPayload.insights.length > 0 && (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Sparkles size={18} color="#0A84FF" />
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                      Vytalis Business Insights
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {cohortPayload.insights.map((insight) => {
                      const isWarning = insight.type === "warning";
                      const isPositive = insight.type === "positive";
                      const iconColor = isWarning ? "#DC2626" : isPositive ? "#16A34A" : "#0A84FF";
                      const bgColor = isWarning ? "rgba(220, 38, 38, 0.04)" : isPositive ? "rgba(22, 163, 74, 0.04)" : "rgba(10, 132, 255, 0.04)";
                      const borderColor = isWarning ? "rgba(220, 38, 38, 0.15)" : isPositive ? "rgba(22, 163, 74, 0.15)" : "rgba(10, 132, 255, 0.15)";
                      const IconComp = isWarning ? AlertTriangle : isPositive ? CheckCircle2 : Sparkles;

                      return (
                        <div
                          key={insight.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: "12px",
                            padding: "14px 16px",
                          }}
                        >
                          <IconComp size={18} color={iconColor} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A", marginBottom: "2px" }}>
                              {insight.title}
                            </div>
                            <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>
                              {insight.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ShopifyCustomers;
