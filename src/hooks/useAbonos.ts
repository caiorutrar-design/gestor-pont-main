import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";
import { useAuth } from "@/contexts/AuthContext";

export interface Abono {
  id: string;
  colaborador_id: string;
  data_abono: string;
  motivo: string;
  concedido_por: string | null;
  created_at: string;
  colaborador?: { id: string; nome_completo: string; matricula: string };
}

export function useAbonos(colaboradorId?: string) {
  return useQuery({
    queryKey: ["abonos", colaboradorId],
    queryFn: async () => {
      let query = supabase
        .from("abonos")
        .select("*, colaborador:colaboradores(id, nome_completo, matricula)")
        .order("data_abono", { ascending: false });
      if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Abono[];
    },
  });
}

export function useCreateAbono() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { colaborador_id: string; data_abono: string; motivo: string }) => {
      const { error } = await supabase.from("abonos").insert({
        ...data,
        concedido_por: user?.id,
      });
      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email,
        action_type: "abono_criado",
        entity_type: "abono",
        entity_id: data.colaborador_id,
        details: { data_abono: data.data_abono, motivo: data.motivo },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abonos"] });
      toast.success("Abono registrado com sucesso!");
    },
    onError: (error: Error) => toast.error(mapSecurityError(error)),
  });
}
