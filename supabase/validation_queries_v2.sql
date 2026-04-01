-- ==========================================
-- ETAPA 2: Redesenho do Banco (Auditoria de Migração)
-- SCHEMA: public_new
-- ==========================================

-- 1. Comparação de Contagem por Órgão (Multi-tenant Check)
SELECT 
    old.orgao_id,
    old.old_count,
    new.new_count,
    CASE WHEN old.old_count = new.new_count THEN 'OK' ELSE 'DIVERGÊNCIA' END as status
FROM (
    SELECT orgao_id, COUNT(*) as old_count 
    FROM public.colaboradores 
    GROUP BY orgao_id
) old
JOIN (
    SELECT orgao_id, COUNT(*) as new_count 
    FROM public_new.colaboradores 
    GROUP BY orgao_id
) new ON old.orgao_id = new.orgao_id;

-- 2. Checksum Simplificado de Pontos (Integridade de Valor)
-- Soma os minutos de todos os registros (como um hash simples)
SELECT 
    (SELECT SUM(EXTRACT(MINUTE FROM timestamp_registro)) FROM public.registros_ponto) as checksum_antigo,
    (SELECT SUM(EXTRACT(MINUTE FROM timestamp_registro)) FROM public_new.registros_ponto) as checksum_novo;

-- 3. Identificar Registros de Ponto "Órfãos" (Falha na Migração)
SELECT r.id, r.colaborador_id
FROM public.registros_ponto r
WHERE NOT EXISTS (
    SELECT 1 FROM public_new.registros_ponto rn WHERE rn.id = r.id
);

-- 4. Validar se o Trigger de Sequência está Ativo e Bloqueante
-- Exemplo de Teste (Falha Esperada):
-- INSERT INTO public_new.registros_ponto (orgao_id, colaborador_id, tipo) VALUES ('UUID_ORGAO', 'UUID_COLAB', 'entrada');
-- INSERT INTO public_new.registros_ponto (orgao_id, colaborador_id, tipo) VALUES ('UUID_ORGAO', 'UUID_COLAB', 'entrada'); -- Deve falhar por duplicidade de tipo consecutiva.
