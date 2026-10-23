# Briefing técnico para o /speckit.plan

Este documento orienta o plano técnico. Ele não substitui o `spec.md`: o spec diz o que o sistema faz; aqui estão as decisões técnicas já tomadas e um ponto de partida para o modelo de dados, as permissões, as automações e a IA. O plano pode refinar tudo, desde que respeite a constituição.

## 1. Pilha e arquitetura

* Aplicação de página única com **Vite, React, TypeScript, Tailwind CSS e shadcn/ui**, no mesmo formato que o Lovable gera, para que o repositório possa ser conectado ao Lovable depois.
* **Supabase** para autenticação (link mágico por e-mail), PostgreSQL com Row Level Security, Storage (arquivos privados) e Edge Functions (Deno).
* **Agendamentos** com `pg_cron` chamando Edge Functions.
* **E-mail** pelo Resend, chamado de Edge Functions, com a chave em variável de ambiente.
* **IA** por uma Edge Function única de "gateway" (`ai-gateway`) que recebe a tarefa e chama o provedor configurado por variável de ambiente (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`). No Lovable, usar o Lovable AI. Todas as respostas da IA em JSON validado por esquema (zod).
* **Rotas**: `/app/*` área interna, `/parceiro/*` portal do parceiro, `/r/:token` página pública de RFP, `/entrar` login.
* Sem renderização no servidor. A página `/r/:token` busca os dados por uma Edge Function pública que devolve apenas campos permitidos.
* Idioma `pt-BR`, fuso `America/Sao_Paulo`, moeda BRL.

## 2. Modelo de dados (ponto de partida)

Convenções: `id uuid`, `created_at`, `updated_at`, `created_by`. Todas as tabelas com RLS ligado.

**Organização e acesso**

| Tabela | Campos principais |
|---|---|
| `empresas_grupo` | nome (Wise Makers, Tríade, Swallow), regra de comissão: base, % parceiro, % responsável |
| `perfis` | user_id, nome, e-mail, telefone, papel (admin, parcerias, consultor, comercial, financeiro, parceiro), empresa_grupo_id (internos), parceiro_id (usuários de parceiro), is_diretor, ativo, preferências de alerta |

**Configuração**

| Tabela | Campos principais |
|---|---|
| `categorias` | nome, tipo (comercial ou institucional), perfil institucional, ordem, ativa |
| `campos_categoria` | categoria_id (nulo = perfil comum), chave, rótulo, tipo, opções (jsonb), obrigatório, uso_rfp, ordem, ativo |
| `niveis` | código, nome, faixa mínima e máxima, dias para morno, dias para dormente, cor |
| `pacotes` | código, nome, níveis permitidos, entregas (jsonb) |
| `catalogo_contrapartidas` | nome, pacote, nível (opcional), tipo de parceria, periodicidade, prazo inicial em dias, forma de comprovação, ativa |
| `tipos_atividade` | nome, duração estimada em minutos |
| `etapas_funil` e `motivos_perda` | nome, ordem |
| `criterios_icp` | chave, descrição, tipo |
| `modelos_contrato` | tipo (comercial, institucional), versão, arquivo docx com marcadores, vigente |
| `configuracoes` | chave e valor: e-mail do financeiro, endereço do Wise Hub, horário dos alertas, dia do relatório semanal, validade do link de RFP, prazos de negociação parada |

**Parceiros**

| Tabela | Campos principais |
|---|---|
| `parceiros` | razão social, fantasia, CNPJ, site, cidade, UF, tipo de parceria, natureza jurídica, perfil institucional, categoria principal, categoria de empresa, origem, responsável (perfil), relação de origem, etapa, motivo de perda, nível, ajuste de nível e motivo, carteira no ICP, pacote, estratégico, status de atividade, motivo da inatividade, pausado até, data do último contato, data de assinatura |
| `parceiro_categorias` | parceiro_id, categoria_id, principal |
| `parceiro_campos` | parceiro_id, campo_id, valor (jsonb), versão publicada |
| `ficha_apresentacao` | parceiro_id, conteúdo (jsonb: o que faz, diferenciais, visão da Wise, para quem, segmentos, porte, regiões, cases, WhatsApp e e-mail comerciais), estado (publicada, proposta), proposta por, revisada por |
| `contatos` e `parceiro_contatos` | pessoa; vínculo com papel na negociação |
| `pontos_contato` | parceiro_id, tipo, data, participantes, texto, resumo IA (jsonb), tipo_atividade_id, minutos estimados, anexos |
| `proximos_passos` | parceiro_id, descrição, data, responsável, estado (aberto, feito, vencido) |
| `documentos` | parceiro_id, tipo, versão, caminho no Storage, autor |
| `aprovacoes` | parceiro_id, tipo (assinatura), aprovado_por, data, observação |
| `quadros_identificacao` | parceiro_id, tipo de contrato, dados (jsonb com os marcadores da seção 6), versão |
| `contratos_gerados` | quadro_id, modelo_id, caminho docx, caminho pdf, versão |
| `contrapartidas` | parceiro_id, catálogo_id, próxima data, estado (pendente, enviada, validada, recusada, atrasada) |
| `comprovacoes` | contrapartida_id, enviada por, arquivo ou link, estado, motivo de recusa, validada por |
| `ciclos_base_ativa` | parceiro_id, posição na fila, estado, início, encontros (jsonb), evento, revisão agendada |

**Indicações e RFP**

| Tabela | Campos principais |
|---|---|
| `clientes` | razão social, CNPJ, contato, e-mail, telefone, consentimento declarado (quem, quando), cliente existente por empresa do grupo |
| `indicacoes` | sentido (parceiro para grupo, grupo para parceiro), parceiro_id, empresa_grupo_id, cliente_id, origem (grupo de WhatsApp, Hub, evento, RFP, portal do parceiro, outra), aderência ao ICP (jsonb por critério), etapa, valor base, atualização pendente do parceiro, responsável Wise |
| `comissoes` | indicacao_id, beneficiário (parceiro, responsável, grupo), percentual, base, valor, estado (aguardando fechamento, aguardando compensação, a pagar, nota recebida, paga), datas |
| `pedidos_rfp` | cliente_id, consultor_id, empresa_grupo_id, necessidade, porte, região, prazo, restrições, categorias sugeridas (jsonb), estado |
| `pedido_rfp_opcoes` | pedido_id, categoria_id, parceiro_id, ordem, justificativa IA, texto final |
| `paginas_rfp` | pedido_id, token (aleatório, 32 bytes, base64url), blocos (jsonb), publicada_em, expira_em, revogada, aberturas |
| `eventos_rfp` | pagina_id, tipo (abertura, clique WhatsApp, clique e-mail), parceiro_id, data, user agent resumido |

**Sistema**

| Tabela | Campos principais |
|---|---|
| `historico` | tabela, registro, campo, valor anterior, valor novo, autor, data (preenchido por gatilhos) |
| `notificacoes` | usuário, tipo, referência, lida, enviada por e-mail |

## 3. Matriz de permissões (aplicada por RLS)

| Recurso | Admin | Parcerias | Consultor ou gerente de conta | Comercial | Financeiro | Parceiro |
|---|---|---|---|---|---|---|
| Parceiros e fichas | Tudo | Tudo | Ler | Ler | Ler básico | Só o próprio, sem campos internos |
| Marcação estratégica e anotações internas | Tudo | Tudo | Ler | Ler | Não | Não |
| Pontos de contato | Tudo | Tudo | Ler e criar | Ler | Não | Não |
| Contratos e Quadro | Tudo | Tudo | Ler | Não | Não | Ler o próprio contrato assinado |
| Aprovar assinatura | Só o Diretor | Não | Não | Não | Não | Não |
| Contrapartidas | Tudo | Tudo | Ler | Não | Não | Ler as próprias e enviar comprovação |
| Indicações | Tudo | Tudo | Ler e criar, sem valores de comissão | Ler e criar, sem valores de comissão | Ler | As próprias; criar; atualizar resultado das recebidas (pendente) |
| Comissões | Tudo | Tudo | Não | Não | Ler as "a pagar" em diante e marcar pagamento | Só as próprias como beneficiário; nunca a do responsável |
| Pedidos e páginas de RFP | Tudo | Tudo | Criar e gerir os próprios; ler todos | Ler | Não | Ler os pedidos em que foi apresentado (cliente, data, necessidade resumida, cliques), nunca os outros parceiros do pedido |
| Configuração | Tudo | Ler | Não | Não | Não | Não |
| Usuários | Tudo | Convidar parceiros | Não | Não | Não | Responsável convida e desativa usuários da própria empresa |

Comissões ficam em tabela separada exatamente para que a RLS esconda os valores sem depender da interface. Campos internos do parceiro que o próprio parceiro não pode ver (estratégico, anotações, responsável de origem) devem ficar em tabela separada ou ser expostos ao parceiro por uma view segura.

## 4. Automações e agendamentos

| Rotina | Quando | O que faz |
|---|---|---|
| Recalcular status | Todo dia às 6h30 | Status de atividade, próximos passos vencidos, contrapartidas atrasadas, negociações paradas, links de RFP expirados |
| Resumo diário | Dias úteis às 7h (10h UTC) | Um e-mail por usuário com as próprias pendências; nada se não houver |
| Relatório do Diretor | Semanal, dia e hora configuráveis | Indicadores do painel, mudanças da semana, pontos de atenção |
| Aviso ao financeiro | No evento | Quando uma comissão passa para "a pagar" |
| Avisos imediatos | No evento | Aprovação pendente para o Diretor; proposta de ficha do parceiro; comprovação enviada; indicação nova pelo portal; clique no WhatsApp de uma página de RFP (consultor e parceiro) |
| Backup | Semanal | Exportação completa em JSON e CSV para o Storage, com aviso ao administrador |

Considerar feriados nacionais na contagem de dias úteis (tabela `feriados` editável).

## 5. Funções de IA

Todas pela Edge Function `ai-gateway`, com saída em JSON validado, texto em português do Brasil, sem travessão nem meia-risca, e nenhuma gravação sem confirmação do usuário.

| Tarefa | Entrada | Saída |
|---|---|---|
| `resumir_contato` | Texto ou transcrição colada, ficha atual | Resumo, decisões, pendências de cada lado, próximo passo com data, sugestões de atualização de campos |
| `ler_print` | Imagem | Mensagens com autor, data e texto |
| `extrair_dossie` | PDF de dossiê | Dados da empresa, contatos, linha do tempo, pendências, campos da categoria |
| `recomendar_rfp` | Necessidade, porte, região, restrições, fichas publicadas dos parceiros assinados com campos [RFP] | Categorias envolvidas e, em cada uma, parceiros ordenados com justificativa |
| `montar_pagina_rfp` | Pedido e opções escolhidas | Blocos padronizados: abertura, por categoria, ficha de cada parceiro, aviso de relação comercial, contato do consultor |
| `pauta_semanal` | Indicadores do painel | Texto da pauta |
| `contexto_parceiro` | Ficha completa | Texto para colar em outra IA (pode ser montado sem IA) |

A recomendação de RFP deve filtrar no banco antes da IA: só parceiros assinados, ativos e com ficha publicada. A IA só ordena e justifica.

## 6. Geração de contratos

* Modelos em `referencias/contratos/`: `modelo_contrato_parceria_comercial.docx` e `modelo_contrato_parceria_institucional.docx`, já com marcadores no formato `{marcador}` (compatível com docxtemplater).
* **Word**: preencher o modelo com docxtemplater na Edge Function `gerar-contrato`.
* **PDF**: converter o Word preenchido para PDF. Como o ambiente de Edge Functions não tem LibreOffice, o plano deve escolher uma destas opções: (a) serviço de conversão (por exemplo, Gotenberg em contêiner próprio), (b) API de conversão de terceiros, ou (c) gerar o PDF a partir de um modelo HTML com o mesmo texto. Preferência por (c) se evitar custo novo, desde que o texto do PDF seja idêntico ao do Word.
* Marcadores de caixa de seleção (`cx_*`) recebem `☒` quando marcados e `☐` quando não.

**Marcadores do contrato comercial**: razao_social, razao_social_maiusculas, cnpj, endereco, cx_select, cx_premium, cx_elite, carteira_icp, cx_pacote_c, cx_pacote_b, cx_pacote_a, categoria_prateleira, cx_instrumento_proprio, instrumento_parceiro, cx_percentual, comissao_parceiro_percentual, comissao_parceiro_base, comissao_parceiro_condicao, exigencias_solucao, cx_ba_nao_se_aplica, cx_ba_data, ba_primeiro_encontro, cx_ba_fila, ba_previsao, responsavel_parceiro, responsavel_wise, data_inicio, data_extenso.

**Marcadores do contrato institucional**: nome_instituicao, nome_instituicao_maiusculas, natureza_juridica_texto, cnpj, endereco, representante, cx_privada, cx_publica, cx_paraestatal, cx_ecossistema, cx_convocador, cx_viveiro, cx_vitrine, cx_inst_a, cx_inst_b, cx_inst_c, empresas_convocadas_icp, contrapartidas_instituicao, contrapartidas_wise, calendario, cx_sem_instrumento, cx_com_instrumento, instrumento_instituicao, cx_prazo_indeterminado, cx_prazo_determinado, prazo_meses, prazo_inicio, cadencia, responsavel_instituicao, responsavel_wise, data_inicio, data_extenso.

## 7. Página pública de RFP

* Rota `/r/:token`, sem login. A Edge Function `rfp-publica` valida token, validade e revogação e devolve só os blocos publicados e os dados de contato comercial de cada parceiro.
* Cabeçalhos `noindex, nofollow`; limite de requisições por IP.
* Cada abertura e cada clique gravados em `eventos_rfp`.
* Botão de WhatsApp: `https://wa.me/<telefone só com dígitos, com 55>?text=<mensagem codificada>`, com a mensagem: "Olá, sou cliente da Wise Makers e preciso resolver {problema resumido}. Eles indicaram o contato de vocês para eu conhecer melhor a solução." O clique passa por um registro antes de redirecionar.
* Sem WhatsApp comercial cadastrado, mostrar o e-mail comercial.
* Identidade da Wise: fundo escuro, verde menta `#00E193`, logo clara. Layout pensado primeiro para celular.

## 8. E-mails (modelos editáveis)

Link de acesso; convite ao parceiro; resumo diário; relatório semanal do Diretor; aprovação pendente; comissão a pagar (financeiro); proposta de ficha; comprovação enviada; indicação nova; clique no WhatsApp de RFP; backup concluído. Todos em português, com a identidade da Wise e sem travessões.

## 9. Dados iniciais (seed)

* Empresas do grupo e regras de comissão (spec, Apêndice A).
* Níveis, pacotes, prazos e ICP (Apêndice A).
* Categorias e campos (`categorias-campos.md`).
* Tipos de atividade (Apêndice C) e catálogo de contrapartidas (Apêndice D).
* Etapas e motivos de perda.
* Usuários iniciais: Guilherme Faccin (admin, parcerias, guilherme@wisemakers.com.br) e Igor Makoto (admin, Diretor; e-mail a informar).
* Parceiros: `dados-iniciais/parceiros.csv`, depois dossiês de `referencias/dossies/` pela função `extrair_dossie`.

## 10. Testes obrigatórios

* Testes de RLS para cada linha da matriz da seção 3, com usuários de teste de cada papel e dois parceiros distintos.
* Página pública: token inválido, expirado e revogado; ausência de campos internos e de comissão na resposta.
* Regras: bloqueio de "fechamento" sem aprovação; mínimo de 3 opções por categoria; primeiro registro em indicações; cálculo de comissão das três empresas; status de atividade por nível; contrapartida atrasada só gera alerta.
* Geração de contrato com todos os marcadores preenchidos e nenhum `{` restante no documento final.

## 11. Compatibilidade com o Lovable

* Manter a estrutura padrão do Lovable (`src/`, `src/components/ui` do shadcn, `src/integrations/supabase`, `supabase/functions`, `supabase/migrations`).
* Toda mudança de banco por migração versionada.
* Variáveis de ambiente documentadas em `.env.example`.
* Ao conectar o repositório ao Lovable, o projeto Supabase pode ser o mesmo; conferir as variáveis no painel do Lovable.
