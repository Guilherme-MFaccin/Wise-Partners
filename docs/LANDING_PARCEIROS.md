# Landing page dos parceiros SaaS (CRM e ERP)

Página pública `/parceiros` do portal, para quem chega dos anúncios do Meta. Uma ação só: cadastrar a empresa no Programa Wise Partners, com aceite eletrônico do termo padrão e acesso ao portal na hora. Decisões do patrocinador nos formulários FO-07, FO-08 e FO-09 (`mapeamentos/wise-partners-to-be/respostas/`).

## O que foi construído (06/11/2026)

| Parte | Arquivo | O que faz |
| --- | --- | --- |
| Migração 23 | `supabase/migrations/20261106000023_landing_parceiros.sql` | Aceite eletrônico conta como aprovação de assinatura; tabela `config_landing` (publicação, vídeo, IDs de medição, termo e política); tabela `cadastros_landing` (cada cadastro com UTM e versões aceitas); funções `cadastrar_parceiro_landing` e `desfazer_cadastro_landing` (só a service_role); categoria "Outro tipo de software" |
| Função pública | `supabase/functions/cadastro-parceiro/index.ts` | GET: tipos de software, vídeo e IDs de medição, ou o texto do termo e da política. POST: cadastro completo, conta de acesso com a senha escolhida, evento na API de Conversões do Meta (quando ativa) e e-mail de boas-vindas (com o Resend) |
| Página | `src/pages/publico/LandingParceiros.tsx` | Página longa: topo com vídeo, problema, três passos, resultados para o SaaS, casos Protectpool e Fusion, como participar, cadastro, 12 perguntas frequentes e chamada final |
| Termo e política | `src/pages/publico/TextoLegalParceiros.tsx` | `/parceiros/termo` e `/parceiros/privacidade`, com o texto vigente da configuração |
| Administração | `src/components/config/LandingPage.tsx` | Configurações, aba "Landing page dos parceiros": publicação, vídeo, pixel do Meta, GA4, API de Conversões, termo, política e a lista de cadastros com a campanha e o anúncio de origem |
| Medição | `src/lib/landing.ts` | Guarda UTM e fbclid da primeira visita; carrega pixel e GA4 só com ID preenchido; evento `CompleteRegistration` com o mesmo `event_id` no navegador e no servidor |
| Testes | `tests/db/landing.test.ts`, `tests/unit/landing.test.ts` | Cadastro, recusas, desfazer, permissões; CNPJ, máscaras e vídeo |

Quem se cadastra entra como parceiro comercial, origem `landing_saas`, nível Select e pacote Prateleira (a confirmar pelo time), já em onboarding, com o contato como responsável da parceria. Sem filtro: quem não é CRM nem ERP entra na categoria que escolheu.

## Imagens (06/11/2026)

Em `public/landing/`, tiradas do material enviado pelo usuário:

* `igor-capa.webp`: capa com o Igor no lugar do vídeo que ainda vai ser gravado. Aparece enquanto o endereço do vídeo estiver vazio em Configurações; com vídeo em arquivo, vira a capa do player.
* `cliente-01.webp` a `cliente-28.webp`: logos de clientes, recortados do slide 5 da apresentação de parceria. Faixa logo abaixo do topo (12 no celular, 28 a partir de 640 px).
* `evento.webp`: foto do slide 4, na chamada do meio.
* `wise-hub.webp`: tela do Wise Hub do slide 12, em "O que está incluído".

Os casos da Protectpool e da Fusion têm o botão "Ver o caso completo": a página de celular abre em telas até 639 px, a de computador nas demais.

* Seção "Wise Hub": quanto custaria cada entrega contratada à parte (R$ 15.000 no total, valores da página wisemakershub.com) e quanto custa pro cliente do parceiro (R$ 0).
* Seção "Depoimentos": os três vídeos da plataformawise.com (Protectpool, Fusion e Cristal Móveis). As capas ficam em `public/landing/depoimento-*.webp`; o vídeo do YouTube (youtube-nocookie) só carrega quando a pessoa clica e abre numa janela.

## Diferença em relação ao pedido

O pedido era "cria o acesso e manda o login por e-mail". O portal ainda não tem SMTP próprio (Resend), e sem ele a Supabase só envia e-mail para a equipe do projeto. Por isso a pessoa cria a própria senha no formulário e entra direto no portal. Com o Resend configurado, a função também manda um e-mail de boas-vindas. O e-mail não é verificado: alguém poderia se cadastrar com o e-mail de outra pessoa. Com o Resend, dá para passar a exigir confirmação.

## Estado em 06/11/2026: publicada

* Migração 23 aplicada no projeto `eiozuvnzvqlqslihyooz` e registrada em `supabase_migrations.schema_migrations`.
* Função `cadastro-parceiro` publicada (sem verificação de JWT); responde com os 24 tipos de software do banco.
* Site novo na Netlify: https://portal-wise-partners.netlify.app/parceiros. O deploy também corrigiu o "Page not found" das rotas abertas direto (`/entrar`, `/app`), que o deploy anterior tinha sem `_redirects`.
* Não testado com cadastro real, para não criar parceiro de teste em produção; o caminho de erro (sem aceite) respondeu certo.

## Publicar de novo (exige as chaves da Supabase e da Netlify)

1. Aplicar a migração 23 pela API de gestão, como em `docs/DEPLOY_PROVISORIO.md`, e registrá-la em `supabase_migrations.schema_migrations`.
2. Publicar a função `cadastro-parceiro` com `verify_jwt = false` (já em `supabase/config.toml`).
3. Opcional: segredo `META_CAPI_TOKEN` na função, para a API de Conversões.
4. `npm run build` e publicar a pasta `dist` na Netlify. A página fica em `https://portal-wise-partners.netlify.app/parceiros`.
5. Em Configurações, Landing page dos parceiros: colar o endereço do vídeo, o ID do pixel e o do GA4; ligar a API de Conversões se o segredo existir.

## Antes de rodar os anúncios

- Vídeo final do Igor (a página mostra um espaço reservado até lá).
- Vídeo: até ele entrar, a capa do Igor tem o ícone de play, mas não toca.
- Cristal Móveis: o número "2x o faturamento" veio só do título do vídeo; confirmar e, se houver, trazer o caso completo.
- Reunião individual: a página do Wise Hub diz "empresas com +3 vendedores"; esta página segue o FO-09 (a partir de R$ 250 mil por mês e duas pessoas no comercial).
- Logos de clientes: confirmar se todas as 28 empresas autorizam o uso do logo em anúncio pago.
- Revisão jurídica do termo de adesão e da política de privacidade (minutas na migração 23, editáveis no portal).
- Autorização da Protectpool e da Fusion Alumínios para nome, números e a frase do João Vitor em anúncio pago.
- Links dos anúncios com UTM, um `utm_content` por vídeo (ex.: `video-1` a `video-5`), para a lista de cadastros mostrar qual vídeo trouxe cada parceiro.
- Portal do parceiro: link exclusivo da consultoria, mensagem pronta e treinamento de como apresentar a Wise. A página promete isso, e hoje o portal ainda não tem a segunda landing page nem o treinamento.
