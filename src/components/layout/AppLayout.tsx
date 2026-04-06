import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, Menu, X, LogOut,
  Shield, ShieldCheck, ClipboardList, UserCog, Clock, Timer, Briefcase, MapPinCheck, Settings2, FileText,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useMyColaborador } from "@/hooks/useMyColaborador";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: "admin" | "super_admin" | "gestor";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Meu Espaço",
    items: [
      { name: "Início", href: "/", icon: LayoutDashboard },
      { name: "Registro de Ponto", href: "/registro-ponto", icon: Clock },
    ]
  },
  {
    label: "Gestão Institucional",
    items: [
      { name: "Registros Equipe", href: "/gerenciar-pontos", icon: Timer, requiredRole: "gestor" },
      { name: "Relatórios & BI", href: "/relatorios", icon: FileText, requiredRole: "gestor" },
      { name: "Painel de RH", href: "/gestao-rh", icon: Briefcase, requiredRole: "gestor" },
    ]
  },
  {
    label: "Administração",
    items: [
      { name: "Colaboradores", href: "/colaboradores", icon: Users, requiredRole: "admin" },
      { name: "Órgãos", href: "/orgaos", icon: Building2, requiredRole: "admin" },
      { name: "Unidades de Trabalho", href: "/unidades-trabalho", icon: MapPinCheck, requiredRole: "admin" },
      { name: "Auditoria", href: "/logs-auditoria", icon: ClipboardList, requiredRole: "admin" },
      { name: "Controle de Usuários", href: "/gerenciar-usuarios", icon: UserCog, requiredRole: "super_admin" },
      { name: "Configuração do Painel", href: "/admin/dashboard-config", icon: Settings2, requiredRole: "super_admin" },
    ]
  }
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: colaborador } = useMyColaborador();
  
  // Notificações Realtime para o órgão do colaborador logado
  useRealtimeNotifications(colaborador?.orgao_id);

  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isAdmin, isSuperAdmin, isGestor, role } = useIsAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtragem estrita dos grupos com base nos papéis
  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.requiredRole) return true;
      if (item.requiredRole === "super_admin") return isSuperAdmin;
      if (item.requiredRole === "admin") return isAdmin || isSuperAdmin;
      if (item.requiredRole === "gestor") return isAdmin || isGestor || isSuperAdmin;
      return false;
    })
  })).filter(group => group.items.length > 0);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const roleLabel = role === "super_admin" ? "Super Admin" : role === "admin" ? "RH Oficial" : role === "gestor" ? "Gestor de Unidade" : "Colaborador";
  const RoleIcon = role === "super_admin" ? ShieldCheck : Shield;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Oficial Governo PROCON (#0E1B2B Azul Noturno, #C51B29 Vermelho) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0B132B] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logos Header con Fondo Rojo (Estilo Foto) */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#C51B29] relative shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <Button
            variant="ghost" size="icon"
            className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu lateral"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="space-y-4 w-full flex flex-col items-center pt-2">
            {/* Logo Gobierno del Estado - Encima */}
            <div className="bg-white p-1.5 rounded-md shadow-sm">
              <img 
                src="/logo-gov-ma.png" 
                alt="Governo do Maranhão" 
                className="h-10 object-contain" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            </div>
            
            <div className="w-16 h-px bg-white/20 rounded-full" />
            
            {/* PROCON MA con fuente de la foto (Montserrat Black) */}
            <div className="flex flex-col items-center">
              <h2 className="text-white font-['Montserrat'] font-[900] tracking-tighter text-3xl leading-none px-2 drop-shadow-md">
                PROCON
              </h2>
              <span className="text-white font-['Montserrat'] font-bold text-lg tracking-[0.2em] -mt-1 drop-shadow-sm opacity-90">
                MA
              </span>
            </div>
          </div>
        </div>

        {/* Custom Scrollbar CSS for Navigation via utility classes */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pt-6 pb-4 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {visibleGroups.map((group) => (
            <div key={group.label} className="animate-fade-in slide-in-from-left-4 duration-500">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-[#C51B29] text-white shadow-md shadow-red-900/20"
                            : "text-slate-400 hover:bg-[#15203D] hover:text-slate-100"
                        )}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {/* Indicador de Borda para Hover (Efeito Sutil) */}
                        {!isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-slate-500 rounded-r-md transition-all duration-300 group-hover:h-3/4 opacity-0 group-hover:opacity-100" />
                        )}
                        
                        <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-blue-200")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Elegant User Bottom Section */}
        <div className="mt-auto p-4 bg-[#060D1F] border-t border-slate-800">
          {user && (
            <div className="rounded-xl bg-[#0B132B] p-3 border border-slate-700/50 shadow-inner mb-3 transition-colors hover:border-[#C51B29]/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-slate-200 truncate">{user.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                </div>
                {(isAdmin || isSuperAdmin || isGestor) && (
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-1.5 py-0 h-4 shrink-0 border-transparent shadow-none capitalize",
                    role === 'super_admin' ? "bg-amber-500/10 text-amber-500" :
                    role === 'admin' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                  )}>
                    <RoleIcon className="h-2.5 w-2.5 mr-1" />
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all mb-2"
            onClick={handleSignOut}
            aria-label="Encerrar sessão"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">Encerrar Sessão</span>
          </Button>
          
          <div className="text-center space-y-0.5 opacity-50">
            <p className="text-[10px] text-slate-500 font-medium">Sistema de Gestão de Ponto</p>
            <p className="text-[9px] text-slate-600">PROCON MA • v3.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-[#C51B29] border-b border-[#A01622] px-4 lg:hidden shadow-lg">
          <Button 
            variant="ghost" size="icon" 
            onClick={() => setSidebarOpen(true)} 
            className="text-white hover:bg-white/10"
            aria-label="Abrir menu lateral"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-['Montserrat'] font-[900] text-white text-lg tracking-tighter">
              PROCON <span className="text-white opacity-80 font-bold ml-1">MA</span>
            </h1>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
