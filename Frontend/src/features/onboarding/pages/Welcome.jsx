import React, { useState } from "react";
import { addMetaAccount } from "../../meta/services/meta.api.js";
import AppLogo from "../../../components/shared/AppLogo.jsx";
import Input from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import { getErrorMessage } from "../../../utils/error.js";

export const Welcome = ({ onOnboarded }) => {
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId.trim() || !accountName.trim()) {
      setError("Please fill in both Meta Account ID and Account Display Name.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await addMetaAccount({
        accountId: accountId.trim(),
        accountName: accountName.trim(),
      });

      if (onOnboarded) {
        onOnboarded();
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
        minHeight: "100vh",
        backgroundColor: "var(--color-background, #FFFFFF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface, #F7F9FC)",
          border: "1px solid var(--color-border, #E8EAED)",
          borderRadius: "var(--radius-card, 16px)",
          padding: "40px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <AppLogo size="lg" />
          <h2 style={{ margin: "20px 0 8px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.5rem", fontWeight: "700" }}>
            Connect Your Meta Account
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-secondary, #64748B)", fontSize: "0.9rem" }}>
            Welcome to Vytalis Intelligence! Add your first Meta Ad Account to unlock analytics.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--color-error-light, rgba(229, 72, 77, 0.10))",
              border: "1px solid rgba(229, 72, 77, 0.20)",
              borderRadius: "var(--radius-input, 10px)",
              color: "var(--color-error, #E5484D)",
              fontSize: "0.875rem",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Input
            label="Meta Account Display Name"
            placeholder="e.g. Vytalis Main Ad Account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
          <Input
            label="Meta Account ID"
            placeholder="e.g. 359804707990884"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
          <Button type="submit" isLoading={loading} style={{ marginTop: "8px" }}>
            Connect & Continue →
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Welcome;
