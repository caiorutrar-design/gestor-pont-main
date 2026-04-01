import { z } from "https://deno.land/x/zod/mod.ts";

/**
 * Domain: PONTO (Shared)
 * Regras de validação centralizadas para Registro de Ponto.
 */
export const registrarPontoSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  senha_ponto: z.string().min(6, "A senha de ponto deve ter pelo menos 6 caracteres"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type RegistrarPontoInputSchema = z.infer<typeof registrarPontoSchema>;
