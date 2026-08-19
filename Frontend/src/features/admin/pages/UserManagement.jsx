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
 * Enables Administrators to view registered users, add new users, toggle feature access,
 * manage user roles (Root Admin only), and delete user accounts.
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToPromote, setUserToPromote] = useState(null);
  const [userToDemote, setUserToDemote] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);

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
    <div style={{ maxWidth: "1120px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
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
            Manage user access, roles, and feature visibility.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              height: "36px",
              padding: "0 16px",
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
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or Meta account..."
            style={{
              width: "100%",
              height: "38px",
              paddingLeft: "38px",
              paddingRight: "12px",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ArrowUpDown size={14} color="#64748B" />
          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>Sort by:</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            style={{
              height: "38px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              color: "#0F172A",
              outline: "none",
              cursor: "pointer",
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
          {/* Table Header */}
          <div
            style={{
              padding: "14px 24px",
              backgroundColor: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              fontSize: "12px",
              fontWeight: "700",
              color: "#64748B",
              display: "grid",
              gridTemplateColumns: "2.2fr 1.2fr 1fr 1fr 1.2fr 1.4fr",
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

                // Delete & Role permissions
                const isSelf = u._id === effectiveUser?._id;
                const canDelete = !isSelf && !isTargetRoot && (isRootAdmin || !isTargetAdmin);

                return (
                  <div
                    key={u._id}
                    style={{
                      padding: "18px 24px",
                      borderBottom: index === sortedUsers.length - 1 ? "none" : "1px solid #F1F5F9",
                      display: "grid",
                      gridTemplateColumns: "2.2fr 1.2fr 1fr 1fr 1.2fr 1.4fr",
                      gap: "12px",
                      alignItems: "center",
                      transition: "background-color 0.15s ease",
                      backgroundColor: isTargetRoot ? "rgba(10, 132, 255, 0.02)" : "#FFFFFF",
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
                          fontSize: "15px",
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
                            gap: "5px",
                            padding: "4px 10px",
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
                      ) : isTargetAdmin ? (
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "shopifyEnabled", Boolean(u.shopifyEnabled))}
                        disabled={isShopifyUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          position: "relative",
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
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
                            left: Boolean(u.shopifyEnabled) ? "22px" : "2px",
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(u, "attributionEnabled", Boolean(u.attributionEnabled))}
                        disabled={isAttributionUpdating || (isTargetRoot && !isRootAdmin)}
                        style={{
                          position: "relative",
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
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
                            left: Boolean(u.attributionEnabled) ? "22px" : "2px",
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

                    {/* Actions Column: [ Make Admin / Remove Admin ] [ Delete ] */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                      {/* Make Admin Button (Root Admin viewing Client user) */}
                      {isRootAdmin && !isTargetRoot && !isTargetAdmin && (
                        <button
                          type="button"
                          onClick={() => setUserToPromote(u)}
                          title="Promote user to Admin"
                          style={{
                            height: "30px",
                            padding: "0 10px",
                            borderRadius: "6px",
                            backgroundColor: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            color: "#059669",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <UserCheck size={13} />
                          <span>Make Admin</span>
                        </button>
                      )}

                      {/* Remove Admin Button (Root Admin viewing Regular Admin user) */}
                      {isRootAdmin && !isTargetRoot && isTargetAdmin && (
                        <button
                          type="button"
                          onClick={() => setUserToDemote(u)}
                          title="Remove administrator access"
                          style={{
                            height: "30px",
                            padding: "0 10px",
                            borderRadius: "6px",
                            backgroundColor: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <UserX size={13} />
                          <span>Remove Admin</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          title="Delete user account"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            backgroundColor: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            color: "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title={
                            isSelf
                              ? "Cannot delete your own account"
                              : isTargetRoot
                              ? "Root Administrator cannot be deleted"
                              : "Cannot delete administrators"
                          }
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            color: "#CBD5E1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "not-allowed",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Promote User Confirmation Modal */}
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
                  backgroundColor: "rgba(10, 132, 255, 0.1)",
                  color: "#0A84FF",
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
                  backgroundColor: "#0A84FF",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isPromoting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(10, 132, 255, 0.2)",
                }}
              >
                {isPromoting ? "Promoting..." : "Make Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote User Confirmation Modal */}
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
                Remove Admin Access?
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
                Delete User Account?
              </h3>
            </div>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete account for{" "}
              <strong style={{ color: "#0F172A" }}>{userToDelete.name}</strong> ({userToDelete.email})?
              This action cannot be undone and will permanently revoke access.
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
