import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n/config";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

import { TermsGuard } from "@/components/TermsGuard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <TermsGuard>{children}</TermsGuard>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
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
          <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#082016] text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="animate-pulse font-medium text-primary">Carregando ArenaCoca...</p>
            </div>
          </div>}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </Suspense>
        </MonetizationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
