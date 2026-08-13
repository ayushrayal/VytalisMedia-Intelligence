import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getShopifyOverview,
  getShopifyOrders,
  getShopifyProducts,
  getShopifyCustomers,
  getShopifyLocation,
} from "../services/shopify.api.js";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import DateFilter from "../../meta/components/DateFilter.jsx";
import ShopifyAccountSwitcher from "../components/ShopifyAccountSwitcher.jsx";
import ShopifyLockedState from "../components/ShopifyLockedState.jsx";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getErrorMessage } from "../../../utils/error.js";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Tag,
  Users,
  XCircle,
  CreditCard,
  Truck,
  Clock3,
  Package,
  MapPin,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react";

const DEFAULT_CARDS_CONFIG = [
  { id: "grossSales", label: "Gross Sales", visible: true, order: 1 },
  { id: "netSales", label: "Net Sales", visible: true, order: 2 },
  { id: "orders", label: "Total Orders", visible: true, order: 3 },
  { id: "discounts", label: "Total Discounts", visible: true, order: 4 },
  { id: "customers", label: "Total Customers", visible: true, order: 5 },
  { id: "prepaid", label: "Prepaid Orders", visible: true, order: 6 },
  { id: "cod", label: "COD Orders", visible: true, order: 7 },
  { id: "cancelled", label: "Cancelled Orders", visible: true, order: 8 },
];

import rupeeImg from "../../../assets/rupee.png";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

export const ShopifyOverview = () => {
  const [overviewData, setOverviewData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [locationData, setLocationData] = useState([]);

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Accounts & Locked State
  const [isLocked, setIsLocked] = useState(false);

  // Customization Drawer State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [cardsConfig, setCardsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("vytalis_shopify_card_config");
      return saved ? JSON.parse(saved) : DEFAULT_CARDS_CONFIG;
    } catch {
      return DEFAULT_CARDS_CONFIG;
    }
  });

  const saveCardConfig = (newConfig) => {
    setCardsConfig(newConfig);
    try {
      localStorage.setItem("vytalis_shopify_card_config", JSON.stringify(newConfig));
    } catch {}
  };

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

      const [overviewRes, ordersRes, productsRes, customersRes, locationRes] =
        await Promise.allSettled([
          getShopifyOverview(dateParams),
          getShopifyOrders(dateParams),
          getShopifyProducts(dateParams),
          getShopifyCustomers(dateParams),
          getShopifyLocation(dateParams),
        ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value?.data) {
        setOverviewData(Array.isArray(overviewRes.value.data) ? overviewRes.value.data : []);
        setMeta(overviewRes.value.meta || null);
      } else if (overviewRes.status === "rejected") {
        throw overviewRes.reason;
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        setOrdersData(Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []);
      }

      if (productsRes.status === "fulfilled" && productsRes.value?.data) {
        setProductsData(Array.isArray(productsRes.value.data) ? productsRes.value.data : []);
      }

      if (customersRes.status === "fulfilled" && customersRes.value?.data) {
        setCustomersData(Array.isArray(customersRes.value.data) ? customersRes.value.data : []);
      }

      if (locationRes.status === "fulfilled" && locationRes.value?.data) {
        setLocationData(Array.isArray(locationRes.value.data) ? locationRes.value.data : []);
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

  // Aggregate Overview Totals
  const totals = useMemo(() => {
    return overviewData.reduce(
      (acc, row) => {
        acc.grossSales += Number(row.order_gross_sales || 0);
        acc.netSales += Number(row.order_net_sales || 0);
        acc.orders += Number(row.order_count || row.order_total_count || 0);
        acc.quantity += Number(row.order_quantity || 0);
        acc.discounts += Number(row.order_total_discounts || 0);
        acc.tax += Number(row.order_total_tax_amount || 0);
        return acc;
      },
      { grossSales: 0, netSales: 0, orders: 0, quantity: 0, discounts: 0, tax: 0 }
    );
  }, [overviewData]);

  // Derive Prepaid, COD, Cancelled Metrics
  const orderBreakdown = useMemo(() => {
    let prepaidCount = 0;
    let prepaidValue = 0;
    let codCount = 0;
    let codValue = 0;
    let cancelledCount = 0;
    let cancelledValue = 0;

    const totalOrdersCount = ordersData.length || totals.orders || 1;

    ordersData.forEach((order) => {
      const finStatus = (order.order_financial_status || "").toUpperCase();
      const orderPrice = Number(order.order_total_price || order.order_net_sales || 0);

      if (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") {
        cancelledCount += 1;
        cancelledValue += orderPrice;
      }

      if (finStatus === "PAID" || order.order_fully_paid === true) {
        prepaidCount += 1;
        prepaidValue += orderPrice;
      } else if (finStatus === "PENDING" || order.order_unpaid === true) {
        codCount += 1;
        codValue += orderPrice;
      }
    });

    return {
      prepaidCount,
      prepaidValue,
      prepaidPct: ((prepaidCount / totalOrdersCount) * 100).toFixed(1),
      codCount,
      codValue,
      codPct: ((codCount / totalOrdersCount) * 100).toFixed(1),
      cancelledCount,
      cancelledValue,
      cancelledPct: ((cancelledCount / totalOrdersCount) * 100).toFixed(1),
    };
  }, [ordersData, totals.orders]);

  // Unique Customers Count
  const uniqueCustomerCount = useMemo(() => {
    if (customersData.length > 0) {
      const set = new Set();
      customersData.forEach((c) => {
        if (c.customer_id || c.customer_email) set.add(c.customer_id || c.customer_email);
      });
      return set.size;
    }
    return 0;
  }, [customersData]);

  // Top Products
  const topProducts = useMemo(() => {
    const map = {};
    productsData.forEach((p) => {
      const name = p.line_item__name || p.line_item__title || "Product";
      if (!map[name]) {
        map[name] = { name, ordersCount: 0, quantity: 0, value: 0 };
      }
      map[name].ordersCount += 1;
      map[name].quantity += Number(p.line_item__quantity || 1);
      map[name].value += Number(p.line_item__price || p.line_item__product_price || 0) * Number(p.line_item__quantity || 1);
    });

    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [productsData]);

  // Top Locations
  const topLocations = useMemo(() => {
    const map = {};
    locationData.forEach((l) => {
      const city = l.order_shipping_address_city || "Unknown City";
      const province = l.order_shipping_address_province || "—";
      const key = `${city}, ${province}`;
      if (!map[key]) {
        map[key] = { city, province, quantity: 0, netSales: 0 };
      }
      map[key].quantity += Number(l.order_quantity || 1);
      map[key].netSales += Number(l.order_net_sales || l.order_total_price || 0);
    });

    return Object.values(map).sort((a, b) => b.netSales - a.netSales).slice(0, 5);
  }, [locationData]);

  if (isLocked) {
    return <ShopifyLockedState />;
  }

  // Map of Card Renderers
  const cardRenderers = {
    grossSales: (
      <MetricCard
        key="grossSales"
        title="Gross Sales"
        value={formatCurrencyINR(totals.grossSales)}
        icon={TrendingUp}
        accentColor="#0F172A"
      />
    ),
    netSales: (
      <MetricCard
        key="netSales"
        title="Net Sales"
        value={formatCurrencyINR(totals.netSales)}
        icon={RupeeIcon}
        accentColor="#0A84FF"
      />
    ),
    orders: (
      <MetricCard
        key="orders"
        title="Total Orders"
        value={formatNumber(totals.orders)}
        icon={ShoppingCart}
        accentColor="#6366F1"
      />
    ),
    discounts: (
      <MetricCard
        key="discounts"
        title="Total Discounts"
        value={formatCurrencyINR(totals.discounts)}
        icon={Tag}
        accentColor="#8B5CF6"
      />
    ),
    customers: (
      <MetricCard
        key="customers"
        title="Total Customers"
        value={formatNumber(uniqueCustomerCount || customersData.length)}
        subtitle="Unique customer accounts"
        icon={Users}
        accentColor="#0EA5E9"
      />
    ),
    prepaid: (
      <MetricCard
        key="prepaid"
        title="Prepaid Orders"
        value={formatCurrencyINR(orderBreakdown.prepaidValue)}
        subtitle={`${orderBreakdown.prepaidCount} orders (${orderBreakdown.prepaidPct}%)`}
        icon={CreditCard}
        accentColor="#16A34A"
      />
    ),
    cod: (
      <MetricCard
        key="cod"
        title="COD Orders"
        value={formatCurrencyINR(orderBreakdown.codValue)}
        subtitle={`${orderBreakdown.codCount} orders (${orderBreakdown.codPct}%)`}
        icon={Truck}
        accentColor="#EAB308"
      />
    ),
    cancelled: (
      <MetricCard
        key="cancelled"
        title="Cancelled Orders"
        value={formatCurrencyINR(orderBreakdown.cancelledValue)}
        subtitle={`${orderBreakdown.cancelledCount} orders (${orderBreakdown.cancelledPct}%)`}
        icon={XCircle}
        accentColor="#DC2626"
      />
    ),
  };

  const visibleCards = cardsConfig
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Controls */}
      <div>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Overview
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Store performance and sales metrics via Shopify.
          </p>
        </div>

        {/* Toolbar Container */}
        <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Left Filters */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <DateFilter onChange={(params) => setDateParams(params)} />
            <ShopifyAccountSwitcher onAccountChanged={() => fetchData()} onAccountsLoaded={handleAccountsLoaded} />
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setIsCustomizing(true)}
              style={{
                height: "36px",
                padding: "0 12px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #0A84FF",
                color: "#0A84FF",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              }}
            >
              <SlidersHorizontal size={15} color="#0A84FF" />
              Customize
            </button>

            <div style={{ height: "36px", padding: "0 12px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "12px", fontWeight: "600" }}>
              <Clock3 size={14} color="#64748B" />
              <span>{meta && meta.cachedAt ? `Cached ${new Date(meta.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Cached"}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="300px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : overviewData.length === 0 ? (
        <EmptyState title="No Shopify Overview Data Available" description="No store sales records were found for the selected date range." />
      ) : (
        <>
          {/* Customized KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {visibleCards.map((c) => cardRenderers[c.id])}
          </div>

          {/* Tables */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {/* Top Products */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Package size={18} color="#0A84FF" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Top Selling Products</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Product Name</th>
                      <th style={{ padding: "8px 10px" }}>Qty Sold</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Sales Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td title={p.name} style={{ padding: "10px", fontWeight: "600", color: "#0F172A", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </td>
                        <td style={{ padding: "10px", color: "#475569" }}>{p.quantity}</td>
                        <td style={{ padding: "10px", fontWeight: "700", color: "#0A84FF", textAlign: "right" }}>
                          {formatCurrencyINR(p.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Locations */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <MapPin size={18} color="#16A34A" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Top Shipping Locations</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>City</th>
                      <th style={{ padding: "8px 10px" }}>State / Province</th>
                      <th style={{ padding: "8px 10px" }}>Qty</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Net Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLocations.map((l, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px", fontWeight: "600", color: "#0F172A" }}>{l.city}</td>
                        <td style={{ padding: "10px", color: "#475569" }}>{l.province}</td>
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
          </div>
        </>
      )}

      {/* Card Customization Drawer */}
      {isCustomizing && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ backgroundColor: "#FFFFFF", width: "100%", maxWidth: "380px", height: "100%", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Customize Cards</h3>
              <button onClick={() => setIsCustomizing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748B" }}>Toggle visibility to display your preferred Shopify KPI cards.</p>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {cardsConfig.map((item) => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(e) => {
                      const updated = cardsConfig.map((c) => (c.id === item.id ? { ...c, visible: e.target.checked } : c));
                      saveCardConfig(updated);
                    }}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </label>
              ))}
            </div>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => saveCardConfig(DEFAULT_CARDS_CONFIG)}
                style={{ background: "none", border: "none", color: "#DC2626", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <RotateCcw size={14} /> Reset to Default
              </button>
              <button onClick={() => setIsCustomizing(false)} style={{ backgroundColor: "#0A84FF", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyOverview;
