import { RegistroPonto } from "../entities/RegistroPonto";
import { TipoRegistro, ResultadoCalculoHoras } from "../types";

export class PontoDomainService {
  private static readonly INTERVALO_MINIMO_MINUTOS = 5;

  /**
   * Valida se a geolocalização da batida está dentro do raio permitido da unidade
   */
  public validarGeolocalizacao(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number, 
    raioMaximoMetros: number
  ): void {
    const distancia = this.calcularDistancia(lat1, lon1, lat2, lon2);
    
    if (distancia > raioMaximoMetros) {
        throw new Error(`Localização Inválida: Você está fora do raio permitido (${Math.round(distancia)}m da unidade). O limite é ${raioMaximoMetros}m.`);
    }
  }

  /**
   * Calcula distância entre dois pontos (Haversine Formula) em metros
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Valida uma nova batida em relação ao histórico recente
   */
  public validarNovaBatida(nova: RegistroPonto, ultimo: RegistroPonto | null | undefined): void {
    if (!ultimo) return;

    // Regra 1: Alternância
    if (nova.ehDoMesmoTipo(ultimo)) {
      throw new Error(`Ação Inválida: Já existe um registro de ${nova.tipo.toUpperCase()} realizado às ${ultimo.timestamp_registro.toLocaleTimeString()}.`);
    }

    // Regra 2: Cronologia
    if (nova.timestamp_registro <= ultimo.timestamp_registro) {
      throw new Error(`Erro Cronológico: O horário da nova batida deve ser posterior ao último registro.`);
    }

    // Regra 3: Intervalo Mínimo (5 min)
    const diff = nova.diferencaEmMinutos(ultimo);
    if (diff < PontoDomainService.INTERVALO_MINIMO_MINUTOS) {
      throw new Error(`Intervalo Curto: Aguarde pelo menos ${PontoDomainService.INTERVALO_MINIMO_MINUTOS} minutos entre as batidas.`);
    }
  }

  /**
   * Determina qual deve ser o próximo tipo de batida com base na última
   */
  public determinarProximaBatida(ultimo: RegistroPonto | null | undefined): TipoRegistro {
    if (!ultimo || ultimo.tipo === TipoRegistro.SAIDA) {
      return TipoRegistro.ENTRADA;
    }
    return TipoRegistro.SAIDA;
  }

  /**
   * Calcula horas trabalhadas pareando entradas e saídas
   * Ignora registros desordenados ou duplas entradas/saídas
   */
  public calcularHorasTrabalhadas(registros: RegistroPonto[]): ResultadoCalculoHoras {
    // 1. Ordenar por timestamp
    const ordenados = [...registros].sort((a, b) => a.timestamp_registro.getTime() - b.timestamp_registro.getTime());
    
    let totalMinutos = 0;
    let quantidadeEntradas = 0;
    let quantidadeSaidas = 0;
    const inconsistencias: string[] = [];

    for (let i = 0; i < ordenados.length; i++) {
        const atual = ordenados[i];
        
        if (atual.tipo === TipoRegistro.ENTRADA) {
            quantidadeEntradas++;
            const proximo = ordenados[i + 1];
            
            if (proximo && proximo.tipo === TipoRegistro.SAIDA) {
                totalMinutos += atual.diferencaEmMinutos(proximo);
                quantidadeSaidas++;
                i++; // Salta a saída pareada
            } else {
                inconsistencias.push(`Entrada em ${atual.timestamp_registro.toLocaleString()} sem saída correspondente.`);
            }
        } else {
            quantidadeSaidas++;
            inconsistencias.push(`Saída em ${atual.timestamp_registro.toLocaleString()} sem entrada correspondente.`);
        }
    }

    return {
      totalMinutos,
      formatado: this.formatarHoras(totalMinutos),
      quantidadeEntradas,
      quantidadeSaidas,
      inconsistencias
    };
  }

  private formatarHoras(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;
    return `${horas}h ${minRestantes.toString().padStart(2, '0')}m`;
  }
}

export const pontoDomainService = new PontoDomainService();
