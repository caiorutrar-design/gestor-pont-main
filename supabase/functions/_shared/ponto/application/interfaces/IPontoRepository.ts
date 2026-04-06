import { RegistroPonto } from "../../entities/RegistroPonto.ts";

export interface IPontoRepository {
  buscarUltimoRegistro(colaborador_id: string, orgao_id: string): Promise<RegistroPonto | null>;
  listarRegistrosPorPeriodo(colaborador_id: string, dataInicio: Date, dataFim: Date): Promise<RegistroPonto[]>;
  salvarRegistro(registro: RegistroPonto): Promise<RegistroPonto>;
  validarDuplicidade(colaborador_id: string, timestamp: Date): Promise<boolean>;
  buscarConfiguracaoOrgao(orgao_id: string): Promise<{ ip_whitelist: string[] } | null>;
  buscarUnidade(unidade_id: string): Promise<{ latitude: number | null, longitude: number | null, raio_permitido: number } | null>;
  verificarRateLimit(user_id: string, segundos: number): Promise<void>;
}
