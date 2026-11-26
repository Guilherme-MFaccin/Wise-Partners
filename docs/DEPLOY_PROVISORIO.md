# Deploy provisório do Portal Wise Partners (antes do Lovable)

Banco, autenticação e Edge Functions num projeto Supabase novo; o site estático (pasta `dist`) na Netlify. Depois, o Lovable se conecta ao mesmo projeto Supabase e a Netlify pode ser desligada.

## Estado em 28/10/2026: deploy provisório concluído

* **GitHub:** `Guilherme-MFaccin/wise-partners`, branches `main` e `ux-fundacao`.
* **Netlify:** https://portal-wise-partners.netlify.app (site público).
* **Supabase** (`eiozuvnzvqlqslihyooz`, região us-east-1):
  * 22 migrações aplicadas pela API de gestão e registradas em `supabase_migrations.schema_migrations` (um `db push` futuro não as reaplica); a 22 (metas em cascata) em 28/10/2026, sem metas cadastradas: elas entram por Configurações, Metas;
  * Vault com `project_url` e `cron_secret`; 6 agendamentos no pg_cron;
  * 10 Edge Functions publicadas, segredos `APP_URL` e `CRON_SECRET`; sem `RESEND_API_KEY`, `EMAIL_FROM` e `AI_API_KEY` (e-mails próprios e IA desligados);
  * autenticação: Site URL e Redirect URLs do portal, cadastro aberto desligado; modelos de e-mail no padrão da Supabase (o plano gratuito só permite mudar com SMTP próprio);
  * usuário `guilherme@wisemakers.com.br` criado, perfil admin;
  * testes de acesso: sem login, todas as tabelas e funções recusam; logado, o painel responde;
  * carga real: 32 parceiros, 44 contatos, 33 interações, 81 h (R$ 1.656,82).
* **Acesso por e-mail e senha (28/10/2026):** migração `20261028000021` aplicada e registrada; funções `convidar-usuario` (cria a conta com senha provisória) e `redefinir-senha` publicadas. Contas de administrador: `guilherme@wisemakers.com.br`, `igormakoto97@gmail.com` (Diretor) e `makerswise@gmail.com`, todas com senha provisória e a faixa pedindo a troca.
* **Pendente:** SMTP do Resend (e-mails em português e "Esqueci minha senha" para quem não é da equipe da Supabase); chave de IA; registro da aprovação do Igor para a alteração 2.1.0 da constituição.

## Parte 1. O que o Guilherme faz (cerca de 15 minutos)

0. **Repositório no GitHub** (também necessário para o Lovable). Em github.com, New repository: nome `portal-wise-partners`, **Private**, sem README, sem .gitignore e sem licença (vazio). Avise no chat da sessão em que o código está, para o Claude enviar as branches `main` e `ux-fundacao`. Sem isso, uma sessão nova não encontra o código.
1. **Projeto Supabase.** Em supabase.com, entre com `guilherme@wisemakers.com.br` (importante: sem SMTP próprio, o Supabase só envia o link de acesso para e-mails da equipe do projeto). New project: nome `portal-wise-partners`, região South America (São Paulo), uma senha forte para o banco (guarde com você). Ao terminar, copie o **Reference ID** em Project Settings, General. Ele não é segredo: pode mandar no chat.
2. **Conta Netlify.** Em netlify.com, crie uma conta gratuita.
3. **Duas chaves de acesso**, que **não devem ser coladas no chat**:
   * Supabase: Account, Access Tokens, Generate new token (nome "deploy provisório").
   * Netlify: User settings, Applications, Personal access tokens, New access token.
4. **Guardar as chaves no ambiente do Claude Code:** no menu do ambiente na barra de título da sessão, Edit. Em Network secrets (ou API credentials; se não houver essa seção, em variáveis de ambiente), crie:
   * `SUPABASE_ACCESS_TOKEN` com a chave da Supabase;
   * `NETLIFY_AUTH_TOKEN` com a chave da Netlify.
5. **Nova sessão:** as chaves só aparecem numa sessão nova. Abra uma com o repositório `portal-wise-partners` e escreva: "Faça o deploy provisório seguindo `docs/DEPLOY_PROVISORIO.md`. O Reference ID é XXXX." Se quiser os dados reais já no deploy, anexe na mesma mensagem o arquivo `carga_real.sql` (a pasta `dados-reais/` fica fora do git e não existe numa sessão nova).

As duas chaves dão acesso de escrita às contas. Depois do deploy, apague-as nas próprias contas (Supabase e Netlify) e no ambiente.

## Parte 2. O que o Claude faz na sessão nova

Variáveis: `SUPABASE_ACCESS_TOKEN`, `NETLIFY_AUTH_TOKEN` e o Reference ID (`REF`) informado pelo Guilherme. Tudo por HTTPS (API de gestão da Supabase e API da Netlify); nenhuma conexão direta na porta 5432.

1. **Conferir acesso:** `GET https://api.supabase.com/v1/projects/$REF` e `GET https://api.netlify.com/api/v1/user`. Sem as variáveis, parar e pedir a Parte 1.
2. **Migrações:** aplicar `supabase/migrations/*.sql` em ordem, uma por chamada, com `POST /v1/projects/$REF/database/query` (corpo `{"query": "..."}`). Parar no primeiro erro e corrigir só com migração nova e aditiva (nunca editar uma aplicada). Antes da `20261023000009_agendamentos.sql`, gravar no Vault:
   `select vault.create_secret('https://REF.supabase.co', 'project_url'); select vault.create_secret('<CRON_SECRET>', 'cron_secret');`
   com `CRON_SECRET` aleatório (`openssl rand -hex 32`).
   **Nunca** rodar `supabase/seed_demo.sql` neste projeto.
3. **Chaves do projeto:** `GET /v1/projects/$REF/api-keys?reveal=true` para a chave pública (anon ou publishable) e a de serviço (service_role). A de serviço só é usada nos passos 5 e 7, nunca vai para o frontend nem para arquivos do repositório.
4. **Site na Netlify:** criar o site (`POST /api/v1/sites` com nome `portal-wise-partners` ou o primeiro livre) para saber o endereço final `https://NOME.netlify.app` (`APP_URL`).
5. **Edge Functions:** segredos com `POST /v1/projects/$REF/secrets`: `APP_URL`, `CRON_SECRET` e, se já houver, `RESEND_API_KEY`, `EMAIL_FROM` e `AI_API_KEY` (sem as chaves de e-mail e de IA o portal funciona, mas não envia e-mails próprios nem faz extração e resumos por IA). Publicar com `SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy --project-ref $REF --use-api`, respeitando `verify_jwt` do `supabase/config.toml`.
6. **Autenticação:** `PATCH /v1/projects/$REF/config/auth` com `site_url` = `APP_URL`, `uri_allow_list` = `APP_URL/**` e cadastro aberto desligado (`disable_signup: true`). Modelos de e-mail de Magic Link e Invite em português, sem travessão.
7. **Primeiro usuário:** criar `guilherme@wisemakers.com.br` pela API de administração (`POST https://$REF.supabase.co/auth/v1/admin/users` com a chave de serviço, `email_confirm: true`). O perfil de administrador nasce do convite que a migração deixou. O Igor entra depois pela tela Usuários, quando o e-mail dele for informado.
8. **Frontend:** `VITE_SUPABASE_URL=https://$REF.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=<chave pública> npm run build`; compactar `dist` (já inclui `public/_redirects`, que manda todas as rotas para `index.html`) e publicar com `POST /api/v1/sites/<id>/deploys` (`Content-Type: application/zip`).
9. **Testes de acesso no projeto real** (a constituição pede antes de dados reais): `npm run test:db` passando no banco local; no projeto real, sem login, ler `parceiros`, `comissoes`, `perfis` e `remuneracoes` pela API REST com a chave pública deve devolver lista vazia ou 401; `rfp-publica` e `indicacao-publica` com token inválido devem devolver a resposta neutra; abrir `/entrar`, pedir o link e entrar como Guilherme.
10. **Dados reais (só com o arquivo anexado e depois do passo 9):** rodar `carga_real.sql` com a mesma API de consulta. Ela confere que não há seed de demonstração, exige o perfil do Guilherme, pula parceiros que já existam e não duplica horas.
11. **Entregar:** endereço do portal, o que ficou sem configurar (Resend, IA, e-mail do Igor) e o lembrete de apagar as chaves.

## Limites do deploy provisório

* E-mails de acesso pelo SMTP padrão da Supabase: poucos por hora e só para a equipe do projeto. Para convidar o Igor e parceiros, configure o SMTP do Resend (README, Implantação, passo 3).
* Endereço `*.netlify.app`. Um domínio da Wise (por exemplo `parceiros.wisemakers.com.br`) pode ser ligado depois na Netlify ou no Lovable.
* Plano gratuito da Supabase: o projeto pausa depois de uma semana sem uso e volta ao abrir o painel.

## Site novo na conta da Wise (06/11/2026)

* Conta da Netlify: Ferramentas Wise Makers (time `ferramentas-wise-makers`, plano Personal, 1.000 créditos por mês; cada publicação gasta 15).
* Site: `wisepartners` (id `693c7fd2-ae91-4168-bae7-726591407213`), em https://wisepartners.netlify.app, com o domínio partners.wisemakers.com.br (CNAME `partners` na Hostinger apontando para wisepartners.netlify.app). O primeiro site com esse nome foi recriado porque ficou preso tentando emitir certificado para wisepartners.com.br, que não chegou a existir.
* Sites novos da Netlify nascem privados (`sso_login`): o acesso público foi liberado pela API, e o selo "Powered by Netlify" está desligado.
* O site antigo (portal-wise-partners.netlify.app, na conta pessoal) fica como está até o domínio novo funcionar; depois recebe só um redirecionamento para o domínio novo.
* Publicação: build com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e envio da pasta `dist` em zip para `POST /api/v1/sites/<id>/deploys`, com o token da conta nova guardado no ambiente como `NETLIFY_AUTH_TOKEN` (nunca no chat nem no repositório).

## Publicação de 19/11/2026

* Migrações `20261107000027` (fila de parceiros da página) e `20261119000028` (documentos internos) aplicadas e registradas.
* Função `cadastro-parceiro` publicada de novo; termo de adesão e política de privacidade na versão 2026-11-07.
* Documento "Modelo de negócio e arquitetura de processos" (v12) gravado em `documentos_internos` com `scripts/publicar-documento.py`; leitura só para o time interno (sem login, a API recusa).
* Perfil para a reunião de diagnóstico: 3 vendedores ou mais e faturamento a partir da faixa de R$ 250 mil a R$ 500 mil (`config_landing_cliente`), como decidido no FO-15. A pergunta sobre venda complexa e ciclo de venda depende do FO-18.
* Páginas dos parceiros e do cliente: reunião de cerca de 2 horas, plano de ação em até 2 dias úteis, valor de referência R$ 2.000 do diagnóstico e R$ 3.000 do Wise Hub (R$ 5.000) e os 8 cases com a média de +35%.

## Publicação de 20/11/2026 (portal v3)

* Migrações `20261120000029` (páginas editáveis, valores, cases) e `20261120000030` (fila de tarefas, diagnósticos com consultor, candidatos por origem) aplicadas e registradas.
* Funções `cadastro-parceiro` e `cliente-parceiro` publicadas: devolvem conteúdo, valores, perfil da reunião e cases; a do cliente não devolve mais nome nem logo do parceiro.
* Site publicado com a navegação nova (seis seções internas, cinco do parceiro), Tarefas, Candidatos, Diagnósticos e Programa, Páginas.
* Documento "Modelo e processos" na versão v13.
* Conferido no ar: páginas únicas em 375, 768 e 1440 px sem erro; a página do cliente não mostra o nome do parceiro do link; sem login, cases e fila de tarefas são recusados.

## Publicação de 21/11/2026 (wireframe e coerência da entrada)

* Migração `20261120000031` (etapas do onboarding, ativação no primeiro cliente pelo link, lembrete aos 14 dias, modo fila travado) aplicada e registrada.
* Função `cadastro-parceiro` publicada sem o caminho de acesso direto.
* Site publicado: Programa, Wireframe; raiz sem login abre /parceiros; criação de senha no primeiro acesso; Primeiros passos em seis etapas; tela Indicar com um link na frente.
* Documento "Modelo e processos" na versão v14.
* Conferido no ar: / leva a /parceiros; /entrar mostra o caminho para candidatos; o cadastro não pede senha; sem login, etapas e marcas do onboarding não aparecem.

## Publicação de 23/11/2026 (gerenciador de tarefas e Catálogo de parceiros)

* Migrações `20261121000032` (gerenciador de tarefas: tabela de tarefas, comentários e sincronização com as regras) e `20261122000033` (Catálogo de parceiros: ofertas, pedidos com protocolo, clientes do grupo, níveis pelo FO-19) aplicadas e registradas.
* Função `convidar-usuario` publicada: consultor e comercial criam o acesso de clientes do grupo.
* Site publicado: Tarefas em quadro, lista e calendário; seção Catálogo na área da Wise (Ofertas, Pedidos, Clientes do grupo) e na do parceiro (Catálogo, Minhas ofertas, Pedidos); Wireframe com a opção Ver como.
* Documento "Modelo e processos" na versão v15.
* Conferido no ar: /parceiros e /entrar em 375, 768 e 1440 px sem erro e sem rolagem lateral; sem login, tarefas, ofertas, pedidos e catálogo são recusados.

## Publicação de 23/11/2026 (Comunidade Wise Partners)

* Migração `20261123000034` (Comunidade: `config_comunidade`, `membros_comunidade`, cadastro com conta na hora, confirmação do cliente do grupo, catálogo em vitrine, link de indicação para clientes confirmados, minicurso aberto às empresas, tarefas novas) aplicada e registrada.
* Função `cadastro-comunidade` publicada (sem verificação de JWT, como as outras páginas públicas).
* Site publicado: `/comunidade` (a raiz sem login abre ela), `/comunidade/cadastro`, `/comunidade/termo`; área logada por tipo de acesso; seção Comunidade na área da Wise; aba Comunidade em Programa, Páginas.
* Documento "Modelo e processos" na versão v16.
* Conferido no ar: as quatro páginas em 375, 768 e 1440 px sem erro, sem rolagem lateral e sem travessão; a função devolve a configuração e recusa senha curta e CNPJ inválido sem gravar nada. O cadastro completo (criar conta e entrar) não foi testado em produção, para não criar dados de teste no banco real.

## Publicação de 26/11/2026 (entrada única pela página do portal)

* Migração `20261126000035` (fila única para qualquer empresa com o perfil declarado, aviso ao gerente, `aprovar_cadastro_comunidade`, termo de adesão exigido só para parceiro, cadastro com conta na hora da comunidade fechado) aplicada e registrada. Não havia cadastros da comunidade em produção.
* Função `cadastro-parceiro` publicada: devolve as empresas do grupo, os números do catálogo e a versão do termo de uso, e recebe o formulário único.
* Site publicado: página do portal (`/parceiros`) com Entrar e Cadastrar e textos para qualquer empresa; `/comunidade` leva a ela; fila com Adicionar (cliente do grupo, empresa da comunidade ou parceiro); Comunidade como primeira tela do cliente; seção Cadastros; termo de uso em Textos legais.
* Documento "Modelo e processos" na versão v17.
* Conferido no ar: raiz, `/parceiros`, `/comunidade`, `/comunidade/termo` e `/entrar` em 375, 768 e 1440 px sem erro, sem rolagem lateral e sem travessão; o formulário único abre com as três etapas; a função recusa CNPJ inválido sem gravar nada. Nenhum cadastro de teste foi criado no banco real.
