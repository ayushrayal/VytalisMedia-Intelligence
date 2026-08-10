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
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "36px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <AppLogo size="lg" />
          <h2 style={{ margin: "16px 0 8px 0", color: "#f8fafc", fontSize: "1.5rem" }}>
            Connect Your Meta Account
          </h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
            Welcome to Vytalis Intelligence! Add your first Meta Ad Account to unlock analytics.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#450a0a",
              border: "1px solid #991b1b",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "0.875rem",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
