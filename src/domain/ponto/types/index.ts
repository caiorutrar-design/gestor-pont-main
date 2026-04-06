/**
 * Dominio: Ponto
 * Types Puros (Sem dependências externas)
 */

export enum TipoRegistro {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

export interface RegistroPontoProps {
  id?: string;
  colaborador_id: string;
  orgao_id: string;
  unidade_trabalho_id?: string;
  timestamp_registro: Date;
  hora_registro?: string;
  tipo: TipoRegistro;
  latitude?: number;
  longitude?: number;
  is_orphan?: boolean;
  colaborador?: {
    nome_completo: string;
    matricula: string;
  };
  orgao?: {
    nome: string;
  };
}

export interface ResultadoCalculoHoras {
  totalMinutos: number;
  formatado: string;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  inconsistencias: string[];
}
