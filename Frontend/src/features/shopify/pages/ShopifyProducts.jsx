import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyProducts, getShopifyCompare } from "../services/shopify.api.js";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import DateFilter from "../../meta/components/DateFilter.jsx";
import ShopifyAccountSwitcher from "../components/ShopifyAccountSwitcher.jsx";
import ShopifyLockedState from "../components/ShopifyLockedState.jsx";
import ShopifyProductTrendChart from "../components/ShopifyProductTrendChart.jsx";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getErrorMessage } from "../../../utils/error.js";
import { calculateShopifyProductTrends } from "../utils/shopify-calculator.jsx";
import rupeeImg from "../../../assets/rupee.png";
import {
  Package,
  Layers,
  Award,
  ShoppingBag,
  Filter,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
} from "lucide-react";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyProducts = () => {
  const [productsData, setProductsData] = useState([]);
  const [compareProductsData, setCompareProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Tab Filter State: "all" | "fast_growing" | "declining" | "best_sellers" | "most_revenue" | "low_performers"
  const [productTab, setProductTab] = useState("all");

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

      const [prodRes, compareRes] = await Promise.allSettled([
        getShopifyProducts(dateParams),
        getShopifyCompare(dateParams),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value?.data) {
        setProductsData(Array.isArray(prodRes.value.data) ? prodRes.value.data : []);
      } else if (prodRes.status === "rejected") {
        throw prodRes.reason;
      }

      if (compareRes.status === "fulfilled" && compareRes.value?.data?.metricsMap) {
        // Compare data exists for period-over-period growth
        setCompareProductsData(compareRes.value.data.metricsMap);
      } else {
        setCompareProductsData([]);
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

  // Reset page to 1 on date filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams, productTab]);

  // Single Canonical Product Calculations & Trends
  const trendCalculated = useMemo(() => {
    return calculateShopifyProductTrends(productsData, compareProductsData);
  }, [productsData, compareProductsData]);

  // Filtered List based on Performance Segment Tab
  const filteredList = useMemo(() => {
    if (productTab === "fast_growing") {
      return trendCalculated.fastGrowingList;
    }
    if (productTab === "declining") {
      return trendCalculated.decliningList;
    }
    if (productTab === "best_sellers") {
      return trendCalculated.bestSellersList;
    }
    if (productTab === "most_revenue") {
      return [...trendCalculated.list].sort((a, b) => b.value - a.value);
    }
    if (productTab === "low_performers") {
      return trendCalculated.lowPerformersList;
    }
    return trendCalculated.list;
  }, [trendCalculated, productTab]);

  // Paginated Slice
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Products
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Product line items, performance segments, growth trends, and catalog analytics.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DateFilter onChange={(params) => setDateParams(params)} />
          <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="shopify-products" minHeight="auto" />
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
      ) : trendCalculated.list.length === 0 ? (
        <EmptyState
          title="No Product Performance Data Available"
          description="No product sales records were returned for the selected date range."
        />
      ) : (
        <>
          {/* Top KPI Cards (5 Cards) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Products"
              subtitle="Unique products"
              value={formatNumber(trendCalculated.totalProducts)}
              icon={Package}
              accentColor="#0F172A"
              onClick={() => setProductTab("all")}
            />
            <MetricCard
              title="Quantity Sold"
              subtitle="Units sold"
              value={formatNumber(trendCalculated.totalQty)}
              icon={Layers}
              accentColor="#16A34A"
              onClick={() => setProductTab("best_sellers")}
            />
            <MetricCard
              title="Total Product Sales"
              subtitle="Product line-item sales value"
              value={formatCurrencyINR(trendCalculated.totalValue)}
              icon={RupeeIcon}
              accentColor="#0A84FF"
              onClick={() => setProductTab("most_revenue")}
            />
            <MetricCard
              title="Product Orders"
              subtitle="Orders with product line items"
              value={formatNumber(trendCalculated.totalDistinctOrders)}
              icon={ShoppingBag}
              accentColor="#2563EB"
            />
            <MetricCard
              title="Top Selling Product"
              value={
                trendCalculated.topSellingProduct ? (
                  <span
                    title={trendCalculated.topSellingProduct.name}
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#0F172A",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "1.3",
                    }}
                  >
                    {trendCalculated.topSellingProduct.name}
                  </span>
                ) : (
                  "—"
                )
              }
              subtitle={
                trendCalculated.topSellingProduct
                  ? `Sales: ${formatCurrencyINR(trendCalculated.topSellingProduct.value)} (${trendCalculated.topSellingProduct.shareOfSales}%)`
                  : undefined
              }
              icon={Award}
              accentColor="#EAB308"
            />
          </div>

          {/* Product Trend Visualization */}
          <ShopifyProductTrendChart timeline={trendCalculated.timeline} />

          {/* Product Performance Segment Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Filter size={15} color="#64748B" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>Performance Segments:</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setProductTab("all")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "all" ? "#0F172A" : "#F1F5F9",
                    color: productTab === "all" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  All Products ({trendCalculated.list.length})
                </button>

                <button
                  type="button"
                  onClick={() => setProductTab("fast_growing")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "fast_growing" ? "#16A34A" : "#F1F5F9",
                    color: productTab === "fast_growing" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <TrendingUp size={13} /> Fast Growing
                </button>

                <button
                  type="button"
                  onClick={() => setProductTab("declining")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "declining" ? "#DC2626" : "#F1F5F9",
                    color: productTab === "declining" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <TrendingDown size={13} /> Declining
                </button>

                <button
                  type="button"
                  onClick={() => setProductTab("best_sellers")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "best_sellers" ? "#0A84FF" : "#F1F5F9",
                    color: productTab === "best_sellers" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Best Sellers (Qty)
                </button>

                <button
                  type="button"
                  onClick={() => setProductTab("most_revenue")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "most_revenue" ? "#8B5CF6" : "#F1F5F9",
                    color: productTab === "most_revenue" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Most Revenue
                </button>

                <button
                  type="button"
                  onClick={() => setProductTab("low_performers")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: productTab === "low_performers" ? "#EAB308" : "#F1F5F9",
                    color: productTab === "low_performers" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Low Performers (Bottom 25%)
                </button>
              </div>
            </div>

            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Showing {filteredList.length} products
            </span>
          </div>

          {/* Products Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", width: "35%", maxWidth: "300px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px", width: "12%" }}>Orders</th>
                    <th style={{ padding: "12px 16px", width: "12%" }}>Qty Sold</th>
                    <th style={{ padding: "12px 16px", width: "15%" }}>Avg Unit Price</th>
                    <th style={{ padding: "12px 16px", width: "13%", textAlign: "right" }}>Share %</th>
                    <th style={{ padding: "12px 16px", width: "13%", textAlign: "right" }}>Product Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                        <div
                          title={row.name}
                          style={{ fontWeight: "600", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {row.name}
                        </div>
                        {row.badges && row.badges.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                            {row.badges.map((b) => (
                              <span
                                key={b}
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: b === "Top Revenue" ? "rgba(10, 132, 255, 0.1)" : "rgba(22, 163, 74, 0.1)",
                                  color: b === "Top Revenue" ? "#0A84FF" : "#16A34A",
                                }}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {row.orderCount}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A" }}>
                        {row.quantity}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {formatCurrencyINR(row.avgUnitPrice)}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#64748B", textAlign: "right" }}>
                        {row.shareOfSales}%
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", textAlign: "right" }}>
                        {formatCurrencyINR(row.value)}
                      </td>
                    </tr>
                  ))}
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

          {/* Category Analysis Availability Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={18} color="#64748B" />
            </div>

            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                Category Data Unavailable
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: "1.4" }}>
                The connected Shopify data connector does not expose product collection/category tags. Product performance operates at the individual item and SKU level.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopifyProducts;
