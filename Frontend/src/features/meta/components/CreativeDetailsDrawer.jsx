import React, { useState, useEffect, useRef } from "react";
import StatusBadge from "./StatusBadge.jsx";
import CreativeTabs from "./CreativeTabs.jsx";
import PerformanceSection from "./PerformanceSection.jsx";
import VideoPerformanceSection from "./VideoPerformanceSection.jsx";
import CreativePreviewSection from "./CreativePreviewSection.jsx";
import CampaignAdSetSection from "./CampaignAdSetSection.jsx";
import CreativeLinksSection from "./CreativeLinksSection.jsx";
import { X } from "lucide-react";

/**
 * CreativeDetailsDrawer Component.
 * Tabbed right-side drawer interface:
 * HEADER (sticky) -> HORIZONTAL TABS (sticky) -> ACTIVE TAB CONTENT (scrollable)
 */
export const CreativeDetailsDrawer = ({ creative, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("performance");
  const contentRef = useRef(null);

  // Reset tab to "performance" and scroll content to top whenever a new creative opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("performance");
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [creative, isOpen]);

  // Scroll to top when active tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Keyboard listener & Body scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !creative) return null;

  const rawStatus =
    creative.effective_status || creative.ad_status || creative.status || "ACTIVE";

  const hasLinks = Boolean(
    creative.facebook_permalink_url || creative.instagram_permalink_url
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Creative Details"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.35)",
          backdropFilter: "blur(3px)",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Drawer Shell */}
      <aside
        style={{
          position: "relative",
          zIndex: 1001,
          width: "100%",
          maxWidth: "600px",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid var(--color-border, #E5E7EB)",
          boxShadow: "var(--shadow-dropdown, 0 10px 15px -3px rgba(15, 23, 42, 0.08))",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px 0 0 16px",
          overflow: "hidden",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* STICKY HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border, #E5E7EB)",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {creative.ad_name || creative.creative_name || "Creative Details"}
              </h3>
              <StatusBadge status={rawStatus} />
            </div>

            {creative.campaign && (
              <div style={{ fontSize: "0.825rem", color: "var(--color-text-secondary, #64748B)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>Campaign:</strong> {creative.campaign}
              </div>
            )}

            {creative.date && (
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", marginTop: "2px" }}>
                Date: {creative.date}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--color-border, #E5E7EB)",
              backgroundColor: "#FFFFFF",
              color: "var(--color-text-secondary, #64748B)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-surface-subtle, #F1F5F9)";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.color = "var(--color-text-secondary, #64748B)";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STICKY TAB NAVIGATION BAR */}
        <CreativeTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasLinks={hasLinks}
        />

        {/* SCROLLABLE CONTENT AREA (Only renders selected tab) */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activeTab === "performance" && (
            <PerformanceSection creative={creative} />
          )}

          {activeTab === "video" && (
            <VideoPerformanceSection creative={creative} />
          )}

          {activeTab === "creative" && (
            <CreativePreviewSection creative={creative} />
          )}

          {activeTab === "campaign" && (
            <CampaignAdSetSection creative={creative} />
          )}

          {activeTab === "links" && hasLinks && (
            <CreativeLinksSection creative={creative} />
          )}
        </div>
      </aside>
    </div>
  );
};

export default CreativeDetailsDrawer;
