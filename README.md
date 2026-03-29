# Gestor de Ponto

Aplicativo web para gerenciamento de ponto/horas de colaboradores, com autenticação via Supabase, cadastro de funcionários e painel administrativo.

## 🚀 Tecnologias

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (Auth + PostgreSQL + Edge Functions + Storage)
- [React Router](https://reactrouter.com/) v6
- [React Query](https://tanstack.com/query) (TanStack Query)
- [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) para validação
- [Vitest](https://vitest.dev/) para testes

## ✨ Features Atuais

- **Autenticação completa** — login por email ou matrícula, cadastro, proteção de rotas
- **Gestão de colaboradores** — cadastro, edição, ativação/desativação, vínculo com órgãos e lotações
- **Registro de ponto** — sistema kiosk com validação de senha (bcrypt), rate limiting
- **Portal do colaborador** — "Meu Ponto" para visualização individual
- **Controle de acesso** — roles (super_admin, admin, gestor, user) com RLS em todas as tabelas
- **Gestão de RH** — férias, abonos, justificativas com anexos
- **Folha de frequência** — geração e assinatura de folhas mensais
- **Logs de auditoria** — registro de todas as ações administrativas
- **Gerenciamento de órgãos e lotações** — estrutura organizacional completa

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- npm ou [bun](https://bun.sh/)
- Conta no [Supabase](https://supabase.com/) (ou projeto Lovable Cloud)

## 🔧 Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/caiorutrar-design/gestor-ponto.git
cd gestor-ponto

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves do Supabase

# 3. Instale as dependências
npm install
# ou
bun install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/pública do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

Você encontra essas chaves no dashboard do Supabase em **Settings > API**.

> ⚠️ Nunca commite o arquivo `.env` com chaves reais. Use `.env.example` como referência.

## 🔒 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Senhas de ponto** hashed com bcrypt via `pgcrypto`
- **Rate limiting** no endpoint de registro de ponto (5 tentativas/minuto)
- **Validação de formulários** com Zod (client-side) e RLS policies (server-side)
- **Roles** armazenados em tabela separada (`user_roles`) com função `has_role()` SECURITY DEFINER
- **Logs de auditoria** para todas as ações administrativas

## 🗺️ Roadmap

- [ ] Relatórios mensais com gráficos e estatísticas
- [ ] Export CSV/PDF de folhas de frequência
- [ ] Notificações realtime via Supabase Realtime
- [ ] Suporte mobile (PWA com manifest.json e service worker)
- [ ] Internacionalização (i18n) com suporte multi-idioma
- [ ] Dashboard com métricas de assiduidade
- [ ] Integração com sistemas de RH externos
- [ ] App mobile nativo (React Native)

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

### Padrão de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração de código
- `docs:` alterações na documentação
- `test:` adição ou alteração de testes
- `security:` melhorias de segurança

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
