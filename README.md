# 🛡️ Gestor de Ponto PROCON MA

[![Status: Produção](https://img.shields.io/badge/Status-Produção-success?style=for-the-badge)](https://ponto.procon.ma.gov.br)
[![Security: RBAC Strict](https://img.shields.io/badge/Security-RBAC_Strict-red?style=for-the-badge)](https://ponto.procon.ma.gov.br)
[![Compliance: LGPD/CLT](https://img.shields.io/badge/Compliance-LGPD%2FCLT-blueviolet?style=for-the-badge)](https://ponto.procon.ma.gov.br)

Sistema corporativo de alta segurança para registro, controle e auditoria de frequência de colaboradores do PROCON Maranhão. Desenvolvido com foco em imutabilidade de dados, conformidade legal (Portaria 671/MTP) e arquitetura resiliente.

---

## 🏗️ Arquitetura de Segurança Auditada

O sistema passou por uma auditoria completa de segurança (Abril/2026) e implementa os seguintes controles:

### 1. Proteção de Dados e Identidade
- **Separação de Identidades**: Distinção clara entre *Colaboradores* (quem bate ponto) e *Usuários do Sistema* (quem acessa o dashboard).
- **Criptografia de Ponta**: Senhas de ponto são armazenadas via `pgcrypto` (PostgreSQL) usando hashing forte. Credenciais administrativas são gerenciadas pelo Supabase Auth (SHA-256).
- **Soft-Delete & Auditoria**: Exclusão de usuários exige justificativa obrigatória (>20 caracteres), gravada imutavelmente na tabela `audit_logs`. Nenhum dado é deletado fisicamente em primeira instância.

### 2. Integridade do Registro de Ponto (REP-P)
- **Geofencing Dinâmico**: Validação de latitude/longitude via Edge Functions (Deno Runtime) no momento do registro.
- **Imutabilidade**: O `ponto_id` e o hash do registro garantem que os dados não foram adulterados após a inserção.
- **Rate Limiting**: Proteção contra ataques de força bruta no terminal de ponto via Upstash Redis (limitando tentativas por IP/Matrícula).

### 3. Isolamento (RLS Strict)
- **Multi-tenancy**: Políticas de **Row Level Security (RLS)** garantem que gestores de um órgão ou unidade de trabalho vejam apenas seus respectivos subordinados.

---

## 🚀 Guia de Deploy em Produção

### 1. Configuração do Supabase
- **Extensões Necessárias**: Ative `pgcrypto`, `uuid-ossp` e `http`.
- **Edge Functions**: Execute o deploy da função `registrar-ponto` e `create-user` usando a CLI do Supabase.
- **Gatilhos**: Certifique-se de que o gatilho `handle_new_user` está ativo para criação automática de perfis.

### 2. Variáveis de Ambiente (Vercel/Cloudflare)
Configure as seguintes chaves no seu provedor de hosting:
- `VITE_SUPABASE_URL`: Seu endpoint do projeto.
- `VITE_SUPABASE_ANON_KEY`: Sua chave pública anon.
- `SUPABASE_SERVICE_ROLE_KEY`: (Apenas nas Edge Functions) Para operações administrativas.

### 3. Build e Performance
O sistema utiliza **Code Splitting** configurado no `vite.config.ts`.
- Bibliotecas pesadas como `recharts` e `jspdf` são carregadas sob demanda, reduzindo o bundle inicial em ~60%.
- O **PWA** está configurado para permitir o registro de ponto mesmo em redes instáveis (cache de ativos críticos).

---

## 🛠️ Plano de Manutenção Pós-Lançamento

| Tarefa | Frequência | Descrição |
| :--- | :--- | :--- |
| **Auditoria de Logs** | Semanal | Revisar registros na tabela `audit_logs` para identificar padrões anômalos de acesso. |
| **Backup de Segurança** | Diário | Confirmar o sucesso dos backups automatizados do Supabase. |
| **Rotação de Keys** | Semestral | Recomenda-se rotacionar as chaves de API do Supabase para mitigação de riscos. |
| **Reciclagem de Cache** | Mensal | Limpeza de logs de rate-limit antigos para otimizar o storage do Redis. |

---

## 👨‍💻 Desenvolvimento Local

```bash
# Clone e instalação
git clone <repo_url>
npm install

# Iniciar ambiente de desenvolvimento
npm run dev
```

---
**PROCON MA** - *Tecnologia a serviço da transparência e eficiência pública.*
