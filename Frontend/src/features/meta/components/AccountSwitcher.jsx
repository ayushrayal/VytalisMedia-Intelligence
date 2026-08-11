import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMetaAccounts, setActiveMetaAccount } from "../services/meta.api.js";
import { Settings2, Link2, RefreshCw, ChevronDown } from "lucide-react";

/**
 * Meta Feature AccountSwitcher component.
 * Height: 36px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
 * Displays Meta connected account selector with active status indicator and Settings action link.
 */
export const AccountSwitcher = ({ onAccountSwitched }) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMetaAccounts();
      if (res.data) {
        setAccounts(res.data.accounts || []);
        setActiveAccount(res.data.activeMetaAccount || null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSelectAccount = async (e) => {
    const targetAccountId = e.target.value;
    if (!targetAccountId || targetAccountId === activeAccount) return;

    try {
      setSwitching(true);
      const res = await setActiveMetaAccount(targetAccountId);
      if (res.data) {
        setActiveAccount(res.data.activeMetaAccount);
        if (onAccountSwitched) {
          onAccountSwitched(res.data.activeMetaAccount);
        }
      }
    } catch (err) {
      alert(`Account switch failed: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "36px", display: "flex", alignItems: "center", padding: "0 10px", color: "#94A3B8", fontSize: "12px" }}>
        Loading accounts...
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#DC2626", fontWeight: "600" }}>No Connected Accounts</span>
        <button
          onClick={() => navigate("/settings/accounts")}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            height: "36px",
            padding: "0 10px",
            fontSize: "12px",
            color: "#0A84FF",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Link2 size={13} />
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Account:</span>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={activeAccount || ""}
            onChange={handleSelectAccount}
            disabled={switching}
            aria-label="Select Meta Account"
            style={{
              height: "36px",
              padding: "0 28px 0 10px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              color: "#0F172A",
              fontSize: "13px",
              fontWeight: "500",
              outline: "none",
              cursor: switching ? "wait" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            {accounts.map((acc) => (
              <option key={acc.accountId} value={acc.accountId}>
                {acc.accountName}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
        </div>
      </div>

      <button
        onClick={() => navigate("/settings/accounts")}
        title="Manage Meta Accounts"
        style={{
          height: "36px",
          padding: "0 12px",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          color: "#64748B",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#0A84FF";
          e.currentTarget.style.borderColor = "#0A84FF";
          e.currentTarget.style.backgroundColor = "#FAFCFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#64748B";
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.backgroundColor = "#FFFFFF";
        }}
      >
        <Settings2 size={14} />
        Manage
      </button>

      {switching && (
        <span style={{ fontSize: "11px", color: "#0A84FF", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <RefreshCw size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} />
          Switching...
        </span>
      )}
    </div>
  );
};

export default AccountSwitcher;
