/**
 * Canonical Frontend Formula Registry Interface for Vytalis Intelligence (Phase 2 - Task #11).
 * Pure ESM exports matching the exact mathematical logic of Backend Formula Registry.
 *
 * ONE METRIC -> ONE CANONICAL FORMULA -> ONE DETERMINISTIC IMPLEMENTATION
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
 */
export const calculateShopifyNetSales = (inputs = {}) => {
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
 */
export const calculateShopifyAov = (inputs = {}) => {
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
 * formula.shopify.cancellation_rate
 * Mathematical Definition: (Cancelled Orders / Total Orders) * 100
 */
export const calculateShopifyCancellationRate = (inputs = {}) => {
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
export const calculateShopifyCodCancellationRate = (inputs = {}) => {
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
export const calculateShopifyFulfillmentRate = (inputs = {}) => {
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
 * formula.shopify.repeat_purchase_rate
 * Mathematical Definition: (Repeat Customers / Total Customers) * 100
 */
export const calculateRepeatPurchaseRate = (inputs = {}) => {
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
 * formula.shopify.share_of_sales
 * Mathematical Definition: (Entity Sales / Total Store Sales) * 100
 */
export const calculateShareOfSales = (inputs = {}) => {
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
