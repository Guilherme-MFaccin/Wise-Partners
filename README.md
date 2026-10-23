# Portal Wise Partners

Portal que governa o programa de parcerias Wise Partners da Wise Makers: carteira de parceiros por categoria, pontos de contato com resumo por IA, funil com aprovação do Diretor, geração de contrato em Word e PDF, contrapartidas, indicações e comissões das três empresas do grupo, Base Ativa, painel semanal com alertas por e-mail, portal do parceiro e página exclusiva de RFP para o cliente.

A especificação completa está em `specs/001-portal-wise-partners/` e os princípios do projeto em `.specify/memory/constitution.md`. O plano técnico está em `specs/001-portal-wise-partners/plan.md`.

## Pilha

* Vite, React 18, TypeScript, Tailwind CSS e shadcn/ui (estrutura compatível com o Lovable)
* Supabase: autenticação por link no e-mail, PostgreSQL com Row Level Security, Storage privado e Edge Functions (Deno)
* pg_cron e pg_net para as rotinas, Resend para e-mails
* IA por uma Edge Function única (`ai-gateway`), com o provedor definido por variável de ambiente (Lovable AI por padrão)

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/pages/app` | Área interna (`/app`): painel, parceiros, ficha, indicações, comissões, RFP, Base Ativa, atividades, pendências, importação, configurações e usuários |
| `src/pages/parceiro` | Portal do parceiro (`/parceiro`) |
| `src/pages/publico/PaginaRfp.tsx` | Página pública de RFP (`/r/:token`) |
| `src/lib/contrato.ts` | Quadro de Identificação e geração da minuta em Word e PDF |
| `supabase/migrations` | Banco: tabelas, regras do programa, RLS, dados iniciais e agendamentos |
| `supabase/functions` | Edge Functions: `ai-gateway`, `rfp-publica`, `rfp-clique`, `convidar-usuario`, `enviar-notificacoes`, `resumo-diario`, `relatorio-semanal`, `backup` |
| `tests/db` | Testes de acesso (RLS) e das regras do programa, contra um PostgreSQL real |
| `tests/unit` | Testes da geração de contrato |

## Testes

```bash
npm install
npm test          # geração de contrato: marcadores, opções marcadas, PDF
npm run test:db   # sobe um PostgreSQL temporário, aplica as migrações e roda os testes de RLS e regras
```

`npm run test:db` precisa do PostgreSQL 16 instalado (binários em `/usr/lib/postgresql/16/bin`, ou defina `PGBIN`). Os testes cobrem cada linha da matriz de permissões com usuários de todos os papéis e dois parceiros distintos, a página pública (token inválido, expirado e revogado, sem campos internos), o bloqueio de fechamento sem aprovação, o mínimo de 3 opções por categoria, o primeiro registro de indicações, o cálculo de comissão das três empresas, o status de atividade por nível e a contrapartida atrasada que só gera alerta.

## Implantação

### 1. Banco

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJETO
npx supabase db push
```

Em seguida, no SQL Editor do Supabase, guarde no Vault o endereço do projeto e o segredo das rotinas (o mesmo valor de `CRON_SECRET` do passo 2) e reaplique a migração de agendamentos se ela tiver rodado antes:

```sql
select vault.create_secret('https://SEU_PROJETO.supabase.co', 'project_url');
select vault.create_secret('um-segredo-longo-e-aleatorio', 'cron_secret');
```

Habilite as extensões `pg_cron` e `pg_net` em Database, Extensions, se ainda não estiverem ativas.

### 2. Edge Functions

```bash
npx supabase secrets set AI_PROVIDER=lovable AI_API_KEY=... AI_MODEL=google/gemini-2.5-flash \
  RESEND_API_KEY=... EMAIL_FROM="Wise Partners <parcerias@wisemakers.com.br>" \
  APP_URL=https://endereco-do-portal CRON_SECRET=um-segredo-longo-e-aleatorio
npx supabase functions deploy
```

`AI_PROVIDER` aceita `lovable`, `openai`, `gemini` e `anthropic`. No Lovable, a chave `LOVABLE_API_KEY` é usada automaticamente quando `AI_API_KEY` não é definida.

### 3. Autenticação

Em Authentication, no painel do Supabase:

* Desligue o cadastro aberto (Allow new users to sign up). Só entra quem foi convidado.
* Em URL Configuration, informe o endereço do portal em Site URL e em Redirect URLs.
* Traduza os modelos de e-mail de Magic Link e Invite para o português, sem travessões.
* Recomendado: configure o SMTP do Resend em Authentication, SMTP Settings, para que os links saiam do domínio da Wise.

### 4. Frontend

Crie um `.env` a partir do `.env.example` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e rode `npm run build`. A pasta `dist` é estática; qualquer hospedagem de site estático serve, com redirecionamento de todas as rotas para `index.html`.

### 5. Primeiro acesso

A migração deixa um convite para `guilherme@wisemakers.com.br` como administrador. Crie esse usuário em Authentication, Users, Add user (ou Send invitation): o perfil é criado sozinho a partir do convite. Depois, pela tela Usuários, convide o Igor como administrador com a marcação de Diretor (só ele aprova assinaturas) e o responsável financeiro.

Em Configurações, Parâmetros, preencha o e-mail do financeiro, o endereço do Wise Hub e o endereço do portal.

### 6. Dados reais

A constituição pede que dados reais só entrem depois dos testes de acesso. Rode `npm run test:db`, teste o portal com parceiros fictícios (principalmente o portal do parceiro e a página de RFP) e só então importe `specs/001-portal-wise-partners/dados-iniciais/parceiros.csv` pela tela Importação. Os dossiês em `referencias/dossies/` entram pela mesma tela e a extração por IA é feita na aba Documentos da ficha.

## Lovable

O repositório segue a estrutura do Lovable (`src/`, `src/components/ui`, `src/integrations/supabase`, `supabase/functions`, `supabase/migrations`). Ao conectar, use o mesmo projeto Supabase e confira as variáveis de ambiente no painel do Lovable.
