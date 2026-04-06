import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useFrequenciaMensal } from "@/hooks/useFrequenciaMensal";
import { useAbonos } from "@/hooks/useAbonos";
import { useJustificativas } from "@/hooks/useJustificativas";
import { useFerias } from "@/hooks/useFerias";
import { Loader2, ArrowLeft, User, Clock, FileText, Calendar, CheckCircle } from "lucide-react";
import { format, parseISO, differenceInMinutes, startOfMonth } from "date-fns";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { RegistroPonto } from "@/domain/ponto/entities/RegistroPonto";

const tipoFeriasLabels: Record<string, string> = {
  ferias_anuais: "Férias Anuais",
  ferias_premio: "Férias Prêmio",
  licenca: "Licença",
  recesso: "Recesso",
};

const DossieColaboradorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: colaboradores = [] } = useColaboradores();
  const colaborador = colaboradores.find((c) => c.id === id);

  const { data: registros = [], isLoading: loadingReg } = useRegistrosPonto({ colaboradorId: id });
  const { data: abonos = [], isLoading: loadingAbonos } = useAbonos(id);
  const { data: justificativas = [], isLoading: loadingJusts } = useJustificativas(id);
  const { data: ferias = [], isLoading: loadingFerias } = useFerias(id);

  // Frequência mensal pré-computada via materialized view
  const mesAtual = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const { data: frequenciaMensal = [] } = useFrequenciaMensal({ colaboradorId: id, mesRef: mesAtual });
  const freqMes = frequenciaMensal[0]; // Resumo do mês atual

  // Audit logs for this collaborator
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["audit-logs-dossie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Logs mudam lentamente
  });

  const calcHoras = (regs: RegistroPonto[]) => {
    const sorted = [...regs].sort((a, b) => a.timestamp_registro.getTime() - b.timestamp_registro.getTime());
    let total = 0;
    for (let i = 0; i < sorted.length - 1; i += 2) {
      if (sorted[i].tipo === "entrada" && sorted[i + 1]?.tipo === "saida") {
        total += differenceInMinutes(sorted[i + 1].timestamp_registro, sorted[i].timestamp_registro);
      }
    }
    return `${Math.floor(total / 60)}h${(total % 60).toString().padStart(2, "0")}m`;
  };

  // Group registros by date
  const registrosByDate = useMemo(() => {
    const map = new Map<string, RegistroPonto[]>();
    registros.forEach((r) => {
      const key = format(r.timestamp_registro, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [registros]);

  const isLoading = loadingReg || loadingAbonos || loadingJusts || loadingFerias || loadingLogs;

  if (!colaborador && !isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Colaborador não encontrado.</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dossiê do Colaborador</h1>
            {colaborador && (
              <p className="text-sm text-muted-foreground">{colaborador.nome_completo} — {colaborador.matricula}</p>
            )}
          </div>
        </div>

        {/* Info Card */}
        {colaborador && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium text-sm">{colaborador.nome_completo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Matrícula</p>
                  <p className="font-medium text-sm">{colaborador.matricula}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cargo</p>
                  <p className="font-medium text-sm">{colaborador.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={colaborador.ativo ? "default" : "secondary"}>
                    {colaborador.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Frequência Mensal (MV) */}
        {freqMes && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-[#0B132B]">{freqMes.dias_trabalhados}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Dias Trabalhados</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-green-700">{freqMes.total_entradas}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Entradas no Mês</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-orange-600">{freqMes.total_saidas}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Saídas no Mês</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="ponto" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ponto" className="gap-1 text-xs sm:text-sm">
                <Clock className="h-3 w-3 hidden sm:inline" /> Ponto ({registros.length})
              </TabsTrigger>
              <TabsTrigger value="abonos" className="gap-1 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 hidden sm:inline" /> Abonos ({abonos.length})
              </TabsTrigger>
              <TabsTrigger value="justificativas" className="gap-1 text-xs sm:text-sm">
                <FileText className="h-3 w-3 hidden sm:inline" /> Justif. ({justificativas.length})
              </TabsTrigger>
              <TabsTrigger value="ferias" className="gap-1 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 hidden sm:inline" /> Férias ({ferias.length})
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1 text-xs sm:text-sm">
                <User className="h-3 w-3 hidden sm:inline" /> Logs ({logs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ponto">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Horas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosByDate.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem registros</TableCell></TableRow>
                      ) : registrosByDate.map(([data, regs]) => (
                        <TableRow key={data}>
                          <TableCell>{format(parseISO(data), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {regs.sort((a, b) => a.timestamp_registro.getTime() - b.timestamp_registro.getTime()).map((r) => (
                                <span key={r.id} className={`text-xs px-1.5 py-0.5 rounded ${r.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                                  {r.hora_registro?.substring(0, 5)} ({r.tipo === "entrada" ? "E" : "S"})
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{calcHoras(regs)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="abonos">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Registrado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abonos.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem abonos</TableCell></TableRow>
                      ) : abonos.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{format(parseISO(a.data_abono), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{a.motivo}</TableCell>
                          <TableCell>{format(parseISO(a.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="justificativas">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Falta</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Anexo</TableHead>
                        <TableHead>Registrado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {justificativas.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem justificativas</TableCell></TableRow>
                      ) : justificativas.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell>{format(parseISO(j.data_falta), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{j.descricao}</TableCell>
                          <TableCell>
                            {j.anexo_url ? (
                              <a href={j.anexo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                {j.anexo_nome || "Anexo"}
                              </a>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{format(parseISO(j.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="ferias">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead>Registrado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ferias.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem férias</TableCell></TableRow>
                      ) : ferias.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>{format(parseISO(f.data_inicio), "dd/MM/yyyy")} — {format(parseISO(f.data_fim), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{tipoFeriasLabels[f.tipo] || f.tipo}</TableCell>
                          <TableCell>{f.observacao || "-"}</TableCell>
                          <TableCell>{format(parseISO(f.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ação</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem logs</TableCell></TableRow>
                      ) : logs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{l.action_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{l.user_email || "-"}</TableCell>
                          <TableCell>{format(parseISO(l.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {l.details ? JSON.stringify(l.details) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default DossieColaboradorPage;
