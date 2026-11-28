# Graph Report - wise-partners  (2026-11-28)

## Corpus Check
- 415 files · ~484,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .csv 1)

## Summary
- 3578 nodes · 16675 edges · 130 communities (110 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 295 edges (avg confidence: 0.85)
- Token cost: 751,460 input · 0 output

## Community Hubs (Navigation)
- Bibliotecas e componentes base
- Base Ativa, catálogo e ranking
- Campos dinâmicos e registro de contato
- Diálogos de ações e decisões
- Fila de cadastros e formatos
- Níveis, régua e contrapartidas (banco)
- Convites, empresas e aprovações (banco)
- Navegação e cartões da comunidade
- Seções, tarefas e visões
- Comissões e indicações
- Regras e indicações v2 (banco)
- Testes e ajuda
- Formulários de salvar da ficha
- Rotas do App
- Editor de páginas e cases
- Metas e contrapartidas v2
- Nível sugerido e scorecard
- Funil, atividades e comprovações (banco)
- Categorias e campos (banco)
- Ações conjuntas e wireframe
- Tela de metas e funil
- Onboarding e capacitação (banco)
- Capacitação e menus
- Trilhas, certificados e cruzamento (telas)
- Regras, jornada e RFPs
- Dependências do projeto
- Configuração e dias úteis (banco)
- Landing e formulário de cadastro
- Seções das landings
- Diagnóstico de UX por tela
- Gestão de resultado e comunicados (banco)
- Campos do editor de páginas
- Funil, fases e selos
- Ferramentas de desenvolvimento
- Geração de contrato
- Capacitação do parceiro
- Atividades, faixas e metas por pessoa (banco)
- Cruzamento de carteiras
- Trilhas e link de indicação
- Certificado em PDF
- Briefing técnico da v1
- Tabelas de configuração e PDF
- Playbook do programa
- Configurações v2 (chaves)
- Funções de convite e indicação pública
- Senha e acesso
- Blocos da landing e vídeo
- Funções de cadastro público
- Backup, notificações e relatório semanal
- RFP e painel (banco)
- Cruzamento e maturidade (banco)
- Detalhe do pedido de RFP
- Configuração do TypeScript (app)
- Montagem de blocos da RFP
- Landing do cliente e link (banco)
- Seções de configuração v1
- Backup e seções de configuração
- Configuração do shadcn
- Scripts Python
- Tema claro e escuro
- Autodiagnóstico
- Instruções do projeto e contratos
- Importação de planilhas
- Constituição e princípios
- Categorias de parceiros
- Tipos da RFP
- Função ai-gateway
- IA e categorias na RFP
- Spec da v1 e referências
- Comunicados
- Recrutamento e nível de entrada (banco)
- Deploy e dados de demonstração
- Geração de PDF
- Configuração do TypeScript (node)
- Regras de interface do CLAUDE.md
- Níveis e ICP (instruções)
- Configuração de categorias e campos
- Configuração do TypeScript (base)
- Sistema de design e tokens
- Tarefas da v1 e alertas
- Nível, ranking e regras (RPC)
- Princípios de acesso e login
- Landings e textos legais
- Diagnóstico de UX e divergências
- Convenções da v2
- Parâmetros e retrato de regras
- Recomendação de categorias
- Scripts do package.json
- Maturidade (radar)
- Página pública da RFP
- Tipos de resultados de IA
- Indicação protegida (RPC)
- Resultado do canal e custos (RPC)
- Checklists e briefing da v2
- Servidores MCP
- Tailwind
- Vite
- Componente Badge
- Componente Avatar
- API do banco e migrações v2
- Cruzamento e banco local
- Nível híbrido e coleta de parcerias
- Metas e ICP
- Componente ScrollArea
- Parceria institucional (playbook)
- Desligamento e rotinas
- Painel, fases e carteira por pessoa
- Rotas protegidas e sem acesso
- Seed de demonstração
- Componente Separator
- Componente Tooltip
- Script de testes do banco
- Contexto de autenticação
- Faixa do Ver como
- Carregar perfil
- Documentos internos

## God Nodes (most connected - your core abstractions)
1. `Button` - 350 edges
2. `toastErro()` - 336 edges
3. `cn()` - 304 edges
4. `useAuth()` - 229 edges
5. `public.parceiros` - 197 edges
6. `Pilula()` - 187 edges
7. `Carregando()` - 186 edges
8. `react` - 183 edges
9. `ErroCarga()` - 179 edges
10. `lucide-react` - 178 edges

## Surprising Connections (you probably didn't know these)
- `Trecho de CLAUDE.md sobre interface (versao inicial)` --semantically_similar_to--> `CLAUDE.md (instrucoes do projeto)`  [INFERRED] [semantically similar]
  docs/ux/CLAUDE_md_trecho.md → CLAUDE.md
- `Cores dos niveis Elite, Premium, Select (so em selos)` --references--> `Constituicao do Portal Wise Partners`  [INFERRED]
  DESIGN.md → .specify/memory/constitution.md
- `Rascunho de contexto do produto para o init do Impeccable` --semantically_similar_to--> `Cinco principios do produto (pergunta por tela, numero com contexto, registrar rapido)`  [INFERRED] [semantically similar]
  docs/ux/PRODUCT_rascunho.md → PRODUCT.md
- `salvar()` --indirect_call--> `nivel()`  [INFERRED]
  src/components/config/SecoesV2.tsx → tests/db/catalogo_parceiros.test.ts
- `enviar()` --indirect_call--> `icp()`  [INFERRED]
  src/pages/publico/IndicacaoLink.tsx → supabase/functions/_shared/paginas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Principios da constituicao que governam o programa** — _specify_memory_constitution_fonte_unica_da_verdade, _specify_memory_constitution_cada_publico_ve_so_o_seu, _specify_memory_constitution_regras_configuraveis, _specify_memory_constitution_regras_sao_lei, _specify_memory_constitution_canal_se_mede_pelo_resultado [EXTRACTED 0.95]
- **Regras de design que valem para todo o portal** — claude_regra_apple_design, claude_wise_design_system_skill, claude_cores_so_por_tokens, design_regra_do_sinal_menta, design_regra_do_par_e_do_material [INFERRED 0.85]
- **Paginas publicas de entrada e seus textos legais** — docs_landing_parceiros, docs_landing_clientes, docs_textos_legais_termo_adesao_2026_11_07, docs_textos_legais_politica_privacidade_2026_11_07 [EXTRACTED 0.90]
- **Telas que abrem como lista ou grade sem as camadas de painel (heroi, apoio, grafico, acao)** — docs_ux_diagnostico_partes_a1_painel_parceiros_ficha_painel_sem_hierarquia, docs_ux_diagnostico_partes_a1_painel_parceiros_ficha_funil_sem_grafico, docs_ux_diagnostico_partes_a2_indicacoes_comissoes_baseativa_atividades_config_indicacoes_sem_camadas, docs_ux_diagnostico_partes_a2_indicacoes_comissoes_baseativa_atividades_config_atividades_sem_graficos, docs_ux_diagnostico_partes_a1_painel_parceiros_ficha_cinco_camadas_wise_dashboards [INFERRED 0.85]
- **Defeitos de acessibilidade repetidos por copia: rotulo, foco e teclado** — docs_ux_diagnostico_partes_b_detector_auditoria_campos_sem_rotulo, docs_ux_diagnostico_partes_b_detector_auditoria_foco_quase_invisivel, docs_ux_diagnostico_partes_b_detector_auditoria_indicacoes_teclado_p0, docs_ux_diagnostico_partes_a2_indicacoes_comissoes_baseativa_atividades_config_problemas_comuns_c1_c8 [INFERRED 0.85]
- **Falhas da pagina publica de RFP vistas pelo cliente final** — docs_ux_diagnostico_partes_a3_portal_rfp_rfp_erro_rede_vira_link_indisponivel, docs_ux_diagnostico_partes_a3_portal_rfp_rfp_sem_open_graph, docs_ux_diagnostico_partes_a3_portal_rfp_rfp_fichas_nao_comparaveis, docs_ux_diagnostico_partes_c_break_ui_rfp_cortada_375, docs_ux_diagnostico_partes_b_detector_auditoria_rfp_lcp_e_main [INFERRED 0.85]
- **Regras do programa: nivel, pacote e status de atividade** — specs_001_portal_wise_partners_spec_niveis, specs_001_portal_wise_partners_spec_pacotes, specs_001_portal_wise_partners_spec_status_atividade, specs_001_portal_wise_partners_referencias_programa_playbook_wise_partners_v3_1_regua_comercial, specs_001_portal_wise_partners_referencias_programa_playbook_wise_partners_v3_1_pacotes, specs_001_portal_wise_partners_referencias_programa_instrucoes_projeto_wise_partners_niveis [EXTRACTED 0.95]
- **Fluxo de RFP: pedido, recomendacao por IA, selecao de 3 opcoes e pagina publica** — specs_001_portal_wise_partners_spec_pedido_rfp, specs_001_portal_wise_partners_spec_regra_tres_opcoes, specs_001_portal_wise_partners_spec_pagina_publica_rfp, specs_001_portal_wise_partners_briefing_tecnico_recomendacao_rfp_filtro, specs_001_portal_wise_partners_plan_pagina_publica_edge, specs_001_portal_wise_partners_briefing_tecnico_ai_gateway [INFERRED 0.85]
- **Fluxo de assinatura: Quadro, minuta, aprovacao do Diretor, assinatura e onboarding** — specs_001_portal_wise_partners_spec_quadro_identificacao, specs_001_portal_wise_partners_spec_geracao_contrato, specs_001_portal_wise_partners_spec_aprovacao_diretor, specs_001_portal_wise_partners_referencias_programa_playbook_wise_partners_v3_1_minuta_aprovacao, specs_001_portal_wise_partners_referencias_programa_playbook_wise_partners_v3_1_onboarding, specs_001_portal_wise_partners_plan_contrato_navegador [INFERRED 0.85]
- **Cadeia de calculo do ROI do canal** — specs_002_evolucao_metodo_octo_spec_custo_hora, specs_002_evolucao_metodo_octo_spec_catalogo_atividades_esforco, specs_002_evolucao_metodo_octo_spec_custos_esforco, specs_002_evolucao_metodo_octo_spec_resultado_canal_roi, specs_002_evolucao_metodo_octo_api_banco_resultado_canal_fn [EXTRACTED 1.00]
- **Fluxo de indicacao protegida (link, nucleo, protecao, SLA, qualidade)** — specs_002_evolucao_metodo_octo_spec_link_indicacao, specs_002_evolucao_metodo_octo_briefing_tecnico_edge_indicacao_publica, specs_002_evolucao_metodo_octo_briefing_tecnico_registrar_indicacao_core, specs_002_evolucao_metodo_octo_spec_protecao_180_dias, specs_002_evolucao_metodo_octo_spec_sla_indicacoes, specs_002_evolucao_metodo_octo_spec_nota_qualidade_indicacao [EXTRACTED 1.00]
- **Ciclo de vida do nivel do parceiro** — specs_002_evolucao_metodo_octo_spec_scorecard_entrada, specs_002_evolucao_metodo_octo_spec_nivel_por_resultado, specs_002_evolucao_metodo_octo_spec_revisao_trimestral, specs_002_evolucao_metodo_octo_spec_rebaixamento_nunca_automatico, specs_002_evolucao_metodo_octo_spec_desligamento [INFERRED 0.85]

## Communities (130 total, 20 thin omitted)

### Community 0 - "Bibliotecas e componentes base"
Cohesion: 0.07
Nodes (85): lucide-react, react, sonner, @tanstack/react-query, Form, Encontro, MOTIVOS_NAO_REALIZADO, Situacao (+77 more)

### Community 1 - "Base Ativa, catálogo e ranking"
Cohesion: 0.05
Nodes (112): Ciclo, CicloCard(), ItemFila, AcessoComunidade, contatoDoPedido(), ESTADOS_OFERTA, Oferta, Pedido (+104 more)

### Community 2 - "Campos dinâmicos e registro de contato"
Cohesion: 0.05
Nodes (110): CampoDef, CampoValor(), valorCampoTexto(), ParceiroBusca(), agoraLocal(), ATIVIDADE_POR_TIPO, linhas(), PainelRevisao() (+102 more)

### Community 3 - "Diálogos de ações e decisões"
Cohesion: 0.09
Nodes (114): ConcluirAcaoDialog(), numero(), EditarAcaoDialog(), EventoFinalDialog(), EncontroLinha(), situacaoDe(), SituacaoSelo(), FilaItem() (+106 more)

### Community 4 - "Fila de cadastros e formatos"
Cohesion: 0.05
Nodes (96): Cadastro, copiar(), data(), FilaParceiros(), abrirAprovacao(), confirmarAprovacao(), mudar(), INTERESSE (+88 more)

### Community 5 - "Níveis, régua e contrapartidas (banco)"
Cohesion: 0.04
Nodes (74): public.catalogo_contrapartidas, public.niveis, public.parceiros_instrumento, public.parceiros_interno, t_upd, public.notificacoes, public.calcular_status(), public.gerar_contrapartidas() (+66 more)

### Community 6 - "Convites, empresas e aprovações (banco)"
Cohesion: 0.07
Nodes (51): public.convites, public.empresas_grupo, public.aprovacoes, public.contatos, public.parceiro_contatos, public.registrar_indicacao(), public.chamar_rotina(), public.config_num() (+43 more)

### Community 7 - "Navegação e cartões da comunidade"
Cohesion: 0.05
Nodes (72): agruparEmpresas(), AvatarEmpresa(), CartaoEmpresa(), CartaoOferta(), Condicao(), EmpresaCatalogo, FichaEmpresa(), FiltroCategorias() (+64 more)

### Community 8 - "Seções, tarefas e visões"
Cohesion: 0.06
Nodes (64): BotaoSecao(), casaBusca(), emGrupos(), ListaLateral(), limpar(), NavegacaoSecoes(), normalizarBusca(), ordenarSecoes() (+56 more)

### Community 9 - "Comissões e indicações"
Cohesion: 0.05
Nodes (65): ComissaoItem(), Dado(), Comissao, ESTADOS_TODOS, estadosPermitidosFinanceiro(), ROTULO_PARCELA, SELECT_COMISSAO, somar() (+57 more)

### Community 10 - "Regras e indicações v2 (banco)"
Cohesion: 0.04
Nodes (55): public.criterios_icp, public.base_ativa_encontros, on_auth_user_created, public.atualizar_estado_comissao(), public.confirmar_atualizacao_indicacao(), public.is_etapa_perda(), public.notificar_parceiro(), public.notificar_responsavel() (+47 more)

### Community 11 - "Testes e ajuda"
Cohesion: 0.08
Nodes (39): vitest, enviar(), P, pool, prepararDados(), Q, transacao(), U (+31 more)

### Community 12 - "Formulários de salvar da ficha"
Cohesion: 0.05
Nodes (65): salvar(), enviar(), salvar(), salvar(), LinhaIndicador(), salvar(), Aprovacao(), baixarDoStorage() (+57 more)

### Community 13 - "Rotas do App"
Cohesion: 0.06
Nodes (66): Acoes, App(), Atividades, BaseAtiva, Capacitacao, ClientesGrupo, Comissoes, Comunicados (+58 more)

### Community 14 - "Editor de páginas e cases"
Cohesion: 0.08
Nodes (64): AbaCases(), confirmarApagar(), mover(), mudarAtivo(), salvar(), NOVO, Rascunho, AbaMedicao() (+56 more)

### Community 15 - "Metas e contrapartidas v2"
Cohesion: 0.06
Nodes (59): ArquivosBackup(), BarraMeta(), CAMPOS_META_CONTRAPARTIDA, MetaContrapartida(), MetaDaContrapartida, PERIODICAS, baixarArquivo(), Contrapartida (+51 more)

### Community 16 - "Nível sugerido e scorecard"
Cohesion: 0.07
Nodes (58): calcularNivelSugerido(), leInterno(), perfisInternos(), useConfigValor(), useNiveis(), FINAIS, Fluxo, FluxoAtual() (+50 more)

### Community 17 - "Funil, atividades e comprovações (banco)"
Cohesion: 0.17
Nodes (57): public.etapas_funil, public.tipos_atividade, public.comprovacoes, public.contrapartidas, public.propostas_ficha, public.proximos_passos, public.tarefas_onboarding, public.clientes (+49 more)

### Community 18 - "Categorias e campos (banco)"
Cohesion: 0.07
Nodes (53): campos_categoria_chave, public.campos_categoria, public.categorias, ciclo_ativo_por_parceiro, parceiro_uma_principal, parceiros_cnpj_unico, public.contratos_gerados, public.documentos (+45 more)

### Community 19 - "Ações conjuntas e wireframe"
Cohesion: 0.06
Nodes (57): AcaoConjunta, Agrupamento, atrasada(), chaveGrupo(), concluida(), DetalheWise, encerrada(), Lado (+49 more)

### Community 20 - "Tela de metas e funil"
Cohesion: 0.07
Nodes (54): COL_CRITERIOS, COL_FUNIL, ehRoi(), FILTRO_FUNIL, hoje(), IndMeta, MarcoCfg, Meta (+46 more)

### Community 21 - "Onboarding e capacitação (banco)"
Cohesion: 0.06
Nodes (41): public.pacotes, public.ciclos_base_ativa, public.iniciar_onboarding(), public.notificar(), public.ativar_parceiro(), public.certificados, public.concluir_modulo(), public.corrigir_teste() (+33 more)

### Community 22 - "Capacitação e menus"
Cohesion: 0.07
Nodes (51): react-router-dom, Certificado, lista(), Progresso, Tentativa, Trilha, useCertificados(), useGabarito() (+43 more)

### Community 23 - "Trilhas, certificados e cruzamento (telas)"
Cohesion: 0.11
Nodes (52): DetalheTrilha(), semConteudo(), ListaCertificados(), useParceirosResumo(), recorteVazio(), resumoRecorte(), useComunicados(), LeiturasDialog() (+44 more)

### Community 24 - "Regras, jornada e RFPs"
Cohesion: 0.08
Nodes (47): SugestaoFase, IndicadorV2, excluir(), useFunilReverso(), useMetasTrimestre(), LinhaFunil(), ComentariosSatisfacao(), ORDEM_ETAPAS (+39 more)

### Community 25 - "Dependências do projeto"
Cohesion: 0.05
Nodes (56): dependencies, clsx@^2.1.1, cmdk@^1.1.1, date-fns@^4.4.0, @dnd-kit/core@6.3.1, docxtemplater@^3.71.1, lucide-react@^1.61.0, pizzip@^3.3.0 (+48 more)

### Community 26 - "Configuração e dias úteis (banco)"
Cohesion: 0.07
Nodes (38): public.config(), public.config_int(), public.configuracoes, public.feriados, public.is_admin(), public.is_consultor(), public.is_dia_util(), public.is_diretor() (+30 more)

### Community 27 - "Landing e formulário de cadastro"
Cohesion: 0.07
Nodes (44): LINHAS_ACESSO, Marca(), PERFIS_ACESSO, QuadroAcessos(), COMO_CONHECEU, ETAPAS, Etapas(), Form (+36 more)

### Community 28 - "Seções das landings"
Cohesion: 0.14
Nodes (41): Logo(), FaixaEvento(), FaixaLogos(), QuadroCases(), QuadroValorHub(), Secao(), SecaoDepoimentos(), Video() (+33 more)

### Community 29 - "Diagnóstico de UX por tela"
Cohesion: 0.06
Nodes (14): A1 Avaliacao de design: Painel, Parceiros e Ficha do parceiro, Botao flutuante Registrar contato cobre conteudo no celular, Cinco camadas de painel (skill wise-dashboards), Metodo: heuristicas de Nielsen, carga cognitiva e personas (Impeccable critique A), A2 Avaliacao A: Indicacoes, Comissoes, Base Ativa, Atividades e Configuracoes, Problemas comuns C1 a C8 (kit nao usado, estados genericos, rotulos, color-scheme, botao flutuante, URL, calculo no componente), A3 Portal do parceiro (Inicio, Indicacoes) e pagina publica de RFP, Persona: dono da empresa parceira no celular (Casey, Jordan, Sam, Riley) (+6 more)

### Community 30 - "Gestão de resultado e comunicados (banco)"
Cohesion: 0.08
Nodes (34): public.avaliacoes_maturidade, public.comunicado_leituras, public.comunicados, public.definir_fase(), public.enviar_comunicado(), public.enviar_pesquisa_trimestral(), public.fase_programa, public.indicadores (+26 more)

### Community 31 - "Campos do editor de páginas"
Cohesion: 0.08
Nodes (35): BotoesOrdem(), ListaItens(), ListaPerguntasEditor(), mover(), CAMPOS_LONGOS, igual(), Bloco, BlocoCliente (+27 more)

### Community 32 - "Funil, fases e selos"
Cohesion: 0.11
Nodes (36): Pilula(), SeloNivel(), SecaoFase(), CartaoFase(), useDefinirFase(), definir(), ItemLinha(), ItemPonto() (+28 more)

### Community 33 - "Ferramentas de desenvolvimento"
Cohesion: 0.06
Nodes (36): devDependencies, autoprefixer@^10.6.1, eslint@^9.39.5, @eslint/js@^9.39.5, eslint-plugin-react-hooks@^5.2.0, eslint-plugin-react-refresh@^0.5.7, globals@^17.13.0, jsdom@^29.1.1 (+28 more)

### Community 34 - "Geração de contrato"
Cohesion: 0.10
Nodes (27): carregarModelo(), gerar(), salvarQuadro(), Bloco, Campo, CAMPOS_QUADRO, camposVisiveis(), cx() (+19 more)

### Community 35 - "Capacitação do parceiro"
Cohesion: 0.14
Nodes (29): baixarCertificadoPdf(), Certificado, HORAS_NOVA_TENTATIVA, liberaNovaTentativaEm(), Modulo, Pergunta, Progresso, Tentativa (+21 more)

### Community 36 - "Atividades, faixas e metas por pessoa (banco)"
Cohesion: 0.16
Nodes (14): public.atividades, public.pontos_contato, public.faixas, public._indicadores_valores(), public.metas_pessoa, public.painel_pessoal(), public.funil_reverso(), public._indicadores_valores() (+6 more)

### Community 37 - "Cruzamento de carteiras"
Cohesion: 0.11
Nodes (25): papaparse@^5.7.0, papaparse, BaseWise, Cruzamento, decidida(), empresaDoTexto(), LinhaBase, norm() (+17 more)

### Community 38 - "Trilhas e link de indicação"
Cohesion: 0.12
Nodes (22): abrirArquivoTrilha(), BUCKET_TRILHAS, Modulo, Pergunta, ACEITA, nomeDoCaminho(), CumpreNivel, Grupo (+14 more)

### Community 39 - "Certificado em PDF"
Cohesion: 0.12
Nodes (23): baixarCertificado(), BORDA, buscar(), CINZA, DadosCertificado, desenhar(), ESCURO, FontesCertificado (+15 more)

### Community 40 - "Briefing técnico da v1"
Cohesion: 0.13
Nodes (17): Automacoes e agendamentos pg_cron, Modelos de e-mail editaveis, Matriz de permissoes aplicada por RLS, Modelo de dados ponto de partida, Pagina publica /r/:token, Dados iniciais (seed), Pilha Vite React TypeScript Supabase, Testes obrigatorios RLS e regras (+9 more)

### Community 41 - "Tabelas de configuração e PDF"
Cohesion: 0.15
Nodes (9): filtrarPk(), LinhaConfig(), excluir(), salvar(), paraBanco(), paraEdicao(), mover(), copiar() (+1 more)

### Community 42 - "Playbook do programa"
Cohesion: 0.13
Nodes (23): Capacidade 12 horas por mes, Dois pilares prateleira RFP e Base Ativa, Pacotes C B A (instrucoes), Atribuicao de lead primeiro contato registrado, Base Ativa 12 semanas 6 encontros, Capacidade e agenda de terca, Carteira atual e classificacao preliminar, Certificados e materiais (+15 more)

### Community 43 - "Configurações v2 (chaves)"
Cohesion: 0.09
Nodes (22): CHAVES_AGRUPADAS, CHAVES_CRUZAMENTO, CHAVES_CUSTOS, CHAVES_PONTOS, CHAVES_REGRAS, CHAVES_SLA, COL_ACOES, COL_REGUA (+14 more)

### Community 44 - "Funções de convite e indicação pública"
Cohesion: 0.23
Nodes (11): PAPEIS, NEUTRO, SEM_INDEXACAO, SEM_INDEXACAO, cors, erro(), json(), admin() (+3 more)

### Community 45 - "Senha e acesso"
Cohesion: 0.26
Nodes (15): CampoSenha(), CamposNovaSenha(), FormTrocarSenha(), salvar(), TrocarSenha(), mensagemErroAcesso(), MINIMO_SENHA_PESSOAL, problemaSenhaPessoal() (+7 more)

### Community 46 - "Blocos da landing e vídeo"
Cohesion: 0.11
Nodes (16): ApiYT, Campo(), CAPA_VIDEO, carregarApiYT(), CartaoDepoimento(), CASOS, CLIENTES, Depoimento (+8 more)

### Community 47 - "Funções de cadastro público"
Cohesion: 0.18
Nodes (16): enviar(), lista(), SEM_CACHE, texto(), eventoMeta(), SEM_CACHE, sha256(), texto() (+8 more)

### Community 48 - "Backup, notificações e relatório semanal"
Cohesion: 0.25
Nodes (15): TABELAS, BENEF, GRUPOS, enviarEmail(), layoutEmail(), listaHtml(), modeloEmail(), agoraBrasilia() (+7 more)

### Community 49 - "RFP e painel (banco)"
Cohesion: 0.23
Nodes (14): public.eventos_rfp, public.paginas_rfp, public.pedido_rfp_opcoes, public.pedidos_rfp, t_upd, public.assinados_na_categoria(), public.meus_rfps(), public.pode_gerir_pedido() (+6 more)

### Community 50 - "Cruzamento e maturidade (banco)"
Cohesion: 0.15
Nodes (12): public.concluir_acao_wise(), public.sugerir_maturidade(), public.aceitar_termo_cruzamento(), public.aceites_cruzamento, public.base_wise_cruzamento, public.coincidencias_cruzamento, public.cruzamentos, public.decidir_coincidencia() (+4 more)

### Community 51 - "Detalhe do pedido de RFP"
Cohesion: 0.16
Nodes (19): useCandidatos(), useCategorias(), useConfiguracao(), useOpcoes(), usePagina(), usePedido(), DadosPedido, categoriasDaSelecao() (+11 more)

### Community 52 - "Configuração do TypeScript (app)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 53 - "Montagem de blocos da RFP"
Cohesion: 0.24
Nodes (17): EditorBloco(), EditorBlocos(), montarComIA(), montarPadrao(), NOMES_BLOCO, blocosParaPrevia(), CategoriaPagina, ContextoPagina (+9 more)

### Community 54 - "Landing do cliente e link (banco)"
Cohesion: 0.15
Nodes (12): public.definir_acesso_usuario_parceiro(), public.garantir_link_indicacao(), public.abrir_desligamento_inadequacao(), public.cadastrar_cliente_parceiro(), public.config_landing_cliente, public.definir_logo_parceiro(), public.garantir_link_cliente(), public.links_cliente (+4 more)

### Community 55 - "Seções de configuração v1"
Cohesion: 0.11
Nodes (17): COL_CONTRAPARTIDAS, COL_EMPRESAS, COL_ETAPAS, COL_FERIADOS, COL_ICP, COL_NIVEIS, COL_TEXTOS, COL_TIPOS_ATIVIDADE (+9 more)

### Community 56 - "Backup e seções de configuração"
Cohesion: 0.27
Nodes (17): Backup(), exportar(), CategoriasCampos(), SecaoContrapartidas(), SecaoEmpresas(), SecaoEtapas(), SecaoFeriados(), SecaoIcp() (+9 more)

### Community 57 - "Configuração do shadcn"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 58 - "Scripts Python"
Cohesion: 0.17
Nodes (3): q(), slug(), main()

### Community 59 - "Tema claro e escuro"
Cohesion: 0.21
Nodes (14): OPCOES, SeletorAparencia(), Toaster(), ToasterProps, aplicarTema(), areaComTema(), definirPreferencia(), lerPreferencia() (+6 more)

### Community 60 - "Autodiagnóstico"
Cohesion: 0.21
Nodes (13): Autodiagnostico(), Resultado(), AFIRMACOES, ChaveCriterio, ChavePilar, chaveResposta(), CRITERIOS, ESCALA (+5 more)

### Community 61 - "Instruções do projeto e contratos"
Cohesion: 0.16
Nodes (12): Geracao de contratos docxtemplater e PDF, Abordagem e mensagens, Comissao 40 por cento primeira mensalidade, Entregas tipicas por parceiro, Identidade visual verde menta, Papel do assistente do programa por parceiro, Funil Wise Partners etapas e campos, Mensagens padrao e regras de abordagem (+4 more)

### Community 62 - "Importação de planilhas"
Cohesion: 0.20
Nodes (14): falhou(), gravarLinha(), maisDias(), ResultadoLinha, acharCategoria(), CABECALHO, INDEFINIDO, LinhaImportacao (+6 more)

### Community 63 - "Constituição e princípios"
Cohesion: 0.18
Nodes (10): Constituicao do Portal Wise Partners, Cruzamento de carteiras (so CNPJ, sem guardar lista do parceiro), IV.9 Desligamento nunca automatico (aprovacao do Diretor), IV.2 Minimo de 3 opcoes por categoria na pagina de RFP, IV.10 Protecao da indicacao por 180 dias, Fluxos principais (registrar contato, reuniao semanal, RFP, indicar, subir de nivel), LEIA-ME.md (pacote de especificacao 2.0), Contrato de Parceria Comercial versao 2 (clausula 10.4) (+2 more)

### Community 64 - "Categorias de parceiros"
Cohesion: 0.18
Nodes (12): Categoria Consultoria de gestao (fronteira com a Wise), Categoria CRM e forca de vendas, Categoria Design e tecnologia digital (exclui marketing da Triade), Categoria ERP, 22 categorias comerciais com campos especificos, Perfis e categorias institucionais, Marcacao [RFP] de campos, Perfil comum a todos os parceiros comerciais (+4 more)

### Community 65 - "Tipos da RFP"
Cohesion: 0.16
Nodes (13): Categoria, EventoRfp, OpcaoComNome, SituacaoCategoria, AVISO_PADRAO, BlocoPublico, CAMPOS_FICHA, CategoriaSugerida (+5 more)

### Community 66 - "Função ai-gateway"
Cohesion: 0.15
Nodes (9): Anexo, chamarProvedor(), curto, ESQUEMAS, PAPEIS, Pedido, Tarefa, textoDoPdf() (+1 more)

### Community 67 - "IA e categorias na RFP"
Cohesion: 0.14
Nodes (8): Edge Function ai-gateway e funcoes de IA, ai-gateway com provedores e validacao zod, 22 categorias de RFP, Texto de consentimento LGPD para Hub, Objetivo clientes por indicacao e meta 4 parceiros, Prateleira de RFP, Categorias de prateleira e campos dinamicos, Importacao inicial, dossies e contexto do parceiro

### Community 68 - "Spec da v1 e referências"
Cohesion: 0.24
Nodes (11): Materiais de apoio: contratos, dossies, identidade, spec.md Portal Wise Partners, Base Ativa fila e ciclo de 12 semanas, Regras de comissao por empresa do grupo, Catalogo de contrapartidas (Apendice D), Empresas do grupo Wise Makers, Triade, Swallow, Ficha de apresentacao publicada e proposta, Indicacoes nos dois sentidos (+3 more)

### Community 69 - "Comunicados"
Cohesion: 0.22
Nodes (11): Form, Grupo(), inicial(), Comunicado, Leitura, nomeNivelRecorte(), Recorte, TIPOS_COMUNICADO (+3 more)

### Community 70 - "Recrutamento e nível de entrada (banco)"
Cohesion: 0.22
Nodes (10): public.atualizar_estrategico_sugerido(), public.criterios_scorecard, public.scorecard_vigente(), public.scorecards, public.trg_scorecard(), public.trg_scorecard_depois(), t_hist, t_hist2 (+2 more)

### Community 71 - "Deploy e dados de demonstração"
Cohesion: 0.22
Nodes (13): Dados de demonstracao so por seed_demo.sql (excecao: contas Ver como), Deploy provisorio e historico de publicacoes, Beneficios por nivel (migracao 40, fim da hierarquia de pacotes), Contas de demonstracao do Ver como (marca demonstracao, migracao 39), Proposta comercial: comissao da Wise por tipo de venda (pontual 6%, continuo 40%), Infraestrutura: Supabase (banco, auth, functions) e Netlify (site estatico), Comissao de 40% da primeira mensalidade, sem repasse minimo, Arquitetura de informacao do portal (+5 more)

### Community 72 - "Geração de PDF"
Cohesion: 0.15
Nodes (12): pdf-lib@^1.17.1, @pdf-lib/fontkit@^1.1.1, pdf-lib, @pdf-lib/fontkit, A4, buscar(), CINZA, ESCURO (+4 more)

### Community 73 - "Configuração do TypeScript (node)"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+4 more)

### Community 74 - "Regras de interface do CLAUDE.md"
Cohesion: 0.23
Nodes (12): CLAUDE.md (instrucoes do projeto), Kit de componentes e vitrine (src/components/kit, /app/vitrine), PageHeader com pergunta e cinco estados de dados, Regra: nunca usar travessao nem meia-risca, Skills wise-design-system e wise-dashboards (marca, paineis), Cinco camadas de tela (heroi, apoio, explicacao, acao, detalhe), Funcoes SQL para series e resumos por tela (indicador_serie, minhas_pendencias), Trecho de CLAUDE.md sobre interface (versao inicial) (+4 more)

### Community 75 - "Níveis e ICP (instruções)"
Cohesion: 0.27
Nodes (11): ICP da Wise Makers (instrucoes), Niveis Elite Premium Select (instrucoes), Status de atividade por nivel, Parceiro estrategico, Regua da Parceria Comercial Elite Premium Select, Resgate escalonado, Status de atividade, ICP da Wise Makers (+3 more)

### Community 76 - "Configuração de categorias e campos"
Cohesion: 0.17
Nodes (9): COL_CAMPOS, COL_CATEGORIAS, COM_OPCOES, Escopo, ESCOPOS, NOVA_CATEGORIA, ColunaConfig, Opcao (+1 more)

### Community 77 - "Configuração do TypeScript (base)"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 78 - "Sistema de design e tokens"
Cohesion: 0.20
Nodes (7): Cores so por tokens (claro e escuro, puro em vez de white), DESIGN.md (sistema de design do portal), Cores dos niveis Elite, Premium, Select (so em selos), Movimento (ease-saida, ease-folha) e menos movimento/transparencia, Tokens de cor, tipografia e raios (menta #00e193, fonte do sistema), index.html (entrada do app Vite), Script de tema antes da primeira pintura (areas logadas seguem escolha, publicas escuro)

### Community 79 - "Tarefas da v1 e alertas"
Cohesion: 0.31
Nodes (10): Alertas e metricas do CRM, Alertas e resumo diario por e-mail, Painel semanal e pauta, Fase 6 Acabamento, Fase 2 Banco e acesso, Fase 1 Base, Fase 3 Historias P1, Fase 4 Historias P2 (+2 more)

### Community 80 - "Nível, ranking e regras (RPC)"
Cohesion: 0.18
Nodes (11): situacao_nivel(), meu_nivel(), decidir_rebaixamento() (RPC), ranking() e premiacoes_publicas() (anonimato), regras_publicadas(), publicar_regras(), enviar_comunicado() (RPC), concluir_modulo(), corrigir_teste(), publicar_trilha() (RPC), Ativacao do parceiro (primeira indicacao no ICP que virou reuniao), Nivel por resultado (requisitos em tres grupos), Nota de qualidade da indicacao e indicacao qualificada, Onboarding em 90 dias (+3 more)

### Community 81 - "Princípios de acesso e login"
Cohesion: 0.20
Nodes (9): Login por e-mail e senha (alteracao 2.1.0), Restricoes tecnicas (React, Vite, Tailwind, shadcn, Supabase, Resend, Autentique), Wise Hub (plataforma separada; trilhas de venda ficam no portal), README.md (pilha, estrutura e implantacao), Atualizacao da v1 para a v2 (migracoes 10 a 20), Edge Functions (ai-gateway, rfp-publica, indicacao-publica, cruzamento-carteiras, backup), Pilha: Vite, React, Tailwind, shadcn, Supabase, pg_cron, Resend, supabase/seed_demo.sql (dados ficticios so locais) (+1 more)

### Community 82 - "Landings e textos legais"
Cohesion: 0.27
Nodes (10): Landing page do cliente do parceiro (/c/:codigo), Autodiagnostico Matriz 5x5 (25 frases, nota 1 a 5), Landing page dos parceiros SaaS (/parceiros), Fila de espera de cadastros (aprovacao cria parceiro e acesso), Medicao de anuncios (UTM, pixel Meta, GA4, API de Conversoes), Politica de privacidade do Programa Wise Partners (2026-11-07), LGPD: compartilhamento com o parceiro so com autorizacao do cliente, Pesquisa academica com TCLE e Comite de Etica (dados anonimizados) (+2 more)

### Community 83 - "Diagnóstico de UX e divergências"
Cohesion: 0.22
Nodes (9): Divergencias D1 a D12 em relacao ao mapa de telas da skill, Diagnostico de UX do estado atual (24/10/2026), Avaliacao C break-ui com dados extremos, Os 10 problemas mais importantes (painel sem hierarquia, teclado, valores quebrados), Checklist do digno dos melhores (12 criterios), Rascunho de contexto do produto para o init do Impeccable, PRODUCT.md (contexto do produto), Acessibilidade WCAG 2.2 AA e celular como uso principal do parceiro (+1 more)

### Community 84 - "Convenções da v2"
Cohesion: 0.20
Nodes (7): acoes_wise separada de contrapartidas, Tabela atividades_custo (custo fora de atividades), Correcao de seguranca de config() e config_int, Plano de acoes conjuntas nos dois sentidos, Catalogo de atividades por esforco (Apendice N), Custo-hora (remuneracao / 220 x fator de encargos), Custos do canal e esforco por atividade

### Community 85 - "Parâmetros e retrato de regras"
Cohesion: 0.27
Nodes (10): Parametros(), RetratoRegras(), SecaoCruzamento(), SecaoCustos(), SecaoPontos(), SecaoRegras(), publicar(), SecaoSla() (+2 more)

### Community 86 - "Recomendação de categorias"
Cohesion: 0.24
Nodes (6): concluir(), situacaoCategoria(), chave(), EtapaRecomendacao(), recomendar(), salvar()

### Community 87 - "Scripts do package.json"
Cohesion: 0.22
Nodes (9): scripts, build, build:dev, dev, lint, preview, test, test:db (+1 more)

### Community 88 - "Maturidade (radar)"
Cohesion: 0.25
Nodes (8): Avaliacao, CURTOS, EIXOS, Radar(), rotuloCurto(), Sugestoes, TOM_CATEGORIA, EIXOS_MATURIDADE

### Community 89 - "Página pública da RFP"
Cohesion: 0.44
Nodes (6): Bloco(), BlocoConsultor(), CartaoParceiro(), ConteudoPaginaRfp(), ParceiroPublico, PaginaRfp()

### Community 90 - "Tipos de resultados de IA"
Cohesion: 0.22
Nodes (8): BlocoRfp, ResultadoDossie, ResultadoPagina, ResultadoPauta, ResultadoPrint, ResultadoRecomendacao, ResultadoResumo, TarefaIA

### Community 91 - "Indicação protegida (RPC)"
Cohesion: 0.36
Nodes (8): registrar_indicacao(), validar_indicacao(), link e checagens (RPC), Edge Function indicacao-publica, registrar_indicacao casca e _registrar_indicacao_core, Checagens do cliente indicado aos 6 e 12 meses, Faixas de desempenho e regua de atendimento, Link exclusivo de indicacao e pagina publica /i/:token, Protecao da indicacao por 180 dias, SLA de indicacoes nos dois sentidos

### Community 92 - "Resultado do canal e custos (RPC)"
Cohesion: 0.29
Nodes (8): resultado_canal() e planilha_custos() (RPC, so admin), Seed v2 (dados iniciais e configuracoes), Matriz de maturidade por parceiro (8 eixos), Metodo Octo (8 eixos do livro), Modelo de atuacao e proposta de valor em 4 pontos, Etapa de nutricao (pausa do funil), Resultado do canal: ROI e numero principal, Scorecard de entrada e nivel de entrada

### Community 93 - "Checklists e briefing da v2"
Cohesion: 0.36
Nodes (8): Briefing tecnico da feature 002, Specification Quality Checklist 2.0, Incremental Feature Checks (constituicao 2.0.0, contrato v2), Implementation Plan Evolucao Metodo Octo, Feature Specification Portal Wise Partners 2.0, Alteracoes em requisitos da v1, Contrato comercial v2 (Apendice O), Cruzamento de carteiras (matriz de mapeamento de contas)

### Community 94 - "Servidores MCP"
Cohesion: 0.38
Nodes (6): npx, chrome-devtools, context7, playwright, @playwright/mcp, @upstash/context7-mcp

### Community 95 - "Tailwind"
Cohesion: 0.29
Nodes (6): tailwindcss-animate@^1.0.7, tailwindcss@^3.4.19, @tailwindcss/typography@^0.5.20, tailwindcss, tailwindcss-animate, @tailwindcss/typography

### Community 96 - "Vite"
Cohesion: 0.29
Nodes (4): vite@^5.4.21, @vitejs/plugin-react-swc@^3.11.0, vite, @vitejs/plugin-react-swc

### Community 97 - "Componente Badge"
Cohesion: 0.40
Nodes (5): class-variance-authority@^0.7.1, class-variance-authority, Badge(), BadgeProps, badgeVariants

### Community 98 - "Componente Avatar"
Cohesion: 0.33
Nodes (5): @radix-ui/react-avatar@^1.3.1, @radix-ui/react-avatar, Avatar, AvatarFallback, AvatarImage

### Community 99 - "API do banco e migrações v2"
Cohesion: 0.33
Nodes (6): API do banco para as telas da v2, Matriz de permissoes (acrescimos), Migracoes aditivas 0010 a 0019, Constitution Check (principios I a VII), Tasks Evolucao Metodo Octo, Pendente: testes de acesso no ambiente publicado antes de dados reais

### Community 100 - "Cruzamento e banco local"
Cohesion: 0.33
Nodes (6): Banco local PostgreSQL para conferir formatos, Fluxo do parceiro no cruzamento (aceite, extrairDaPlanilha, Edge Function), Edge Function cruzamento-carteiras, Testes obrigatorios da v2, Decisoes tecnicas do plano (alertas_rotina, rotina trimestral, relatorio_semanal_v2), Verificacao: 128 testes de banco, deno check, tsc

### Community 101 - "Nível híbrido e coleta de parcerias"
Cohesion: 0.40
Nodes (5): IV.4 Nivel hibrido (entrada por potencial, permanencia por resultado, carencia), Coleta das parcerias (prompt de extracao para IA), Modelo do bloco por parceiro (secoes A a M), Etapas da negociacao (Sem contato a Parceria encerrada), Niveis Elite, Premium, Select e scorecard de 7 criterios

### Community 102 - "Metas e ICP"
Cohesion: 0.40
Nodes (5): Regra do ICP decide o caminho (reuniao de diagnostico ou autodiagnostico), Metas do Portal Wise Partners (cascata), Cascata de metas: Programa, Representante, Parceiro, Funil ate a meta (funil_reverso, chance e prazo por etapa), Meta principal: clientes fechados no ICP via parceiros

### Community 103 - "Componente ScrollArea"
Cohesion: 0.50
Nodes (4): @radix-ui/react-scroll-area@^1.4.0, @radix-ui/react-scroll-area, ScrollArea, ScrollBar

### Community 104 - "Parceria institucional (playbook)"
Cohesion: 0.40
Nodes (4): Parceria Comercial e Parceria Institucional, IPP Ideal Partner Profile, Quatro perfis institucionais, Regua institucional A B C

### Community 105 - "Desligamento e rotinas"
Cohesion: 0.40
Nodes (4): Funcoes de desligamento (abrir, decidir, gerar_aviso), rotina_diaria e rotina trimestral (pg_cron), Fluxo de desligamento (inatividade e inadequacao), Revisao trimestral de nivel (observacao, proposta de rebaixamento)

### Community 106 - "Painel, fases e carteira por pessoa"
Cohesion: 0.50
Nodes (5): painel_v2(), sugerir_fase(), painel_pessoal() (RPC), Carteira e metas por pessoa, Fase do programa (experimentacao, tracao, crescimento, otimizacao), Painel por etapa da jornada e indicadores, Pesquisa trimestral de satisfacao e NPS

### Community 107 - "Rotas protegidas e sem acesso"
Cohesion: 0.40
Nodes (4): Inicio(), PrimeiroAcesso, Protegida(), SemAcesso()

### Community 109 - "Componente Separator"
Cohesion: 0.50
Nodes (3): @radix-ui/react-separator@^1.2.0, @radix-ui/react-separator, Separator

### Community 110 - "Componente Tooltip"
Cohesion: 0.50
Nodes (3): @radix-ui/react-tooltip@^1.4.1, @radix-ui/react-tooltip, TooltipContent

## Ambiguous Edges - Review These
- `Protecao da indicacao por 180 dias` → `Fluxo de desligamento (inatividade e inadequacao)`  [AMBIGUOUS]
  specs/002-evolucao-metodo-octo/spec.md · relation: conceptually_related_to

## Knowledge Gaps
- **59 isolated node(s):** `@playwright/mcp`, `@upstash/context7-mcp`, `DATABASE_URL`, `IV.9 Desligamento nunca automatico (aprovacao do Diretor)`, `Wise Hub (plataforma separada; trilhas de venda ficam no portal)` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 768 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Capacitação e menus` to `Bibliotecas e componentes base`, `Base Ativa, catálogo e ranking`, `Campos dinâmicos e registro de contato`, `Diálogos de ações e decisões`, `Fila de cadastros e formatos`, `Navegação e cartões da comunidade`, `Seções, tarefas e visões`, `Comissões e indicações`, `Editor de páginas e cases`, `Metas e contrapartidas v2`, `Nível sugerido e scorecard`, `Ações conjuntas e wireframe`, `Tela de metas e funil`, `Trilhas, certificados e cruzamento (telas)`, `Regras, jornada e RFPs`, `Landing e formulário de cadastro`, `Seções das landings`, `Campos do editor de páginas`, `Funil, fases e selos`, `Trilhas e link de indicação`, `Tabelas de configuração e PDF`, `Configurações v2 (chaves)`, `Detalhe do pedido de RFP`, `Backup e seções de configuração`, `Tema claro e escuro`, `Parâmetros e retrato de regras`, `Maturidade (radar)`, `Componente Badge`, `Componente Avatar`, `Componente ScrollArea`, `Componente Separator`, `Componente Tooltip`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `toastErro()` (e.g. with `ConcluirAcaoDialog()` and `EditarAcaoDialog()`) actually correct?**
  _`toastErro()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@playwright/mcp`, `@upstash/context7-mcp`, `DATABASE_URL` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bibliotecas e componentes base` be split into smaller, more focused modules?**
  _Cohesion score 0.06953020134228188 - nodes in this community are weakly interconnected._
- **Why does `toastErro()` connect `Formulários de salvar da ficha` to `Bibliotecas e componentes base`, `Base Ativa, catálogo e ranking`, `Campos dinâmicos e registro de contato`, `Diálogos de ações e decisões`, `Fila de cadastros e formatos`, `Navegação e cartões da comunidade`, `Seções, tarefas e visões`, `Comissões e indicações`, `Testes e ajuda`, `Editor de páginas e cases`, `Metas e contrapartidas v2`, `Nível sugerido e scorecard`, `Tela de metas e funil`, `Capacitação e menus`, `Trilhas, certificados e cruzamento (telas)`, `Regras, jornada e RFPs`, `Funil, fases e selos`, `Geração de contrato`, `Capacitação do parceiro`, `Cruzamento de carteiras`, `Trilhas e link de indicação`, `Tabelas de configuração e PDF`, `Configurações v2 (chaves)`, `Detalhe do pedido de RFP`, `Backup e seções de configuração`, `Importação de planilhas`, `Comunicados`, `Parâmetros e retrato de regras`, `Recomendação de categorias`, `Maturidade (radar)`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Base Ativa, catálogo e ranking` be split into smaller, more focused modules?**
  _Cohesion score 0.04787175234936429 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Protecao da indicacao por 180 dias` and `Fluxo de desligamento (inatividade e inadequacao)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._