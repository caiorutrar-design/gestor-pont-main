import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Orgao, OrgaoForm } from "@/types/database";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export function useOrgaos() {
  return useQuery({
    queryKey: ["orgaos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orgaos")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Orgao[];
    },
  });
}

export function useCreateOrgao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orgao: OrgaoForm) => {
      const { data, error } = await supabase
        .from("orgaos")
        .insert(orgao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgaos"] });
      toast.success("Órgão cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useUpdateOrgao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...orgao }: OrgaoForm & { id: string }) => {
      const { data, error } = await supabase
        .from("orgaos")
        .update(orgao)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgaos"] });
      toast.success("Órgão atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useDeleteOrgao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orgaos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgaos"] });
      toast.success("Órgão removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
