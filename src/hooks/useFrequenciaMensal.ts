import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FrequenciaMensal {
  colaborador_id: string;
  orgao_id: string;
  unidade_trabalho_id: string;
  nome_completo: string;
  matricula: string;
  mes_ref: string;
  total_entradas: number;
  total_saidas: number;
  dias_trabalhados: number;
  primeiro_dia: string;
  ultimo_dia: string;
}

/**
 * Hook useFrequenciaMensal
 * Lê da materialized view mv_frequencia_mensal.
 * Cache agressivo de 5 min — MV é pré-computada e raramente muda.
 * Após escrita de ponto, invalidar com queryKey: ["frequencia-mensal"].
 */
export function useFrequenciaMensal(params: {
  colaboradorId?: string;
  orgaoId?: string;
  mesRef?: string; // formato: "YYYY-MM-01"
}) {
  return useQuery({
    queryKey: ["frequencia-mensal", params],
    queryFn: async (): Promise<FrequenciaMensal[]> => {
      let query = (supabase as any)
        .from("mv_frequencia_mensal")
        .select("*");

      if (params.colaboradorId) {
        query = query.eq("colaborador_id", params.colaboradorId);
      }
      if (params.orgaoId) {
        query = query.eq("orgao_id", params.orgaoId);
      }
      if (params.mesRef) {
        query = query.eq("mes_ref", params.mesRef);
      }

      const { data, error } = await query.order("mes_ref", { ascending: false });
      if (error) throw new Error(`Erro ao buscar frequência mensal: ${error.message}`);
      return data ?? [];
    },
    enabled: !!(params.colaboradorId || params.orgaoId),
    staleTime: 5 * 60 * 1000,    // 5 min: MV é pré-computada, dados são estáveis
    gcTime: 30 * 60 * 1000,      // 30 min em cache (leitura pesada, vale guardar)
    refetchOnWindowFocus: false,  // Não refetch desnecessário (dado estável)
  });
}

/**
 * Hook para forçar refresh da MV após escrita
 * Uso: const { refreshMV } = useRefreshFrequencia();
 *      await refreshMV(); // após registrarPonto()
 */
export function useRefreshFrequencia() {
  const queryClient = useQueryClient();

  const refreshMV = async () => {
    // 1. Invalida cache local para forçar re-fetch
    queryClient.invalidateQueries({ queryKey: ["frequencia-mensal"] });

    // 2. Dispara refresh da materialized view no backend (via RPC)
    try {
      await (supabase as any).rpc("refresh_mv_frequencia");
    } catch {
      // Falha silenciosa: dados serão atualizados no próximo ciclo
      console.warn("[useRefreshFrequencia] MV refresh falhou — cache local invalidado.");
    }
  };

  return { refreshMV };
}
