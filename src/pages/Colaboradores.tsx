import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  useColaboradores,
  useCreateColaborador,
  useUpdateColaborador,
  useDeleteColaborador,
  useToggleColaboradorStatus,
} from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useLotacoes } from "@/hooks/useLotacoes";
import { useUnidadesTrabalho } from "@/hooks/useUnidadesTrabalho";
import { Colaborador, ColaboradorForm } from "@/types/database";
import { Plus, Pencil, Trash2, Users, Loader2, Eye, KeyRound, Copy, RefreshCw, ShieldCheck, ShieldX, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ColaboradoresFilters } from "@/components/colaboradores/ColaboradoresFilters";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador as ColabType } from "@/types/database";
import { toast } from "sonner";

function generateSecurePassword(length = 12): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%&*';
  const charset = lower + upper + digits + symbols;
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const chars = Array.from(array, (v) => charset[v % charset.length]);
  // Guarantee at least one of each type
  const groups = [upper, lower, digits, symbols];
  const posArray = new Uint32Array(groups.length);
  crypto.getRandomValues(posArray);
  groups.forEach((group, i) => {
    const pos = posArray[i] % length;
    const charIdx = array[pos] % group.length;
    chars[pos] = group[charIdx];
  });
  return chars.join('');
}

const initialFormData: ColaboradorForm = {
  nome_completo: "",
  matricula: "",
  orgao_id: "",
  lotacao_id: null,
  cargo: "",
  jornada_entrada_manha: "08:00",
  jornada_saida_manha: "12:00",
  jornada_entrada_tarde: "14:00",
  jornada_saida_tarde: "18:00",
  ativo: true,
  unidade_trabalho_id: null,
  geolocation_obrigatoria: false,
};

const ColaboradoresPage = () => {
  const navigate = useNavigate();
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const { data: orgaos = [] } = useOrgaos();
  const { data: lotacoes = [] } = useLotacoes();
  const { data: unidadesTrabalho = [] } = useUnidadesTrabalho();
  const createColaborador = useCreateColaborador();
  const updateColaborador = useUpdateColaborador();
  const deleteColaborador = useDeleteColaborador();
  const toggleStatus = useToggleColaboradorStatus();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [formData, setFormData] = useState<ColaboradorForm>(initialFormData);
  const [searchTerm, setSearchTerm] = useState("");
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [credentialsColab, setCredentialsColab] = useState<Colaborador | null>(null);
  const [credentialsPassword, setCredentialsPassword] = useState("");
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsResult, setCredentialsResult] = useState<{ login: string; password: string } | null>(null);

  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [accountPassword, setAccountPassword] = useState(() => generateSecurePassword());

  const handleGenerateCredentials = (colaborador: Colaborador) => {
    setCredentialsColab(colaborador);
    const randomPwd = generateSecurePassword();
    setCredentialsPassword(randomPwd);
    setCredentialsResult(null);
    setCredentialsDialogOpen(true);
  };

  const handleSubmitCredentials = async () => {
    if (!credentialsColab || !credentialsPassword) return;
    setCredentialsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-colaborador-account", {
        body: { colaborador_id: credentialsColab.id, password: credentialsPassword },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
      } else {
        setCredentialsResult({ login: data.login, password: credentialsPassword });
        toast.success(data.message);
      }
    } catch {
      toast.error("Erro ao gerar credenciais.");
    } finally {
      setCredentialsLoading(false);
    }
  };

  // Filter colaboradores based on search term
  const filteredColaboradores = colaboradores.filter((colaborador) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      colaborador.nome_completo.toLowerCase().includes(search) ||
      colaborador.matricula.toLowerCase().includes(search) ||
      colaborador.cargo.toLowerCase().includes(search)
    );
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingColaborador(null);
  };

  const handleOpenDialog = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingColaborador(colaborador);
      setFormData({
        nome_completo: colaborador.nome_completo,
        matricula: colaborador.matricula,
        orgao_id: colaborador.orgao_id,
        lotacao_id: colaborador.lotacao_id,
        cargo: colaborador.cargo,
        jornada_entrada_manha: colaborador.jornada_entrada_manha,
        jornada_saida_manha: colaborador.jornada_saida_manha,
        jornada_entrada_tarde: colaborador.jornada_entrada_tarde,
        jornada_saida_tarde: colaborador.jornada_saida_tarde,
        ativo: colaborador.ativo,
        unidade_trabalho_id: (colaborador as any).unidade_trabalho_id || null,
        geolocation_obrigatoria: (colaborador as any).geolocation_obrigatoria || false,
      });
    } else {
      resetForm();
      setAccountPassword(generateSecurePassword());
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingColaborador) {
      await updateColaborador.mutateAsync({ id: editingColaborador.id, ...formData });
    } else {
      const created = await createColaborador.mutateAsync(formData);
      // Auto-create auth account if checkbox is checked
      if (autoCreateAccount && created?.id) {
        if (accountPassword.length < 8) {
          toast.error("A senha deve ter pelo menos 8 caracteres.");
          return;
        }
        try {
          const { data, error } = await supabase.functions.invoke("create-colaborador-account", {
            body: { colaborador_id: created.id, password: accountPassword },
          });
          if (!error && !data.error) {
            setIsDialogOpen(false);
            resetForm();
            setCredentialsColab(created as Colaborador);
            setCredentialsPassword(accountPassword);
            setCredentialsResult({ login: data.login, password: accountPassword });
            setCredentialsDialogOpen(true);
            return;
          }
        } catch {
          toast.error("Colaborador criado, mas erro ao gerar conta. Use o botão de credenciais.");
        }
      }
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteColaborador.mutateAsync(id);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleStatus.mutateAsync({ id, ativo: !currentStatus });
  };

  const filteredLotacoes = lotacoes.filter(
    (l) => l.orgao_id === formData.orgao_id
  );

  const StatusBadge = ({ ativo, onClick }: { ativo: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={ativo ? "status-active" : "status-inactive"}
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Colaboradores</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os servidores e suas informações
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingColaborador ? "Editar Colaborador" : "Novo Colaborador"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingColaborador
                      ? "Atualize as informações do colaborador"
                      : "Preencha os dados para cadastrar um novo colaborador"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_completo">Nome Completo *</Label>
                      <Input
                        id="nome_completo"
                        value={formData.nome_completo}
                        onChange={(e) =>
                          setFormData({ ...formData, nome_completo: e.target.value })
                        }
                        placeholder="Nome completo do servidor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matricula">Matrícula *</Label>
                      <Input
                        id="matricula"
                        value={formData.matricula}
                        onChange={(e) =>
                          setFormData({ ...formData, matricula: e.target.value })
                        }
                        placeholder="Número da matrícula"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgao_id">Órgão *</Label>
                      <Select
                        value={formData.orgao_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, orgao_id: value, lotacao_id: null })
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
                      <Label htmlFor="lotacao_id">Lotação</Label>
                      <Select
                        value={formData.lotacao_id || "none"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, lotacao_id: value === "none" ? null : value })
                        }
                        disabled={!formData.orgao_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a lotação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {filteredLotacoes.map((lotacao) => (
                            <SelectItem key={lotacao.id} value={lotacao.id}>
                              {lotacao.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) =>
                        setFormData({ ...formData, cargo: e.target.value })
                      }
                      placeholder="Ex: Auxiliar Administrativo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jornada de Trabalho</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="entrada_manha" className="text-xs text-muted-foreground">
                          Entrada Manhã
                        </Label>
                        <Input
                          id="entrada_manha"
                          type="time"
                          value={formData.jornada_entrada_manha}
                          onChange={(e) =>
                            setFormData({ ...formData, jornada_entrada_manha: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="saida_manha" className="text-xs text-muted-foreground">
                          Saída Manhã
                        </Label>
                        <Input
                          id="saida_manha"
                          type="time"
                          value={formData.jornada_saida_manha}
                          onChange={(e) =>
                            setFormData({ ...formData, jornada_saida_manha: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="entrada_tarde" className="text-xs text-muted-foreground">
                          Entrada Tarde
                        </Label>
                        <Input
                          id="entrada_tarde"
                          type="time"
                          value={formData.jornada_entrada_tarde}
                          onChange={(e) =>
                            setFormData({ ...formData, jornada_entrada_tarde: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="saida_tarde" className="text-xs text-muted-foreground">
                          Saída Tarde
                        </Label>
                        <Input
                          id="saida_tarde"
                          type="time"
                          value={formData.jornada_saida_tarde}
                          onChange={(e) =>
                            setFormData({ ...formData, jornada_saida_tarde: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, ativo: checked })
                      }
                    />
                    <Label htmlFor="ativo">Colaborador Ativo</Label>
                  </div>

                  {/* Geolocalização */}
                  <div className="space-y-3 rounded-md border p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Geolocalização</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Unidade de Trabalho</Label>
                      <Select
                        value={formData.unidade_trabalho_id || "none"}
                        onValueChange={(v) => setFormData({ ...formData, unidade_trabalho_id: v === "none" ? null : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {unidadesTrabalho.filter(u => u.ativo).map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.nome} ({u.orgao?.sigla || ""})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="geo_obrigatoria"
                        checked={formData.geolocation_obrigatoria || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, geolocation_obrigatoria: checked })}
                        disabled={!formData.unidade_trabalho_id}
                      />
                      <div>
                        <Label htmlFor="geo_obrigatoria" className="text-sm cursor-pointer">Exigir geolocalização</Label>
                        <p className="text-xs text-muted-foreground">O ponto só será aceito dentro do raio da unidade</p>
                      </div>
                    </div>
                  </div>

                  {!editingColaborador && (
                    <div className="space-y-3 rounded-md border p-3 bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="auto_create_account"
                          checked={autoCreateAccount}
                          onCheckedChange={(checked) => setAutoCreateAccount(checked === true)}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="auto_create_account" className="text-sm font-medium cursor-pointer">
                            Criar conta de acesso
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Define login (matrícula) e senha para o colaborador acessar o sistema
                          </p>
                        </div>
                      </div>
                      {autoCreateAccount && (
                        <div className="space-y-2">
                          <Label htmlFor="account_password" className="text-sm">Senha de acesso *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="account_password"
                              type="text"
                              value={accountPassword}
                              onChange={(e) => setAccountPassword(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                              minLength={8}
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Gerar senha aleatória"
                              onClick={() => setAccountPassword(generateSecurePassword())}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Anote esta senha para repassar ao colaborador
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                    disabled={
                      createColaborador.isPending ||
                      updateColaborador.isPending ||
                      !formData.orgao_id
                    }
                    className="w-full sm:w-auto"
                  >
                    {(createColaborador.isPending || updateColaborador.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingColaborador ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {orgaos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Cadastre um órgão primeiro
            </h3>
            <p className="text-muted-foreground mt-1">
              Para cadastrar colaboradores, você precisa ter pelo menos um órgão cadastrado
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : colaboradores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhum colaborador cadastrado
            </h3>
            <p className="text-muted-foreground mt-1">
              Comece cadastrando seu primeiro colaborador
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ColaboradoresFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            
            {filteredColaboradores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground mt-1">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <MobileCardList>
                  {filteredColaboradores.map((colaborador) => (
                    <MobileCard key={colaborador.id}>
                      <MobileCardHeader
                        title={colaborador.nome_completo}
                        subtitle={colaborador.matricula}
                        badge={
                          <StatusBadge
                            ativo={colaborador.ativo}
                            onClick={() => handleToggleStatus(colaborador.id, colaborador.ativo)}
                          />
                        }
                      />
                      <div className="space-y-1">
                        <MobileCardRow label="Cargo" value={colaborador.cargo} />
                        <MobileCardRow
                          label="Órgão"
                          value={colaborador.orgao?.sigla || colaborador.orgao?.nome || "-"}
                        />
                        {colaborador.lotacao && (
                          <MobileCardRow label="Lotação" value={colaborador.lotacao.nome} />
                        )}
                      </div>
                      <MobileCardActions>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dossie/${colaborador.id}`)}
                          className="flex-1 gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Dossiê
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateCredentials(colaborador)}
                          className="flex-1 gap-1"
                        >
                          <KeyRound className="h-4 w-4" />
                          {(colaborador as any).user_id ? (
                            <ShieldCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <ShieldX className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(colaborador)}
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
                                Tem certeza que deseja excluir o colaborador "{colaborador.nome_completo}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(colaborador.id)}
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
                        <TableHead>Matrícula</TableHead>
                        <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                        <TableHead className="hidden xl:table-cell">Órgão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredColaboradores.map((colaborador) => (
                        <TableRow key={colaborador.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {colaborador.nome_completo}
                          </TableCell>
                          <TableCell>{colaborador.matricula}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {colaborador.cargo}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {colaborador.orgao?.sigla || colaborador.orgao?.nome || "-"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              ativo={colaborador.ativo}
                              onClick={() => handleToggleStatus(colaborador.id, colaborador.ativo)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/dossie/${colaborador.id}`)}
                                title="Dossiê"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGenerateCredentials(colaborador)}
                                title="Gerar Credenciais"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(colaborador)}
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
                                      Tem certeza que deseja excluir o colaborador "
                                      {colaborador.nome_completo}"? Esta ação não pode
                                      ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(colaborador.id)}
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
        )}

        {/* Credentials Dialog */}
        <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>
                {credentialsResult ? "Credenciais Geradas" : "Gerar Credenciais de Acesso"}
              </DialogTitle>
              <DialogDescription>
                {credentialsColab?.nome_completo} — {credentialsColab?.matricula}
              </DialogDescription>
            </DialogHeader>

            {credentialsResult ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Login (matrícula)</Label>
                  <div className="flex items-center gap-2">
                    <Input value={credentialsResult.login} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsResult.login);
                        toast.success("Copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Senha temporária</Label>
                  <div className="flex items-center gap-2">
                    <Input value={credentialsResult.password} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsResult.password);
                        toast.success("Copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anote a senha — ela não será exibida novamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Senha de acesso</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={credentialsPassword}
                      onChange={(e) => setCredentialsPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCredentialsPassword(generateSecurePassword())}
                      title="Gerar nova senha"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSubmitCredentials}
                    disabled={credentialsLoading || credentialsPassword.length < 8}
                    className="w-full"
                  >
                    {credentialsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {(credentialsColab as any)?.user_id ? "Resetar Senha" : "Criar Conta"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ColaboradoresPage;
