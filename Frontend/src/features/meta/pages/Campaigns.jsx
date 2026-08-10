import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCampaigns } from "../services/meta.api.js";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import AccountSwitcher from "../components/AccountSwitcher.jsx";
import DateFilter from "../components/DateFilter.jsx";
import SpendFilter from "../components/SpendFilter.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import StatusBadge, { getNormalizedStatus } from "../components/StatusBadge.jsx";
import CampaignDetailsDrawer from "../components/CampaignDetailsDrawer.jsx";
import CreativeDetailsDrawer from "../components/CreativeDetailsDrawer.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

export const Campaigns = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateParams, setDateParams] = useState({ datePreset: "last_7d" });

  // Local Filter State
  const [spendFilter, setSpendFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer States
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [isCampaignDrawerOpen, setIsCampaignDrawerOpen] = useState(false);

  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isCreativeDrawerOpen, setIsCreativeDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCampaigns(dateParams);
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
      // 1. Spend Filter (numeric >= threshold)
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      // 2. Status Filter (normalized match)
      const rawStatus = row.campaign_status || row.campaign_effective_status || row.effective_status || row.status || "ACTIVE";
      const normStatus = getNormalizedStatus(rawStatus);
      const matchesStatus = statusFilter === "all" || normStatus === statusFilter;

      return matchesSpend && matchesStatus;
    });
  }, [data, spendFilter, statusFilter]);

  const handleClearFilters = () => {
    setSpendFilter("all");
    setStatusFilter("all");
  };

  const handleRowClick = (row) => {
    const id = row.campaign_id || row.id || row.campaign;
    setSelectedCampaignId(id);
    setIsCampaignDrawerOpen(true);
  };

  const handleSelectCreative = (creative) => {
    setSelectedCreative(creative);
    setIsCreativeDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Meta Campaigns"
        subtitle="Campaign-level delivery and performance breakdown"
        actions={
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <AccountSwitcher onAccountSwitched={fetchData} />
            <DateFilter onChange={(params) => setDateParams(params)} />
            <SpendFilter value={spendFilter} onChange={setSpendFilter} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <Skeleton height="320px" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : data.length === 0 ? (
        <EmptyState title="No Campaigns Found" description="No campaign records were found for the selected date range." />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No matching results found"
          description="No campaign records match your selected spend or status filters."
          action={
            <Button variant="outline" onClick={handleClearFilters}>
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
                  <th style={{ padding: "14px 18px" }}>Campaign Name</th>
                  <th style={{ padding: "14px 18px" }}>Status</th>
                  <th style={{ padding: "14px 18px" }}>Objective</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Spend</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Impressions</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Reach</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>CTR</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>CPC</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => {
                  const rawStatus = row.campaign_status || row.campaign_effective_status || row.effective_status || row.status || "ACTIVE";
                  return (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(row)}
                      style={{
                        borderBottom: "1px solid var(--color-border, #E8EAED)",
                        transition: "background-color 0.15s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface-hover, #F2F8FF)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "14px 18px", fontWeight: "600" }}>{row.campaign || row.campaign_name || "-"}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={rawStatus} />
                      </td>
                      <td style={{ padding: "14px 18px" }}>{row.campaign_objective || "-"}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.spend, row.currency)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.impressions)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.reach)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>{formatNumber(row.clicks)}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatPercentage(row.ctr)}</td>
                      <td style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>{formatCurrency(row.cpc, row.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Details Drawer */}
      <CampaignDetailsDrawer
        campaignId={selectedCampaignId}
        isOpen={isCampaignDrawerOpen}
        onClose={() => setIsCampaignDrawerOpen(false)}
        dateParams={dateParams}
        onSelectCreative={handleSelectCreative}
      />

      {/* Nested Creative Details Drawer */}
      <CreativeDetailsDrawer
        creative={selectedCreative}
        isOpen={isCreativeDrawerOpen}
        onClose={() => setIsCreativeDrawerOpen(false)}
      />
    </div>
  );
};

export default Campaigns;

