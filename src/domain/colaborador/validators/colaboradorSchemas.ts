import { z } from "zod";

/**
 * Domain: COLABORADOR
 * Regras de validação centralizadas para Gestão de Colaboradores.
 */
export const colaboradorSchema = z.object({
  nome_completo: z.string().min(1, "O nome completo é obrigatório"),
  matricula: z.string().min(1, "A matrícula é obrigatória"),
  cargo: z.string().min(1, "O cargo é obrigatório"),
  tipo_colaborador: z.string().min(1, "O tipo de colaborador é obrigatório"),
  orgao_id: z.string().uuid("Selecione um órgão válido"),
  lotacao_id: z.string().uuid("Selecione uma lotação válida").nullable(),
  email: z.string().email("Digite um e-mail válido").optional().nullable(),
  telefone: z.string().optional().nullable(),
});

export type ColaboradorInput = z.infer<typeof colaboradorSchema>;
