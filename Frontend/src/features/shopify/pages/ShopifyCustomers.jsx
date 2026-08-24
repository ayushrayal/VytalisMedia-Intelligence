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
import { calculateShopifyCustomerMetrics } from "../utils/shopify-calculator.jsx";
import { Users, UserPlus, UserCheck, Filter, Repeat, Crown } from "lucide-react";
import rupeeImg from "../../../assets/rupee.png";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyCustomers = () => {
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Customer Filter State: "all" | "single" | "repeat" | "high_value"
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

  // Compute Canonical Customer Metrics according to exact P0 audit specifications
  const customerMetrics = useMemo(() => {
    return calculateShopifyCustomerMetrics(customersData);
  }, [customersData]);

  // Filtered Customers Dataset based on customer filter ("all" | "single" | "repeat" | "high_value")
  const filteredCustomers = useMemo(() => {
    if (customerFilter === "all") return customersData;

    return customersData.filter((c) => {
      const ordersCount = Number(c.customer_orders_count || 1);
      const totalSpent = Number(c.customer_total_spent || 0);

      if (customerFilter === "single") {
        return ordersCount === 1;
      }
      if (customerFilter === "repeat") {
        return ordersCount >= 2;
      }
      if (customerFilter === "high_value") {
        return customerMetrics.highValueThreshold > 0 && totalSpent >= customerMetrics.highValueThreshold && totalSpent > 0;
      }
      return true;
    });
  }, [customersData, customerFilter, customerMetrics.highValueThreshold]);

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
            Customer spending, repeat purchase rates, returning revenue, and segment analytics.
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
    </div>
  );
};

export default ShopifyCustomers;
