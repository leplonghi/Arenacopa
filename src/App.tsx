import { useTranslation } from 'react-i18next';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n/config";
import { Suspense, lazy, useEffect } from "react";
import type { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Layout } from "@/components/Layout";
import { TermsGuard } from "@/components/TermsGuard";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MonetizationProvider } from "@/contexts/MonetizationContext";
import { ChampionshipProvider } from "@/contexts/ChampionshipContext";
import { AppSplash } from "@/components/AppSplash";
import FieldBackground from "@/components/FieldBackground";
import { useLanguage } from "@/i18n/useLanguage";
import { BRAND_MARK_SRC } from "@/lib/brand-assets";
import { sanitizeInternalRedirect } from "@/lib/security";
function isLazyChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(message);
}

function lazyWithReloadRetry<T extends ComponentType<Record<string, never>>>(
  key: string,
  loader: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await loader();
      sessionStorage.removeItem(`lazy-retry:${key}`);
      return module;
    } catch (error) {
      const retryKey = `lazy-retry:${key}`;
      if (isLazyChunkError(error) && !sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined);
      }
      throw error;
    }
  });
}

const Index = lazyWithReloadRetry("Index", () => import("./pages/Index"));
const Copa = lazyWithReloadRetry("Copa", () => import("./pages/Copa"));
const Descobrir = lazyWithReloadRetry("Descobrir", () => import("./pages/Descobrir"));
const Boloes = lazyWithReloadRetry("Boloes", () => import("./pages/Boloes"));
const CreatorPro = lazyWithReloadRetry("CreatorPro", () => import("./pages/CreatorPro"));
const CriarBolao = lazyWithReloadRetry("CriarBolao", () => import("./pages/CriarBolao"));
const BolaoDetail = lazyWithReloadRetry("BolaoDetail", () => import("./pages/BolaoDetail"));
const Perfil = lazyWithReloadRetry("Perfil", () => import("./pages/Perfil"));
const Ranking = lazyWithReloadRetry("Ranking", () => import("./pages/Ranking"));
const Rules = lazyWithReloadRetry("Rules", () => import("./pages/Rules"));
const TeamDetails = lazyWithReloadRetry("TeamDetails", () => import("./pages/TeamDetails"));
const Auth = lazyWithReloadRetry("Auth", () => import("./pages/Auth"));
const Guia = lazyWithReloadRetry("Guia", () => import("./pages/Guia"));
const MenuPage = lazyWithReloadRetry("Menu", () => import("./pages/Menu"));
const NotFound = lazyWithReloadRetry("NotFound", () => import("./pages/NotFound"));
const Premium = lazyWithReloadRetry("Premium", () => import("./pages/Premium"));
const PublicInvite = lazyWithReloadRetry("PublicInvite", () => import("./pages/PublicInvite"));
const PublicGroupInvite = lazyWithReloadRetry("PublicGroupInvite", () => import("./pages/PublicGroupInvite"));
const Grupos = lazyWithReloadRetry("Grupos", () => import("./pages/Grupos"));
const CriarGrupo = lazyWithReloadRetry("CriarGrupo", () => import("./pages/CriarGrupo"));
const GrupoDetail = lazyWithReloadRetry("GrupoDetail", () => import("./pages/GrupoDetail"));
const Privacidade = lazyWithReloadRetry("Privacidade", () => import("./pages/Privacidade"));
const Termos = lazyWithReloadRetry("Termos", () => import("./pages/Termos"));
const Noticias = lazyWithReloadRetry("Noticias", () => import("./pages/Noticias"));
const ExcluirConta = lazyWithReloadRetry("ExcluirConta", () => import("./pages/ExcluirConta"));
const Campeonatos = lazyWithReloadRetry("Campeonatos", () => import("./pages/Campeonatos"));
const CampeonatoHub = lazyWithReloadRetry("CampeonatoHub", () => import("./pages/CampeonatoHub"));
const BolaoRapido = lazyWithReloadRetry("BolaoRapido", () => import("./pages/BolaoRapido"));
const BaresLanding = lazyWithReloadRetry("BaresLanding", () => import("./pages/BaresLanding"));
const CriarCampanhaBar = lazyWithReloadRetry("CriarCampanhaBar", () => import("./pages/CriarCampanhaBar"));
const CampanhaBarDetail = lazyWithReloadRetry("CampanhaBarDetail", () => import("./pages/CampanhaBarDetail"));
const PublicCommercialCampaign = lazyWithReloadRetry("PublicCommercialCampaign", () => import("./pages/PublicCommercialCampaign"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — don't re-fetch while data is fresh
      gcTime:    10 * 60 * 1000,  // 10 min — keep in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false, // don't spam Firestore on tab switch
    },
  },
});

const legacyCopaMap: Record<string, string> = {
  overview: "/copa",
  today: "/copa",
  calendar: "/copa/calendario",
  schedule: "/copa/calendario",
  groups: "/copa/grupos",
  standings: "/copa/grupos",
  bracket: "/copa/chaves",
  knockout: "/copa/chaves",
  simulator: "/copa/simulacao",
  simulation: "/copa/simulacao",
  hosts: "/copa/guia",
  guide: "/copa/guia",
  news: "/noticias",
  noticias: "/noticias",
  history: "/copa/historia",
  historia: "/copa/historia",
};

const legacyGuiaMap: Record<string, string> = {
  map: "/copa/guia/mapa",
  mapa: "/copa/guia/mapa",
  cities: "/copa/guia",
  city: "/copa/guia",
  stadiums: "/copa/guia",
  hosts: "/copa/guia",
  sedes: "/copa/guia",
  history: "/copa/historia",
  historia: "/copa/historia",
};

function LegacyRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}

function LegacyRedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function LegacyCopaRedirect() {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean)[1] ?? "";
  return <Navigate to={legacyCopaMap[slug] ?? "/copa"} replace />;
}

function LegacyGuiaRedirect() {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean)[1] ?? "";
  return <Navigate to={legacyGuiaMap[slug] ?? "/copa/guia"} replace />;
}

function LegacyPoolDetailRedirect() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const poolId = segments[1];
  return <Navigate to={poolId ? `/boloes/${poolId}` : "/boloes"} replace />;
}

function DeepLinkListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const listener = CapacitorApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data);
      const url = new URL(data.url);
      const path = url.pathname;
      if (path && path !== '/') {
        navigate(path);
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}

function PushNotificationListener() {
  usePushNotifications();
  return null;
}

function LanguageRuntime() {
  useLanguage();
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#061a10] text-white">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <img
          src={BRAND_MARK_SRC}
          alt="Arena CUP"
          className="h-20 w-20 object-contain drop-shadow-[0_0_24px_rgba(34,197,94,0.45)]"
        />
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 pointer-events-none" />
      </div>
      <div className="h-1 w-24 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingScreen />;
  
  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectTo}`} replace />;
  }
  
  return <TermsGuard>{children}</TermsGuard>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  const redirectTo = sanitizeInternalRedirect(new URLSearchParams(location.search).get("redirect"));
  if (user) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    {/* /b/:inviteCode — shareable invite link. Public so unauthenticated users can see the "Join" screen. */}
    <Route path="/b/:inviteCode" element={<PublicInvite />} />
    <Route path="/c/:shareCode" element={<PublicCommercialCampaign />} />
    <Route path="/grupos/entrar/:inviteCode" element={<PublicGroupInvite />} />
    {/* Legal / compliance pages — intentionally PUBLIC (Play Store / App Store requirement).
        /excluir-conta must be public so unauthenticated users can still request deletion. */}
    <Route path="/privacidade" element={<Privacidade />} />
    <Route path="/termos" element={<Termos />} />
    <Route path="/excluir-conta" element={<ExcluirConta />} />
    <Route path="/privacy" element={<LegacyRedirect to="/privacidade" />} />
    <Route path="/terms" element={<LegacyRedirect to="/termos" />} />
    <Route path="/news" element={<ProtectedRoute><LegacyRedirect to="/noticias" /></ProtectedRoute>} />
    <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
    <Route path="/copa" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/copa/overview" element={<ProtectedRoute><LegacyRedirect to="/copa" /></ProtectedRoute>} />
    <Route path="/copa/sedes" element={<ProtectedRoute><Navigate to="/copa/guia" replace /></ProtectedRoute>} />
    <Route path="/copa/noticias" element={<ProtectedRoute><Navigate to="/noticias" replace /></ProtectedRoute>} />
    <Route path="/copa/guia" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/copa/guia/:subtab" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/copa/:subtab" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/cup" element={<ProtectedRoute><LegacyRedirect to="/copa" /></ProtectedRoute>} />
    <Route path="/cup/:subtab" element={<ProtectedRoute><LegacyCopaRedirect /></ProtectedRoute>} />
    <Route path="/simulator" element={<ProtectedRoute><LegacyRedirect to="/copa/simulacao" /></ProtectedRoute>} />
    <Route path="/copas/central" element={<ProtectedRoute><LegacyRedirect to="/copa" /></ProtectedRoute>} />
    {/* Championship hub — replaces the old /copa tab */}
    <Route path="/campeonatos" element={<ProtectedRoute><Layout><Campeonatos /></Layout></ProtectedRoute>} />
    {/* Placeholder for individual championship pages (Phase 1 builds these) */}
    <Route path="/campeonato/:championshipId" element={<ProtectedRoute><Layout><CampeonatoHub /></Layout></ProtectedRoute>} />
    <Route path="/descobrir" element={<ProtectedRoute><Layout><Descobrir /></Layout></ProtectedRoute>} />
    <Route path="/descobrir/boloes" element={<ProtectedRoute><Layout><Descobrir /></Layout></ProtectedRoute>} />
    <Route path="/descobrir/locais" element={<ProtectedRoute><Layout><Descobrir /></Layout></ProtectedRoute>} />
    <Route path="/descobrir/campanhas" element={<ProtectedRoute><Layout><Descobrir /></Layout></ProtectedRoute>} />
    <Route path="/descobrir/rankings" element={<ProtectedRoute><Layout><Descobrir /></Layout></ProtectedRoute>} />
    <Route path="/boloes" element={<ProtectedRoute><Layout><Boloes /></Layout></ProtectedRoute>} />
    <Route path="/boloes/creator" element={<ProtectedRoute><Layout><CreatorPro /></Layout></ProtectedRoute>} />
    <Route path="/boloes/rapido" element={<ProtectedRoute><Layout><BolaoRapido /></Layout></ProtectedRoute>} />
    <Route path="/boloes/criar" element={<ProtectedRoute><Layout><CriarBolao /></Layout></ProtectedRoute>} />
    <Route path="/boloes/:id" element={<ProtectedRoute><Layout><BolaoDetail /></Layout></ProtectedRoute>} />
    <Route path="/bares" element={<ProtectedRoute><Layout><BaresLanding /></Layout></ProtectedRoute>} />
    <Route path="/bares/campanhas/criar" element={<ProtectedRoute><Layout><CriarCampanhaBar /></Layout></ProtectedRoute>} />
    <Route path="/bares/campanhas/:campaignId" element={<ProtectedRoute><Layout><CampanhaBarDetail /></Layout></ProtectedRoute>} />
    <Route path="/campanhas" element={<ProtectedRoute><Layout><BaresLanding /></Layout></ProtectedRoute>} />
    <Route path="/campanhas/criar" element={<ProtectedRoute><Layout><CriarCampanhaBar /></Layout></ProtectedRoute>} />
    <Route path="/campanhas/:campaignId" element={<ProtectedRoute><Layout><CampanhaBarDetail /></Layout></ProtectedRoute>} />
    <Route path="/negocios" element={<ProtectedRoute><Layout><BaresLanding /></Layout></ProtectedRoute>} />
    <Route path="/negocios/criar" element={<ProtectedRoute><LegacyRedirect to="/campanhas/criar" /></ProtectedRoute>} />
    <Route path="/negocios/campanhas" element={<ProtectedRoute><Layout><BaresLanding /></Layout></ProtectedRoute>} />
    <Route path="/negocios/campanhas/:campaignId" element={<ProtectedRoute><Layout><CampanhaBarDetail /></Layout></ProtectedRoute>} />
    <Route path="/criar-bolao" element={<ProtectedRoute><LegacyRedirectWithSearch to="/boloes/criar" /></ProtectedRoute>} />
    <Route path="/pools" element={<ProtectedRoute><LegacyRedirect to="/boloes" /></ProtectedRoute>} />
    <Route path="/pools/create" element={<ProtectedRoute><LegacyRedirectWithSearch to="/boloes/criar" /></ProtectedRoute>} />
    <Route path="/pools/:id" element={<ProtectedRoute><LegacyPoolDetailRedirect /></ProtectedRoute>} />
    <Route path="/grupos" element={<ProtectedRoute><Layout><Grupos /></Layout></ProtectedRoute>} />
    <Route path="/grupos/criar" element={<ProtectedRoute><Layout><CriarGrupo /></Layout></ProtectedRoute>} />
    <Route path="/grupos/:grupoId" element={<ProtectedRoute><Layout><GrupoDetail /></Layout></ProtectedRoute>} />
    <Route path="/comunidades" element={<ProtectedRoute><Layout><Grupos /></Layout></ProtectedRoute>} />
    <Route path="/comunidades/criar" element={<ProtectedRoute><LegacyRedirectWithSearch to="/grupos/criar" /></ProtectedRoute>} />
    <Route path="/comunidades/:grupoId" element={<ProtectedRoute><Layout><GrupoDetail /></Layout></ProtectedRoute>} />
    <Route path="/guia" element={<ProtectedRoute><LegacyRedirect to="/copa/guia" /></ProtectedRoute>} />
    <Route path="/guia/historia" element={<ProtectedRoute><LegacyRedirect to="/copa/historia" /></ProtectedRoute>} />
    <Route path="/guia/:subtab" element={<ProtectedRoute><LegacyGuiaRedirect /></ProtectedRoute>} />
    <Route path="/guide" element={<ProtectedRoute><LegacyRedirect to="/copa/guia" /></ProtectedRoute>} />
    <Route path="/guide/:subtab" element={<ProtectedRoute><LegacyGuiaRedirect /></ProtectedRoute>} />
    <Route path="/team/:code" element={<ProtectedRoute><Layout><TeamDetails /></Layout></ProtectedRoute>} />
    <Route path="/menu" element={<ProtectedRoute><Layout><MenuPage /></Layout></ProtectedRoute>} />
    <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><LegacyRedirect to="/perfil" /></ProtectedRoute>} />
    <Route path="/account" element={<ProtectedRoute><LegacyRedirect to="/perfil" /></ProtectedRoute>} />
    <Route path="/conta" element={<ProtectedRoute><LegacyRedirect to="/perfil" /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Layout><Ranking /></Layout></ProtectedRoute>} />
    <Route path="/noticias" element={<ProtectedRoute><Layout><Noticias /></Layout></ProtectedRoute>} />
    <Route path="/regras" element={<ProtectedRoute><Layout><Rules /></Layout></ProtectedRoute>} />
    <Route path="/rules" element={<ProtectedRoute><LegacyRedirect to="/regras" /></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><Layout><Premium /></Layout></ProtectedRoute>} />
    <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <MonetizationProvider>
          <ChampionshipProvider>
            <Suspense fallback={<LoadingScreen />}>
              <LanguageRuntime />
              <FieldBackground />
              <AppSplash />
              <BrowserRouter>
                <DeepLinkListener />
                <PushNotificationListener />
                <ScrollToTop />
                <AppRoutes />
              </BrowserRouter>
            </Suspense>
          </ChampionshipProvider>
        </MonetizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
