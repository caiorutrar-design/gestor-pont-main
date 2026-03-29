import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveTable, MobileCardList, MobileCard, MobileCardHeader, MobileCardRow, MobileCardActions,
} from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Users, Shield, ShieldCheck, User, Pencil, Eye, LayoutGrid } from "lucide-react";
import { useUnidadesTrabalho } from "@/hooks/useUnidadesTrabalho";
import { useGestorUnidades, useUpdateGestorUnidades } from "@/hooks/useGestorUnidades";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  nome_completo: string | null;
  role: string | null;
  created_at: string;
}

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
    case "gestor": return <Eye className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

// --- SCHEMA & MODAL DE EDIÇÃO ---

const editUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.string().min(1, "Papel é obrigatório"),
  unidades_selecionadas: z.array(z.string()).default([]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

const EditarUsuarioDialog = ({ 
  user, onClose, onSuccess
}: { 
  user: UserWithRole, onClose: () => void, onSuccess: () => void 
}) => {
  const { data: unidadesCadastradas, isLoading: isLoadingUnidades } = useUnidadesTrabalho();
  const { data: currentUnidades, isLoading: isLoadingGestor } = useGestorUnidades(user.role === 'gestor' ? user.user_id : undefined);
  const updateGestorUnidades = useUpdateGestorUnidades();
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nome: user.nome_completo || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
      unidades_selecionadas: [],
    },
  });

  // Seta os valores vindos do banco para as checkboxes assim que carregarem
  useEffect(() => {
    if (currentUnidades) {
      form.setValue("unidades_selecionadas", currentUnidades);
    }
  }, [currentUnidades, form]);

  const { toast } = useToast();
  
  const editUserMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const { password, unidades_selecionadas, ...resto } = data;
      
      // 1. Atualizar informações básicas via Edge Function (Supabase Admin Auth)
      const submitData = password ? { action: "edit", user_id: user.user_id, ...resto, password } : { action: "edit", user_id: user.user_id, ...resto };
      const { data: result, error } = await supabase.functions.invoke("create-user", { body: submitData });
      
      if (error) throw new Error(error.message || "Erro ao editar usuário via Edge Function");
      if (result?.error) throw new Error(result.error);

      // 2. Se for gestor, vincular as unidades de trabalho usando nossa mutation local
      if (data.role === 'gestor') {
        await updateGestorUnidades.mutateAsync({
          userId: user.user_id,
          unidadesIds: unidades_selecionadas,
        });
      }

      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso!" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao editar usuário", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: EditUserFormValues) => {
    editUserMutation.mutate(values);
  };

  const selectedRole = form.watch("role");

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Altere os dados do usuário. Senha em branco para não alterar.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha (opcional)</FormLabel>
                    <FormControl><Input type="password" placeholder="Não alterar" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {user.role !== "super_admin" && (
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel (Role)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador (RH)</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="user">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* SEÇÃO CONDICIONAL: GESTOR DE UNIDADES */}
            {selectedRole === "gestor" && (
              <div className="mt-4 border rounded-md p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Unidades de Trabalho Responsáveis</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecione as unidades sob a supervisão deste gestor. Somente colaboradores vinculados a estas unidades aparecerão para ele.
                </p>
                
                {isLoadingUnidades || isLoadingGestor ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto border rounded-sm">
                    <ShadcnTable>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-12 text-center"></TableHead>
                          <TableHead>Nome da Unidade</TableHead>
                          <TableHead>Órgão (Código)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unidadesCadastradas?.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center">Nenhuma unidade cadastrada</TableCell></TableRow>
                        ) : (
                          unidadesCadastradas?.map((unidade) => (
                            <FormField
                              key={unidade.id}
                              control={form.control}
                              name="unidades_selecionadas"
                              render={({ field }) => {
                                return (
                                  <FormItem asChild>
                                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                      const isChecked = field.value?.includes(unidade.id);
                                      if (isChecked) {
                                        field.onChange(field.value?.filter(v => v !== unidade.id));
                                      } else {
                                        field.onChange([...(field.value || []), unidade.id]);
                                      }
                                    }}>
                                      <TableCell className="text-center">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(unidade.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), unidade.id])
                                                : field.onChange(field.value?.filter((value) => value !== unidade.id));
                                            }}
                                            onClick={e => e.stopPropagation()}
                                          />
                                        </FormControl>
                                      </TableCell>
                                      <TableCell className="font-medium text-sm">{unidade.nome}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{unidade.orgao?.sigla || unidade.orgao?.nome || "ND"}</TableCell>
                                    </TableRow>
                                  </FormItem>
                                )
                              }}
                            />
                          ))
                        )}
                      </TableBody>
                    </ShadcnTable>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" disabled={editUserMutation.isPending} className="w-full sm:w-auto">
                {editUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


// --- PÁGINA PRINCIPAL ---

const GerenciamentoUsuarios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [createForm, setCreateForm] = useState({
    nome: "", email: "", password: "", role: "user", departamento: "",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;
      return profiles.map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          id: p.id, user_id: p.user_id, email: p.email,
          nome_completo: p.nome_completo, role: userRole?.role || null, created_at: p.created_at,
        } as UserWithRole;
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setIsCreateOpen(false);
      setCreateForm({ nome: "", email: "", password: "", role: "user", departamento: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "user" | "gestor" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel atualizado" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie usuários e seus níveis de acesso</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4">
              <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(createForm); }}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>Preencha os dados</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input value={createForm.nome} onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel *</Label>
                    <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador (RH)</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="user">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
                  <Button type="submit" disabled={createUser.isPending} className="w-full sm:w-auto">
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {editingUser && (
          <EditarUsuarioDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSuccess={() => {
              setEditingUser(null);
              queryClient.invalidateQueries({ queryKey: ["all-users"] });
            }}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum usuário encontrado</h3>
          </div>
        ) : (
          <>
            <MobileCardList>
              {users.map((u) => (
                <MobileCard key={u.id}>
                  <MobileCardHeader
                    title={u.nome_completo || "Sem nome"}
                    subtitle={u.email || ""}
                    badge={<Badge variant={roleBadgeVariant(u.role)} className="gap-1"><RoleIcon role={u.role} />{roleLabels[u.role || ""]}</Badge>}
                  />
                  <MobileCardRow label="Criado em" value={new Date(u.created_at).toLocaleDateString("pt-BR")} />
                  <MobileCardActions>
                    <Button variant="outline" size="sm" onClick={() => setEditingUser(u)} className="flex-1 gap-1">
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    {u.role !== "super_admin" && (
                      <Select value={u.role || ""} onValueChange={(v) => updateRole.mutate({ userId: u.user_id, newRole: v })}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Papel" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">RH</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="user">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome_completo || "Sem nome"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)} className="gap-1">
                          <RoleIcon role={u.role} />
                          {roleLabels[u.role || ""] || "Sem papel"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingUser(u)} className="gap-1">
                            <Pencil className="h-3 w-3" /> Editar
                          </Button>
                          {u.role !== "super_admin" && (
                            <Select value={u.role || ""} onValueChange={(v) => updateRole.mutate({ userId: u.user_id, newRole: v })}>
                              <SelectTrigger className="w-36"><SelectValue placeholder="Papel" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">RH</SelectItem>
                                <SelectItem value="gestor">Gestor</SelectItem>
                                <SelectItem value="user">Colaborador</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ShadcnTable>
            </ResponsiveTable>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default GerenciamentoUsuarios;
