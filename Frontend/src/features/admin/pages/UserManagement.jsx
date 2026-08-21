import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import UserPermissionsModal from "../components/UserPermissionsModal.jsx";
import AddMemberModal from "../components/AddMemberModal.jsx";
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
  UserCheck,
  UserX,
  MoreVertical,
  Sliders,
  Building,
  UserPlus,
  Check,
  XCircle,
} from "lucide-react";

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

export const UserManagement = ({ currentUser }) => {
  const outletContext = useOutletContext() || {};
  const effectiveUser = currentUser || outletContext.user || null;
  const isRootAdmin = Boolean(effectiveUser?.role === "root_admin" || effectiveUser?.isRootAdmin === true);

  // Tab State: "admins" | "clients" | "members"
  const [activeTab, setActiveTab] = useState(effectiveUser?.role === "client" ? "members" : "clients");

  // Summary counts state
  const [userCounts, setUserCounts] = useState({ admins: 0, clients: 0, members: 0 });

  // Data lists & Pagination State
  const [admins, setAdmins] = useState([]);
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Modals state
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick New Admin Form State
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch summary counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await http.get("/admin/users/counts");
      if (res.data?.counts) {
        setUserCounts(res.data.counts);
      }
    } catch (e) {
      // Non-fatal fallback
    }
  }, []);

  // Fetch active tab paginated data
  const fetchTabData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 25 };
      if (debouncedSearch) params.search = debouncedSearch;

      const endpoint = `/admin/users/${activeTab}`;
      const res = await http.get(endpoint, { params });

      const data = res.data || {};
      if (activeTab === "admins" && data.admins) {
        setAdmins(data.admins);
      } else if (activeTab === "clients" && data.clients) {
        setClients(data.clients);
      } else if (activeTab === "members" && data.members) {
        setMembers(data.members);
      }

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  const refreshAll = useCallback(() => {
    fetchCounts();
    fetchTabData();
  }, [fetchCounts, fetchTabData]);

  // Handle status toggle (active / disabled)
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "disabled" ? "active" : "disabled";
    try {
      const res = await http.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      if (res.data && res.data.user) {
        setFeedbackMessage(`Account status for ${user.name} set to ${newStatus}`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        refreshAll();
      }
    } catch (err) {
      alert(`Status update failed: ${getErrorMessage(err)}`);
    }
  };

  // Handle Delete
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await http.delete(`/admin/users/${userToDelete._id}`);
      setFeedbackMessage(`User ${userToDelete.name} deleted successfully.`);
      setTimeout(() => setFeedbackMessage(""), 3500);
      setUserToDelete(null);
      refreshAll();
    } catch (err) {
      alert(`Delete failed: ${getErrorMessage(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Create Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword) return;
    try {
      setCreatingAdmin(true);
      const res = await http.post("/admin/admins", {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });
      if (res.data && res.data.admin) {
        setFeedbackMessage(`Admin ${adminName} created successfully.`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        setAdminName("");
        setAdminEmail("");
        setAdminPassword("");
        setIsAddAdminModalOpen(false);
        refreshAll();
      }
    } catch (err) {
      alert(`Failed to create Admin: ${getErrorMessage(err)}`);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const getActiveList = () => {
    if (activeTab === "admins") return admins;
    if (activeTab === "clients") return clients;
    return members;
  };


  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", paddingBottom: "48px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
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
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0F2742", letterSpacing: "-0.5px", margin: 0 }}>
              {effectiveUser?.role === "client" ? "Team Management" : "User & Permissions Management"}
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#60758F" }}>
            {effectiveUser?.role === "client"
              ? "Manage the members of your organization."
              : "Admin-controlled hierarchical user roles, member quotas, and granular feature access control."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {activeTab === "clients" && (
            <button
              type="button"
              onClick={() => setIsAddClientModalOpen(true)}
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
              }}
            >
              <Plus size={16} />
              <span>Add Client</span>
            </button>
          )}

          {activeTab === "members" && (
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(true)}
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
              }}
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
          )}

          {activeTab === "admins" && isRootAdmin && (
            <button
              type="button"
              onClick={() => setIsAddAdminModalOpen(true)}
              style={{
                height: "38px",
                padding: "0 18px",
                borderRadius: "8px",
                backgroundColor: "#7C3AED",
                border: "none",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(124, 58, 237, 0.2)",
              }}
            >
              <Shield size={16} />
              <span>Create Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            style={{
              height: "38px",
              padding: "0 14px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              fontSize: "13px",
              fontWeight: "600",
              cursor: loading ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
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

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #E2E8F0",
          marginBottom: "20px",
          gap: "8px",
        }}
      >
        {(isRootAdmin || effectiveUser?.role === "admin") && (
          <button
            type="button"
            onClick={() => { setActiveTab("clients"); setPage(1); }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === "clients" ? "3px solid #0A84FF" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "clients" ? "#0A84FF" : "#64748B",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
            }}
          >
            <Building size={16} />
            <span>Clients & Organizations ({userCounts.clients || clients.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => { setActiveTab("members"); setPage(1); }}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "members" ? "3px solid #0A84FF" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "members" ? "#0A84FF" : "#64748B",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-2px",
          }}
        >
          <Users size={16} />
          <span>Team Members ({userCounts.members || members.length})</span>
        </button>

        {isRootAdmin && (
          <button
            type="button"
            onClick={() => { setActiveTab("admins"); setPage(1); }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === "admins" ? "3px solid #7C3AED" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "admins" ? "#7C3AED" : "#64748B",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
            }}
          >
            <Shield size={16} />
            <span>Admins & Founders ({userCounts.admins || admins.length})</span>
          </button>
        )}
      </div>

      {/* Toolbar (Search) */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
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
            }}
          />
        </div>
      </div>

      {/* Table Content */}
      {isDisplayLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <ContextualLoader isLoading={loading} onComplete={handleComplete} section="user-management" minHeight="auto" />
          <Skeleton height="60px" />
          <Skeleton height="60px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refreshAll} />

      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(15, 23, 42, 0.03)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 20px" }}>User / Name</th>
                <th style={{ padding: "14px 16px" }}>Role & Status</th>
                {activeTab === "clients" && <th style={{ padding: "14px 16px" }}>Active Member Quota</th>}
                {activeTab === "members" && <th style={{ padding: "14px 16px" }}>Organization</th>}
                <th style={{ padding: "14px 16px" }}>Last Active</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {activeTab === "clients" &&
                clients.map((client) => {
                  const isFull = client.activeMembersCount >= (client.memberLimit || 5);
                  const isSelf = client._id === effectiveUser?._id;

                  return (
                    <tr key={client._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#0F2742" }}>{client.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{client.email}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ padding: "3px 8px", backgroundColor: "#F1F5F9", color: "#475569", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                            Client
                          </span>
                          <span style={{ padding: "3px 8px", backgroundColor: client.status === "disabled" ? "#FEF2F2" : "#ECFDF5", color: client.status === "disabled" ? "#EF4444" : "#10B981", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                            {client.status === "disabled" ? "Disabled" : "Active"}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            backgroundColor: isFull ? "rgba(239, 68, 68, 0.1)" : "rgba(10, 132, 255, 0.1)",
                            color: isFull ? "#DC2626" : "#0A84FF",
                            fontSize: "12px",
                            fontWeight: "700",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          Members: {client.activeMembersCount || 0} / {client.memberLimit || 5} {isFull ? "(Limit Reached)" : ""}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748B" }}>{formatLastActive(client.lastActiveAt)}</td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setPermissionTargetUser(client)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(10, 132, 255, 0.1)",
                              color: "#0A84FF",
                              border: "none",
                              fontWeight: "600",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Sliders size={13} /> Permissions
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(client)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: client.status === "disabled" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                color: client.status === "disabled" ? "#059669" : "#D97706",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              {client.status === "disabled" ? "Enable" : "Disable"}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(client)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#DC2626",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {activeTab === "members" &&
                members.map((member) => {
                  const isSelf = member._id === effectiveUser?._id;
                  const orgName = member.organizationId?.name || "Unassigned Org";

                  return (
                    <tr key={member._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#0F2742" }}>{member.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{member.email}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ padding: "3px 8px", backgroundColor: "#F1F5F9", color: "#475569", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                            Member
                          </span>
                          <span style={{ padding: "3px 8px", backgroundColor: member.status === "disabled" ? "#FEF2F2" : "#ECFDF5", color: member.status === "disabled" ? "#EF4444" : "#10B981", fontSize: "11px", fontWeight: "700", borderRadius: "6px" }}>
                            {member.status === "disabled" ? "Disabled" : "Active"}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#0F2742", fontWeight: "600" }}>{orgName}</td>

                      <td style={{ padding: "14px 16px", color: "#64748B" }}>{formatLastActive(member.lastActiveAt)}</td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setPermissionTargetUser(member)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(10, 132, 255, 0.1)",
                              color: "#0A84FF",
                              border: "none",
                              fontWeight: "600",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Sliders size={13} /> Permissions
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: member.status === "disabled" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                color: member.status === "disabled" ? "#059669" : "#D97706",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              {member.status === "disabled" ? "Enable" : "Disable"}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(member)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#DC2626",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {activeTab === "admins" &&
                admins.map((admin) => {
                  const isRoot = admin.role === "root_admin" || admin.isRootAdmin;
                  const isSelf = admin._id === effectiveUser?._id;

                  return (
                    <tr key={admin._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#0F2742" }}>{admin.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{admin.email}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            backgroundColor: isRoot ? "rgba(124, 58, 237, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            color: isRoot ? "#7C3AED" : "#059669",
                            fontSize: "11px",
                            fontWeight: "700",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isRoot ? <Crown size={12} /> : <Shield size={12} />}
                          {isRoot ? "Root Admin" : "Admin"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748B" }}>{formatLastActive(admin.lastActiveAt)}</td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setPermissionTargetUser(admin)}
                            disabled={isRoot}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: isRoot ? "#F1F5F9" : "rgba(10, 132, 255, 0.1)",
                              color: isRoot ? "#94A3B8" : "#0A84FF",
                              border: "none",
                              fontWeight: "600",
                              fontSize: "12px",
                              cursor: isRoot ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Sliders size={13} /> Permissions
                          </button>

                          {isRootAdmin && !isRoot && !isSelf && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(admin)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#DC2626",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Pagination Controls Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              backgroundColor: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              fontSize: "13px",
              color: "#64748B",
            }}
          >
            <div>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> ({pagination.total || 0} total records)
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={!pagination.hasPrevPage || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: pagination.hasPrevPage ? "#FFFFFF" : "#F1F5F9",
                  color: pagination.hasPrevPage ? "#0F172A" : "#94A3B8",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: pagination.hasPrevPage ? "pointer" : "not-allowed",
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: pagination.hasNextPage ? "#FFFFFF" : "#F1F5F9",
                  color: pagination.hasNextPage ? "#0F172A" : "#94A3B8",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: pagination.hasNextPage ? "pointer" : "not-allowed",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Add Client Modal */}
      <AddUserModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onUserCreated={() => refreshAll()}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        clients={effectiveUser?.role === "client" ? [effectiveUser] : clients}
        onMemberCreated={() => refreshAll()}
      />

      {/* User Permission Matrix Modal */}
      <UserPermissionsModal
        isOpen={Boolean(permissionTargetUser)}
        onClose={() => setPermissionTargetUser(null)}
        targetUser={permissionTargetUser}
        currentUser={effectiveUser}
        onPermissionsUpdated={() => refreshAll()}
      />

      {/* Create Admin Modal (Root Admin Only) */}
      {isAddAdminModalOpen && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
          }}
          onClick={() => setIsAddAdminModalOpen(false)}
        >
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "700", color: "#0F2742" }}>Create Administrator Account</h3>
            <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input type="text" placeholder="Full Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required style={{ height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CBD5E1" }} />
              <input type="email" placeholder="Email Address" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={{ height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CBD5E1" }} />
              <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required style={{ height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CBD5E1" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setIsAddAdminModalOpen(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF" }}>Cancel</button>
                <button type="submit" disabled={creatingAdmin} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#7C3AED", color: "#FFFFFF", fontWeight: "600" }}>
                  {creatingAdmin ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0F2742" }}>Delete User Account?</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13.5px", color: "#64748B" }}>
              Are you sure you want to permanently delete <strong>{userToDelete.name}</strong> ({userToDelete.email})? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setUserToDelete(null)} disabled={isDeleting} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF" }}>Cancel</button>
              <button type="button" onClick={confirmDeleteUser} disabled={isDeleting} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#EF4444", color: "#FFFFFF", fontWeight: "600" }}>
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
