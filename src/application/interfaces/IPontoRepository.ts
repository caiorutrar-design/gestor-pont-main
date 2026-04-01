import { RegistroPonto } from "../../domain/ponto/entities/RegistroPonto";

/**
 * Interface PontoRepository (PORT)
 * Define o contrato para persistência e recuperação de registros de ponto.
 * Segue os princípios da Clean Architecture, sendo independente de infraestrutura.
 */
export interface IPontoRepository {
  /**
   * Recupera a última batida válida de um colaborador em um determinado órgão.
   * Útil para decidir o próximo tipo de batida (Entrada/Saída).
   */
  buscarUltimoRegistro(
    colaborador_id: string, 
    orgao_id: string
  ): Promise<RegistroPonto | null>;

  /**
   * Lista todos os registros de um colaborador em um intervalo de tempo.
   * Utilizado para cálculos de horas trabalhadas e exibição de extrato.
   */
  listarRegistrosPorPeriodo(
    colaborador_id: string, 
    dataInicio: Date, 
    dataFim: Date
  ): Promise<RegistroPonto[]>;

  /**
   * Persiste um novo registro de ponto no repositório.
   */
  salvarRegistro(registro: RegistroPonto): Promise<RegistroPonto>;

  /**
   * Verifica se já existe um registro idêntico para o colaborador no mesmo timestamp.
   * Previne duplicidade acidental em nível de infraestrutura.
   */
  validarDuplicidade(
    colaborador_id: string, 
    timestamp: Date
  ): Promise<boolean>;

  /**
   * Métodos de Segurança Multi-tenant
   */
  buscarConfiguracaoOrgao(orgao_id: string): Promise<{ ip_whitelist: string[] } | null>;
  buscarUnidade(unidade_id: string): Promise<{ latitude: number | null, longitude: number | null, raio_permitido: number } | null>;
  verificarRateLimit(user_id: string, segundos: number): Promise<void>;
}
