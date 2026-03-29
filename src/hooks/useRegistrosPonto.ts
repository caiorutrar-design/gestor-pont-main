import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export interface RegistroPonto {
  id: string;
  colaborador_id: string;
  data_registro: string;
  hora_registro: string;
  timestamp_registro: string;
  tipo: string;
  created_at: string;
  colaborador?: {
    id: string;
    nome_completo: string;
    matricula: string;
    cargo: string;
    orgao_id: string;
    lotacao_id: string | null;
    orgao?: { id: string; nome: string; sigla: string | null };
    lotacao?: { id: string; nome: string };
  };
}

export function useRegistrosPonto(filters?: {
  colaboradorId?: string;
  dataInicio?: string;
  dataFim?: string;
  orgaoId?: string;
  lotacaoId?: string;
}) {
  return useQuery({
    queryKey: ["registros-ponto", filters],
    queryFn: async () => {
      let query = supabase
        .from("registros_ponto")
        .select("*, colaborador:colaboradores(id, nome_completo, matricula, cargo, orgao_id, lotacao_id, orgao:orgaos(*), lotacao:lotacoes(*))")
        .order("timestamp_registro", { ascending: false });

      if (filters?.colaboradorId) {
        query = query.eq("colaborador_id", filters.colaboradorId);
      }
      if (filters?.dataInicio) {
        query = query.gte("data_registro", filters.dataInicio);
      }
      if (filters?.dataFim) {
        query = query.lte("data_registro", filters.dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by orgao/lotacao client-side (joined data)
      let results = data as RegistroPonto[];
      if (filters?.orgaoId) {
        results = results.filter((r) => r.colaborador?.orgao_id === filters.orgaoId);
      }
      if (filters?.lotacaoId) {
        results = results.filter((r) => r.colaborador?.lotacao_id === filters.lotacaoId);
      }

      return results;
    },
  });
}

export function useUpdateRegistroPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; tipo?: string; hora_registro?: string }) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from("registros_ponto")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
      toast.success("Registro atualizado!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useDeleteRegistroPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("registros_ponto").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
      toast.success("Registro removido!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
