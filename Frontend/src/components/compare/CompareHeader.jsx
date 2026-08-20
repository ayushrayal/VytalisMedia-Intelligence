import React from "react";
import PageHeader from "../shared/PageHeader.jsx";

/**
 * CompareHeader SaaS Page Header Component.
 */
export const CompareHeader = ({ title = "Compare Performance", subtitle = "Compare two periods to understand what changed." }) => {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
    />
  );
};

export default CompareHeader;
