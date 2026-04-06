import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, MapPinOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Clock Component
export const PontoClock = ({ currentTime }: { currentTime: Date }) => (
  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
    <CardContent className="flex flex-col items-center py-6">
      <Clock className="h-6 w-6 text-primary mb-1" aria-hidden="true" />
      <p className="text-4xl sm:text-5xl font-mono font-bold text-foreground tracking-wider">
        {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
      </p>
    </CardContent>
  </Card>
);

// 2. Geolocation Status Component
export const GeolocationStatus = ({ geo }: { geo: any }) => {
  const getStatusConfig = () => {
    if (geo.loading) return { classes: "bg-muted text-muted-foreground", icon: Loader2, text: "Obtendo localização...", spin: true };
    if (geo.latitude) return { 
      classes: "bg-green-500/10 text-green-700", 
      icon: MapPin, 
      text: `Localização ativa (${geo.accuracy ? `±${Math.round(geo.accuracy)}m` : ""})` 
    };
    return { classes: "bg-destructive/10 text-destructive", icon: MapPinOff, text: geo.error || "Localização indisponível" };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors", config.classes)} role="status">
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} aria-hidden="true" />
      <span>{config.text}</span>
    </div>
  );
};

// 3. Stats Summary Component
export const PontoStats = ({ workedH, workedM }: { workedH: number; workedM: number }) => (
  <div className="grid grid-cols-2 gap-3">
    <Card className="bg-slate-50 border-none shadow-sm">
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Horas Hoje</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-slate-800">{String(workedH).padStart(2, '0')}h</span>
          <span className="text-lg font-mono font-bold text-slate-400">{String(workedM).padStart(2, '0')}m</span>
        </div>
      </CardContent>
    </Card>
    <Card className="bg-[#C51B29]/5 border-none shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-1 opacity-10">
        <Badge variant="outline" className="text-[8px] border-primary">LIVE</Badge>
      </div>
      <CardContent className="p-4 flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Próxima Ação</span>
        <Badge variant="outline" className="bg-white/50 border-primary/20 text-primary font-bold">Registro de Ponto</Badge>
      </CardContent>
    </Card>
  </div>
);
