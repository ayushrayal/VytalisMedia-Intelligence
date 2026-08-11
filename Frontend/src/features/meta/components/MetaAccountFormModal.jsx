import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import Input from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";

/**
 * MetaAccountFormModal component for adding or editing a Meta Ad Account.
 */
export const MetaAccountFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
  error = null,
}) => {
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [localError, setLocalError] = useState("");

  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAccountName(initialData.accountName || "");
        setAccountId(initialData.accountId || "");
      } else {
        setAccountName("");
        setAccountId("");
      }
      setLocalError("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = accountName.trim();
    const cleanId = accountId.trim();

    if (!cleanName || !cleanId) {
      setLocalError("Both Account Name and Meta Ad Account ID are required.");
      return;
    }

    setLocalError("");
    onSubmit({ accountName: cleanName, accountId: cleanId });
  };

  const displayError = localError || error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Meta Account" : "Add Meta Ad Account"}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {displayError && (
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
            {displayError}
          </div>
        )}

        <Input
          label="Account Name"
          placeholder="e.g. Vytalis Main Ads"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          required
        />

        <div>
          <Input
            label="Meta Ad Account ID"
            placeholder="e.g. 1010101010101010"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)", marginTop: "4px" }}>
            Enter the Meta Ad Account ID connected to your advertising account.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? "Save Changes" : "Add Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MetaAccountFormModal;
