/**
 * AuditService (INFRASTRUCTURE)
 * Registra eventos de negócio críticos no audit_logs via Service Role.
 * 
 * Regras:
 * - NUNCA lança exceção — auditoria não pode interromper fluxo principal
 * - Payload mínimo necessário — sem PII sensível, sem senhas
 * - Triggers do banco cobrem INSERT/UPDATE/DELETE automático
 * - Este service cobre eventos de negócio (Login, Security Block, etc.)
 */

export type AuditAction =
  | "PONTO_REGISTRADO"
  | "PONTO_EDITADO"
  | "PONTO_EXCLUIDO"
  | "COLABORADOR_CRIADO"
  | "COLABORADOR_ATUALIZADO"
  | "COLABORADOR_EXCLUIDO"
  | "LOGIN_SUCESSO"
  | "LOGIN_FALHA"
  | "SECURITY_BLOCK_GEO"
  | "SECURITY_BLOCK_IP"
  | "SECURITY_BLOCK_RATE_LIMIT";

export type AuditEntity =
  | "registros_ponto"
  | "colaboradores"
  | "auth"
  | "unidades_trabalho"
  | "security";

export interface AuditLogPayload {
  action: AuditAction;
  entity: AuditEntity;
  entity_id?: string;
  user_id?: string;
  orgao_id?: string;
  ip_address?: string;
  payload?: Record<string, unknown>;
}

export class AuditService {
  constructor(private readonly supabase: any) {}

  /**
   * Registra um evento de auditoria.
   * NUNCA lança exceção — falha silenciosa com WARNING no console.
   */
  async log(entry: AuditLogPayload): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("insert_audit_log", {
        p_user_id:   entry.user_id   ?? null,
        p_orgao_id:  entry.orgao_id  ?? null,
        p_action:    entry.action,
        p_entity:    entry.entity,
        p_entity_id: entry.entity_id ?? null,
        p_payload:   entry.payload    ?? {},
        p_ip:        entry.ip_address ?? null,
      });

      if (error) {
        console.warn(`[AUDIT WARNING] Falha ao registrar log: ${error.message}`, entry.action);
      }
    } catch (err) {
      // Auditoria nunca pode interromper o fluxo principal
      console.warn(`[AUDIT ERROR] Exceção não esperada:`, err);
    }
  }

  // ── Helpers semânticos para os eventos mais comuns ──────────────────────

  async logPontoRegistrado(opts: {
    user_id: string;
    orgao_id: string;
    colaborador_id: string;
    tipo: string;
    timestamp: string;
    ip?: string;
  }) {
    return this.log({
      action: "PONTO_REGISTRADO",
      entity: "registros_ponto",
      user_id: opts.user_id,
      orgao_id: opts.orgao_id,
      ip_address: opts.ip,
      payload: {
        colaborador_id: opts.colaborador_id,
        tipo: opts.tipo,
        timestamp: opts.timestamp,
      },
    });
  }

  async logSecurityBlock(opts: {
    action: "SECURITY_BLOCK_GEO" | "SECURITY_BLOCK_IP" | "SECURITY_BLOCK_RATE_LIMIT";
    orgao_id: string;
    matricula: string;
    reason: string;
    ip?: string;
  }) {
    return this.log({
      action: opts.action,
      entity: "security",
      orgao_id: opts.orgao_id,
      ip_address: opts.ip,
      payload: {
        matricula: opts.matricula,
        reason: opts.reason,
      },
    });
  }

  async logLogin(opts: {
    user_id?: string;
    email: string;
    success: boolean;
    ip?: string;
  }) {
    return this.log({
      action: opts.success ? "LOGIN_SUCESSO" : "LOGIN_FALHA",
      entity: "auth",
      user_id: opts.user_id,
      ip_address: opts.ip,
      payload: {
        email: opts.email, // Email é necessário para investigação de tentativas suspeitas
      },
    });
  }
}
