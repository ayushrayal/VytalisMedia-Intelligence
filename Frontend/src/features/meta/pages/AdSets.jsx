import React, { useState, useEffect, useCallback } from "react";
import { getAdsets } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

export const AdSets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdsets(dateParams);
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

  return (
    <div>
      <PageHeader
        title="Meta Ad Sets"
        subtitle="Ad Set target audience delivery and performance"
        actions={
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
          </div>
        }
      />

      {loading ? (
        <Skeleton height="300px" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Ad Sets Found" description="No ad set records were found for the selected date range." />
      ) : (
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "1px solid #334155", padding: "16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#f8fafc", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Ad Set Name</th>
                <th style={{ padding: "10px" }}>Campaign</th>
                <th style={{ padding: "10px" }}>Status</th>
                <th style={{ padding: "10px" }}>Spend</th>
                <th style={{ padding: "10px" }}>Impressions</th>
                <th style={{ padding: "10px" }}>Reach</th>
                <th style={{ padding: "10px" }}>Clicks</th>
                <th style={{ padding: "10px" }}>CTR</th>
                <th style={{ padding: "10px" }}>CPC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "10px", fontWeight: "600" }}>{row.adset_name || "-"}</td>
                  <td style={{ padding: "10px" }}>{row.campaign || "-"}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", backgroundColor: "#334155", color: "#818cf8" }}>
                      {row.effective_status || "ACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>{formatCurrency(row.spend, row.currency)}</td>
                  <td style={{ padding: "10px" }}>{formatNumber(row.impressions)}</td>
                  <td style={{ padding: "10px" }}>{formatNumber(row.reach)}</td>
                  <td style={{ padding: "10px" }}>{formatNumber(row.clicks)}</td>
                  <td style={{ padding: "10px" }}>{formatPercentage(row.ctr)}</td>
                  <td style={{ padding: "10px" }}>{formatCurrency(row.cpc, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdSets;
