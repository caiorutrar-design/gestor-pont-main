import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  Filter, Calendar as CalendarIcon, Download, 
  FileSpreadsheet, FileText, BarChart3, Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useUnidadesTrabalho } from "@/hooks/useUnidadesTrabalho";
import { exportToPDF, exportToExcel } from "@/utils/reportExportUtils";
import { cn } from "@/lib/utils";

const COLORS = ['#C51B29', '#0B132B', '#3A506B', '#5BC0BE', '#6FFFE9'];

const Relatorios = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [selectedOrgaoId, setSelectedOrgaoId] = useState<string>("all");
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>("all");

  const { data: orgaos = [] } = useOrgaos();
  const { data: unidades = [] } = useUnidadesTrabalho(selectedOrgaoId !== "all" ? selectedOrgaoId : "");

  const { data: registros = [], isLoading } = useRegistrosPonto({
    dataInicio: format(dateRange.from, "yyyy-MM-dd"),
    dataFim: format(dateRange.to, "yyyy-MM-dd"),
    orgaoId: selectedOrgaoId !== "all" ? selectedOrgaoId : undefined,
  });

  // Filtro local adicional para Unidade (se o hook não suportar filtro direto por unidade)
  const registrosFiltrados = useMemo(() => {
    if (selectedUnidadeId === "all") return registros;
    return registros.filter(r => r.unidade_trabalho_id === selectedUnidadeId);
  }, [registros, selectedUnidadeId]);

  // Estatísticas para Gráficos
  const chartDataDiario = useMemo(() => {
    const daily: Record<string, number> = {};
    registrosFiltrados.forEach(r => {
      const day = format(new Date(r.timestamp_registro), "dd/MM");
      daily[day] = (daily[day] || 0) + 1;
    });
    return Object.entries(daily).map(([name, total]) => ({ name, total }));
  }, [registrosFiltrados]);

  const chartDataTipos = useMemo(() => {
    const tipos: Record<string, number> = { entrada: 0, saida: 0 };
    registrosFiltrados.forEach(r => {
      if (r.tipo === 'entrada' || r.tipo === 'saida') {
        tipos[r.tipo]++;
      }
    });
    return [
      { name: 'Entradas', value: tipos.entrada },
      { name: 'Saídas', value: tipos.saida },
    ];
  }, [registrosFiltrados]);

  const handleExportPDF = () => {
    const columns = ["Data", "Hora", "Tipo", "Colaborador", "Matrícula"];
    const rows = registrosFiltrados.map(r => [
      format(new Date(r.timestamp_registro), "dd/MM/yyyy"),
      r.hora_registro?.substring(0, 5) || format(new Date(r.timestamp_registro), "HH:mm"),
      r.tipo.toUpperCase(),
      r.colaborador?.nome_completo || "N/A",
      r.colaborador?.matricula || "N/A",
    ]);
    exportToPDF({ 
      columns, 
      rows, 
      fileName: 'relatorio_pontos', 
      title: 'Relatório Consolidado de Registros de Ponto' 
    });
  };

  const handleExportExcel = () => {
    const columns = ["Data", "Hora", "Tipo", "Colaborador", "Matrícula", "Órgão"];
    const rows = registrosFiltrados.map(r => [
      format(new Date(r.timestamp_registro), "dd/MM/yyyy"),
      r.hora_registro || format(new Date(r.timestamp_registro), "HH:mm"),
      r.tipo,
      r.colaborador?.nome_completo || "N/A",
      r.colaborador?.matricula || "N/A",
      r.orgao?.nome || "N/A",
    ]);
    exportToExcel({ 
      columns, 
      rows, 
      fileName: 'relatorio_pontos', 
      title: 'Relatório Completo de Batidas' 
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios Premium</h1>
          <p className="text-slate-500">Análise de assiduidade e exportação de dados.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <FileText className="h-4 w-4 text-primary" /> PDF
          </Button>
          <Button onClick={handleExportExcel} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Período</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    <span>Selecionar datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => range?.from && range?.to && setDateRange(range)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Órgão</label>
            <Select value={selectedOrgaoId} onValueChange={setSelectedOrgaoId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos os órgãos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os órgãos</SelectItem>
                {orgaos.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Unidade</label>
            <Select value={selectedUnidadeId} onValueChange={setSelectedUnidadeId} disabled={selectedOrgaoId === "all"}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="secondary" className="gap-2">
            <Filter className="h-4 w-4" /> Aplicar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md border-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Volume de Batidas por Dia
            </CardTitle>
            <CardDescription>Visualização da atividade diária no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataDiario}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" fill="#C51B29" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Mix de Registros</CardTitle>
            <CardDescription>Proporção entre Entradas e Saídas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-48 w-48 rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataTipos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartDataTipos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Numérico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Database, label: 'Total de Registros', value: registrosFiltrados.length, color: 'text-primary' },
          { icon: Filter, label: 'Méd. Diária', value: (registrosFiltrados.length / chartDataDiario.length || 0).toFixed(1), color: 'text-slate-600' },
          { icon: Download, label: 'Exportações PDF', value: 'Disponível', color: 'text-slate-600' },
          { icon: FileSpreadsheet, label: 'Exportações Excel', value: 'Disponível', color: 'text-slate-600' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2 rounded-full bg-slate-100", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
