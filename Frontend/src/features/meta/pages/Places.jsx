import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getPlaces } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

export const Places = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Spend Filter State
  const [spendFilter, setSpendFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPlaces(dateParams);
      if (res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      return spendFilter === "all" || numericSpend >= Number(spendFilter);
    });
  }, [data, spendFilter]);

  return (
    <div>
      <PageHeader
        title="Meta Places / Geographic Metrics"
        subtitle="Geographic breakdown by country and region"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
          </div>
        }
      />

      {loading ? (
        <Skeleton height="320px" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Geographic Data Found" description="No location metrics were returned for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No location records match your selected spend filter."
          action={
            <Button variant="outline" onClick={() => setSpendFilter("all")}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "var(--radius-card, 16px)", border: "1px solid var(--color-border, #E8EAED)", overflow: "hidden", boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-text-primary, #111827)", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", textAlign: "left", backgroundColor: "var(--color-surface, #F7F9FC)", color: "var(--color-text-secondary, #64748B)" }}>
                  <th style={{ padding: "14px 18px" }}>Country</th>
                  <th style={{ padding: "14px 18px" }}>Region</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Spend</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Impressions</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Reach</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>CTR</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>CPC</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", transition: "background-color 0.15s ease" }}>
                    <td style={{ padding: "14px 18px", fontWeight: "700" }}>{row.country || "-"}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>{row.region || "-"}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                    <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Places;
