import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pontoService } from "@/services/pontoService";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";
import { TipoRegistro } from "@/domain/ponto/types";

export function useRegistrosPonto(filters: {
  colaboradorId?: string;
  dataInicio?: string;
  dataFim?: string;
  orgaoId?: string;
  lotacaoId?: string;
} = {}) {
  return useQuery({
    queryKey: ["registros-ponto", filters],
    queryFn: async () => {
      return await pontoService.getHistory(filters);
    },
    staleTime: 2 * 60 * 1000,   // 2 min: histórico não muda com frequência
    gcTime: 15 * 60 * 1000,     // 15 min em cache após unmount
    enabled: !!filters.colaboradorId || !!filters.orgaoId, // Não busca sem filtro
  });
}

export function useUpdateRegistroPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; tipo?: TipoRegistro; hora_registro?: string }) => {
      const { id, ...updateData } = data;
      return await pontoService.updateRegistro(id, updateData);
    },
    onSuccess: () => {
      // Invalida histórico E status para UI refletir imediatamente
      queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-status"] });
      queryClient.invalidateQueries({ queryKey: ["frequencia-mensal"] });
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
      await pontoService.deleteRegistro(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-status"] });
      queryClient.invalidateQueries({ queryKey: ["frequencia-mensal"] });
      toast.success("Registro removido!");
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
