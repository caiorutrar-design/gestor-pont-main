import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador, ColaboradorForm } from "@/types/database";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

interface UseColaboradoresOptions {
  orgaoId?: string;
  lotacaoId?: string;
  apenasAtivos?: boolean;
}

export function useColaboradores(options: UseColaboradoresOptions = {}) {
  const { orgaoId, lotacaoId, apenasAtivos } = options;
  
  return useQuery({
    queryKey: ["colaboradores", orgaoId, lotacaoId, apenasAtivos],
    queryFn: async () => {
      let query = supabase
        .from("colaboradores")
        .select("*, orgao:orgaos(*), lotacao:lotacoes(*)")
        .order("nome_completo");
      
      if (orgaoId) {
        query = query.eq("orgao_id", orgaoId);
      }
      
      if (lotacaoId) {
        query = query.eq("lotacao_id", lotacaoId);
      }
      
      if (apenasAtivos) {
        query = query.eq("ativo", true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (colaborador: ColaboradorForm) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .insert(colaborador)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...colaborador }: ColaboradorForm & { id: string }) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .update(colaborador)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useToggleColaboradorStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .update({ ativo })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(data.ativo ? "Colaborador ativado!" : "Colaborador inativado!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
