import React from "react";

/**
 * Tab Navigation Bar for Creative Details Drawer.
 * Horizontal scrolling on mobile without wrapping, underline active indicator.
 */
export const CreativeTabs = ({ activeTab, setActiveTab, hasLinks }) => {
  const tabs = [
    { id: "performance", label: "Performance" },
    { id: "video", label: "Video Performance" },
    { id: "creative", label: "Creative Preview" },
    { id: "campaign", label: "Campaign & Ad Set" },
  ];

  if (hasLinks) {
    tabs.push({ id: "links", label: "Links" });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        padding: "0 24px",
        borderBottom: "1px solid var(--color-border, #E8EAED)",
        backgroundColor: "#FFFFFF",
        overflowX: "auto",
        whiteSpace: "nowrap",
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--color-primary, #0A84FF)" : "2px solid transparent",
              color: isActive ? "var(--color-primary, #0A84FF)" : "var(--color-text-secondary, #64748B)",
              fontWeight: isActive ? "600" : "500",
              fontSize: "0.875rem",
              padding: "12px 0",
              cursor: "pointer",
              transition: "all 0.15s ease",
              outline: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default CreativeTabs;
