import {
  Wallet,
  Eye,
  ShoppingBag,
  DollarSign,
  IndianRupee,
  Users,
  MousePointer2,
  BarChart3,
  Tag,
  Target,
  TrendingUp,
  LineChart,
  Megaphone,
  Layers,
  PieChart,
} from "lucide-react";

/**
 * Centralized Meta Overview Dashboard Widget Registry.
 *
 * NOTE:
 * Do NOT hardcode analytics data here.
 * This configuration describes widget metadata, categories, icons, and default visibility only.
 */
export const DASHBOARD_WIDGETS = [
  // KPI Metrics (Cards)
  {
    id: "amount-spent",
    type: "metric",
    title: "Amount Spent",
    category: "KPI Metrics",
    description: "Total ad spend across connected accounts",
    icon: Wallet,
    enabledByDefault: true,
  },
  {
    id: "impressions",
    type: "metric",
    title: "Impressions",
    category: "KPI Metrics",
    description: "Total number of times ads were displayed",
    icon: Eye,
    enabledByDefault: true,
  },
  {
    id: "purchases",
    type: "metric",
    title: "Purchases",
    category: "KPI Metrics",
    description: "Total completed purchase actions",
    icon: ShoppingBag,
    enabledByDefault: true,
  },
  {
    id: "purchase-value",
    type: "metric",
    title: "Purchase Value",
    category: "KPI Metrics",
    description: "Total revenue generated from purchases",
    icon: IndianRupee,
    enabledByDefault: true,
  },
  {
    id: "reach",
    type: "metric",
    title: "Reach",
    category: "KPI Metrics",
    description: "Unique accounts reached by ads",
    icon: Users,
    enabledByDefault: false,
  },
  {
    id: "clicks",
    type: "metric",
    title: "Clicks",
    category: "KPI Metrics",
    description: "Total link clicks on ads",
    icon: MousePointer2,
    enabledByDefault: false,
  },
  {
    id: "ctr",
    type: "metric",
    title: "Average CTR",
    category: "KPI Metrics",
    description: "Click-through rate (Clicks / Impressions)",
    icon: BarChart3,
    enabledByDefault: false,
  },
  {
    id: "cpc",
    type: "metric",
    title: "Average CPC",
    category: "KPI Metrics",
    description: "Cost per link click",
    icon: Tag,
    enabledByDefault: false,
  },
  {
    id: "cost-per-purchase",
    type: "metric",
    title: "Cost per Purchase",
    category: "KPI Metrics",
    description: "Average ad spend per purchase action",
    icon: Target,
    enabledByDefault: false,
  },
  {
    id: "purchase-roas",
    type: "metric",
    title: "Purchase ROAS",
    category: "KPI Metrics",
    description: "Return on ad spend (Revenue / Spend)",
    icon: TrendingUp,
    enabledByDefault: false,
  },

  {
    id: "add-to-cart",
    type: "metric",
    title: "Add to Cart",
    category: "Conversion Funnel",
    description: "Total add to cart conversion actions",
    icon: ShoppingBag,
    enabledByDefault: false,
  },
  {
    id: "checkout-initiated",
    type: "metric",
    title: "Checkout Initiated",
    category: "Conversion Funnel",
    description: "Total checkout initiated conversion actions",
    icon: ShoppingBag,
    enabledByDefault: false,
  },
  {
    id: "unique-outbound-ctr",
    type: "metric",
    title: "Unique Outbound CTR",
    category: "Delivery & Efficiency",
    description: "Unique outbound click-through rate",
    icon: BarChart3,
    enabledByDefault: false,
  },
  {
    id: "cpm",
    type: "metric",
    title: "CPM",
    category: "Delivery & Efficiency",
    description: "Cost per thousand impressions",
    icon: Tag,
    enabledByDefault: false,
  },

  // Main Chart Section
  {
    id: "performance-trend",
    type: "chart",
    title: "Performance Trend",
    category: "Analytics & Trends",
    description: "Daily metric line chart with interactive selector",
    icon: LineChart,
    enabledByDefault: true,
  },

  // Lower Analytics Grid
  {
    id: "top-campaigns",
    type: "table",
    title: "Top Campaigns",
    category: "Breakdowns",
    description: "Top 5 campaigns ranked by ad spend",
    icon: Megaphone,
    enabledByDefault: true,
  },
  {
    id: "top-adsets",
    type: "table",
    title: "Top Ad Sets",
    category: "Breakdowns",
    description: "Top 5 ad sets ranked by ad spend",
    icon: Layers,
    enabledByDefault: true,
  },
  {
    id: "placements-breakdown",
    type: "breakdown",
    title: "Placements Breakdown",
    category: "Breakdowns",
    description: "Geographic / placement spend distribution donut chart",
    icon: PieChart,
    enabledByDefault: true,
  },
];

export const DEFAULT_WIDGET_IDS = DASHBOARD_WIDGETS.map((w) => w.id);
export const DEFAULT_VISIBLE_IDS = DASHBOARD_WIDGETS.filter((w) => w.enabledByDefault).map((w) => w.id);
