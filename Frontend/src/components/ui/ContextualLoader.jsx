import React from "react";
import LoadingProgress, { usePageLoading } from "./LoadingProgress.jsx";

export { usePageLoading };

/**
 * ContextualLoader Wrapper Component.
 * Delegates directly to LoadingProgress, accepting isLoading and section props.
 */
export const ContextualLoader = ({
  isLoading = true,
  onComplete,
  label,
  section,
  page,
  minHeight = "auto",
}) => {
  return (
    <LoadingProgress
      isLoading={isLoading}
      onComplete={onComplete}
      label={label}
      section={section}
      page={page}
      minHeight={minHeight}
    />
  );
};

export default ContextualLoader;
