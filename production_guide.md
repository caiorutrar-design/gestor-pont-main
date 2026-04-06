# 🚀 Guia de Produção: Gestor de Ponto PROCON MA

Este guia contém todos os passos necessários para configurar e manter o ambiente de produção do sistema.

## 1. Frontend: Deploy na Vercel
A Vercel é a plataforma recomendada para o frontend Vite/React devido à sua CDN global e suporte nativo a PWAs.

### Configurações Iniciais:
1. Conecte o repositório do GitHub no painel da Vercel.
2. **Framework Preset**: Selecione `Vite`.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Variáveis de Ambiente (Environment Variables):
Configure as seguintes variáveis no painel da Vercel (Settings > Environment Variables):
- `VITE_SUPABASE_URL`: A URL do seu projeto de **Produção** no Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave anônima do projeto de produção.

## 2. Banco de Dados: Supabase Production
É altamente recomendável criar um **Novo Projeto** no Supabase dedicado à produção para separar os dados de teste.

### Migrations e Esquema:
1. Instale o Supabase CLI: `npm install -g supabase`
2. Faça login: `supabase login`
3. Vincule ao projeto de produção: `supabase link --project-ref <seu-id-prod>`
4. Aplique as migrations: `supabase db push`

### Segurança Crítica:
- **CORS**: Em *Settings > API*, adicione o domínio da Vercel (ex: `ponto.procon.ma.gov.br`) na lista de permitidos.
- **SSL**: O Supabase já provê HTTPS nativo.

## 3. CI/CD Automatizado (GitHub Actions)
O pipeline já está configurado no arquivo `.github/workflows/deploy.yml`. Ele executará:
1. **Lint & Test**: Garante que o código está limpo e funcional.
2. **Security Scan**: Verifica vulnerabilidades básicas.
3. **Staging Deploy**: Gera uma URL de preview para cada Pull Request.
4. **Production Deploy**: Atualiza o ambiente oficial ao fazer merge na `main`.

> [!IMPORTANT]
> Para o CI funcionar, adicione estes Secrets no GitHub:
> - `VERCEL_TOKEN`: Gerado em *Vercel Settings > Tokens*.
> - `VERCEL_ORG_ID`: Encontrado no seu perfil da Vercel.
> - `VERCEL_PROJECT_ID`: Encontrado nas configurações do projeto na Vercel.

## 4. Domínio Customizado
1. Na Vercel, vá em *Settings > Domains*.
2. Adicione seu domínio (ex: `ponto.procon.ma.gov.br`).
3. Siga as instruções de DNS (configuração de CNAME ou registro A).
4. O certificado **SSL/HTTPS** será gerado automaticamente pela Vercel/Let's Encrypt.

## 5. Monitoramento e Analytics
- **Vercel Analytics**: Ative no painel para monitorar visitantes e erros 404.
- **Supabase Logs**: Acompanhe o uso da CPU do Postgres e erros de API em *Realtime Logs*.
- **PWA Integrity**: Use o Chrome DevTools > Lighthouse para validar se o PWA está instalável após o deploy.

---
**Dica de Segurança**: Nunca faça commits de arquivos `.env` com chaves reais. Use sempre o painel da Vercel/GitHub Secrets.
