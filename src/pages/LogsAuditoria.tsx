import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveTable, MobileCardList, MobileCard, MobileCardHeader, MobileCardRow,
} from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

const actionLabels: Record<string, string> = {
  user_created: "Usuário Criado",
  user_updated: "Usuário Editado",
  user_deleted: "Usuário Excluído",
  login: "Login",
  logout: "Logout",
  colaborador_created: "Colaborador Criado",
  colaborador_updated: "Colaborador Atualizado",
  colaborador_deleted: "Colaborador Excluído",
  access_denied: "Acesso Negado",
};

const PAGE_SIZE = 20;

const LogsAuditoria = () => {
  const [page, setPage] = useState(0);
  const [searchEmail, setSearchEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, searchEmail, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchEmail) {
        query = query.ilike("user_email", `%${searchEmail}%`);
      }
      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      const { data: logs, error, count } = await query;
      if (error) throw error;
      return { logs: logs || [], total: count || 0 };
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details || Object.keys(details).length === 0) return "-";
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground">Histórico de atividades do sistema</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por email..."
              value={searchEmail}
              onChange={(e) => { setSearchEmail(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="user_created">Usuário Criado</SelectItem>
              <SelectItem value="user_updated">Usuário Editado</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="colaborador_created">Colaborador Criado</SelectItem>
              <SelectItem value="colaborador_updated">Colaborador Atualizado</SelectItem>
              <SelectItem value="colaborador_deleted">Colaborador Excluído</SelectItem>
              <SelectItem value="access_denied">Acesso Negado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum log encontrado</h3>
            <p className="text-muted-foreground mt-1">Os logs de atividade aparecerão aqui</p>
          </div>
        ) : (
          <>
            <MobileCardList>
              {logs.map((log) => (
                <MobileCard key={log.id}>
                  <MobileCardHeader
                    title={actionLabels[log.action_type] || log.action_type}
                    subtitle={log.user_email || "Sistema"}
                    badge={
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type || "-"}
                      </Badge>
                    }
                  />
                  <MobileCardRow label="Data/Hora" value={formatDate(log.created_at)} />
                  {log.ip_address && <MobileCardRow label="IP" value={log.ip_address} />}
                  <MobileCardRow
                    label="Detalhes"
                    value={
                      <span className="text-xs max-w-[200px] truncate block">
                        {formatDetails(log.details as Record<string, unknown>)}
                      </span>
                    }
                  />
                </MobileCard>
              ))}
            </MobileCardList>

            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(log.created_at)}</TableCell>
                      <TableCell className="text-sm">{log.user_email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{actionLabels[log.action_type] || log.action_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type || "-"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {formatDetails(log.details as Record<string, unknown>)}
                      </TableCell>
                      <TableCell className="text-sm">{log.ip_address || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default LogsAuditoria;
