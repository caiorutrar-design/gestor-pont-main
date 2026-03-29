import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";
import { useAuth } from "@/contexts/AuthContext";

export interface Justificativa {
  id: string;
  colaborador_id: string;
  data_falta: string;
  descricao: string;
  anexo_url: string | null;
  anexo_nome: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
  colaborador?: { id: string; nome_completo: string; matricula: string };
}

export function useJustificativas(colaboradorId?: string) {
  return useQuery({
    queryKey: ["justificativas", colaboradorId],
    queryFn: async () => {
      let query = supabase
        .from("justificativas")
        .select("*, colaborador:colaboradores(id, nome_completo, matricula)")
        .order("data_falta", { ascending: false });
      if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Justificativa[];
    },
  });
}

export function useCreateJustificativa() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      colaborador_id: string;
      data_falta: string;
      descricao: string;
      file?: File;
    }) => {
      let anexo_url: string | null = null;
      let anexo_nome: string | null = null;

      if (data.file) {
        const ext = data.file.name.split(".").pop();
        const filePath = `${data.colaborador_id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("justificativas-anexos")
          .upload(filePath, data.file);
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("justificativas-anexos")
          .getPublicUrl(filePath);
        anexo_url = urlData.publicUrl;
        anexo_nome = data.file.name;
      }

      const { error } = await supabase.from("justificativas").insert({
        colaborador_id: data.colaborador_id,
        data_falta: data.data_falta,
        descricao: data.descricao,
        anexo_url,
        anexo_nome,
        registrado_por: user?.id,
      });
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        user_email: user?.email,
        action_type: "justificativa_criada",
        entity_type: "justificativa",
        entity_id: data.colaborador_id,
        details: { data_falta: data.data_falta, descricao: data.descricao, anexo_nome },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas"] });
      toast.success("Justificativa registrada com sucesso!");
    },
    onError: (error: Error) => toast.error(mapSecurityError(error)),
  });
}
