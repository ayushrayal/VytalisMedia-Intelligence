/**
 * Centralized Authoritative Formula Registry for Vytalis Intelligence (Phase 2 - Task #10).
 * Binds every derived/composite metric's formulaId to its canonical pure calculation function.
 *
 * ONE METRIC -> ONE CANONICAL FORMULA -> ONE DETERMINISTIC IMPLEMENTATION
 */

const { METRIC_REGISTRY } = require("./metric-registry.config");

const {
  calculateMetaCtr,
  calculateMetaCpc,
  calculateMetaCpm,
  calculateMetaFrequency,
  calculateMetaCpa,
  calculateMetaRoas,
} = require("../utils/formulas/meta-formulas.util");

const {
  calculateShopifyNetSales,
  calculateShopifyAov,
  calculateCustomerLifetimeAov,
  calculateShopifyPrepaidOrders,
  calculateShopifyPrepaidRevenue,
  calculateShopifyCodOrders,
  calculateShopifyCodRevenue,
  calculateShopifyCancelledOrders,
  calculateShopifyCancelledRevenue,
  calculateShopifyCancellationRate,
  calculateShopifyCodCancellationRate,
  calculateShopifyFulfillmentRate,
  calculateSingleOrderCustomers,
  calculateRepeatCustomers,
  calculateRepeatPurchaseRate,
  calculateReturningRevenue,
  calculateHighValueThreshold,
  calculateProductSales,
  calculateProductOrders,
  calculateShareOfSales,
  calculateInventoryRetailValue,
  calculateLowStockCount,
  calculateOutOfStockCount,
} = require("../utils/formulas/shopify-formulas.util");

const {
  calculateCohortSize,
  calculateCohortRetentionRate,
  calculateCohortRevenue,
} = require("../utils/formulas/cohort-formulas.util");

const {
  calculateAttributionTotalOrders,
  calculateAttributionNetRevenue,
  calculateAttributionPaidOrders,
  calculateAttributionOrganicOrders,
  calculateBlendedRoas,
  calculateBlendedCac,
} = require("../utils/formulas/attribution-formulas.util");

/**
 * Master Registry of Formulas
 */
const FORMULA_REGISTRY = {
  // META FORMULAS
  "formula.meta.ctr": {
    formulaId: "formula.meta.ctr",
    metricId: "meta.ctr",
    name: "Meta Click-Through Rate Formula",
    expression: "(clicks / impressions) * 100",
    requiredInputs: ["meta.clicks", "meta.impressions"],
    calculate: calculateMetaCtr,
  },
  "formula.meta.cpc": {
    formulaId: "formula.meta.cpc",
    metricId: "meta.cpc",
    name: "Meta Cost Per Click Formula",
    expression: "spend / clicks",
    requiredInputs: ["meta.spend", "meta.clicks"],
    calculate: calculateMetaCpc,
  },
  "formula.meta.cpm": {
    formulaId: "formula.meta.cpm",
    metricId: "meta.cpm",
    name: "Meta Cost Per Thousand Impressions Formula",
    expression: "(spend / impressions) * 1000",
    requiredInputs: ["meta.spend", "meta.impressions"],
    calculate: calculateMetaCpm,
  },
  "formula.meta.frequency": {
    formulaId: "formula.meta.frequency",
    metricId: "meta.frequency",
    name: "Meta Frequency Formula",
    expression: "impressions / reach",
    requiredInputs: ["meta.impressions", "meta.reach"],
    calculate: calculateMetaFrequency,
  },
  "formula.meta.cpa": {
    formulaId: "formula.meta.cpa",
    metricId: "meta.cpa",
    name: "Meta Cost Per Purchase (CPA) Formula",
    expression: "spend / purchases",
    requiredInputs: ["meta.spend", "meta.purchases"],
    calculate: calculateMetaCpa,
  },
  "formula.meta.roas": {
    formulaId: "formula.meta.roas",
    metricId: "meta.roas",
    name: "Meta Return on Ad Spend Formula",
    expression: "purchase_value / spend",
    requiredInputs: ["meta.purchase_value", "meta.spend"],
    calculate: calculateMetaRoas,
  },

  // SHOPIFY FORMULAS
  "formula.shopify.net_sales": {
    formulaId: "formula.shopify.net_sales",
    metricId: "shopify.net_sales",
    name: "Shopify Net Sales Formula",
    expression: "gross_sales - discounts - returns",
    requiredInputs: ["shopify.gross_sales", "shopify.discounts"],
    calculate: calculateShopifyNetSales,
  },
  "formula.shopify.aov": {
    formulaId: "formula.shopify.aov",
    metricId: "shopify.aov",
    name: "Shopify Average Order Value Formula",
    expression: "net_sales / orders_count",
    requiredInputs: ["shopify.net_sales", "shopify.orders_count"],
    calculate: calculateShopifyAov,
  },
  "formula.shopify.customer_lifetime_aov": {
    formulaId: "formula.shopify.customer_lifetime_aov",
    metricId: "shopify.customer_lifetime_aov",
    name: "Shopify Customer Lifetime AOV Formula",
    expression: "customer_total_spent / customer_orders_count",
    requiredInputs: [],
    calculate: calculateCustomerLifetimeAov,
  },
  "formula.shopify.prepaid_orders": {
    formulaId: "formula.shopify.prepaid_orders",
    metricId: "shopify.prepaid_orders",
    name: "Shopify Prepaid Orders Count Formula",
    expression: "count(orders where financial_status == PAID)",
    requiredInputs: ["shopify.orders_count"],
    calculate: calculateShopifyPrepaidOrders,
  },
  "formula.shopify.prepaid_revenue": {
    formulaId: "formula.shopify.prepaid_revenue",
    metricId: "shopify.prepaid_revenue",
    name: "Shopify Prepaid Orders Revenue Formula",
    expression: "sum(net_sales of prepaid orders)",
    requiredInputs: ["shopify.net_sales"],
    calculate: calculateShopifyPrepaidRevenue,
  },
  "formula.shopify.cod_orders": {
    formulaId: "formula.shopify.cod_orders",
    metricId: "shopify.cod_orders",
    name: "Shopify COD Orders Count Formula",
    expression: "count(orders where financial_status == PENDING)",
    requiredInputs: ["shopify.orders_count"],
    calculate: calculateShopifyCodOrders,
  },
  "formula.shopify.cod_revenue": {
    formulaId: "formula.shopify.cod_revenue",
    metricId: "shopify.cod_revenue",
    name: "Shopify COD Orders Revenue Formula",
    expression: "sum(net_sales of COD orders)",
    requiredInputs: ["shopify.net_sales"],
    calculate: calculateShopifyCodRevenue,
  },
  "formula.shopify.cancelled_orders": {
    formulaId: "formula.shopify.cancelled_orders",
    metricId: "shopify.cancelled_orders",
    name: "Shopify Cancelled Orders Count Formula",
    expression: "count(cancelled orders)",
    requiredInputs: ["shopify.orders_count"],
    calculate: calculateShopifyCancelledOrders,
  },
  "formula.shopify.cancelled_revenue": {
    formulaId: "formula.shopify.cancelled_revenue",
    metricId: "shopify.cancelled_revenue",
    name: "Shopify Cancelled Orders Revenue Formula",
    expression: "sum(net_sales of cancelled orders)",
    requiredInputs: ["shopify.net_sales"],
    calculate: calculateShopifyCancelledRevenue,
  },
  "formula.shopify.cancellation_rate": {
    formulaId: "formula.shopify.cancellation_rate",
    metricId: "shopify.cancellation_rate",
    name: "Shopify Cancellation Rate Formula",
    expression: "(cancelled_orders / orders_count) * 100",
    requiredInputs: ["shopify.cancelled_orders", "shopify.orders_count"],
    calculate: calculateShopifyCancellationRate,
  },
  "formula.shopify.cod_cancellation_rate": {
    formulaId: "formula.shopify.cod_cancellation_rate",
    metricId: "shopify.cod_cancellation_rate",
    name: "Shopify COD Cancellation Rate Formula",
    expression: "(cod_cancelled_orders / cod_orders) * 100",
    requiredInputs: ["shopify.cod_orders"],
    calculate: calculateShopifyCodCancellationRate,
  },
  "formula.shopify.fulfillment_rate": {
    formulaId: "formula.shopify.fulfillment_rate",
    metricId: "shopify.fulfillment_rate",
    name: "Shopify Order Fulfillment Rate Formula",
    expression: "(fulfilled_non_cancelled / total_non_cancelled) * 100",
    requiredInputs: ["shopify.orders_count", "shopify.cancelled_orders"],
    calculate: calculateShopifyFulfillmentRate,
  },
  "formula.shopify.single_order_customers": {
    formulaId: "formula.shopify.single_order_customers",
    metricId: "shopify.single_order_customers",
    name: "Shopify One-Time Customers Count Formula",
    expression: "count(customers where orders == 1)",
    requiredInputs: ["shopify.total_customers"],
    calculate: calculateSingleOrderCustomers,
  },
  "formula.shopify.repeat_customers": {
    formulaId: "formula.shopify.repeat_customers",
    metricId: "shopify.repeat_customers",
    name: "Shopify Repeat Customers Count Formula",
    expression: "count(customers where orders >= 2)",
    requiredInputs: ["shopify.total_customers"],
    calculate: calculateRepeatCustomers,
  },
  "formula.shopify.repeat_purchase_rate": {
    formulaId: "formula.shopify.repeat_purchase_rate",
    metricId: "shopify.repeat_purchase_rate",
    name: "Shopify Repeat Purchase Rate Formula",
    expression: "(repeat_customers / total_customers) * 100",
    requiredInputs: ["shopify.repeat_customers", "shopify.total_customers"],
    calculate: calculateRepeatPurchaseRate,
  },
  "formula.shopify.returning_revenue": {
    formulaId: "formula.shopify.returning_revenue",
    metricId: "shopify.returning_revenue",
    name: "Shopify Returning Customer Revenue Formula",
    expression: "sum(customer_total_spent for repeat_customers)",
    requiredInputs: ["shopify.repeat_customers"],
    calculate: calculateReturningRevenue,
  },
  "formula.shopify.high_value_threshold": {
    formulaId: "formula.shopify.high_value_threshold",
    metricId: "shopify.high_value_threshold",
    name: "Shopify High-Value Customer Threshold Formula",
    expression: "cutoff at top 10% positive spend customer rank",
    requiredInputs: ["shopify.total_customers"],
    calculate: calculateHighValueThreshold,
  },
  "formula.shopify.product_sales": {
    formulaId: "formula.shopify.product_sales",
    metricId: "shopify.product_sales",
    name: "Shopify Product Sales Formula",
    expression: "line_item_price * line_item_quantity",
    requiredInputs: [],
    calculate: calculateProductSales,
  },
  "formula.shopify.product_orders": {
    formulaId: "formula.shopify.product_orders",
    metricId: "shopify.product_orders",
    name: "Shopify Product Orders Count Formula",
    expression: "distinct_count(order_id containing product)",
    requiredInputs: [],
    calculate: calculateProductOrders,
  },
  "formula.shopify.share_of_sales": {
    formulaId: "formula.shopify.share_of_sales",
    metricId: "shopify.share_of_sales",
    name: "Shopify Share of Total Sales Formula",
    expression: "(entity_sales / total_store_sales) * 100",
    requiredInputs: ["shopify.net_sales"],
    calculate: calculateShareOfSales,
  },
  "formula.shopify.inventory_retail_value": {
    formulaId: "formula.shopify.inventory_retail_value",
    metricId: "shopify.inventory_retail_value",
    name: "Shopify Inventory Retail Value Formula",
    expression: "inventory_units * price",
    requiredInputs: ["shopify.inventory_units"],
    calculate: calculateInventoryRetailValue,
  },
  "formula.shopify.low_stock_count": {
    formulaId: "formula.shopify.low_stock_count",
    metricId: "shopify.low_stock_count",
    name: "Shopify Low Stock SKU Count Formula",
    expression: "count(SKUs where quantity <= threshold)",
    requiredInputs: ["shopify.inventory_units"],
    calculate: calculateLowStockCount,
  },
  "formula.shopify.out_of_stock_count": {
    formulaId: "formula.shopify.out_of_stock_count",
    metricId: "shopify.out_of_stock_count",
    name: "Shopify Out of Stock SKU Count Formula",
    expression: "count(SKUs where quantity == 0)",
    requiredInputs: ["shopify.inventory_units"],
    calculate: calculateOutOfStockCount,
  },

  // COHORT FORMULAS
  "formula.cohort.size": {
    formulaId: "formula.cohort.size",
    metricId: "cohort.size",
    name: "Cohort Acquisition Size Formula",
    expression: "count(initial buyers in cohort grouping)",
    requiredInputs: [],
    calculate: calculateCohortSize,
  },
  "formula.cohort.retention_rate": {
    formulaId: "formula.cohort.retention_rate",
    metricId: "cohort.retention_rate",
    name: "Cohort Retention Rate Formula",
    expression: "isMature ? (retained_customers / cohort_size) * 100 : null",
    requiredInputs: ["cohort.size"],
    calculate: calculateCohortRetentionRate,
  },
  "formula.cohort.revenue": {
    formulaId: "formula.cohort.revenue",
    metricId: "cohort.revenue",
    name: "Cohort Repeat Sales Revenue Formula",
    expression: "isMature ? sum(repeat sales in period) : null",
    requiredInputs: ["cohort.size"],
    calculate: calculateCohortRevenue,
  },

  // ATTRIBUTION & COMPOSITE FORMULAS
  "formula.attribution.total_orders": {
    formulaId: "formula.attribution.total_orders",
    metricId: "attribution.total_orders",
    name: "Attribution Total Classified Orders Formula",
    expression: "sum(classified orders across 7 channels)",
    requiredInputs: ["shopify.orders_count"],
    calculate: calculateAttributionTotalOrders,
  },
  "formula.attribution.net_revenue": {
    formulaId: "formula.attribution.net_revenue",
    metricId: "attribution.net_revenue",
    name: "Attribution Net Revenue Formula",
    expression: "sum(classified net sales across 7 channels)",
    requiredInputs: ["shopify.net_sales"],
    calculate: calculateAttributionNetRevenue,
  },
  "formula.attribution.paid_orders": {
    formulaId: "formula.attribution.paid_orders",
    metricId: "attribution.paid_orders",
    name: "Attribution Paid Channels Orders Formula",
    expression: "sum(orders in paid channels)",
    requiredInputs: ["attribution.total_orders"],
    calculate: calculateAttributionPaidOrders,
  },
  "formula.attribution.organic_orders": {
    formulaId: "formula.attribution.organic_orders",
    metricId: "attribution.organic_orders",
    name: "Attribution Organic Channels Orders Formula",
    expression: "sum(orders in organic/direct channels)",
    requiredInputs: ["attribution.total_orders"],
    calculate: calculateAttributionOrganicOrders,
  },
  "formula.composite.blended_roas": {
    formulaId: "formula.composite.blended_roas",
    metricId: "composite.blended_roas",
    name: "Blended Return on Ad Spend Formula",
    expression: "shopify.net_sales / meta.spend",
    requiredInputs: ["shopify.net_sales", "meta.spend"],
    calculate: calculateBlendedRoas,
  },
  "formula.composite.blended_cac": {
    formulaId: "formula.composite.blended_cac",
    metricId: "composite.blended_cac",
    name: "Blended Customer Acquisition Cost Formula",
    expression: "meta.spend / shopify.orders_count",
    requiredInputs: ["meta.spend", "shopify.orders_count"],
    calculate: calculateBlendedCac,
  },
};

/**
 * Resolves a formula entry by formulaId.
 */
function resolveFormula(formulaId) {
  if (!formulaId || typeof formulaId !== "string") return null;
  return FORMULA_REGISTRY[formulaId] || null;
}

/**
 * Executes a formula calculation deterministically.
 */
function executeFormula(formulaId, inputs = {}) {
  const entry = resolveFormula(formulaId);
  if (!entry || typeof entry.calculate !== "function") {
    return {
      value: null,
      status: "invalid_formula",
      reason: `FormulaId '${formulaId}' not found or has no valid calculate function`,
    };
  }
  return entry.calculate(inputs);
}

/**
 * Validates Formula Registry 1-to-1 linkage against Metric Registry.
 */
function validateFormulaRegistryIntegrity() {
  const metricEntries = Object.values(METRIC_REGISTRY);
  const derivedMetrics = metricEntries.filter((m) => m.type === "derived" || m.type === "composite");

  derivedMetrics.forEach((m) => {
    if (!m.formulaId) {
      throw new Error(`[Formula Registry Error] Metric '${m.id}' of type '${m.type}' missing formulaId`);
    }

    const formulaEntry = FORMULA_REGISTRY[m.formulaId];
    if (!formulaEntry) {
      throw new Error(`[Formula Registry Error] Metric '${m.id}' references unmapped formulaId '${m.formulaId}'`);
    }

    if (formulaEntry.metricId !== m.id) {
      throw new Error(`[Formula Registry Error] Formula '${m.formulaId}' metricId '${formulaEntry.metricId}' does not match metric '${m.id}'`);
    }

    if (typeof formulaEntry.calculate !== "function") {
      throw new Error(`[Formula Registry Error] Formula '${m.formulaId}' missing calculate function`);
    }
  });

  // Verify reverse linkage: Every formula in FORMULA_REGISTRY maps to a valid metric
  Object.keys(FORMULA_REGISTRY).forEach((fid) => {
    const fEntry = FORMULA_REGISTRY[fid];
    const metricEntry = METRIC_REGISTRY[fEntry.metricId];
    if (!metricEntry) {
      throw new Error(`[Formula Registry Error] Formula '${fid}' maps to non-existent metricId '${fEntry.metricId}'`);
    }
  });

  return true;
}

// Perform initialization validation
validateFormulaRegistryIntegrity();

module.exports = {
  FORMULA_REGISTRY,
  resolveFormula,
  executeFormula,
  validateFormulaRegistryIntegrity,
};
