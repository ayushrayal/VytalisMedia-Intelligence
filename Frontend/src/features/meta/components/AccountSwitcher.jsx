import React, { useState, useEffect } from "react";
import { getMetaAccounts, setActiveMetaAccount } from "../services/meta.api.js";

/**
 * Meta Feature AccountSwitcher component.
 * Height: 42px, Radius: 10px, Surface: #FFFFFF / #F7F9FC, Border: #E8EAED.
 */
export const AccountSwitcher = ({ onAccountSwitched }) => {
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
      <div style={{ height: "42px", display: "flex", alignItems: "center", padding: "0 14px", color: "var(--color-text-muted, #94A3B8)", fontSize: "0.875rem" }}>
        Loading accounts...
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div style={{ height: "42px", display: "flex", alignItems: "center", color: "var(--color-error, #E5484D)", fontSize: "0.875rem" }}>
        No Meta Accounts ({accounts.length})
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", fontWeight: "600" }}>Account:</span>
      <select
        value={activeAccount || ""}
        onChange={handleSelectAccount}
        disabled={switching}
        style={{
          height: "42px",
          padding: "0 14px",
          borderRadius: "var(--radius-input, 10px)",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--color-border, #E8EAED)",
          color: "var(--color-text-primary, #111827)",
          fontSize: "0.875rem",
          fontWeight: "600",
          outline: "none",
          cursor: switching ? "wait" : "pointer",
          transition: "all 0.15s ease",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        {accounts.map((acc) => (
          <option key={acc.accountId} value={acc.accountId}>
            {acc.accountName} ({acc.accountId}) {acc.accountId === activeAccount ? "✓" : ""}
          </option>
        ))}
      </select>
      {switching && <span style={{ fontSize: "0.75rem", color: "var(--color-primary, #0A84FF)", fontWeight: "600" }}>Updating...</span>}
    </div>
  );
};

export default AccountSwitcher;
