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
 * Calculates canonical Shopify Totals from overview or orders rows.
 * Authoritative source for Net Sales, Gross Sales, Discounts, Orders Count, and AOV.
 */
export const calculateShopifyTotals = (dataRows = []) => {
  if (!Array.isArray(dataRows) || dataRows.length === 0) {
    return { grossSales: 0, netSales: 0, orders: 0, quantity: 0, discounts: 0, tax: 0, aov: 0 };
  }

  const totals = dataRows.reduce(
    (acc, row) => {
      const gross = Number(row.order_gross_sales || row.gross_sales || 0);
      const net = Number(row.order_net_sales !== undefined && row.order_net_sales !== null ? row.order_net_sales : (row.net_sales !== undefined && row.net_sales !== null ? row.net_sales : row.order_total_price || 0));
      const count = Number(row.order_count || row.order_total_count || 1);

      acc.grossSales += gross;
      acc.netSales += net;
      acc.orders += count;
      acc.quantity += Number(row.order_quantity || 0);
      acc.discounts += Number(row.order_total_discounts || 0);
      acc.tax += Number(row.order_total_tax_amount || 0);
      return acc;
    },
    { grossSales: 0, netSales: 0, orders: 0, quantity: 0, discounts: 0, tax: 0 }
  );

  // For orders array where each element is a single order row
  const actualOrdersCount = dataRows[0]?.order_count !== undefined ? totals.orders : dataRows.length;
  const aov = actualOrdersCount > 0 ? totals.netSales / actualOrdersCount : 0;

  return {
    ...totals,
    orders: actualOrdersCount,
    aov,
  };
};

/**
 * Calculates Order Breakdown (Prepaid, COD, Cancelled, and COD Cancellation Rate).
 */
export const calculateShopifyOrderBreakdown = (ordersData = [], totalOrdersCount = 0) => {
  let prepaidCount = 0;
  let prepaidValue = 0;
  let codCount = 0;
  let codValue = 0;
  let cancelledCount = 0;
  let cancelledValue = 0;
  let codCancelledCount = 0;

  const countDenominator = totalOrdersCount || ordersData.length || 0;

  (ordersData || []).forEach((order) => {
    const finStatus = (order.order_financial_status || "").toUpperCase();
    const orderNet = Number(order.order_net_sales !== undefined && order.order_net_sales !== null ? order.order_net_sales : order.order_total_price || 0);

    const isCancelled =
      (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") ||
      finStatus === "VOIDED" ||
      finStatus === "CANCELLED";

    const isCOD = finStatus === "PENDING" || order.order_unpaid === true;
    const isPrepaid = finStatus === "PAID" || order.order_fully_paid === true;

    if (isCancelled) {
      cancelledCount += 1;
      cancelledValue += Math.abs(orderNet);
      if (isCOD) {
        codCancelledCount += 1;
      }
    }

    if (isPrepaid) {
      prepaidCount += 1;
      prepaidValue += orderNet;
    } else if (isCOD) {
      codCount += 1;
      codValue += orderNet;
    }
  });

  const cancelledPct = countDenominator > 0 ? ((cancelledCount / countDenominator) * 100).toFixed(1) : "0.0";
  const prepaidPct = countDenominator > 0 ? ((prepaidCount / countDenominator) * 100).toFixed(1) : "0.0";
  const codPct = countDenominator > 0 ? ((codCount / countDenominator) * 100).toFixed(1) : "0.0";
  const codCancellationRate = codCount > 0 ? ((codCancelledCount / codCount) * 100).toFixed(1) : null;

  return {
    prepaidCount,
    prepaidValue,
    prepaidPct,
    codCount,
    codValue,
    codPct,
    cancelledCount,
    cancelledValue,
    cancelledPct,
    codCancelledCount,
    codCancellationRate,
  };
};

/**
 * Calculates Fulfillment Rate:
 * fulfilled non-cancelled orders / non-cancelled orders × 100
 */
export const calculateShopifyFulfillmentRate = (ordersData = []) => {
  if (!Array.isArray(ordersData) || ordersData.length === 0) {
    return { nonCancelledCount: 0, fulfilledCount: 0, rate: 0 };
  }

  let nonCancelledCount = 0;
  let fulfilledCount = 0;

  ordersData.forEach((order) => {
    const finStatus = (order.order_financial_status || "").toUpperCase();
    const isCancelled =
      (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") ||
      finStatus === "VOIDED" ||
      finStatus === "CANCELLED";

    if (!isCancelled) {
      nonCancelledCount += 1;
      const fulStatus = (order.order_fulfillment_status || "").toUpperCase();
      if (fulStatus === "FULFILLED" || order.order_fulfillable === false) {
        fulfilledCount += 1;
      }
    }
  });

  const rate = nonCancelledCount > 0 ? Number(((fulfilledCount / nonCancelledCount) * 100).toFixed(1)) : 0;
  return { nonCancelledCount, fulfilledCount, rate };
};

/**
 * Calculates Customer Metrics according to exact definitions:
 * - Single-Order Customers: ordersCount === 1
 * - Repeat Customers: ordersCount >= 2
 * - Repeat Purchase Rate: customers with 2+ orders / customers with at least 1 order × 100
 * - Returning Revenue: revenue generated by customers with 2+ orders
 * - High-Value Customers threshold: top 10% by total spent ranking positive spend customers
 */
export const calculateShopifyCustomerMetrics = (customersData = []) => {
  if (!Array.isArray(customersData) || customersData.length === 0) {
    return {
      totalCustomers: 0,
      singleOrderCustomers: 0,
      repeatCustomers: 0,
      repeatPurchaseRate: 0,
      returningRevenue: 0,
      highValueThreshold: 0,
      highValueCount: 0,
    };
  }

  let singleCount = 0;
  let repeatCount = 0;
  let returningRev = 0;

  const validCustomers = customersData.map((c) => {
    const ordersCount = Number(c.customer_orders_count || 1);
    const totalSpent = Number(c.customer_total_spent || 0);
    return { ...c, ordersCount, totalSpent };
  });

  validCustomers.forEach((c) => {
    if (c.ordersCount === 1) {
      singleCount += 1;
    } else if (c.ordersCount >= 2) {
      repeatCount += 1;
      returningRev += c.totalSpent;
    }
  });

  const totalCustomers = validCustomers.length;
  const repeatPurchaseRate = totalCustomers > 0 ? Number(((repeatCount / totalCustomers) * 100).toFixed(1)) : 0;

  // High-Value Threshold: Top 10% of positive spend customers sorted by Total Spent
  const positiveSpendCustomers = validCustomers.filter((c) => c.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent);
  const highValueCount = positiveSpendCustomers.length > 0 ? Math.max(1, Math.ceil(positiveSpendCustomers.length * 0.10)) : 0;
  const highValueThreshold = highValueCount > 0 ? positiveSpendCustomers[highValueCount - 1]?.totalSpent || 0 : 0;

  return {
    totalCustomers,
    singleOrderCustomers: singleCount,
    repeatCustomers: repeatCount,
    repeatPurchaseRate,
    returningRevenue: returningRev,
    highValueThreshold,
    highValueCount,
  };
};

/**
 * Calculates Product Metrics with exact definitions:
 * - Product Orders: distinct order IDs containing at least one product line item
 * - Share of Total Product Sales (%)
 * - Average Unit Price
 * - Low Performers: bottom 25% of products by Product Sales among products with at least 1 sale
 * - Badges: "Top Revenue", "High Volume"
 */
export const calculateShopifyProductMetrics = (productsData = []) => {
  if (!Array.isArray(productsData) || productsData.length === 0) {
    return {
      list: [],
      totalProducts: 0,
      totalQty: 0,
      totalValue: 0,
      topSellingProduct: null,
      totalDistinctOrders: 0,
      lowPerformersList: [],
    };
  }

  const map = {};
  let totalQty = 0;
  let totalValue = 0;
  const orderIdSet = new Set();

  productsData.forEach((p) => {
    const name = p.line_item__name || p.line_item__title || "Product";
    const qty = Number(p.line_item__quantity || 1);
    const price = Number(p.line_item__price || p.line_item__product_price || 0);
    const rowVal = price * qty;

    totalQty += qty;
    totalValue += rowVal;

    if (p.order_id !== null && p.order_id !== undefined && String(p.order_id).trim() !== "") {
      orderIdSet.add(String(p.order_id).trim());
    }

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

  const totalDistinctOrders = orderIdSet.size;
  const rawList = Object.values(map);
  const maxSales = Math.max(0, ...rawList.map((p) => p.value));
  const maxQty = Math.max(0, ...rawList.map((p) => p.quantity));

  const list = rawList.map((p) => {
    const shareOfSales = totalValue > 0 ? Number(((p.value / totalValue) * 100).toFixed(1)) : 0;
    const avgUnitPrice = p.quantity > 0 ? p.value / p.quantity : 0;
    const badges = [];

    if (p.value === maxSales && maxSales > 0) {
      badges.push("Top Revenue");
    }
    if (p.quantity === maxQty && maxQty > 0) {
      badges.push("High Volume");
    }

    return {
      ...p,
      shareOfSales,
      avgUnitPrice,
      badges,
    };
  }).sort((a, b) => b.value - a.value);

  const topSellingProduct = list.length > 0 ? list[0] : null;

  // Low Performers: bottom 25% by Product Sales among products with at least 1 sale (p.value > 0)
  const productsWithSales = list.filter((p) => p.value > 0).sort((a, b) => a.value - b.value);
  const lowCount = Math.ceil(productsWithSales.length * 0.25);
  const lowPerformersList = productsWithSales.slice(0, lowCount);

  return {
    list,
    totalProducts: list.length,
    totalQty,
    totalValue,
    topSellingProduct,
    totalDistinctOrders,
    lowPerformersList,
  };
};

/**
 * Calculates Product Performance Trends & Segments (P1B):
 * - Fast Growing: Highest positive period-over-period sales growth
 * - Declining: Highest negative period-over-period sales growth
 * - Best Sellers: Highest quantity sold
 * - Low Performers: Bottom 25% by sales among products with sales > 0
 * - Daily Product Sales Trend Timeline
 */
export const calculateShopifyProductTrends = (productsData = [], compareProductsData = []) => {
  const currentMetrics = calculateShopifyProductMetrics(productsData);
  const compareMetrics = compareProductsData && compareProductsData.length > 0
    ? calculateShopifyProductMetrics(compareProductsData)
    : null;

  const compareMap = {};
  if (compareMetrics) {
    compareMetrics.list.forEach((p) => {
      compareMap[p.name] = p.value;
    });
  }

  const enrichedList = currentMetrics.list.map((p) => {
    const prevValue = compareMap[p.name] || 0;
    let growthPct = null;
    let growthStatus = "no_prev";

    if (compareMetrics) {
      if (prevValue > 0) {
        growthPct = Number((((p.value - prevValue) / prevValue) * 100).toFixed(1));
        growthStatus = growthPct >= 0 ? "positive" : "negative";
      } else if (p.value > 0) {
        growthPct = 100;
        growthStatus = "new";
      } else {
        growthPct = 0;
        growthStatus = "neutral";
      }
    }

    return {
      ...p,
      prevValue,
      growthPct,
      growthStatus,
    };
  });

  // Fast Growing: Highest positive growth % (requires compare data)
  const fastGrowingList = compareMetrics
    ? [...enrichedList]
      .filter((p) => p.growthPct !== null && p.growthPct > 0)
      .sort((a, b) => b.growthPct - a.growthPct)
    : [];

  // Declining: Highest negative growth % (requires compare data)
  const decliningList = compareMetrics
    ? [...enrichedList]
      .filter((p) => p.growthPct !== null && p.growthPct < 0)
      .sort((a, b) => a.growthPct - b.growthPct)
    : [];

  // Best Sellers: Highest quantity sold
  const bestSellersList = [...enrichedList].sort((a, b) => b.quantity - a.quantity);

  // Low Performers: Bottom 25% by sales among products with sales > 0
  const lowPerformersList = currentMetrics.lowPerformersList;

  // Daily Trend Timeline
  const dailyMap = {};
  (productsData || []).forEach((row) => {
    const dateStr = row.order_created_at
      ? new Date(row.order_created_at).toISOString().split("T")[0]
      : "Unknown";
    const qty = Number(row.line_item__quantity || 1);
    const price = Number(row.line_item__price || row.line_item__product_price || 0);
    const val = qty * price;

    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { date: dateStr, sales: 0, quantity: 0 };
    }
    dailyMap[dateStr].sales += val;
    dailyMap[dateStr].quantity += qty;
  });

  const timeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...currentMetrics,
    enrichedList,
    fastGrowingList,
    decliningList,
    bestSellersList,
    lowPerformersList,
    timeline,
    hasCompareData: Boolean(compareMetrics),
  };
};

/**
 * Calculates Location Metrics:
 * - Location Net Sales: sum of order_net_sales across location rows
 * - Location AOV: Location Net Sales / distinct store orders associated with location
 * - City AOV: City Net Sales / city distinct store orders
 */
export const calculateShopifyLocationMetrics = (locationData = []) => {
  if (!Array.isArray(locationData) || locationData.length === 0) {
    return {
      totalOrders: 0,
      totalNetSales: 0,
      uniqueLocations: 0,
      locationAov: 0,
      cityList: [],
      provinceList: [],
    };
  }

  let totalNetSales = 0;
  const uniqueCities = new Set();
  const cityMap = {};
  const provinceMap = {};

  locationData.forEach((l) => {
    const sales = Number(l.order_net_sales !== undefined && l.order_net_sales !== null ? l.order_net_sales : l.order_total_price || 0);
    totalNetSales += sales;

    const city = (l.order_shipping_address_city || "Unknown City").trim();
    const province = (l.order_shipping_address_province || "—").trim();

    if (city && city !== "Unknown City") uniqueCities.add(city);

    // City grouping
    const cityKey = `${city}_${province}`;
    if (!cityMap[cityKey]) {
      cityMap[cityKey] = { city, province, orderCount: 0, quantity: 0, netSales: 0 };
    }
    cityMap[cityKey].orderCount += 1;
    cityMap[cityKey].quantity += Number(l.order_quantity || 1);
    cityMap[cityKey].netSales += sales;

    // Province/State grouping
    if (!provinceMap[province]) {
      provinceMap[province] = { province, orderCount: 0, quantity: 0, netSales: 0 };
    }
    provinceMap[province].orderCount += 1;
    provinceMap[province].quantity += Number(l.order_quantity || 1);
    provinceMap[province].netSales += sales;
  });

  const totalOrders = locationData.length;
  const locationAov = totalOrders > 0 ? totalNetSales / totalOrders : 0;

  const cityList = Object.values(cityMap).map((c) => ({
    ...c,
    shareOfSales: totalNetSales > 0 ? Number(((c.netSales / totalNetSales) * 100).toFixed(1)) : 0,
    aov: c.orderCount > 0 ? c.netSales / c.orderCount : 0,
  })).sort((a, b) => b.netSales - a.netSales);

  const provinceList = Object.values(provinceMap).map((p) => ({
    ...p,
    shareOfSales: totalNetSales > 0 ? Number(((p.netSales / totalNetSales) * 100).toFixed(1)) : 0,
    aov: p.orderCount > 0 ? p.netSales / p.orderCount : 0,
  })).sort((a, b) => b.netSales - a.netSales);

  return {
    totalOrders,
    totalNetSales,
    uniqueLocations: uniqueCities.size,
    locationAov,
    cityList,
    provinceList,
  };
};

/**
 * Generates Deterministic Vytalis Business Insights based strictly on actual data.
 */
export const generateShopifyBusinessInsights = ({
  totals = {},
  breakdown = {},
  customerMetrics = {},
  productMetrics = {},
  compareData = null,
} = {}) => {
  const insights = [];

  // 1. Cancellation Rate Insight
  const cancelRate = Number(breakdown.cancelledPct || 0);
  if (cancelRate > 5) {
    insights.push({
      id: "cancel_rate_warning",
      type: "warning",
      title: "Elevated Cancellation Rate",
      description: `Cancellation rate is ${cancelRate}%, affecting ${breakdown.cancelledCount} of ${totals.orders} store orders.`,
    });
  } else if (cancelRate > 0 && cancelRate <= 3) {
    insights.push({
      id: "cancel_rate_healthy",
      type: "positive",
      title: "Healthy Order Fulfillment",
      description: `Cancellation rate is low at ${cancelRate}%, reflecting high order realization.`,
    });
  }

  // 2. COD Mix & COD Cancellation Insight
  const codShare = Number(breakdown.codPct || 0);
  if (codShare >= 30) {
    let desc = `COD accounts for ${codShare}% of store orders (${breakdown.codCount} orders).`;
    if (breakdown.codCancellationRate !== null && Number(breakdown.codCancellationRate) > 10) {
      desc += ` COD cancellation rate is ${breakdown.codCancellationRate}%.`;
    }
    insights.push({
      id: "cod_mix_insight",
      type: "warning",
      title: "High COD Payment Volume",
      description: desc,
    });
  } else if (Number(breakdown.prepaidPct || 0) >= 70) {
    insights.push({
      id: "prepaid_mix_insight",
      type: "positive",
      title: "Strong Prepaid Order Volume",
      description: `Prepaid orders represent ${breakdown.prepaidPct}% of total orders, minimizing operational delivery risk.`,
    });
  }

  // 3. Top Product Share Insight
  if (productMetrics.topSellingProduct && productMetrics.totalValue > 0) {
    const topProd = productMetrics.topSellingProduct;
    if (topProd.shareOfSales >= 25) {
      insights.push({
        id: "top_product_concentration",
        type: "opportunity",
        title: "Product Sales Concentration",
        description: `"${topProd.name}" contributes ${topProd.shareOfSales}% of total product sales (${formatCurrencyINR(topProd.value)}).`,
      });
    }
  }

  // 4. Repeat Purchase Rate Insight
  if (customerMetrics.repeatPurchaseRate >= 15) {
    insights.push({
      id: "repeat_purchase_positive",
      type: "positive",
      title: "Strong Repeat Customer Retention",
      description: `Repeat purchase rate is ${customerMetrics.repeatPurchaseRate}%, generating ${formatCurrencyINR(customerMetrics.returningRevenue)} in returning customer revenue.`,
    });
  }

  // 5. Period Comparison Insights (if comparison data exists)
  if (compareData && compareData.metricsMap) {
    const netSalesComp = compareData.metricsMap.net_sales;
    const aovComp = compareData.metricsMap.aov;

    if (netSalesComp && netSalesComp.percentageChange !== null && Math.abs(netSalesComp.percentageChange) >= 3) {
      const isUp = netSalesComp.percentageChange > 0;
      insights.push({
        id: "net_sales_period_growth",
        type: isUp ? "positive" : "warning",
        title: isUp ? "Net Sales Expansion" : "Net Sales Decline",
        description: `Net Sales ${isUp ? "increased" : "decreased"} by ${Math.abs(netSalesComp.percentageChange)}% compared with the previous equivalent period.`,
      });
    }

    if (aovComp && aovComp.percentageChange !== null && Math.abs(aovComp.percentageChange) >= 3) {
      const isUp = aovComp.percentageChange > 0;
      insights.push({
        id: "aov_period_shift",
        type: isUp ? "positive" : "opportunity",
        title: isUp ? "AOV Growth" : "AOV Contraction",
        description: `Average Order Value shifted by ${isUp ? "+" : ""}${aovComp.percentageChange}% vs previous period (now ${formatCurrencyINR(aovComp.valueA)}).`,
      });
    }
  }

  // Fallback if no specific condition met
  if (insights.length === 0) {
    insights.push({
      id: "stable_performance",
      type: "positive",
      title: "Stable Store Performance",
      description: "Store sales, order fulfillment, and payment distribution are performing steadily within normal parameters.",
    });
  }

  return insights;
};

/**
 * Single Canonical Calculation Utility for Shopify Overview & Business Dashboard metrics.
 */
export const calculateShopifyMetrics = ({ overviewData = [], ordersData = [], customersData = [] } = {}) => {
  const totals = calculateShopifyTotals(overviewData.length > 0 ? overviewData : ordersData);
  const totalOrders = totals.orders || ordersData.length || 0;
  const breakdown = calculateShopifyOrderBreakdown(ordersData, totalOrders);
  const customerMetrics = calculateShopifyCustomerMetrics(customersData);

  const hasOverviewData = Array.isArray(overviewData) && overviewData.length > 0;
  const hasOrdersData = Array.isArray(ordersData) && ordersData.length > 0;
  const hasCustomersData = Array.isArray(customersData) && customersData.length > 0;
  const hasAnyData = hasOverviewData || hasOrdersData || hasCustomersData;

  return {
    hasData: hasAnyData,
    totals,
    breakdown,
    customerMetrics,
    uniqueCustomers: customerMetrics.totalCustomers,
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
        subtitle: "All store orders",
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
        subtitle: "Unique customer accounts",
        value: hasAnyData ? formatNumber(customerMetrics.totalCustomers) : "—",
        rawValue: customerMetrics.totalCustomers,
        icon: Users,
        accentColor: "#0EA5E9",
      },
      prepaid: {
        id: "prepaid",
        title: "Prepaid Orders",
        label: "Prepaid Orders",
        value: hasAnyData ? formatCurrencyINR(breakdown.prepaidValue) : "—",
        subtitle: hasAnyData ? `${breakdown.prepaidCount} orders (${breakdown.prepaidPct}%)` : undefined,
        rawValue: breakdown.prepaidValue,
        icon: CreditCard,
        accentColor: "#16A34A",
      },
      cod: {
        id: "cod",
        title: "COD Orders",
        label: "COD Orders",
        value: hasAnyData ? formatCurrencyINR(breakdown.codValue) : "—",
        subtitle: hasAnyData
          ? breakdown.codCancellationRate !== null
            ? `${breakdown.codCount} orders (${breakdown.codPct}%) • COD Cancel: ${breakdown.codCancellationRate}%`
            : `${breakdown.codCount} orders (${breakdown.codPct}%)`
          : undefined,
        rawValue: breakdown.codValue,
        icon: Truck,
        accentColor: "#EAB308",
      },
      cancelled: {
        id: "cancelled",
        title: "Cancelled Orders",
        label: "Cancelled Orders",
        value: hasAnyData ? formatCurrencyINR(breakdown.cancelledValue) : "—",
        subtitle: hasAnyData ? `${breakdown.cancelledCount} orders (${breakdown.cancelledPct}% rate)` : undefined,
        rawValue: breakdown.cancelledValue,
        icon: XCircle,
        accentColor: "#DC2626",
      },
      aov: {
        id: "aov",
        title: "Average Order Value",
        label: "Average Order Value",
        value: hasAnyData && totals.aov !== null ? formatCurrencyINR(totals.aov) : "—",
        rawValue: totals.aov || 0,
        icon: Clock3,
        accentColor: "#0A84FF",
      },
    },
  };
};

/**
 * Calculates Canonical Shopify Inventory & Stock Alerts.
 * Strictly calculates "Inventory Retail Value = Quantity * Price".
 * Supports configurable low stock threshold (default 5).
 */
export const calculateShopifyInventory = (inventoryData = [], lowStockThreshold = 5) => {
  if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
    return {
      totalProducts: 0,
      totalUnits: 0,
      inStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inventoryRetailValue: 0,
      threshold: Number(lowStockThreshold) || 5,
      productList: [],
      alerts: [],
    };
  }

  const threshold = Number(lowStockThreshold) > 0 ? Number(lowStockThreshold) : 5;
  const productMap = {};

  inventoryData.forEach((row) => {
    const pId = row.line_item__product_id || row.line_item__sku || row.line_item__name || "unknown";
    const name = row.line_item__name || row.line_item__title || "Unnamed Product";
    const sku = row.line_item__sku || "N/A";
    const price = Number(row.line_item__price || row.line_item__product_price || 0);
    const qty = Number(row.line_item__quantity || 0);
    const isAvailable = row.line_item__variant_available_for_sale !== false;

    if (!productMap[pId]) {
      productMap[pId] = {
        id: pId,
        name,
        sku,
        price,
        quantity: qty,
        isAvailable,
      };
    } else {
      productMap[pId].quantity += qty;
      if (price > 0) productMap[pId].price = price;
    }
  });

  const productList = Object.values(productMap).map((p) => {
    const retailValue = p.quantity * p.price;
    let status = "In Stock";
    let statusSeverity = "normal";

    if (p.quantity === 0 || !p.isAvailable) {
      status = "Out of Stock";
      statusSeverity = "critical";
    } else if (p.quantity <= threshold) {
      status = "Low Stock";
      statusSeverity = "warning";
    }

    return {
      ...p,
      retailValue,
      status,
      statusSeverity,
    };
  });

  let totalUnits = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inventoryRetailValue = 0;
  const alerts = [];

  productList.forEach((p) => {
    totalUnits += p.quantity;
    inventoryRetailValue += p.retailValue;

    if (p.status === "Out of Stock") {
      outOfStockCount += 1;
      alerts.push({
        id: `alert-out-${p.id}`,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        threshold,
        severity: "CRITICAL",
        message: `Out of Stock: Product "${p.name}" has 0 inventory units.`,
      });
    } else if (p.status === "Low Stock") {
      lowStockCount += 1;
      alerts.push({
        id: `alert-low-${p.id}`,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        threshold,
        severity: "WARNING",
        message: `Low Stock: Product "${p.name}" has ${p.quantity} units (Threshold: ${threshold}).`,
      });
    } else {
      inStockCount += 1;
    }
  });

  return {
    totalProducts: productList.length,
    totalUnits,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    inventoryRetailValue,
    threshold,
    productList,
    alerts,
  };
};

/**
 * Calculates Canonical Payment Analysis (COD vs Prepaid Cancellation metrics) for P1C.
 * Implements strict mathematical reconciliation invariants:
 * - totalOrders = cod.totalOrders + prepaid.totalOrders + unclassified.totalOrders
 * - totalCancelledOrders = cod.cancelledOrders + prepaid.cancelledOrders + unclassified.cancelledOrders
 * - totalCancelledRevenue = cod.cancelledRevenue + prepaid.cancelledRevenue + unclassified.cancelledRevenue
 */
export const calculatePaymentAnalysis = (ordersData = []) => {
  if (!Array.isArray(ordersData) || ordersData.length === 0) {
    return {
      totalOrders: 0,
      totalCancelledOrders: 0,
      overallCancellationRate: 0,
      totalCancelledRevenue: 0,
      cod: {
        totalOrders: 0,
        orderShare: 0,
        cancelledOrders: 0,
        cancellationRate: 0,
        cancelledRevenue: 0,
      },
      prepaid: {
        totalOrders: 0,
        orderShare: 0,
        cancelledOrders: 0,
        cancellationRate: 0,
        cancelledRevenue: 0,
      },
      unclassified: {
        totalOrders: 0,
        orderShare: 0,
        cancelledOrders: 0,
        cancellationRate: 0,
        cancelledRevenue: 0,
      },
      hasPaymentData: false,
      insights: [],
    };
  }

  let totalCancelledCount = 0;
  let totalCancelledRevenue = 0;

  let codCount = 0;
  let codCancelledCount = 0;
  let codCancelledRevenue = 0;

  let prepaidCount = 0;
  let prepaidCancelledCount = 0;
  let prepaidCancelledRevenue = 0;

  let unclassifiedCount = 0;
  let unclassifiedCancelledCount = 0;
  let unclassifiedCancelledRevenue = 0;

  ordersData.forEach((order) => {
    const finStatus = (order.order_financial_status || "").toUpperCase();
    const orderNet = Number(
      order.order_net_sales !== undefined && order.order_net_sales !== null
        ? order.order_net_sales
        : order.order_total_price || 0
    );

    const isCancelled =
      (order.order_cancelled_at !== null &&
        order.order_cancelled_at !== undefined &&
        String(order.order_cancelled_at).trim() !== "") ||
      finStatus === "VOIDED" ||
      finStatus === "CANCELLED";

    if (isCancelled) {
      totalCancelledCount += 1;
      totalCancelledRevenue += Math.abs(orderNet);
    }

    // Determine Payment Classification
    let paymentType = "UNCLASSIFIED";

    // 1. Explicit gateway / payment method field if provided
    const gateway = (order.gateway || order.payment_gateway_names || order.payment_method || "").toLowerCase();
    if (gateway.includes("cod") || gateway.includes("cash")) {
      paymentType = "COD";
    } else if (
      gateway.includes("razorpay") ||
      gateway.includes("stripe") ||
      gateway.includes("prepaid") ||
      gateway.includes("card") ||
      gateway.includes("upi") ||
      gateway.includes("netbanking")
    ) {
      paymentType = "PREPAID";
    } else {
      // 2. Financial status for non-cancelled orders
      // Note: VOIDED/Cancelled orders lose financial status; if unclassified by gateway, they fall under UNCLASSIFIED
      if (finStatus === "PAID" && !isCancelled) {
        paymentType = "PREPAID";
      } else if (finStatus === "PENDING" && !isCancelled) {
        paymentType = "COD";
      }
    }

    if (paymentType === "PREPAID") {
      prepaidCount += 1;
      if (isCancelled) {
        prepaidCancelledCount += 1;
        prepaidCancelledRevenue += Math.abs(orderNet);
      }
    } else if (paymentType === "COD") {
      codCount += 1;
      if (isCancelled) {
        codCancelledCount += 1;
        codCancelledRevenue += Math.abs(orderNet);
      }
    } else {
      unclassifiedCount += 1;
      if (isCancelled) {
        unclassifiedCancelledCount += 1;
        unclassifiedCancelledRevenue += Math.abs(orderNet);
      }
    }
  });

  const totalStoreOrders = ordersData.length;
  const overallCancellationRate = totalStoreOrders > 0
    ? Number(((totalCancelledCount / totalStoreOrders) * 100).toFixed(1))
    : 0;

  const codShare = totalStoreOrders > 0
    ? Number(((codCount / totalStoreOrders) * 100).toFixed(1))
    : 0;

  const prepaidShare = totalStoreOrders > 0
    ? Number(((prepaidCount / totalStoreOrders) * 100).toFixed(1))
    : 0;

  const unclassifiedShare = totalStoreOrders > 0
    ? Number(((unclassifiedCount / totalStoreOrders) * 100).toFixed(1))
    : 0;

  const codCancellationRate = codCount > 0
    ? Number(((codCancelledCount / codCount) * 100).toFixed(1))
    : 0;

  const prepaidCancellationRate = prepaidCount > 0
    ? Number(((prepaidCancelledCount / prepaidCount) * 100).toFixed(1))
    : 0;

  const unclassifiedCancellationRate = unclassifiedCount > 0
    ? Number(((unclassifiedCancelledCount / unclassifiedCount) * 100).toFixed(1))
    : 0;

  // Deterministic Business Insights Generation
  const insights = [];

  if (unclassifiedCount > 0) {
    insights.push({
      id: "insight-unclassified-notice",
      type: "warning",
      title: "Unclassified Cancelled Orders Notice",
      description: `Payment method classification is unavailable for ${unclassifiedCount} orders (${unclassifiedCancelledCount} cancelled, accounting for ${formatCurrencyINR(unclassifiedCancelledRevenue)}). These orders are grouped under Unclassified Payments to maintain exact mathematical reconciliation.`,
    });
  }

  if (totalStoreOrders > 0 && (codCount > 0 || prepaidCount > 0)) {
    if (codCount > 0 && prepaidCount > 0) {
      const diff = codCancellationRate - prepaidCancellationRate;
      if (Math.abs(diff) < 1.0) {
        insights.push({
          id: "insight-rates-similar",
          type: "neutral",
          title: "Similar Cancellation Rates Across Classified Payment Methods",
          description: `COD orders (${codCancellationRate}%) and Prepaid orders (${prepaidCancellationRate}%) show comparable cancellation rates among classified orders.`,
        });
      } else if (diff > 0) {
        insights.push({
          id: "insight-cod-higher",
          type: "warning",
          title: "COD Cancellation Rate is Higher than Prepaid",
          description: `Classified COD orders have a ${codCancellationRate}% cancellation rate compared to ${prepaidCancellationRate}% for Prepaid orders.`,
        });
      } else {
        insights.push({
          id: "insight-prepaid-higher",
          type: "warning",
          title: "Prepaid Cancellation Rate is Higher than COD",
          description: `Classified Prepaid orders have a ${prepaidCancellationRate}% cancellation rate compared to ${codCancellationRate}% for COD orders.`,
        });
      }
    }
  }

  return {
    totalOrders: totalStoreOrders,
    totalCancelledOrders: totalCancelledCount,
    overallCancellationRate,
    totalCancelledRevenue,
    cod: {
      totalOrders: codCount,
      orderShare: codShare,
      cancelledOrders: codCancelledCount,
      cancellationRate: codCancellationRate,
      cancelledRevenue: codCancelledRevenue,
    },
    prepaid: {
      totalOrders: prepaidCount,
      orderShare: prepaidShare,
      cancelledOrders: prepaidCancelledCount,
      cancellationRate: prepaidCancellationRate,
      cancelledRevenue: prepaidCancelledRevenue,
    },
    unclassified: {
      totalOrders: unclassifiedCount,
      orderShare: unclassifiedShare,
      cancelledOrders: unclassifiedCancelledCount,
      cancellationRate: unclassifiedCancellationRate,
      cancelledRevenue: unclassifiedCancelledRevenue,
    },
    hasPaymentData: totalStoreOrders > 0,
    insights,
  };
};


