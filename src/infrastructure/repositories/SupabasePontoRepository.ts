import { supabase } from "../../integrations/supabase/client";
import { IPontoRepository } from "../../application/interfaces/IPontoRepository";
import { RegistroPonto } from "../../domain/ponto/entities/RegistroPonto";
import { TipoRegistro } from "../../domain/ponto/types";

/**
 * SupabasePontoRepository (INFRASTRUCTURE ADAPTER)
 * Implementação concreta do IPontoRepository utilizando o cliente Supabase.
 * Responsável pela conversão entre o Modelo de Persistência e o Modelo de Domínio.
 */
export class SupabasePontoRepository implements IPontoRepository {
  
  /**
   * Mapeia um registro do banco de dados para uma Entidade de Domínio.
   */
  private mapToEntity(row: any): RegistroPonto {
    return new RegistroPonto({
      id: row.id,
      colaborador_id: row.colaborador_id,
      orgao_id: row.orgao_id || "",
      timestamp_registro: new Date(row.timestamp_registro),
      tipo: row.tipo as TipoRegistro,
      latitude: row.latitude || undefined,
      longitude: row.longitude || undefined,
      is_orphan: !!row.is_orphan,
    });
  }

  /**
   * Mapeia uma Entidade de Domínio para o formato de inserção do banco.
   */
  private mapToRow(entity: RegistroPonto) {
    return {
      colaborador_id: entity.colaborador_id,
      orgao_id: entity.orgao_id,
      data_registro: entity.timestamp_registro.toISOString().split("T")[0],
      hora_registro: entity.timestamp_registro.toTimeString().split(" ")[0],
      timestamp_registro: entity.timestamp_registro.toISOString(),
      tipo: entity.tipo,
      latitude: entity.latitude || null,
      longitude: entity.longitude || null,
    };
  }

  async buscarUltimoRegistro(colaborador_id: string, orgao_id: string): Promise<RegistroPonto | null> {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("colaborador_id", colaborador_id)
      .order("timestamp_registro", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar último registro: ${error.message}`);
    return data ? this.mapToEntity(data) : null;
  }

  async listarRegistrosPorPeriodo(colaborador_id: string, dataInicio: Date, dataFim: Date): Promise<RegistroPonto[]> {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("colaborador_id", colaborador_id)
      .gte("timestamp_registro", dataInicio.toISOString())
      .lte("timestamp_registro", dataFim.toISOString())
      .order("timestamp_registro", { ascending: true });

    if (error) throw new Error(`Erro ao listar registros: ${error.message}`);
    return (data || []).map(row => this.mapToEntity(row));
  }

  async salvarRegistro(registro: RegistroPonto): Promise<RegistroPonto> {
    const row = this.mapToRow(registro);
    const { data, error } = await supabase
      .from("registros_ponto")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar registro de ponto: ${error.message}`);
    return this.mapToEntity(data);
  }

  async validarDuplicidade(colaborador_id: string, timestamp: Date): Promise<boolean> {
    const { count, error } = await supabase
      .from("registros_ponto")
      .select("*", { count: "exact", head: true })
      .eq("colaborador_id", colaborador_id)
      .eq("timestamp_registro", timestamp.toISOString());

    if (error) throw new Error(`Erro ao validar duplicidade: ${error.message}`);
    return (count || 0) > 0;
  }

  async buscarConfiguracaoOrgao(orgao_id: string): Promise<{ ip_whitelist: string[] } | null> {
    const { data, error } = await supabase
      .from("orgaos" as any)
      .select("ip_whitelist")
      .eq("id", orgao_id)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar config órgão: ${error.message}`);
    return data as any;
  }

  async buscarUnidade(unidade_id: string): Promise<{ latitude: number | null, longitude: number | null, raio_permitido: number } | null> {
    const { data, error } = await supabase
      .from("unidades_trabalho" as any)
      .select("latitude, longitude, raio_permitido")
      .eq("id", unidade_id)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar unidade: ${error.message}`);
    return data as any;
  }

  async verificarRateLimit(userId: string, segundos: number): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("ponto_rate_limits" as any)
      .select("last_request_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throw new Error(`Erro no Rate Limit: ${fetchError.message}`);

    const now = new Date();
    const row = data as any;
    if (row?.last_request_at) {
      const last = new Date(row.last_request_at);
      const diff = (now.getTime() - last.getTime()) / 1000;
      if (diff < segundos) {
        throw new Error(`Aguarde ${Math.ceil(segundos - diff)}s para tentar novamente.`);
      }
    }

    const { error: upsertError } = await supabase
      .from("ponto_rate_limits" as any)
      .upsert({ user_id: userId, last_request_at: now.toISOString() });

    if (upsertError) throw new Error(`Erro ao atualizar Rate Limit: ${upsertError.message}`);
  }
}
