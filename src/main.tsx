import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// StrictMode is safe to enable now that:
//   • All useEffect callbacks return cleanup functions.
//   • Data fetching goes through React Query (which dedups the double-invoke).
//   • Realtime subscriptions remove their channel on cleanup.
// It runs effects twice in development to surface any remaining leaks early;
// production builds are unaffected.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
