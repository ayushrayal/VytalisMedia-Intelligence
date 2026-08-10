import React from "react";
import Button from "../../../components/ui/Button.jsx";

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
        borderRadius: "var(--radius-card, 16px)",
        border: isActive
          ? "2px solid var(--color-primary, #0A84FF)"
          : "1px solid var(--color-border, #E8EAED)",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: isActive
          ? "0 4px 12px rgba(10, 132, 255, 0.08)"
          : "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        position: "relative",
        transition: "all 0.15s ease",
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary-light, #EAF3FF)",
              color: "var(--color-primary-hover, #0060DF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              flexShrink: 0,
            }}
          >
            📱
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
              {account.accountName}
            </h4>
            <div style={{ fontSize: "0.825rem", color: "var(--color-text-secondary, #64748B)", marginTop: "2px" }}>
              Account ID: <code style={{ color: "#0A84FF", fontWeight: "600" }}>{account.accountId}</code>
            </div>
          </div>
        </div>

        {/* Active / Connected Status Pill */}
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            padding: "4px 10px",
            borderRadius: "999px",
            backgroundColor: isActive ? "#DCFCE7" : "var(--color-surface, #F7F9FC)",
            color: isActive ? "#16A34A" : "var(--color-text-secondary, #64748B)",
            border: isActive ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid #E8EAED",
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
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "12px", borderTop: "1px solid var(--color-border, #E8EAED)", flexWrap: "wrap" }}>
        {isActive ? (
          <Button variant="primary" disabled style={{ opacity: 0.9, height: "36px", padding: "0 14px", fontSize: "0.825rem" }}>
            ✓ Active Account
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => onSetActive(account.accountId)}
            isLoading={isSwitching}
            style={{ height: "36px", padding: "0 14px", fontSize: "0.825rem" }}
          >
            Set Active
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => onEdit(account)}
          style={{ height: "36px", padding: "0 14px", fontSize: "0.825rem" }}
        >
          Edit
        </Button>

        <Button
          variant="danger"
          onClick={() => onDelete(account)}
          style={{ height: "36px", padding: "0 14px", fontSize: "0.825rem", marginLeft: "auto" }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default MetaAccountCard;
