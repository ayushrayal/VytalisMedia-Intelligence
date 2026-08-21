import React, { useState } from "react";
import { http } from "../../../lib/http.js";
import { Input } from "../../../components/ui/Input.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { User, CheckCircle2, Shield, Crown, Sparkles, X, KeyRound } from "lucide-react";

/**
 * Profile Page Component.
 * Displays User Profile Info and Role Upgrade Flow.
 */
export const Profile = ({ user, setUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upgradeKey, setUpgradeKey] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isAdmin = user?.role === "admin";

  const handleOpenModal = () => {
    setUpgradeKey("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setUpgradeKey("");
    setModalError("");
  };

  const handleUpgradeRole = async (e) => {
    e.preventDefault();
    if (!upgradeKey.trim()) {
      setModalError("Please enter your administrator access key.");
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError("");

      const res = await http.post("/profile/upgrade-role", {
        key: upgradeKey.trim(),
      });

      if (res.data && res.data.user) {
        if (setUser) {
          setUser(res.data.user);
        }

        setIsModalOpen(false);
        setUpgradeKey("");
        const msg = res.data.user?.isRootAdmin
          ? "Account successfully designated as Root Administrator!"
          : "Account role upgraded to Administrator successfully!";
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (err) {
      setModalError(err.message || "Invalid administrator access key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Page Title Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "var(--color-text-primary, #0F2742)",
            letterSpacing: "-0.5px",
            margin: "0 0 6px 0",
          }}
        >
          Profile & Account
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary, #60758F)" }}>
          Manage your personal account details and access privileges.
        </p>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            color: "#059669",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CARD 1: PROFILE INFORMATION */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--color-border, #E8EAED)",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "var(--color-text-primary, #0F2742)",
            margin: "0 0 20px 0",
            letterSpacing: "-0.2px",
          }}
        >
          Profile Information
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: isAdmin ? "#10B981" : "var(--color-primary, #0A84FF)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "24px",
              boxShadow: isAdmin
                ? "0 4px 12px rgba(16, 185, 129, 0.25)"
                : "0 4px 12px rgba(10, 132, 255, 0.25)",
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={28} />}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--color-text-primary, #0F2742)",
                }}
              >
                {user?.name || "Vytalis User"}
              </span>
              {user?.role === "root_admin" || user?.isRootAdmin ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 9px",
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    color: "#7C3AED",
                    fontSize: "12px",
                    fontWeight: "700",
                    borderRadius: "6px",
                    border: "1px solid rgba(124, 58, 237, 0.25)",
                  }}
                >
                  <Crown size={13} />
                  Root Admin
                </span>
              ) : user?.role === "admin" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 9px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    fontSize: "12px",
                    fontWeight: "700",
                    borderRadius: "6px",
                  }}
                >
                  <Shield size={13} />
                  Admin Account
                </span>
              ) : user?.role === "member" ? (
                <span
                  style={{
                    padding: "3px 9px",
                    backgroundColor: "#EFF6FF",
                    color: "#1D4ED8",
                    fontSize: "12px",
                    fontWeight: "700",
                    borderRadius: "6px",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  Member Account
                </span>
              ) : (
                <span
                  style={{
                    padding: "3px 9px",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    borderRadius: "6px",
                  }}
                >
                  Client Account
                </span>
              )}
            </div>
            <span style={{ fontSize: "14px", color: "var(--color-text-secondary, #60758F)" }}>
              {user?.email || "user@vytalis.com"}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-border, #E8EAED)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--color-text-secondary, #60758F)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Subscription Plan
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "rgba(10, 132, 255, 0.08)",
                color: "#0A84FF",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "8px",
              }}
            >
              <Sparkles size={14} />
              Vytalis Intelligence Pro
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--color-text-secondary, #60758F)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Account Status
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10B981",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "8px",
              }}
            >
              <CheckCircle2 size={14} />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: PERSONAL SIDEBAR NAVIGATION PREFERENCES */}
      <SidebarNavigationPreferences user={user} setUser={setUser} />
    </div>
  );
};

const SidebarNavigationPreferences = ({ user, setUser }) => {
  const hiddenFeatures = Array.isArray(user?.preferences?.hiddenFeatures)
    ? user.preferences.hiddenFeatures
    : [];

  const [savingKey, setSavingKey] = useState(null);

  const features = [
    { key: "meta", label: "Meta Analytics", perm: "meta.view" },
    { key: "shopify", label: "Shopify Analytics", perm: "shopify.view" },
    { key: "attribution", label: "Attribution Engine", perm: "attribution.view" },
    { key: "overview", label: "Overview Dashboard", perm: "dashboard.view" },
  ];

  const handleToggleHide = async (featureKey) => {
    let nextHidden;
    if (hiddenFeatures.includes(featureKey)) {
      nextHidden = hiddenFeatures.filter((k) => k !== featureKey);
    } else {
      nextHidden = [...hiddenFeatures, featureKey];
    }

    try {
      setSavingKey(featureKey);
      const res = await http.put("/profile/navigation-preferences", {
        hiddenFeatures: nextHidden,
      });
      if (res.data && setUser) {
        setUser((prev) => ({
          ...prev,
          preferences: {
            ...(prev?.preferences || {}),
            hiddenFeatures: nextHidden,
          },
        }));
      }
    } catch (err) {
      alert("Failed to update navigation preference: " + (err.message || "Unknown error"));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--color-border, #E8EAED)",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "var(--color-text-primary, #0F2742)",
            margin: "0 0 4px 0",
            letterSpacing: "-0.2px",
          }}
        >
          Personal Navigation Preferences
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary, #60758F)", lineHeight: "1.4" }}>
          Customize feature visibility in your sidebar navigation. Hiding a feature only removes it from your sidebar UI and does not revoke your authorization or authority to grant it to others.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {features.map((item) => {
          const isHidden = hiddenFeatures.includes(item.key);
          const isSaving = savingKey === item.key;

          return (
            <div
              key={item.key}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                backgroundColor: isHidden ? "#F8FAFC" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0F2742", display: "block" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: "12px", color: isHidden ? "#94A3B8" : "#059669" }}>
                  {isHidden ? "Hidden from sidebar (Direct URL accessible)" : "Visible in sidebar"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleHide(item.key)}
                disabled={isSaving}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: isHidden ? "1px solid #CBD5E1" : "1px solid rgba(10, 132, 255, 0.3)",
                  backgroundColor: isHidden ? "#F1F5F9" : "#0A84FF",
                  color: isHidden ? "#475569" : "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: isSaving ? "wait" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {isSaving ? "Updating..." : isHidden ? "Show in Sidebar" : "Hide from Sidebar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profile;
