import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useAbonos, useCreateAbono } from "@/hooks/useAbonos";
import { useJustificativas, useCreateJustificativa } from "@/hooks/useJustificativas";
import { useFerias, useCreateFerias } from "@/hooks/useFerias";
import { Loader2, Plus, FileText, Calendar, CheckCircle, Upload, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const tipoFeriasLabels: Record<string, string> = {
  ferias_anuais: "Férias Anuais",
  ferias_premio: "Férias Prêmio",
  licenca: "Licença",
  recesso: "Recesso",
};

const GestaoRHPage = () => {
  const navigate = useNavigate();
  const { data: colaboradores = [], isLoading: loadingColabs } = useColaboradores();
  const { data: abonos = [], isLoading: loadingAbonos } = useAbonos();
  const { data: justificativas = [], isLoading: loadingJusts } = useJustificativas();
  const { data: ferias = [], isLoading: loadingFerias } = useFerias();

  const createAbono = useCreateAbono();
  const createJustificativa = useCreateJustificativa();
  const createFerias = useCreateFerias();

  // Abono dialog
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [abonoForm, setAbonoForm] = useState({ colaborador_id: "", data_abono: "", motivo: "" });

  // Justificativa dialog
  const [justOpen, setJustOpen] = useState(false);
  const [justForm, setJustForm] = useState({ colaborador_id: "", data_falta: "", descricao: "" });
  const [justFile, setJustFile] = useState<File | null>(null);

  // Ferias dialog
  const [feriasOpen, setFeriasOpen] = useState(false);
  const [feriasForm, setFeriasForm] = useState<{ colaborador_id: string; data_inicio: string; data_fim: string; tipo: "ferias_anuais" | "ferias_premio" | "licenca" | "recesso"; observacao: string }>({ colaborador_id: "", data_inicio: "", data_fim: "", tipo: "ferias_anuais", observacao: "" });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredColabs = colaboradores.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.nome_completo.toLowerCase().includes(s) || c.matricula.toLowerCase().includes(s);
  });

  const handleSubmitAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAbono.mutateAsync(abonoForm);
    setAbonoOpen(false);
    setAbonoForm({ colaborador_id: "", data_abono: "", motivo: "" });
  };

  const handleSubmitJust = async (e: React.FormEvent) => {
    e.preventDefault();
    await createJustificativa.mutateAsync({ ...justForm, file: justFile || undefined });
    setJustOpen(false);
    setJustForm({ colaborador_id: "", data_falta: "", descricao: "" });
    setJustFile(null);
  };

  const handleSubmitFerias = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFerias.mutateAsync(feriasForm);
    setFeriasOpen(false);
    setFeriasForm({ colaborador_id: "", data_inicio: "", data_fim: "", tipo: "ferias_anuais", observacao: "" });
  };

  const ColabSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
      <SelectContent>
        {filteredColabs.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.nome_completo} ({c.matricula})</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const isLoading = loadingColabs || loadingAbonos || loadingJusts || loadingFerias;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestão de RH</h1>
            <p className="text-sm text-muted-foreground">Abonos, justificativas e férias dos colaboradores</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setAbonoOpen(true)} className="gap-2" size="sm">
              <CheckCircle className="h-4 w-4" /> Abonar Falta
            </Button>
            <Button onClick={() => setJustOpen(true)} className="gap-2" variant="outline" size="sm">
              <FileText className="h-4 w-4" /> Justificativa
            </Button>
            <Button onClick={() => setFeriasOpen(true)} className="gap-2" variant="outline" size="sm">
              <Calendar className="h-4 w-4" /> Conceder Férias
            </Button>
          </div>
        </div>

        <div className="max-w-sm">
          <Input
            placeholder="Buscar colaborador (nome ou matrícula)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="abonos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abonos">Abonos ({abonos.length})</TabsTrigger>
              <TabsTrigger value="justificativas">Justificativas ({justificativas.length})</TabsTrigger>
              <TabsTrigger value="ferias">Férias ({ferias.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="abonos">
              <Card>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Data do Abono</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Data Registro</TableHead>
                        <TableHead>Dossiê</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abonos.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum abono registrado</TableCell></TableRow>
                      ) : abonos.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.colaborador?.nome_completo}</TableCell>
                          <TableCell>{a.colaborador?.matricula}</TableCell>
                          <TableCell>{format(parseISO(a.data_abono), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{a.motivo}</TableCell>
                          <TableCell>{format(parseISO(a.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/dossie/${a.colaborador_id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
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
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Data da Falta</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Anexo</TableHead>
                        <TableHead>Data Registro</TableHead>
                        <TableHead>Dossiê</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {justificativas.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma justificativa registrada</TableCell></TableRow>
                      ) : justificativas.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell className="font-medium">{j.colaborador?.nome_completo}</TableCell>
                          <TableCell>{j.colaborador?.matricula}</TableCell>
                          <TableCell>{format(parseISO(j.data_falta), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{j.descricao}</TableCell>
                          <TableCell>
                            {j.anexo_url ? (
                              <a href={j.anexo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {j.anexo_nome || "Anexo"}
                              </a>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{format(parseISO(j.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/dossie/${j.colaborador_id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
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
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead>Data Registro</TableHead>
                        <TableHead>Dossiê</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ferias.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum registro de férias</TableCell></TableRow>
                      ) : ferias.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.colaborador?.nome_completo}</TableCell>
                          <TableCell>{f.colaborador?.matricula}</TableCell>
                          <TableCell>{format(parseISO(f.data_inicio), "dd/MM/yyyy")} — {format(parseISO(f.data_fim), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{tipoFeriasLabels[f.tipo] || f.tipo}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{f.observacao || "-"}</TableCell>
                          <TableCell>{format(parseISO(f.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/dossie/${f.colaborador_id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {/* Abono Dialog */}
        <Dialog open={abonoOpen} onOpenChange={setAbonoOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitAbono}>
              <DialogHeader><DialogTitle>Abonar Falta</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador *</Label>
                  <ColabSelect value={abonoForm.colaborador_id} onChange={(v) => setAbonoForm({ ...abonoForm, colaborador_id: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Data do Abono *</Label>
                  <Input type="date" value={abonoForm.data_abono} onChange={(e) => setAbonoForm({ ...abonoForm, data_abono: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Textarea value={abonoForm.motivo} onChange={(e) => setAbonoForm({ ...abonoForm, motivo: e.target.value })} placeholder="Descreva o motivo do abono" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAbonoOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createAbono.isPending || !abonoForm.colaborador_id}>
                  {createAbono.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Justificativa Dialog */}
        <Dialog open={justOpen} onOpenChange={setJustOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitJust}>
              <DialogHeader><DialogTitle>Registrar Justificativa</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador *</Label>
                  <ColabSelect value={justForm.colaborador_id} onChange={(v) => setJustForm({ ...justForm, colaborador_id: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Data da Falta *</Label>
                  <Input type="date" value={justForm.data_falta} onChange={(e) => setJustForm({ ...justForm, data_falta: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Textarea value={justForm.descricao} onChange={(e) => setJustForm({ ...justForm, descricao: e.target.value })} placeholder="Descreva a justificativa" required />
                </div>
                <div className="space-y-2">
                  <Label>Anexo (PDF, imagem)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setJustFile(e.target.files?.[0] || null)} />
                    {justFile && <Upload className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setJustOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createJustificativa.isPending || !justForm.colaborador_id}>
                  {createJustificativa.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Férias Dialog */}
        <Dialog open={feriasOpen} onOpenChange={setFeriasOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitFerias}>
              <DialogHeader><DialogTitle>Conceder Férias</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador *</Label>
                  <ColabSelect value={feriasForm.colaborador_id} onChange={(v) => setFeriasForm({ ...feriasForm, colaborador_id: v })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início *</Label>
                    <Input type="date" value={feriasForm.data_inicio} onChange={(e) => setFeriasForm({ ...feriasForm, data_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim *</Label>
                    <Input type="date" value={feriasForm.data_fim} onChange={(e) => setFeriasForm({ ...feriasForm, data_fim: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={feriasForm.tipo} onValueChange={(v) => setFeriasForm({ ...feriasForm, tipo: v as "ferias_anuais" | "ferias_premio" | "licenca" | "recesso" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ferias_anuais">Férias Anuais</SelectItem>
                      <SelectItem value="ferias_premio">Férias Prêmio</SelectItem>
                      <SelectItem value="licenca">Licença</SelectItem>
                      <SelectItem value="recesso">Recesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea value={feriasForm.observacao} onChange={(e) => setFeriasForm({ ...feriasForm, observacao: e.target.value })} placeholder="Observações (opcional)" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFeriasOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createFerias.isPending || !feriasForm.colaborador_id}>
                  {createFerias.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default GestaoRHPage;
