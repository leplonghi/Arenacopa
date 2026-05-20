import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getBootstrapRedirectTarget, getLocalAuthHostRedirectUrl } from "./lib/bootstrap-redirect";

// Global React assignment for legacy library support if needed
if (typeof window !== "undefined") {
  (window as any).React = React;
  console.log("Arena CUP: Bootstrap starting...");
}

const localAuthHostRedirect = getLocalAuthHostRedirectUrl({
  href: window.location.href,
  isDev: import.meta.env.DEV,
});

if (localAuthHostRedirect) {
  window.location.replace(localAuthHostRedirect);
} else {
  const sessionRedirect = sessionStorage.getItem("spa_redirect");
  const pendingRedirect = getBootstrapRedirectTarget({
    pathname: window.location.pathname,
    search: window.location.search,
    sessionRedirect,
  });

  if (pendingRedirect) {
    sessionStorage.removeItem("spa_redirect");
    const nextUrl = `${window.location.origin}${pendingRedirect}`;
    window.history.replaceState(null, "", nextUrl);
  }

  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("Arena CUP: Root element found, mounting...");
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } else {
    console.error("Arena CUP: Root element not found!");
  }
}
