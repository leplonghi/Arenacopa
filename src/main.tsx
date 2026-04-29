import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getBootstrapRedirectTarget } from "./lib/bootstrap-redirect";

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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
