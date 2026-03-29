import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export interface UnidadeTrabalho {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
  orgao_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  orgao?: { id: string; nome: string; sigla: string | null };
}

export interface UnidadeTrabalhoForm {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
  orgao_id: string;
  ativo: boolean;
}

export function useUnidadesTrabalho(orgaoId?: string) {
  return useQuery({
    queryKey: ["unidades-trabalho", orgaoId],
    queryFn: async () => {
      let query = supabase
        .from("unidades_trabalho")
        .select("*, orgao:orgaos(id, nome, sigla)")
        .order("nome");

      if (orgaoId) {
        query = query.eq("orgao_id", orgaoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UnidadeTrabalho[];
    },
  });
}

export function useCreateUnidadeTrabalho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: UnidadeTrabalhoForm) => {
      const { data, error } = await supabase
        .from("unidades_trabalho")
        .insert(form)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades-trabalho"] });
      toast.success("Unidade de trabalho criada!");
    },
    onError: (e: Error) => toast.error(mapSecurityError(e)),
  });
}

export function useUpdateUnidadeTrabalho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: UnidadeTrabalhoForm & { id: string }) => {
      const { data, error } = await supabase
        .from("unidades_trabalho")
        .update(form)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades-trabalho"] });
      toast.success("Unidade atualizada!");
    },
    onError: (e: Error) => toast.error(mapSecurityError(e)),
  });
}

export function useDeleteUnidadeTrabalho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades_trabalho").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades-trabalho"] });
      toast.success("Unidade removida!");
    },
    onError: (e: Error) => toast.error(mapSecurityError(e)),
  });
}
