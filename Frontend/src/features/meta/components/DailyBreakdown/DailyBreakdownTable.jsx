import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  DAILY_BREAKDOWN_FIELDS_MAP,
  getRowMetricValue,
  formatDailyBreakdownValue,
} from "./dailyBreakdownFields.js";

/**
 * DailyBreakdownTable Component.
 * Dynamically renders table columns and rows based on selected fields configuration.
 */
export const DailyBreakdownTable = ({
  data = [],
  selectedFields = [],
  sortField,
  sortDirection,
  onSortChange,
  currency = "INR",
}) => {
  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "#0F172A",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #E5E7EB",
              textAlign: "left",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {selectedFields.map((fieldId) => {
              const field = DAILY_BREAKDOWN_FIELDS_MAP.get(fieldId) || {
                id: fieldId,
                label: fieldId,
                align: "right",
                sortable: true,
              };
              const isSorted = sortField === field.id;

              return (
                <th
                  key={field.id}
                  onClick={() => field.sortable && onSortChange(field.id)}
                  style={{
                    padding: "12px 18px",
                    fontWeight: "600",
                    textAlign: field.align || "right",
                    cursor: field.sortable ? "pointer" : "default",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (field.sortable) e.currentTarget.style.color = "#0F172A";
                  }}
                  onMouseLeave={(e) => {
                    if (field.sortable && !isSorted) e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      justifyContent: field.align === "left" ? "flex-start" : "flex-end",
                    }}
                  >
                    <span>{field.label}</span>
                    {field.sortable && (
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={13} color="#1683FF" />
                          ) : (
                            <ArrowDown size={13} color="#1683FF" />
                          )
                        ) : (
                          <ArrowUpDown size={12} color="#CBD5E1" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            return (
              <tr
                key={row.date || row.id || idx}
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  transition: "background-color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {selectedFields.map((fieldId) => {
                  const field = DAILY_BREAKDOWN_FIELDS_MAP.get(fieldId) || {
                    id: fieldId,
                    type: "string",
                    align: "right",
                  };
                  const rawVal = getRowMetricValue(row, field.id);
                  const formatted = formatDailyBreakdownValue(rawVal, field.type, currency);

                  // Highlight styling for special fields
                  let cellColor = "#0F172A";
                  let fontWeight = "normal";

                  if (field.id === "date") {
                    fontWeight = "600";
                  } else if (field.id === "spend" || field.id === "purchases" || field.id === "purchase_conversion_value") {
                    fontWeight = "600";
                  } else if (field.type === "roas" && rawVal !== null && rawVal !== undefined) {
                    cellColor = "#16A34A";
                    fontWeight = "600";
                  } else if (field.type === "percentage" && rawVal !== null && rawVal !== undefined) {
                    cellColor = "#1683FF";
                    fontWeight = "600";
                  }

                  return (
                    <td
                      key={field.id}
                      style={{
                        padding: "12px 18px",
                        textAlign: field.align || "right",
                        color: cellColor,
                        fontWeight,
                      }}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DailyBreakdownTable;
