import React from "react";

export const CreativeLinksSection = ({ creative }) => {
  const fbUrl = creative.facebook_permalink_url;
  const igUrl = creative.instagram_permalink_url;

  if (!fbUrl && !igUrl) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        External Links
      </h4>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {fbUrl && (
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary-light, #EAF3FF)",
              color: "var(--color-primary-hover, #0060DF)",
              fontSize: "0.9rem",
              fontWeight: "600",
              textDecoration: "none",
              border: "1px solid rgba(10, 132, 255, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            Open on Facebook →
          </a>
        )}

        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary-light, #EAF3FF)",
              color: "var(--color-primary-hover, #0060DF)",
              fontSize: "0.9rem",
              fontWeight: "600",
              textDecoration: "none",
              border: "1px solid rgba(10, 132, 255, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            Open on Instagram →
          </a>
        )}
      </div>
    </div>
  );
};

export default CreativeLinksSection;
