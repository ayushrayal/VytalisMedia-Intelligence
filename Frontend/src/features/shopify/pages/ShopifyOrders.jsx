import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyOrders } from "../services/shopify.api.js";
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
import { calculateShopifyOrderBreakdown } from "../utils/shopify-calculator.jsx";
import { ShoppingCart, CreditCard, Truck, XCircle, Filter } from "lucide-react";

export const ShopifyOrders = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Payment Status Filter: "all" | "paid" | "pending"
  const [statusFilter, setStatusFilter] = useState("all");

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
      const res = await getShopifyOrders(dateParams);
      if (res.data) {
        setOrdersData(Array.isArray(res.data) ? res.data : []);
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

  // Reset page to 1 on date filter or status filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams, statusFilter]);

  // Calculate Overall Metric Cards based on Date Range
  const metrics = useMemo(() => {
    let totalValue = 0;
    const totalCount = ordersData.length;

    ordersData.forEach((order) => {
      const val = Number(order.order_total_price || order.order_net_sales || 0);
      totalValue += val;
    });

    const breakdown = calculateShopifyOrderBreakdown(ordersData, totalCount);

    return {
      totalOrders: totalCount,
      totalValue,
      ...breakdown,
    };
  }, [ordersData]);

  // Filtered Orders Dataset based on Payment Status
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return ordersData;
    return ordersData.filter((order) => {
      const finStatus = (order.order_financial_status || "").toUpperCase();
      if (statusFilter === "paid") {
        return finStatus === "PAID" || order.order_fully_paid === true;
      }
      if (statusFilter === "pending") {
        return finStatus === "PENDING" || order.order_unpaid === true;
      }
      return true;
    });
  }, [ordersData, statusFilter]);

  // Paginated List
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Orders
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Detailed order records, payment classifications, and fulfillment tracking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DateFilter onChange={(params) => setDateParams(params)} />
          <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="shopify-orders" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="350px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : ordersData.length === 0 ? (
        <EmptyState title="No Orders Available" description="No order records were returned for the selected date range." />
      ) : (
        <>
          {/* Top 4 KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Orders"
              value={formatNumber(metrics.totalOrders)}
              subtitle={`Total Volume: ${formatCurrencyINR(metrics.totalValue)}`}
              icon={ShoppingCart}
              accentColor="#0F172A"
            />
            <MetricCard
              title="Prepaid Orders"
              value={formatCurrencyINR(metrics.prepaidValue)}
              subtitle={`${metrics.prepaidCount} orders (${metrics.prepaidPct}%)`}
              icon={CreditCard}
              accentColor="#16A34A"
            />
            <MetricCard
              title="COD Orders"
              value={formatCurrencyINR(metrics.codValue)}
              subtitle={`${metrics.codCount} orders (${metrics.codPct}%)`}
              icon={Truck}
              accentColor="#EAB308"
            />
            <MetricCard
              title="Cancelled Orders"
              value={formatCurrencyINR(metrics.cancelledValue)}
              subtitle={`${metrics.cancelledCount} orders (${metrics.cancelledPct}%)`}
              icon={XCircle}
              accentColor="#DC2626"
            />
          </div>

          {/* Payment Status Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={15} color="#64748B" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>Filter Orders:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "all" ? "#0F172A" : "#F1F5F9",
                    color: statusFilter === "all" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  All ({ordersData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("paid")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "paid" ? "#16A34A" : "#F1F5F9",
                    color: statusFilter === "paid" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Paid ({metrics.prepaidCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "pending" ? "#EAB308" : "#F1F5F9",
                    color: statusFilter === "pending" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Pending ({metrics.codCount})
                </button>
              </div>
            </div>

            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Showing {filteredOrders.length} of {ordersData.length} total orders
            </span>
          </div>

          {/* Orders Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", width: "25%" }}>Order ID / Name</th>
                    <th style={{ padding: "12px 16px", width: "20%" }}>Created At</th>
                    <th style={{ padding: "12px 16px", width: "20%" }}>Financial Status</th>
                    <th style={{ padding: "12px 16px", width: "20%" }}>Fulfillment</th>
                    <th style={{ padding: "12px 16px", width: "15%", textAlign: "right" }}>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order, idx) => {
                    const finStatus = (order.order_financial_status || (order.order_fully_paid ? "PAID" : "PENDING")).toUpperCase();
                    const fulStatus = (order.order_fulfillment_status || "FULFILLED").toUpperCase();
                    const isCancelled = order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A" }}>
                          {order.order_name || order.order_id || `#${idx + 1001}`}
                          {isCancelled && (
                            <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: "700", color: "#DC2626", backgroundColor: "rgba(220, 38, 38, 0.1)", padding: "1px 5px", borderRadius: "4px" }}>
                              CANCELLED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748B" }}>
                          {order.order_created_at ? new Date(order.order_created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "700",
                              backgroundColor: finStatus === "PAID" ? "rgba(22, 163, 74, 0.1)" : "rgba(234, 179, 8, 0.12)",
                              color: finStatus === "PAID" ? "#16A34A" : "#D97706",
                            }}
                          >
                            {finStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              backgroundColor: fulStatus === "FULFILLED" ? "rgba(10, 132, 255, 0.1)" : "rgba(100, 116, 139, 0.1)",
                              color: fulStatus === "FULFILLED" ? "#0A84FF" : "#64748B",
                            }}
                          >
                            {fulStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0F172A", textAlign: "right" }}>
                          {formatCurrencyINR(order.order_total_price || order.order_net_sales || 0)}
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

export default ShopifyOrders;
