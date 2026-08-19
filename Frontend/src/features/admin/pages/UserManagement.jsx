import React, { useState, useEffect, useCallback } from "react";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { Users, Shield, CheckCircle2, ShoppingCart, Target, RefreshCw } from "lucide-react";

/**
 * User Management Admin Dashboard Page Component.
 * Enables Administrators to view all registered users and toggle Shopify & Attribution
 * permissions independently for each user.
 */
export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get("/admin/users");
      if (res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleFeature = async (user, featureName, currentVal) => {
    const newVal = !currentVal;
    try {
      setUpdatingUserId(`${user._id}_${featureName}`);
      
      const payload = {
        [featureName]: newVal,
      };

      const res = await http.patch(`/admin/users/${user._id}/features`, payload);

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === user._id ? { ...u, ...res.data.user } : u))
        );
        const featureLabel = featureName === "shopifyEnabled" ? "Shopify" : "Attribution";
        const statusLabel = newVal ? "enabled" : "disabled";
        setFeedbackMessage(`${featureLabel} ${statusLabel} for ${user.name}`);
        setTimeout(() => setFeedbackMessage(""), 3500);
      }
    } catch (err) {
      alert(`Failed to update feature access: ${getErrorMessage(err)}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(10, 132, 255, 0.1)",
                color: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={20} />
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "var(--color-text-primary, #0F2742)",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              User Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary, #60758F)" }}>
            Manage user access and feature visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border, #E2E8F0)",
            color: "var(--color-text-primary, #0F172A)",
            fontSize: "13px",
            fontWeight: "600",
            cursor: loading ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Users</span>
        </button>
      </div>

      {feedbackMessage && (
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            color: "#059669",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="user-management" minHeight="auto" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border, #E8EAED)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              backgroundColor: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              fontSize: "13px",
              fontWeight: "700",
              color: "#64748B",
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div>USER DETAILS</div>
            <div>ROLE</div>
            <div style={{ textAlign: "center" }}>SHOPIFY ACCESS</div>
            <div style={{ textAlign: "center" }}>ATTRIBUTION ACCESS</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {users.map((u, index) => {
              const isAdmin = u.role === "admin";
              const isShopifyUpdating = updatingUserId === `${u._id}_shopifyEnabled`;
              const isAttributionUpdating = updatingUserId === `${u._id}_attributionEnabled`;

              return (
                <div
                  key={u._id}
                  style={{
                    padding: "20px 24px",
                    borderBottom: index === users.length - 1 ? "none" : "1px solid #F1F5F9",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    gap: "16px",
                    alignItems: "center",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* User Profile Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: isAdmin ? "rgba(16, 185, 129, 0.1)" : "rgba(10, 132, 255, 0.1)",
                        color: isAdmin ? "#10B981" : "#0A84FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div style={{ overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#0F2742",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name || "User"}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.email}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    {isAdmin ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          color: "#059669",
                          fontSize: "12px",
                          fontWeight: "700",
                          borderRadius: "6px",
                        }}
                      >
                        <Shield size={13} />
                        Admin
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          backgroundColor: "#F1F5F9",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "6px",
                        }}
                      >
                        Client
                      </span>
                    )}
                  </div>

                  {/* Shopify Toggle */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(u, "shopifyEnabled", Boolean(u.shopifyEnabled))}
                      disabled={isShopifyUpdating}
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "26px",
                        borderRadius: "13px",
                        backgroundColor: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#CBD5E1",
                        border: "none",
                        cursor: isShopifyUpdating ? "wait" : "pointer",
                        transition: "background-color 0.2s ease",
                        padding: 0,
                        outline: "none",
                        opacity: isShopifyUpdating ? 0.6 : 1,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: Boolean(u.shopifyEnabled) ? "25px" : "3px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </button>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#64748B" }}>
                      {Boolean(u.shopifyEnabled) ? "ON" : "OFF"}
                    </span>
                  </div>

                  {/* Attribution Toggle */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(u, "attributionEnabled", Boolean(u.attributionEnabled))}
                      disabled={isAttributionUpdating}
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "26px",
                        borderRadius: "13px",
                        backgroundColor: Boolean(u.attributionEnabled) ? "#0A84FF" : "#CBD5E1",
                        border: "none",
                        cursor: isAttributionUpdating ? "wait" : "pointer",
                        transition: "background-color 0.2s ease",
                        padding: 0,
                        outline: "none",
                        opacity: isAttributionUpdating ? 0.6 : 1,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: Boolean(u.attributionEnabled) ? "25px" : "3px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </button>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: Boolean(u.attributionEnabled) ? "#0A84FF" : "#64748B" }}>
                      {Boolean(u.attributionEnabled) ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
