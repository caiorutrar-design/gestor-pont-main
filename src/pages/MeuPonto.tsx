import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useMyColaborador, useMyRegistrosPonto, useMyRegistrosPontoPeriodo } from "@/hooks/useMyColaborador";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Clock, LogOut, LogIn, ArrowRightFromLine, Loader2, CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pontoDomainService } from "@/domain/ponto/services/PontoDomainService";
import { RegistroPonto } from "@/domain/ponto/entities/RegistroPonto";
import { TipoRegistro } from "@/domain/ponto/types";
import { usePontoStatus } from "@/hooks/usePontoStatus";

import { PontoClock, GeolocationStatus, PontoStats } from "./meu-ponto/components";

const MeuPontoPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: colaborador, isLoading: colabLoading } = useMyColaborador();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const geo = useGeolocation();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayRecords = [], refetch: refetchToday } = useMyRegistrosPonto(colaborador?.id, today);
  const { data: recentRecords = [] } = useMyRegistrosPonto(colaborador?.id);
  const status = usePontoStatus(colaborador?.id);

  // Calendar month records
  const monthStart = format(startOfMonth(calendarMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(calendarMonth), "yyyy-MM-dd");
  const { data: monthRecords = [] } = useMyRegistrosPontoPeriodo(colaborador?.id, monthStart, monthEnd);

  // Records for selected day in calendar
  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return monthRecords.filter((r) => r.data_registro === dateStr)
      .sort((a, b) => a.timestamp_registro.localeCompare(b.timestamp_registro));
  }, [selectedDate, monthRecords]);

  // Days with records for calendar markers
  const daysWithRecords = useMemo(() => {
    const days = new Set<string>();
    monthRecords.forEach((r) => days.add(r.data_registro));
    return days;
  }, [monthRecords]);

  // Request geolocation on mount
  useEffect(() => {
    geo.requestPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todaySorted = useMemo(
    () => [...todayRecords].sort((a, b) => a.timestamp_registro.localeCompare(b.timestamp_registro)),
    [todayRecords]
  );

  const lastRecord = todaySorted.length > 0 ? todaySorted[todaySorted.length - 1] : null;
  const nextTipo = !lastRecord || lastRecord.tipo === "saida" ? "entrada" : "saida";
  const isEntrada = nextTipo === "entrada";

  // Calculate today's worked hours using Domain Service
  const workedTime = useMemo(() => {
    const entities = todaySorted.map(r => new RegistroPonto({
        colaborador_id: r.colaborador_id,
        orgao_id: (r as any).orgao_id || "",
        tipo: r.tipo as TipoRegistro,
        timestamp_registro: new Date(r.timestamp_registro)
    }));
    return pontoDomainService.calcularHorasTrabalhadas(entities);
  }, [todaySorted]); // Removido currentTime - cálculo é estático para registros passados

  const workedH = Math.floor(workedTime.totalMinutos / 60);
  const workedM = workedTime.totalMinutos % 60;

  const handleRegistrar = async () => {
    if (!colaborador) return;

    setIsSubmitting(true);
    try {
      const position = await geo.requestPosition();

      const { data, error } = await supabase.functions.invoke("registrar-ponto", {
        body: {
            matricula: colaborador.matricula,
            senha_ponto: colaborador.senha_ponto,
            latitude: position?.latitude ?? geo.latitude ?? null,
            longitude: position?.longitude ?? geo.longitude ?? null,
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.message);
      refetchToday();
      status.refreshStatus();
      queryClient.invalidateQueries({ queryKey: ["my-registros-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["my-registros-periodo"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar ponto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (colabLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardContent className="py-12 text-center space-y-6">
            <div className="bg-amber-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <LogOut className="h-10 w-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Colaborador não localizado</h3>
              <p className="text-slate-500 text-sm">Sua conta não está vinculada a nenhum colaborador ativo no sistema.</p>
            </div>
            <Button onClick={handleSignOut} variant="secondary" className="w-full">Sair e Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const last6 = recentRecords.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground truncate">{colaborador.nome_completo}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Matrícula: {colaborador.matricula}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 shrink-0 text-slate-500 hover:text-destructive hover:bg-destructive/5 transition-colors" aria-label="Sair">
            <LogOut className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-24">
        <PontoClock currentTime={currentTime} />
        <GeolocationStatus geo={geo} />
        <PontoStats workedH={workedH} workedM={workedM} />

        <Button
          size="lg"
          onClick={handleRegistrar}
          disabled={isSubmitting || !status.podeRegistrar}
          className={`w-full h-16 text-lg font-semibold gap-3 ${
            status.proximaAcao === TipoRegistro.ENTRADA
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-orange-600 hover:bg-orange-700 text-white"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : status.cooldown > 0 ? (
            <Clock className="h-6 w-6" />
          ) : status.proximaAcao === TipoRegistro.ENTRADA ? (
            <LogIn className="h-6 w-6" />
          ) : (
            <ArrowRightFromLine className="h-6 w-6" />
          )}
          {isSubmitting
            ? "Registrando..."
            : status.cooldown > 0
            ? `Aguarde ${status.cooldown}s`
            : status.proximaAcao === TipoRegistro.ENTRADA
            ? "Registrar Entrada"
            : "Registrar Saída"}
        </Button>

        {/* Hours Worked Today */}
        {todaySorted.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Horas trabalhadas hoje</span>
                <span className="font-mono font-semibold text-foreground text-lg">
                  {workedH}h{workedM.toString().padStart(2, "0")}m
                </span>
              </div>
              {!isEntrada && (
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  ⏱ Contagem em andamento...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Records */}
        {todaySorted.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registros de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todaySorted.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={r.tipo === "entrada" ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}
                    >
                      {r.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </div>
                  <span className="font-mono text-sm text-foreground">
                    {r.hora_registro?.substring(0, 5)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Last Records */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimos Registros</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCalendarOpen(true)} className="gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {last6.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-2">
                {last6.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={r.tipo === "entrada" ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}
                      >
                        {r.tipo === "entrada" ? "E" : "S"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(r.data_registro), "dd/MM")}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-foreground">
                      {r.hora_registro?.substring(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Histórico de Registros</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            locale={ptBR}
            modifiers={{
              hasRecord: (date) => daysWithRecords.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasRecord: "bg-primary/20 font-semibold",
            }}
          />

          {selectedDate && (
            <div className="mt-2 border-t pt-3">
              <p className="text-sm font-medium mb-2">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              {selectedDayRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro neste dia.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayRecords.map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={r.tipo === "entrada" ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}
                      >
                        {r.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                      <span className="font-mono text-sm">{r.hora_registro?.substring(0, 5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeuPontoPage;
