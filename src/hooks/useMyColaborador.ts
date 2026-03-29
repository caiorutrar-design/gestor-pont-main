import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMyColaborador() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-colaborador", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("colaboradores")
        .select("*, orgao:orgaos(*), lotacao:lotacoes(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useMyRegistrosPonto(colaboradorId?: string, dataRegistro?: string) {
  return useQuery({
    queryKey: ["my-registros-ponto", colaboradorId, dataRegistro],
    queryFn: async () => {
      let query = supabase
        .from("registros_ponto")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("timestamp_registro", { ascending: false });

      if (dataRegistro) {
        query = query.eq("data_registro", dataRegistro);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useMyRegistrosPontoPeriodo(colaboradorId?: string, dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ["my-registros-periodo", colaboradorId, dataInicio, dataFim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .gte("data_registro", dataInicio!)
        .lte("data_registro", dataFim!)
        .order("timestamp_registro", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!colaboradorId && !!dataInicio && !!dataFim,
  });
}
