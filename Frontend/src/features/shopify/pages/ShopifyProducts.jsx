import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyProducts } from "../services/shopify.api.js";
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
import rupeeImg from "../../../assets/rupee.png";
import { Package, ShoppingCart, Layers } from "lucide-react";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyProducts = () => {
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

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
      const res = await getShopifyProducts(dateParams);
      if (res.data) {
        setProductsData(Array.isArray(res.data) ? res.data : []);
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

  // Reset page to 1 on date filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams]);

  // Aggregate Product Metrics
  const aggregatedProducts = useMemo(() => {
    const map = {};
    let totalQty = 0;
    let totalValue = 0;

    productsData.forEach((p) => {
      const name = p.line_item__name || p.line_item__title || "Product";
      const qty = Number(p.line_item__quantity || 1);
      const price = Number(p.line_item__price || p.line_item__product_price || 0);
      const rowVal = price * qty;

      totalQty += qty;
      totalValue += rowVal;

      if (!map[name]) {
        map[name] = {
          name,
          orderCount: 0,
          quantity: 0,
          value: 0,
        };
      }
      map[name].orderCount += 1;
      map[name].quantity += qty;
      map[name].value += rowVal;
    });

    const list = Object.values(map).sort((a, b) => b.value - a.value);
    return { list, totalProducts: list.length, totalQty, totalValue };
  }, [productsData]);

  // Paginated Slice
  const totalItems = aggregatedProducts.list.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return aggregatedProducts.list.slice(start, start + pageSize);
  }, [aggregatedProducts.list, currentPage, pageSize]);

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
            Line items, product sales, and catalog performance analytics.
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
          </div>
          <Skeleton height="350px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : aggregatedProducts.list.length === 0 ? (
        <EmptyState
          title="No Product Performance Data Available"
          description="No product sales records were returned for the selected date range."
        />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Products"
              value={formatNumber(aggregatedProducts.totalProducts)}
              icon={Package}
              accentColor="#0F172A"
            />
            <MetricCard
              title="Product Orders"
              value={formatNumber(productsData.length)}
              icon={ShoppingCart}
              accentColor="#6366F1"
            />
            <MetricCard
              title="Quantity Sold"
              value={formatNumber(aggregatedProducts.totalQty)}
              icon={Layers}
              accentColor="#16A34A"
            />
            <MetricCard
              title="Total Product Sales"
              value={formatCurrencyINR(aggregatedProducts.totalValue)}
              icon={RupeeIcon}
              accentColor="#0A84FF"
            />
          </div>

          {/* Products Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", width: "45%", maxWidth: "340px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px", width: "18%" }}>Order Count</th>
                    <th style={{ padding: "12px 16px", width: "18%" }}>Quantity Sold</th>
                    <th style={{ padding: "12px 16px", width: "19%", textAlign: "right" }}>Product Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td title={row.name} style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A", width: "45%", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", width: "18%" }}>
                        {row.orderCount}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A", width: "18%" }}>
                        {row.quantity}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", width: "19%", textAlign: "right" }}>
                        {formatCurrencyINR(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Frontend Pagination Component */}
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

export default ShopifyProducts;
