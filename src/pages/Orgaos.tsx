import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useOrgaos, useCreateOrgao, useUpdateOrgao, useDeleteOrgao } from "@/hooks/useOrgaos";
import { Orgao } from "@/types/database";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";

const OrgaosPage = () => {
  const { data: orgaos = [], isLoading } = useOrgaos();
  const createOrgao = useCreateOrgao();
  const updateOrgao = useUpdateOrgao();
  const deleteOrgao = useDeleteOrgao();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrgao, setEditingOrgao] = useState<Orgao | null>(null);
  const [formData, setFormData] = useState({ nome: "", sigla: "" });

  const resetForm = () => {
    setFormData({ nome: "", sigla: "" });
    setEditingOrgao(null);
  };

  const handleOpenDialog = (orgao?: Orgao) => {
    if (orgao) {
      setEditingOrgao(orgao);
      setFormData({ nome: orgao.nome, sigla: orgao.sigla || "" });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingOrgao) {
      await updateOrgao.mutateAsync({ id: editingOrgao.id, ...formData });
    } else {
      await createOrgao.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteOrgao.mutateAsync(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Órgãos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os órgãos e unidades administrativas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Órgão
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingOrgao ? "Editar Órgão" : "Novo Órgão"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrgao
                      ? "Atualize as informações do órgão"
                      : "Preencha os dados para cadastrar um novo órgão"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Órgão *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Secretaria de Educação"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) =>
                        setFormData({ ...formData, sigla: e.target.value })
                      }
                      placeholder="Ex: SEDUC"
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
                    disabled={createOrgao.isPending || updateOrgao.isPending}
                    className="w-full sm:w-auto"
                  >
                    {(createOrgao.isPending || updateOrgao.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingOrgao ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orgaos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhum órgão cadastrado
            </h3>
            <p className="text-muted-foreground mt-1">
              Comece cadastrando seu primeiro órgão
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <MobileCardList>
              {orgaos.map((orgao) => (
                <MobileCard key={orgao.id}>
                  <MobileCardHeader
                    title={orgao.nome}
                    subtitle={orgao.sigla || undefined}
                  />
                  <MobileCardActions>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(orgao)}
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
                            Tem certeza que deseja excluir o órgão "{orgao.nome}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(orgao.id)}
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
                    <TableHead>Sigla</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgaos.map((orgao) => (
                    <TableRow key={orgao.id}>
                      <TableCell className="font-medium">{orgao.nome}</TableCell>
                      <TableCell>{orgao.sigla || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(orgao)}
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
                                  Tem certeza que deseja excluir o órgão "
                                  {orgao.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(orgao.id)}
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

export default OrgaosPage;
