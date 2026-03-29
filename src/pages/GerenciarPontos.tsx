import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useRegistrosPonto, useDeleteRegistroPonto } from "@/hooks/useRegistrosPonto";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useLotacoes } from "@/hooks/useLotacoes";
import { exportarFolhaPontoExcel } from "@/lib/exportExcel";
import { exportToPDF } from "@/lib/exportPDF";
import { Loader2, Trash2, Clock, Sheet, FileText, Download } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { agruparRegistrosPorColaborador, calcHorasTrabalhadas, ColaboradorAgrupado } from "@/utils/calculadorasPontos";

export default function GerenciarPontosPage() {
  const [filtros, setFiltros] = useState({
    orgaoId: "all",
    lotacaoId: "all",
    dataInicio: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    dataFim: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    busca: "",
  });

  const { data: orgaos = [] } = useOrgaos();
  const { data: lotacoes = [] } = useLotacoes();
  const excluirRegistro = useDeleteRegistroPonto();

  const { data: registros = [], isLoading } = useRegistrosPonto({
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
    orgaoId: filtros.orgaoId !== "all" ? filtros.orgaoId : undefined,
    lotacaoId: filtros.lotacaoId !== "all" ? filtros.lotacaoId : undefined,
  });

  const lotacoesFiltradas = filtros.orgaoId !== "all"
    ? lotacoes.filter(l => l.orgao_id === filtros.orgaoId)
    : lotacoes;

  // Lógica abstraída para o utilitário calculadorasPontos.ts
  const resumoDados = useMemo(() => {
    return agruparRegistrosPorColaborador(registros, filtros.busca);
  }, [registros, filtros.busca]);

  const gerarExcelUser = (user: ColaboradorAgrupado) => {
    exportarFolhaPontoExcel({
      nome: user.nome,
      matricula: user.matricula,
      cargo: user.cargo,
      unidade_trabalho_nome: user.unidade_trabalho_nome,
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      registros: user.registros,
    });
  };

  const gerarPDFUser = (user: ColaboradorAgrupado) => {
    exportToPDF(
      [user],
      `${format(parseISO(filtros.dataInicio), "dd/MM/yyyy")} a ${format(parseISO(filtros.dataFim), "dd/MM/yyyy")}`
    );
  };

  const gerarPDFGeral = () => {
    exportToPDF(
      resumoDados,
      `${format(parseISO(filtros.dataInicio), "dd/MM/yyyy")} a ${format(parseISO(filtros.dataFim), "dd/MM/yyyy")}`
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Pontos</h1>
            <p className="text-sm text-muted-foreground">Analise os registros e gere planilhas de frequência</p>
          </div>
          <Button onClick={gerarPDFGeral} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 transition-colors">
            <Download className="w-4 h-4 text-primary" /> Relatório Geral (PDF)
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Filtros Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1 space-y-1">
              <Label className="text-xs">Colaborador ou Matrícula</Label>
              <Input
                placeholder="Buscar..."
                value={filtros.busca}
                onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mês/Data Inicial</Label>
              <Input type="date" value={filtros.dataInicio} onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mês/Data Final</Label>
              <Input type="date" value={filtros.dataFim} onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Órgão</Label>
              <Select value={filtros.orgaoId} onValueChange={v => setFiltros(f => ({ ...f, orgaoId: v, lotacaoId: "all" }))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {orgaos.map(o => <SelectItem key={o.id} value={o.id}>{o.sigla || o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lotação</Label>
              <Select value={filtros.lotacaoId} onValueChange={v => setFiltros(f => ({ ...f, lotacaoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {lotacoesFiltradas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : resumoDados.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card text-muted-foreground">Nenhum dado no período selecionado.</div>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Lotação / Cargo</TableHead>
                  <TableHead className="text-center">Total Horas</TableHead>
                  <TableHead className="text-center">Baterias de Ponto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoDados.map((user: ColaboradorAgrupado) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-semibold text-sm">{user.nome}</p>
                      <p className="text-xs text-muted-foreground">Matrícula: {user.matricula}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.unidade_trabalho_nome}</p>
                      <p className="text-xs text-muted-foreground">{user.cargo}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {calcHorasTrabalhadas(user.registros)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">{user.registros.length} registros</span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => gerarExcelUser(user)} className="gap-2" title="Gerar Folha de Frequência (Excel)">
                        <Sheet className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => gerarPDFUser(user)} className="gap-2" title="Relatório Individual (PDF)">
                        <FileText className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => user.registros.forEach((r: any) => excluirRegistro.mutate(r.id))} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Deletar Registros do Período">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
