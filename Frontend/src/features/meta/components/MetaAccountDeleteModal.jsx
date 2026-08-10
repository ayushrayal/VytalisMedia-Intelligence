import React from "react";
import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";

/**
 * MetaAccountDeleteModal component for confirming Meta Ad Account removal.
 */
export const MetaAccountDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  account = null,
  isDeleting = false,
  error = null,
}) => {
  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Meta Account?">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--color-error-light, rgba(229, 72, 77, 0.10))",
              border: "1px solid rgba(229, 72, 77, 0.25)",
              borderRadius: "var(--radius-input, 8px)",
              color: "var(--color-error, #E5484D)",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary, #475569)", lineHeight: 1.5 }}>
          Are you sure you want to remove this Meta account from Vytalis Intelligence?
        </p>

        <div
          style={{
            backgroundColor: "var(--color-surface, #F7F9FC)",
            borderRadius: "10px",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "14px 16px",
          }}
        >
          <div style={{ fontWeight: "700", color: "var(--color-text-primary, #111827)", fontSize: "0.95rem" }}>
            {account.accountName}
          </div>
          <div style={{ fontSize: "0.825rem", color: "var(--color-text-secondary, #64748B)", marginTop: "2px" }}>
            Account ID: <code style={{ color: "#0A84FF", fontWeight: "600" }}>{account.accountId}</code>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>

          <Button type="button" variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Delete Account
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MetaAccountDeleteModal;
