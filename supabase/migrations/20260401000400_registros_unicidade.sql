-- Migration 04: Unicidade e Limpeza de Registros de Ponto
-- Reversível: ALTER TABLE public.registros_ponto DROP CONSTRAINT unique_colaborador_ponto_dia

-- 1. Identificar e Remover Duplicados (Mantendo o mais antigo por dia/tipo)
-- Importante: Executar em transação
DELETE FROM public.registros_ponto
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY colaborador_id, data_registro, tipo 
                   ORDER BY created_at ASC
               ) as row_number
        FROM public.registros_ponto
    ) t
    WHERE t.row_number > 1
);

-- 2. Aplicação da Constraint de Unicidade
ALTER TABLE public.registros_ponto 
    ADD CONSTRAINT unique_colaborador_ponto_dia 
    UNIQUE (colaborador_id, data_registro, tipo);

-- 3. Comentário
COMMENT ON CONSTRAINT unique_colaborador_ponto_dia ON public.registros_ponto 
    IS 'Garante integridade: 1 entrada/saída por colaborador por dia.';
