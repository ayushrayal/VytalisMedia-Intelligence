import React from "react";
import MetricCard from "../../../components/ui/MetricCard.jsx";
import { formatMetric } from "../utils/attribution.js";
import { ShoppingCart, DollarSign, TrendingUp, Target } from "lucide-react";

/**
 * AttributionSummary Component.
 * Top KPI Metrics Row displaying Total Orders, Gross Revenue, Net Revenue, and Attributed Revenue.
 */
export const AttributionSummary = ({ overall = {}, groups = {}, currency = "INR" }) => {
  const totalOrders = overall.totalOrders ?? null;
  const grossRevenue = overall.grossRevenue ?? null;
  const netRevenue = overall.netRevenue ?? null;

  // Calculate Attributed Revenue = Meta Revenue + Google Revenue
  const metaRevenue = groups.meta?.netRevenue || 0;
  const googleRevenue = groups.google?.netRevenue || 0;
  const attributedRevenue =
    netRevenue !== null ? Number((metaRevenue + googleRevenue).toFixed(2)) : null;

  const attributedPercentage =
    netRevenue && netRevenue > 0 && attributedRevenue !== null
      ? ((attributedRevenue / netRevenue) * 100).toFixed(1)
      : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <MetricCard
        title="Total Orders"
        value={formatMetric(totalOrders, "number")}
        subtitle="All Shopify orders in period"
        icon={ShoppingCart}
        accentColor="#0A84FF"
      />

      <MetricCard
        title="Gross Revenue"
        value={formatMetric(grossRevenue, "currency", currency)}
        subtitle="Total sales value before deductions"
        icon={DollarSign}
        accentColor="#2563EB"
      />

      <MetricCard
        title="Net Revenue"
        value={formatMetric(netRevenue, "currency", currency)}
        subtitle="Net sales revenue after refunds/discounts"
        icon={TrendingUp}
        accentColor="#16A34A"
      />

      <MetricCard
        title="Attributed Revenue"
        value={formatMetric(attributedRevenue, "currency", currency)}
        subtitle={
          attributedPercentage !== null
            ? `${attributedPercentage}% of Net Revenue (Meta + Google)`
            : "Paid channel attributed revenue"
        }
        icon={Target}
        accentColor="#9333EA"
      />
    </div>
  );
};

export default AttributionSummary;
