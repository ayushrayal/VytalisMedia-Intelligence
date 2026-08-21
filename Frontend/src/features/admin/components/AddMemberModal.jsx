import React, { useState } from "react";
import { http } from "../../../lib/http.js";
import { getErrorMessage } from "../../../utils/error.js";
import Input from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import { UserPlus, AlertCircle, X } from "lucide-react";

export const AddMemberModal = ({ isOpen, onClose, clients = [], onMemberCreated }) => {
  const defaultClientId = clients.length === 1 ? clients[0]._id : "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (clients.length === 1 && !selectedClientId) {
      setSelectedClientId(clients[0]._id);
    }
  }, [clients, selectedClientId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const targetId = selectedClientId || (clients.length === 1 ? clients[0]._id : "");

    if (!name || !email || !password || !targetId) {
      setError("All required fields must be filled out.");
      return;
    }

    const selectedClient = clients.find((c) => c._id === targetId);
    if (selectedClient && selectedClient.activeMembersCount >= selectedClient.memberLimit) {
      setError("Maximum limit of 5 active members reached for this Client Organization.");
      return;
    }

    try {
      setLoading(true);
      const res = await http.post("/admin/members", {
        name,
        email,
        password,
        clientId: targetId,
      });

      if (res.data && res.data.member) {
        if (onMemberCreated) {
          onMemberCreated(res.data.member);
        }
        setName("");
        setEmail("");
        setPassword("");
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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
      onClick={() => !loading && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
          border: "1px solid #E2E8F0",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(10, 132, 255, 0.1)",
                color: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F2742" }}>Add Team Member</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Create a member under a Client Organization</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", backgroundColor: "transparent", color: "#64748B", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#0F2742", marginBottom: "6px" }}>
              Target Client Organization *
            </label>
            {clients.length === 1 ? (
              <div
                style={{
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {clients[0].name}
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                <option value="">-- Select Client Organization --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id} disabled={c.activeMembersCount >= c.memberLimit}>
                    {c.name} — Members: {c.activeMembersCount || 0} / {c.memberLimit || 5} {c.activeMembersCount >= c.memberLimit ? "(FULL)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input label="Member Full Name" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
          <Input label="Email Address" type="email" placeholder="member@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          <Input label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ height: "38px", padding: "0 16px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", color: "#475569", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>
            <Button type="submit" isLoading={loading} disabled={loading}>
              Create Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
