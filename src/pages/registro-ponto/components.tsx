import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, Loader2, MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Success Overlay Component
export const RegistroSuccessOverlay = ({ result, onClose, formatTime, formatDate }: any) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/95 backdrop-blur-md p-6"
    role="dialog"
    aria-labelledby="success-title"
  >
    <motion.div 
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] p-10 shadow-2xl text-center max-w-sm w-full relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-500" />
      <motion.div 
        initial={{ rotate: -15, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="h-12 w-12 text-primary" />
      </motion.div>
      
      <h2 id="success-title" className="text-2xl font-[900] text-secondary mb-2 tracking-tighter uppercase">Ponto Registrado!</h2>
      <div className="flex items-center justify-center gap-2 mb-6">
        <User className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-bold text-slate-600">{result.colaborador_nome || "Colaborador"}</p>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-4 mb-8">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status do Registro</p>
        <div className="flex items-center justify-center gap-2">
          <span className={cn("text-lg font-[900] uppercase tracking-tighter", result.tipo === "entrada" ? "text-success" : "text-orange-600")}>
            {result.tipo === "entrada" ? "Entrada Confirmada" : "Saída Confirmada"}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">{formatTime(new Date())} • {formatDate(new Date())}</p>
      </div>

      <Button 
        onClick={onClose}
        className="w-full bg-secondary hover:bg-slate-800 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[11px]"
      >
        Concluir
      </Button>
    </motion.div>
  </motion.div>
);

// 2. Geolocation Badge Component
export const GeoStatusBadge = ({ geo }: any) => {
  const getStatus = () => {
    if (geo.loading) return { 
      text: "Sincronizando Satélite...", 
      icon: Loader2, 
      color: "bg-amber-500",
      class: "text-amber-700 bg-amber-500/10 border-amber-500/20"
    };
    if (geo.latitude) return { 
      text: `Fixado (±${Math.round(geo.accuracy || 0)}m)`, 
      icon: MapPin, 
      color: "bg-emerald-500",
      class: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20"
    };
    return { 
      text: "GPS Bloqueado", 
      icon: MapPinOff, 
      color: "bg-rose-500",
      class: "text-rose-700 bg-rose-500/10 border-rose-500/20"
    };
  };
  
  const status = getStatus();
  const Icon = status.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-[900] uppercase tracking-widest backdrop-blur-md border shadow-sm transition-all duration-500", 
        status.class
      )}
    >
      <div className="relative flex items-center justify-center">
        {geo.latitude && !geo.loading && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        )}
        {geo.loading && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
        )}
        <div className={cn("relative inline-flex rounded-full h-1.5 w-1.5", status.color)} />
      </div>
      
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3", geo.loading && "animate-spin")} />
        <span className="leading-none">{status.text}</span>
      </div>
    </motion.div>
  );
};
