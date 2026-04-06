import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { pontoDomainService } from "@/domain/ponto/services/PontoDomainService";
import { TipoRegistro } from "@/domain/ponto/types";
import { pontoService } from "@/services/pontoService";

/**
 * Hook usePontoStatus (REFATORADO — React Query)
 * Usa cache centralizado com staleTime de 30s (quase tempo-real).
 * O countdown do cooldown permanece como estado local (é apenas UI).
 */
export function usePontoStatus(colaboradorId: string | undefined) {
  const [cooldown, setCooldown] = useState(0);
  const [podeRegistrar, setPodeRegistrar] = useState(false);

  // Query com cache de 30s — status de ponto é dado semi-real-time
  const { data: ultimoRegistro, isLoading: loading, refetch: refreshStatus } = useQuery({
    queryKey: ["ponto-status", colaboradorId],
    queryFn: () => pontoService.getLastRecord(colaboradorId!),
    enabled: !!colaboradorId,
    staleTime: 30 * 1000,         // 30s: status "fresco" por 30s após fetch
    gcTime: 5 * 60 * 1000,        // 5 min em cache após unmount
    refetchInterval: 60 * 1000,   // Background refetch a cada 60s
    refetchOnWindowFocus: true,   // Atualiza ao voltar para a aba (dado crítico)
  });

  // Calcula próxima ação e cooldown com base nos dados do cache
  const proximaAcao = pontoDomainService.determinarProximaBatida(ultimoRegistro ?? undefined);

  useEffect(() => {
    if (!ultimoRegistro) {
      setCooldown(0);
      setPodeRegistrar(true);
      return;
    }
    const diff = Math.floor((Date.now() - new Date(ultimoRegistro.timestamp_registro).getTime()) / 1000);
    const remaining = Math.max(0, 300 - diff); // cooldown de 5 min
    setCooldown(remaining);
    setPodeRegistrar(remaining === 0);
  }, [ultimoRegistro]);

  // Countdown local (apenas UI, não precisa de React Query)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { setPodeRegistrar(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return {
    ultimoRegistro,
    proximaAcao,
    cooldown,
    podeRegistrar,
    loading,
    refreshStatus,
  };
}
