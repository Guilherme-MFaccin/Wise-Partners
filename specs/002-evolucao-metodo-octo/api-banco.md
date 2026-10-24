# API do banco para as telas da v2

Referência para quem constrói as telas da v2. A fonte de verdade são as migrações
`supabase/migrations/20261024000010` a `20261024000019`. Este arquivo resume tabelas, funções (RPC),
quem pode o quê e o formato dos retornos em JSON. As regras ficam no banco (gatilhos, funções e RLS):
a interface só mostra, chama e trata erros.

## Convenções

* Cliente: `supabase` de `@/integrations/supabase/client` (sem tipos gerados). Use `ok()` e `toastErro()` de `@/lib/erros`, TanStack Query e os componentes de `@/components/ui` e `@/components/comum`.
* Mensagens de erro do banco já vêm em português e podem ir direto para o `toast`.
* Textos: português do Brasil, sem travessão (U+2014) nem meia-risca (U+2013). Use dois pontos, vírgula ou parênteses.
* Nível aparece pelo nome (Elite, Premium, Select) para parceiros; letras só nas telas internas. Use `nomeNivel()`.
* ROI e percentuais que vêm como fração (`roi` 15.67 = 1.567%) são multiplicados por 100 na tela.
* Custos, salários, custo-hora, planilha de custos e resultado do canal: só administrador. Parceiro nunca vê faixa, matriz de maturidade, fluxo de desligamento nem dados de cruzamento de outros parceiros.
* Trilhas de capacitação ficam no portal, nunca no Wise Hub.

## Rótulos

`src/lib/rotulos.ts` já tem os rótulos da v2: `ETAPAS` (com qualificação, parceria ativa e nutrição), `ETAPAS_PAUSA`,
`ORIGENS_PARCEIRO`, `ETAPAS_JORNADA`, `ETAPAS_PAINEL`, `CATEGORIAS_CUSTO`, `TIPOS_LINHA_CUSTO`, `AGRUPAMENTOS_RESULTADO`,
`SITUACOES_ONBOARDING`, `MARCOS_ONBOARDING`, `RESULTADOS_REVISAO`, `GRUPOS_REQUISITO`, `FAIXAS`, `ESTADOS_ACAO_WISE`,
`TIPOS_ACAO`, `ESTADOS_DESLIGAMENTO`, `TIPOS_DESLIGAMENTO`, `EIXOS_MATURIDADE`, `CATEGORIAS_MATURIDADE`,
`FASES_PROGRAMA`, `QUADRANTES_CRUZAMENTO`, `PRAZOS_SLA`, `TIPOS_MODULO`.

## Funções por assunto

**Custos e resultado (só admin)**
* `resultado_canal(p_inicio, p_fim, p_agrupar)`: `{periodo, parametros: {margem_pct, rateio, horizonte_meses, prazo_padrao_meses}, total, grupos: [{chave, rotulo, ...métricas}], geral (custo sem parceiro), avisos: string[], fase, secundarios: {assinados, reunioes}}`. Métricas: `horas, horas_sem_custo, custo_horas, comissoes_parceiro, comissoes_responsavel, custos_diretos, custo_total, receita_clientes, comissoes_recebidas, receita_atribuida, receita_margem, roi (fração), clientes_icp, custo_por_cliente, mensalidade_recorrente, tempo_retorno_meses`. `p_agrupar`: total, parceiro, nivel, modelo, empresa, origem.
* `planilha_custos(p_inicio, p_fim)`: uma linha por lançamento (`tipo_linha`: hora, comissao_parceiro, comissao_responsavel, custo_direto, receita, comissao_recebida). Exportação em CSV.
* Tabelas `remuneracoes` (perfil_id ou email, valor_mensal, horas_mensais, fator_encargos, vigente_desde), `custos_diretos` (data, categoria, valor, descricao, parceiro_id, contrapartida_id, acao_wise_id, comprovante, recorrente, recorrente_ate), `atividades_custo` (atividade_id, custo_hora, custo): CRUD direto pela tabela, só admin.
* Custo-hora = valor_mensal ÷ horas_mensais × fator_encargos (mostrar com 2 casas; cálculos no banco sem arredondar).

**Painel por etapa da jornada**
* `painel_v2(p_inicio, p_fim)` (qualquer interno): `{periodo, fase, indicadores: [{chave, etapa, nome, formato, destaque, valor, anterior, meta}]}`. `formato`: numero, percentual, moeda, dias, lista (valor é objeto), horas. Indicadores `so_admin` só vêm com valor para admin. A v1 (`painel_semanal`) continua como aba "Lista completa".
* `sugerir_fase()`: `{fase, proxima, pronta, criterios: [{nome, atual, meta, ok}]}`. `definir_fase(p_fase)` só admin.
* Tabelas `indicadores` (catálogo, admin edita destaque e ordem), `metas` (indicador_chave, periodo 'AAAA' ou 'AAAA-TN', valor), `fase_programa`.
* `painel_pessoal(p_perfil, p_trimestre 'AAAA-TN')`: `{trimestre, inicio, fim, carteira: [...], metas: {indicador: valor}, realizado: {assinados, ativados, clientes_icp, receita}, horas}`. Admin vê de qualquer pessoa; parcerias só o próprio. Tabela `metas_pessoa` (perfil_id, trimestre, indicador, valor), admin edita.

**Recrutamento e nível de entrada (ficha)**
* Colunas novas em `parceiros`: modelos_atuacao text[], valor_desejado, oferta_valor, entrega_valor, valor_criado, origem_tipo, origem_detalhe, origem_parceiro_id, origem_perfil_id, horas_semana_combinadas, nivel_entrada, elegibilidade_motivo, em_observacao_ate, pacote_pendente, pacote_pendente_em, pacote_pendente_motivo, etapa_antes_nutricao, nutricao_ate, nutricao_cadencia_dias, anonimo_ranking, aceita_cruzamento_contrato.
* Nutrição: `update parceiros set etapa = 'nutricao', nutricao_ate = <data>, nutricao_cadencia_dias = <n>`; ao sair, a etapa volta a `etapa_antes_nutricao` (a rotina diária faz isso sozinha na data).
* `criterios_scorecard` (chave, nome, essencial, peso, regua {"0","0.5","1"}, elimina_com_zero, conta_na_qualidade, ordem, ativo). `scorecards`: insert (parceiro_id, notas {chave: 0|0.5|1}); o gatilho calcula `completo, nota_potencial, nota_qualidade, nivel_entrada_sugerido, nao_elegivel_sugerido, faltantes`. Cada avaliação é uma linha nova (histórico); vale a mais recente.
* Proposta com o decisor exige scorecard completo; se não elegível, só admin com `elegibilidade_motivo`.

**Nível por resultado**
* `situacao_nivel(p_parceiro)` (interno): `{nivel, nivel_entrada, em_observacao_ate, pacote_pendente, pacote_pendente_em, niveis: {A|B|C: {nivel, cumpre, grupos: {resultado|capacitacao|regras: {cumprido, descricao, faltante: string[]}}}}, regua: {aplica, cadencia_dias, tolerancia_dias, ultima_reuniao, proxima_ate, atrasada}, faixa}`.
* `meu_nivel()` (parceiro): `{tipo, nivel, pacote, em_observacao_ate, pacote_pendente, pacote_pendente_em, atual: cumpre_nivel, acima: cumpre_nivel do nível acima ou null}`. Sem notas internas.
* `revisoes_nivel` (parceiro_id, trimestre, nivel_no_inicio, resultado, detalhes, decisao, motivo, pacote_novo, pacote_efetivo_em). `decidir_rebaixamento(p_revisao, p_confirmar, p_motivo)` (parcerias, motivo obrigatório).
* `requisitos_nivel` (nivel, grupo, regra jsonb, descricao, vigente_desde): admin edita; mudança exige vigência de 30 dias.

**Onboarding**
* `planos_onboarding` (parceiro_id, inicio, prazo_final, estendido_ate, situacao, ativado_em, indicacao_ativacao_id, primeira_indicacao_em, dias_ate_primeira_indicacao, dias_ate_ativacao). `marcos_onboarding` (id, parceiro_id, tipo, prazo, cumprido_em, ponto_contato_id).
* `registrar_encontro_onboarding(p_marco, p_data, p_texto)` (parcerias): cria o ponto de contato e cumpre o encontro.

**Capacitação**
* `trilhas` (chave 'como_vender', titulo, descricao, versao, publicada, nota_minima, empresa_grupo_id, ordem), `trilha_modulos` (trilha_id, ordem, titulo, tipo video_arquivo|video_link|pdf|texto, caminho no bucket `trilhas`, link, texto), `trilha_perguntas` (trilha_id, ordem, enunciado, opcoes jsonb string[]), `trilha_gabarito` (pergunta_id, correta índice; só admin), `trilha_progresso` (perfil_id, modulo_id), `trilha_tentativas`, `certificados` (perfil_id, parceiro_id, trilha_id, versao, codigo, nome_pessoa, titulo_trilha, emitido_em, ativo).
* `concluir_modulo(p_modulo)` (parceiro). `corrigir_teste(p_trilha, p_respostas {pergunta_id: indice})` → `{nota, aprovado, nota_minima, certificado_id?, codigo?, nova_tentativa_em?}` (confira o retorno exato no SQL de `0012`). `publicar_trilha(p_trilha, p_nova_versao)` (admin).
* Storage: bucket privado `trilhas`, link temporário de 1 hora (`createSignedUrl(caminho, 3600)`).

**Indicações v2**
* Colunas novas em `indicacoes`: icp_confirmado, icp_confirmado_por, icp_confirmado_em, necessidade, nota_qualidade, qualificada, prazo_meses, valor_total, contrapartida_id, acao_wise_id, link_id, protecao_ate, protecao_expirada, sla jsonb, primeiro_contato_em, retorno_parceiro_em, parceiro_atualizou_em. Origens novas: link_parceiro, cruzamento, acao_conjunta.
* `registrar_indicacao(p jsonb)` aceita também `necessidade, prazo_meses, valor_total, contrapartida_id, acao_wise_id, aderencia_icp`. Proteção de 180 dias desde a última interação, sem exceção.
* `validar_indicacao(p_id, {aderencia_icp?, icp_confirmado?, necessidade?, primeiro_contato?: true, retorno_parceiro?: true})`.
* SLA: `sla` traz os prazos (`validacao_ate`, `retorno_parceiro_ate`, `atualizacao_dias` ou `primeiro_contato_ate`, `atualizacao_parceiro_ate`). Vencidos: compare com hoje no front ou use `pendencias` do resumo.
* `checagens_cliente` (indicacao_id, parceiro_id, marco 6m|12m, prevista_para, cliente_ativo, satisfacao, observacao, registrada_em). `registrar_checagem(p_id, p_ativo, p_satisfacao, p_observacao)`.
* `links_indicacao` (parceiro_id, token, empresas text[], ativo, envios). `regenerar_link_indicacao(p_parceiro, p_empresas)` → token; `revogar_link_indicacao(p_parceiro)`. URL pública: `${origin}/i/${token}`.
* Página pública `/i/:token`: Edge Function `indicacao-publica`. GET `?token=` → `{estado: 'ok', parceiro, empresas: [{codigo, nome, descricao}], criterios_icp: [{chave, descricao}]}` ou `{estado: 'indisponivel'}`. POST `{token, empresa, cliente_razao_social, cliente_cnpj, contato_nome, contato_cargo, contato_email, contato_telefone, necessidade, aderencia_icp: {chave: bool}, consentimento: true, website: ''}` → sempre `{ok: true}`. O campo `website` fica oculto (contra robôs).

**Ações conjuntas**
* `acoes_wise` (lado da Wise: parceiro_id, nome, tipo_acao, periodicidade, comprovacao_esperada, data_prevista, responsavel_id, estado, concluida_em, comprovacao_link, comprovacao_caminho, resultado {alcance, inscritos}, observacao). `concluir_acao_wise(p_id, {data?, comprovacao_link?, comprovacao_caminho?, alcance?, inscritos?, observacao?, custo? (só admin; lança custo direto)})`.
* `contrapartidas` (lado do parceiro, v1) ganham concluida_em e resultado. Visão `v_acoes_conjuntas` (security invoker) junta os dois lados: confira as colunas em `0014`.
* `catalogo_acoes_wise` (admin edita).

**Ranking, faixas e premiação**
* `ranking(p_ano, p_trimestre)` → `(posicao, parceiro_id, nome, pontos, eu)`; para parceiro, o nome vem anônimo quando o outro pediu (`anonimo_ranking`), e nunca vem nível nem faixa.
* `pontos_ranking`, `faixas` (parceiro_id, faixa, pontos_ano, posicao), `premiacoes` (ano, categoria, parceiro_id, divulgada, observacao): internos. `premiacoes_publicas(p_ano)` para o parceiro.
* `regua_atendimento` (chave, cadencia_dias, tolerancia_dias, descricao): admin edita.

**Desligamento**
* `fluxos_desligamento` (parceiro_id, tipo, estado, motivo, datas de cada passo, aguardar_ciclo, texto_aviso, data_encerramento): só admin e parcerias leem.
* `registrar_tentativa_retomada(p_fluxo, p_texto)` (parcerias), `abrir_desligamento_inadequacao(p_parceiro, p_motivo)` (admin), `decidir_desligamento(p_fluxo, p_aprovar, p_aguardar_ciclo, p_motivo)` (só Diretor), `gerar_aviso_desligamento(p_fluxo)` → texto (admin). O texto de retomada sugerido está em `textos_email` chave `retomada_parceiro`.

**Maturidade**
* `avaliacoes_maturidade` (parceiro_id, notas {eixo: 1..5}, sugestoes, media, categoria): insert por parcerias; o gatilho calcula média e categoria. `sugerir_maturidade(p_parceiro)` → `{eixo: {nota, motivo}}`.

**Regras, comunicados e pesquisa**
* `regras_publicadas()` → `{vigente: {versao, conteudo, mudancas, vigente_desde}, proxima}`. `conteudo` = `regras_retrato()`: `{niveis: [{codigo, nome, requisitos: [{grupo, descricao}]}], pacotes, comissoes, protecao_dias, sla, regua, desligamento, ranking, premiacao, revisao}`. `publicar_regras(p_vigencia, p_mudancas, p_afeta_parceiros)` (admin; vigência mínima de 30 dias quando afeta parceiros; abre rascunho de comunicado).
* `comunicados` (titulo, corpo, tipo, recorte jsonb, versao_regras_id, enviado_em): parcerias cria; `enviar_comunicado(p_id)` resolve o recorte (confira as chaves aceitas em `0015`) e cria `comunicado_leituras` (comunicado_id, perfil_id, parceiro_id, enviado_em, lido_em). `marcar_comunicado_lido(p_id)`.
* `pesquisas_satisfacao` (perfil_id, parceiro_id, trimestre, nota 0..10, comentario). `responder_pesquisa(p_nota, p_comentario)` (parceiro, uma por trimestre).

**Cruzamento de carteiras**
* `situacao_cruzamento(p_parceiro?)` → `{pode, motivo, ultimo_em, proximo_em, minimo, maximo, versao_termo}`. Termo em `configuracoes.termo_cruzamento_texto` (o parceiro lê).
* Fluxo do parceiro: `aceitar_termo_cruzamento()` → aceite_id; o navegador lê o arquivo (CSV com papaparse ou XLSX com read-excel-file), usa `extrairDaPlanilha(linhas)` de `supabase/functions/_shared/cruzamento.ts` (importe pelo caminho relativo ou copie para `src/lib`), mostra as linhas com problema e chama a Edge Function `cruzamento-carteiras` com `{aceite_id, itens: [{raiz, tipo}]}` → `{totais}`. `excluir_cruzamentos()` apaga as coincidências na hora.
* Interno: `base_wise_cruzamento` (cnpj_raiz 8 dígitos, razao_social, tipo, empresa_grupo_id): admin importa; parcerias lê. `coincidencias_cruzamento` (cruzamento_id, parceiro_id, base_wise_id, tipo_parceiro, quadrante, acao_sugerida, virou, referencia_id, descartada, expira_em) e `decidir_coincidencia(p_id, 'indicacao'|'acao'|'descartar', p_referencia, p_observacao)`.

**Custos de atividade**
* `tipos_atividade` ganhou `etapa_jornada` e `chave`; `atividades` ganhou `etapa_jornada` (o gatilho preenche pelo tipo).

## Banco local para conferir formatos

Há um PostgreSQL de desenvolvimento com todas as migrações e os dados fictícios dos testes em
`postgresql://postgres@localhost:54330/postgres`. Para ver o que um papel recebe:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<id do perfil>","role":"authenticated"}', true);
select public.meu_nivel();
rollback;
```

Perfis fictícios: admin `...0001`, Diretor `...0002`, parcerias `...0003`, consultor `...0004`, comercial `...0006`,
financeiro `...0007`, parceiro A responsável `...0008`, parceiro B `...0010` (prefixo `00000000-0000-4000-a000-0000000000`).
Parceiros: A `10000000-0000-4000-a000-00000000000a`, B `...000b`, C `...000c`, D `...000d`, E `...000e`.

## Tabelas novas e colunas novas (gerado do banco)

* `aceites_cruzamento`: id uuid, parceiro_id uuid, perfil_id uuid, versao_termo integer, aceito_em timestamp with time zone, usado_em timestamp with time zone
* `acoes_wise`: id uuid, parceiro_id uuid, catalogo_id uuid, nome text, tipo_acao text, periodicidade text, comprovacao_esperada text, data_prevista date, responsavel_id uuid, estado text, concluida_em date, comprovacao_link text, comprovacao_caminho text, resultado jsonb, observacao text, alertada boolean, ativa boolean, created_at timestamp with time zone, updated_at timestamp with time zone
* `atividades_custo`: atividade_id uuid, custo_hora numeric, custo numeric(14,4), calculado_em timestamp with time zone
* `avaliacoes_maturidade`: id uuid, parceiro_id uuid, notas jsonb, sugestoes jsonb, media numeric(3,2), categoria text, created_by uuid, created_at timestamp with time zone
* `base_wise_cruzamento`: id uuid, cnpj_raiz text, razao_social text, tipo text, empresa_grupo_id uuid, importado_em timestamp with time zone, importado_por uuid
* `catalogo_acoes_wise`: id uuid, nome text, tipo_acao text, pacotes text[], periodicidade text, periodicidade_por_pacote jsonb, prazo_inicial_dias integer, comprovacao text, ordem integer, ativa boolean
* `certificados`: id uuid, perfil_id uuid, parceiro_id uuid, trilha_id uuid, versao integer, codigo text, nome_pessoa text, titulo_trilha text, emitido_em timestamp with time zone, caminho_pdf text, ativo boolean
* `checagens_cliente`: id uuid, indicacao_id uuid, parceiro_id uuid, marco text, prevista_para date, cliente_ativo boolean, satisfacao integer, observacao text, registrada_por uuid, registrada_em timestamp with time zone
* `coincidencias_cruzamento`: id uuid, cruzamento_id uuid, parceiro_id uuid, base_wise_id uuid, tipo_parceiro text, quadrante text, acao_sugerida text, virou text, referencia_id uuid, descartada boolean, decidido_por uuid, decidido_em timestamp with time zone, observacao text, expira_em date
* `comunicado_leituras`: comunicado_id uuid, perfil_id uuid, parceiro_id uuid, enviado_em timestamp with time zone, lido_em timestamp with time zone
* `comunicados`: id uuid, titulo text, corpo text, tipo text, recorte jsonb, versao_regras_id uuid, enviado_em timestamp with time zone, enviado_por uuid, created_by uuid, created_at timestamp with time zone
* `criterios_scorecard`: id uuid, chave text, nome text, essencial boolean, peso numeric(4,2), regua jsonb, elimina_com_zero boolean, conta_na_qualidade boolean, ordem integer, ativo boolean, versao integer
* `cruzamentos`: id uuid, parceiro_id uuid, aceite_id uuid, executado_em timestamp with time zone, executado_por uuid, total_enviado integer, totais jsonb
* `custos_diretos`: id uuid, data date, categoria text, valor numeric(14,2), descricao text, parceiro_id uuid, contrapartida_id uuid, acao_wise_id uuid, comprovante text, recorrente boolean, recorrente_ate date, created_by uuid, created_at timestamp with time zone
* `faixas`: parceiro_id uuid, faixa text, pontos_ano integer, posicao integer, calculada_em timestamp with time zone
* `fase_programa`: id uuid, fase text, desde date, definida_por uuid, created_at timestamp with time zone
* `fluxos_desligamento`: id uuid, parceiro_id uuid, tipo text, estado text, motivo text, em_risco_em date, tentativa_1_em date, tentativa_2_em date, sugerido_em date, aprovado_em date, aprovado_por uuid, aguardar_ciclo boolean, avisado_em date, texto_aviso text, data_encerramento date, encerrado_em date, cancelado_em date, cancelado_motivo text, created_at timestamp with time zone, updated_at timestamp with time zone
* `indicadores`: chave text, etapa text, nome text, formato text, destaque boolean, so_admin boolean, ordem integer, ativo boolean
* `links_indicacao`: id uuid, parceiro_id uuid, token text, empresas text[], ativo boolean, criado_em timestamp with time zone, revogado_em timestamp with time zone, envios integer
* `marcos_onboarding`: id uuid, parceiro_id uuid, tipo text, prazo date, cumprido_em date, ponto_contato_id uuid
* `metas`: indicador_chave text, periodo text, valor numeric
* `metas_pessoa`: perfil_id uuid, trimestre text, indicador text, valor numeric
* `pesquisas_satisfacao`: id uuid, perfil_id uuid, parceiro_id uuid, trimestre text, nota integer, comentario text, respondida_em timestamp with time zone
* `planos_onboarding`: parceiro_id uuid, inicio date, prazo_final date, estendido_ate date, situacao text, ativado_em date, indicacao_ativacao_id uuid, primeira_indicacao_em date, dias_ate_primeira_indicacao integer, dias_ate_ativacao integer, alertado_90 boolean, created_at timestamp with time zone, updated_at timestamp with time zone
* `pontos_ranking`: id uuid, parceiro_id uuid, evento text, pontos integer, referencia_id uuid, data date, created_at timestamp with time zone
* `premiacoes`: id uuid, ano integer, categoria text, parceiro_id uuid, divulgada boolean, observacao text, created_by uuid, created_at timestamp with time zone
* `regua_atendimento`: chave text, cadencia_dias integer, tolerancia_dias integer, descricao text
* `remuneracoes`: id uuid, perfil_id uuid, email text, valor_mensal numeric(12,2), horas_mensais numeric(6,2), fator_encargos numeric(6,3), vigente_desde date, created_by uuid, created_at timestamp with time zone
* `requisitos_nivel`: id uuid, nivel text, grupo text, regra jsonb, descricao text, vigente_desde date, versao integer, created_at timestamp with time zone
* `revisoes_nivel`: id uuid, parceiro_id uuid, trimestre text, nivel_no_inicio text, resultado text, detalhes jsonb, decisao text, decidido_por uuid, decidido_em timestamp with time zone, motivo text, pacote_novo text, pacote_efetivo_em date, created_at timestamp with time zone
* `scorecards`: id uuid, parceiro_id uuid, notas jsonb, completo boolean, nota_potencial numeric(5,2), nota_qualidade numeric(5,2), nivel_entrada_sugerido text, nao_elegivel_sugerido boolean, faltantes text[], versao_criterios integer, created_by uuid, created_at timestamp with time zone
* `trilha_gabarito`: pergunta_id uuid, correta integer
* `trilha_modulos`: id uuid, trilha_id uuid, ordem integer, titulo text, tipo text, caminho text, link text, texto text
* `trilha_perguntas`: id uuid, trilha_id uuid, ordem integer, enunciado text, opcoes jsonb
* `trilha_progresso`: perfil_id uuid, modulo_id uuid, parceiro_id uuid, concluido_em timestamp with time zone
* `trilha_tentativas`: id uuid, perfil_id uuid, parceiro_id uuid, trilha_id uuid, versao integer, respostas jsonb, nota numeric(5,2), aprovado boolean, created_at timestamp with time zone
* `trilhas`: id uuid, chave text, titulo text, descricao text, versao integer, publicada boolean, nota_minima integer, empresa_grupo_id uuid, ordem integer, created_at timestamp with time zone, updated_at timestamp with time zone
* `versoes_regras`: id uuid, versao integer, conteudo jsonb, mudancas text, vigente_desde date, afeta_parceiros boolean, publicada_por uuid, created_at timestamp with time zone

## Funções chamáveis pelo front (supabase.rpc), com argumentos e retorno

* `abrir_desligamento_inadequacao(p_parceiro uuid, p_motivo text)` → uuid
* `aceitar_termo_cruzamento()` → uuid
* `concluir_acao_wise(p_id uuid, p jsonb)` → void
* `concluir_modulo(p_modulo uuid)` → void
* `corrigir_teste(p_trilha uuid, p_respostas jsonb)` → jsonb
* `decidir_coincidencia(p_id uuid, p_virou text, p_referencia uuid DEFAULT NULL::uuid, p_observacao text DEFAULT NULL::text)` → void
* `decidir_desligamento(p_fluxo uuid, p_aprovar boolean, p_aguardar_ciclo boolean DEFAULT false, p_motivo text DEFAULT NULL::text)` → void
* `decidir_rebaixamento(p_revisao uuid, p_confirmar boolean, p_motivo text)` → void
* `definir_fase(p_fase text)` → void
* `enviar_comunicado(p_id uuid)` → integer
* `excluir_cruzamentos(p_parceiro uuid DEFAULT NULL::uuid)` → integer
* `gerar_aviso_desligamento(p_fluxo uuid)` → text
* `marcar_comunicado_lido(p_id uuid)` → void
* `meu_nivel()` → jsonb
* `painel_pessoal(p_perfil uuid DEFAULT NULL::uuid, p_trimestre text DEFAULT NULL::text)` → jsonb
* `painel_v2(p_inicio date DEFAULT NULL::date, p_fim date DEFAULT NULL::date)` → jsonb
* `planilha_custos(p_inicio date, p_fim date)` → TABLE(data date, tipo_linha text, categoria text, parceiro_id uuid, parceiro text, pessoa_id uuid, pessoa text, atividade text, etapa_jornada text, minutos integer, custo_hora numeric, valor numeric, empresa text, cliente text, cliente_icp boolean, mensalidade numeric, origem_id uuid)
* `premiacoes_publicas(p_ano integer DEFAULT NULL::integer)` → TABLE(ano integer, categoria text, nome text, minha boolean)
* `publicar_regras(p_vigencia date, p_mudancas text, p_afeta_parceiros boolean DEFAULT true)` → uuid
* `publicar_trilha(p_trilha uuid, p_nova_versao boolean DEFAULT false)` → integer
* `ranking(p_ano integer DEFAULT NULL::integer, p_trimestre integer DEFAULT NULL::integer)` → TABLE(posicao integer, parceiro_id uuid, nome text, pontos integer, eu boolean)
* `regenerar_link_indicacao(p_parceiro uuid, p_empresas text[] DEFAULT NULL::text[])` → text
* `registrar_checagem(p_id uuid, p_ativo boolean, p_satisfacao integer, p_observacao text DEFAULT NULL::text)` → void
* `registrar_encontro_onboarding(p_marco uuid, p_data date, p_texto text DEFAULT NULL::text)` → uuid
* `registrar_tentativa_retomada(p_fluxo uuid, p_texto text DEFAULT NULL::text)` → void
* `regras_publicadas()` → jsonb
* `regras_retrato()` → jsonb
* `responder_pesquisa(p_nota integer, p_comentario text DEFAULT NULL::text)` → void
* `resultado_canal(p_inicio date, p_fim date, p_agrupar text DEFAULT 'total'::text)` → jsonb
* `revogar_link_indicacao(p_parceiro uuid)` → void
* `situacao_cruzamento(p_parceiro uuid DEFAULT NULL::uuid)` → jsonb
* `situacao_nivel(p_parceiro uuid)` → jsonb
* `sugerir_fase()` → jsonb
* `sugerir_maturidade(p_parceiro uuid)` → jsonb
* `validar_indicacao(p_id uuid, p jsonb)` → void
