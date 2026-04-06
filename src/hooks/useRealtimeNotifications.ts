import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const useRealtimeNotifications = (orgaoId?: string) => {
  useEffect(() => {
    if (!orgaoId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registros_ponto',
          filter: `orgao_id=eq.${orgaoId}`,
        },
        async (payload) => {
          const newRecord = payload.new;
          
          // Buscar nome do colaborador para o toast (opcional mas recomendado)
          const { data: colab } = await supabase
            .from('colaboradores')
            .select('nome_completo')
            .eq('id', newRecord.colaborador_id)
            .single();

          const nome = colab?.nome_completo || "Colaborador";
          const tipo = newRecord.tipo === 'entrada' ? 'Entrada' : 'Saída';
          const hora = format(new Date(newRecord.timestamp_registro), "HH:mm");

          toast(`🔔 Ponto Registrado: ${nome}`, {
            description: `${tipo} realizada às ${hora}`,
            action: {
              label: "Ver Detalhes",
              onClick: () => window.location.href = `/gerenciar-pontos`
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgaoId]);
};
