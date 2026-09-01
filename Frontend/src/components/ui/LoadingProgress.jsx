import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * Contextual Section Labels Map matching exact requirements:
 * - Meta Overview: "Loading Meta Performance"
 * - Meta Campaigns: "Loading Campaigns"
 * - Meta Ad Sets: "Loading Ad Sets"
 * - Meta Creatives: "Loading Creatives"
 * - Meta Winning Creatives: "Loading Winning Creatives"
 * - Meta Poor Performers: "Loading Poor Performers"
 * - Meta Audience: "Loading Audience"
 * - Meta Places: "Loading Places"
 * - Shopify Overview: "Loading Shopify Data"
 * - Shopify Orders: "Loading Orders"
 * - Shopify Products: "Loading Products"
 * - Shopify Customers: "Loading Customers"
 */
const SECTION_LABELS = {
  "meta-overview": "Loading Meta Performance",
  "meta-campaigns": "Loading Campaigns",
  "meta-adsets": "Loading Ad Sets",
  "meta-creatives": "Loading Creatives",
  "meta-winning": "Loading Winning Creatives",
  "meta-poor-performers": "Loading Poor Performers",
  "meta-audience": "Loading Audience",
  "meta-places": "Loading Places",
  "meta-accounts": "Loading Meta Accounts",

  "shopify-overview": "Loading Shopify Data",
  "shopify-orders": "Loading Orders",
  "shopify-products": "Loading Products",
  "shopify-customers": "Loading Customers",
  "shopify-location": "Loading Locations",
  "shopify-accounts": "Loading Connected Stores",

  "business-overview": "Loading Business Overview",

  meta: "Loading Meta Performance",
  campaigns: "Loading Campaigns",
  adsets: "Loading Ad Sets",
  creatives: "Loading Creatives",
  "winning-creatives": "Loading Winning Creatives",
  "poor-performers": "Loading Poor Performers",
  audience: "Loading Audience",
  places: "Loading Places",
  locations: "Loading Locations",
  dashboard: "Loading Business Overview",
  business: "Loading Business Overview",
  overview: "Loading Performance Data",
};

/**
 * Custom hook to bridge real API loading state with smooth 100% completion animation.
 *
 * @param {boolean} isLoading - Real API loading state from page component
 * @returns {{ isDisplayLoading: boolean, handleComplete: () => void }}
 */
export const usePageLoading = (isLoading) => {
  const [displayLoading, setDisplayLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setDisplayLoading(true);
    }
  }, [isLoading]);

  const handleComplete = useCallback(() => {
    setDisplayLoading(false);
  }, []);

  return {
    isDisplayLoading: displayLoading,
    handleComplete,
  };
};

/**
 * LoadingProgress Component.
 * Refined Vytalis blue estimated progress-bar loader.
 *
 * Rules:
 * - Connected directly to the real API loading state (`isLoading`).
 * - Never reaches 100% while API is fetching (caps at 95%).
 * - Progress speed slows down as it approaches 95%.
 * - When API finishes (isLoading becomes false), animates cleanly to 100%, holds 180ms, then calls onComplete.
 * - Visual bar & percentage number stay synchronized.
 * - Page background: #F7F9FC (transparent wrapper, no white background panel).
 */
export const LoadingProgress = ({
  isLoading = true,
  onComplete,
  label,
  section,
  page,
  minHeight = "auto",
}) => {
  const resolvedLabel = label || SECTION_LABELS[section || page] || "Loading Performance Data";
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    let timerId;

    if (isLoading) {
      const startTime = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        // Map elapsed time (0 -> 15,000ms) smoothly to progress percentage (1% -> 99%)
        const calculatedProgress = Math.min(Math.floor(1 + (elapsed / 15000) * 98), 99);
        
        setProgress(calculatedProgress);

        if (elapsed < 15000) {
          timerId = setTimeout(updateProgress, 50);
        }
      };

      updateProgress();
    } else {
      // Real API request completed or failed (isLoading becomes false): animate smoothly to 100%
      const finishProgress = () => {
        setProgress((prev) => {
          if (prev < 100) {
            const step = Math.max(Math.ceil((100 - prev) / 3), 3);
            const nextVal = Math.min(prev + step, 100);
            if (nextVal < 100) {
              timerId = setTimeout(finishProgress, 18);
            } else {
              timerId = setTimeout(() => {
                if (onComplete) onComplete();
              }, 180);
            }
            return nextVal;
          }
          return 100;
        });
      };

      finishProgress();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isLoading, onComplete]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 16px 20px",
        backgroundColor: "transparent", // NO white panel container
        userSelect: "none",
        boxSizing: "border-box",
        minHeight,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Percentage Text */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "#0F2742",
            letterSpacing: "-0.2px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {progress}%
        </div>

        {/* Horizontal Track */}
        <div
          style={{
            width: "100%",
            height: "14px",
            backgroundColor: "#E8F1FB",
            borderRadius: "999px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(10, 132, 255, 0.12)",
            position: "relative",
          }}
        >
          {/* Progress Bar Fill */}
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#0A84FF", // Vytalis primary blue
              borderRadius: "999px",
              transition: "width 0.12s ease-out",
              boxShadow: "0 0 10px rgba(10, 132, 255, 0.4)",
            }}
          />
        </div>

        {/* Secondary Contextual Label */}
        {resolvedLabel && (
          <div
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "#60758F",
              letterSpacing: "-0.1px",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              marginTop: "2px",
            }}
          >
            {resolvedLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;
