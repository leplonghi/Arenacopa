import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Copa from "./pages/Copa";
import Boloes from "./pages/Boloes";
import CriarBolao from "./pages/CriarBolao";
import BolaoDetail from "./pages/BolaoDetail";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/copa" element={<Copa />} />
            <Route path="/copa/:subtab" element={<Copa />} />
            <Route path="/boloes" element={<Boloes />} />
            <Route path="/boloes/criar" element={<CriarBolao />} />
            <Route path="/boloes/:id" element={<BolaoDetail />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
