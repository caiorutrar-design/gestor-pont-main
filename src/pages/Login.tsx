import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema, LoginInput } from "@/domain/auth/validators/authSchemas";

type LoginFormValues = LoginInput;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    const email = values.identifier.includes("@")
      ? values.identifier
      : `${values.identifier}@ponto.interno`;

    const { error } = await signIn(email, values.password);

    if (error) {
      const isMatricula = !values.identifier.includes("@");
      toast({
        title: "Erro ao entrar",
        description:
          error.message === "Invalid login credentials"
            ? isMatricula
              ? "Matrícula ou senha incorreta. Verifique se sua conta foi criada pelo administrador."
              : "Email ou senha incorretos."
            : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleData?.role === "user") {
          const { data: colab } = await supabase
            .from("colaboradores")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (colab) {
            navigate("/meu-ponto");
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      // Fallback to default redirect
    }

    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-primary/5 -skew-y-6 -translate-y-1/2 rounded-[5rem] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/[0.03] rounded-full blur-3xl -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        className="w-full max-w-md relative"
      >
        <div className="glass-bg border glass-border rounded-[2.5rem] shadow-premium p-8 sm:p-10 relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary to-orange-500" />
          
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white/80 p-3 rounded-2xl shadow-sm border border-slate-100 backdrop-blur-sm">
                <img 
                  src="/logo-gov-ma.png" 
                  alt="Governo do Maranhão" 
                  className="h-10 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              </div>
            </motion.div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <h1 className="font-['Montserrat'] font-[900] text-primary text-5xl leading-none tracking-tighter">
                  PROCON
                </h1>
                <span className="font-['Montserrat'] font-black text-secondary text-2xl tracking-[0.1em] self-end mb-1 opacity-90">
                  MA
                </span>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2 flex items-center justify-center gap-2">
                <div className="h-px w-4 bg-slate-200" />
                Gestão Portuária
                <div className="h-px w-4 bg-slate-200" />
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail ou Matrícula</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 123456"
                          disabled={loading}
                          className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:bg-white focus:ring-primary/20 transition-all text-base font-bold shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wide" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Chave de Segurança</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={loading}
                          className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:bg-white focus:ring-primary/20 transition-all text-base font-bold tracking-[0.5em] shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wide" />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-secondary hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-slate-200 transition-all active:scale-[0.98] group" 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      Acessar Sistema
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-col items-center gap-4 border-t border-slate-100 pt-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
               <ShieldCheck className="h-3.5 w-3.5 text-success" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ambiente Monitorado</span>
            </div>
            
            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Primeiro acesso?{" "}
              <Link
                to="/cadastro"
                className="text-primary hover:text-red-700 transition-colors border-b-2 border-primary/20 hover:border-primary/60 pb-0.5 ml-1"
              >
                Criar Nova Conta
              </Link>
            </p>
          </motion.div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
          © {new Date().getFullYear()} PROCON MA • Departamento de TI
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
