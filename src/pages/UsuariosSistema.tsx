import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveTable, MobileCardList, MobileCard, MobileCardHeader, MobileCardRow, MobileCardActions,
} from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { useUsuariosSistema } from "@/hooks/useUsuariosSistema";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Plus, Loader2, Users, Shield, ShieldCheck, User, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { SistemaUser } from "@/domain/usuarios/UsuarioService";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const deleteSchema = z.object({
  justification: z.string().min(20, "A justificativa deve ter no mínimo 20 caracteres."),
});

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador (RH)",
  gestor: "Gestor",
  user: "Colaborador",
};

const roleBadgeVariant = (role: string | null) => {
  switch (role) {
    case "super_admin": return "destructive" as const;
    case "admin": return "default" as const;
    case "gestor": return "secondary" as const;
    default: return "outline" as const;
  }
};

const RoleIcon = ({ role }: { role: string | null }) => {
  switch (role) {
    case "super_admin": return <ShieldCheck className="h-4 w-4" />;
    case "admin": return <Shield className="h-4 w-4" />;
    case "gestor": return <User className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const UsuariosSistema = () => {
  const { data: users = [], isLoading } = useUsuariosSistema();
  const { data: isSeparateEnabled } = useFeatureFlag("separate_user_colaborador");
  const deleteMutation = useDeleteUser();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SistemaUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nome: "", email: "", password: "", role: "admin", departamento: "",
  });

  const deleteForm = useForm<{ justification: string }>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { justification: "" },
  });

  const createUser = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const { data: result, error } = await supabase.functions.invoke("create-user", { body: data });
      if (error) throw new Error(error.message || "Erro ao criar usuário");
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["sistema-users"] });
      setIsCreateOpen(false);
      setCreateForm({ nome: "", email: "", password: "", role: "admin", departamento: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (data: { justification: string }) => {
    if (!userToDelete) return;
    deleteMutation.mutate({ 
      userId: userToDelete.user_id, 
      justification: data.justification 
    }, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setUserToDelete(null);
        deleteForm.reset();
      }
    });
  };

  // Se a flag estiver ativa, filtramos apenas os usuários com permissão de dashboard
  const displayUsers = isSeparateEnabled 
    ? users.filter(u => ["super_admin", "admin", "gestor"].includes(u.role || ""))
    : users;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (displayUsers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum administrador encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isSeparateEnabled ? "Apenas usuários com papéis administrativos são exibidos aqui." : ""}
          </p>
        </div>
      );
    }

    return (
      <>
        <MobileCardList>
          {displayUsers.map((u) => (
            <MobileCard key={u.id}>
              <MobileCardHeader
                title={u.nome_completo || "Sem nome"}
                subtitle={u.email || ""}
                badge={
                  <Badge variant={roleBadgeVariant(u.role)} className="gap-1 text-xs">
                    <RoleIcon role={u.role} />
                    {roleLabels[u.role || ""] || "Sem papel"}
                  </Badge>
                }
              />
              <MobileCardRow label="Criado em" value={new Date(u.created_at).toLocaleDateString("pt-BR")} />
              <MobileCardActions>
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                {u.role !== "super_admin" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      setUserToDelete(u);
                      setIsDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                )}
              </MobileCardActions>
            </MobileCard>
          ))}
        </MobileCardList>

        <ResponsiveTable>
          <ShadcnTable>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">
                    {u.nome_completo || "Sem nome"}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(u.role)} className="gap-1 min-w-[120px]">
                      <RoleIcon role={u.role} />
                      {roleLabels[u.role || ""] || "Sem papel"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {u.role !== "super_admin" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setUserToDelete(u);
                            setIsDeleteOpen(true);
                          }}
                          title="Excluir Usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ShadcnTable>
        </ResponsiveTable>
      </>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isSeparateEnabled ? "Usuários do Sistema" : "Gerenciamento de Usuários"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Controle de acesso ao painel administrativo e níveis hierárquicos.
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#C51B29] hover:bg-[#A01622] text-white">
                <Plus className="h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4">
              <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(createForm); }}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    O usuário receberá os dados por e-mail e terá acesso ao painel.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={createForm.nome} 
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input 
                      type="email" 
                      value={createForm.email} 
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input 
                      type="password" 
                      value={createForm.password} 
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} 
                      required 
                      minLength={6} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel *</Label>
                    <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador (RH)</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        {!isSeparateEnabled && <SelectItem value="user">Colaborador</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createUser.isPending} className="bg-[#C51B29] hover:bg-[#A01622] text-white">
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal de Exclusão com Justificativa */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão Segura
              </DialogTitle>
              <DialogDescription>
                Esta ação irá marcar o perfil de <strong>{userToDelete?.nome_completo}</strong> como deletado e remover permanentemente seu acesso ao sistema (Supabase Auth).
              </DialogDescription>
            </DialogHeader>

            <Form {...deleteForm}>
              <form onSubmit={deleteForm.handleSubmit(handleDelete)} className="space-y-4 py-2">
                <FormField
                  control={deleteForm.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa da Exclusão (mín. 20 caracteres)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Usuário desligado da empresa conforme solicitação do RH em 01/04..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground space-y-1">
                  <p>• O rastro desta ação será gravado nos logs de auditoria.</p>
                  <p>• Os registros de ponto vinculados não serão afetados.</p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDeleteOpen(false)}
                    className="w-full sm:flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    className="w-full sm:flex-1"
                  >
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Exclusão
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default UsuariosSistema;
