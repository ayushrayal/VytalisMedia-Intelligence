import React, { useState, useEffect, useCallback } from "react";
import { getCampaignBreakdowns } from "../services/meta.api.js";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader from "../../../components/ui/ContextualLoader.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getErrorMessage } from "../../../utils/error.js";

/**
 * Metric formatter displaying '—' for null or undefined values.
 */
const renderMetricValue = (val, type, currency = "INR") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "—";
  }
  const num = Number(val);
  switch (type) {
    case "currency":
      return formatCurrency(num, currency);
    case "roas":
      return `${num.toFixed(2)}x`;
    case "number":
      return formatNumber(num);
    default:
      return num.toLocaleString();
  }
};

/**
 * CampaignBreakdownsTab Component.
 * Campaign-scoped breakdown viewer supporting Age, Gender, and Placement.
 */
export const CampaignBreakdownsTab = ({ campaignId, dateParams = {}, currency = "INR" }) => {
  const [activeCategory, setActiveCategory] = useState("age"); // "age" | "gender" | "placement"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBreakdownData = useCallback(async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getCampaignBreakdowns(campaignId, {
        ...dateParams,
        breakdown: activeCategory,
      });

      if (res && res.data && Array.isArray(res.data.rows)) {
        setRows(res.data.rows);
      } else {
        setRows([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, activeCategory, dateParams]);

  useEffect(() => {
    fetchBreakdownData();
  }, [fetchBreakdownData]);

  // Sort breakdown data by Spend HIGH -> LOW by default
  const sortedRows = React.useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return [...rows].sort((a, b) => (Number(b.spend) || 0) - (Number(a.spend) || 0));
  }, [rows]);

  const categories = [
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "placement", label: "Placement" },
  ];

  const categoryColumnHeader =
    activeCategory === "age" ? "Age Bucket" : activeCategory === "gender" ? "Gender" : "Placement";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Segmented Category Controls [ Age | Gender | Placement ] */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
          Campaign Performance Breakdowns
        </h4>

        <div style={{ display: "inline-flex", backgroundColor: "#E2E8F0", borderRadius: "8px", padding: "3px" }}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                  color: isSelected ? "#1683FF" : "#64748B",
                  fontSize: "13px",
                  fontWeight: isSelected ? "650" : "500",
                  boxShadow: isSelected ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area: Loading, Error, Empty, or Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <ContextualLoader isLoading={loading} label={`Loading ${activeCategory} breakdown`} minHeight="auto" />
          <Skeleton height="42px" width="100%" />
          <Skeleton height="42px" width="100%" />
          <Skeleton height="42px" width="100%" />
        </div>
      ) : error ? (
        <ErrorState message={`Failed to load ${activeCategory} breakdown data.`} onRetry={fetchBreakdownData} />
      ) : sortedRows.length === 0 ? (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px dashed #E5EAF0",
            color: "#64748B",
            fontSize: "13.5px",
          }}
        >
          No {activeCategory} breakdown data available for this campaign and date range.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5EAF0",
            overflowX: "auto",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
              minWidth: "520px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E5EAF0" }}>
                <th style={thStyle}>{categoryColumnHeader}</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Spend</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Purchases</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Purchase Value</th>
                <th style={{ ...thStyle, textAlign: "right" }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr
                  key={`${row.label}-${idx}`}
                  style={{
                    borderBottom: idx === sortedRows.length - 1 ? "none" : "1px solid #F1F5F9",
                    transition: "backgroundColor 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0F172A" }}>{row.label}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {renderMetricValue(row.spend, "currency", currency)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#475569" }}>
                    {renderMetricValue(row.purchases, "number")}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {renderMetricValue(row.purchaseValue, "currency", currency)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: "700",
                      color: row.roas !== null && row.roas > 0 ? "#16A34A" : "#64748B",
                    }}
                  >
                    {renderMetricValue(row.roas, "roas")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: "650",
  color: "#475569",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const tdStyle = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

export default CampaignBreakdownsTab;
