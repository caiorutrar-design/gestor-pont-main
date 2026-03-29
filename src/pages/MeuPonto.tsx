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
  Clock, LogOut, LogIn, ArrowRightFromLine, Loader2, CalendarDays, ChevronLeft, ChevronRight, MapPin, MapPinOff,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // Calculate today's worked hours dynamically (no fixed target)
  const todayWorkedMinutes = useMemo(() => {
    let total = 0;
    for (let i = 0; i < todaySorted.length; i++) {
      if (todaySorted[i].tipo === "entrada") {
        const exitRecord = todaySorted[i + 1];
        if (exitRecord && exitRecord.tipo === "saida") {
          total += differenceInMinutes(
            parseISO(exitRecord.timestamp_registro),
            parseISO(todaySorted[i].timestamp_registro)
          );
          i++; // skip the exit record
        } else if (!exitRecord) {
          // Currently working - count from entry to now
          total += differenceInMinutes(new Date(), parseISO(todaySorted[i].timestamp_registro));
        }
      }
    }
    return total;
  }, [todaySorted, currentTime]);

  const workedH = Math.floor(todayWorkedMinutes / 60);
  const workedM = todayWorkedMinutes % 60;

  const handleRegistrar = async () => {
    if (!colaborador) return;

    setIsSubmitting(true);
    try {
      // Get fresh coordinates
      const position = await geo.requestPosition();

      const now = new Date();
      const { error } = await supabase.from("registros_ponto").insert({
        colaborador_id: colaborador.id,
        data_registro: format(now, "yyyy-MM-dd"),
        hora_registro: now.toTimeString().split(" ")[0],
        timestamp_registro: now.toISOString(),
        tipo: nextTipo,
        latitude: position?.latitude ?? geo.latitude ?? null,
        longitude: position?.longitude ?? geo.longitude ?? null,
      });

      if (error) throw error;

      toast.success(`${isEntrada ? "Entrada" : "Saída"} registrada com sucesso!`);
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ["my-registros-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["my-registros-periodo"] });
    } catch {
      toast.error("Erro ao registrar ponto.");
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
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">Sua conta não está vinculada a nenhum colaborador.</p>
            <Button onClick={handleSignOut} variant="outline">Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const last6 = recentRecords.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{colaborador.nome_completo}</p>
            <p className="text-xs text-muted-foreground">Matrícula: {colaborador.matricula}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 shrink-0">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* Clock */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center py-6">
            <Clock className="h-6 w-6 text-primary mb-1" />
            <p className="text-4xl sm:text-5xl font-mono font-bold text-foreground tracking-wider">
              {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        {/* Geolocation Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${geo.latitude ? "bg-green-500/10 text-green-700" : geo.error ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
          {geo.loading ? (
            <><Loader2 className="h-3 w-3 animate-spin" /><span>Obtendo localização...</span></>
          ) : geo.latitude ? (
            <><MapPin className="h-3 w-3" /><span>Localização ativa ({geo.accuracy ? `±${Math.round(geo.accuracy)}m` : ""})</span></>
          ) : (
            <><MapPinOff className="h-3 w-3" /><span>{geo.error || "Localização indisponível"}</span></>
          )}
        </div>

        {/* Main Action Button */}
        <Button
          size="lg"
          onClick={handleRegistrar}
          disabled={isSubmitting}
          className={`w-full h-16 text-lg font-semibold gap-3 ${
            isEntrada
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-orange-600 hover:bg-orange-700 text-white"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isEntrada ? (
            <LogIn className="h-6 w-6" />
          ) : (
            <ArrowRightFromLine className="h-6 w-6" />
          )}
          {isSubmitting
            ? "Registrando..."
            : isEntrada
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
