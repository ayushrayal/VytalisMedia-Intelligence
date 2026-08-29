const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../../..");

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".git" || file === "dist" || file === "build") continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(rootDir);

const fieldsToAudit = {
  shopify_overview: [
    "account_name",
    "shop_name",
    "order_created_at",
    "order_gross_sales",
    "order_net_sales",
    "order_count",
    "order_total_count",
    "order_quantity",
    "order_total_discounts",
    "order_total_tax_amount",
    "order_total_price",
    "order_current_total_price",
    "order_financial_status",
    "order_fully_paid",
    "order_unpaid",
    "order_total_outstanding_amount",
    "order_new_or_returning_customer",
    "order_customer_has_multiple_orders",
  ],
  shopify_orders: [
    "account_name",
    "shop_name",
    "order_id",
    "order_name",
    "order_created_at",
    "order_processed_at",
    "order_updated_at",
    "order_customer_id",
    "order_email",
    "order_customer_number_of_orders",
    "order_new_or_returning_customer",
    "order_customer_has_multiple_orders",
    "order_financial_status",
    "order_fulfillment_status",
    "order_fulfillable",
    "order_closed",
    "order_closed_at",
    "order_fully_paid",
    "order_unpaid",
    "order_test",
    "order_gross_sales",
    "order_net_sales",
    "order_subtotal_price",
    "order_current_subtotal_price",
    "order_total_price",
    "order_total_price_amount",
    "order_current_total_price",
    "order_original_price",
    "order_total_discounts",
    "order_current_total_discounts",
    "order_total_tax_amount",
    "order_quantity",
    "order_payment_references",
    "order_total_outstanding_amount",
    "order_total_capturable_amount",
    "order_app_name",
    "order_cancel_reason",
    "order_cancelled_at",
    "order_currency",
    "order_presentment_currency",
  ],
  shopify_products: [
    "account_name",
    "order_id",
    "order_created_at",
    "line_item__product_id",
    "line_item__name",
    "line_item__title",
    "line_item__quantity",
    "line_item__price",
    "line_item__product_price",
    "line_item__total_discount",
    "line_item__sku",
    "line_item__variant_available_for_sale",
    "line_item__variant_barcode",
    "line_item__variant_compare_at_price",
    "line_item__variant_display_name",
    "variant_title",
    "sku",
  ],
  shopify_customers: [
    "account_name",
    "shop_name",
    "customer_id",
    "customer_email",
    "customer_created_at",
    "customer_updated_at",
    "customer_date",
    "customer_first_name",
    "customer_last_name",
    "customer_state",
    "customer_total_spent",
    "customer_aov",
    "customer_orders_count",
    "customer_verified_email",
    "customer_phone",
    "customer_currency",
    "customer_last_order_id",
    "customer_last_order_name",
    "customer_note",
    "customer_tags",
    "customer_tax_exempt",
  ],
  shopify_location: [
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
  shopify_inventory: [
    "account_name",
    "line_item__product_id",
    "line_item__name",
    "line_item__title",
    "line_item__quantity",
    "line_item__price",
    "line_item__product_price",
    "line_item__total_discount",
    "line_item__sku",
    "line_item__variant_available_for_sale",
    "line_item__variant_compare_at_price",
  ],
  shopify_refunds: [
    "account_name",
    "shop_name",
    "order_id",
    "order_name",
    "order_created_at",
    "order_processed_at",
    "order_financial_status",
    "order_fulfillment_status",
    "order_gross_sales",
    "order_net_sales",
    "order_total_price",
    "order_shipping_address_city",
    "order_shipping_address_province",
  ],
  shopify_cohorts: [
    "account_name",
    "order_id",
    "order_created_at",
    "order_customer_id",
    "order_net_sales",
  ],
  attribution: [
    "account_name",
    "order_id",
    "order_created_at",
    "order_net_sales",
    "order_gross_sales",
    "order_total_price",
    "order_financial_status",
    "order_custom_attributes",
  ],
  meta_overview: [
    "date",
    "currency",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ],
  meta_campaigns: [
    "campaign",
    "campaign_id",
    "campaign_status",
    "campaign_effective_status",
    "campaign_objective",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ],
  meta_adsets: [
    "adset_name",
    "adset_id",
    "campaign",
    "campaign_id",
    "effective_status",
    "adset_status",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ],
  meta_creatives: [
    "date",
    "currency",
    "campaign",
    "campaign_id",
    "adset_name",
    "adset_id",
    "ad_name",
    "ad_id",
    "effective_status",
    "thumbnail_url",
    "image_url",
    "video_id",
    "object_story_spec",
    "facebook_permalink_url",
    "instagram_permalink_url",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "actions_video_view",
    "video_play_actions_video_view",
    "video_thruplay_watched_actions_video_view",
    "video_p25_watched_actions_video_view",
    "video_p50_watched_actions_video_view",
    "video_p75_watched_actions_video_view",
    "video_p95_watched_actions_video_view",
    "video_p100_watched_actions_video_view",
    "video_avg_time_watched_actions_video_view",
    "actions_omni_purchase",
    "action_values_omni_purchase",
    "cost_per_action_type_omni_purchase",
    "purchase_roas_omni_purchase",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "unique_outbound_clicks_ctr_outbound_click",
  ],
  meta_audience: [
    "age",
    "gender",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
    "actions_add_to_cart",
    "actions_initiate_checkout",
    "actions_purchase",
    "action_values_purchase",
  ],
  meta_places: [
    "country",
    "region",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "frequency",
    "currency",
  ],
};

const results = {};

for (const [group, fields] of Object.entries(fieldsToAudit)) {
  results[group] = {};
  for (const field of fields) {
    results[group][field] = [];
    for (const file of allFiles) {
      const relPath = path.relative(rootDir, file);
      if (
        relPath.includes("shopify-endpoints.config.js") ||
        relPath.includes("attribution-constants.config.js") ||
        relPath.includes("facebook.adapter.js") ||
        relPath.includes("audit-fields.js")
      ) {
        continue;
      }
      const content = fs.readFileSync(file, "utf8");
      if (content.includes(field)) {
        results[group][field].push(relPath);
      }
    }
  }
}

console.log("=== FIELD USAGE SEARCH SUMMARY ===");
for (const [group, fields] of Object.entries(results)) {
  console.log(`\n--- ${group} ---`);
  for (const [field, files] of Object.entries(fields)) {
    const nonTestFiles = files.filter(f => !f.includes("scratch") && !f.includes("test"));
    console.log(`${field}: total ${files.length} refs (${nonTestFiles.length} src app refs)`);
    if (nonTestFiles.length === 0) {
      console.log(`  >>> POTENTIALLY UNUSED: ${files.join(", ")}`);
    } else {
      console.log(`  Used in: ${nonTestFiles.slice(0, 5).join(", ")}`);
    }
  }
}
