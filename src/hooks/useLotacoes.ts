import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lotacao, LotacaoForm } from "@/types/database";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export function useLotacoes(orgaoId?: string) {
  return useQuery({
    queryKey: ["lotacoes", orgaoId],
    queryFn: async () => {
      let query = supabase
        .from("lotacoes")
        .select("*, orgao:orgaos(*)")
        .order("nome");
      
      if (orgaoId) {
        query = query.eq("orgao_id", orgaoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Lotacao[];
    },
  });
}

export function useCreateLotacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lotacao: LotacaoForm) => {
      const { data, error } = await supabase
        .from("lotacoes")
        .insert(lotacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useUpdateLotacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...lotacao }: LotacaoForm & { id: string }) => {
      const { data, error } = await supabase
        .from("lotacoes")
        .update(lotacao)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useDeleteLotacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lotacoes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
