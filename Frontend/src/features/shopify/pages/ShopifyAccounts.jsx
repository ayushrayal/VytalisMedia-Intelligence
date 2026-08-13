import React, { useState, useEffect, useCallback, useRef } from "react";
import { http } from "../../../lib/http.js";
import Button from "../../../components/ui/Button.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { Trash2, X } from "lucide-react";

export const ShopifyAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [shopName, setShopName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Modal States
  const [deleteTargetAccount, setDeleteTargetAccount] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelDeleteRef = useRef(null);

  // Switching state
  const [switchingId, setSwitchingId] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get("/shopify/accounts");
      if (res.data) {
        setAccounts(res.data.accounts || []);
        setActiveAccount(res.data.activeShopifyAccount || null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch Shopify accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Set Active Shopify Store
  const handleSetActive = async (targetAccountName) => {
    try {
      setSwitchingId(targetAccountName);
      const res = await http.patch("/shopify/accounts/active", { accountName: targetAccountName });
      if (res.data) {
        setActiveAccount(res.data.activeShopifyAccount);
        await fetchAccounts();
      }
    } catch (err) {
      alert(`Failed to set active account: ${err.message}`);
    } finally {
      setSwitchingId(null);
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!shopName || !accountName) {
      setFormError("Both Shop Name and myshopify.com Store Domain are required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingAccount) {
        // Update mode
        await http.patch(`/shopify/accounts/${encodeURIComponent(editingAccount.accountName)}`, {
          shopName,
          accountName,
        });
      } else {
        // Add mode
        await http.post("/shopify/accounts", { shopName, accountName });
      }

      setIsFormOpen(false);
      setEditingAccount(null);
      setShopName("");
      setAccountName("");
      await fetchAccounts();
    } catch (err) {
      setFormError(err.message || "Failed to save Shopify account");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Perform Account Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTargetAccount) return;

    try {
      setIsDeleting(true);
      await http.delete(`/shopify/accounts/${encodeURIComponent(deleteTargetAccount.accountName)}`);
      setDeleteTargetAccount(null);
      await fetchAccounts();
    } catch (err) {
      alert(`Failed to delete account: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
            Shopify Integrations
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
            Connect and manage your Shopify e-commerce store accounts.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAccount(null);
            setShopName("");
            setAccountName("");
            setFormError(null);
            setIsFormOpen(true);
          }}
        >
          + Add Shopify Store
        </Button>
      </div>

      {/* Summary Card */}
      <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", color: "#0F172A", fontWeight: "600", fontSize: "15px" }}>Shopify Store Connections</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
            Select an active store domain to filter Shopify overview, orders, and product analytics across Vytalis.
          </p>
        </div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>
          Connected Stores: <strong style={{ color: "#0A84FF" }}>{accounts.length}</strong>
        </div>
      </div>

      {/* Main Grid / Cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          <Skeleton height="160px" />
          <Skeleton height="160px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAccounts} />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No Shopify Stores Connected"
          description="Connect your myshopify.com store domain to start viewing e-commerce analytics."
          action={
            <Button
              onClick={() => {
                setEditingAccount(null);
                setShopName("");
                setAccountName("");
                setFormError(null);
                setIsFormOpen(true);
              }}
            >
              + Add Shopify Store
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {accounts.map((acc) => {
            const isActive = acc.accountName === activeAccount;
            const isSwitching = switchingId === acc.accountName;
            return (
              <div
                key={acc.accountName}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: isActive ? "2px solid #0A84FF" : "1px solid #E2E8F0",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                  boxShadow: isActive ? "0 4px 12px rgba(10, 132, 255, 0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                      {acc.shopName}
                    </h3>
                    {isActive && (
                      <span style={{ backgroundColor: "rgba(10, 132, 255, 0.1)", color: "#0A84FF", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                    {acc.accountName}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
                  {!isActive ? (
                    <Button
                      variant="outline"
                      onClick={() => handleSetActive(acc.accountName)}
                      isLoading={isSwitching}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Set Active
                    </Button>
                  ) : (
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#16A34A" }}>✓ Currently Selected</span>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setEditingAccount(acc);
                        setShopName(acc.shopName);
                        setAccountName(acc.accountName);
                        setFormError(null);
                        setIsFormOpen(true);
                      }}
                      style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetAccount(acc)}
                      style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Store Form Modal */}
      {isFormOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
              {editingAccount ? "Edit Shopify Store" : "Add Shopify Store"}
            </h3>

            {formError && (
              <div style={{ padding: "10px 14px", backgroundColor: "rgba(225, 29, 72, 0.08)", border: "1px solid rgba(225, 29, 72, 0.2)", borderRadius: "8px", color: "#E11D48", fontSize: "13px", marginBottom: "16px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Shop Name"
                placeholder="e.g. JSB Health & Fitness"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
              <Input
                label="Store Domain (myshopify.com)"
                placeholder="e.g. jsbhealthcare.myshopify.com"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={formSubmitting}>
                  {editingAccount ? "Save Changes" : "Connect Store"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetAccount)}
        onClose={() => setDeleteTargetAccount(null)}
        maxWidth="420px"
        width="100%"
        borderRadius="12px"
        border="1px solid #E5E7EB"
        padding="24px"
        backdropColor="rgba(15, 23, 42, 0.4)"
        backdropFilter="blur(4px)"
        boxShadow="0 10px 25px -5px rgba(15, 23, 42, 0.1)"
        initialFocusRef={cancelDeleteRef}
        headerContent={
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} strokeWidth={2.2} />
            </div>

            <button
              type="button"
              onClick={() => setDeleteTargetAccount(null)}
              disabled={isDeleting}
              aria-label="Close dialog"
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                cursor: isDeleting ? "not-allowed" : "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s ease",
              }}
            >
              <X size={16} />
            </button>
          </div>
        }
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#0F172A", lineHeight: 1.3 }}>
            Delete Shopify Account?
          </h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#64748B", lineHeight: 1.5 }}>
            Are you sure you want to disconnect store{" "}
            <strong style={{ color: "#0F172A" }}>
              {deleteTargetAccount ? deleteTargetAccount.shopName || deleteTargetAccount.accountName : ""}
            </strong>{" "}
            ({deleteTargetAccount ? deleteTargetAccount.accountName : ""})? This action cannot be undone.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button
              ref={cancelDeleteRef}
              type="button"
              onClick={() => setDeleteTargetAccount(null)}
              disabled={isDeleting}
              style={{
                height: "38px",
                padding: "0 16px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{
                height: "38px",
                padding: "0 16px",
                borderRadius: "8px",
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isDeleting ? "not-allowed" : "pointer",
                opacity: isDeleting ? 0.7 : 1,
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Store"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShopifyAccounts;
