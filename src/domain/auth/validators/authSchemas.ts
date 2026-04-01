import { z } from "zod";

/**
 * Domain: AUTH
 * Regras de validação centralizadas para Autenticação.
 * Suporta tanto E-mail quanto Matrícula via 'identifier'.
 */
export const loginSchema = z.object({
  identifier: z.string().min(3, "O identificador deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
