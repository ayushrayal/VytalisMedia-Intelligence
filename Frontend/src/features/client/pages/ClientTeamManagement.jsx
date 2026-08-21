import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, Navigate } from "react-router-dom";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import UserPermissionsModal from "../../admin/components/UserPermissionsModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import {
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  Trash2,
  Sliders,
  UserPlus,
  AlertCircle,
  X,
} from "lucide-react";

export const ClientTeamManagement = ({ currentUser }) => {
  const outletContext = useOutletContext() || {};
  const effectiveUser = currentUser || outletContext.user || null;

  // Strict Client Role Enforcement: Only Client allowed!
  if (effectiveUser?.role !== "client") {
    if (effectiveUser?.role === "root_admin" || effectiveUser?.role === "admin" || effectiveUser?.isRootAdmin) {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/overview" replace />;
  }

  const [members, setMembers] = useState([]);
  const [quota, setQuota] = useState({ activeMembersCount: 0, memberLimit: 5 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Member Form State
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [creatingMember, setCreatingMember] = useState(false);
  const [modalError, setModalError] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Client Team Members & Quota
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 25 };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await http.get("/client/team", { params });

      const data = res.data || {};
      if (data.members) setMembers(data.members);
      if (data.pagination) setPagination(data.pagination);
      if (data.quota) setQuota(data.quota);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Handle Member Creation (Role is fixed to "member" server-side & client-side)
  const handleCreateMemberSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!memberName.trim() || !memberEmail.trim() || !memberPassword) {
      setModalError("All fields are required.");
      return;
    }

    if (quota.activeMembersCount >= quota.memberLimit) {
      setModalError(`Maximum limit of ${quota.memberLimit} active members reached.`);
      return;
    }

    try {
      setCreatingMember(true);
      const res = await http.post("/client/team", {
        name: memberName.trim(),
        email: memberEmail.trim(),
        password: memberPassword,
      });

      if (res.data && res.data.member) {
        setFeedbackMessage(`Team Member ${memberName} created successfully.`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        setMemberName("");
        setMemberEmail("");
        setMemberPassword("");
        setIsAddMemberModalOpen(false);
        fetchTeamData();
      }
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setCreatingMember(false);
    }
  };

  // Handle status toggle (active / disabled)
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "disabled" ? "active" : "disabled";
    try {
      const res = await http.patch(`/client/team/${user._id}/status`, { status: newStatus });
      if (res.data && res.data.user) {
        setFeedbackMessage(`Account status for ${user.name} set to ${newStatus}`);
        setTimeout(() => setFeedbackMessage(""), 3500);
        fetchTeamData();
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
      await http.delete(`/client/team/${userToDelete._id}`);
      setFeedbackMessage(`Team Member ${userToDelete.name} deleted successfully.`);
      setTimeout(() => setFeedbackMessage(""), 3500);
      setUserToDelete(null);
      fetchTeamData();
    } catch (err) {
      alert(`Delete failed: ${getErrorMessage(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatLastActive = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isQuotaFull = quota.activeMembersCount >= quota.memberLimit;

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", paddingBottom: "48px" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0F2742", margin: 0 }}>Team Management</h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0 0" }}>
            Manage the members of your organization.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Quota Pill */}
          <span
            style={{
              padding: "6px 14px",
              backgroundColor: isQuotaFull ? "rgba(239, 68, 68, 0.1)" : "rgba(10, 132, 255, 0.1)",
              color: isQuotaFull ? "#DC2626" : "#0A84FF",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Members: {quota.activeMembersCount || 0} / {quota.memberLimit || 5} {isQuotaFull ? "(Limit Reached)" : ""}
          </span>

          <button
            type="button"
            onClick={() => { setModalError(""); setIsAddMemberModalOpen(true); }}
            disabled={isQuotaFull}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "10px",
              backgroundColor: isQuotaFull ? "#CBD5E1" : "#0A84FF",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: "700",
              border: "none",
              cursor: isQuotaFull ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>

          <button
            type="button"
            onClick={fetchTeamData}
            disabled={loading}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "10px",
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

      {/* Toolbar (Search) */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
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
        <ErrorState message={error} onRetry={fetchTeamData} />
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
                <th style={{ padding: "14px 20px" }}>Member / Name</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Last Active</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                    No team members found. Click <strong>+ Add Member</strong> to add a member.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#0F2742" }}>{member.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>{member.email}</div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          backgroundColor: member.status === "disabled" ? "#FEF2F2" : "#ECFDF5",
                          color: member.status === "disabled" ? "#EF4444" : "#10B981",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                        }}
                      >
                        {member.status === "disabled" ? "Disabled" : "Active"}
                      </span>
                    </td>

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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justify: "space-between",
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

      {/* Add Member Modal (Role Fixed to Member) */}
      {isAddMemberModalOpen && (
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
          onClick={() => !creatingMember && setIsAddMemberModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F2742" }}>Add Team Member</h3>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                style={{ border: "none", backgroundColor: "transparent", color: "#64748B", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} /> {modalError}
              </div>
            )}

            <form onSubmit={handleCreateMemberSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input label="Member Full Name" placeholder="Jane Doe" value={memberName} onChange={(e) => setMemberName(e.target.value)} required disabled={creatingMember} />
              <Input label="Email Address" type="email" placeholder="member@company.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required disabled={creatingMember} />
              <Input label="Password" type="password" placeholder="At least 6 characters" value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} required disabled={creatingMember} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  disabled={creatingMember}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", color: "#475569", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={creatingMember} disabled={creatingMember}>
                  Create Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Permission Matrix Modal (Calls Dedicated Client Team API) */}
      <UserPermissionsModal
        isOpen={Boolean(permissionTargetUser)}
        onClose={() => setPermissionTargetUser(null)}
        targetUser={permissionTargetUser}
        currentUser={effectiveUser}
        customEndpoint={permissionTargetUser ? `/client/team/${permissionTargetUser._id}/permissions` : null}
        onPermissionsUpdated={() => fetchTeamData()}
      />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0F2742" }}>Delete Team Member?</h3>
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

export default ClientTeamManagement;
