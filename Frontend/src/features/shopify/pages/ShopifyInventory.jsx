import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getShopifyInventory } from "../services/shopify.api.js";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import ShopifyAccountSwitcher from "../components/ShopifyAccountSwitcher.jsx";
import ShopifyLockedState from "../components/ShopifyLockedState.jsx";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getErrorMessage } from "../../../utils/error.js";
import { calculateShopifyInventory } from "../utils/shopify-calculator.jsx";
import rupeeImg from "../../../assets/rupee.png";
import {
  Package,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  Sliders,
  Bell,
  ShieldAlert,
} from "lucide-react";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);

  // Account & Lock state
  const [isLocked, setIsLocked] = useState(false);

  // Configurable Low Stock Threshold State (default: 5 units)
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Filter Pill State: "all" | "in_stock" | "low_stock" | "out_of_stock"
  const [statusFilter, setStatusFilter] = useState("all");

  // Search Filter (Product Name or SKU)
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
      // Inventory represents current catalog stock state and operates independently of sales date parameters
      const res = await getShopifyInventory();
      if (res.data) {
        setInventoryData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isLocked]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination on filter or threshold change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, lowStockThreshold]);

  // Canonical Inventory & Stock Alerts Calculation
  const inventoryMetrics = useMemo(() => {
    return calculateShopifyInventory(inventoryData, lowStockThreshold);
  }, [inventoryData, lowStockThreshold]);

  // Filtered Product List
  const filteredProducts = useMemo(() => {
    let list = inventoryMetrics.productList;

    if (statusFilter === "in_stock") {
      list = list.filter((p) => p.status === "In Stock");
    } else if (statusFilter === "low_stock") {
      list = list.filter((p) => p.status === "Low Stock");
    } else if (statusFilter === "out_of_stock") {
      list = list.filter((p) => p.status === "Out of Stock");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    return list;
  }, [inventoryMetrics.productList, statusFilter, searchQuery]);

  // Paginated List
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Inventory
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Current catalog inventory levels, stock status, Stock Alerts, and Inventory Retail Value.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Threshold Configurator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#FFFFFF", padding: "6px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <Sliders size={14} color="#64748B" />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Low-Stock Threshold:</span>
            <select
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A", border: "none", backgroundColor: "transparent", outline: "none", cursor: "pointer" }}
            >
              <option value={3}>3 units</option>
              <option value={5}>5 units (Default)</option>
              <option value={10}>10 units</option>
              <option value={15}>15 units</option>
              <option value={20}>20 units</option>
            </select>
          </div>

          <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
        </div>
      </div>

      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="shopify-inventory" minHeight="auto" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
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
      ) : inventoryData.length === 0 ? (
        <EmptyState title="No Inventory Data Found" description="No inventory records were returned for the connected Shopify store." />
      ) : (
        <>
          {/* Top 6 KPI Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <MetricCard
              title="Total Products"
              value={formatNumber(inventoryMetrics.totalProducts)}
              subtitle="Catalog items"
              icon={Package}
              accentColor="#0F172A"
              onClick={() => setStatusFilter("all")}
            />
            <MetricCard
              title="Total Units"
              value={formatNumber(inventoryMetrics.totalUnits)}
              subtitle="Available catalog units"
              icon={Layers}
              accentColor="#0A84FF"
            />
            <MetricCard
              title="In-Stock Products"
              value={formatNumber(inventoryMetrics.inStockCount)}
              subtitle={`> ${lowStockThreshold} units`}
              icon={CheckCircle}
              accentColor="#16A34A"
              onClick={() => setStatusFilter("in_stock")}
            />
            <MetricCard
              title="Low-Stock Products"
              value={formatNumber(inventoryMetrics.lowStockCount)}
              subtitle={`1 - ${lowStockThreshold} units`}
              icon={AlertTriangle}
              accentColor="#F59E0B"
              onClick={() => setStatusFilter("low_stock")}
            />
            <MetricCard
              title="Out-of-Stock"
              value={formatNumber(inventoryMetrics.outOfStockCount)}
              subtitle="0 units available"
              icon={XCircle}
              accentColor="#DC2626"
              onClick={() => setStatusFilter("out_of_stock")}
            />
            <MetricCard
              title="Inventory Retail Value"
              value={formatCurrencyINR(inventoryMetrics.inventoryRetailValue)}
              subtitle="Quantity × Selling Price"
              icon={RupeeIcon}
              accentColor="#8B5CF6"
            />
          </div>

          {/* Premium Redesigned Stock Alerts Section */}
          {inventoryMetrics.alerts.length > 0 && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(220, 38, 38, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bell size={15} color="#DC2626" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                    Stock Alerts ({inventoryMetrics.alerts.length})
                  </h3>
                </div>
                <span style={{ fontSize: "12px", color: "#64748B", backgroundColor: "#F8FAFC", padding: "4px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  Configured Threshold: <strong style={{ color: "#0F172A" }}>{lowStockThreshold} units</strong>
                </span>
              </div>

              {/* Scrollable Alert Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "12px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  padding: "4px",
                }}
              >
                {inventoryMetrics.alerts.map((alert) => {
                  const isCritical = alert.severity === "CRITICAL";
                  const accentColor = isCritical ? "#DC2626" : "#F59E0B";
                  const badgeBg = isCritical ? "#FEF2F2" : "#FFFBEB";
                  const textColor = isCritical ? "#991B1B" : "#92400E";

                  return (
                    <div
                      key={alert.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderLeft: `4px solid ${accentColor}`,
                        borderRadius: "12px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "10px",
                        boxShadow: "0 1px 2px rgba(15,23,42,0.02)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      {/* Alert Card Header: Icon, Name, Severity Badge */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          {isCritical ? (
                            <ShieldAlert size={16} color="#DC2626" style={{ marginTop: "2px", flexShrink: 0 }} />
                          ) : (
                            <AlertTriangle size={16} color="#D97706" style={{ marginTop: "2px", flexShrink: 0 }} />
                          )}
                          <div
                            title={alert.name}
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#0F172A",
                              lineHeight: "1.3",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {alert.name}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: badgeBg,
                            color: textColor,
                            border: `1px solid ${accentColor}33`,
                            letterSpacing: "0.4px",
                            flexShrink: 0,
                          }}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      {/* Alert Card Bottom Metadata Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", paddingTop: "8px", borderTop: "1px dashed #F1F5F9" }}>
                        <span style={{ color: "#64748B", backgroundColor: "#F8FAFC", padding: "2px 6px", borderRadius: "4px" }}>
                          SKU: <strong style={{ color: "#334155" }}>{alert.sku}</strong>
                        </span>
                        <span style={{ color: textColor, fontWeight: "700" }}>
                          Current Qty: {alert.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Filter size={15} color="#64748B" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>Filter Stock Status:</span>
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
                  All ({inventoryMetrics.productList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_stock")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "in_stock" ? "#16A34A" : "#F1F5F9",
                    color: statusFilter === "in_stock" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  In Stock ({inventoryMetrics.inStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("low_stock")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "low_stock" ? "#F59E0B" : "#F1F5F9",
                    color: statusFilter === "low_stock" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Low Stock ({inventoryMetrics.lowStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("out_of_stock")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: statusFilter === "out_of_stock" ? "#DC2626" : "#F1F5F9",
                    color: statusFilter === "out_of_stock" ? "#FFFFFF" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Out of Stock ({inventoryMetrics.outOfStockCount})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Inventory Table with Pagination */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", width: "35%", maxWidth: "300px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px", width: "15%" }}>SKU</th>
                    <th style={{ padding: "12px 16px", width: "12%" }}>Current Qty</th>
                    <th style={{ padding: "12px 16px", width: "13%" }}>Selling Price</th>
                    <th style={{ padding: "12px 16px", width: "13%" }}>Stock Status</th>
                    <th style={{ padding: "12px 16px", width: "12%", textAlign: "right" }}>Retail Value</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p, idx) => {
                    const statusColor = p.status === "In Stock" ? "#16A34A" : p.status === "Low Stock" ? "#D97706" : "#DC2626";
                    const statusBg = p.status === "In Stock" ? "rgba(22, 163, 74, 0.1)" : p.status === "Low Stock" ? "rgba(245, 158, 11, 0.12)" : "rgba(220, 38, 38, 0.1)";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                          <div title={p.name} style={{ fontWeight: "600", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748B", fontWeight: "500" }}>
                          {p.sku}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0F172A" }}>
                          {p.quantity}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>
                          {formatCurrencyINR(p.price)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", backgroundColor: statusBg, color: statusColor }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", textAlign: "right" }}>
                          {formatCurrencyINR(p.retailValue)}
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

export default ShopifyInventory;
