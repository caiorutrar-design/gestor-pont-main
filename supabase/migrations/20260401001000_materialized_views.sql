-- ==========================================
-- ETAPA 2 (CORRIGIDO): Redesenho do Banco (Inteligência)
-- OBJETO: mv_frequencia_mensal (Materialized View v2)
-- ==========================================

-- 1. Criação da View Materializada (Lógica Robusta de Pareamento)
CREATE MATERIALIZED VIEW IF NOT EXISTS public_new.mv_frequencia_mensal AS
WITH periodos AS (
    -- Etapa 1: Preparar registros ordenados
    SELECT 
        orgao_id,
        colaborador_id,
        DATE_TRUNC('month', timestamp_registro) as mes,
        tipo,
        timestamp_registro,
        -- Busca a batida subsequente do mesmo dia para pareamento
        LEAD(tipo) OVER (PARTITION BY colaborador_id ORDER BY timestamp_registro) as prox_tipo,
        LEAD(timestamp_registro) OVER (PARTITION BY colaborador_id ORDER BY timestamp_registro) as prox_ts
    FROM public_new.registros_ponto
    WHERE is_orphan = FALSE -- Ignora órfãos para estatística oficial
),
pares AS (
    -- Etapa 2: Filtrar apenas pares válidos (Entrada -> Saída subsequente)
    -- Se o prox_tipo for Saída, calculamos a diferença. 
    -- Se for outra Entrada ou nulo, ignoramos (Ponto em aberto ou inconsistente)
    SELECT 
        orgao_id,
        colaborador_id,
        mes,
        tipo,
        CASE 
            WHEN tipo = 'entrada' AND prox_tipo = 'saida' 
            THEN EXTRACT(EPOCH FROM (prox_ts - timestamp_registro)) / 60
            ELSE 0 
        END as minutos_no_periodo
    FROM periodos
)
SELECT 
    orgao_id,
    colaborador_id,
    mes,
    COUNT(*) FILTER (WHERE tipo = 'entrada') as quantidade_entradas,
    COUNT(*) FILTER (WHERE tipo = 'saida') as quantidade_saidas,
    SUM(minutos_no_periodo)::INTEGER as total_minutos_trabalhados
FROM pares
GROUP BY orgao_id, colaborador_id, mes;

-- 2. Índice para Performance de Filtro
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_frequencia_pk 
ON public_new.mv_frequencia_mensal (orgao_id, colaborador_id, mes);
