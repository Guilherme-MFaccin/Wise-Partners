# Briefing técnico da feature 002 para o /speckit.plan

Ponto de partida do plano da versão 2.0. Foi escrito a partir do código da v1 que está no repositório (`supabase/migrations/20261023000001` a `...0009`, `supabase/functions/`, `src/`). O plano pode mudar os detalhes, desde que respeite a constituição 2.0.0 e o `spec.md` desta feature.

## 1. Regras gerais da implementação

* **Migrações novas e aditivas**, a partir de `20261024000010`. Nenhuma migração da v1 é editada.
* **RLS filtra linhas, não colunas.** Dado sensível nunca vai em coluna nova de uma tabela que outro papel já lê (`atividades`, `contrapartidas`, `indicacoes`, `parceiros`): vai em tabela própria, como a v1 fez com `parceiros_interno` e `comissoes`, ou é exposto só por função.
* **RLS em toda tabela nova.** A migração `0006_rls.sql` ativou RLS com um laço sobre as tabelas existentes naquele momento; tabelas criadas depois não são cobertas por ele. Cada migração nova precisa de `enable row level security`, `revoke all ... from anon` e políticas explícitas.
* **Regras no banco**, como na v1: gatilhos e funções concentram cálculo de nível, revisão, SLA, proteção, ativação, faixas e pontos. A interface só orienta.
* **Padrões da v1 que continuam**: `security definer` com `search_path = public` nas funções de acesso; `public.hoje()` para datas de Brasília; `add_dias_uteis` e `dias_uteis_entre` para prazos em dias úteis; `trg_historico(...)` para histórico; `notificar`, `notificar_parceiro` e `notificar_responsavel` para avisos; `config_int` e `config` para parâmetros.
* **Sem dados reais no banco.** Parceiros de teste podem ser recalculados pela migração.
* **Pilha mantida**: Vite, React, TypeScript, Tailwind, shadcn/ui, TanStack Query, supabase-js, docxtemplater, pdf-lib, zod; Edge Functions em Deno; pg_cron e pg_net.

## 2. Migrações sugeridas

| Migração | Conteúdo |
|---|---|
| 0010_custos_esforco | `remuneracoes`, `atividades_custo`, `custos_diretos`, ampliação de `tipos_atividade`, parâmetros do canal, correção de acesso da função `config()` (seção 4.1) |
| 0011_recrutamento_nivel | colunas novas em `parceiros`, `criterios_scorecard`, `scorecards`, `requisitos_nivel`, `revisoes_nivel`, etapas novas no funil, troca da regra de nível |
| 0012_onboarding_capacitacao | `planos_onboarding`, `marcos_onboarding`, `trilhas`, `trilha_modulos`, `trilha_perguntas`, `trilha_progresso`, `trilha_tentativas`, `certificados` |
| 0013_indicacoes_v2 | colunas novas em `indicacoes`, `links_indicacao`, `checagens_cliente`, proteção de 180 dias, SLA, nota de qualidade |
| 0014_acoes_regua_desligamento | `catalogo_acoes_wise`, `acoes_wise`, visão `v_acoes_conjuntas`, colunas de resultado em `contrapartidas`, `regua_atendimento`, `faixas`, `fluxos_desligamento`, `pontos_ranking`, `premiacoes` |
| 0015_gestao | `indicadores`, `metas`, `fase_programa`, `pesquisas_satisfacao`, `avaliacoes_maturidade`, `versoes_regras`, `comunicados`, `comunicado_leituras`, `metas_pessoa` |
| 0016_cruzamento | `base_wise_cruzamento`, `aceites_cruzamento`, `cruzamentos`, `coincidencias_cruzamento` |
| 0017_rls_v2 | políticas de todas as tabelas acima e ajustes nas políticas da v1 que mudam (seção 5) |
| 0018_seed_v2 | catálogos, critérios, requisitos, régua, pontos, indicadores, textos de e-mail e parâmetros novos (seção 9) |
| 0019_agendamentos_v2 | novos itens nas rotinas e agendamentos (seção 6) |

## 3. Modelo de dados

### 3.1 Tabelas novas

**Custos e esforço**

* `remuneracoes`: id, perfil_id, valor_mensal, horas_mensais (padrão 220), fator_encargos (padrão 1,0), vigente_desde, created_by. Custo-hora derivado. Só administradores leem.
* `atividades_custo`: atividade_id (pk, referência a `atividades`), custo_hora, custo, calculado_em. Preenchida por gatilho no insert e no update de minutos de `atividades`, a partir de `remuneracoes` vigente na data e de `atividades.pessoa_id`. Só administradores leem. O custo fica fora de `atividades` porque a política `atv_ler` da v1 libera essa tabela a consultores e comerciais, e custo ÷ minutos revelaria o custo-hora.
* `custos_diretos`: id, data, categoria (`evento`, `kit_brindes`, `deslocamento`, `impressos`, `ferramentas`, `midia`, `outro`), valor, descricao, parceiro_id (nulo = custo geral), contrapartida_id (nulo), acao_wise_id (nulo), comprovante (bucket `anexos`), recorrente boolean, recorrente_ate date, created_by. Só administradores.
* Visão `v_planilha_custos` (security_invoker, leitura só para administradores): união de horas (`atividades` com `atividades_custo`), comissões (`comissoes` com beneficiário `parceiro` ou `responsavel`, pela data de fechamento da indicação), custos diretos (recorrentes expandidos por mês) e receita atribuída, com colunas data, tipo_linha, categoria, parceiro, pessoa, atividade, minutos, custo_hora, valor, origem_id.

**Recrutamento e nível**

* `criterios_scorecard`: id, chave, nome, essencial, peso, regua jsonb ({"0": texto, "0.5": texto, "1": texto}), ordem, ativo, versao.
* `scorecards`: id, parceiro_id, notas jsonb ({chave: 0 | 0.5 | 1}), nota_potencial, nota_qualidade, nivel_entrada_sugerido, nao_elegivel_sugerido, versao_criterios, created_by, created_at. O último por parceiro é o vigente.
* `requisitos_nivel`: nivel (`A`, `B`, `C`), grupo (`resultado`, `capacitacao`, `regras`), regra jsonb (ex.: {"indicacoes_qualificadas": 3, "ou_clientes_fechados": 1, "janela_dias": 180}), vigente_desde, versao.
* `revisoes_nivel`: id, parceiro_id, trimestre (ex.: `2027-T1`), nivel_no_inicio, resultado (`cumpre`, `observacao`, `proposta_rebaixamento`, `isento`, `subida`), detalhes jsonb (cumprido por grupo), decisao (`confirmado`, `mantido`, nulo), decidido_por, motivo, pacote_novo, pacote_efetivo_em, created_at.

**Onboarding e capacitação**

* `planos_onboarding`: parceiro_id (pk), inicio, prazo_final (90 dias), estendido_ate (120 dias), situacao (`em_andamento`, `ativado`, `nao_ativado`), ativado_em, indicacao_ativacao_id, dias_ate_primeira_indicacao, dias_ate_ativacao.
* `marcos_onboarding`: id, parceiro_id, tipo (`encontro_alinhamento`, `encontro_vendas`, `encontro_produto`, `encontro_pos_venda`, `marco_30`, `marco_60`, `marco_90`), prazo, cumprido_em, ponto_contato_id.
* `trilhas`: id, titulo, descricao, versao, publicada, nota_minima (padrão 70), empresa_grupo_id.
* `trilha_modulos`: id, trilha_id, ordem, titulo, tipo (`video_arquivo`, `video_link`, `pdf`, `texto`), caminho (bucket novo `trilhas`, privado), link, texto.
* `trilha_perguntas`: id, trilha_id, ordem, enunciado, opcoes jsonb.
* `trilha_gabarito`: pergunta_id (pk), correta int. Só administradores leem; a correção é feita por função `security definer`.
* `trilha_progresso`: perfil_id, modulo_id, concluido_em (pk perfil_id, modulo_id).
* `trilha_tentativas`: id, perfil_id, trilha_id, versao, respostas jsonb, nota, aprovado, created_at.
* `certificados`: id, perfil_id, parceiro_id, trilha_id, versao, codigo, emitido_em, caminho_pdf, ativo (falso quando a pessoa é desativada).

**Indicações**

* `links_indicacao`: id, parceiro_id, token (32 bytes aleatórios, como `gerar_token_rfp`), empresas text[] (padrão `{wise}`), ativo, criado_em, revogado_em, envios int.
* `checagens_cliente`: id, indicacao_id, marco (`6m`, `12m`), prevista_para, cliente_ativo boolean, satisfacao int (0 a 10), observacao, registrada_por, registrada_em.
* `envios_link_limite`: chave (hash do endereço de origem e do token), janela, contagem. Só a função pública escreve; ninguém lê pela API.

**Ações conjuntas, régua, desligamento, ranking**

* `catalogo_acoes_wise`: mesma estrutura de `catalogo_contrapartidas`; periodicidade dentro do mesmo conjunto de valores ("mediante acordo" vira `por_acao`).
* `acoes_wise`: id, parceiro_id, catalogo_id, nome, tipo_acao, periodicidade, data_prevista, responsavel_id, estado (`planejada`, `feita`, `comprovada`, `atrasada`, `cancelada`), concluida_em, comprovacao (link ou caminho), resultado jsonb ({alcance, inscritos}), ativa. Tabela separada de `contrapartidas` para que nenhuma regra, alerta, painel, política de comprovação ou requisito de nível da v1 trate ação da Wise como obrigação do parceiro.
* Visão `v_acoes_conjuntas`: união de `contrapartidas` (lado `parceiro`) e `acoes_wise` (lado `wise`), para o calendário e o plano único.
* `regua_atendimento`: chave (`pacote:A`, `pacote:B`, `pacote:C`, `faixa:destaque`, `faixa:potencial`, `faixa:base`), cadencia_dias, tolerancia_dias, descricao.
* `faixas`: parceiro_id (pk), faixa (`destaque`, `potencial`, `base`), pontos_ano, calculada_em.
* `fluxos_desligamento`: id, parceiro_id, tipo (`inatividade`, `inadequacao`), estado (`em_risco`, `tentativa_1`, `tentativa_2`, `sugerido`, `aprovado`, `avisado`, `encerrado`, `cancelado`), datas de cada estado, motivo, aprovado_por, texto_aviso, data_encerramento, cancelado_motivo.
* `pontos_ranking`: id, parceiro_id, evento (`indicacao_qualificada`, `reuniao`, `cliente_icp`, `pessoa_certificada`, `acao_comprovada`), pontos, referencia_id, data. Único por (evento, referencia_id).
* `premiacoes`: id, ano, categoria, parceiro_id, divulgada boolean, observacao, created_by. O parceiro não lê a tabela; vê as premiações por função que aplica o anonimato.

**Gestão**

* `indicadores`: chave, etapa (`captacao`, `onboarding`, `relacionamento`, `producao`, `canal`), nome, destaque, ordem, ativo. A função de painel conhece cada chave.
* `metas`: indicador_chave, periodo (`2027-T1`, `2027`), valor.
* `fase_programa`: id, fase (`experimentacao`, `tracao`, `crescimento`, `otimizacao`), desde, definida_por. A mais recente vale.
* `pesquisas_satisfacao`: id, perfil_id, parceiro_id, trimestre, nota (0 a 10), comentario, respondida_em. Único por (perfil_id, trimestre).
* `avaliacoes_maturidade`: id, parceiro_id, notas jsonb ({eixo: 1..5}), sugestoes jsonb ({eixo: {nota, motivo}}), media, categoria (`fundacao`, `desenvolvimento`, `escala`), created_by, created_at.
* `versoes_regras`: id, versao, conteudo jsonb (retrato das regras para a página), mudancas text, vigente_desde, publicada_por.
* `comunicados`: id, titulo, corpo, tipo (`regra`, `evento`, `material`, `outro`), recorte jsonb ({niveis, pacotes, categorias, tipos}), versao_regras_id, enviado_em, enviado_por.
* `comunicado_leituras`: comunicado_id, perfil_id, enviado_em, lido_em.
* `metas_pessoa`: perfil_id, trimestre, indicador (`assinados`, `ativados`, `clientes_icp`, `receita`), valor.

**Cruzamento de carteiras**

* `base_wise_cruzamento`: id, cnpj_raiz (8 dígitos), razao_social, tipo (`cliente`, `prospect`), empresa_grupo_id, importado_em. Só administradores e time de parcerias.
* `aceites_cruzamento`: id, parceiro_id, perfil_id, versao_termo, aceito_em.
* `cruzamentos`: id, parceiro_id, aceite_id, executado_em, total_enviado, totais jsonb (por quadrante), executado_por.
* `coincidencias_cruzamento`: id, cruzamento_id, parceiro_id, base_wise_id, tipo_parceiro (`cliente`, `prospect`), quadrante, acao_sugerida, virou (`indicacao`, `acao`, nulo), referencia_id, expira_em (180 dias).

### 3.2 Colunas novas em tabelas da v1

* `parceiros`: pacote_pendente text, pacote_pendente_em date, pacote_pendente_motivo text (FR-123); etapa_antes_nutricao text; modelos_atuacao text[]; valor_desejado, oferta_valor, entrega_valor, valor_criado (texto); origem_tipo (`prospeccao_ativa`, `procura_espontanea`, `indicacao_parceiro`, `indicacao_interna`, `evento`, `outra`), origem_detalhe, origem_parceiro_id, origem_perfil_id; horas_semana_combinadas numeric; nivel_entrada text; em_observacao_ate date; nutricao_ate date; nutricao_cadencia_dias int; anonimo_ranking boolean; aceita_cruzamento_contrato boolean (contrato v2 ou aditivo). A coluna `origem` (texto livre) da v1 fica como legado e é copiada para `origem_detalhe` na migração.
* `parceiros_interno` (já invisível ao parceiro): nada a mudar; faixa e maturidade ficam em tabelas próprias.
* `atividades`: etapa_jornada text. A pessoa já está em `pessoa_id`; o custo fica em `atividades_custo`.
* `tipos_atividade`: etapa_jornada text, chave text (para os registros automáticos). Conteúdo pelo Apêndice N do spec; os 10 tipos da v1 são mantidos e reclassificados.
* `indicacoes`: icp_confirmado boolean, icp_confirmado_por, icp_confirmado_em; necessidade text; nota_qualidade int; qualificada boolean; prazo_meses int (Wise; `valor_base` da v1 já é a primeira mensalidade); valor_total numeric (Tríade; na Swallow é igual a `valor_base`); contrapartida_id uuid; acao_wise_id uuid; link_id uuid; protecao_ate date; protecao_expirada boolean; sla jsonb (prazos e cumprimento: validacao, primeiro_contato, retorno_parceiro, proxima_atualizacao); primeiro_contato_em; retorno_parceiro_em. Origem ganha o valor `link_parceiro` no check.
* `contrapartidas`: continua sendo só do parceiro; ganha concluida_em e resultado jsonb ({alcance, inscritos}). As ações da Wise ficam em `acoes_wise`.
* `etapas_funil`: novas linhas `qualificacao` (ordem 6, empurrando `proposta_decisor` para 7, `fechamento` para 8 e `onboarding` para 9), `parceria_ativa` (ordem 10) e `nutricao` (ordem 85, nova coluna `pausa` boolean = true, `perda` = false). Ao entrar em nutrição, a etapa anterior vai para `parceiros.etapa_antes_nutricao`; na retomada, o parceiro volta a ela.
* **Front-end com etapas fixas**: `src/lib/rotulos.ts` (ETAPAS_FUNIL), `QuadroFunil.tsx`, `SeletorEtapa.tsx` e `AbaContrato.tsx` (o botão "Iniciar onboarding" aparece para qualquer etapa diferente de onboarding e precisa considerar `parceria_ativa`) precisam ler as etapas do banco ou ser atualizados.
* `perfis`: nada a mudar; remuneração fica em `remuneracoes`.

## 4. Funções e gatilhos

### 4.1 Funções da v1 que mudam

| Função | Mudança |
|---|---|
| `nivel_sugerido(p_tipo, p_carteira)` | Mantida como faixa pela base. Nova `nivel_entrada(p_parceiro)` aplica o ajuste de qualidade do scorecard (Apêndice A) |
| `trg_parceiros_antes` | Calcula `nivel_entrada`; usa-o como sugestão no lugar de `nivel_sugerido`; mantém a exigência de motivo para ajuste manual, e as funções de nível (subida por resultado, `decidir_rebaixamento`) gravam `nivel_ajuste_motivo` automaticamente antes do update; aceita pacote incompatível com o nível enquanto `pacote_pendente` e `pacote_pendente_em` estiverem preenchidos (exceção temporária ao FR-042), e a rotina diária aplica o pacote pendente na data; bloqueia `qualificacao` para `proposta_decisor` sem scorecard completo; em `nutricao`, exige `nutricao_ate` e não calcula morno ou dormente (status `pausado` com `pausado_ate = nutricao_ate`) |
| `calcular_status` | Sem mudança de regra; recebe a nutrição como pausa |
| `iniciar_onboarding` | Além das tarefas e contrapartidas, cria `planos_onboarding`, `marcos_onboarding`, as ações da Wise do pacote e o link de indicação |
| `gerar_contrapartidas` | Sem mudança. Nova `gerar_acoes_wise` gera as ações de `catalogo_acoes_wise` em `acoes_wise`, chamada nos mesmos pontos |
| `registrar_indicacao` | Passa a ser uma casca que confere o papel e chama a função interna nova `_registrar_indicacao_core(p jsonb, p_papel text, p_parceiro uuid, p_origem text)`, sem permissão de execução para `authenticated` e `anon`. A regra interna troca a dos 6 meses pela proteção de 180 dias da última interação (FR-133): recusa dentro do prazo, aceita e atribui a quem reengajou depois dele, marca a anterior e avisa. A exceção de administrador deixa de existir. Grava `necessidade`, `prazo_meses`, `valor_total`, `contrapartida_id`, `acao_wise_id`; calcula `protecao_ate` e os prazos do SLA |
| `trg_indicacao_antes` | Calcula nota de qualidade e `qualificada`; atualiza `protecao_ate` a cada interação; registra cumprimento do SLA |
| `trg_indicacao_depois` | Na primeira indicação do parceiro para o grupo com ICP confirmado e `data_reuniao` igual ou anterior a hoje, ativa o parceiro em onboarding (reunião futura é conferida pela rotina diária no dia); lança pontos do ranking; ao fechar, cria `checagens_cliente`; reavalia subida de nível |
| `painel_semanal` | Substituída por `painel_v2(p_inicio, p_fim)`, que devolve os indicadores do catálogo `indicadores` por etapa, com meta e período anterior. A v1 continua disponível para a lista completa, mas precisa ser recriada lendo `config_int('indicacao_parada_dias', 15)` no lugar do `interval '30 days'` fixo (linha 384 da 0005); o mesmo vale para `pendencias_diarias` (linha 446) |
| `pendencias_diarias` | Acrescenta as chaves `sla_vencido`, `regua_atrasada`, `acoes_wise_atrasadas`, `onboarding_sem_ativacao`, `em_risco`, `propostas_rebaixamento`, `checagens_cliente`, `desligamentos_para_aprovar` (só Diretor) |
| `rotina_diaria` | Acrescenta: SLA, régua, ações da Wise atrasadas, onboarding (ativação de reunião que chegou, 90 e 120 dias), subida de nível, pacote pendente, faixas, fluxo de desligamento, checagens do cliente, expiração de proteção, purga do cruzamento, nutrição vencida |
| `elegivel_rfp` e `rfp_candidatos` | Excluem parceiro com fluxo de desligamento em estado `avisado` |
| Política `cfg_ler` em `configuracoes` | Parceiro passa a ler também as chaves públicas novas: `regras_publicadas`, `link_indicacao_texto` |
| `config`, `config_int` (correção de segurança da v1) | São `security definer` e não tiveram a execução revogada, então ignoram a RLS: qualquer usuário, inclusive anônimo, consegue ler qualquer chave (por exemplo `email_financeiro`). Revogar `execute` de `anon` e `authenticated` e deixar só as funções internas usarem; o front lê `configuracoes` pela tabela, sujeito à `cfg_ler` |

### 4.2 Funções novas

* `custo_hora_em(p_perfil, p_data)` e gatilho em `atividades` para gravar custo.
* `registrar_atividade_auto(p_parceiro, p_chave_tipo, p_referencia)`: usada pelos fluxos que geram esforço (encontros, revisões, validações, desligamento).
* `resultado_canal(p_inicio, p_fim, p_agrupar text)`: receita, custos por tipo, ROI, custo por cliente, tempo de retorno, por agrupamento (`total`, `parceiro`, `nivel`, `modelo`, `empresa`, `origem`); colunas de custo individual só para administrador.
* `calcular_scorecard(p_parceiro, p_notas jsonb)` e `nivel_entrada(p_parceiro)`.
* `cumpre_nivel(p_parceiro, p_nivel, p_ref date)`: devolve jsonb por grupo com cumprido e faltante; usada pela revisão, pela subida e por "Meu nível".
* `revisao_trimestral()`: roda no primeiro dia útil do trimestre; grava `revisoes_nivel`; notifica.
* `decidir_rebaixamento(p_revisao, p_confirmar, p_motivo)`: só administrador ou time de parcerias; agenda o pacote novo.
* `ativar_parceiro(p_parceiro, p_indicacao)`.
* `indicacao_publica(p_token, p_dados, p_origem_hash)`: chamada só pela Edge Function `indicacao-publica`; valida token, limite e campo oculto; chama `_registrar_indicacao_core` com origem `link_parceiro` e consentimento do titular (a casca `registrar_indicacao` recusaria, porque a `service_role` não tem papel); sempre devolve a mesma resposta neutra.
* `link_indicacao_publico(p_token)`: devolve só nome fantasia, logo, empresas atendidas e perguntas do ICP.
* `corrigir_teste(p_tentativa)`: `security definer`; compara com `trilha_perguntas.correta`; emite certificado.
* `calcular_faixas()`, `lancar_pontos(...)`, `ranking(p_periodo)`: o ranking para parceiro devolve só posição, nome (ou "Parceiro Wise") e pontos, nunca o nível dos outros. `premiacoes_publicas(p_ano)` aplica o anonimato.
* `avaliar_risco_desligamento()`, `avancar_desligamento(p_fluxo, p_acao)`, `gerar_aviso_desligamento(p_fluxo)` (texto por modelo de `textos_email`, sem IA).
* `sugerir_maturidade(p_parceiro)`: devolve notas sugeridas e motivos por eixo (Apêndice J).
* `publicar_regras(p_vigencia)`: grava `versoes_regras`, exige vigência de 30 dias para mudanças que afetam parceiros, abre rascunho de comunicado.
* `enviar_comunicado(p_id)`: resolve o recorte em pessoas e cria `comunicado_leituras` e notificações.
* `registrar_coincidencias(p_parceiro, p_aceite, p_coincidencias jsonb, p_totais jsonb)`: chamada só pela Edge Function `cruzamento-carteiras`, que antes confere o mínimo de 20 CNPJs e o limite de 1 cruzamento por parceiro a cada 30 dias.
* `sugerir_fase()`: confere os critérios do Apêndice L.

### 4.3 Edge Functions novas

* `indicacao-publica`: GET devolve os dados da página do link; POST grava pela função do banco. Usa `service_role` só para chamar as duas funções, limite por IP com `_shared/limite.ts`, cabeçalho `noindex`, resposta neutra.
* `cruzamento-carteiras`: recebe do navegador autenticado (parceiro) a lista de raízes de CNPJ com tipo, confere aceite e contrato, carrega `base_wise_cruzamento` em memória, calcula coincidências e totais e chama `registrar_coincidencias`. **Nunca registra o corpo da requisição em log**, não grava a lista em tabela nem em Storage e libera a memória ao terminar. Teste automatizado obrigatório (seção 10).
* `revisao-trimestral` (ou direto no pg_cron, como `rotina_diaria`): chama `revisao_trimestral()` e dispara os e-mails.
* `pesquisa-satisfacao`: no primeiro dia útil do trimestre, envia o convite da pesquisa a cada pessoa ativa de parceiro assinado.
* `relatorio-semanal` e `resumo-diario`: acrescentar as chaves novas.

## 5. Matriz de permissões (acréscimos)

L = lê, E = escreve, P = só os próprios, "não" = sem acesso.

| Dado | Admin | Parcerias | Consultor ou gerente | Comercial | Financeiro | Parceiro | Público |
|---|---|---|---|---|---|---|---|
| remuneracoes, atividades_custo | LE | não | não | não | não | não | não |
| custos_diretos, planilha de custos | LE | não | não | não | não | não | não |
| resultado do canal | L | não | não | não | não | não | não |
| scorecards, critérios | LE | LE | L | não | não | não | não |
| revisões de nível | LE | LE | L | não | não | P (resultado e faltantes, sem notas internas) | não |
| requisitos de nível | LE | L | L | L | não | L | não |
| planos e marcos de onboarding | LE | LE | L | não | não | P | não |
| trilhas, módulos | LE | L | L | L | não | L (publicadas, parceiro assinado) | não |
| trilha_perguntas | LE | L | L | não | não | L (trilhas publicadas) | não |
| trilha_gabarito | LE | não | não | não | não | não (só pela função) | não |
| progresso, tentativas, certificados | L | L | L | não | não | P (a própria pessoa; o responsável vê os da empresa) | não |
| links_indicacao | LE | LE | L | não | não | P (lê o próprio) | só via função |
| checagens_cliente | LE | LE | LE (indicações em que é responsável) | não | não | não | não |
| campos novos de indicações (nota, SLA, proteção) | LE | LE | L | L | não | P (nota e SLA das próprias, sem proteção de outros) | não |
| catálogo de ações da Wise | LE | L | L | não | não | não | não |
| acoes_wise | LE | LE | L | não | não | P (só lê) | não |
| contrapartidas (ações do parceiro) | como na v1 | como na v1 | como na v1 | não | não | P (lê; envia comprovação) | não |
| regua_atendimento | LE | L | L | não | não | não | não |
| faixas | L | L | L | não | não | não | não |
| fluxos_desligamento | LE (aprovação só Diretor) | LE (sem aprovar) | não | não | não | não | não |
| pontos_ranking, ranking | L | L | L | não | não | L (só pela função de ranking) | não |
| premiacoes | LE | LE | L | não | não | não (só por `premiacoes_publicas`) | não |
| indicadores, metas, fase | LE | L | L | não | não | não | não |
| pesquisas_satisfacao | L | L | não | não | não | P (envia a própria, uma por trimestre) | não |
| avaliacoes_maturidade | LE | LE | L | não | não | não | não |
| versoes_regras | LE | L | L | L | não | L (publicada e vigente) | não |
| comunicados, leituras | LE | LE | L | não | não | P (os recebidos; marca leitura) | não |
| metas_pessoa | LE | P | não | não | não | não | não |
| base_wise_cruzamento | LE | L | não | não | não | não | não |
| aceites_cruzamento, cruzamentos | L | L | não | não | não | P (os próprios, totais) | não |
| coincidencias_cruzamento | LE | LE | não | não | não | não (só totais em `cruzamentos`) | não |

## 6. Rotinas e agendamentos

| Rotina | Quando | O que faz |
|---|---|---|
| `rotina_diaria` (6h30) | Todo dia | Itens da seção 4.1 |
| `revisao_trimestral` | Primeiro dia útil de jan, abr, jul e out, 6h45 | Revisão de nível, faixas, sugestão de fase |
| `pesquisa-satisfacao` | Primeiro dia útil do trimestre, 9h | Convites da pesquisa |
| `resumo-diario` (7h) e `relatorio-semanal` | Como na v1 | Chaves novas |
| Purga do cruzamento | Dentro da `rotina_diaria` | Apaga coincidências vencidas |
| Notificações | A cada 5 minutos, como na v1 | Sem mudança |

O pg_cron roda em UTC, como na v1: 6h45 de Brasília = `45 9 * * *` com a função conferindo se é o primeiro dia útil do trimestre.

## 7. Telas e rotas

**Interno (`/app`)**

* `/app` painel por etapa da jornada (troca o painel da v1; a v1 vira aba "lista completa").
* `/app/resultado` resultado do canal (ROI) e número principal.
* `/app/custos` planilha de custos e lançamento de custo direto.
* `/app/maturidade` visão do programa (radar médio e distribuição).
* `/app/acoes` calendário geral de ações conjuntas.
* `/app/capacitacao` gestão de trilhas, módulos, testes e certificados.
* `/app/comunicados` comunicados, recortes e leituras.
* `/app/ranking` ranking, faixas e premiação.
* `/app/cruzamento` base da Wise e coincidências.
* `/app/meu-painel` carteira e metas por pessoa.
* Ficha do parceiro, abas novas: Scorecard, Nível e revisões, Onboarding, Ações conjuntas, Maturidade, Desligamento (quando houver), Nossa parceria (modelo e proposta de valor).
* Configurações, seções novas: custos e remunerações, scorecard, requisitos de nível, régua, SLA, proteção, pontos, indicadores e metas, fase do programa, regras publicadas, termo do cruzamento.

**Parceiro (`/parceiro`)**

* Início com nível, próximo marco do onboarding, ações da semana e comunicados não lidos.
* `/parceiro/nivel` Meu nível. `/parceiro/parceria` Nossa parceria. `/parceiro/onboarding`.
* `/parceiro/capacitacao` e `/parceiro/capacitacao/:trilha`.
* `/parceiro/indicar` link exclusivo, QR Code e formulário (o formulário da v1 continua).
* `/parceiro/acoes` (renomeia contrapartidas, mantendo a rota antiga como redirecionamento).
* `/parceiro/regras`, `/parceiro/comunicados`, `/parceiro/ranking`, `/parceiro/pesquisa`, `/parceiro/cruzamento`.

**Público**

* `/i/:token` página do link de indicação, sem login, `noindex`.

## 8. IA

Sem tarefas novas obrigatórias. Usos opcionais pela `ai-gateway` existente, sempre com confirmação humana e sem travessão:

* `rascunho_comunicado`: rascunho do comunicado a partir das mudanças de regra.
* `perguntas_trilha`: sugestão de perguntas de teste a partir do texto de um módulo.
* `contexto_parceiro` (da v1): incluir modelo de atuação, proposta de valor, nível e requisitos, onboarding, maturidade e resultado do parceiro.

## 9. Dados iniciais (seed v2)

* `tipos_atividade`: Apêndice N do spec, com `etapa_jornada` e `chave`.
* `criterios_scorecard`: Apêndice A. `requisitos_nivel`: Apêndice B. `regua_atendimento`: Apêndice C. `catalogo_acoes_wise`: Apêndice H. Pontos: Apêndice K. `indicadores` e destaques: Apêndice L. `fase_programa`: `experimentacao` desde 2026-10-23.
* `remuneracoes`: Guilherme Faccin, 4500, 220 horas, fator 1,0, vigente desde 2026-10-01 (vinculada ao perfil quando ele existir; a migração usa o e-mail `guilherme@wisemakers.com.br`).
* Trilha "Como vender a Wise Makers" criada como rascunho, com os módulos do Apêndice G sem conteúdo.
* `configuracoes`, chaves novas: `horas_mensais_padrao` 220, `fator_encargos_padrao` 1.0, `horizonte_receita_meses` 12, `prazo_contrato_padrao_meses` 12, `margem_contribuicao_pct` 100, `rateio_custo_geral` false, `ciclo_venda_direta_dias` null, `protecao_indicacao_dias` 180, `sla_validacao_dias_uteis` 2, `sla_retorno_parceiro_dias_uteis` 5, `sla_atualizacao_dias` 15, `sla_parceiro_contato_dias_uteis` 2, `sla_parceiro_atualizacao_dias_uteis` 5, `janela_resultado_dias` 180, `isencao_revisao_dias` 180, `onboarding_dias` 90, `onboarding_extensao_dias` 120, `nota_minima_trilha` 70, `nova_tentativa_horas` 24, `faixa_destaque_pct` 5, `faixa_potencial_pct` 15, `risco_dias_assinatura` 180, `risco_janela_dias` 180, `retomada_intervalo_dias` 15, `retomada_espera_dias` 30, `aviso_desligamento_dias` 30, `vigencia_minima_regra_dias` 30, `cruzamento_max_linhas` 5000, `cruzamento_retencao_dias` 180, `link_limite_hora` 10, `regioes_atendidas` ["PR","SC","SP"], `nutricao_cadencia_dias` 30, `modelos_atuacao` [lista do FR-146], `termo_cruzamento_versao` 1 e `termo_cruzamento_texto`.
* Ajuste da v1: `indicacao_parada_dias` de 30 para 15.
* `textos_email` novos: `nivel_subida`, `nivel_observacao`, `nivel_rebaixamento_confirmado`, `sla_vencido`, `regua_atrasada`, `onboarding_sem_ativacao`, `retomada_parceiro`, `aviso_desligamento`, `comunicado`, `pesquisa_satisfacao`, `certificado_emitido`, `indicacao_link_recebida`, `protecao_expirada`.
* Ajuste da v1: subir para a ordem nova as etapas `proposta_decisor` (7), `fechamento` (8) e `onboarding` (9).
* `modelos_contrato`: versão 2 do modelo comercial (`referencias/contratos/modelo_contrato_parceria_comercial_v2.docx`), vigente; a versão 1 fica como histórica. Os marcadores são os mesmos da v1, então `src/lib/contrato.ts` não muda.

## 10. Testes obrigatórios (além dos da v1, que continuam passando)

* RLS: uma linha de teste para cada célula nova da matriz da seção 5, com os papéis admin, parcerias, consultor, comercial, financeiro, parceiro A, parceiro B e anônimo. Em especial: parceiro não lê `faixas`, `avaliacoes_maturidade`, `fluxos_desligamento`, `remuneracoes`, `atividades_custo`, `custos_diretos`, `coincidencias_cruzamento`, `trilha_gabarito`, `premiacoes`; parceiro B não lê nada do parceiro A além do ranking; nenhum papel além de administrador lê remuneração, custo de atividade, custos diretos ou resultado do canal; anônimo não executa `config()`.
* Regras: nível de entrada (os 3 casos do Apêndice A, com notas de qualidade de 75%, 37,5% e 87,5%, e o não elegível); subida imediata; observação; proposta de rebaixamento sem mudança automática; isenção de 180 dias; pacote após descida; proteção de 180 dias antes e depois do prazo; SLA vencido nos dois sentidos; nota de qualidade; ativação; 90 e 120 dias; faixas com 20 parceiros; fluxo de desligamento completo e cancelamento; pontos únicos por evento; ROI do exemplo da História 1 com resultado exato.
* Cruzamento: teste que envia 50 CNPJs com 5 coincidências e prova, consultando todas as tabelas, o Storage e a saída de log da função no ambiente de teste, que nenhum dos 45 restantes ficou gravado.
* Página pública `/i/:token`: token inválido, revogado, limite estourado, campo oculto preenchido e duplicidade devolvem a mesma resposta neutra; nada é gravado nos casos recusados.
* Unitário: certificado em PDF com nome, trilha, versão e data; conferência de que nenhum texto gerado contém travessão ou meia-risca.

## 11. Compatibilidade com o Lovable e com a v1

* Nenhum componente da v1 é removido. A tela de contrapartidas do parceiro vira "Ações conjuntas" e a rota antiga redireciona.
* O painel da v1 continua como aba, até a equipe confirmar o novo.
* Os gatilhos alterados mantêm as mensagens de erro da v1 quando a regra não mudou, para não quebrar os testes existentes; testes que verificavam a regra dos 6 meses e o alerta de 30 dias são atualizados para 180 dias e 15 dias.
* Bucket novo `trilhas`, privado, com política por parceiro assinado; links temporários de 1 hora.
