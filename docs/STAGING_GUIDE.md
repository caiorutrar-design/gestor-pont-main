# Guia de Execução: Staging e Redesenho do Banco (Etapa 2)

Este guia detalha o procedimento operacional para aplicar e validar as migrations da Etapa 2 no ambiente de **Staging (Supabase Preview Branch)**.

---

## 1. Preparação do Ambiente

1.  **Garantir o Backup**: 
    - Verifique se o banco de produção possui um snapshot recente no painel do Supabase.
2.  **Criar Preview Branch**:
    ```bash
    # Cria uma cópia isolada do banco com dados e configurações atuais
    supabase branches create etapa-2-redesenho-schema
    ```
3.  **Configurar Variáveis de Ambiente**:
    - Se houver novas chaves (ex: Redis da Etapa 1), garanta que estejam sincronizadas no painel da branch.

---

## 2. Execução das Migrations (Ordem de Dependência)

As migrations devem ser aplicadas sequencialmente para evitar erros de FK ou Schema inexistente.

```bash
# Sincroniza os arquivos locais com a branch de preview
supabase db push --branch etapa-2-redesenho-schema
```

**Verifique se a saída do console confirma a aplicação dos seguintes arquivos:**
1. `20260401000800_schema_public_new.sql`
2. `20260401000900_triggers_functions.sql`
3. `20260401001000_materialized_views.sql`
4. `20260401001100_data_migration_idempotent.sql`
5. `20260401001200_compatibility_views.sql`

---

## 3. Validação de Dados e Integridade

Execute o conteúdo de [validation_queries_v3.sql](file:///c:/projects/gestor-pont-main/supabase/validation_queries_v3.sql) no Editor SQL da branch para confirmar:
- [ ] O total de registros em `registros_ponto` no `public` é idêntico ao `public_new`.
- [ ] A contagem de órfãos está mapeada (`is_orphan = TRUE`).
- [ ] O `checksum` de minutos/tempos está consistente.

---

## 4. Testes Funcionais (Manual Checklist)

Acesse a branch via Editor SQL ou API e simule os cenários abaixo:

- [ ] **Entrada Normal**: Inserir uma entrada às 08:00 (Deve permitir).
- [ ] **Saída Normal**: Inserir uma saída às 12:00 (Deve permitir).
- [ ] **Turno Noturno**: Inserir Entrada dia X às 23:55 e Saída dia X+1 às 00:05 (Deve permitir).
- [ ] **Bloqueio de Duplicidade**: Tentar inserir duas Entradas seguidas para o mesmo colaborador (Deve lançar erro descritivo).
- [ ] **Intervalo de 5 Min**: Tentar registrar Saída com menos de 5 min da Entrada (Deve lançar erro de Intervalo Curto).
- [ ] **Concorrência**: Tentar disparar 2 inserts simultâneos (A constraint UNIQUE deve barrar um deles).

---

## 5. Performance e Agregação

1.  **Refrescar Dados**:
    ```sql
    REFRESH MATERIALIZED VIEW public_new.mv_frequencia_mensal;
    ```
2.  **Validar MV**:
    - Verifique se os acumulados mensais batem com a amostragem de dados migrados.

---

## 6. Plano de Rollback

Caso ocorra erro crítico na migração em Staging:

1.  **Destruir a Branch**:
    ```bash
    supabase branches delete etapa-2-redesenho-schema
    ```
2.  **Correção e Re-tentativa**:
    - Corrigir o SQL problemático localmente.
    - Repetir o passo 1.

---
> [!IMPORTANT]
> **NÃO PROSSIGA PARA PRODUÇÃO** sem concluir o checklist de validação de dados em staging. A paridade entre `public` e `public_new` deve ser absoluta.
