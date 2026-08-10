import React from "react";
import Button from "../../../components/ui/Button.jsx";
import { Link2, Check, Edit2, Trash2 } from "lucide-react";

/**
 * MetaAccountCard Component.
 * Visual representation of a connected Meta Ad Account with active indicator and management controls.
 */
export const MetaAccountCard = ({
  account,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
  isSwitching,
}) => {
  const formattedDate = account.connectedAt
    ? new Date(account.connectedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-card, 12px)",
        border: isActive
          ? "2px solid #0A84FF"
          : "1px solid var(--color-border, #E5E7EB)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: isActive
          ? "0 4px 12px rgba(10, 132, 255, 0.08)"
          : "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        position: "relative",
        transition: "all 0.15s ease",
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary-light, rgba(10, 132, 255, 0.08))",
              color: "#0A84FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Link2 size={20} strokeWidth={2} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)" }}>
              {account.accountName}
            </h4>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", marginTop: "2px" }}>
              Account ID: <code style={{ color: "#0A84FF", fontWeight: "600" }}>{account.accountId}</code>
            </div>
          </div>
        </div>

        {/* Active / Connected Status Pill */}
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            padding: "3px 9px",
            borderRadius: "999px",
            backgroundColor: isActive ? "rgba(22, 163, 74, 0.08)" : "var(--color-surface-subtle, #F1F5F9)",
            color: isActive ? "#16A34A" : "var(--color-text-secondary, #64748B)",
            border: isActive ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid #E5E7EB",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isActive ? "#16A34A" : "#94A3B8" }} />
          {isActive ? "Active" : "Connected"}
        </span>
      </div>

      {/* Date Footer */}
      {formattedDate && (
        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)" }}>
          Connected on {formattedDate}
        </div>
      )}

      {/* Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "12px", borderTop: "1px solid var(--color-border, #E5E7EB)", flexWrap: "wrap" }}>
        {isActive ? (
          <Button variant="primary" disabled style={{ opacity: 0.9, height: "34px", padding: "0 12px", fontSize: "0.8rem", gap: "4px" }}>
            <Check size={14} /> Active
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => onSetActive(account.accountId)}
            isLoading={isSwitching}
            style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem" }}
          >
            Set Active
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => onEdit(account)}
          style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem", gap: "4px" }}
        >
          <Edit2 size={13} /> Edit
        </Button>

        <Button
          variant="danger"
          onClick={() => onDelete(account)}
          style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem", marginLeft: "auto", gap: "4px" }}
        >
          <Trash2 size={13} /> Delete
        </Button>
      </div>
    </div>
  );
};

export default MetaAccountCard;
