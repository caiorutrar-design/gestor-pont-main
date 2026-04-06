import { IPontoRepository } from "../interfaces/IPontoRepository";
import { pontoDomainService } from "../../domain/ponto/services/PontoDomainService";
import { RegistroPonto } from "../../domain/ponto/entities/RegistroPonto";
import { TipoRegistro, ResultadoCalculoHoras } from "../../domain/ponto/types";

export interface RegistrarPontoInput {
  colaborador_id: string;
  user_id: string; // Para Rate Limit
  orgao_id: string;
  unidade_id?: string; // Para Geofencing
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  clientIp?: string; // Para IP Whitelist
}

export interface DetalhesHistorico {
  registros: RegistroPonto[];
  calculo: ResultadoCalculoHoras;
}

/**
 * PontoApplicationService (APPLICATION LAYER)
 * Orquestrador de Casos de Uso do Módulo de Ponto.
 * Isolado de detalhes técnicos (Supabase/DB), focado no fluxo de negócio.
 */
export class PontoApplicationService {
  constructor(private readonly repository: IPontoRepository) {}

  /**
   * UC: Registrar Batida de Ponto
   * Orquestra busca, validação de domínio, verificação de duplicidade e persistência.
   */
  async registrarBatida(input: RegistrarPontoInput): Promise<RegistroPonto> {
    // 0. Segurança: Rate Limit (Proteção contra spam/instabilidade)
    await this.repository.verificarRateLimit(input.user_id, 30); // 30s min entre batidas

    // 1. Segurança: IP Whitelist (Opcional por Órgão)
    if (input.clientIp) {
      const orgaoConfig = await this.repository.buscarConfiguracaoOrgao(input.orgao_id);
      if (orgaoConfig?.ip_whitelist && orgaoConfig.ip_whitelist.length > 0) {
        if (!orgaoConfig.ip_whitelist.includes(input.clientIp)) {
          throw new Error(`Acesso Negado: Seu IP (${input.clientIp}) não está autorizado para registro de ponto neste órgão.`);
        }
      }
    }

    // 2. Segurança: Geofencing (Opcional por Unidade)
    if (input.unidade_id && input.latitude && input.longitude) {
      const unidade = await this.repository.buscarUnidade(input.unidade_id);
      if (unidade?.latitude && unidade?.longitude) {
        pontoDomainService.validarGeolocalizacao(
          input.latitude, 
          input.longitude, 
          unidade.latitude, 
          unidade.longitude, 
          unidade.raio_permitido
        );
      }
    }

    // 3. Recuperar Estado Anterior (Infra -> Domínio)
    const ultimoRegistro = await this.repository.buscarUltimoRegistro(
      input.colaborador_id,
      input.orgao_id
    );

    // 4. Determinar Próximo Tipo de Batida (Domínio)
    const tipoDesejado = pontoDomainService.determinarProximaBatida(ultimoRegistro);

    // 5. Criar Entidade de Domínio
    const novoRegistro = new RegistroPonto({
      colaborador_id: input.colaborador_id,
      orgao_id: input.orgao_id,
      timestamp_registro: input.timestamp,
      tipo: tipoDesejado,
      latitude: input.latitude,
      longitude: input.longitude
    });

    // 6. Validar Regras de Negócio (Domínio)
    // Lança exceção se violar intervalo de 5min, alternância, etc.
    pontoDomainService.validarNovaBatida(novoRegistro, ultimoRegistro);

    // 7. Validar Duplicidade Física (Infra)
    const isDuplicado = await this.repository.validarDuplicidade(
      input.colaborador_id,
      input.timestamp
    );

    if (isDuplicado) {
      throw new Error("Já existe um registro de ponto para este exato momento.");
    }

    // 6. Persistência (Domínio -> Infra)
    return await this.repository.salvarRegistro(novoRegistro);
  }

  /**
   * UC: Consultar Histórico e Saldo Diário
   * Orquestra busca e motor de cálculo.
   */
  async listarHistorico(
    colaborador_id: string, 
    dataInicio: Date, 
    dataFim: Date
  ): Promise<DetalhesHistorico> {
    // 1. Buscar Registros (Infra)
    const registros = await this.repository.listarRegistrosPorPeriodo(
      colaborador_id,
      dataInicio,
      dataFim
    );

    // 2. Processar Cálculos (Domínio)
    const calculo = pontoDomainService.calcularHorasTrabalhadas(registros);

    return {
      registros,
      calculo
    };
  }
}
