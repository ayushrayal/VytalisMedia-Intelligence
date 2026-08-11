import React, { useRef } from "react";
import { LogOut, X } from "lucide-react";
import Modal from "../ui/Modal.jsx";

/**
 * Premium Logout Confirmation Modal for Vytalis Intelligence.
 * Minimal, compact, clear, Linear/Stripe-style confirmation dialog.
 */
export const LogoutConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false,
  triggerRef,
}) => {
  const cancelButtonRef = useRef(null);

  const handleConfirmClick = (e) => {
    e.preventDefault();
    if (isLoggingOut) return;
    onConfirm();
  };

  const headerLayout = (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#DC2626",
          flexShrink: 0,
        }}
      >
        <LogOut size={18} strokeWidth={2.2} />
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={isLoggingOut}
        aria-label="Close dialog"
        style={{
          background: "none",
          border: "none",
          color: "#94A3B8",
          cursor: isLoggingOut ? "not-allowed" : "pointer",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="420px"
      width="100%"
      borderRadius="12px"
      border="1px solid #E5E7EB"
      padding="24px"
      backdropColor="rgba(15, 23, 42, 0.35)"
      backdropFilter="blur(4px)"
      boxShadow="0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)"
      headerContent={headerLayout}
      ariaLabelledBy="logout-modal-title"
      ariaDescribedBy="logout-modal-description"
      triggerRef={triggerRef}
      initialFocusRef={cancelButtonRef}
    >
      <div>
        <h3
          id="logout-modal-title"
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#0F172A",
            lineHeight: 1.3,
          }}
        >
          Log out of Vytalis?
        </h3>
        <p
          id="logout-modal-description"
          style={{
            margin: "6px 0 0 0",
            fontSize: "14px",
            color: "#64748B",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to log out of your account?
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#0F172A",
              border: "1px solid #E5E7EB",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              outline: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoggingOut}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "8px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              opacity: isLoggingOut ? 0.7 : 1,
              outline: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) e.currentTarget.style.backgroundColor = "#B91C1C";
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) e.currentTarget.style.backgroundColor = "#DC2626";
            }}
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutConfirmationModal;
