-- Auditoria de Dados Pós-Migration Etapa 1

-- 1. IDENTIFICAR DUPLICIDADES (Geral)
-- Se esta query retornar algum registro, a constraint UNIQUE ainda não foi aplicada com sucesso.
SELECT colaborador_id, data_registro, tipo, COUNT(*)
FROM public.registros_ponto
GROUP BY colaborador_id, data_registro, tipo
HAVING COUNT(*) > 1;

-- 2. VALIDAR FORMATO DE HORA (Jornada)
-- Verifica se há algum registro que não pôde ser convertido ou está nulo inesperadamente.
SELECT nome_completo, jornada_entrada_manha, jornada_saida_manha
FROM public.colaboradores
WHERE jornada_entrada_manha IS NULL OR jornada_entrada_manha = '00:00:00'::TIME;

-- 3. CONSISTÊNCIA DE UNIDADE DE TRABALHO
-- Verificando colaboradores sem unidade vinculada.
SELECT COUNT(*) as sem_unidade
FROM public.colaboradores
WHERE unidade_trabalho_id IS NULL;

-- 4. VALIDAÇÃO DE SEQUÊNCIA DE PONTOS (OPCIONAL/AUDITORIA)
-- Identifica dias em que o colaborador teve mais saídas que entradas.
WITH stats AS (
    SELECT colaborador_id, data_registro,
           COUNT(*) FILTER (WHERE tipo = 'entrada') as entradas,
           COUNT(*) FILTER (WHERE tipo = 'saida') as saidas
    FROM public.registros_ponto
    GROUP BY 1, 2
)
SELECT * FROM stats WHERE saidas > entradas;
