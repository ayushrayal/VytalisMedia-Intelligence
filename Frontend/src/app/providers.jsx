import React from "react";
import ErrorBoundary from "../components/shared/ErrorBoundary.jsx";

/**
 * App-level Provider container.
 * Wraps top-level error boundaries and application providers without business logic.
 */
export const Providers = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default Providers;
