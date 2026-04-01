import { z } from "zod";

/**
 * Domain: AUTH / ADMIN
 * Regras de validação para Gestão de Usuários (Profiles/Roles).
 */
export const editUserSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().optional(),
  role: z.string().min(1, "O papel (role) é obrigatório"),
  unidades_selecionadas: z.array(z.string()).default([]),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
