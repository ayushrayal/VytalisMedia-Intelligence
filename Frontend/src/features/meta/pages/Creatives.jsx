import React, { useState, useEffect, useCallback } from "react";
import { getCreatives } from "../services/meta.api.js";
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

export const Creatives = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCreatives(dateParams);
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
        title="Meta Ad Creatives"
        subtitle="Visual ad creative performance & engagement metrics"
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
        <EmptyState title="No Ad Creatives Found" description="No ad creative performance records were found for the selected date range." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {data.map((row, idx) => {
            const imageUrl = row.thumbnail_url || row.image_url;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "#1e293b",
                  borderRadius: "12px",
                  border: "1px solid #334155",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={row.ad_name || "Creative"}
                    style={{ width: "100%", height: "180px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "140px", backgroundColor: "#334155", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    No Thumbnail
                  </div>
                )}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "1rem" }}>{row.ad_name || "Unnamed Ad"}</h4>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Campaign: {row.campaign || "-"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px", fontSize: "0.85rem" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Spend:</span> <strong style={{ color: "#f8fafc" }}>{formatCurrency(row.spend, row.currency)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Clicks:</span> <strong style={{ color: "#f8fafc" }}>{formatNumber(row.clicks)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>CTR:</span> <strong style={{ color: "#f8fafc" }}>{formatPercentage(row.ctr)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>CPC:</span> <strong style={{ color: "#f8fafc" }}>{formatCurrency(row.cpc, row.currency)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Creatives;
