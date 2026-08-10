import React from "react";
import Providers from "./providers.jsx";
import Router from "./router.jsx";

/**
 * Main application component.
 */
export const App = () => {
  return (
    <Providers>
      <Router />
    </Providers>
  );
};

export default App;
