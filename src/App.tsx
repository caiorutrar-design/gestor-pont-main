import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminOrSuperRoute } from "@/components/AdminOrSuperRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { ColaboradorRoute } from "@/components/ColaboradorRoute";
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Colaboradores = lazy(() => import("./pages/Colaboradores"));
const Orgaos = lazy(() => import("./pages/Orgaos"));
const UnidadesTrabalho = lazy(() => import("./pages/UnidadesTrabalho"));
const RegistroPonto = lazy(() => import("./pages/RegistroPonto"));
const GerenciarPontos = lazy(() => import("./pages/GerenciarPontos"));
const GerenciamentoUsuarios = lazy(() => import("./pages/GerenciamentoUsuarios"));
const LogsAuditoria = lazy(() => import("./pages/LogsAuditoria"));
const GestaoRH = lazy(() => import("./pages/GestaoRH"));
const DossieColaborador = lazy(() => import("./pages/DossieColaborador"));
const MeuPonto = lazy(() => import("./pages/MeuPonto"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const GestaoFinanceira = lazy(() => import("./pages/GestaoFinanceira"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardConfig = lazy(() => import("./pages/DashboardConfig"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/meu-ponto" element={<ColaboradorRoute><MeuPonto /></ColaboradorRoute>} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/registro-ponto" element={<ProtectedRoute><RegistroPonto /></ProtectedRoute>} />
              {/* Admin + Super Admin routes */}
              <Route path="/colaboradores" element={<AdminOrSuperRoute><Colaboradores /></AdminOrSuperRoute>} />
              <Route path="/orgaos" element={<AdminOrSuperRoute><Orgaos /></AdminOrSuperRoute>} />
              <Route path="/unidades-trabalho" element={<AdminOrSuperRoute><UnidadesTrabalho /></AdminOrSuperRoute>} />
              <Route path="/gerenciar-pontos" element={<ProtectedRoute><GerenciarPontos /></ProtectedRoute>} />
              <Route path="/logs-auditoria" element={<AdminOrSuperRoute><LogsAuditoria /></AdminOrSuperRoute>} />
              <Route path="/gestao-rh" element={<ProtectedRoute><GestaoRH /></ProtectedRoute>} />
              <Route path="/dossie/:id" element={<ProtectedRoute><DossieColaborador /></ProtectedRoute>} />
              {/* Super Admin only */}
              <Route path="/gerenciar-usuarios" element={<SuperAdminRoute><GerenciamentoUsuarios /></SuperAdminRoute>} />
              <Route path="/admin/dashboard-config" element={<SuperAdminRoute><DashboardConfig /></SuperAdminRoute>} />
              <Route path="/financeiro" element={<SuperAdminRoute><GestaoFinanceira /></SuperAdminRoute>} />
              <Route path="/planos" element={<LandingPage />} />
              <Route path="/precos" element={<LandingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
