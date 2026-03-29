export interface Orgao {
  id: string;
  nome: string;
  sigla: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lotacao {
  id: string;
  nome: string;
  orgao_id: string;
  created_at: string;
  updated_at: string;
  orgao?: Orgao;
}

export interface Colaborador {
  id: string;
  nome_completo: string;
  matricula: string;
  orgao_id: string;
  lotacao_id: string | null;
  cargo: string;
  jornada_entrada_manha: string;
  jornada_saida_manha: string;
  jornada_entrada_tarde: string;
  jornada_saida_tarde: string;
  ativo: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  orgao?: Orgao;
  lotacao?: Lotacao;
}

export interface ColaboradorForm {
  nome_completo: string;
  matricula: string;
  orgao_id: string;
  lotacao_id: string | null;
  cargo: string;
  jornada_entrada_manha: string;
  jornada_saida_manha: string;
  jornada_entrada_tarde: string;
  jornada_saida_tarde: string;
  ativo: boolean;
  unidade_trabalho_id?: string | null;
  geolocation_obrigatoria?: boolean;
}

export interface OrgaoForm {
  nome: string;
  sigla: string;
}

export interface LotacaoForm {
  nome: string;
  orgao_id: string;
}
