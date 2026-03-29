import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";
import { useAuth } from "@/contexts/AuthContext";

export interface Ferias {
  id: string;
  colaborador_id: string;
  data_inicio: string;
  data_fim: string;
  tipo: string;
  observacao: string | null;
  aprovado_por: string | null;
  created_at: string;
  colaborador?: { id: string; nome_completo: string; matricula: string };
}

export function useFerias(colaboradorId?: string) {
  return useQuery({
    queryKey: ["ferias", colaboradorId],
    queryFn: async () => {
      let query = supabase
        .from("ferias")
        .select("*, colaborador:colaboradores(id, nome_completo, matricula)")
        .order("data_inicio", { ascending: false });
      if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Ferias[];
    },
  });
}

export function useCreateFerias() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      colaborador_id: string;
      data_inicio: string;
      data_fim: string;
      tipo: "ferias_anuais" | "ferias_premio" | "licenca" | "recesso";
      observacao?: string;
    }) => {
      const { error } = await supabase.from("ferias").insert({
        colaborador_id: data.colaborador_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        tipo: data.tipo,
        observacao: data.observacao,
        aprovado_por: user?.id,
      });
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email,
        action_type: "ferias_concedida",
        entity_type: "ferias",
        entity_id: data.colaborador_id,
        details: { data_inicio: data.data_inicio, data_fim: data.data_fim, tipo: data.tipo },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias"] });
      toast.success("Férias registradas com sucesso!");
    },
    onError: (error: Error) => toast.error(mapSecurityError(error)),
  });
}
