import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para verificar se uma feature flag está ativa.
 * Suporta filtragem por orgao_id para rollout gradual.
 */
export const useFeatureFlag = (key: string, orgaoId?: string) => {
  return useQuery({
    queryKey: ["feature-flags", key, orgaoId],
    queryFn: async () => {
      let query = supabase
        .from("feature_flags")
        .select("enabled")
        .eq("key", key);

      if (orgaoId) {
        query = query.or(`orgao_id.is.null,orgao_id.eq.${orgaoId}`);
      } else {
        query = query.is("orgao_id", null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`Erro ao buscar feature flag ${key}:`, error);
        return false;
      }

      return data?.enabled ?? false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};
