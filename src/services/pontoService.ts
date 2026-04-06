import { supabase } from "@/integrations/supabase/client";
import { RegistroPonto } from "@/domain/ponto/entities/RegistroPonto";
import { TipoRegistro } from "@/domain/ponto/types";

export interface RegistrarPontoPayload {
  matricula: string;
  senha_ponto: string;
  latitude?: number;
  longitude?: number;
}

/**
 * PontoService (FRONTEND SERVICE LAYER)
 * Centraliza toda a comunicação com o backend (Edge Functions / API).
 */
export const pontoService = {
  async registrarPonto(payload: RegistrarPontoPayload) {
    const { data, error } = await supabase.functions.invoke("registrar-ponto", {
      body: payload
    });
    if (error) throw new Error(`Falha de rede: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async getHistory(filters: { colaboradorId?: string; dataInicio?: string; dataFim?: string; orgaoId?: string }): Promise<RegistroPonto[]> {
    let query = supabase
      .from("registros_ponto")
      .select("*, colaborador:colaboradores(nome_completo, matricula), orgao:orgaos(nome)")
      .order("timestamp_registro", { ascending: false });

    if (filters.colaboradorId) query = query.eq("colaborador_id", filters.colaboradorId);
    if (filters.dataInicio) query = query.gte("data_registro", filters.dataInicio);
    if (filters.dataFim) query = query.lte("data_registro", filters.dataFim);
    if (filters.orgaoId) query = query.eq("orgao_id", filters.orgaoId);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar histórico: ${error.message}`);

    return (data || []).map(row => new RegistroPonto({
      id: row.id,
      colaborador_id: row.colaborador_id,
      orgao_id: (row as any).orgao_id || "",
      unidade_trabalho_id: (row as any).unidade_trabalho_id || undefined,
      timestamp_registro: new Date(row.timestamp_registro),
      hora_registro: (row as any).hora_registro || undefined,
      tipo: row.tipo as TipoRegistro,
      latitude: row.latitude || undefined,
      longitude: row.longitude || undefined,
      colaborador: row.colaborador ? {
        nome_completo: (row.colaborador as any).nome_completo,
        matricula: (row.colaborador as any).matricula
      } : undefined,
      orgao: row.orgao ? {
        nome: (row.orgao as any).nome
      } : undefined
    }));
  },

  async getLastRecord(colaboradorId: string): Promise<RegistroPonto | null> {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .order("timestamp_registro", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Falha ao buscar estado: ${error.message}`);
    if (!data) return null;

    return new RegistroPonto({
      id: data.id,
      colaborador_id: data.colaborador_id,
      orgao_id: (data as any).orgao_id || "",
      timestamp_registro: new Date(data.timestamp_registro),
      tipo: data.tipo as TipoRegistro,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined
    });
  },

  async updateRegistro(id: string, data: Partial<{ tipo: TipoRegistro; hora_registro: string }>) {
    const { data: result, error } = await supabase
      .from("registros_ponto")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Falha ao atualizar: ${error.message}`);
    return result;
  },

  async deleteRegistro(id: string) {
    const { error } = await supabase.from("registros_ponto").delete().eq("id", id);
    if (error) throw new Error(`Falha ao remover: ${error.message}`);
  }
};
