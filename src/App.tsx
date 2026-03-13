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
const Index = lazy(() => import("./pages/Index"));
const Copa = lazy(() => import("./pages/Copa"));
const Boloes = lazy(() => import("./pages/Boloes"));
const CriarBolao = lazy(() => import("./pages/CriarBolao"));
const BolaoDetail = lazy(() => import("./pages/BolaoDetail"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Menu = lazy(() => import("./pages/Menu"));
const Rules = lazy(() => import("./pages/Rules"));
const TeamDetails = lazy(() => import("./pages/TeamDetails"));
const Auth = lazy(() => import("./pages/Auth"));
const Guia = lazy(() => import("./pages/Guia"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Premium = lazy(() => import("./pages/Premium"));
const PublicInvite = lazy(() => import("./pages/PublicInvite"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));

const queryClient = new QueryClient();

function DeepLinkListener() {
  const navigate = useNavigate();
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data);
      const url = new URL(data.url);
      const path = url.pathname;
      if (path && path !== '/') {
        navigate(path);
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  return null;
}

function PushNotificationListener() {
  usePushNotifications();
  return null;
}

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#082016] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="animate-pulse font-medium text-primary">Loading ArenaCup...</p>
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
    <Route path="/b/:inviteCode" element={<PublicInvite />} />
    <Route path="/privacidade" element={<Privacidade />} />
    <Route path="/termos" element={<Termos />} />
    <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
    <Route path="/copa" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/copa/:subtab" element={<ProtectedRoute><Layout><Copa /></Layout></ProtectedRoute>} />
    <Route path="/boloes" element={<ProtectedRoute><Layout><Boloes /></Layout></ProtectedRoute>} />
    <Route path="/boloes/criar" element={<ProtectedRoute><Layout><CriarBolao /></Layout></ProtectedRoute>} />
    <Route path="/boloes/:id" element={<ProtectedRoute><Layout><BolaoDetail /></Layout></ProtectedRoute>} />
    <Route path="/guia" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/guia/:subtab" element={<ProtectedRoute><Layout><Guia /></Layout></ProtectedRoute>} />
    <Route path="/team/:code" element={<ProtectedRoute><Layout><TeamDetails /></Layout></ProtectedRoute>} />
    <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Layout><Ranking /></Layout></ProtectedRoute>} />
    <Route path="/menu" element={<ProtectedRoute><Layout><Menu /></Layout></ProtectedRoute>} />
    <Route path="/regras" element={<ProtectedRoute><Layout><Rules /></Layout></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><Layout><Premium /></Layout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
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
