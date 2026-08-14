import React, { useState, useEffect } from "react";
import AdSetAccordion from "./AdSetAccordion.jsx";

/**
 * AdSetAccordionList Component.
 * Single-open expandable accordion list for Meta Ad Sets.
 * Appends index suffix (${baseId}-${idx}) to guarantee 100% unique string IDs per row,
 * preventing shared ID collisions when backend data items share identical adset IDs.
 * Starts with all Ad Sets collapsed (expandedAdSetId = null).
 */
export const AdSetAccordionList = ({ adSets = [], currency = "INR" }) => {
  // Single source of truth: defaults strictly to null so all Ad Sets start collapsed
  const [expandedAdSetId, setExpandedAdSetId] = useState(null);

  // Reset expansion if adSets array identity changes
  useEffect(() => {
    setExpandedAdSetId(null);
  }, [adSets]);

  const handleAdSetToggle = (id) => {
    setExpandedAdSetId((currentId) => (currentId === id ? null : id));
  };

  if (!adSets || adSets.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px dashed #E5EAF0",
          color: "#64748B",
          fontSize: "13px",
        }}
      >
        No ad sets found for this campaign.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {adSets.map((adset, idx) => {
        // Use canonical adset ID as stable unique identity
        const adSetId = String(adset.id || adset.adset_id || adset.name || adset.adset_name || idx);

        const isExpanded = expandedAdSetId !== null && expandedAdSetId === adSetId;

        return (
          <AdSetAccordion
            key={adSetId}
            adset={adset}
            isExpanded={isExpanded}
            onToggle={() => handleAdSetToggle(adSetId)}
            currency={currency}
          />
        );
      })}
    </div>
  );
};

export default AdSetAccordionList;
