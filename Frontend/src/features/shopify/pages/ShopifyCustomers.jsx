import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyCustomers } from "../services/shopify.api.js";
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
import { Users, UserPlus, UserCheck, Filter } from "lucide-react";

export const ShopifyCustomers = () => {
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Customer Filter State: "all" | "new" | "returning"
  const [customerFilter, setCustomerFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleAccountsLoaded = useCallback(({ accounts }) => {
    if (accounts.length === 0) {
      setIsLocked(true);
      setLoading(false);
    } else {
      setIsLocked(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (isLocked) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getShopifyCustomers(dateParams);
      if (res.data) {
        setCustomersData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateParams, isLocked]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page to 1 on date filter or customer filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams, customerFilter]);

  // Compute New vs Returning Customer Metrics using real API `customer_orders_count`
  const customerMetrics = useMemo(() => {
    let newCount = 0;
    let returningCount = 0;

    customersData.forEach((c) => {
      const ordersCount =
        c.customer_orders_count !== null &&
        c.customer_orders_count !== undefined &&
        !isNaN(Number(c.customer_orders_count))
          ? Number(c.customer_orders_count)
          : null;

      if (ordersCount === 1) {
        newCount += 1;
      } else if (ordersCount !== null && ordersCount > 1) {
        returningCount += 1;
      }
    });

    return {
      totalCustomers: customersData.length,
      newCustomers: newCount,
      returningCustomers: returningCount,
    };
  }, [customersData]);

  // Filtered Customers Dataset based on customer filter ("all" | "new" | "returning")
  const filteredCustomers = useMemo(() => {
    if (customerFilter === "all") return customersData;

    return customersData.filter((c) => {
      const ordersCount =
        c.customer_orders_count !== null &&
        c.customer_orders_count !== undefined &&
        !isNaN(Number(c.customer_orders_count))
          ? Number(c.customer_orders_count)
          : null;

      if (customerFilter === "new") {
        return ordersCount === 1;
      }
      if (customerFilter === "returning") {
        return ordersCount !== null && ordersCount > 1;
      }
      return true;
    });
  }, [customersData, customerFilter]);

  // Paginated Customers List
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
            Customer spending, lifetime value, and order history analytics.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DateFilter onChange={(params) => setDateParams(params)} />
          <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="shopify-customers" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="350px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : customersData.length === 0 ? (
        <EmptyState
          title="No Customer Records Found"
          description="No customer spending data was returned for the selected date range."
        />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Customers"
              value={formatNumber(customerMetrics.totalCustomers)}
              icon={Users}
              accentColor="#0F172A"
              onClick={() => setCustomerFilter("all")}
            />
            <MetricCard
              title="New Customers"
              value={formatNumber(customerMetrics.newCustomers)}
              subtitle="Single order customers"
              icon={UserPlus}
              accentColor="#0A84FF"
              onClick={() => setCustomerFilter("new")}
            />
            <MetricCard
              title="Returning Customers"
              value={formatNumber(customerMetrics.returningCustomers)}
              subtitle="Repeat buyers (2+ orders)"
              icon={UserCheck}
              accentColor="#16A34A"
              onClick={() => setCustomerFilter("returning")}
            />
          </div>

          {/* Customer Type Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Filter size={15} color="#64748B" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>Filter Customers:</span>
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
                    transition: "all 0.15s ease",
                  }}
                >
                  All ({customerMetrics.totalCustomers})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("new")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: customerFilter === "new" ? "#0F172A" : "#F1F5F9",
                    color: customerFilter === "new" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  New ({customerMetrics.newCustomers})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter("returning")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: customerFilter === "returning" ? "#0F172A" : "#F1F5F9",
                    color: customerFilter === "returning" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Returning ({customerMetrics.returningCustomers})
                </button>
              </div>
            </div>

            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Showing {filteredCustomers.length} of {filteredCustomers.length} customers
            </span>
          </div>

          {/* Customers Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", width: "40%" }}>Customer Name</th>
                    <th style={{ padding: "12px 16px", width: "20%" }}>Orders Count</th>
                    <th style={{ padding: "12px 16px", width: "20%" }}>Calculated AOV</th>
                    <th style={{ padding: "12px 16px", width: "20%", textAlign: "right" }}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((c, idx) => {
                    const name = `${c.customer_first_name || ""} ${c.customer_last_name || ""}`.trim() || "Customer";
                    const ordersCount = Number(c.customer_orders_count || 1);
                    const totalSpent = Number(c.customer_total_spent || 0);
                    const aov = ordersCount > 0 ? totalSpent / ordersCount : 0;

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A" }}>
                          {name}
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
    </div>
  );
};

export default ShopifyCustomers;
