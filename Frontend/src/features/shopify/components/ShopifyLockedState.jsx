import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShoppingBag } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";

/**
 * Reusable Locked State Component displayed on Shopify Analytics pages when ZERO stores are connected.
 */
export const ShopifyLockedState = ({
  title = "Shopify Analytics Locked",
  description = "Connect a Shopify store to start viewing your store analytics.",
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px dashed #CBD5E1",
        padding: "56px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        maxWidth: "520px",
        margin: "40px auto",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "rgba(10, 132, 255, 0.08)",
          color: "#0A84FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Lock size={26} strokeWidth={2} />
      </div>

      <div>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "700", color: "#0F172A" }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B", maxWidth: "380px", lineHeight: "1.5" }}>
          {description}
        </p>
      </div>

      <Button
        onClick={() => navigate("/integrations/shopify")}
        style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}
      >
        <ShoppingBag size={16} />
        Connect Shopify Store
      </Button>
    </div>
  );
};

export default ShopifyLockedState;
