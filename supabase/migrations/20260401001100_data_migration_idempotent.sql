-- ==========================================
-- ETAPA 2 (CORRIGIDO): Redesenho do Banco (Sincronização)
-- ESTRATÉGIA: UPSERT (Preservar 100% dos Dados)
-- ==========================================

-- 1. Migração de Órgãos
INSERT INTO public_new.orgaos (id, nome, sigla, created_at, updated_at)
SELECT id, nome, sigla, created_at, updated_at
FROM public.orgaos
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, updated_at = NOW();

-- 2. Migração de Colaboradores (LEFT JOIN se necessário para órgãos órfãos)
-- Nota: Aqui orgao_id é obrigatório por regra de negócio
INSERT INTO public_new.colaboradores (id, orgao_id, unidade_trabalho_id, user_id, nome_completo, matricula, ativo, created_at, updated_at)
SELECT id, orgao_id, unidade_trabalho_id, user_id, nome_completo, matricula, ativo, created_at, updated_at
FROM public.colaboradores
ON CONFLICT (id) DO NOTHING;

-- 3. Migração de Registros de Ponto (Tratamento de Órfãos)
-- Objetivo: Checksum 100% idêntico entre os schemas.
INSERT INTO public_new.registros_ponto (
    id, orgao_id, colaborador_id, data_referencia, 
    timestamp_registro, tipo, latitude, longitude, dentro_raio, created_at,
    is_orphan, orphan_reason
)
SELECT 
    r.id, 
    c.orgao_id, 
    r.colaborador_id, 
    (r.timestamp_registro::DATE), 
    r.timestamp_registro::TIMESTAMPTZ, 
    r.tipo::public_new.tipo_ponto, 
    r.latitude, 
    r.longitude, 
    r.dentro_raio, 
    r.created_at,
    CASE WHEN c.id IS NULL THEN TRUE ELSE FALSE END as is_orphan,
    CASE 
        WHEN c.id IS NULL THEN 'Registro de ponto sem colaborador vinculado no schema legado.'
        ELSE NULL 
    END as orphan_reason
FROM public.registros_ponto r
LEFT JOIN public.colaboradores c ON r.colaborador_id = c.id
ON CONFLICT (id) DO NOTHING;

-- 4. LOG DE AUDITORIA (CHECK SUM)
SELECT 
    (SELECT COUNT(*) FROM public.registros_ponto) as count_origem,
    (SELECT COUNT(*) FROM public_new.registros_ponto) as count_destino,
    (SELECT COUNT(*) FROM public_new.registros_ponto WHERE is_orphan = TRUE) as count_orfaos;
