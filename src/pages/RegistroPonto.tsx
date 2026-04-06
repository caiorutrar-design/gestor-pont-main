import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AlertCircle, Loader2, MapPin, MapPinOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePontoStatus } from "@/hooks/usePontoStatus";
import { useMyColaborador } from "@/hooks/useMyColaborador";
import { registrarPontoSchema } from "@/domain/ponto/validators/pontoSchemas";
import { TipoRegistro } from "@/domain/ponto/types";
import { RegistroSuccessOverlay, GeoStatusBadge } from "./registro-ponto/components";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 260, 
      damping: 20 
    } 
  }
};

const RegistroPontoPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [matricula, setMatricula] = useState("");
  const [senhaPonto, setSenhaPonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    tipo?: string;
    colaborador_nome?: string;
  } | null>(null);

  const geo = useGeolocation();
  const { data: myColab } = useMyColaborador();
  const status = usePontoStatus(myColab?.id);

  useEffect(() => {
    // Solicita posição apenas na montagem inicial para validação
    geo.requestPosition();
  }, [geo]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = registrarPontoSchema.safeParse({
      matricula: matricula.trim(),
      senha_ponto: senhaPonto.trim(),
      latitude: geo.latitude,
      longitude: geo.longitude
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const position = await geo.requestPosition();

      const { data, error } = await supabase.functions.invoke("registrar-ponto", {
        body: {
          matricula: matricula.trim(),
          senha_ponto: senhaPonto.trim(),
          latitude: position?.latitude ?? geo.latitude ?? undefined,
          longitude: position?.longitude ?? geo.longitude ?? undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        setLastResult({ success: false, message: data.error });
        toast.error(data.error);
      } else {
        setLastResult({
          success: true,
          message: data.message,
          tipo: data.tipo,
          colaborador_nome: data.registro?.colaborador_nome,
        });
        toast.success(data.message);
        setMatricula("");
        setSenhaPonto("");
        status.refreshStatus();
        
        setTimeout(() => setLastResult(null), 4000);
      }
    } catch {
      setLastResult({ success: false, message: "Erro ao conectar com o servidor." });
      toast.error("Erro ao registrar ponto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccessOverlay = () => {
    if (!lastResult?.success) return null;
    return (
      <RegistroSuccessOverlay 
        result={lastResult} 
        onClose={() => setLastResult(null)} 
        formatTime={formatTime} 
        formatDate={formatDate} 
      />
    );
  };

  return (
    <AppLayout>
      <motion.div 
        className="max-w-lg mx-auto space-y-8 py-4 relative"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <AnimatePresence>
          {renderSuccessOverlay()}
        </AnimatePresence>

        {/* Clock Card - Premium Style */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <Card className="relative border-none bg-white/80 backdrop-blur-xl shadow-premium rounded-[2rem] overflow-hidden">
            <CardContent className="flex flex-col items-center py-10 relative z-10">
              <div className="absolute top-4 right-4 z-20">
                <GeoStatusBadge geo={geo} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-3 bg-primary/5 px-4 py-1.5 rounded-full">Procon MA Hub</div>
              <p className="text-6xl font-black text-secondary tracking-tighter drop-shadow-sm">
                {formatTime(currentTime)}
              </p>
              <p className="text-sm font-bold text-slate-400 mt-3 uppercase tracking-widest">{formatDate(currentTime)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Geolocation Status - Micro-interaction */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border transition-all duration-500 ${
            geo.latitude 
              ? "border-green-500/20 bg-green-500/5" 
              : geo.error 
                ? "border-primary/20 bg-primary/5" 
                : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className={`p-2.5 rounded-xl ${geo.latitude ? "bg-green-500/10" : "bg-primary/10"}`}>
              {geo.loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : geo.latitude ? (
                <MapPin className="h-5 w-5 text-green-600" />
              ) : (
                <MapPinOff className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Status de Localização</h4>
              <p className={`text-sm font-bold ${geo.latitude ? "text-green-700" : "text-primary opacity-80"}`}>
                {geo.loading && "Sincronizando com satélite..."}
                {!geo.loading && geo.latitude && `Presença Detectada (Precisão ±${Math.round(geo.accuracy || 0)}m)`}
                {!geo.loading && !geo.latitude && (geo.error || "Acesso de Localização Necessário")}
              </p>
            </div>
            {!geo.latitude && !geo.loading && (
              <Button variant="outline" size="sm" onClick={() => geo.requestPosition()} className="rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5">Reativar</Button>
            )}
          </div>
        </motion.div>

        {/* Registration Form - Refined */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <Card className="border-none shadow-premium rounded-[2rem]">
            <CardHeader className="pb-0">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-center text-slate-400">Terminal de Identificação</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="matricula" className="text-[11px] font-black uppercase tracking-widest ml-1 text-slate-500">Número de Matrícula</Label>
                  <Input
                    id="matricula"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 123456"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-primary/20 transition-all text-lg font-bold"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="senha" className="text-[11px] font-black uppercase tracking-widest ml-1 text-slate-500">Chave de Segurança</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-primary/20 transition-all text-lg font-bold tracking-[0.5em]"
                    value={senhaPonto}
                    onChange={(e) => setSenhaPonto(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
                <Button 
                  type="submit" 
                  className={`w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${
                    status.proximaAcao === TipoRegistro.SAIDA 
                      ? "bg-secondary hover:bg-slate-800 shadow-secondary/20" 
                      : "bg-primary hover:bg-red-700 shadow-primary/20"
                  }`} 
                  disabled={isSubmitting || !status.podeRegistrar}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processando...
                    </div>
                  ) : status.cooldown > 0 ? (
                    `Portal travado (${status.cooldown}s)`
                  ) : (
                    <div className="flex items-center gap-2">
                       Confirmar {status.proximaAcao === TipoRegistro.ENTRADA ? "Entrada" : "Saída"}
                       <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {lastResult && !lastResult.success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-primary/5 border border-primary/10 p-5 flex items-start gap-4 shadow-sm"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h5 className="text-[11px] font-black uppercase tracking-widest text-primary mb-1">Falha na Autenticação</h5>
              <p className="text-sm font-bold text-secondary opacity-80">{lastResult.message}</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default RegistroPontoPage;
