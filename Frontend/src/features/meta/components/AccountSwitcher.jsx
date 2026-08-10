import React, { useState, useEffect } from "react";
import { getMetaAccounts, setActiveMetaAccount } from "../services/meta.api.js";

/**
 * Meta Feature AccountSwitcher component.
 * Displays available Meta accounts and allows switching preferred activeMetaAccount.
 * 
 * MUST reside in features/meta/components/
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
      <div style={{ padding: "6px 12px", color: "#94a3b8", fontSize: "0.875rem" }}>
        Loading accounts...
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div style={{ color: "#f87171", fontSize: "0.875rem" }}>
        No Meta Accounts ({accounts.length})
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "500" }}>Account:</span>
      <select
        value={activeAccount || ""}
        onChange={handleSelectAccount}
        disabled={switching}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          color: "#f8fafc",
          fontSize: "0.875rem",
          fontWeight: "600",
          outline: "none",
          cursor: switching ? "wait" : "pointer",
        }}
      >
        {accounts.map((acc) => (
          <option key={acc.accountId} value={acc.accountId}>
            {acc.accountName} ({acc.accountId}) {acc.accountId === activeAccount ? "✓" : ""}
          </option>
        ))}
      </select>
      {switching && <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>Updating...</span>}
    </div>
  );
};

export default AccountSwitcher;
