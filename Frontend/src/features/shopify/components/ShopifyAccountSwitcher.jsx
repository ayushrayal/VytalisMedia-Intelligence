import React, { useState, useEffect, useCallback } from "react";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import { ChevronDown } from "lucide-react";
import shopifyLogoImg from "../../../assets/shopify.png";

/**
 * Reusable Shopify Account Switcher Component for all Shopify Analytics pages.
 * Handles store selection, active account preference switching, and locked state signaling.
 */
export const ShopifyAccountSwitcher = ({ onAccountChanged, onAccountsLoaded }) => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await http.get("/shopify/accounts");
      if (res.data) {
        const accList = res.data.accounts || [];
        const active = res.data.activeShopifyAccount || (accList.length > 0 ? accList[0].accountName : "");

        setAccounts(accList);
        setActiveAccount(active);

        if (onAccountsLoaded) {
          onAccountsLoaded({ accounts: accList, activeAccount: active });
        }
      }
    } catch (err) {
      console.error("Failed to load Shopify accounts:", err);
      if (onAccountsLoaded) {
        onAccountsLoaded({ accounts: [], activeAccount: "" });
      }
    } finally {
      setLoading(false);
    }
  }, [onAccountsLoaded]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSelectChange = async (e) => {
    const selectedDomain = e.target.value;
    if (!selectedDomain || selectedDomain === activeAccount) return;

    try {
      setSwitching(true);
      await http.patch("/shopify/accounts/active", { accountName: selectedDomain });
      setActiveAccount(selectedDomain);

      if (onAccountChanged) {
        onAccountChanged(selectedDomain);
      }
    } catch (err) {
      alert(`Failed to switch active Shopify store: ${getErrorMessage(err)}`);
    } finally {
      setSwitching(false);
    }
  };

  if (loading || accounts.length === 0) {
    return null; // Don't render selector if loading or zero accounts
  }

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={activeAccount}
        onChange={handleSelectChange}
        disabled={switching}
        aria-label="Select active Shopify store"
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
          <option key={acc.accountName} value={acc.accountName}>
            {acc.shopName || acc.accountName}
          </option>
        ))}
      </select>
      <img
        src={shopifyLogoImg}
        alt="Shopify"
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
  );
};

export default ShopifyAccountSwitcher;
