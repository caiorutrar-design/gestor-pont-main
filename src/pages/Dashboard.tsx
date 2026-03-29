import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building2, ArrowRight, UserCog, ClipboardList, Clock, Timer, Layout, Database } from "lucide-react";
import { format } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import PBIReport from "@/components/dashboard/PowerBIEmbed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, isGestor } = useIsAdmin();
  const { data: colaboradores = [] } = useColaboradores();
  const { data: orgaos = [] } = useOrgaos();

  const [configs, setConfigs] = useState<any>(null);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data } = await (supabase as any)
          .from('dashboard_settings')
          .select('*')
          .single();
        if (data) setConfigs(data);
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      } finally {
        setLoadingConfigs(false);
      }
    };
    fetchConfigs();
  }, []);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const { data: registrosHoje = [] } = useRegistrosPonto({ dataInicio: hoje, dataFim: hoje });

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const colaboradoresInativos = colaboradores.filter((c) => !c.ativo).length;

  // Mock data para Órgãos (Top 5)
  const orgaosChartData = useMemo(() => [
    { name: "PROCON", total: 12 },
    { name: "SEAD", total: 8 },
    { name: "SEFAZ", total: 6 },
    { name: "VIVA", total: 4 },
    { name: "SEDEL", total: 3 },
  ], []);

  // Mock data para Evolução de Pontos (Registros hoje por turno/hora)
  const registrosEvolucaoData = useMemo(() => [
    { hora: "07h", total: 2 },
    { hora: "08h", total: 15 },
    { hora: "09h", total: 7 },
    { hora: "12h", total: 12 },
    { hora: "13h", total: 5 },
    { hora: "17h", total: 9 },
  ], []);

  // Data para Ativos vs Inativos
  const statusChartData = useMemo(() => [
    { name: "Ativos", value: colaboradoresAtivos, fill: "#0B132B" },
    { name: "Inativos", value: colaboradoresInativos, fill: "#E2E8F0" },
  ], [colaboradoresAtivos, colaboradoresInativos]);

  // Count unique colaboradores who registered today
  const colaboradoresComPonto = useMemo(() => {
    return new Set(registrosHoje.map((r) => r.colaborador_id)).size;
  }, [registrosHoje]);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0B132B] md:text-3xl">
              {isSuperAdmin ? "Painel do Super Administrador" : isAdmin ? "Painel do RH" : isGestor ? "Painel do Gestor" : "Meu Painel"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {isAdmin ? "Gerencie colaboradores e registros de ponto" : isGestor ? "Acompanhe os registros da sua equipe" : `Bem-vindo, ${user?.email}`}
            </p>
          </div>
          {configs?.powerbi_enabled && (
             <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1 px-3 py-1 animate-pulse">
               <Database className="h-3 w-3" /> BI INTEGRADO
             </Badge>
          )}
        </div>

        {(isAdmin || isGestor) && (
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-[#C51B29] rounded-none bg-transparent px-0 py-2 font-semibold text-slate-500 data-[state=active]:text-[#0B132B] transition-all">
                  <Layout className="h-4 w-4 mr-2" /> Visão Geral
                </TabsTrigger>
                {configs?.powerbi_enabled && (
                  <TabsTrigger value="powerbi" className="border-b-2 border-transparent data-[state=active]:border-[#C51B29] rounded-none bg-transparent px-0 py-2 font-semibold text-slate-500 data-[state=active]:text-[#0B132B] transition-all">
                    <Database className="h-4 w-4 mr-2" /> Power BI Reports
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {(!configs || configs.enabled_cards?.colaboradores) && (
                  <Card className="card-institutional border-t-4 border-t-[#0B132B] shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Colaboradores Ativos</CardTitle>
                      <div className="rounded-lg p-2 bg-[#0B132B]/5">
                        <Users className="h-4 w-4 text-[#0B132B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold text-[#0B132B]">{colaboradoresAtivos}</div>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{colaboradoresInativos} inativos</p>
                        </div>
                      </div>
                      <div className="h-[100px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusChartData}>
                            <XAxis dataKey="name" hide />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                              {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!configs || configs.enabled_cards?.orgaos) && (
                  <Card className="card-institutional border-t-4 border-t-[#C51B29] shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Órgãos Cadastrados</CardTitle>
                      <div className="rounded-lg p-2 bg-[#C51B29]/5">
                        <Building2 className="h-4 w-4 text-[#C51B29]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[#0B132B] mb-4">{orgaos.length}</div>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={orgaosChartData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" hide />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="total" fill="#C51B29" radius={[0, 4, 4, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-[9px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest">Top 5 Órgãos / Lotação</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!configs || configs.enabled_cards?.pontos) && (
                  <Card className="card-institutional border-t-4 border-t-[#0B132B] shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Pontos Registrados Hoje</CardTitle>
                      <div className="rounded-lg p-2 bg-slate-100">
                        <Timer className="h-4 w-4 text-[#0B132B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold text-[#0B132B]">{registrosHoje.length}</div>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{colaboradoresComPonto} colaborador(es)</p>
                        </div>
                      </div>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={registrosEvolucaoData}>
                            <XAxis dataKey="hora" fontSize={9} axisLine={false} tickLine={false} />
                            <Tooltip 
                              cursor={{ fill: 'rgba(197, 27, 41, 0.05)' }}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                               {registrosEvolucaoData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#C51B29" : "#0B132B"} />
                               ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Links */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
                <Link to="/registro-ponto">
                  <Card className="card-institutional hover:border-[#C51B29]/30 hover:shadow-lg transition-all cursor-pointer group border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base text-[#0B132B]">
                        <Clock className="h-5 w-5 text-[#C51B29]" />
                        Registro de Ponto
                      </CardTitle>
                      <CardDescription className="text-xs">Registrar ponto de colaboradores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#C51B29] group-hover:opacity-80 inline-flex items-center gap-1 transition-all">
                        Acessar <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/gerenciar-pontos">
                  <Card className="card-institutional hover:border-[#C51B29]/30 hover:shadow-lg transition-all cursor-pointer group border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base text-[#0B132B]">
                        <ClipboardList className="h-5 w-5 text-[#C51B29]" />
                        Relatórios de Ponto
                      </CardTitle>
                      <CardDescription className="text-xs">Visualizar e exportar registros</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#C51B29] group-hover:opacity-80 inline-flex items-center gap-1 transition-all">
                        Acessar <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/colaboradores">
                  <Card className="card-institutional hover:border-[#C51B29]/30 hover:shadow-lg transition-all cursor-pointer group border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base text-[#0B132B]">
                        <Users className="h-5 w-5 text-[#C51B29]" />
                        Colaboradores
                      </CardTitle>
                      <CardDescription className="text-xs">Gerenciar base de servidores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#C51B29] group-hover:opacity-80 inline-flex items-center gap-1 transition-all">
                        Acessar <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
                {isSuperAdmin && (
                  <Link to="/admin/dashboard-config">
                    <Card className="card-institutional hover:border-[#F2C811]/30 hover:shadow-lg transition-all cursor-pointer group border-slate-200 bg-slate-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-[#0B132B]">
                          <UserCog className="h-5 w-5 text-[#0B132B]" />
                          Configurações
                        </CardTitle>
                        <CardDescription className="text-xs">Ajustar painel e Power BI</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B132B] group-hover:opacity-80 inline-flex items-center gap-1 transition-all">
                          Acessar <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            </TabsContent>

            {configs?.powerbi_enabled && (
              <TabsContent value="powerbi" className="animate-in fade-in zoom-in-95 duration-500">
                <PBIReport 
                  reportId={configs.powerbi_report_id} 
                  embedUrl={configs.powerbi_embed_url} 
                />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Regular user: redirect to registro de ponto */}
        {!isAdmin && !isGestor && (
          <div className="max-w-lg mx-auto text-center py-12 md:py-20 lg:py-32">
            <div className="h-20 w-20 rounded-2xl bg-[#0B132B]/5 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Clock className="h-10 w-10 text-[#C51B29]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B132B] mb-2 uppercase tracking-tight">Registro de Ponto Digital</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Bem-vindo ao sistema oficial do PROCON MA. Acesse a página de registro para bater seu ponto.
            </p>
            <Button asChild size="lg" className="bg-[#C51B29] hover:bg-[#A01622] text-white px-8 h-12 shadow-md shadow-red-900/10">
              <Link to="/registro-ponto">Ir para Registro de Ponto</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
