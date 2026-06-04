/* Bootstrap entry: intentional console diagnostics + window.React global. */
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getBootstrapRedirectTarget, getLocalAuthHostRedirectUrl } from "./lib/bootstrap-redirect";

// Global React assignment for legacy library support if needed
if (typeof window !== "undefined") {
  (window as any).React = React;
  console.log("Arena CUP: Bootstrap starting...");
}

// Visible, zero-dependency fallback. Without this, a throw during module
// evaluation of the App chain (e.g. Firebase init with a missing API key)
// kills the bootstrap BEFORE React mounts — leaving a silent black screen
// that no ErrorBoundary can catch. Rendering a real message here makes such
// failures diagnosable instead of invisible.
function renderFatalError(rootElement: HTMLElement, error: unknown) {
  console.error("Arena CUP: Fatal bootstrap error:", error);
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#010604;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:sans-serif">
      <h1 style="font-size:22px;font-weight:bold;margin-bottom:12px">Não foi possível carregar o ArenaCUP</h1>
      <p style="opacity:0.8;margin-bottom:20px;max-width:420px;line-height:1.5">
        Ocorreu um erro ao iniciar a aplicação. Recarregue a página — se persistir, tente novamente em alguns instantes.
      </p>
      <button onclick="window.location.reload()" style="padding:12px 24px;background:#ffc107;color:black;border:none;border-radius:8px;font-weight:bold;cursor:pointer">
        Recarregar
      </button>
      <pre style="margin-top:20px;padding:10px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:12px;max-width:90vw;overflow:auto;opacity:0.6">${detail.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c))}</pre>
    </div>`;
}

async function bootstrap() {
  const localAuthHostRedirect = getLocalAuthHostRedirectUrl({
    href: window.location.href,
    isDev: import.meta.env.DEV,
  });

  if (localAuthHostRedirect) {
    window.location.replace(localAuthHostRedirect);
    return;
  }

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
  if (!rootElement) {
    console.error("Arena CUP: Root element not found!");
    return;
  }

  try {
    // Dynamic import so a module-eval throw in the App chain is catchable here
    // instead of crashing the entry script before anything renders.
    const { default: App } = await import("./App.tsx");
    console.log("Arena CUP: Root element found, mounting...");
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    renderFatalError(rootElement, error);
  }
}

void bootstrap();
