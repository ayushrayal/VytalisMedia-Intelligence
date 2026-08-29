/**
 * Field definitions and configuration for Shopify data endpoints.
 * SOLE OWNER of Shopify Windsor field lists and allowed date presets.
 */

const ALLOWED_SHOPIFY_PRESETS = ["last_7d", "last_30d", "last_90d", "last_year", "this_month"];

const SHOPIFY_ENDPOINTS = {
  overview: {
    key: "overview",
    adapterMethod: "fetchOverview",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_created_at",
      "order_gross_sales",
      "order_net_sales",
      "order_count",
      "order_total_count",
      "order_quantity",
      "order_total_discounts",
      "order_total_price",
    ],
  },
  orders: {
    key: "orders",
    adapterMethod: "fetchOrders",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_id",
      "order_name",
      "order_created_at",
      "order_customer_id",
      "order_email",
      "order_financial_status",
      "order_fulfillment_status",
      "order_fulfillable",
      "order_fully_paid",
      "order_unpaid",
      "order_gross_sales",
      "order_net_sales",
      "order_total_price",
      "order_total_discounts",
      "order_total_tax_amount",
      "order_quantity",
      "order_cancelled_at",
    ],
  },
  products: {
    key: "products",
    adapterMethod: "fetchProducts",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_id",
      "order_created_at",
      "line_item__product_id",
      "line_item__name",
      "line_item__title",
      "line_item__quantity",
      "line_item__price",
      "line_item__product_price",
      "line_item__sku",
      "line_item__variant_available_for_sale",
      "sku",
    ],
  },
  customers: {
    key: "customers",
    adapterMethod: "fetchCustomers",
    baseTtl: 300,
    fields: [
      "account_name",
      "customer_id",
      "customer_email",
      "customer_first_name",
      "customer_last_name",
      "customer_total_spent",
      "customer_orders_count",
    ],
  },
  location: {
    key: "location",
    adapterMethod: "fetchLocation",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_id",
      "order_created_at",
      "order_total_price",
      "order_net_sales",
      "order_quantity",
      "order_shipping_address_city",
      "order_shipping_address_province",
      "order_shipping_address_zip",
    ],
  },
  inventory: {
    key: "inventory",
    adapterMethod: "fetchInventory",
    baseTtl: 300,
    fields: [
      "account_name",
      "line_item__product_id",
      "line_item__name",
      "line_item__title",
      "line_item__quantity",
      "line_item__price",
      "line_item__product_price",
      "line_item__sku",
      "line_item__variant_available_for_sale",
    ],
  },
  refunds: {
    key: "refunds",
    adapterMethod: "fetchRefunds",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_id",
      "order_name",
      "order_created_at",
      "order_financial_status",
      "order_fulfillment_status",
      "order_gross_sales",
      "order_net_sales",
      "order_total_price",
      "order_shipping_address_city",
      "order_shipping_address_province",
    ],
  },
  cohorts: {
    key: "cohorts",
    adapterMethod: "fetchCohorts",
    baseTtl: 300,
    fields: [
      "account_name",
      "order_id",
      "order_created_at",
      "order_customer_id",
      "order_net_sales",
    ],
  },
};

const ALLOWED_SHOPIFY_ENDPOINTS = Object.keys(SHOPIFY_ENDPOINTS);

module.exports = {
  ALLOWED_SHOPIFY_PRESETS,
  SHOPIFY_ENDPOINTS,
  ALLOWED_SHOPIFY_ENDPOINTS,
};
