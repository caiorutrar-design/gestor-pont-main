-- ==========================================
-- SCRIPT COMPLETO: Setup Gestor Ponto
-- Run no Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. CRIAR TABELA dashboard_settings (se não existir)
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    enabled_cards JSONB DEFAULT '{"colaboradores": true, "orgaos": true, "pontos": true}'::jsonb,
    default_period TEXT DEFAULT 'hoje',
    powerbi_report_id TEXT,
    powerbi_workspace_id TEXT,
    powerbi_embed_url TEXT,
    powerbi_enabled BOOLEAN DEFAULT false
);

-- 2. CRIAR POLÍTICAS RLS PARA dashboard_settings
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage settings" ON public.dashboard_settings;
CREATE POLICY "Super Admins can manage settings" 
ON public.dashboard_settings
FOR ALL USING (true);

DROP POLICY IF EXISTS "Everyone can read settings" ON public.dashboard_settings;
CREATE POLICY "Everyone can read settings"
ON public.dashboard_settings FOR SELECT USING (true);

-- 3. ATUALIZAR POLÍTICAS DAS OUTRAS TABELAS (permite insert anônimo)
-- Órgãos
DROP POLICY IF EXISTS "Permitir inserção de órgãos" ON public.orgaos;
CREATE POLICY "Permitir inserção de órgãos" ON public.orgaos FOR INSERT WITH CHECK (true);

-- Unidades de Trabalho  
DROP POLICY IF EXISTS "Permitir inserção de unidades" ON public.unidades_trabalho;
CREATE POLICY "Permitir inserção de unidades" ON public.unidades_trabalho FOR INSERT WITH CHECK (true);

-- Lotações
DROP POLICY IF EXISTS "Permitir inserção de lotações" ON public.lotacoes;
CREATE POLICY "Permitir inserção de lotações" ON public.lotacoes FOR INSERT WITH CHECK (true);

-- Colaboradores
DROP POLICY IF EXISTS "Permitir inserção de colaboradores" ON public.colaboradores;
CREATE POLICY "Permitir inserção de colaboradores" ON public.colaboradores FOR INSERT WITH CHECK (true);

-- Registros de Ponto
DROP POLICY IF EXISTS "Permitir inserção de registros_ponto" ON public.registros_ponto;
CREATE POLICY "Permitir inserção de registros_ponto" ON public.registros_ponto FOR INSERT WITH CHECK (true);

-- 4. SEED DATA: UNIDADES DE TRABALHO
INSERT INTO public.unidades_trabalho (nome, cidade, estado) VALUES
    ('Centro Administrativo', 'São Luís', 'MA'),
    ('Hospital Municipal', 'São Luís', 'MA'),
    ('CAPS Centro', 'São Luís', 'MA'),
    ('UBS Vila Nova', 'São Luís', 'MA'),
    ('Laboratório Central', 'São Luís', 'MA')
ON CONFLICT DO NOTHING;

-- 5. SEED DATA: ÓRGÃOS
INSERT INTO public.orgaos (nome, sigla) VALUES
    ('Secretaria Municipal de Educação', 'SEMED'),
    ('Secretaria Municipal de Saúde', 'SEMUS'),
    ('Instituto de Tecnologia e Inovação', 'ITI'),
    ('Secretaria Municipal de Administração', 'SEMAD')
ON CONFLICT DO NOTHING;

-- 6. SEED DATA: LOTACÕES (vinculadas aos órgãos)
INSERT INTO public.lotacoes (nome, orgao_id) 
SELECT nome, id FROM (
    SELECT 'Diretoria de Tecnologia' as nome, id FROM public.orgaos WHERE sigla = 'ITI'
    UNION ALL
    SELECT 'Divisão de Ensino Fundamental', id FROM public.orgaos WHERE sigla = 'SEMED'
    UNION ALL
    SELECT 'Hospital Municipal', id FROM public.orgaos WHERE sigla = 'SEMUS'
    UNION ALL
    SELECT 'UBS Centro', id FROM public.orgaos WHERE sigla = 'SEMUS'
) sub
ON CONFLICT DO NOTHING;

-- 7. SEED DATA: COLABORADORES
INSERT INTO public.colaboradores (
    nome_completo, matricula, orgao_id, lotacao_id, cargo,
    jornada_entrada_manha, jornada_saida_manha,
    jornada_entrada_tarde, jornada_saida_tarde
) 
SELECT nome, matricula, orgao_id, lotacao_id, cargo, '08:00', '12:00', '14:00', '18:00'
FROM (
    SELECT 'João Silva Santos' as nome, 'MAT001' as matricula, o.id as orgao_id, l.id as lotacao_id, 'Analista de Sistemas' as cargo
    FROM public.orgaos o, public.lotacoes l WHERE o.sigla = 'ITI' AND l.nome = 'Diretoria de Tecnologia'
    UNION ALL
    SELECT 'Maria Oliveira Costa' as nome, 'MAT002' as matricula, o.id, l.id, 'Professor(a) Fundamental I'
    FROM public.orgaos o, public.lotacoes l WHERE o.sigla = 'SEMED' AND l.nome LIKE '%Fundamental%'
    UNION ALL
    SELECT 'Carlos Souza Lima' as nome, 'MAT003' as matricula, o.id, l.id, 'Enfermeiro(a)'
    FROM public.orgaos o, public.lotacoes l WHERE o.sigla = 'SEMUS' AND l.nome LIKE '%Hospital%'
    UNION ALL
    SELECT 'Ana Paula Rodrigues' as nome, 'MAT004' as matricula, o.id, l.id, 'Médico(a) Clínico'
    FROM public.orgaos o, public.lotacoes l WHERE o.sigla = 'SEMUS' AND l.nome LIKE '%UBS%'
) sub
ON CONFLICT DO NOTHING;

-- 8. SEED DATA: REGISTROS DE PONTO (exemplo hoje)
DO $$
DECLARE
    colab_id UUID;
    hoje DATE := current_date;
BEGIN
    SELECT id INTO colab_id FROM public.colaboradores WHERE matricula = 'MAT001' LIMIT 1;
    IF colab_id IS NOT NULL THEN
        INSERT INTO public.registros_ponto (colaborador_id, data_registro, tipo_registro, hora_registro, localizacao_lat, localizacao_lng)
        VALUES 
            (colab_id, hoje, 'entrada_manha', '08:05', -2.5294, -44.3068),
            (colab_id, hoje, 'saida_manha', '12:10', -2.5294, -44.3068),
            (colab_id, hoje, 'entrada_tarde', '14:02', -2.5294, -44.3068),
            (colab_id, hoje, 'saida_tarde', '18:15', -2.5294, -44.3068)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 9. VERIFICAR
SELECT 'Órgãos:' as tabela, count(*) as total FROM public.orgaos
UNION ALL
SELECT 'Lotações:', count(*) FROM public.lotacoes
UNION ALL
SELECT 'Colaboradores:', count(*) FROM public.colaboradores
UNION ALL
SELECT 'Registros de Ponto:', count(*) FROM public.registros_ponto
UNION ALL
SELECT 'Unidades:', count(*) FROM public.unidades_trabalho;

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================