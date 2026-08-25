import React, { useState, useEffect, useCallback } from "react";
import { getMetaOverview } from "../../meta/services/meta.api.js";
import { getShopifyOverviewBundle } from "../../shopify/services/shopify.api.js";
import { calculateShopifyMetrics } from "../../shopify/utils/shopify-calculator.jsx";
import { getErrorMessage } from "../../../utils/error.js";
import useEffectivePermissions from "../../../hooks/useEffectivePermissions.js";
import { PERMISSION_KEYS } from "../../../config/permission-registry.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import AccountSwitcher from "../../meta/components/AccountSwitcher.jsx";
import ShopifyAccountSwitcher from "../../shopify/components/ShopifyAccountSwitcher.jsx";
import DateFilter from "../../meta/components/DateFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { DASHBOARD_WIDGETS } from "../../../config/dashboardWidgets.js";
import { formatCurrency, formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { http } from "../../../lib/http.js";
import BusinessDashboardCustomizer, { ALL_SHOPIFY_METRICS } from "../../../components/dashboard/BusinessDashboardCustomizer.jsx";
import {
  Wallet,
  Eye,
  ShoppingBag,
  IndianRupee,
  Users,
  MousePointer2,
  BarChart3,
  Tag,
  Target,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Truck,
  XCircle,
  Clock3,
  Globe,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

/**
 * DEFAULT META METRICS FALLBACK (Top 5)
 */
const DEFAULT_META_METRIC_IDS = [
  "amount-spent",
  "impressions",
  "purchases",
  "purchase-value",
  "reach",
];

/**
 * DEFAULT SHOPIFY METRICS FALLBACK (Top 5)
 */
const DEFAULT_SHOPIFY_CARDS_CONFIG = [
  { id: "grossSales", label: "Gross Sales", visible: true, order: 1 },
  { id: "netSales", label: "Net Sales", visible: true, order: 2 },
  { id: "orders", label: "Total Orders", visible: true, order: 3 },
  { id: "discounts", label: "Total Discounts", visible: true, order: 4 },
  { id: "customers", label: "Total Customers", visible: true, order: 5 },
  { id: "prepaid", label: "Prepaid Orders", visible: true, order: 6 },
  { id: "cod", label: "COD Orders", visible: true, order: 7 },
  { id: "cancelled", label: "Cancelled Orders", visible: true, order: 8 },
];

/**
 * Business Dashboard Overview Page Component.
 * Dynamic executive summary consuming user's saved Meta & Shopify platform card preferences.
 */
export const DashboardOverview = ({ user }) => {
  const { hasPermission } = useEffectivePermissions(user);
  const isShopifyEnabled = hasPermission(PERMISSION_KEYS.SHOPIFY_VIEW);
  // Global Date Filter State
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Data States
  const [metaData, setMetaData] = useState([]);
  const [shopifyBundle, setShopifyBundle] = useState({ overviewData: [], ordersData: [], customersData: [] });

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);

  // Preference States & Customizer Drawer State
  const [metaSelectedMetricIds, setMetaSelectedMetricIds] = useState([]);
  const [shopifySelectedCards, setShopifySelectedCards] = useState([]);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  /**
   * Reads saved Meta layout preferences from `vytalis_meta_dashboard_layout`.
   */
  const loadMetaPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem("vytalis_meta_dashboard_layout");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.orderedWidgetIds) && Array.isArray(parsed.visibleWidgetIds)) {
          // Filter ordered widgets that are metrics AND visible
          const visibleMetrics = parsed.orderedWidgetIds.filter((id) => {
            const isVisible = parsed.visibleWidgetIds.includes(id);
            const isMetric = DASHBOARD_WIDGETS.some((w) => w.id === id && w.type === "metric");
            return isVisible && isMetric;
          });

          if (visibleMetrics.length > 0) {
            setMetaSelectedMetricIds(visibleMetrics.slice(0, 5));
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load Meta preferences:", e);
    }
    // Fallback to Meta top 5 defaults
    setMetaSelectedMetricIds(DEFAULT_META_METRIC_IDS);
  }, []);

  /**
   * Reads saved Shopify layout preferences from `vytalis_shopify_card_config`.
   */
  const loadShopifyPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem("vytalis_shopify_card_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const visible = parsed
            .filter((c) => c.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          if (visible.length > 0) {
            setShopifySelectedCards(visible.slice(0, 5));
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load Shopify preferences:", e);
    }
    // Fallback to Shopify top 5 defaults
    setShopifySelectedCards(
      DEFAULT_SHOPIFY_CARDS_CONFIG.filter((c) => c.visible).slice(0, 5)
    );
  }, []);

  /**
   * Fetches user's saved KPI preferences from Backend API, falling back to LocalStorage & defaults.
   */
  const loadKpiPreferences = useCallback(async () => {
    try {
      const res = await http.get("/profile/kpi-preferences");
      if (res.data && (res.data.meta || res.data.shopify)) {
        if (Array.isArray(res.data.meta) && res.data.meta.length > 0) {
          setMetaSelectedMetricIds(res.data.meta.slice(0, 5));
        }
        if (Array.isArray(res.data.shopify) && res.data.shopify.length > 0) {
          const shopifyConfig = res.data.shopify.slice(0, 5).map((id, index) => ({
            id,
            label: ALL_SHOPIFY_METRICS.find((m) => m.id === id)?.label || id,
            visible: true,
            order: index + 1,
          }));
          setShopifySelectedCards(shopifyConfig);
        }
        return;
      }
    } catch (e) {
      // Fall back to local storage and default configurations safely
    }

    loadMetaPreferences();
    loadShopifyPreferences();
  }, [loadMetaPreferences, loadShopifyPreferences]);

  // Sync preferences on mount & storage event
  useEffect(() => {
    loadKpiPreferences();

    const handleStorageChange = () => {
      loadKpiPreferences();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadKpiPreferences]);

  /**
   * Parallel Fetching for active Meta and Shopify datasets
   */
  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metaRes, shopifyBundleRes] = await Promise.allSettled([
        getMetaOverview(dateParams),
        isShopifyEnabled
          ? getShopifyOverviewBundle(dateParams)
          : Promise.resolve({ overviewData: [], ordersData: [], customersData: [] }),
      ]);

      if (metaRes.status === "fulfilled" && metaRes.value?.data) {
        setMetaData(Array.isArray(metaRes.value.data) ? metaRes.value.data : []);
      } else {
        setMetaData([]);
      }

      if (shopifyBundleRes.status === "fulfilled" && shopifyBundleRes.value) {
        setShopifyBundle(shopifyBundleRes.value);
      } else {
        setShopifyBundle({ overviewData: [], ordersData: [], customersData: [] });
      }
    } catch (err) {
      setError(err.message || "Failed to load overview analytics");
    } finally {
      setLoading(false);
    }
  }, [dateParams, isShopifyEnabled]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // ==========================================
  // CALCULATIONS: META METRICS
  // ==========================================
  const metaTotals = metaData.reduce(
    (acc, row) => {
      acc.spend += Number(row.spend || 0);
      acc.impressions += Number(row.impressions || 0);
      acc.clicks += Number(row.clicks || 0);
      acc.purchases += Number(row.purchases || row.actions_purchase || 0);
      acc.purchaseValue += Number(row.purchase_conversion_value || row.value || 0);
      acc.reach = Math.max(acc.reach, Number(row.reach || 0));
      acc.addToCart += Number(row.actions_add_to_cart || 0);
      acc.checkoutInitiated += Number(row.actions_initiate_checkout || 0);
      acc.currency = row.currency || acc.currency;
      return acc;
    },
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      purchases: 0,
      purchaseValue: 0,
      reach: 0,
      addToCart: 0,
      checkoutInitiated: 0,
      currency: "INR",
    }
  );

  const metaCalculatedMetrics = {
    "amount-spent": {
      title: "Amount Spent",
      value: formatCurrency(metaTotals.spend, metaTotals.currency),
      icon: Wallet,
      accentColor: "#16A34A",
    },
    impressions: {
      title: "Impressions",
      value: formatNumber(metaTotals.impressions),
      icon: Eye,
      accentColor: "#8B5CF6",
    },
    purchases: {
      title: "Purchases",
      value: formatNumber(metaTotals.purchases),
      icon: ShoppingBag,
      accentColor: "#0A84FF",
    },
    "purchase-value": {
      title: "Purchase Value",
      value: formatCurrency(metaTotals.purchaseValue, metaTotals.currency),
      icon: IndianRupee,
      accentColor: "#2563EB",
    },
    reach: {
      title: "Reach",
      value: formatNumber(metaTotals.reach),
      icon: Users,
      accentColor: "#64748B",
    },
    clicks: {
      title: "Clicks",
      value: formatNumber(metaTotals.clicks),
      icon: MousePointer2,
      accentColor: "#EC4899",
    },
    ctr: {
      title: "Average CTR",
      value: metaTotals.impressions > 0 ? formatPercentage((metaTotals.clicks / metaTotals.impressions) * 100) : "—",
      icon: BarChart3,
      accentColor: "#0A84FF",
    },
    cpc: {
      title: "Average CPC",
      value: metaTotals.clicks > 0 ? formatCurrency(metaTotals.spend / metaTotals.clicks, metaTotals.currency) : "—",
      icon: Tag,
      accentColor: "#F59E0B",
    },
    cpm: {
      title: "CPM",
      value: metaTotals.impressions > 0 ? formatCurrency((metaTotals.spend / metaTotals.impressions) * 1000, metaTotals.currency) : "—",
      icon: Tag,
      accentColor: "#64748B",
    },
    "cost-per-purchase": {
      title: "Cost per Purchase",
      value: metaTotals.purchases > 0 ? formatCurrency(metaTotals.spend / metaTotals.purchases, metaTotals.currency) : "—",
      icon: Target,
      accentColor: "#DC2626",
    },
    "purchase-roas": {
      title: "Purchase ROAS",
      value: metaTotals.spend > 0 ? `${(metaTotals.purchaseValue / metaTotals.spend).toFixed(2)}x` : "—",
      icon: TrendingUp,
      accentColor: "#16A34A",
    },
    "add-to-cart": {
      title: "Add to Cart",
      value: formatNumber(metaTotals.addToCart),
      icon: ShoppingBag,
      accentColor: "#8B5CF6",
    },
    "checkout-initiated": {
      title: "Checkout Initiated",
      value: formatNumber(metaTotals.checkoutInitiated),
      icon: ShoppingBag,
      accentColor: "#0A84FF",
    },
  };

  // ==========================================
  // CALCULATIONS: SHOPIFY METRICS (CANONICAL LAYER)
  // ==========================================
  const shopifyCalculated = calculateShopifyMetrics({
    overviewData: shopifyBundle.overviewData,
    ordersData: shopifyBundle.ordersData,
    customersData: shopifyBundle.customersData,
  });
  const shopifyCalculatedMetrics = shopifyCalculated.metricsMap;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "32px" }}>
      {/* Page Header */}
      <PageHeader
        title="Business Dashboard"
        subtitle="Cross-platform executive performance summary"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <AccountSwitcher onAccountSwitched={fetchOverviewData} />
            {isShopifyEnabled && <ShopifyAccountSwitcher onAccountChanged={fetchOverviewData} />}
            <DateFilter onChange={(params) => setDateParams(params)} initialPreset="last_7d" />
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              title="Customize Dashboard Cards"
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
              <SlidersHorizontal size={14} />
              <span>Customize</span>
            </button>
            <button
              type="button"
              onClick={fetchOverviewData}
              title="Refresh dashboard metrics"
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
              }}
            >
              <RotateCcw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchOverviewData} />
      ) : (
        <>
          {/* ========================================== */}
          {/* 1. META PERFORMANCE SUMMARY */}
          {/* ========================================== */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#0F172A", fontSize: "17px", fontWeight: "700", letterSpacing: "-0.3px" }}>
                Meta Performance Summary
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "500" }}>
                Synced with your Meta Overview customization
              </span>
            </div>

            {isDisplayLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <ContextualLoader isLoading={loading} onComplete={handleComplete} section="business-overview" minHeight="auto" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                </div>
              </div>
            ) : metaSelectedMetricIds.length === 0 ? (
              <div style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "13px", color: "#64748B" }}>
                No Meta metrics selected in Meta Overview Customize.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {metaSelectedMetricIds.map((id) => {
                  const m = metaCalculatedMetrics[id] || {
                    title: id.replace(/-/g, " ").toUpperCase(),
                    value: "—",
                    icon: Wallet,
                    accentColor: "#64748B",
                  };
                  return (
                    <MetricCard
                      key={id}
                      title={m.title}
                      value={metaData.length === 0 ? "—" : m.value}
                      icon={m.icon}
                      accentColor={m.accentColor}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* 2. SHOPIFY PERFORMANCE SUMMARY */}
          {/* ========================================== */}
          {isShopifyEnabled && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "#0F172A", fontSize: "17px", fontWeight: "700", letterSpacing: "-0.3px" }}>
                  Shopify Performance Summary
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "500" }}>
                  Synced with your Shopify Overview customization
                </span>
              </div>

              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                  <Skeleton height="90px" />
                </div>
              ) : shopifySelectedCards.length === 0 ? (
                <div style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "13px", color: "#64748B" }}>
                  No Shopify metrics selected in Shopify Overview Customize.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {shopifySelectedCards.map((card) => {
                    const cardId = card.id;
                    const cardLabel = card.label;
                    const m = shopifyCalculatedMetrics[cardId] || {
                      title: cardLabel || cardId,
                      value: "—",
                      icon: ShoppingCart,
                      accentColor: "#0A84FF",
                    };
                    return (
                      <MetricCard
                        key={cardId}
                        title={cardLabel || m.title}
                        value={shopifyCalculated.hasData ? m.value : "—"}
                        subtitle={shopifyCalculated.hasData ? m.subtitle : undefined}
                        icon={m.icon}
                        accentColor={m.accentColor}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 3. GOOGLE ADS (INFORMATIONAL COMING SOON CARD) */}
          {/* ========================================== */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Globe size={20} strokeWidth={2} />
              </div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A", fontSize: "16px", fontWeight: "700" }}>
                  Google Ads
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Google Ads analytics is coming soon.
                </p>
              </div>
            </div>

            <span
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "#64748B",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Coming Soon
            </span>
          </div>
        </>
      )}

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "12px 18px",
            backgroundColor: "#0F2742",
            color: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: "600",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} color="#0A84FF" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Customize Right-Side Drawer */}
      <BusinessDashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        isShopifyEnabled={isShopifyEnabled}
        initialMeta={metaSelectedMetricIds}
        initialShopify={shopifySelectedCards.map((c) => (typeof c === "string" ? c : c.id))}
        onSave={({ meta, shopify }) => {
          setMetaSelectedMetricIds(meta);
          setShopifySelectedCards(
            shopify.map((id, index) => ({
              id,
              label: ALL_SHOPIFY_METRICS.find((m) => m.id === id)?.label || id,
              visible: true,
              order: index + 1,
            }))
          );
          setToastMessage("Dashboard updated");
          setTimeout(() => setToastMessage(""), 3500);
        }}
      />
    </div>
  );
};

export default DashboardOverview;
