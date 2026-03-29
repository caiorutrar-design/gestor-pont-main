-- Tabela de órgãos
CREATE TABLE public.orgaos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  sigla TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de lotações
CREATE TABLE public.lotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  orgao_id UUID NOT NULL REFERENCES public.orgaos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nome, orgao_id)
);

-- Tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  orgao_id UUID NOT NULL REFERENCES public.orgaos(id) ON DELETE RESTRICT,
  lotacao_id UUID REFERENCES public.lotacoes(id) ON DELETE SET NULL,
  cargo TEXT NOT NULL,
  jornada_entrada_manha TEXT NOT NULL DEFAULT '08:00',
  jornada_saida_manha TEXT NOT NULL DEFAULT '12:00',
  jornada_entrada_tarde TEXT NOT NULL DEFAULT '14:00',
  jornada_saida_tarde TEXT NOT NULL DEFAULT '18:00',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de frequências geradas (histórico)
CREATE TABLE public.frequencias_geradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2000),
  orgao_id UUID REFERENCES public.orgaos(id) ON DELETE SET NULL,
  lotacao_id UUID REFERENCES public.lotacoes(id) ON DELETE SET NULL,
  quantidade_colaboradores INTEGER NOT NULL DEFAULT 0,
  gerado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias_geradas ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (sistema administrativo interno)
-- Em produção futura, essas seriam restritas por usuário autenticado
CREATE POLICY "Permitir leitura pública de órgãos" ON public.orgaos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de órgãos" ON public.orgaos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de órgãos" ON public.orgaos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de órgãos" ON public.orgaos FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de lotações" ON public.lotacoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de lotações" ON public.lotacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de lotações" ON public.lotacoes FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de lotações" ON public.lotacoes FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de colaboradores" ON public.colaboradores FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de colaboradores" ON public.colaboradores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de colaboradores" ON public.colaboradores FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de colaboradores" ON public.colaboradores FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de frequências" ON public.frequencias_geradas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de frequências" ON public.frequencias_geradas FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_orgaos_updated_at
  BEFORE UPDATE ON public.orgaos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lotacoes_updated_at
  BEFORE UPDATE ON public.lotacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_colaboradores_orgao ON public.colaboradores(orgao_id);
CREATE INDEX idx_colaboradores_lotacao ON public.colaboradores(lotacao_id);
CREATE INDEX idx_colaboradores_ativo ON public.colaboradores(ativo);
CREATE INDEX idx_lotacoes_orgao ON public.lotacoes(orgao_id);
CREATE INDEX idx_frequencias_mes_ano ON public.frequencias_geradas(mes, ano);