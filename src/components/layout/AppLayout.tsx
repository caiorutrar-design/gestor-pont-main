import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, Menu, X, LogOut,
  Shield, ShieldCheck, ClipboardList, UserCog, Clock, Timer, Briefcase, MapPinCheck, Settings2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isAdmin, isSuperAdmin, isGestor, role } = useIsAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Theme */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header Sidebar */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#1e293b] border-b border-slate-800 relative shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <Button
            variant="ghost" size="icon"
            className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="space-y-4 w-full flex flex-col items-center pt-2">
            {/* Ícone do Relógio */}
            <div className="bg-slate-800 p-3 rounded-lg shadow-inner border border-slate-700">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            
            <div className="w-16 h-px bg-slate-700 rounded-full" />
            
            {/* Nome da Empresa */}
            <div className="flex flex-col items-center">
              <h2 className="text-white font-bold text-xl leading-tight px-2 text-center">
                SIF SAÚDE E PERFORMANCE
              </h2>
            </div>
          </div>
        </div>

        {/* Navigation */}
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
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {!isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-md transition-all duration-300 group-hover:h-3/4 opacity-0 group-hover:opacity-100" />
                        )}
                        
                        <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="mt-auto p-4 bg-[#0f172a] border-t border-slate-800">
          {user && (
            <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50 shadow-inner mb-3 transition-colors hover:border-primary/30">
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
            className="w-full justify-start gap-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all mb-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Encerrar Sessão</span>
          </Button>
          
          <div className="text-center space-y-0.5 opacity-50">
            <p className="text-[10px] text-slate-500 font-medium">Gestor de Ponto</p>
            <p className="text-[9px] text-slate-600">SIF SAÚDE E PERFORMANCE • v3.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-[#1e293b] border-b border-slate-800 px-4 lg:hidden shadow-lg">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-white text-base">
              SIF SAÚDE E PERFORMANCE
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