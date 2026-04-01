import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Search, ShieldCheck, ChevronLeft, ChevronRight,
  Clock, User, AlertTriangle, MapPin, Wifi, Lock, Eye, Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Mapeamento de ações para labels e estilos visuais ──────────────────────
const ACTION_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}> = {
  PONTO_REGISTRADO:        { label: "Ponto Registrado",       icon: Clock,         variant: "default",     color: "bg-green-100 text-green-800 border-green-200" },
  PONTO_EDITADO:           { label: "Ponto Editado",          icon: Clock,         variant: "secondary",   color: "bg-blue-100 text-blue-800 border-blue-200" },
  PONTO_EXCLUIDO:          { label: "Ponto Excluído",         icon: Clock,         variant: "destructive", color: "bg-red-100 text-red-800 border-red-200" },
  COLABORADOR_CRIADO:      { label: "Colaborador Criado",     icon: User,          variant: "default",     color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  COLABORADOR_ATUALIZADO:  { label: "Colaborador Atualizado", icon: User,          variant: "secondary",   color: "bg-blue-100 text-blue-800 border-blue-200" },
  COLABORADOR_EXCLUIDO:    { label: "Colaborador Excluído",   icon: User,          variant: "destructive", color: "bg-red-100 text-red-800 border-red-200" },
  LOGIN_SUCESSO:           { label: "Login",                  icon: ShieldCheck,   variant: "default",     color: "bg-green-100 text-green-800 border-green-200" },
  LOGIN_FALHA:             { label: "Login Falhou",           icon: AlertTriangle, variant: "destructive", color: "bg-orange-100 text-orange-800 border-orange-200" },
  SECURITY_BLOCK_GEO:      { label: "Bloqueio Geográfico",   icon: MapPin,        variant: "destructive", color: "bg-red-100 text-red-800 border-red-200" },
  SECURITY_BLOCK_IP:       { label: "Bloqueio por IP",        icon: Wifi,          variant: "destructive", color: "bg-red-100 text-red-800 border-red-200" },
  SECURITY_BLOCK_RATE_LIMIT: { label: "Rate Limit",          icon: Lock,          variant: "destructive", color: "bg-orange-100 text-orange-800 border-orange-200" },
};

const ENTITY_LABELS: Record<string, string> = {
  registros_ponto: "Ponto",
  colaboradores:   "Colaborador",
  auth:            "Autenticação",
  security:        "Segurança",
};

const PAGE_SIZE = 25;

// ── Utilitário: Exportação CSV ────────────────────────────────────────────

/** Escapa um valor para CSV: envolve em aspas e escapa aspas internas. */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

const CSV_HEADERS = [
  "Data/Hora", "Ação", "Entidade", "ID Entidade", "IP", "user_id", "orgao_id", "Payload",
];

function buildCSV(rows: any[]): string {
  const header = CSV_HEADERS.join(",");
  const lines = rows.map((r) =>
    [
      csvCell(r.created_at ? format(parseISO(r.created_at), "dd/MM/yyyy HH:mm:ss") : ""),
      csvCell(r.action),
      csvCell(r.entity),
      csvCell(r.entity_id),
      csvCell(r.ip_address),
      csvCell(r.user_id),
      csvCell(r.orgao_id),
      csvCell(r.payload),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM para compatibilidade com Excel
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente: Badge de ação ──────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action];
  if (!cfg) return <span className="text-xs text-muted-foreground font-mono">{action}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Componente: Modal de detalhes do payload ───────────────────────────────
function PayloadModal({ log, open, onClose }: { log: any; open: boolean; onClose: () => void }) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0B132B]">
            <ShieldCheck className="h-5 w-5 text-[#C51B29]" />
            Detalhes do Log de Auditoria
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Ação</p>
              <ActionBadge action={log.action} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Entidade</p>
              <p className="font-medium">{ENTITY_LABELS[log.entity] || log.entity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Data/Hora</p>
              <p className="font-medium font-mono text-xs">
                {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">IP</p>
              <p className="font-mono text-xs">{log.ip_address || "—"}</p>
            </div>
            {log.entity_id && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">ID da Entidade</p>
                <p className="font-mono text-xs text-slate-600 break-all">{log.entity_id}</p>
              </div>
            )}
          </div>

          {log.payload && Object.keys(log.payload).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Payload</p>
              <pre className="bg-slate-50 border rounded-lg p-3 text-xs font-mono overflow-auto max-h-60 text-slate-700">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────
const LogsAuditoria = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, search, actionFilter, entityFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(`entity_id.ilike.%${search}%,ip_address.ilike.%${search}%`);
      }
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (entityFilter !== "all") query = query.eq("entity", entityFilter);

      const { data: logs, error, count } = await query;
      if (error) throw error;
      return { logs: logs ?? [], total: count ?? 0 };
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Exportação CSV: busca TODOS os registros filtrados (até 10k) ─────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      let query = (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (search.trim()) {
        query = query.or(`entity_id.ilike.%${search}%,ip_address.ilike.%${search}%`);
      }
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (entityFilter !== "all") query = query.eq("entity", entityFilter);

      const { data: allLogs, error } = await query;
      if (error) throw error;

      const csv = buildCSV(allLogs ?? []);
      const timestamp = format(new Date(), "yyyyMMdd_HHmm");
      const label = actionFilter !== "all" ? `_${actionFilter}` : "";
      downloadCSV(csv, `audit_logs${label}_${timestamp}.csv`);
    } catch (err) {
      console.error("[Export] Falha ao exportar:", err);
    } finally {
      setExporting(false);
    }
  }, [search, actionFilter, entityFilter]);

  // Estatísticas rápidas dos logs carregados
  const stats = {
    security: logs.filter((l: any) => l.action?.startsWith("SECURITY_BLOCK")).length,
    pontos:   logs.filter((l: any) => l.action === "PONTO_REGISTRADO").length,
    erros:    logs.filter((l: any) => ["PONTO_EXCLUIDO", "LOGIN_FALHA"].includes(l.action)).length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0B132B] flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#C51B29]" />
              Logs de Auditoria
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trilha imutável de todas as ações críticas do sistema
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-[#0B132B]/5 text-[#0B132B] border-[#0B132B]/20">
              {total.toLocaleString("pt-BR")} registros
            </Badge>
            <Button
              onClick={handleExport}
              disabled={exporting || total === 0}
              size="sm"
              variant="outline"
              className="gap-2 border-[#0B132B]/20 text-[#0B132B] hover:bg-[#0B132B] hover:text-white transition-colors"
            >
              {exporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
          </div>
        </div>

        {/* Stats rápidas */}
        {!isLoading && logs.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-t-4 border-t-green-500">
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-xl font-bold text-[#0B132B]">{stats.pontos}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pontos (pág.)</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-red-500">
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-xl font-bold text-red-700">{stats.security}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Bloqueios Seg.</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-orange-400">
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-xl font-bold text-orange-700">{stats.erros}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Exclusões/Falhas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por entity_id ou IP..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="PONTO_REGISTRADO">Ponto Registrado</SelectItem>
              <SelectItem value="PONTO_EDITADO">Ponto Editado</SelectItem>
              <SelectItem value="PONTO_EXCLUIDO">Ponto Excluído</SelectItem>
              <SelectItem value="COLABORADOR_CRIADO">Colaborador Criado</SelectItem>
              <SelectItem value="COLABORADOR_ATUALIZADO">Colaborador Atualizado</SelectItem>
              <SelectItem value="COLABORADOR_EXCLUIDO">Colaborador Excluído</SelectItem>
              <SelectItem value="LOGIN_SUCESSO">Login</SelectItem>
              <SelectItem value="LOGIN_FALHA">Login Falhou</SelectItem>
              <SelectItem value="SECURITY_BLOCK_GEO">Bloqueio Geográfico</SelectItem>
              <SelectItem value="SECURITY_BLOCK_IP">Bloqueio por IP</SelectItem>
              <SelectItem value="SECURITY_BLOCK_RATE_LIMIT">Rate Limit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas entidades</SelectItem>
              <SelectItem value="registros_ponto">Ponto</SelectItem>
              <SelectItem value="colaboradores">Colaboradores</SelectItem>
              <SelectItem value="auth">Autenticação</SelectItem>
              <SelectItem value="security">Segurança</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#C51B29]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-[#0B132B]">Nenhum log encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1">Os registros de auditoria aparecerão aqui</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Data/Hora</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Ação</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Entidade</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500 hidden md:table-cell">ID Entidade</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500 hidden lg:table-cell">IP</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-bold text-slate-500 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">
                        {format(parseISO(log.created_at), "dd/MM/yy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-600">
                          {ENTITY_LABELS[log.entity] || log.entity}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-[11px] text-slate-400 max-w-[120px] truncate block">
                          {log.entity_id || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-mono text-xs text-slate-500">{log.ip_address || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de{" "}
                <span className="font-semibold text-[#0B132B]">{total.toLocaleString("pt-BR")}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-[#0B132B] min-w-[80px] text-center">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de detalhes */}
      <PayloadModal
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </AppLayout>
  );
};

export default LogsAuditoria;
