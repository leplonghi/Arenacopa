import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

const pendingRedirect =
  sessionStorage.getItem("spa_redirect") ||
  new URLSearchParams(window.location.search).get("redirect");

if (pendingRedirect) {
  sessionStorage.removeItem("spa_redirect");
  const normalizedTarget = pendingRedirect.startsWith("/")
    ? pendingRedirect
    : `/${pendingRedirect}`;
  const nextUrl = `${window.location.origin}${normalizedTarget}`;
  window.history.replaceState(null, "", nextUrl);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
