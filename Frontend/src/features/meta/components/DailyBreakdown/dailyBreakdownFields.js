import { formatCurrency } from "../../../../utils/formatCurrency.js";
import { formatNumber } from "../../../../utils/formatNumber.js";
import { formatPercentage } from "../../../../utils/formatPercentage.js";

/**
 * Master catalog of available Daily Breakdown fields grouped by category.
 */
export const ALL_DAILY_BREAKDOWN_FIELDS = [
  // IDENTITY
  {
    id: "date",
    label: "Date",
    category: "IDENTITY",
    type: "date",
    sortable: true,
    required: true,
    align: "left",
  },

  // PERFORMANCE
  {
    id: "spend",
    label: "Spend",
    category: "PERFORMANCE",
    type: "currency",
    sortable: true,
    align: "right",
  },
  {
    id: "cost_per_result",
    label: "Cost / Result",
    category: "PERFORMANCE",
    type: "currency",
    sortable: true,
    align: "right",
  },
  {
    id: "purchases",
    label: "Purchases",
    category: "PERFORMANCE",
    type: "number",
    sortable: true,
    align: "right",
  },
  {
    id: "purchase_conversion_value",
    label: "Purchase Value",
    category: "PERFORMANCE",
    type: "currency",
    sortable: true,
    align: "right",
  },
  {
    id: "purchase_roas",
    label: "Purchase ROAS",
    category: "PERFORMANCE",
    type: "roas",
    sortable: true,
    align: "right",
  },
  {
    id: "avg_purchase_value",
    label: "Avg Purchase Value",
    category: "PERFORMANCE",
    type: "currency",
    sortable: true,
    align: "right",
  },

  // FUNNEL
  {
    id: "actions_add_to_cart",
    label: "Add to Cart",
    category: "FUNNEL",
    type: "number",
    sortable: true,
    align: "right",
  },
  {
    id: "actions_initiate_checkout",
    label: "Checkout Initiated",
    category: "FUNNEL",
    type: "number",
    sortable: true,
    align: "right",
  },

  // DELIVERY & EFFICIENCY
  {
    id: "reach",
    label: "Reach",
    category: "DELIVERY & EFFICIENCY",
    type: "number",
    sortable: true,
    align: "right",
  },
  {
    id: "impressions",
    label: "Impressions",
    category: "DELIVERY & EFFICIENCY",
    type: "number",
    sortable: true,
    align: "right",
  },
  {
    id: "clicks",
    label: "Clicks",
    category: "DELIVERY & EFFICIENCY",
    type: "number",
    sortable: true,
    align: "right",
  },
  {
    id: "ctr",
    label: "CTR",
    category: "DELIVERY & EFFICIENCY",
    type: "percentage",
    sortable: true,
    align: "right",
  },
  {
    id: "unique_outbound_clicks_ctr_outbound_click",
    label: "Unique Outbound CTR",
    category: "DELIVERY & EFFICIENCY",
    type: "percentage",
    sortable: true,
    align: "right",
  },
  {
    id: "cpc",
    label: "CPC",
    category: "DELIVERY & EFFICIENCY",
    type: "currency",
    sortable: true,
    align: "right",
  },
  {
    id: "cpm",
    label: "CPM",
    category: "DELIVERY & EFFICIENCY",
    type: "currency",
    sortable: true,
    align: "right",
  },
  {
    id: "frequency",
    label: "Frequency",
    category: "DELIVERY & EFFICIENCY",
    type: "decimal",
    sortable: true,
    align: "right",
  },
];

/**
 * Default field order for Daily Breakdown table.
 */
export const DEFAULT_DAILY_BREAKDOWN_FIELD_IDS = [
  "date",
  "spend",
  "actions_add_to_cart",
  "actions_initiate_checkout",
  "purchases",
  "purchase_conversion_value",
  "purchase_roas",
  "impressions",
  "reach",
  "ctr",
];

/**
 * Lookup Map for fast access by field ID.
 */
export const DAILY_BREAKDOWN_FIELDS_MAP = new Map(
  ALL_DAILY_BREAKDOWN_FIELDS.map((f) => [f.id, f])
);

/**
 * Helper to extract raw or calculated metric value from a row object.
 */
export const getRowMetricValue = (row, fieldId) => {
  if (!row) return null;

  switch (fieldId) {
    case "date":
      return row.date;
    case "spend":
      return row.spend;
    case "cost_per_result":
      return row.cost_per_result;
    case "purchases":
      return row.purchases ?? row.actions_omni_purchase;
    case "purchase_conversion_value":
      return row.purchase_conversion_value ?? row.action_values_omni_purchase;
    case "purchase_roas":
      return row.purchase_roas ?? row.purchase_roas_omni_purchase;
    case "avg_purchase_value": {
      const purchases = Number(row.purchases ?? row.actions_omni_purchase ?? 0);
      const val = Number(row.purchase_conversion_value ?? row.action_values_omni_purchase ?? 0);
      return purchases > 0 && val > 0 ? val / purchases : null;
    }
    case "actions_add_to_cart":
      return row.actions_add_to_cart ?? row.add_to_cart;
    case "actions_initiate_checkout":
      return row.actions_initiate_checkout ?? row.initiate_checkout;
    case "reach":
      return row.reach;
    case "impressions":
      return row.impressions;
    case "clicks":
      return row.clicks;
    case "ctr":
      return row.ctr;
    case "unique_outbound_clicks_ctr_outbound_click":
      return row.unique_outbound_clicks_ctr_outbound_click ?? row.unique_outbound_clicks_ctr;
    case "cpc":
      return row.cpc;
    case "cpm":
      return row.cpm;
    case "frequency":
      return row.frequency;
    default:
      return row[fieldId];
  }
};

/**
 * Formats a given value based on field type and currency code.
 */
export const formatDailyBreakdownValue = (val, type, currency = "INR") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    if (type === "date" && typeof val === "string" && val.trim() !== "") {
      return formatDateLabel(val);
    }
    return "—";
  }

  const num = Number(val);
  switch (type) {
    case "currency":
      return formatCurrency(num, currency);
    case "percentage":
      return formatPercentage(num);
    case "roas":
      return `${num.toFixed(2)}x`;
    case "number":
      return formatNumber(num);
    case "decimal":
      return num.toFixed(2);
    case "date":
      return formatDateLabel(val);
    default:
      return num.toLocaleString();
  }
};

/**
 * Formats ISO or YYYY-MM-DD date string to compact short date string (e.g., "Aug 4").
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${MONTHS[monthIdx]} ${day}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
};
