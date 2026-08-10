import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCreatives } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

export const Creatives = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer Detail State
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Derived Filtered Array
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Spend Filter
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      // Status Filter (if status exists on row)
      const rawStatus = row.effective_status || row.ad_status || row.status;
      let matchesStatus = true;
      if (rawStatus && statusFilter !== "all") {
        const normStatus = getNormalizedStatus(rawStatus);
        matchesStatus = normStatus === statusFilter;
      }

      return matchesSpend && matchesStatus;
    });
  }, [data, spendFilter, statusFilter]);

  const handleClearFilters = () => {
    setSpendFilter("all");
    setStatusFilter("all");
  };

  const hasStatusField = useMemo(() => {
    return data.some((row) => row.effective_status || row.ad_status || row.status);
  }, [data]);

  const handleCardClick = (creative) => {
    setSelectedCreative(creative);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Meta Ad Creatives"
        subtitle="Visual ad creative performance & engagement metrics"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            {hasStatusField && <StatusFilter value={statusFilter} onChange={setStatusFilter} />}
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          <Skeleton height="260px" />
          <Skeleton height="260px" />
          <Skeleton height="260px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Ad Creatives Found" description="No ad creative performance records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No ad creative records match your selected spend or status filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filteredData.map((row, idx) => {
            const imageUrl = row.thumbnail_url || row.image_url;
            const rawStatus = row.effective_status || row.ad_status || row.status;
            return (
              <div
                key={idx}
                onClick={() => handleCardClick(row)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "var(--radius-card, 16px)",
                  border: "1px solid var(--color-border, #E8EAED)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
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
                  <div
                    style={{
                      width: "100%",
                      height: "150px",
                      background: "var(--gradient-hero, linear-gradient(#F2F8FF, #EAF3FF))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary-hover, #0060DF)",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    🎨 Creative Asset
                  </div>
                )}
                <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <h4 style={{ margin: 0, color: "var(--color-text-primary, #111827)", fontSize: "1rem", fontWeight: "700" }}>{row.ad_name || "Unnamed Ad"}</h4>
                    {rawStatus && <StatusBadge status={rawStatus} />}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)" }}>
                    Campaign: {row.campaign || "-"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", padding: "12px", borderRadius: "10px", backgroundColor: "var(--color-surface, #F7F9FC)", fontSize: "0.85rem" }}>
                    <div>
                      <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.75rem", display: "block" }}>Spend</span>
                      <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatCurrency(row.spend, row.currency)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.75rem", display: "block" }}>Clicks</span>
                      <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatNumber(row.clicks)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.75rem", display: "block" }}>CTR</span>
                      <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatPercentage(row.ctr)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.75rem", display: "block" }}>CPC</span>
                      <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatCurrency(row.cpc, row.currency)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Right-Side Detail Drawer */}
      <CreativeDetailsDrawer
        creative={selectedCreative}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default Creatives;
