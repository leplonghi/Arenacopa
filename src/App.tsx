import { useTranslation } from 'react-i18next';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n/config";
import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Layout } from "@/components/Layout";
import { TermsGuard } from "@/components/TermsGuard";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MonetizationProvider } from "@/contexts/MonetizationContext";
import FieldBackground from "@/components/FieldBackground";
const Index = lazy(() => import("./pages/Index"));
const Copa = lazy(() => import("./pages/Copa"));
const Boloes = lazy(() => import("./pages/Boloes"));
const CriarBolao = lazy(() => import("./pages/CriarBolao"));
const BolaoDetail = lazy(() => import("./pages/BolaoDetail"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Rules = lazy(() => import("./pages/Rules"));
const TeamDetails = lazy(() => import("./pages/TeamDetails"));
const Auth = lazy(() => import("./pages/Auth"));
const Guia = lazy(() => import("./pages/Guia"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Premium = lazy(() => import("./pages/Premium"));
const PublicInvite = lazy(() => import("./pages/PublicInvite"));
const Grupos = lazy(() => import("./pages/Grupos"));
const GrupoDetail = lazy(() => import("./pages/GrupoDetail"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const Noticias = lazy(() => import("./pages/Noticias"));
const ExcluirConta = lazy(() => import("./pages/ExcluirConta"));

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
  overview: "",
  today: "",
  calendar: "calendario",
  groups: "grupos",
  bracket: "chaves",
  simulator: "simulacao",
  hosts: "sedes",
  news: "noticias",
  history: "historia",
};

const legacyGuiaMap: Record<string, string> = {
  map: "mapa",
  cities: "",
  city: "",
  stadiums: "estadios",
  hosts: "estadios",
};

function LegacyRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}

function LegacyCopaRedirect() {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean)[1] ?? "";
  const mapped = legacyCopaMap[slug] ?? "";
  return <Navigate to={mapped ? `/copa/${mapped}` : "/copa"} replace />;
}

function LegacyGuiaRedirect() {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean)[1] ?? "";
  const mapped = legacyGuiaMap[slug] ?? "";
  return <Navigate to={mapped ? `/guia/${mapped}` : "/guia"} replace />;
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

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#061a10] text-white">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <img
          src="/logo.png?v=20260316"
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
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <TermsGuard>{children}</TermsGuard>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/";
  if (user) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    {/* /b/:inviteCode — shareable invite link. ProtectedRoute handles the redirect
        to /auth?redirect=/b/:inviteCode so the user lands back here after login. */}
    <Route path="/b/:inviteCode" element={<ProtectedRoute><PublicInvite /></ProtectedRoute>} />
    {/* Legal / compliance pages — intentionally PUBLIC (Play Store / App Store requirement).
        /excluir-conta must be public so unauthenticated users can still request deletion. */}
    <Route path="/privacidade" element={<Privacidade />} />
    <Route path="/termos" element={<Termos />} />
    <Route path="/excluir-conta" element={<ExcluirConta />} />
    <Route path="/privacy" element={<LegacyRedirect to="/privacidade" />} />
    <Route path="/terms" element={<LegacyRedirect to="/termos" />} />
    <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
    <Route path="/copa" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/copa/sedes" element={<ProtectedRoute><Navigate to="/guia" replace /></ProtectedRoute>} />
    <Route path="/copa/historia" element={<ProtectedRoute><Navigate to="/guia/historia" replace /></ProtectedRoute>} />
    <Route path="/copa/noticias" element={<ProtectedRoute><Navigate to="/noticias" replace /></ProtectedRoute>} />
    <Route path="/copa/:subtab" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/cup" element={<ProtectedRoute><LegacyRedirect to="/copa" /></ProtectedRoute>} />
    <Route path="/cup/:subtab" element={<ProtectedRoute><LegacyCopaRedirect /></ProtectedRoute>} />
    <Route path="/simulator" element={<ProtectedRoute><LegacyRedirect to="/copa/simulacao" /></ProtectedRoute>} />
    <Route path="/copas/central" element={<ProtectedRoute><LegacyRedirect to="/copa" /></ProtectedRoute>} />
    <Route path="/boloes" element={<ProtectedRoute><Layout><Boloes /></Layout></ProtectedRoute>} />
    <Route path="/boloes/criar" element={<ProtectedRoute><Layout><CriarBolao /></Layout></ProtectedRoute>} />
    <Route path="/boloes/:id" element={<ProtectedRoute><Layout><BolaoDetail /></Layout></ProtectedRoute>} />
    <Route path="/criar-bolao" element={<ProtectedRoute><LegacyRedirect to="/boloes/criar" /></ProtectedRoute>} />
    <Route path="/pools" element={<ProtectedRoute><LegacyRedirect to="/boloes" /></ProtectedRoute>} />
    <Route path="/pools/create" element={<ProtectedRoute><LegacyRedirect to="/boloes/criar" /></ProtectedRoute>} />
    <Route path="/pools/:id" element={<ProtectedRoute><LegacyPoolDetailRedirect /></ProtectedRoute>} />
    <Route path="/grupos" element={<ProtectedRoute><Layout><Grupos /></Layout></ProtectedRoute>} />
    <Route path="/grupos/:grupoId" element={<ProtectedRoute><Layout><GrupoDetail /></Layout></ProtectedRoute>} />
    <Route path="/guia" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/guia/:subtab" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/guide" element={<ProtectedRoute><LegacyRedirect to="/guia" /></ProtectedRoute>} />
    <Route path="/guide/:subtab" element={<ProtectedRoute><LegacyGuiaRedirect /></ProtectedRoute>} />
    <Route path="/team/:code" element={<ProtectedRoute><Layout><TeamDetails /></Layout></ProtectedRoute>} />
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
          <Suspense fallback={<LoadingScreen />}>
            <FieldBackground />
            <BrowserRouter>
              <DeepLinkListener />
              <PushNotificationListener />
              <AppRoutes />
            </BrowserRouter>
          </Suspense>
        </MonetizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
