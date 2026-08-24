import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyLocation } from "../services/shopify.api.js";
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
import { calculateShopifyLocationMetrics } from "../utils/shopify-calculator.jsx";
import rupeeImg from "../../../assets/rupee.png";
import { MapPin, ShoppingCart, Clock3, Filter, Search } from "lucide-react";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyLocation = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Regional View Tab: "city" | "province"
  const [viewTab, setViewTab] = useState("city");

  // Search Filter for Order Table
  const [searchQuery, setSearchQuery] = useState("");

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
      const res = await getShopifyLocation(dateParams);
      if (res.data) {
        setLocationData(Array.isArray(res.data) ? res.data : []);
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

  // Reset page to 1 on date filter change or view tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams, viewTab]);

  // Canonical Location Metrics according to exact P0 definitions
  const locationMetrics = useMemo(() => {
    return calculateShopifyLocationMetrics(locationData);
  }, [locationData]);

  // Search Filtered Orders List for Detailed Table
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return locationData;
    const query = searchQuery.toLowerCase().trim();

    return locationData.filter((row) => {
      const orderId = String(row.order_id || "").toLowerCase();
      const city = String(row.order_shipping_address_city || "").toLowerCase();
      const province = String(row.order_shipping_address_province || "").toLowerCase();
      const zip = String(row.order_shipping_address_zip || "").toLowerCase();

      return orderId.includes(query) || city.includes(query) || province.includes(query) || zip.includes(query);
    });
  }, [locationData, searchQuery]);

  // Paginated List for Detailed Table
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Location
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Geographic order shipping locations, regional sales, city distribution, and Location AOV.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DateFilter onChange={(params) => setDateParams(params)} />
          <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="shopify-location" minHeight="auto" />
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
      ) : locationData.length === 0 ? (
        <EmptyState
          title="No Shipping Location Data Found"
          description="No shipping location records were returned for the selected date range."
        />
      ) : (
        <>
          {/* Top 4 KPI Cards strictly adhering to P0 specifications */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Orders"
              value={formatNumber(locationMetrics.totalOrders)}
              icon={ShoppingCart}
              accentColor="#0F172A"
            />
            <MetricCard
              title="Net Sales"
              value={formatCurrencyINR(locationMetrics.totalNetSales)}
              icon={RupeeIcon}
              accentColor="#16A34A"
            />
            <MetricCard
              title="Unique Locations"
              value={formatNumber(locationMetrics.uniqueLocations)}
              subtitle="Distinct shipping cities"
              icon={MapPin}
              accentColor="#0A84FF"
            />
            <MetricCard
              title="Location AOV"
              value={formatCurrencyINR(locationMetrics.locationAov)}
              subtitle="Net sales per store order"
              icon={Clock3}
              accentColor="#8B5CF6"
            />
          </div>

          {/* Top Aggregated Locations Summary Card with View Switcher */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#0A84FF" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                  Regional Sales Breakdown
                </h3>
              </div>

              {/* View Switcher Pills */}
              <div style={{ display: "inline-flex", backgroundColor: "#F1F5F9", borderRadius: "8px", padding: "3px", gap: "2px" }}>
                <button
                  type="button"
                  onClick={() => setViewTab("city")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewTab === "city" ? "#FFFFFF" : "transparent",
                    color: viewTab === "city" ? "#0F172A" : "#64748B",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: viewTab === "city" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                  }}
                >
                  By City ({locationMetrics.cityList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("province")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewTab === "province" ? "#FFFFFF" : "transparent",
                    color: viewTab === "province" ? "#0F172A" : "#64748B",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: viewTab === "province" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                  }}
                >
                  By State / Province ({locationMetrics.provinceList.length})
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 10px" }}>{viewTab === "city" ? "City" : "State / Province"}</th>
                    {viewTab === "city" && <th style={{ padding: "8px 10px" }}>Province / State</th>}
                    <th style={{ padding: "8px 10px" }}>Order Count</th>
                    <th style={{ padding: "8px 10px" }}>Qty Shipped</th>
                    <th style={{ padding: "8px 10px" }}>Location AOV</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Share %</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewTab === "city" ? locationMetrics.cityList : locationMetrics.provinceList).slice(0, 8).map((l, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#0F172A" }}>
                        {viewTab === "city" ? l.city : l.province}
                      </td>
                      {viewTab === "city" && <td style={{ padding: "10px", color: "#475569" }}>{l.province}</td>}
                      <td style={{ padding: "10px", color: "#475569" }}>{l.orderCount}</td>
                      <td style={{ padding: "10px", color: "#475569" }}>{l.quantity}</td>
                      <td style={{ padding: "10px", color: "#475569" }}>{formatCurrencyINR(l.aov)}</td>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#64748B", textAlign: "right" }}>
                        {l.shareOfSales}%
                      </td>
                      <td style={{ padding: "10px", fontWeight: "700", color: "#16A34A", textAlign: "right" }}>
                        {formatCurrencyINR(l.netSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Location Lookup Table Header with Search */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={15} color="#64748B" />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                  Detailed Order Location Records
                </h4>
              </div>

              <div style={{ position: "relative", width: "240px" }}>
                <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search city, state, zip..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 30px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Order ID</th>
                    <th style={{ padding: "12px 16px" }}>City</th>
                    <th style={{ padding: "12px 16px" }}>Province / State</th>
                    <th style={{ padding: "12px 16px" }}>Postal / ZIP</th>
                    <th style={{ padding: "12px 16px" }}>Quantity</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.map((row, idx) => {
                    const rowNet = Number(row.order_net_sales !== undefined && row.order_net_sales !== null ? row.order_net_sales : row.order_total_price || 0);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "500", color: "#64748B" }}>
                          {row.order_id || `#${idx + 1001}`}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0F172A" }}>
                          {row.order_shipping_address_city || "Unknown City"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {row.order_shipping_address_province || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748B" }}>
                          {row.order_shipping_address_zip || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "500" }}>
                          {row.order_quantity || 1}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", textAlign: "right" }}>
                          {formatCurrencyINR(rowNet)}
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

export default ShopifyLocation;
