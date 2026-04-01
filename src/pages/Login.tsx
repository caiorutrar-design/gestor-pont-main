import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="mb-6 transform transition-transform hover:scale-105 duration-300">
              <div className="bg-white p-2 rounded-lg shadow-md border border-slate-100">
                <img 
                  src="/logo-gov-ma.png" 
                  alt="Governo do Maranhão" 
                  className="h-12 object-contain"
                />
              </div>
            </div>
            
            <div className="flex flex-col items-center mb-2">
              <h1 className="font-['Montserrat'] font-[900] text-[#C51B29] text-4xl leading-none tracking-tighter">
                PROCON
              </h1>
              <span className="font-['Montserrat'] font-bold text-[#C51B29] text-xl tracking-[0.2em] -mt-1 opacity-80">
                MA
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-500 mt-2 text-center">
              Sistema de Gestão de Frequência
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ou Matrícula</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com ou matrícula"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="text-primary hover:underline font-medium"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
