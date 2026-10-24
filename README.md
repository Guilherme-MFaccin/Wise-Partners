# Portal Wise Partners

Portal que governa o programa de parcerias Wise Partners da Wise Makers: carteira de parceiros por categoria, pontos de contato com resumo por IA, funil com aprovação do Diretor, geração de contrato em Word e PDF, contrapartidas, indicações e comissões das três empresas do grupo, Base Ativa, painel semanal com alertas por e-mail, portal do parceiro e página exclusiva de RFP para o cliente.

A versão 2.0 acrescenta o Método Octo: resultado do canal (ROI) com custos e horas, scorecard de entrada, nutrição, onboarding de 90 dias com ativação, trilhas e certificados, link exclusivo de indicação com SLA, nota de qualidade e proteção de 180 dias, níveis por resultado com revisão trimestral, ações conjuntas nos dois sentidos, régua de atendimento, faixas, ranking e premiação, desligamento formal, maturidade em 8 eixos, regras e comunicados no portal, cruzamento de carteiras e painel por etapa da jornada.

Especificações: `specs/001-portal-wise-partners/` (v1) e `specs/002-evolucao-metodo-octo/` (v2). Princípios em `.specify/memory/constitution.md` (2.0.0). Planos técnicos em `plan.md` de cada pasta; a API do banco para as telas da v2 está em `specs/002-evolucao-metodo-octo/api-banco.md`.

## Pilha

* Vite, React 18, TypeScript, Tailwind CSS e shadcn/ui (estrutura compatível com o Lovable)
* Supabase: autenticação por link no e-mail, PostgreSQL com Row Level Security, Storage privado e Edge Functions (Deno)
* pg_cron e pg_net para as rotinas, Resend para e-mails
* IA por uma Edge Function única (`ai-gateway`), com o provedor definido por variável de ambiente (Lovable AI por padrão)

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/pages/app` | Área interna (`/app`): painel por etapa da jornada, parceiros, ficha, indicações, comissões, RFP, Base Ativa, atividades, pendências, meu painel, resultado do canal, custos, ações conjuntas, capacitação, comunicados, ranking, maturidade, cruzamento, importação, configurações e usuários |
| `src/pages/parceiro` | Portal do parceiro (`/parceiro`): nível, parceria, onboarding, capacitação, link de indicação, ações conjuntas, regras, comunicados, ranking, pesquisa e cruzamento |
| `src/pages/publico` | Páginas públicas: RFP (`/r/:token`) e link de indicação do parceiro (`/i/:token`) |
| `src/lib/contrato.ts` | Quadro de Identificação e geração da minuta em Word e PDF |
| `supabase/migrations` | Banco: tabelas, regras do programa, RLS, dados iniciais e agendamentos |
| `supabase/functions` | Edge Functions: `ai-gateway`, `rfp-publica`, `rfp-clique`, `indicacao-publica`, `cruzamento-carteiras`, `convidar-usuario`, `enviar-notificacoes`, `resumo-diario`, `relatorio-semanal`, `backup` |
| `tests/db` | Testes de acesso (RLS) e das regras do programa, v1 e v2, contra um PostgreSQL real |
| `tests/unit` | Testes da geração de contrato, do certificado e do cruzamento de carteiras |

## Testes

```bash
npm install
npm test          # contrato (Word e PDF), certificado e cruzamento de carteiras
npm run test:db   # sobe um PostgreSQL temporário, aplica as migrações e roda os testes de RLS e regras
```

`npm run test:db` precisa do PostgreSQL 16 instalado (binários em `/usr/lib/postgresql/16/bin`, ou defina `PGBIN`). Os testes cobrem cada linha da matriz de permissões com usuários de todos os papéis e dois parceiros distintos, a página pública (token inválido, expirado e revogado, sem campos internos), o bloqueio de fechamento sem aprovação, o mínimo de 3 opções por categoria, o primeiro registro de indicações, o cálculo de comissão das três empresas, o status de atividade por nível e a contrapartida atrasada que só gera alerta.

Na v2, os testes cobrem a matriz de acesso das tabelas novas (só administrador vê remuneração, custos e resultado do canal; parceiro não vê faixa, maturidade, desligamento nem dados de outros parceiros; anônimo não chama `config()`), o nível de entrada pelo scorecard, a subida imediata, a observação e a proposta de rebaixamento, a proteção de 180 dias, o SLA nos dois sentidos, a nota de qualidade, a ativação e os 90 e 120 dias do onboarding, as faixas com 20 parceiros, o fluxo de desligamento, os pontos únicos por evento, o ROI do exemplo da História 1 (receita de R$ 72.000,00, custo de R$ 4.318,18, ROI de 1.567%), o cruzamento de 50 CNPJs que só grava as 5 coincidências e a página `/i/:token` com resposta neutra.

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

`indicacao-publica` é pública (`verify_jwt = false`, como a `rfp-publica`): valida o token no banco e sempre devolve a mesma resposta neutra. `cruzamento-carteiras` exige login de parceiro e nunca registra a lista recebida.

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

## Atualização da v1 para a v2

1. `npx supabase db push` aplica as migrações `20261024000010` a `20261024000019`, todas aditivas. Elas criam as tabelas novas com RLS, o bucket privado `trilhas`, os dados iniciais da v2 (atividades por esforço, critérios do scorecard, requisitos de nível, régua, catálogo de ações da Wise, indicadores, trilha "Como vender a Wise Makers" em rascunho, parâmetros e textos de e-mail) e o agendamento `wise-rotina-trimestral`.
2. `npx supabase functions deploy` publica as funções novas (`indicacao-publica`, `cruzamento-carteiras`) e as atualizadas.
3. A remuneração de referência do Guilherme (R$ 4.500,00, 220 horas, fator 1,0) já vem cadastrada pelo e-mail e se liga ao perfil sozinha. Outras pessoas: Custos, Remunerações.
4. O contrato comercial gerado passa a ser a v2 (`public/modelos/comercial.docx`; a v1 fica em `comercial_v1.docx`). Para quem assinar a v2 ou o aditivo com a cláusula 10.4, marque "Aceita cruzamento de carteiras" na aba Nossa parceria.
5. Em Configurações, Parâmetros, informe a receita nova total da Wise no período (`receita_nova_wise_periodo`) para o indicador de participação dos parceiros, e o ciclo médio da venda direta, se quiser a comparação.
6. Antes de usar com parceiros reais, rode `npm run test:db` e confira o portal do parceiro e a página `/i/:token` com parceiros fictícios.

## Lovable

O repositório segue a estrutura do Lovable (`src/`, `src/components/ui`, `src/integrations/supabase`, `supabase/functions`, `supabase/migrations`). Ao conectar, use o mesmo projeto Supabase e confira as variáveis de ambiente no painel do Lovable.
