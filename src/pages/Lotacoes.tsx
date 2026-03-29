import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ResponsiveTable,
  MobileCardList,
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  MobileCardActions,
} from "@/components/ui/responsive-table";
import { useLotacoes, useCreateLotacao, useUpdateLotacao, useDeleteLotacao } from "@/hooks/useLotacoes";
import { useOrgaos } from "@/hooks/useOrgaos";
import { Lotacao } from "@/types/database";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";

const LotacoesPage = () => {
  const { data: lotacoes = [], isLoading } = useLotacoes();
  const { data: orgaos = [] } = useOrgaos();
  const createLotacao = useCreateLotacao();
  const updateLotacao = useUpdateLotacao();
  const deleteLotacao = useDeleteLotacao();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLotacao, setEditingLotacao] = useState<Lotacao | null>(null);
  const [formData, setFormData] = useState({ nome: "", orgao_id: "" });

  const resetForm = () => {
    setFormData({ nome: "", orgao_id: "" });
    setEditingLotacao(null);
  };

  const handleOpenDialog = (lotacao?: Lotacao) => {
    if (lotacao) {
      setEditingLotacao(lotacao);
      setFormData({ nome: lotacao.nome, orgao_id: lotacao.orgao_id });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLotacao) {
      await updateLotacao.mutateAsync({ id: editingLotacao.id, ...formData });
    } else {
      await createLotacao.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteLotacao.mutateAsync(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Lotações</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os locais de trabalho dos colaboradores
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Nova Lotação
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingLotacao ? "Editar Lotação" : "Nova Lotação"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLotacao
                      ? "Atualize as informações da lotação"
                      : "Preencha os dados para cadastrar uma nova lotação"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgao_id">Órgão *</Label>
                    <Select
                      value={formData.orgao_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, orgao_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o órgão" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgaos.map((orgao) => (
                          <SelectItem key={orgao.id} value={orgao.id}>
                            {orgao.sigla ? `${orgao.sigla} - ${orgao.nome}` : orgao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Lotação *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Escola Municipal João da Silva"
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLotacao.isPending || updateLotacao.isPending || !formData.orgao_id}
                    className="w-full sm:w-auto"
                  >
                    {(createLotacao.isPending || updateLotacao.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingLotacao ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {orgaos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Cadastre um órgão primeiro
            </h3>
            <p className="text-muted-foreground mt-1">
              Para criar lotações, você precisa ter pelo menos um órgão cadastrado
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lotacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhuma lotação cadastrada
            </h3>
            <p className="text-muted-foreground mt-1">
              Comece cadastrando sua primeira lotação
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <MobileCardList>
              {lotacoes.map((lotacao) => (
                <MobileCard key={lotacao.id}>
                  <MobileCardHeader
                    title={lotacao.nome}
                    subtitle={lotacao.orgao?.sigla || lotacao.orgao?.nome}
                  />
                  <MobileCardActions>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(lotacao)}
                      className="flex-1 gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a lotação "{lotacao.nome}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(lotacao.id)}
                            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </MobileCardActions>
                </MobileCard>
              ))}
            </MobileCardList>

            {/* Desktop Table Layout */}
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Órgão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotacoes.map((lotacao) => (
                    <TableRow key={lotacao.id}>
                      <TableCell className="font-medium">{lotacao.nome}</TableCell>
                      <TableCell>
                        {lotacao.orgao?.sigla
                          ? `${lotacao.orgao.sigla} - ${lotacao.orgao.nome}`
                          : lotacao.orgao?.nome || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(lotacao)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a lotação "
                                  {lotacao.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(lotacao.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default LotacoesPage;
