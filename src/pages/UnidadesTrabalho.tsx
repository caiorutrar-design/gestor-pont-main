import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  useUnidadesTrabalho, useCreateUnidadeTrabalho, useUpdateUnidadeTrabalho, useDeleteUnidadeTrabalho,
  UnidadeTrabalho, UnidadeTrabalhoForm,
} from "@/hooks/useUnidadesTrabalho";
import { useOrgaos } from "@/hooks/useOrgaos";
import { Plus, Pencil, Trash2, MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";

const initialForm: UnidadeTrabalhoForm = {
  nome: "", latitude: 0, longitude: 0, raio_metros: 200, orgao_id: "", ativo: true,
};

const UnidadesTrabalhoPage = () => {
  const { data: unidades = [], isLoading } = useUnidadesTrabalho();
  const { data: orgaos = [] } = useOrgaos();
  const createUnidade = useCreateUnidadeTrabalho();
  const updateUnidade = useUpdateUnidadeTrabalho();
  const deleteUnidade = useDeleteUnidadeTrabalho();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadeTrabalho | null>(null);
  const [form, setForm] = useState<UnidadeTrabalhoForm>(initialForm);

  const handleOpen = (u?: UnidadeTrabalho) => {
    if (u) {
      setEditing(u);
      setForm({ nome: u.nome, latitude: u.latitude, longitude: u.longitude, raio_metros: u.raio_metros, orgao_id: u.orgao_id, ativo: u.ativo });
    } else {
      setEditing(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: Number(pos.coords.latitude.toFixed(7)), longitude: Number(pos.coords.longitude.toFixed(7)) }));
        toast.success("Localização capturada!");
      },
      () => toast.error("Não foi possível obter a localização."),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateUnidade.mutateAsync({ id: editing.id, ...form });
    } else {
      await createUnidade.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Unidades de Trabalho</h1>
            <p className="text-sm text-muted-foreground">Gerencie os locais de trabalho para validação de geolocalização</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpen()} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg mx-4">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
                  <DialogDescription>Defina nome, coordenadas e raio de tolerância</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder='Ex: "Sede São Luís"' required />
                  </div>
                  <div className="space-y-2">
                    <Label>Órgão *</Label>
                    <Select value={form.orgao_id} onValueChange={(v) => setForm({ ...form, orgao_id: v })} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {orgaos.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.sigla ? `${o.sigla} - ${o.nome}` : o.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Latitude *</Label>
                      <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude *</Label>
                      <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} required />
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} className="gap-2">
                    <Navigation className="h-4 w-4" /> Usar minha localização atual
                  </Button>
                  <div className="space-y-2">
                    <Label>Raio de tolerância (metros) *</Label>
                    <Input type="number" min={50} max={5000} value={form.raio_metros} onChange={(e) => setForm({ ...form, raio_metros: Number(e.target.value) })} required />
                    <p className="text-xs text-muted-foreground">Distância máxima permitida do ponto central (recomendado: 100-500m)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={form.ativo} onCheckedChange={(c) => setForm({ ...form, ativo: c })} />
                    <Label>Unidade ativa</Label>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createUnidade.isPending || updateUnidade.isPending || !form.orgao_id}>
                    {(createUnidade.isPending || updateUnidade.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editing ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : unidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma unidade cadastrada</h3>
            <p className="text-muted-foreground mt-1">Cadastre unidades para ativar a validação por geolocalização</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unidades.map((u) => (
              <Card key={u.id} className={!u.ativo ? "opacity-60" : ""}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{u.nome}</h3>
                      <p className="text-xs text-muted-foreground">{u.orgao?.sigla || u.orgao?.nome}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(u)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover unidade?</AlertDialogTitle>
                            <AlertDialogDescription>Colaboradores vinculados perderão a referência.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUnidade.mutate(u.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📍 {u.latitude.toFixed(6)}, {u.longitude.toFixed(6)}</p>
                    <p>📏 Raio: {u.raio_metros}m</p>
                  </div>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${u.ativo ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    {u.ativo ? "Ativa" : "Inativa"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UnidadesTrabalhoPage;
