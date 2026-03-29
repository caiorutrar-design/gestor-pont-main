import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Clock, CheckCircle2, AlertCircle, Loader2, MapPin, MapPinOff } from "lucide-react";
import { toast } from "sonner";

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

  // Request geolocation on mount
  useEffect(() => {
    geo.requestPosition();
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricula.trim() || !senhaPonto.trim()) {
      toast.error("Preencha matrícula e senha.");
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    // Try to get fresh coordinates before submitting
    const position = await geo.requestPosition();

    try {
      const { data, error } = await supabase.functions.invoke("registrar-ponto", {
        body: {
          matricula: matricula.trim(),
          senha_ponto: senhaPonto.trim(),
          latitude: position?.latitude ?? geo.latitude,
          longitude: position?.longitude ?? geo.longitude,
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
      }
    } catch {
      setLastResult({ success: false, message: "Erro ao conectar com o servidor." });
      toast.error("Erro ao registrar ponto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Clock */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center py-8">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <p className="text-5xl font-mono font-bold text-foreground tracking-wider">
              {formatTime(currentTime)}
            </p>
            <p className="text-lg text-muted-foreground mt-2">{formatDate(currentTime)}</p>
          </CardContent>
        </Card>

        {/* Geolocation Status */}
        <Card className={`border ${geo.latitude ? "border-green-500/30 bg-green-500/5" : geo.error ? "border-destructive/30 bg-destructive/5" : "border-muted"}`}>
          <CardContent className="flex items-center gap-3 py-3">
            {geo.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Obtendo localização...</span>
              </>
            ) : geo.latitude ? (
              <>
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Localização obtida ({geo.accuracy ? `±${Math.round(geo.accuracy)}m` : ""})</span>
              </>
            ) : (
              <>
                <MapPinOff className="h-4 w-4 text-destructive" />
                <div className="flex-1">
                  <span className="text-sm text-destructive">{geo.error || "Localização indisponível"}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => geo.requestPosition()}>Tentar novamente</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Registro de Ponto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  type="text"
                  inputMode="numeric"
                  placeholder="Digite sua matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha de Ponto</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha de ponto"
                  value={senhaPonto}
                  onChange={(e) => setSenhaPonto(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Ponto"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Feedback */}
        {lastResult && (
          <Card className={lastResult.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
            <CardContent className="flex items-start gap-3 py-4">
              {lastResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              )}
              <div>
                {lastResult.colaborador_nome && (
                  <p className="font-medium text-foreground">{lastResult.colaborador_nome}</p>
                )}
                <p className="text-sm text-muted-foreground">{lastResult.message}</p>
                {lastResult.tipo && (
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    lastResult.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                  }`}>
                    {lastResult.tipo === "entrada" ? "Entrada" : "Saída"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default RegistroPontoPage;
