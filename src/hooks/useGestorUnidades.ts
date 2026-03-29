import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export function useGestorUnidades(userId?: string) {
  return useQuery({
    queryKey: ["gestor-unidades", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestor_unidades")
        .select("unidade_trabalho_id")
        .eq("user_id", userId!);

      if (error) throw error;
      return data.map((d) => d.unidade_trabalho_id);
    },
  });
}

export function useUpdateGestorUnidades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, unidadesIds }: { userId: string; unidadesIds: string[] }) => {
      // Deleta vínculos antigos do usuário
      const { error: deleteError } = await supabase
        .from("gestor_unidades")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Insere os novos, se houver
      if (unidadesIds.length > 0) {
        const payload = unidadesIds.map((unidadeId) => ({
          user_id: userId,
          unidade_trabalho_id: unidadeId,
        }));
        
        const { error: insertError } = await supabase
          .from("gestor_unidades")
          .insert(payload);
          
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gestor-unidades", variables.userId] });
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
