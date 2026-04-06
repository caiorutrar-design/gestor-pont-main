/**
 * Shared Ponto Domain Types (Deno/Edge Functions)
 */

export enum TipoRegistro {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

export interface RegistroPontoProps {
  id?: string;
  colaborador_id: string;
  orgao_id: string;
  timestamp_registro: Date;
  tipo: TipoRegistro;
  latitude?: number;
  longitude?: number;
  is_orphan?: boolean;
}

export interface ResultadoCalculoHoras {
  totalMinutos: number;
  formatado: string;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  inconsistencias: string[];
}
