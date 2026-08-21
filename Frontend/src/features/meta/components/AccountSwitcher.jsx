import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMetaAccounts, setActiveMetaAccount } from "../services/meta.api.js";
import { getErrorMessage } from "../../../utils/error.js";
import { Link2, RefreshCw, ChevronDown } from "lucide-react";
import metaLogoImg from "../../../assets/mobile.png";

/**
 * Meta Feature AccountSwitcher component.
 * Height: 36px, Radius: 8px, Surface: #FFFFFF, Border: #E5E7EB.
 * Displays Meta connected account selector with Meta logo badge and active status.
 */
export const AccountSwitcher = ({ onAccountSwitched }) => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const isMember = outletContext.user?.role === "member";

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
      setError(getErrorMessage(err));
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
      alert(`Account switch failed: ${getErrorMessage(err)}`);
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
        <span style={{ fontSize: "12px", color: isMember ? "#64748B" : "#DC2626", fontWeight: "600" }}>
          {isMember ? "No Meta Account Connected" : "No Connected Accounts"}
        </span>
        {!isMember && (
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
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <select
          value={activeAccount || ""}
          onChange={handleSelectAccount}
          disabled={switching}
          aria-label="Select Meta Account"
          style={{
            height: "36px",
            padding: "0 28px 0 32px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            color: "#0F172A",
            fontSize: "13px",
            fontWeight: "600",
            outline: "none",
            cursor: switching ? "wait" : "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            maxWidth: "240px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {accounts.map((acc) => (
            <option key={acc.accountId} value={acc.accountId}>
              {acc.accountName}
            </option>
          ))}
        </select>
        <img
          src={metaLogoImg}
          alt="Meta"
          style={{
            position: "absolute",
            left: "9px",
            width: "18px",
            height: "18px",
            objectFit: "contain",
            borderRadius: "3px",
            pointerEvents: "none",
          }}
        />
        <ChevronDown size={14} style={{ position: "absolute", right: "8px", color: "#64748B", pointerEvents: "none" }} />
      </div>

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
