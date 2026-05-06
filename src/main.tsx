import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getBootstrapRedirectTarget, getLocalAuthHostRedirectUrl } from "./lib/bootstrap-redirect";

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

  createRoot(document.getElementById("root") as HTMLElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

