import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import {
  TrendingUp,
  ShoppingCart,
  Tag,
  Users,
  CreditCard,
  Truck,
  XCircle,
  Clock3,
} from "lucide-react";
import rupeeImg from "../../../assets/rupee.png";
import React from "react";

const RupeeIcon = ({ size = 18 }) => (
  <img src={rupeeImg} alt="Rupee" style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }} />
);

/**
 * Calculates canonical Shopify Totals from Windsor overview rows.
 */
export const calculateShopifyTotals = (overviewData = []) => {
  return (overviewData || []).reduce(
    (acc, row) => {
      acc.grossSales += Number(row.order_gross_sales || row.gross_sales || 0);
      acc.netSales += Number(row.order_net_sales || row.net_sales || 0);
      acc.orders += Number(row.order_count || row.order_total_count || 0);
      acc.quantity += Number(row.order_quantity || 0);
      acc.discounts += Number(row.order_total_discounts || 0);
      acc.tax += Number(row.order_total_tax_amount || 0);
      return acc;
    },
    { grossSales: 0, netSales: 0, orders: 0, quantity: 0, discounts: 0, tax: 0 }
  );
};

/**
 * Calculates Prepaid, COD, and Cancelled order metrics from Windsor orders rows.
 */
export const calculateShopifyOrderBreakdown = (ordersData = [], totalOrdersCount = 0) => {
  let prepaidCount = 0;
  let prepaidValue = 0;
  let codCount = 0;
  let codValue = 0;
  let cancelledCount = 0;
  let cancelledValue = 0;

  const countDenominator = totalOrdersCount || ordersData.length || 1;

  (ordersData || []).forEach((order) => {
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
    prepaidPct: ((prepaidCount / countDenominator) * 100).toFixed(1),
    codCount,
    codValue,
    codPct: ((codCount / countDenominator) * 100).toFixed(1),
    cancelledCount,
    cancelledValue,
    cancelledPct: ((cancelledCount / countDenominator) * 100).toFixed(1),
  };
};

/**
 * Calculates unique customer count from Windsor customers rows.
 */
export const calculateShopifyUniqueCustomers = (customersData = []) => {
  if (!Array.isArray(customersData) || customersData.length === 0) {
    return 0;
  }
  const set = new Set();
  customersData.forEach((c) => {
    const id = c.customer_id || c.customer_email || c.order_email || c.email;
    if (id) set.add(String(id).trim().toLowerCase());
  });
  return set.size;
};

/**
 * Single Canonical Calculation Utility for Shopify Overview & Business Dashboard metrics.
 */
export const calculateShopifyMetrics = ({ overviewData = [], ordersData = [], customersData = [] } = {}) => {
  const totals = calculateShopifyTotals(overviewData);
  const totalOrders = totals.orders || ordersData.length || 0;
  const breakdown = calculateShopifyOrderBreakdown(ordersData, totalOrders);
  const uniqueCustomers = calculateShopifyUniqueCustomers(customersData);

  const hasOverviewData = Array.isArray(overviewData) && overviewData.length > 0;
  const hasOrdersData = Array.isArray(ordersData) && ordersData.length > 0;
  const hasCustomersData = Array.isArray(customersData) && customersData.length > 0;
  const hasAnyData = hasOverviewData || hasOrdersData || hasCustomersData;

  const aovValue = totalOrders > 0 ? totals.netSales / totalOrders : null;

  return {
    hasData: hasAnyData,
    totals,
    breakdown,
    uniqueCustomers,
    metricsMap: {
      grossSales: {
        id: "grossSales",
        title: "Gross Sales",
        label: "Gross Sales",
        value: hasAnyData ? formatCurrencyINR(totals.grossSales) : "—",
        rawValue: totals.grossSales,
        icon: TrendingUp,
        accentColor: "#0F172A",
      },
      netSales: {
        id: "netSales",
        title: "Net Sales",
        label: "Net Sales",
        value: hasAnyData ? formatCurrencyINR(totals.netSales) : "—",
        rawValue: totals.netSales,
        icon: RupeeIcon,
        accentColor: "#0A84FF",
      },
      orders: {
        id: "orders",
        title: "Total Orders",
        label: "Total Orders",
        value: hasAnyData ? formatNumber(totalOrders) : "—",
        rawValue: totalOrders,
        icon: ShoppingCart,
        accentColor: "#2563EB",
      },
      discounts: {
        id: "discounts",
        title: "Total Discounts",
        label: "Total Discounts",
        value: hasAnyData ? formatCurrencyINR(totals.discounts) : "—",
        rawValue: totals.discounts,
        icon: Tag,
        accentColor: "#F59E0B",
      },
      customers: {
        id: "customers",
        title: "Total Customers",
        label: "Total Customers",
        value: hasAnyData ? formatNumber(uniqueCustomers) : "—",
        rawValue: uniqueCustomers,
        icon: Users,
        accentColor: "#8B5CF6",
      },
      prepaid: {
        id: "prepaid",
        title: "Prepaid Orders",
        label: "Prepaid Orders",
        value: hasAnyData ? formatNumber(breakdown.prepaidCount) : "—",
        rawValue: breakdown.prepaidCount,
        icon: CreditCard,
        accentColor: "#16A34A",
      },
      cod: {
        id: "cod",
        title: "COD Orders",
        label: "COD Orders",
        value: hasAnyData ? formatNumber(breakdown.codCount) : "—",
        rawValue: breakdown.codCount,
        icon: Truck,
        accentColor: "#F59E0B",
      },
      cancelled: {
        id: "cancelled",
        title: "Cancelled Orders",
        label: "Cancelled Orders",
        value: hasAnyData ? formatNumber(breakdown.cancelledCount) : "—",
        rawValue: breakdown.cancelledCount,
        icon: XCircle,
        accentColor: "#DC2626",
      },
      aov: {
        id: "aov",
        title: "Average Order Value",
        label: "Average Order Value",
        value: hasAnyData && aovValue !== null ? formatCurrencyINR(aovValue) : "—",
        rawValue: aovValue || 0,
        icon: Clock3,
        accentColor: "#0A84FF",
      },
    },
  };
};
