import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n/config";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MonetizationProvider } from "@/contexts/MonetizationContext";
import Index from "./pages/Index";
import Copa from "./pages/Copa";
import Boloes from "./pages/Boloes";
import CriarBolao from "./pages/CriarBolao";
import BolaoDetail from "./pages/BolaoDetail";
import Perfil from "./pages/Perfil";
import Ranking from "./pages/Ranking";
import Menu from "./pages/Menu";
import Rules from "./pages/Rules";
import TeamDetails from "./pages/TeamDetails";
import Auth from "./pages/Auth";
import Guia from "./pages/Guia";
import NotFound from "./pages/NotFound";
import Premium from "./pages/Premium";
import PublicInvite from "./pages/PublicInvite";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";

const queryClient = new QueryClient();

import { TermsGuard } from "@/components/TermsGuard";

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
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
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
