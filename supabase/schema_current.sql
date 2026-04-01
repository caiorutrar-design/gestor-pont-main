-- Baseline de Schema (v0.1) - Gerado via Metadados de Tipos
-- Nota: O comando "supabase db dump" falhou devido a falta de conectividade/Docker no ambiente do agente.
-- Este arquivo serve como referência estrutural baseada nas migrações e tipos TypeScript atuais.

/*
TABELAS IDENTIFICADAS:
- abonos
- audit_logs
- colaboradores
- ferias
- frequencias_geradas
- justificativas
- lotacoes
- orgaos
- profiles
- registros_ponto
- unidades_trabalho
- user_roles
- feature_flags (Nova)
*/

-- Exemplo de Estrutura Crítica (Extraída dos Tipos):
-- CREATE TABLE orgaos (id uuid, nome text, sigla text, ...);
-- CREATE TABLE colaboradores (id uuid, nome_completo text, matricula text, orgao_id uuid, ...);
