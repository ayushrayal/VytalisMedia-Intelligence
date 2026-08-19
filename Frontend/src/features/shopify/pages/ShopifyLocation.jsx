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
import rupeeImg from "../../../assets/rupee.png";
import { MapPin, ShoppingCart } from "lucide-react";

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

  // Reset page to 1 on date filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateParams]);

  // Aggregate Metrics & Unique Locations
  const locationMetrics = useMemo(() => {
    let totalNetSales = 0;
    const uniqueCities = new Set();

    locationData.forEach((l) => {
      totalNetSales += Number(l.order_net_sales || l.order_total_price || 0);

      const city = (l.order_shipping_address_city || "").trim();
      if (city) uniqueCities.add(city);
    });

    return {
      totalOrders: locationData.length,
      totalNetSales,
      uniqueLocations: uniqueCities.size,
    };
  }, [locationData]);

  // Aggregated Top Locations Breakdown Table
  const aggregatedLocationsList = useMemo(() => {
    const map = {};
    locationData.forEach((l) => {
      const city = l.order_shipping_address_city || "Unknown City";
      const province = l.order_shipping_address_province || "—";
      const key = `${city}_${province}`;

      if (!map[key]) {
        map[key] = { city, province, orderCount: 0, quantity: 0, netSales: 0 };
      }
      map[key].orderCount += 1;
      map[key].quantity += Number(l.order_quantity || 1);
      map[key].netSales += Number(l.order_net_sales || l.order_total_price || 0);
    });

    return Object.values(map).sort((a, b) => b.netSales - a.netSales);
  }, [locationData]);

  // Paginated List
  const totalItems = locationData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return locationData.slice(start, start + pageSize);
  }, [locationData, currentPage, pageSize]);

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
            Geographic order shipping locations, regional sales, and city distribution analytics.
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
          {/* Top 3 KPI Cards */}
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
          </div>

          {/* Top Aggregated Locations Summary Card */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
              Top Cities by Net Sales
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 10px" }}>City</th>
                    <th style={{ padding: "8px 10px" }}>Province / State</th>
                    <th style={{ padding: "8px 10px" }}>Order Count</th>
                    <th style={{ padding: "8px 10px" }}>Qty Shipped</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedLocationsList.slice(0, 5).map((l, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#0F172A" }}>{l.city}</td>
                      <td style={{ padding: "10px", color: "#475569" }}>{l.province}</td>
                      <td style={{ padding: "10px", color: "#475569" }}>{l.orderCount}</td>
                      <td style={{ padding: "10px", color: "#475569" }}>{l.quantity}</td>
                      <td style={{ padding: "10px", fontWeight: "700", color: "#16A34A", textAlign: "right" }}>
                        {formatCurrencyINR(l.netSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Location Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
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
                  {paginatedLocations.map((row, idx) => (
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
                        {formatCurrencyINR(row.order_net_sales || row.order_total_price || 0)}
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
        </>
      )}
    </div>
  );
};

export default ShopifyLocation;
