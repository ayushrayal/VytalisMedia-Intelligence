import React, { useState } from "react";
import { http } from "../../../lib/http.js";
import { Input } from "../../../components/ui/Input.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { User, Target, CheckCircle2, Lock, X, Shield, Sparkles } from "lucide-react";

/**
 * Profile Page Component.
 * Displays User Profile Info and Feature Access (Attribution Unlock Flow).
 */
export const Profile = ({ user, setUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isAttributionEnabled = Boolean(user?.attributionEnabled);

  const handleOpenModal = () => {
    setAccessKey("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setAccessKey("");
    setModalError("");
  };

  const handleEnableAttribution = async (e) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setModalError("Please enter your access key.");
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError("");

      const res = await http.post("/profile/attribution/enable", {
        accessKey: accessKey.trim(),
      });

      if (res.data && res.data.attributionEnabled) {
        // Update authenticated user state across the entire app
        const updatedUser = {
          ...user,
          attributionEnabled: true,
        };
        if (setUser) {
          setUser(updatedUser);
        }

        setIsModalOpen(false);
        setAccessKey("");
        setSuccessMessage("Attribution feature unlocked successfully!");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      setModalError("Invalid access key. Please try again.");
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
          Manage your personal account details and feature access add-ons.
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
              backgroundColor: "var(--color-primary, #0A84FF)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "24px",
              boxShadow: "0 4px 12px rgba(10, 132, 255, 0.25)",
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={28} />}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--color-text-primary, #0F2742)",
              }}
            >
              {user?.name || "Vytalis User"}
            </span>
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

      {/* CARD 2: FEATURE ACCESS */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--color-border, #E8EAED)",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--color-text-primary, #0F2742)",
              margin: "0 0 4px 0",
              letterSpacing: "-0.2px",
            }}
          >
            Feature Access
          </h2>
          <p style={{ margin: 0, fontSize: "13.5px", color: "var(--color-text-secondary, #60758F)" }}>
            Specialized modules and data analytics enabled for your account.
          </p>
        </div>

        {/* Feature Item: Attribution */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: isAttributionEnabled ? "rgba(10, 132, 255, 0.1)" : "#E2E8F0",
                color: isAttributionEnabled ? "#0A84FF" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Target size={22} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "var(--color-text-primary, #0F2742)",
                  }}
                >
                  Attribution
                </span>
                {isAttributionEnabled ? (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#0A84FF",
                      backgroundColor: "rgba(10, 132, 255, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    ✓ Enabled
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748B",
                      backgroundColor: "#E2E8F0",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    Disabled
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "13px",
                  color: "var(--color-text-secondary, #60758F)",
                }}
              >
                Unlock attribution analytics for this account.
              </p>
            </div>
          </div>

          <div>
            {isAttributionEnabled ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0A84FF",
                  backgroundColor: "rgba(10, 132, 255, 0.08)",
                  border: "1px solid rgba(10, 132, 255, 0.2)",
                  padding: "8px 14px",
                  borderRadius: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>✓ Attribution Enabled</span>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenModal}>
                <Lock size={14} style={{ marginRight: "6px" }} />
                Unlock Attribution
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* UNLOCK ATTRIBUTION MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              border: "1px solid var(--color-border, #E8EAED)",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  <Shield size={20} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--color-text-primary, #0F2742)",
                  }}
                >
                  Unlock Attribution
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "13.5px",
                color: "var(--color-text-secondary, #60758F)",
                lineHeight: "1.5",
              }}
            >
              Enter your Attribution access key to enable Attribution analytics for this account.
            </p>

            {modalError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(229, 72, 77, 0.10)",
                  border: "1px solid rgba(229, 72, 77, 0.25)",
                  borderRadius: "10px",
                  color: "#E5484D",
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "16px",
                }}
              >
                {modalError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEnableAttribution}>
              <div style={{ marginBottom: "20px" }}>
                <Input
                  label="Access Key"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter access key"
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Enable Attribution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
