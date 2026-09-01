import React, { useEffect } from "react";
import { useAccount } from "../../../context/AccountContext.jsx";
import { getErrorMessage } from "../../../utils/error.js";
import { ChevronDown } from "lucide-react";
import shopifyLogoImg from "../../../assets/shopify.png";

/**
 * Reusable Shopify Account Switcher Component for all Shopify Analytics pages.
 * Handles store selection, active account preference switching, and locked state signaling.
 */
export const ShopifyAccountSwitcher = ({ onAccountChanged, onAccountsLoaded }) => {
  const {
    shopifyAccounts: accounts,
    activeShopifyAccount: activeAccount,
    shopifyLoading: loading,
    switchingShopify: switching,
    switchShopifyAccount,
  } = useAccount();

  useEffect(() => {
    if (!loading && onAccountsLoaded) {
      onAccountsLoaded({ accounts, activeAccount });
    }
  }, [loading, accounts, activeAccount, onAccountsLoaded]);

  const handleSelectChange = async (e) => {
    const selectedDomain = e.target.value;
    if (!selectedDomain || selectedDomain === activeAccount) return;

    try {
      const newActive = await switchShopifyAccount(selectedDomain);
      if (onAccountChanged && newActive) {
        onAccountChanged(newActive);
      }
    } catch (err) {
      alert(`Failed to switch active Shopify store: ${getErrorMessage(err)}`);
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
