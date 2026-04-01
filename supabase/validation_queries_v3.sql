-- ==========================================
-- ETAPA 2 (CORRIGIDO): Auditoria de Migração (V3 Final)
-- SCHEMA: public_new
-- ==========================================

-- 1. Checksum Total de Registros (DEVE BATER 100%)
-- Se Count de Origem for diferente do Destino, a migração falhou.
SELECT 
    (SELECT COUNT(*) FROM public.registros_ponto) as total_legado,
    (SELECT COUNT(*) FROM public_new.registros_ponto) as total_novo,
    (SELECT COUNT(*) FROM public_new.registros_ponto WHERE is_orphan = TRUE) as total_orfaos;

-- 2. Comparação de Tempo Trabalhado (Amostragem)
-- Compara o cálculo legada (via VIEW se existir) vs Nova MV
-- Se mv_frequencia_mensal estiver vazia, execute o REFRESH:
-- REFRESH MATERIALIZED VIEW public_new.mv_frequencia_mensal;

-- 3. Auditoria de Órfãos
SELECT id, colaborador_id, orphan_reason 
FROM public_new.registros_ponto 
WHERE is_orphan = TRUE 
LIMIT 50;

-- 4. Teste de Turno Noturno (Simulação)
-- Tentar inserir ponto cruzando meia-noite (23:55 -> 00:05)
-- Deve permitir e parear corretamente na MV.
-- Exemplo: 
-- INSERT INTO public_new.registros_ponto (colaborador_id, orgao_id, timestamp_registro, tipo) 
-- VALUES ('ID_COLAB', 'ID_ORGAO', '2026-03-31 23:55:00-03', 'entrada');
-- INSERT INTO public_new.registros_ponto (colaborador_id, orgao_id, timestamp_registro, tipo) 
-- VALUES ('ID_COLAB', 'ID_ORGAO', '2026-04-01 00:05:00-03', 'saida');
