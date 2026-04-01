import { IPontoRepository } from "../interfaces/IPontoRepository.ts";
import { pontoDomainService } from "../../services/PontoDomainService.ts";
import { RegistroPonto } from "../../entities/RegistroPonto.ts";
import { TipoRegistro, ResultadoCalculoHoras } from "../../types.ts";

export interface RegistrarPontoInput {
  colaborador_id: string;
  user_id: string;
  orgao_id: string;
  unidade_id?: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  clientIp?: string;
}

export interface DetalhesHistorico {
  registros: RegistroPonto[];
  calculo: ResultadoCalculoHoras;
}

export class PontoApplicationService {
  constructor(private readonly repository: IPontoRepository) {}

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

    const tipoDesejado = pontoDomainService.determinarProximaBatida(ultimoRegistro);

    const novoRegistro = new RegistroPonto({
      colaborador_id: input.colaborador_id,
      orgao_id: input.orgao_id,
      timestamp_registro: input.timestamp,
      tipo: tipoDesejado,
      latitude: input.latitude,
      longitude: input.longitude
    });

    pontoDomainService.validarNovaBatida(novoRegistro, ultimoRegistro);

    const isDuplicado = await this.repository.validarDuplicidade(
      input.colaborador_id,
      input.timestamp
    );

    if (isDuplicado) {
      throw new Error("Já existe um registro de ponto para este exato momento.");
    }

    return await this.repository.salvarRegistro(novoRegistro);
  }

  async listarHistorico(
    colaborador_id: string, 
    dataInicio: Date, 
    dataFim: Date
  ): Promise<DetalhesHistorico> {
    const registros = await this.repository.listarRegistrosPorPeriodo(
      colaborador_id,
      dataInicio,
      dataFim
    );

    const calculo = pontoDomainService.calcularHorasTrabalhadas(registros);

    return {
      registros,
      calculo
    };
  }
}
