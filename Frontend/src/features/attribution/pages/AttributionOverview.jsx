import React, { useState, useEffect, useCallback } from "react";
import { getAttributionOverview, getAttributionOrders } from "../services/attribution.api.js";
import { AttributionSummary } from "../components/AttributionSummary.jsx";
import { AttributionGroupCard } from "../components/AttributionGroupCard.jsx";
import { AttributionDistribution } from "../components/AttributionDistribution.jsx";
import { AttributionChannelTable } from "../components/AttributionChannelTable.jsx";
import { AttributionDailyChart } from "../components/AttributionDailyChart.jsx";
import { AttributionFilters } from "../components/AttributionFilters.jsx";
import { AttributionOrderTable } from "../components/AttributionOrderTable.jsx";
import { AttributionOrderDrawer } from "../components/AttributionOrderDrawer.jsx";

import DateFilter from "../../meta/components/DateFilter.jsx";
import ShopifyAccountSwitcher from "../../shopify/components/ShopifyAccountSwitcher.jsx";
import ShopifyLockedState from "../../shopify/components/ShopifyLockedState.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { getErrorMessage } from "../../../utils/error.js";
import { RotateCcw } from "lucide-react";

/**
 * AttributionOverview Page Component.
 * Main dashboard view for Shopify revenue attribution analysis.
 */
export const AttributionOverview = () => {
  // Account & Locked State
  const [activeAccount, setActiveAccount] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Date Range State
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Overview Data State
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // Orders Data State & Filters
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ currentPage: 1, totalPages: 1, limit: 20, totalItems: 0 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Order Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [groupFilter, setGroupFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [financialStatusFilter, setFinancialStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Order Details Drawer State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, groupFilter, channelFilter, financialStatusFilter, dateParams]);

  // Handle Account Switcher load event
  const handleAccountsLoaded = useCallback(({ accounts, activeAccount: initialActive }) => {
    if (!accounts || accounts.length === 0) {
      setIsLocked(true);
      setOverviewLoading(false);
      setOrdersLoading(false);
    } else {
      setIsLocked(false);
      if (initialActive) {
        setActiveAccount(initialActive);
      }
    }
  }, []);

  // Handle Account Changed
  const handleAccountChanged = useCallback((newAccount) => {
    setActiveAccount(newAccount);
  }, []);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    if (isLocked) return;
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const res = await getAttributionOverview(dateParams);
      if (res && res.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      setOverviewError(getErrorMessage(err));
    } finally {
      setOverviewLoading(false);
    }
  }, [dateParams, isLocked]);

  // Fetch Orders Data
  const fetchOrders = useCallback(async () => {
    if (isLocked) return;
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const query = {
        ...dateParams,
        page,
        limit,
        search: debouncedSearch,
        group: groupFilter,
        channel: channelFilter,
        financialStatus: financialStatusFilter,
      };
      const res = await getAttributionOrders(query);
      if (res && res.data) {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setOrdersPagination(res.meta?.pagination || { currentPage: page, totalPages: 1, limit, totalItems: res.data.length });
      }
    } catch (err) {
      setOrdersError(getErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }, [dateParams, page, limit, debouncedSearch, groupFilter, channelFilter, financialStatusFilter, isLocked]);

  // Trigger data fetches
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchOverview();
    fetchOrders();
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  const overall = overviewData?.overall || {};
  const groups = overviewData?.groups || {};
  const channels = overviewData?.channels || [];
  const daily = overviewData?.daily || [];

  return (
    <div style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
            Attribution
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Understand where your Shopify revenue is coming from.
          </p>
        </div>

        {/* Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <ShopifyAccountSwitcher
            onAccountChanged={handleAccountChanged}
            onAccountsLoaded={handleAccountsLoaded}
          />
          <DateFilter onChange={(params) => setDateParams(params)} initialPreset="last_7d" />

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh attribution data"
            style={{
              height: "36px",
              padding: "0 12px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              color: "#0F172A",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              transition: "all 0.15s ease",
            }}
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW SECTION */}
      {overviewError ? (
        <ErrorState message={overviewError} onRetry={fetchOverview} />
      ) : overviewLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
          <Skeleton height="100px" />
          <Skeleton height="200px" />
          <Skeleton height="300px" />
        </div>
      ) : (
        <>
          {/* Top KPI Metrics Row */}
          <AttributionSummary overall={overall} groups={groups} currency="INR" />

          {/* Top-Level Attribution Split Cards (META, GOOGLE, NOT ATTRIBUTION) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <AttributionGroupCard groupKey="meta" data={groups.meta} currency="INR" />
            <AttributionGroupCard groupKey="google" data={groups.google} currency="INR" />
            <AttributionGroupCard groupKey="not_attribution" data={groups.not_attribution} currency="INR" />
          </div>

          {/* Visual Channel Distribution Horizontal Stacked Bar */}
          <AttributionDistribution groups={groups} totalOrders={overall.totalOrders || 0} />

          {/* 7 Channels Analytical Breakdown Table */}
          <AttributionChannelTable channels={channels} currency="INR" />

          {/* Daily Attribution Performance Chart */}
          <AttributionDailyChart dailyData={daily} currency="INR" />
        </>
      )}

      {/* ORDERS SECTION */}
      <div style={{ marginTop: "32px" }}>
        <AttributionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          groupFilter={groupFilter}
          onGroupFilterChange={setGroupFilter}
          channelFilter={channelFilter}
          onChannelFilterChange={setChannelFilter}
          financialStatusFilter={financialStatusFilter}
          onFinancialStatusFilterChange={setFinancialStatusFilter}
        />

        {ordersError ? (
          <ErrorState message={ordersError} onRetry={fetchOrders} />
        ) : ordersLoading ? (
          <Skeleton height="320px" />
        ) : (
          <AttributionOrderTable
            orders={orders}
            pagination={ordersPagination}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            onSelectOrder={handleRowClick}
            currency="INR"
          />
        )}
      </div>

      {/* Order Details Slide-Over Drawer */}
      <AttributionOrderDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currency="INR"
      />
    </div>
  );
};

export default AttributionOverview;
