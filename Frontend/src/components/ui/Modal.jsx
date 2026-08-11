import React, { useEffect, useRef } from "react";

/**
 * Generic Modal UI Primitive.
 * Overlay: rgba(15, 23, 42, 0.35) or customizable, Modal: #FFFFFF, Radius: 12px/16px.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "500px",
  width = "90%",
  borderRadius = "var(--radius-card, 16px)",
  border = "1px solid var(--color-border, #E8EAED)",
  padding = "24px 28px",
  backdropColor = "rgba(15, 23, 42, 0.35)",
  backdropFilter = "blur(4px)",
  boxShadow = "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
  showCloseButton = true,
  ariaLabelledBy,
  ariaDescribedBy,
  triggerRef,
  initialFocusRef,
  headerContent,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration
    previousActiveElement.current = document.activeElement;

    // Move focus into the modal
    const timer = setTimeout(() => {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);

      // Restore focus to trigger or previous active element upon close
      const restoreTarget = (triggerRef && triggerRef.current) || previousActiveElement.current;
      if (restoreTarget && typeof restoreTarget.focus === "function") {
        restoreTarget.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backdropColor,
        backdropFilter: backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      className="vytalis-backdrop-animate"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className="vytalis-modal-animate"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: borderRadius,
          border: border,
          padding: padding,
          maxWidth: maxWidth,
          width: width,
          boxShadow: boxShadow,
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {headerContent ? (
          headerContent
        ) : (
          title && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <h3
                id={ariaLabelledBy}
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  color: "var(--color-text-primary, #111827)",
                  fontWeight: "700",
                }}
              >
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-muted, #94A3B8)",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    padding: "2px 6px",
                    lineHeight: 1,
                    borderRadius: "4px",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

