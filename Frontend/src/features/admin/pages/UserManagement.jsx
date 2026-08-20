import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { AddUserModal } from "../components/AddUserModal.jsx";
import {
  Users,
  Shield,
  Crown,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpDown,
  UserCheck,
  UserX,
  MoreVertical,
  ChevronDown,
} from "lucide-react";

/**
 * Human-readable relative timestamp formatter for lastActiveAt
 */
const formatLastActive = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hr" : "hrs"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

/**
 * User Management Admin Dashboard Page Component.
 * Polished, Linear/Stripe-style Admin UI with compact dropdown actions,
 * responsive cards, and strict RBAC enforcement.
 */
export const UserManagement = ({ currentUser }) => {
  const outletContext = useOutletContext() || {};
  const effectiveUser = currentUser || outletContext.user || null;
  const isRootAdmin = Boolean(effectiveUser?.isRootAdmin === true);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("default"); // "default", "active", "name"

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToPromote, setUserToPromote] = useState(null);
  const [userToDemote, setUserToDemote] = useState(null);
  const [userToMakeRoot, setUserToMakeRoot] = useState(null);
  const [userToRemoveRoot, setUserToRemoveRoot] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);
  const [isMakingRoot, setIsMakingRoot] = useState(false);
  const [isRemovingRoot, setIsRemovingRoot] = useState(false);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside and Escape key to close action dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setOpenDropdownId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  // Handle Feature Toggles (Shopify & Attribution)
  const handleToggleFeature = async (targetUser, featureName, currentVal) => {
    const newVal = !currentVal;
    try {
      setUpdatingUserId(`${targetUser._id}_${featureName}`);
      const payload = { [featureName]: newVal };

      const res = await http.patch(`/admin/users/${targetUser._id}/features`, payload);

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === targetUser._id ? { ...u, ...res.data.user } : u))
        );
        const featureLabel = featureName === "shopifyEnabled" ? "Shopify" : "Attribution";
        const statusLabel = newVal ? "enabled" : "disabled";
        setFeedbackMessage(`${featureLabel} ${statusLabel} for ${targetUser.name}`);
        setTimeout(() => setFeedbackMessage(""), 3500);
      }
    } catch (err) {
      alert(`Failed to update feature access: ${getErrorMessage(err)}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Confirm Promotion (Client -> Admin)
  const confirmPromoteUser = async () => {
    if (!userToPromote) return;
    try {
      setIsPromoting(true);
      const res = await http.patch(`/admin/users/${userToPromote._id}/role`, { role: "admin" });

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userToPromote._id ? { ...u, ...res.data.user } : u))
        );
        setFeedbackMessage("User promoted to Admin successfully.");
        setTimeout(() => setFeedbackMessage(""), 3500);
        setUserToPromote(null);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to change user roles.");
      } else {
        alert(getErrorMessage(err) || "Failed to promote user.");
      }
    } finally {
      setIsPromoting(false);
    }
  };

  // Confirm Demotion (Admin -> Client)
  const confirmDemoteUser = async () => {
    if (!userToDemote) return;
    try {
      setIsDemoting(true);
      const res = await http.patch(`/admin/users/${userToDemote._id}/role`, { role: "client" });

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userToDemote._id ? { ...u, ...res.data.user } : u))
        );
        setFeedbackMessage("Admin access removed successfully.");
        setTimeout(() => setFeedbackMessage(""), 3500);
        setUserToDemote(null);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to change user roles.");
      } else {
        alert(getErrorMessage(err) || "Failed to remove admin access.");
      }
    } finally {
      setIsDemoting(false);
    }
  };

  // Confirm Grant Root Admin Status (Client/Admin -> Root Admin)
  const confirmMakeRootUser = async () => {
    if (!userToMakeRoot) return;
    try {
      setIsMakingRoot(true);
      const res = await http.patch(`/admin/users/${userToMakeRoot._id}/root-status`, { isRootAdmin: true });

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userToMakeRoot._id ? { ...u, ...res.data.user } : u))
        );
        setFeedbackMessage(`${userToMakeRoot.name} is now a Root Administrator.`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        setUserToMakeRoot(null);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Only the Root Administrator can modify Root Administrator status.");
      } else {
        alert(getErrorMessage(err) || "Failed to grant Root Admin status.");
      }
    } finally {
      setIsMakingRoot(false);
    }
  };

  // Confirm Remove Root Admin Status (Root Admin -> Regular Admin)
  const confirmRemoveRootUser = async () => {
    if (!userToRemoveRoot) return;
    try {
      setIsRemovingRoot(true);
      const res = await http.patch(`/admin/users/${userToRemoveRoot._id}/root-status`, { isRootAdmin: false });

      if (res.data && res.data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userToRemoveRoot._id ? { ...u, ...res.data.user } : u))
        );
        setFeedbackMessage(`Root Administrator status removed from ${userToRemoveRoot.name}.`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        setUserToRemoveRoot(null);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        alert("You cannot remove your own Root Administrator status.");
      } else if (err.response?.status === 403) {
        alert("Only the Root Administrator can modify Root Administrator status.");
      } else {
        alert(getErrorMessage(err) || "Failed to remove Root Admin status.");
      }
    } finally {
      setIsRemovingRoot(false);
    }
  };

  // Confirm User Deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await http.delete(`/admin/users/${userToDelete._id}`);

      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userToDelete._id));
      setFeedbackMessage(`Account for ${userToDelete.name} has been permanently deleted.`);
      setTimeout(() => setFeedbackMessage(""), 3500);
      setUserToDelete(null);
    } catch (err) {
      alert(`Deletion failed: ${getErrorMessage(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Users by Search Query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);

    const metaAcc = u.integrations?.meta?.[0];
    const metaIdMatch = metaAcc?.accountId?.toLowerCase().includes(q);
    const metaNameMatch = metaAcc?.accountName?.toLowerCase().includes(q);

    return nameMatch || emailMatch || metaIdMatch || metaNameMatch;
  });

  // Sort Users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortMode === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortMode === "active") {
      const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return timeB - timeA;
    }
    // Default sorting: Root Admin (1) -> Admins (2) -> Clients (3), then lastActiveAt descending
    const getRolePriority = (u) => {
      if (u.isRootAdmin) return 1;
      if (u.role === "admin") return 2;
      return 3;
    };
    const prioA = getRolePriority(a);
    const prioB = getRolePriority(b);
    if (prioA !== prioB) return prioA - prioB;

    const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
    const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", paddingBottom: "48px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
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
            Manage user access, roles, and feature visibility.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              height: "38px",
              padding: "0 18px",
              borderRadius: "8px",
              backgroundColor: "#0A84FF",
              border: "none",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(10, 132, 255, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            style={{
              height: "38px",
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Banner */}
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

      {/* Toolbar (Search & Sort) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Search Bar */}
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or Meta account..."
            style={{
              width: "100%",
              height: "40px",
              paddingLeft: "40px",
              paddingRight: "14px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: "13.5px",
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          />
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: isMobile ? "100%" : "auto" }}>
          <ArrowUpDown size={14} color="#64748B" />
          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>Sort by:</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            style={{
              height: "40px",
              padding: "0 12px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              color: "#0F172A",
              outline: "none",
              cursor: "pointer",
              flex: isMobile ? 1 : "none",
            }}
          >
            <option value="default">Hierarchy & Activity (Default)</option>
            <option value="active">Most Recently Active</option>
            <option value="name">Alphabetical (Name)</option>
          </select>
        </div>
      </div>

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
      ) : isMobile ? (
        /* MOBILE / TABLET CARD VIEW */
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {sortedUsers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
              No users found matching your search.
            </div>
          ) : (
            sortedUsers.map((u) => {
              const isTargetRoot = u.isRootAdmin === true;
              const isTargetAdmin = u.role === "admin";
              const metaAccount = u.integrations?.meta?.[0];
              const isSelf = u._id === effectiveUser?._id;
              const canDelete = !isSelf && !isTargetRoot && (isRootAdmin || !isTargetAdmin);

              const isShopifyUpdating = updatingUserId === `${u._id}_shopifyEnabled`;
              const isAttributionUpdating = updatingUserId === `${u._id}_attributionEnabled`;

              const hasAvailableActions =
                isRootAdmin
                  ? !isSelf // Root admin has actions for all non-self users
                  : canDelete; // Regular admin can delete client

              return (
                <div
                  key={u._id}
                  style={{
                    backgroundColor: isTargetRoot ? "rgba(124, 58, 237, 0.02)" : "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: isTargetRoot
                            ? "rgba(124, 58, 237, 0.15)"
                            : isTargetAdmin
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(10, 132, 255, 0.1)",
                          color: isTargetRoot ? "#7C3AED" : isTargetAdmin ? "#059669" : "#0A84FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "15px",
                          flexShrink: 0,
                        }}
                      >
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#0F2742", display: "block" }}>
                          {u.name || "User"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
                          {u.email}
                        </span>
                        {metaAccount && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "3px", fontSize: "11px", color: "#6366F1", fontWeight: "600" }}>
                            <Layers size={11} />
                            <span>{metaAccount.accountId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Dropdown Button */}
                    {hasAvailableActions && (
                      <div className="action-menu-container" style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === u._id ? null : u._id)}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: openDropdownId === u._id ? "#F1F5F9" : "transparent",
                            border: "1px solid #E2E8F0",
                            color: "#475569",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === u._id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "38px",
                              width: "180px",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              borderRadius: "10px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                              padding: "6px",
                              zIndex: 100,
                            }}
                          >
                            {!isTargetAdmin && !isTargetRoot && isRootAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToPromote(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#059669",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                  }}
                                >
                                  <UserCheck size={14} /> Make Admin
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToMakeRoot(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#7C3AED",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                  }}
                                >
                                  <Crown size={14} /> Make Root Admin
                                </button>
                              </>
                            )}

                            {isTargetAdmin && !isTargetRoot && isRootAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToMakeRoot(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#7C3AED",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                  }}
                                >
                                  <Crown size={14} /> Make Root Admin
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToDemote(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#DC2626",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                  }}
                                >
                                  <UserX size={14} /> Remove Admin
                                </button>
                              </>
                            )}

                            {isTargetRoot && !isSelf && isRootAdmin && (
                              <button
                                type="button"
                                onClick={() => { setOpenDropdownId(null); setUserToRemoveRoot(u); }}
                                style={{
                                  width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                  textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#DC2626",
                                  borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                }}
                              >
                                <UserX size={14} /> Remove Root Admin
                              </button>
                            )}

                            {canDelete && (
                              <>
                                {(isRootAdmin && !isTargetRoot) && <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "4px 0" }} />}
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToDelete(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#EF4444",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                                  }}
                                >
                                  <Trash2 size={14} /> Delete User
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "4px" }}>ROLE</span>
                      {isTargetRoot ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", backgroundColor: "rgba(124, 58, 237, 0.12)", color: "#7C3AED", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                          <Crown size={12} /> Root Admin
                        </span>
                      ) : isTargetAdmin ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", backgroundColor: "#F1F5F9", color: "#475569", fontSize: "11px", fontWeight: "600", borderRadius: "6px" }}>
                          Client
                        </span>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "4px" }}>LAST ACTIVE</span>
                      <span style={{ fontSize: "12px", color: u.lastActiveAt ? "#334155" : "#94A3B8", fontWeight: "500" }}>
                        {formatLastActive(u.lastActiveAt)}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "4px" }}>SHOPIFY</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "shopifyEnabled", Boolean(u.shopifyEnabled))}
                        disabled={isShopifyUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", padding: 0
                        }}
                      >
                        <span style={{ width: "36px", height: "20px", borderRadius: "10px", backgroundColor: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#CBD5E1", position: "relative" }}>
                          <span style={{ position: "absolute", top: "2px", left: Boolean(u.shopifyEnabled) ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#FFFFFF", transition: "left 0.2s" }} />
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#64748B" }}>
                          {Boolean(u.shopifyEnabled) ? "ON" : "OFF"}
                        </span>
                      </button>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "4px" }}>ATTRIBUTION</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "attributionEnabled", Boolean(u.attributionEnabled))}
                        disabled={isAttributionUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", padding: 0
                        }}
                      >
                        <span style={{ width: "36px", height: "20px", borderRadius: "10px", backgroundColor: Boolean(u.attributionEnabled) ? "#0A84FF" : "#CBD5E1", position: "relative" }}>
                          <span style={{ position: "absolute", top: "2px", left: Boolean(u.attributionEnabled) ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#FFFFFF", transition: "left 0.2s" }} />
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: Boolean(u.attributionEnabled) ? "#0A84FF" : "#64748B" }}>
                          {Boolean(u.attributionEnabled) ? "ON" : "OFF"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* DESKTOP TABLE VIEW */
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border, #E8EAED)",
            borderRadius: "16px",
            overflow: "visible",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              padding: "14px 24px",
              backgroundColor: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              borderRadius: "16px 16px 0 0",
              fontSize: "11.5px",
              fontWeight: "700",
              color: "#64748B",
              display: "grid",
              gridTemplateColumns: "30% 12% 10% 12% 14% 12%",
              gap: "12px",
              alignItems: "center",
              letterSpacing: "0.5px",
            }}
          >
            <div>USER DETAILS</div>
            <div>ROLE</div>
            <div style={{ textAlign: "center" }}>SHOPIFY</div>
            <div style={{ textAlign: "center" }}>ATTRIBUTION</div>
            <div>LAST ACTIVE</div>
            <div style={{ textAlign: "right" }}>ACTIONS</div>
          </div>

          {/* Table Body */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sortedUsers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                No users found matching your search.
              </div>
            ) : (
              sortedUsers.map((u, index) => {
                const isTargetRoot = u.isRootAdmin === true;
                const isTargetAdmin = u.role === "admin";
                const metaAccount = u.integrations?.meta?.[0];

                const isShopifyUpdating = updatingUserId === `${u._id}_shopifyEnabled`;
                const isAttributionUpdating = updatingUserId === `${u._id}_attributionEnabled`;

                const isSelf = u._id === effectiveUser?._id;
                const canDelete = !isSelf && !isTargetRoot && (isRootAdmin || !isTargetAdmin);

                const hasAvailableActions =
                  isRootAdmin
                    ? !isSelf
                    : canDelete;

                return (
                  <div
                    key={u._id}
                    style={{
                      padding: "16px 24px",
                      minHeight: "80px",
                      borderBottom: index === sortedUsers.length - 1 ? "none" : "1px solid #F1F5F9",
                      display: "grid",
                      gridTemplateColumns: "30% 12% 10% 12% 14% 12%",
                      gap: "12px",
                      alignItems: "center",
                      transition: "background-color 0.15s ease",
                      backgroundColor: isTargetRoot ? "rgba(124, 58, 237, 0.02)" : "#FFFFFF",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isTargetRoot) e.currentTarget.style.backgroundColor = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      if (!isTargetRoot) e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    {/* User Profile Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          backgroundColor: isTargetRoot
                            ? "rgba(124, 58, 237, 0.15)"
                            : isTargetAdmin
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(10, 132, 255, 0.1)",
                          color: isTargetRoot ? "#7C3AED" : isTargetAdmin ? "#059669" : "#0A84FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "14.5px",
                          flexShrink: 0,
                        }}
                      >
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>

                      <div style={{ overflow: "hidden" }}>
                        <span
                          style={{
                            fontSize: "14px",
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
                            fontSize: "12px",
                            color: "#64748B",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.email}
                        </span>

                        {metaAccount && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "2px",
                              fontSize: "11px",
                              color: "#6366F1",
                              fontWeight: "600",
                            }}
                            title={`Meta: ${metaAccount.accountName} (${metaAccount.accountId})`}
                          >
                            <Layers size={10} />
                            <span>{metaAccount.accountId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Badge Column */}
                    <div>
                      {isTargetRoot ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 9px",
                            backgroundColor: "rgba(124, 58, 237, 0.12)",
                            color: "#7C3AED",
                            fontSize: "12px",
                            fontWeight: "700",
                            borderRadius: "6px",
                            border: "1px solid rgba(124, 58, 237, 0.2)",
                          }}
                        >
                          <Crown size={12} />
                          Root Admin
                        </span>
                      ) : isTargetAdmin ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 9px",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            color: "#059669",
                            fontSize: "12px",
                            fontWeight: "700",
                            borderRadius: "6px",
                          }}
                        >
                          <Shield size={12} />
                          Admin
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 9px",
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifySelf: "center", gap: "2px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "shopifyEnabled", Boolean(u.shopifyEnabled))}
                        disabled={isShopifyUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          position: "relative",
                          width: "40px",
                          height: "22px",
                          borderRadius: "11px",
                          backgroundColor: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#CBD5E1",
                          border: "none",
                          cursor: isShopifyUpdating ? "wait" : "pointer",
                          transition: "background-color 0.2s ease",
                          padding: 0,
                          outline: "none",
                          opacity: isShopifyUpdating || (isTargetRoot && !isRootAdmin) ? 0.6 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "2px",
                            left: Boolean(u.shopifyEnabled) ? "20px" : "2px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                      <span style={{ fontSize: "10.5px", fontWeight: "700", color: Boolean(u.shopifyEnabled) ? "#0A84FF" : "#64748B" }}>
                        {Boolean(u.shopifyEnabled) ? "ON" : "OFF"}
                      </span>
                    </div>

                    {/* Attribution Toggle */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifySelf: "center", gap: "2px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "attributionEnabled", Boolean(u.attributionEnabled))}
                        disabled={isAttributionUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          position: "relative",
                          width: "40px",
                          height: "22px",
                          borderRadius: "11px",
                          backgroundColor: Boolean(u.attributionEnabled) ? "#0A84FF" : "#CBD5E1",
                          border: "none",
                          cursor: isAttributionUpdating ? "wait" : "pointer",
                          transition: "background-color 0.2s ease",
                          padding: 0,
                          outline: "none",
                          opacity: isAttributionUpdating || (isTargetRoot && !isRootAdmin) ? 0.6 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "2px",
                            left: Boolean(u.attributionEnabled) ? "20px" : "2px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                            transition: "left 0.2s ease",
                          }}
                        />
                      </button>
                      <span style={{ fontSize: "10.5px", fontWeight: "700", color: Boolean(u.attributionEnabled) ? "#0A84FF" : "#64748B" }}>
                        {Boolean(u.attributionEnabled) ? "ON" : "OFF"}
                      </span>
                    </div>

                    {/* Last Active */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} color="#94A3B8" />
                      <span
                        style={{ fontSize: "13px", color: u.lastActiveAt ? "#334155" : "#94A3B8", fontWeight: "500" }}
                        title={u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "Never logged in"}
                      >
                        {formatLastActive(u.lastActiveAt)}
                      </span>
                    </div>

                    {/* Actions Column: Compact Dropdown Menu */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      {hasAvailableActions ? (
                        <div className="action-menu-container" style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === u._id ? null : u._id)}
                            style={{
                              height: "32px",
                              padding: "0 10px",
                              borderRadius: "8px",
                              backgroundColor: openDropdownId === u._id ? "#F1F5F9" : "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              color: "#334155",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span>Actions</span>
                            <ChevronDown size={13} style={{ transition: "transform 0.2s ease", transform: openDropdownId === u._id ? "rotate(180deg)" : "none" }} />
                          </button>

                          {/* Linear/Stripe style Popover Dropdown Menu */}
                          {openDropdownId === u._id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "38px",
                                width: "190px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "10px",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                padding: "6px",
                                zIndex: 100,
                              }}
                            >
                              {/* Make Admin (Client target, Root Admin viewer) */}
                              {!isTargetAdmin && !isTargetRoot && isRootAdmin && (
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToPromote(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#059669",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                    transition: "background-color 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F0FDF4")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                  <UserCheck size={14} />
                                  <span>Make Admin</span>
                                </button>
                              )}

                              {/* Make Root Admin (Client or Regular Admin target, Root Admin viewer) */}
                              {!isTargetRoot && isRootAdmin && (
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToMakeRoot(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#7C3AED",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                    transition: "background-color 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F3FF")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                  <Crown size={14} />
                                  <span>Make Root Admin</span>
                                </button>
                              )}

                              {/* Remove Admin (Regular Admin target, Root Admin viewer) */}
                              {isTargetAdmin && !isTargetRoot && isRootAdmin && (
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToDemote(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#DC2626",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                    transition: "background-color 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                  <UserX size={14} />
                                  <span>Remove Admin</span>
                                </button>
                              )}

                              {/* Remove Root Admin (Root Admin target, Root Admin viewer) */}
                              {isTargetRoot && !isSelf && isRootAdmin && (
                                <button
                                  type="button"
                                  onClick={() => { setOpenDropdownId(null); setUserToRemoveRoot(u); }}
                                  style={{
                                    width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                    textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#DC2626",
                                    borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                    transition: "background-color 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                  <UserX size={14} />
                                  <span>Remove Root Admin</span>
                                </button>
                              )}

                              {/* Delete User (Destructive Action) */}
                              {canDelete && (
                                <>
                                  {(isRootAdmin && !isTargetRoot) && (
                                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "4px 0" }} />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => { setOpenDropdownId(null); setUserToDelete(u); }}
                                    style={{
                                      width: "100%", padding: "8px 12px", border: "none", backgroundColor: "transparent",
                                      textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#EF4444",
                                      borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                      transition: "background-color 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete User</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#CBD5E1", fontStyle: "italic" }}>No actions</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
          setFeedbackMessage(`User account for ${newUser.name} created successfully.`);
          setTimeout(() => setFeedbackMessage(""), 3500);
        }}
      />

      {/* Promote User Confirmation Modal (Client -> Admin) */}
      {userToPromote && (
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
          onClick={() => !isPromoting && setUserToPromote(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Make User Admin?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to make <strong style={{ color: "#0F172A" }}>{userToPromote.name}</strong> an administrator? They will receive admin-level access to User Management and enabled features.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setUserToPromote(null)}
                disabled={isPromoting}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isPromoting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPromoteUser}
                disabled={isPromoting}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  backgroundColor: "#059669",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isPromoting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(5, 150, 105, 0.2)",
                }}
              >
                {isPromoting ? "Promoting..." : "Make Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote User Confirmation Modal (Admin -> Client) */}
      {userToDemote && (
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
          onClick={() => !isDemoting && setUserToDemote(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserX size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Remove Administrator?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to remove administrator access from <strong style={{ color: "#0F172A" }}>{userToDemote.name}</strong>?
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setUserToDemote(null)}
                disabled={isDemoting}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isDemoting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDemoteUser}
                disabled={isDemoting}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isDemoting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                }}
              >
                {isDemoting ? "Removing..." : "Remove Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Root Admin Confirmation Modal */}
      {userToMakeRoot && (
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
          onClick={() => !isMakingRoot && setUserToMakeRoot(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  color: "#7C3AED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Crown size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Make Root Administrator?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              This user will receive full administrative privileges. Are you sure you want to make <strong style={{ color: "#0F172A" }}>{userToMakeRoot.name}</strong> a Root Administrator?
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setUserToMakeRoot(null)}
                disabled={isMakingRoot}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isMakingRoot ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMakeRootUser}
                disabled={isMakingRoot}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  backgroundColor: "#7C3AED",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isMakingRoot ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(124, 58, 237, 0.2)",
                }}
              >
                {isMakingRoot ? "Granting..." : "Make Root Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Root Admin Confirmation Modal */}
      {userToRemoveRoot && (
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
          onClick={() => !isRemovingRoot && setUserToRemoveRoot(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserX size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Remove Root Administrator?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to remove Root Administrator status from <strong style={{ color: "#0F172A" }}>{userToRemoveRoot.name}</strong>? They will remain a regular Administrator.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setUserToRemoveRoot(null)}
                disabled={isRemovingRoot}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isRemovingRoot ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveRootUser}
                disabled={isRemovingRoot}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isRemovingRoot ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                }}
              >
                {isRemovingRoot ? "Removing..." : "Remove Root Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
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
          onClick={() => !isDeleting && setUserToDelete(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF2F2",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                Delete User?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
