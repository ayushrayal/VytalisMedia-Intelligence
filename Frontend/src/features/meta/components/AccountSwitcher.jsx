import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMetaAccounts, setActiveMetaAccount } from "../services/meta.api.js";
import { Settings2, Link2, Check, RefreshCw } from "lucide-react";

/**
 * Meta Feature AccountSwitcher component.
 * Height: 38px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
 * Displays Meta connected account selector with active status dot indicator and Settings action link.
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
      <div style={{ height: "38px", display: "flex", alignItems: "center", padding: "0 12px", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.8rem" }}>
        Loading accounts...
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--color-error, #DC2626)", fontWeight: "600" }}>No Connected Accounts</span>
        <button
          onClick={() => navigate("/settings/accounts")}
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--color-border, #E5E7EB)",
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "0.78rem",
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
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "600" }}>Account:</span>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select
            value={activeAccount || ""}
            onChange={handleSelectAccount}
            disabled={switching}
            aria-label="Select Meta Account"
            style={{
              height: "38px",
              padding: "0 12px",
              borderRadius: "var(--radius-input, 8px)",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--color-border, #E5E7EB)",
              color: "var(--color-text-primary, #0F172A)",
              fontSize: "0.825rem",
              fontWeight: "600",
              outline: "none",
              cursor: switching ? "wait" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
            }}
          >
            {accounts.map((acc) => (
              <option key={acc.accountId} value={acc.accountId}>
                {acc.accountName} ({acc.accountId}) {acc.accountId === activeAccount ? "✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => navigate("/settings/accounts")}
        title="Manage Meta Accounts"
        style={{
          height: "38px",
          padding: "0 12px",
          borderRadius: "var(--radius-button, 8px)",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--color-border, #E5E7EB)",
          color: "var(--color-text-secondary, #64748B)",
          fontSize: "0.8rem",
          fontWeight: "600",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#0A84FF";
          e.currentTarget.style.borderColor = "#0A84FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-text-secondary, #64748B)";
          e.currentTarget.style.borderColor = "var(--color-border, #E5E7EB)";
        }}
      >
        <Settings2 size={15} />
        Manage
      </button>

      {switching && (
        <span style={{ fontSize: "0.75rem", color: "#0A84FF", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <RefreshCw size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} />
          Switching...
        </span>
      )}
    </div>
  );
};

export default AccountSwitcher;
