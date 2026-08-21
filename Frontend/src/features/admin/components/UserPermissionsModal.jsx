import React, { useState, useEffect } from "react";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "../../../config/permission-registry.js";
import { Shield, Lock, Globe, Check, AlertCircle, Save, X } from "lucide-react";

/**
 * Categorized permission keys structure for Matrix UI
 */
const PERMISSION_SECTIONS = [
  {
    category: "Dashboard",
    keys: [PERMISSION_KEYS.DASHBOARD_VIEW],
  },
  {
    category: "Meta Analytics",
    keys: [
      PERMISSION_KEYS.META_VIEW,
      PERMISSION_KEYS.META_OVERVIEW,
      PERMISSION_KEYS.META_CAMPAIGNS,
      PERMISSION_KEYS.META_ADSETS,
      PERMISSION_KEYS.META_CREATIVES,
      PERMISSION_KEYS.META_WINNING_CREATIVES,
      PERMISSION_KEYS.META_POOR_PERFORMERS,
      PERMISSION_KEYS.META_AUDIENCE,
      PERMISSION_KEYS.META_PLACES,
      PERMISSION_KEYS.META_COMPARE,
    ],
  },
  {
    category: "Shopify Analytics",
    keys: [
      PERMISSION_KEYS.SHOPIFY_VIEW,
      PERMISSION_KEYS.SHOPIFY_OVERVIEW,
      PERMISSION_KEYS.SHOPIFY_ORDERS,
      PERMISSION_KEYS.SHOPIFY_PRODUCTS,
      PERMISSION_KEYS.SHOPIFY_CUSTOMERS,
      PERMISSION_KEYS.SHOPIFY_LOCATION,
      PERMISSION_KEYS.SHOPIFY_COMPARE,
    ],
  },
  {
    category: "Attribution Engine",
    keys: [PERMISSION_KEYS.ATTRIBUTION_VIEW],
  },
  {
    category: "User Management",
    keys: [
      PERMISSION_KEYS.USER_MANAGEMENT_ADMINS,
      PERMISSION_KEYS.USER_MANAGEMENT_CLIENTS,
      PERMISSION_KEYS.USER_MANAGEMENT_MEMBERS,
    ],
  },
];

export const UserPermissionsModal = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onPermissionsUpdated,
}) => {
  const isViewerRootAdmin = Boolean(currentUser?.role === "root_admin" || currentUser?.isRootAdmin);

  const [activeTab, setActiveTab] = useState("matrix"); // "matrix" | "global"
  const [assignedPermissions, setAssignedPermissions] = useState({});
  const [globalDeniedPermissions, setGlobalDeniedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && targetUser) {
      // Extract assignedPermissions map/object from targetUser
      let permsObj = {};
      if (targetUser.assignedPermissions) {
        if (typeof targetUser.assignedPermissions.get === "function") {
          targetUser.assignedPermissions.forEach((val, key) => {
            permsObj[key] = Boolean(val);
          });
        } else if (typeof targetUser.assignedPermissions === "object") {
          permsObj = { ...targetUser.assignedPermissions };
        }
      }
      setAssignedPermissions(permsObj);
      setError("");
      setFeedback("");
    }
  }, [isOpen, targetUser]);

  useEffect(() => {
    if (isOpen && isViewerRootAdmin) {
      fetchGlobalSettings();
    }
  }, [isOpen, isViewerRootAdmin]);

  const fetchGlobalSettings = async () => {
    try {
      setLoading(true);
      const res = await http.get("/admin/global-settings");
      if (res.data && res.data.globalSettings) {
        setGlobalDeniedPermissions(res.data.globalSettings.globalDeniedPermissions || []);
      }
    } catch (err) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !targetUser) return null;

  const handleToggleAssigned = (key) => {
    setAssignedPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleGlobalDeny = (key) => {
    setGlobalDeniedPermissions((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError("");

      if (activeTab === "global" && isViewerRootAdmin) {
        const res = await http.patch("/admin/global-settings", {
          globalDeniedPermissions,
        });
        if (res.data) {
          setFeedback("Global system restrictions updated successfully.");
          setTimeout(() => setFeedback(""), 3500);
        }
      } else {
        const res = await http.patch(`/admin/users/${targetUser._id}/permissions`, {
          permissions: assignedPermissions,
        });
        if (res.data && res.data.user) {
          if (onPermissionsUpdated) {
            onPermissionsUpdated(res.data.user);
          }
          setFeedback(`Permissions updated for ${targetUser.name}`);
          setTimeout(() => {
            setFeedback("");
            onClose();
          }, 1500);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={() => !saving && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
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
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F2742" }}>
                Permission Controls · {targetUser.name}
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                Role: <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{targetUser.role}</span> | Email: {targetUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection (Matrix vs Global System Controls for Root Admin) */}
        {isViewerRootAdmin && (
          <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF", padding: "0 24px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              style={{
                padding: "12px 16px",
                border: "none",
                borderBottom: activeTab === "matrix" ? "2px solid #0A84FF" : "2px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "matrix" ? "#0A84FF" : "#64748B",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={14} /> User Permissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              style={{
                padding: "12px 16px",
                border: "none",
                borderBottom: activeTab === "global" ? "2px solid #7C3AED" : "2px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "global" ? "#7C3AED" : "#64748B",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Globe size={14} /> Global System Restrictions (Root Admin)
            </button>
          </div>
        )}

        {/* Modal Feedback & Errors */}
        {feedback && (
          <div style={{ padding: "10px 24px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <Check size={16} /> {feedback}
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 24px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#DC2626", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeTab === "matrix" ? (
            /* USER PERMISSION MATRIX */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {PERMISSION_SECTIONS.map((section) => {
                // Filter keys in section strictly by viewer's (currentUser) authority ceiling
                const authorizedKeys = section.keys.filter((key) => {
                  if (isViewerRootAdmin) return true;

                  // 1. Primary check: Manager's effectivePermissions calculated by backend
                  if (currentUser?.effectivePermissions && currentUser.effectivePermissions[key]) {
                    return Boolean(currentUser.effectivePermissions[key].allowed);
                  }

                  // 2. Fallback check: Manager's assignedPermissions map/array
                  if (currentUser?.assignedPermissions) {
                    if (Array.isArray(currentUser.assignedPermissions)) {
                      const entry = currentUser.assignedPermissions.find((p) => p && p.key === key);
                      if (entry) return Boolean(entry.allowed);
                    } else if (typeof currentUser.assignedPermissions === "object") {
                      if (key in currentUser.assignedPermissions) {
                        return Boolean(currentUser.assignedPermissions[key]);
                      }
                    }
                  }

                  return false;
                });

                if (authorizedKeys.length === 0) return null;

                return (
                  <div key={section.category} style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {section.category}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {authorizedKeys.map((permKey) => {
                        const effDetail = targetUser.effectivePermissions?.[permKey] || {};
                        const isLocked = Boolean(effDetail.locked);
                        const lockReason = effDetail.lockReason;
                        const isAssigned = Boolean(assignedPermissions[permKey]);

                        let lockLabel = "";
                        if (lockReason === "disabled_by_root_admin") lockLabel = "🔒 Disabled by Root Admin";
                        else if (lockReason === "disabled_by_admin") lockLabel = "🔒 Disabled by Admin";
                        else if (lockReason === "disabled_by_client") lockLabel = "🔒 Disabled by Client";
                        else if (lockReason === "organization_disabled") lockLabel = "🔒 Organization Disabled";

                        return (
                          <div
                            key={permKey}
                            style={{
                              padding: "12px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              borderBottom: "1px solid #F1F5F9",
                              backgroundColor: isLocked ? "#FAF5FF" : "#FFFFFF",
                            }}
                          >
                            <div>
                              <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#0F2742", display: "block" }}>
                                {PERMISSION_LABELS[permKey] || permKey}
                              </span>
                              <span style={{ fontSize: "11px", color: "#64748B" }}>
                                Key: {permKey}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {isLocked ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 10px",
                                    backgroundColor: "rgba(124, 58, 237, 0.1)",
                                    color: "#7C3AED",
                                    fontSize: "11.5px",
                                    fontWeight: "700",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(124, 58, 237, 0.2)",
                                  }}
                                  title="This permission is locked by a higher parent restriction. Saved toggle state is preserved."
                                >
                                  <Lock size={12} />
                                  <span>{lockLabel}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAssigned(permKey)}
                                  style={{
                                    position: "relative",
                                    width: "44px",
                                    height: "24px",
                                    borderRadius: "12px",
                                    backgroundColor: isAssigned ? "#0A84FF" : "#CBD5E1",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease",
                                    padding: 0,
                                    outline: "none",
                                  }}
                                >
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: "2px",
                                      left: isAssigned ? "22px" : "2px",
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      backgroundColor: "#FFFFFF",
                                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                                      transition: "left 0.2s ease",
                                    }}
                                  />
                                </button>
                              )}

                              <span style={{ fontSize: "12px", fontWeight: "700", minWidth: "30px", color: isAssigned ? "#0A84FF" : "#64748B" }}>
                                {isAssigned ? "ON" : "OFF"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GLOBAL SYSTEM RESTRICTIONS (ROOT ADMIN ONLY) */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: "10px", color: "#6D28D9", fontSize: "13px", lineHeight: "1.4" }}>
                <strong>Root Admin Global Control:</strong> Toggling a permission OFF here globally disables effective access for ALL lower-level users system-wide without overwriting their individual saved configuration.
              </div>

              {PERMISSION_SECTIONS.map((section) => (
                <div key={section.category} style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                    {section.category}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {section.keys.map((permKey) => {
                      const isGloballyDenied = globalDeniedPermissions.includes(permKey);
                      return (
                        <div
                          key={permKey}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #F1F5F9",
                            backgroundColor: isGloballyDenied ? "#FEF2F2" : "#FFFFFF",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#0F2742", display: "block" }}>
                              {PERMISSION_LABELS[permKey] || permKey}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              Key: {permKey}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleGlobalDeny(permKey)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: isGloballyDenied ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
                              backgroundColor: isGloballyDenied ? "#EF4444" : "#10B981",
                              color: "#FFFFFF",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {isGloballyDenied ? "Globally Denied (OFF)" : "Globally Allowed (ON)"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#475569",
              fontSize: "13px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={saving}
            style={{
              height: "38px",
              padding: "0 18px",
              borderRadius: "8px",
              backgroundColor: activeTab === "global" ? "#7C3AED" : "#0A84FF",
              border: "none",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: saving ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(10, 132, 255, 0.2)",
            }}
          >
            <Save size={15} />
            <span>{saving ? "Saving..." : "Save Permissions"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;
