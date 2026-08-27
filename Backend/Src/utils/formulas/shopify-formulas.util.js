/**
 * Pure Canonical Formula Implementations for Shopify Analytics (Phase 2 - Task #10).
 * Deterministic, side-effect free calculation functions for Shopify derived metrics.
 */

const parseNumericInput = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
};

/**
 * formula.shopify.net_sales
 * Mathematical Definition: Gross Sales - Discounts - Returns
 * Required Inputs: gross_sales, discounts, returns (optional, default 0)
 */
const calculateShopifyNetSales = (inputs = {}) => {
  const grossSales = parseNumericInput(inputs.gross_sales ?? inputs["shopify.gross_sales"]);
  const discounts = parseNumericInput(inputs.discounts ?? inputs["shopify.discounts"]) ?? 0;
  const returnsVal = parseNumericInput(inputs.returns ?? inputs["shopify.returns"]) ?? 0;

  if (grossSales === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric gross_sales input" };
  }

  const netSales = grossSales - discounts - returnsVal;
  return { value: netSales, status: netSales === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.aov
 * Mathematical Definition: Date-Bounded Net Sales / Date-Bounded Orders Count
 * Required Inputs: net_sales, orders_count
 */
const calculateShopifyAov = (inputs = {}) => {
  const netSales = parseNumericInput(inputs.net_sales ?? inputs["shopify.net_sales"]);
  const ordersCount = parseNumericInput(inputs.orders_count ?? inputs["shopify.orders_count"]);

  if (netSales === null || ordersCount === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric net_sales/orders_count input" };
  }

  if (ordersCount <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because zero store orders were placed in date range" };
  }

  if (netSales === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero AOV (orders > 0, netSales = 0)" };
  }

  const aov = netSales / ordersCount;
  return { value: aov, status: "valid", reason: null };
};

/**
 * formula.shopify.customer_lifetime_aov
 * Mathematical Definition: Customer Lifetime Total Spent / Customer Lifetime Orders Count
 * Required Inputs: customer_total_spent, customer_orders_count
 */
const calculateCustomerLifetimeAov = (inputs = {}) => {
  const totalSpent = parseNumericInput(inputs.customer_total_spent ?? inputs.total_spent);
  const ordersCount = parseNumericInput(inputs.customer_orders_count ?? inputs.orders_count);

  if (totalSpent === null || ordersCount === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric customer lifetime spent/orders input" };
  }

  if (ordersCount <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable for customers with zero past orders" };
  }

  const aov = totalSpent / ordersCount;
  return { value: aov, status: aov === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.prepaid_orders
 * Inputs: ordersData array or prepaidCount
 */
const calculateShopifyPrepaidOrders = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let count = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      if (status === "PAID" || order.order_fully_paid === true) {
        count += 1;
      }
    });
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.prepaid_orders ?? inputs.prepaidCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing prepaid orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.prepaid_revenue
 */
const calculateShopifyPrepaidRevenue = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let rev = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      if (status === "PAID" || order.order_fully_paid === true) {
        rev += Number(order.order_net_sales !== undefined && order.order_net_sales !== null ? order.order_net_sales : order.order_total_price || 0);
      }
    });
    return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
  }

  const rev = parseNumericInput(inputs.prepaid_revenue ?? inputs.prepaidValue);
  if (rev === null) {
    return { value: null, status: "invalid_input", reason: "Missing prepaid revenue input" };
  }
  return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.cod_orders
 */
const calculateShopifyCodOrders = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let count = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      if (status === "PENDING" || order.order_unpaid === true) {
        count += 1;
      }
    });
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.cod_orders ?? inputs.codCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing COD orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.cod_revenue
 */
const calculateShopifyCodRevenue = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let rev = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      if (status === "PENDING" || order.order_unpaid === true) {
        rev += Number(order.order_net_sales !== undefined && order.order_net_sales !== null ? order.order_net_sales : order.order_total_price || 0);
      }
    });
    return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
  }

  const rev = parseNumericInput(inputs.cod_revenue ?? inputs.codValue);
  if (rev === null) {
    return { value: null, status: "invalid_input", reason: "Missing COD revenue input" };
  }
  return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.cancelled_orders
 */
const calculateShopifyCancelledOrders = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let count = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      const isCancelled =
        (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") ||
        status === "VOIDED" ||
        status === "CANCELLED";
      if (isCancelled) count += 1;
    });
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.cancelled_orders ?? inputs.cancelledCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing cancelled orders input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.cancelled_revenue
 */
const calculateShopifyCancelledRevenue = (inputs = {}) => {
  if (Array.isArray(inputs.ordersData)) {
    let rev = 0;
    inputs.ordersData.forEach((order) => {
      const status = (order.order_financial_status || "").toUpperCase();
      const isCancelled =
        (order.order_cancelled_at !== null && order.order_cancelled_at !== undefined && String(order.order_cancelled_at).trim() !== "") ||
        status === "VOIDED" ||
        status === "CANCELLED";
      if (isCancelled) {
        rev += Math.abs(Number(order.order_net_sales !== undefined && order.order_net_sales !== null ? order.order_net_sales : order.order_total_price || 0));
      }
    });
    return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
  }

  const rev = parseNumericInput(inputs.cancelled_revenue ?? inputs.cancelledValue);
  if (rev === null) {
    return { value: null, status: "invalid_input", reason: "Missing cancelled revenue input" };
  }
  return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.cancellation_rate
 * Mathematical Definition: (Cancelled Orders / Total Orders) * 100
 */
const calculateShopifyCancellationRate = (inputs = {}) => {
  const cancelledOrders = parseNumericInput(inputs.cancelled_orders ?? inputs["shopify.cancelled_orders"]);
  const ordersCount = parseNumericInput(inputs.orders_count ?? inputs["shopify.orders_count"]);

  if (cancelledOrders === null || ordersCount === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric cancelled_orders/orders_count input" };
  }

  if (ordersCount <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because zero store orders exist in date range" };
  }

  if (cancelledOrders === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero cancellation rate (0 cancellations out of orders)" };
  }

  const rate = (cancelledOrders / ordersCount) * 100;
  return { value: rate, status: "valid", reason: null };
};

/**
 * formula.shopify.cod_cancellation_rate
 * Mathematical Definition: (COD Cancelled Orders / Total COD Orders) * 100
 */
const calculateShopifyCodCancellationRate = (inputs = {}) => {
  const codCancelled = parseNumericInput(inputs.cod_cancelled_orders ?? inputs.codCancelledCount);
  const codOrders = parseNumericInput(inputs.cod_orders ?? inputs["shopify.cod_orders"]);

  if (codCancelled === null || codOrders === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric cod_cancelled_orders/cod_orders input" };
  }

  if (codOrders <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because zero COD orders were placed in date range" };
  }

  if (codCancelled === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero COD cancellation rate (0 COD cancellations out of COD orders)" };
  }

  const rate = (codCancelled / codOrders) * 100;
  return { value: rate, status: "valid", reason: null };
};

/**
 * formula.shopify.fulfillment_rate
 * Mathematical Definition: (Fulfilled Non-Cancelled / Total Non-Cancelled) * 100
 */
const calculateShopifyFulfillmentRate = (inputs = {}) => {
  const fulfilledCount = parseNumericInput(inputs.fulfilled_orders ?? inputs.fulfilledCount);
  const nonCancelledCount = parseNumericInput(inputs.non_cancelled_orders ?? inputs.nonCancelledCount);

  if (fulfilledCount === null || nonCancelledCount === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric fulfilled/non_cancelled orders input" };
  }

  if (nonCancelledCount <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because zero non-cancelled orders exist" };
  }

  if (fulfilledCount === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero fulfillment rate" };
  }

  const rate = (fulfilledCount / nonCancelledCount) * 100;
  return { value: rate, status: "valid", reason: null };
};

/**
 * formula.shopify.single_order_customers
 */
const calculateSingleOrderCustomers = (inputs = {}) => {
  if (Array.isArray(inputs.customersData)) {
    const count = inputs.customersData.filter((c) => Number(c.customer_orders_count || 1) === 1).length;
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.single_order_customers ?? inputs.singleOrderCustomers);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing single_order_customers input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.repeat_customers
 */
const calculateRepeatCustomers = (inputs = {}) => {
  if (Array.isArray(inputs.customersData)) {
    const count = inputs.customersData.filter((c) => Number(c.customer_orders_count || 1) >= 2).length;
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.repeat_customers ?? inputs.repeatCustomers);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing repeat_customers input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.repeat_purchase_rate
 * Mathematical Definition: (Repeat Customers / Total Customers) * 100
 */
const calculateRepeatPurchaseRate = (inputs = {}) => {
  const repeatCustomers = parseNumericInput(inputs.repeat_customers ?? inputs["shopify.repeat_customers"]);
  const totalCustomers = parseNumericInput(inputs.total_customers ?? inputs["shopify.total_customers"]);

  if (repeatCustomers === null || totalCustomers === null) {
    return { value: null, status: "invalid_input", reason: "Missing or non-numeric repeat_customers/total_customers input" };
  }

  if (totalCustomers <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because total customer count is zero" };
  }

  if (repeatCustomers === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero repeat purchase rate (0 repeat customers)" };
  }

  const rate = (repeatCustomers / totalCustomers) * 100;
  return { value: rate, status: "valid", reason: null };
};

/**
 * formula.shopify.returning_revenue
 */
const calculateReturningRevenue = (inputs = {}) => {
  if (Array.isArray(inputs.customersData)) {
    let rev = 0;
    inputs.customersData.forEach((c) => {
      if (Number(c.customer_orders_count || 1) >= 2) {
        rev += Number(c.customer_total_spent || 0);
      }
    });
    return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
  }

  const rev = parseNumericInput(inputs.returning_revenue ?? inputs.returningRevenue);
  if (rev === null) {
    return { value: null, status: "invalid_input", reason: "Missing returning_revenue input" };
  }
  return { value: rev, status: rev === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.high_value_threshold
 * Top 10% spend cutoff amount among positive spend customers
 */
const calculateHighValueThreshold = (inputs = {}) => {
  if (Array.isArray(inputs.customersData)) {
    const positive = inputs.customersData
      .map((c) => Number(c.customer_total_spent || 0))
      .filter((s) => s > 0)
      .sort((a, b) => b - a);

    if (positive.length === 0) {
      return { value: 0, status: "zero", reason: "Zero positive spend customers found" };
    }

    const count = Math.max(1, Math.ceil(positive.length * 0.10));
    const threshold = positive[count - 1] || 0;
    return { value: threshold, status: "valid", reason: null };
  }

  const val = parseNumericInput(inputs.high_value_threshold ?? inputs.highValueThreshold);
  if (val === null) {
    return { value: null, status: "invalid_input", reason: "Missing high_value_threshold input" };
  }
  return { value: val, status: val === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.product_sales
 * Mathematical Definition: Quantity * Unit Price
 */
const calculateProductSales = (inputs = {}) => {
  const qty = parseNumericInput(inputs.quantity ?? inputs.line_item__quantity) ?? 1;
  const price = parseNumericInput(inputs.price ?? inputs.line_item__price ?? inputs.line_item__product_price);

  if (price === null) {
    return { value: null, status: "invalid_input", reason: "Missing product line item price input" };
  }

  const sales = qty * price;
  return { value: sales, status: sales === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.product_orders
 * Distinct orders count containing product
 */
const calculateProductOrders = (inputs = {}) => {
  const count = parseNumericInput(inputs.distinct_orders ?? inputs.orderCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing product order count input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.share_of_sales
 * Mathematical Definition: (Entity Sales / Total Store Sales) * 100
 */
const calculateShareOfSales = (inputs = {}) => {
  const entitySales = parseNumericInput(inputs.entity_sales ?? inputs.value);
  const totalSales = parseNumericInput(inputs.total_sales ?? inputs["shopify.net_sales"]);

  if (entitySales === null || totalSales === null) {
    return { value: null, status: "invalid_input", reason: "Missing entity_sales or total_sales input" };
  }

  if (totalSales <= 0) {
    return { value: null, status: "unavailable", reason: "Unavailable because total store sales equal zero" };
  }

  if (entitySales === 0) {
    return { value: 0.0, status: "zero", reason: "Valid zero share of sales (0 entity sales)" };
  }

  const share = (entitySales / totalSales) * 100;
  return { value: share, status: "valid", reason: null };
};

/**
 * formula.shopify.inventory_retail_value
 * Mathematical Definition: Inventory Units * Unit Price
 */
const calculateInventoryRetailValue = (inputs = {}) => {
  const units = parseNumericInput(inputs.units ?? inputs["shopify.inventory_units"] ?? inputs.quantity);
  const price = parseNumericInput(inputs.price ?? inputs.line_item__price);

  if (units === null || price === null) {
    return { value: null, status: "invalid_input", reason: "Missing inventory units or price input" };
  }

  const retailVal = units * price;
  return { value: retailVal, status: retailVal === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.low_stock_count
 */
const calculateLowStockCount = (inputs = {}) => {
  if (Array.isArray(inputs.inventoryData)) {
    const threshold = Number(inputs.threshold || 5);
    const count = inputs.inventoryData.filter((row) => {
      const q = Number(row.line_item__quantity || 0);
      return q > 0 && q <= threshold;
    }).length;
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.low_stock_count ?? inputs.lowStockCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing low stock count input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

/**
 * formula.shopify.out_of_stock_count
 */
const calculateOutOfStockCount = (inputs = {}) => {
  if (Array.isArray(inputs.inventoryData)) {
    const count = inputs.inventoryData.filter((row) => Number(row.line_item__quantity || 0) === 0).length;
    return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
  }

  const count = parseNumericInput(inputs.out_of_stock_count ?? inputs.outOfStockCount);
  if (count === null) {
    return { value: null, status: "invalid_input", reason: "Missing out of stock count input" };
  }
  return { value: count, status: count === 0 ? "zero" : "valid", reason: null };
};

module.exports = {
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
};

module.exports.default = module.exports;
