import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
const UsuariosSistema = lazy(() => import("./pages/UsuariosSistema"));
const LogsAuditoria = lazy(() => import("./pages/LogsAuditoria"));
const GestaoRH = lazy(() => import("./pages/GestaoRH"));
const DossieColaborador = lazy(() => import("./pages/DossieColaborador"));
const MeuPonto = lazy(() => import("./pages/MeuPonto"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const DashboardConfig = lazy(() => import("./pages/DashboardConfig"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * QueryClient com estratégia de cache escalonada por tipo de dado:
 * - Dados estruturais (órgãos, unidades): 10 min  — mudam raramente
 * - Histórico de ponto:                    2 min  — leitura frequente
 * - Status atual (última batida):         30 seg  — quase tempo-real
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 min: dados considerados frescos
      gcTime: 10 * 60 * 1000,        // 10 min: tempo em cache após unmount
      retry: 2,                       // 2 tentativas em caso de falha de rede
      refetchOnWindowFocus: false,    // Não refetch ao trocar de aba (carga desnecessária)
      refetchOnReconnect: true,       // Sim ao reconectar rede (dados desatualizados)
      refetchOnMount: false,          // Usa cache se ainda fresco
    },
    mutations: {
      retry: 1,                       // 1 retry em mutações críticas
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>}>
            <Routes>
              {/* ... routes ... */}
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/meu-ponto" element={<ColaboradorRoute><MeuPonto /></ColaboradorRoute>} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/relatorios" element={<AdminOrSuperRoute><Relatorios /></AdminOrSuperRoute>} />
              <Route path="/registro-ponto" element={<ProtectedRoute><RegistroPonto /></ProtectedRoute>} />
              <Route path="/colaboradores" element={<AdminOrSuperRoute><Colaboradores /></AdminOrSuperRoute>} />
              <Route path="/orgaos" element={<AdminOrSuperRoute><Orgaos /></AdminOrSuperRoute>} />
              <Route path="/unidades-trabalho" element={<AdminOrSuperRoute><UnidadesTrabalho /></AdminOrSuperRoute>} />
              <Route path="/gerenciar-pontos" element={<ProtectedRoute><GerenciarPontos /></ProtectedRoute>} />
              <Route path="/logs-auditoria" element={<AdminOrSuperRoute><LogsAuditoria /></AdminOrSuperRoute>} />
              <Route path="/gestao-rh" element={<ProtectedRoute><GestaoRH /></ProtectedRoute>} />
              <Route path="/dossie/:id" element={<ProtectedRoute><DossieColaborador /></ProtectedRoute>} />
              <Route path="/gerenciar-usuarios" element={<SuperAdminRoute><UsuariosSistema /></SuperAdminRoute>} />
              <Route path="/admin/dashboard-config" element={<SuperAdminRoute><DashboardConfig /></SuperAdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

export default App;
