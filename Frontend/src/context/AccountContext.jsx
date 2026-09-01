import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMetaAccounts, setActiveMetaAccount as apiSetActiveMetaAccount } from "../features/meta/services/meta.api.js";
import { http } from "../lib/http.js";
import { getErrorMessage } from "../utils/error.js";

const AccountContext = createContext(null);

/**
 * AccountProvider Component.
 * Global React Context Provider for Meta and Shopify accounts.
 * Lives above all page routes and remains mounted continuously during SPA navigation.
 * Fetches accounts ONCE on app initialization / login.
 */
export const AccountProvider = ({ children, user }) => {
  // Meta Accounts State
  const [metaAccounts, setMetaAccounts] = useState([]);
  const [activeMetaAccount, setActiveMetaAccount] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState(null);

  // Shopify Accounts State
  const [shopifyAccounts, setShopifyAccounts] = useState([]);
  const [activeShopifyAccount, setActiveShopifyAccount] = useState("");
  const [shopifyLoading, setShopifyLoading] = useState(true);
  const [shopifyError, setShopifyError] = useState(null);

  // Switching States
  const [switchingMeta, setSwitchingMeta] = useState(false);
  const [switchingShopify, setSwitchingShopify] = useState(false);

  // Fetches both Meta and Shopify accounts once concurrently
  const fetchAllAccounts = useCallback(async () => {
    try {
      setMetaLoading(true);
      setShopifyLoading(true);
      setMetaError(null);
      setShopifyError(null);

      const [metaRes, shopifyRes] = await Promise.allSettled([
        getMetaAccounts(),
        http.get("/shopify/accounts"),
      ]);

      if (metaRes.status === "fulfilled" && metaRes.value?.data) {
        setMetaAccounts(metaRes.value.data.accounts || []);
        setActiveMetaAccount(metaRes.value.data.activeMetaAccount || null);
      } else if (metaRes.status === "rejected") {
        setMetaError(getErrorMessage(metaRes.reason));
      }

      if (shopifyRes.status === "fulfilled" && shopifyRes.value?.data) {
        const accList = shopifyRes.value.data.accounts || [];
        const active = shopifyRes.value.data.activeShopifyAccount || (accList.length > 0 ? accList[0].accountName : "");
        setShopifyAccounts(accList);
        setActiveShopifyAccount(active);
      } else if (shopifyRes.status === "rejected") {
        setShopifyError(getErrorMessage(shopifyRes.reason));
      }
    } finally {
      setMetaLoading(false);
      setShopifyLoading(false);
    }
  }, []);

  // Fetch accounts when authenticated user ID changes
  useEffect(() => {
    if (user) {
      fetchAllAccounts();
    }
  }, [user?._id, fetchAllAccounts]);

  // Switch Active Meta Account
  const switchMetaAccount = useCallback(async (targetAccountId) => {
    if (!targetAccountId || targetAccountId === activeMetaAccount) return activeMetaAccount;
    try {
      setSwitchingMeta(true);
      const res = await apiSetActiveMetaAccount(targetAccountId);
      if (res.data) {
        const newActive = res.data.activeMetaAccount;
        setActiveMetaAccount(newActive);
        return newActive;
      }
    } catch (err) {
      throw err;
    } finally {
      setSwitchingMeta(false);
    }
  }, [activeMetaAccount]);

  // Switch Active Shopify Account
  const switchShopifyAccount = useCallback(async (selectedDomain) => {
    if (!selectedDomain || selectedDomain === activeShopifyAccount) return activeShopifyAccount;
    try {
      setSwitchingShopify(true);
      await http.patch("/shopify/accounts/active", { accountName: selectedDomain });
      setActiveShopifyAccount(selectedDomain);
      return selectedDomain;
    } catch (err) {
      throw err;
    } finally {
      setSwitchingShopify(false);
    }
  }, [activeShopifyAccount]);

  const value = {
    // Meta Context
    metaAccounts,
    activeMetaAccount,
    metaLoading,
    metaError,
    switchingMeta,
    switchMetaAccount,

    // Shopify Context
    shopifyAccounts,
    activeShopifyAccount,
    shopifyLoading,
    shopifyError,
    switchingShopify,
    switchShopifyAccount,

    // Global Refetch Method
    refetchAccounts: fetchAllAccounts,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

/**
 * Custom Hook to consume AccountContext safely across the application.
 */
export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    return {
      metaAccounts: [],
      activeMetaAccount: null,
      metaLoading: false,
      metaError: null,
      switchingMeta: false,
      switchMetaAccount: async () => {},
      shopifyAccounts: [],
      activeShopifyAccount: "",
      shopifyLoading: false,
      shopifyError: null,
      switchingShopify: false,
      switchShopifyAccount: async () => {},
      refetchAccounts: async () => {},
    };
  }
  return context;
};
