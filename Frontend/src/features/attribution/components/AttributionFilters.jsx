import React from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * AttributionFilters Component.
 * Search and Filter bar for the Attributed Orders table.
 */
export const AttributionFilters = ({
  searchTerm = "",
  onSearchChange,
  groupFilter = "",
  onGroupFilterChange,
  channelFilter = "",
  onChannelFilterChange,
  financialStatusFilter = "",
  onFinancialStatusFilterChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "16px",
      }}
    >
      {/* Search Input Box */}
      <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94A3B8",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search Order ID or UTM Source..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            height: "36px",
            padding: "0 12px 0 36px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            fontSize: "13px",
            color: "#0F172A",
            outline: "none",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            transition: "all 0.15s ease",
          }}
        />
      </div>

      {/* Filter Dropdowns Container */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Top-Level Group Filter */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={groupFilter}
            onChange={(e) => onGroupFilterChange(e.target.value)}
            style={{
              height: "36px",
              padding: "0 28px 0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: "500",
              color: "#0F172A",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            }}
          >
            <option value="">All Groups</option>
            <option value="meta">Meta</option>
            <option value="google">Google</option>
            <option value="not_attribution">Not Attribution</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
        </div>

        {/* Channel Filter */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={channelFilter}
            onChange={(e) => onChannelFilterChange(e.target.value)}
            style={{
              height: "36px",
              padding: "0 28px 0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: "500",
              color: "#0F172A",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            }}
          >
            <option value="">All Channels</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Google Organic">Google Organic</option>
            <option value="CRM / WhatsApp / Email">CRM / WhatsApp / Email</option>
            <option value="AI / LLM Referral">AI / LLM Referral</option>
            <option value="Other (Tagged)">Other (Tagged)</option>
            <option value="Not Attributed">Not Attributed</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
        </div>

        {/* Financial Status Filter */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={financialStatusFilter}
            onChange={(e) => onFinancialStatusFilterChange(e.target.value)}
            style={{
              height: "36px",
              padding: "0 28px 0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              fontSize: "13px",
              fontWeight: "500",
              color: "#0F172A",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            }}
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="partially_paid">Partially Paid</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
};

export default AttributionFilters;
