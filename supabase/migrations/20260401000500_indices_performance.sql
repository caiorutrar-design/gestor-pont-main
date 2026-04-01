-- Migration 05: Otimização de Performance (Índices)
-- Reversível: DROP INDEX ...

-- 1. Buscas rápidas de registros por período (Dashboard/Relatórios)
CREATE INDEX IF NOT EXISTS idx_registros_ponto_data_colaborador 
ON public.registros_ponto (colaborador_id, data_registro DESC);

-- 2. Buscas por Órgão (Filtro Hierárquico)
CREATE INDEX IF NOT EXISTS idx_colaboradores_orgao 
ON public.colaboradores (orgao_id, ativo);

-- 3. Buscas por Unidade (Filtro de Gestão)
CREATE INDEX IF NOT EXISTS idx_colaboradores_unidade 
ON public.colaboradores (unidade_trabalho_id);

-- 4. Justificativas pendentes de auditoria
CREATE INDEX IF NOT EXISTS idx_justificativas_colaborador 
ON public.justificativas (colaborador_id, data_falta DESC);

-- 5. Auditoria Rápida
CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
ON public.audit_logs (created_at DESC);
