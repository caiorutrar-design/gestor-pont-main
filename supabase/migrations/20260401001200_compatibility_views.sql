-- ==========================================
-- ETAPA 2 (CORRIGIDO): Redesenho do Banco (Compatibilidade)
-- ESTRATÉGIA: Read-Only Views (Paridade 100%)
-- ==========================================

-- 1. View de Leitura Unificada de Órgãos
CREATE OR REPLACE VIEW public.vw_orgaos AS 
SELECT id, nome, sigla, created_at, updated_at
FROM public_new.orgaos;

-- 2. View de Leitura Unificada de Colaboradores
CREATE OR REPLACE VIEW public.vw_colaboradores AS 
SELECT 
    id, orgao_id, unidade_trabalho_id, user_id, 
    nome_completo, matricula, ativo, created_at, updated_at,
    cargo, jornada_entrada_manha, jornada_saida_manha,
    jornada_entrada_tarde, jornada_saida_tarde, geolocation_obrigatoria
FROM public_new.colaboradores;

-- 3. View de Leitura Unificada de Registros de Ponto (HISTÓRICO)
CREATE OR REPLACE VIEW public.vw_registros_ponto AS 
SELECT 
    id, 
    colaborador_id, 
    data_referencia as data_registro, 
    (timestamp_registro::TIME)::TEXT as hora_registro, -- Mantém o tipo TEXT conforme legado
    timestamp_registro, 
    tipo::text as tipo, 
    latitude, 
    longitude, 
    dentro_raio, 
    created_at
FROM public_new.registros_ponto;

-- 4. Registro de Controle de Versão de Schema
INSERT INTO public.feature_flags (key, enabled, description)
VALUES (
    'use_schema_v2', 
    false, 
    'Define se o sistema deve ler/escrever no novo schema public_new.'
)
ON CONFLICT (key) DO UPDATE 
SET description = EXCLUDED.description;
