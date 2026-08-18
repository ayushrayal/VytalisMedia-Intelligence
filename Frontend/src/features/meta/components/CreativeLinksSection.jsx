import React from "react";

/**
 * Checks if a creative has valid external/destination links.
 */
export const hasValidCreativeLinks = (creative) => {
  if (!creative) return false;

  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const str = url.trim();
    if (str === "" || str === "null" || str === "undefined") return false;
    return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("fb://") || str.startsWith("instagram://");
  };

  return Boolean(
    isValidUrl(creative.facebook_permalink_url) ||
    isValidUrl(creative.instagram_permalink_url) ||
    isValidUrl(creative.website_url) ||
    isValidUrl(creative.link_url) ||
    isValidUrl(creative.destination_url) ||
    isValidUrl(creative.call_to_action_url) ||
    isValidUrl(creative.url)
  );
};

export const CreativeLinksSection = ({ creative }) => {
  if (!creative) return null;

  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const str = url.trim();
    if (str === "" || str === "null" || str === "undefined") return false;
    return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("fb://") || str.startsWith("instagram://");
  };

  const fbUrl = isValidUrl(creative.facebook_permalink_url) ? creative.facebook_permalink_url.trim() : null;
  const igUrl = isValidUrl(creative.instagram_permalink_url) ? creative.instagram_permalink_url.trim() : null;
  
  const rawWebUrl = creative.website_url || creative.link_url || creative.destination_url || creative.call_to_action_url || creative.url;
  const webUrl = isValidUrl(rawWebUrl) ? rawWebUrl.trim() : null;

  if (!fbUrl && !igUrl && !webUrl) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        External Links & Destination
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

        {webUrl && (
          <a
            href={webUrl}
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
            Open Destination Link →
          </a>
        )}
      </div>
    </div>
  );
};

export default CreativeLinksSection;
