import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useFrequenciaMensal } from "@/hooks/useFrequenciaMensal";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building2, ArrowRight, UserCog, ClipboardList, Clock, Timer, Layout, Database, TrendingUp, Activity } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import PBIReport from "@/components/dashboard/PowerBIEmbed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 260, 
      damping: 20 
    } 
  }
};

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
  const mesAtual = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: registrosHoje = [] } = useRegistrosPonto({ dataInicio: hoje, dataFim: hoje });
  const { data: frequenciaMensal = [] } = useFrequenciaMensal({ mesRef: mesAtual });

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const colaboradoresInativos = colaboradores.filter((c) => !c.ativo).length;

  const orgaosChartData = useMemo(() => {
    if (frequenciaMensal.length > 0) {
      return frequenciaMensal
        .sort((a, b) => b.dias_trabalhados - a.dias_trabalhados)
        .slice(0, 5)
        .map(f => ({ name: f.matricula, total: f.dias_trabalhados }));
    }
    return [{ name: "-", total: 0 }];
  }, [frequenciaMensal]);

  const registrosEvolucaoData = useMemo(() => {
    if (frequenciaMensal.length > 0) {
      return frequenciaMensal.slice(0, 6).map(f => ({
        hora: f.matricula,
        total: f.total_entradas
      }));
    }
    return [];
  }, [frequenciaMensal]);

  const colaboradoresComPonto = useMemo(() => {
    return new Set(registrosHoje.map((r) => r.colaborador_id)).size;
  }, [registrosHoje]);

  const taxaAssiduidade = useMemo(() => {
    if (colaboradoresAtivos === 0) return 0;
    return Math.round((colaboradoresComPonto / colaboradoresAtivos) * 100);
  }, [colaboradoresComPonto, colaboradoresAtivos]);

  const totalDiasTrabalhados = useMemo(() =>
    frequenciaMensal.reduce((acc, f) => acc + (f.dias_trabalhados || 0), 0)
  , [frequenciaMensal]);

  const statusChartData = useMemo(() => [
    { name: "Ativos", value: colaboradoresAtivos, fill: "#C51B29" },
    { name: "Inativos", value: colaboradoresInativos, fill: "#E2E8F0" },
  ], [colaboradoresAtivos, colaboradoresInativos]);

  return (
    <AppLayout>
      <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4 border-none mb-0 pb-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600/80">Monitoramento Ativo</span>
            </div>
            <h1 className="text-3xl font-[900] text-secondary md:text-4xl tracking-tighter">
              {isSuperAdmin ? "Painel Analítico" : isAdmin ? "Gestão Estratégica" : isGestor ? "Monitoramento" : "Meu Espaço"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium opacity-70">
              {isAdmin ? "Kpis de assiduidade e controle de frequência consolidado" : isGestor ? "Acompanhamento em tempo real da equipe" : `Boas-vindas, ${user?.email?.split('@')[0]}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 hidden md:flex">
              <Link to="/relatorios" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Relatórios Exportáveis
              </Link>
            </Button>
            {configs?.powerbi_enabled && (
               <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-2 px-4 py-1.5 shadow-sm">
                 <Activity className="h-3.5 w-3.5 animate-bounce" /> BI ANALYTICS
               </Badge>
            )}
          </div>
        </motion.div>

        {(isAdmin || isGestor) && (
          <Tabs defaultValue="overview" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-0 py-3 font-bold text-slate-400 data-[state=active]:text-secondary transition-all uppercase text-[11px] tracking-widest">
                  <Layout className="h-4 w-4 mr-2" /> Visão Operacional
                </TabsTrigger>
                {configs?.powerbi_enabled && (
                  <TabsTrigger value="powerbi" className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent px-0 py-3 font-bold text-slate-400 data-[state=active]:text-secondary transition-all uppercase text-[11px] tracking-widest">
                    <Database className="h-4 w-4 mr-2" /> Power BI Reports
                  </TabsTrigger>
                )}
              </TabsList>
            </motion.div>

            <TabsContent value="overview" className="space-y-8 outline-none">
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                {(!configs || configs.enabled_cards?.colaboradores) && (
                  <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-white to-slate-50/50">
                      <div className="h-1.5 w-full bg-secondary" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Taxa de Assiduidade</CardTitle>
                        <Activity className="h-4 w-4 text-secondary/40" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-[900] text-secondary tracking-tighter">{taxaAssiduidade}%</span>
                          <span className="text-[10px] font-bold text-emerald-600">Presença Hoje</span>
                        </div>
                        <div className="h-[80px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrosEvolucaoData}>
                                <Area type="monotone" dataKey="total" stroke="#C51B29" fill="#C51B29" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {(!configs || configs.enabled_cards?.orgaos) && (
                  <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-white to-slate-50/50">
                      <div className="h-1.5 w-full bg-primary" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Servidores Ativos</CardTitle>
                        <Users className="h-4 w-4 text-primary/40" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-[900] text-secondary tracking-tighter">{colaboradoresAtivos}</div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">RH Consolidado</p>
                        <div className="h-[80px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusChartData}>
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                {statusChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {(!configs || configs.enabled_cards?.pontos) && (
                  <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-white to-slate-50/50">
                      <div className="h-1.5 w-full bg-secondary" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Volume de Registros</CardTitle>
                        <TrendingUp className="h-4 w-4 text-secondary/40" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-[900] text-secondary tracking-tighter">{totalDiasTrabalhados}</div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Batidas no Mês</p>
                        <div className="h-[80px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={registrosEvolucaoData}>
                              <Bar dataKey="total" radius={[4, 4, 4, 4]} barSize={8}>
                                 {registrosEvolucaoData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#C51B29" : "#0B132B"} fillOpacity={0.7} />
                                 ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Quick Links with Enhanced Interaction */}
              <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4">
                {[
                  { to: "/registro-ponto", icon: Clock, title: "Registro Kiosk", desc: "Terminal de frequência", color: "var(--primary)" },
                  { to: "/gerenciar-pontos", icon: ClipboardList, title: "Frequência", desc: "Gestão e Exportação", color: "var(--secondary)" },
                  { to: "/colaboradores", icon: Users, title: "Servidores", desc: "Recursos Humanos", color: "var(--primary)" },
                  { to: "/admin/dashboard-config", icon: UserCog, title: "Ajustes", desc: "Painéis e BI", color: "var(--secondary)", superOnly: true }
                ].map((link, idx) => {
                  if (link.superOnly && !isSuperAdmin) return null;
                  const Icon = link.icon;
                  return (
                    <Link key={idx} to={link.to}>
                      <Card className="card-institutional group transition-all duration-300 hover:shadow-premium hover:-translate-y-1 border-slate-200/60 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-5 transition-opacity group-hover:opacity-10">
                           <Icon className="h-16 w-16" />
                        </div>
                        <CardHeader className="pb-3 relative z-10">
                          <CardTitle className="flex items-center gap-3 text-base text-secondary font-bold">
                            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            {link.title}
                          </CardTitle>
                          <CardDescription className="text-[11px] font-medium ml-11">{link.desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 ml-11 relative z-10">
                          <span className="text-[10px] font-[900] uppercase tracking-[0.2em] text-primary inline-flex items-center gap-1.5 transition-all">
                            Executar <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </motion.div>
            </TabsContent>

            {configs?.powerbi_enabled && (
              <TabsContent value="powerbi" className="animate-in fade-in zoom-in-95 duration-500 outline-none">
                <PBIReport 
                  reportId={configs.powerbi_report_id} 
                  embedUrl={configs.powerbi_embed_url} 
                />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Regular user: Premium Redirect View */}
        {!isAdmin && !isGestor && (
          <motion.div variants={itemVariants} className="max-w-xl mx-auto text-center py-16 md:py-32">
            <div className="relative inline-block mb-10">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-secondary to-slate-800 flex items-center justify-center relative shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-[900] text-secondary mb-4 tracking-tighter uppercase">Frequência Digital</h2>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
              Bem-vindo ao portal oficial do PROCON MA. Acesse agora o terminal seguro para registrar sua jornada.
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-full shadow-lg shadow-primary/25 group transition-all">
              <Link to="/registro-ponto" className="flex items-center gap-2">
                Abrir Kiosk de Registro
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Dashboard;
