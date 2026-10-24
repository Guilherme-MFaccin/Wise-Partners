# Parte C. Break-ui: o pior caso realista nas telas principais

Diagnóstico apenas. Nada foi alterado em `src/`, `supabase/` ou `tests/`. Os dados entraram pela mesma fronteira dos dados reais (tabelas e gatilhos do banco), no banco de sandbox `demo_extremo`, lido pela prévia em `http://127.0.0.1:4174`. Adaptação combinada para este projeto: o "Demo / Pior caso" da skill é a troca de banco (seed de demonstração no `postgres`, pior caso no `demo_extremo`), e não um seletor no código.

* Dados: [C-break-ui-dados.sql](C-break-ui-dados.sql) (rodado sem nenhum erro; nenhuma regra do banco bloqueou o cenário).
* Capturas de página inteira: `docs/ux/capturas/extremo/<tela>-<largura>.jpg` (375, 768 e 1440).
* Recortes de detalhe e auditoria de DOM: `docs/ux/capturas/extremo/detalhe/<tela>-<largura>-y<posição>.jpg` e `...-alvo.jpg`.
* As páginas inteiras de `indicacoes` em 375 e `comissoes-todas` nas três larguras não puderam ser salvas: passam de 65.535 px, o limite do formato JPEG. Isso já é um achado (ver Indicações e Comissões); os recortes do topo estão em `detalhe/`.
* Para voltar o sandbox ao estado anterior: `pg_restore --clean -d postgresql://postgres@localhost:54340/demo_extremo /tmp/claude-0/-home-user/d87b95a2-e40c-5eb4-8a52-da1d4f24f10a/scratchpad/demo_extremo_antes.dump`.

Verificado visualmente: tudo o que cita captura. Inferido do código, sem reprodução no sandbox: o corte silencioso em 1.000 linhas do Supabase hospedado e o formato `mm/dd/yyyy` dos campos de data (depende do idioma do navegador; o Chromium de teste roda em inglês).

## 1. Mapa de valores (fase 1)

A primeira constatação vale para quase todas as linhas: **o banco não limita o tamanho de nenhum campo de texto** (todos são `text`, sem `check (char_length(...))`), e os formulários internos não têm `maxLength` (só UF tem 2; a página pública de indicação e a pesquisa limitam a 120, 160, 200 e 2000). Sem limite no backend, o limite usado no teste foi o realista: nome empresarial da Receita Federal (150), nome fantasia (55) e o `maxLength` do formulário público quando existe.

| Campo exibido | Origem | Tipo | Limite | Opcional |
|---|---|---|---|---|
| Nome do parceiro | `parceiros.nome_fantasia` | text | sem limite no banco nem no formulário (`NovoParceiroDialog`, `DadosEmpresa`); aceita espaços nas pontas | Não |
| Razão social do parceiro | `parceiros.razao_social` | text | sem limite (Receita: 150) | Sim |
| Site, endereço, redes sociais | `parceiros.site`, `endereco`, `redes_sociais` (jsonb) | text | sem limite | Sim |
| Cidade/UF | `parceiros.cidade`, `uf` | text | UF `maxLength=2` só no formulário | Sim |
| Categoria (nome) | `categorias.nome` | text | sem limite | Não |
| Categorias por parceiro | `parceiro_categorias` | lista | sem limite (1 principal por índice) | Sim |
| Nível, pacote | `parceiros.nivel`, `pacote` | enum A, B, C | check no banco; pacote restrito ao nível por gatilho | Sim |
| Etapa do funil | `parceiros.etapa` | FK `etapas_funil` | 14 etapas | Não |
| Status de atividade | `parceiros.status_atividade` | enum calculado | 4 valores | Não |
| Responsável (nome, e-mail) | `perfis.nome`, `perfis.email` | text | sem limite; `nome` tem default `''` | Nome pode vir vazio |
| Último contato | `parceiros.ultimo_contato` | date | nulo possível | Sim |
| Próximo passo | `proximos_passos.descricao`, `data` | text, date | sem limite | Sim |
| Contato do parceiro | `contatos.nome`, `cargo`, `email` | text | sem limite | Sim |
| Cliente da indicação | `clientes.razao_social` | text | sem limite (público: 200) | Não |
| Valor base, valor total | `indicacoes.valor_base`, `valor_total` | numeric(14,2) | até R$ 999.999.999.999,99 | Sim |
| Necessidade, observações | `indicacoes.necessidade`, `observacoes` | text | sem limite (público: 2000) | Sim |
| Nota de qualidade | `indicacoes.nota_qualidade` | int calculado | 0 a 100 | Sim |
| Marcadores (SLA, ICP, link) | `indicacoes.sla`, flags | jsonb e boolean | vários ao mesmo tempo | Sim |
| Quantidade de indicações | contagem | int | sem limite; PostgREST hospedado corta em 1.000 linhas por padrão (`supabase/config.toml` não define `max_rows`) | Não |
| Comissão (valor, percentual) | `comissoes.valor` numeric(14,2), `percentual` numeric(6,3) | número | até 12 dígitos inteiros; 3 casas no percentual | Sim (A calcular) |
| Rótulo da base da comissão | `comissoes.base_descricao` (copiado de `empresas_grupo.base_calculo` ou do instrumento) | text | sem limite | Sim |
| Observação da comissão | `comissoes.observacao` | text | sem limite | Sim |
| Totais de comissão | soma no cliente | número | soma de até centenas de valores de 12 dígitos | Não |
| Atividades (quantidade, minutos, custo) | `atividades`, `atividades_custo` | int, numeric | sem limite | Não |
| Descrição da atividade | `atividades.descricao` | text | sem limite | Sim |
| Fila do Base Ativa (posição, nome) | `v_fila_base_ativa` | view | sem limite | Não |
| Comentário de satisfação | `pesquisas_satisfacao.comentario` | text | 2000 no formulário, sem limite no banco | Sim |
| Saudação do portal | `perfis.nome` primeira palavra | text | default `''` | Pode vir vazio |
| Contrapartidas pendentes e atrasadas | contagem | int | 0, 1, muitas | Não |
| Página de RFP: cliente, título, necessidade | `pedidos_rfp.cliente_nome`, `necessidade_resumida`, `paginas_rfp.blocos` (jsonb) | text | sem limite | Necessidade sim |
| Página de RFP: parceiros por categoria | `paginas_rfp.blocos[].parceiros[]` | lista | sem limite; o nome é cópia do momento da publicação | Não |
| Contato disponível na RFP | `parceiro_assinado()` e campos `whatsapp_comercial`, `email_comercial` | calculado | pode faltar | Sim |

## 2. Cenário extremo usado (fase 2)

Um único conjunto de dados, com as falhas espalhadas pelas primeiras linhas de cada lista. Total: **200 parceiros** (40 do seed, 15 especiais, 145 gerados), 81 assinados, **478 indicações**, **849 comissões**, **1.075 atividades nos últimos 30 dias**, 33 parceiros na fila do Base Ativa.

| Caso | Valor usado | Linha do catálogo |
|---|---|---|
| Nome fantasia no limite da Receita | "Araucária Sistemas de Gestão e Integração Industrial" (52) | Pessoas e nomes: nome longo |
| Razão social no limite | "Araucária Sistemas de Gestão Empresarial, Integração de Processos Industriais, Consultoria em Tecnologia da Informação e Serviços Correlatos Ltda" (145) | Nome longo |
| Nome fantasia sem limite (instituição que usa a razão social) | "Associação Brasileira das Empresas de Software e Serviços de Tecnologia da Informação do Estado do Paraná" (104) | Nome longo, sem limite no esquema |
| Nome inquebrável | "assessoriaempresarialdocentrosulparanaense.com.br" (49, domínio como nome) | E-mails e URLs: string inquebrável |
| Nome de uma letra e de duas | "Z", "JR" | "J", "Jo" |
| Diacrítico e "&" | "Kowalczyk & Wiśniewski Consultoria Empresarial", "Silva & Filhos Assessoria Contábil e Tributária" | Hífen, diacríticos, escape |
| Apóstrofo | "Sabor d'Ouro Tecnologia para Alimentos" | Apóstrofo |
| Minúsculas | "kumbuca gestão financeira" | "dana" |
| Maiúscula acentuada no início | "Ômega Automação Industrial", "Árvore Contabilidade Consultiva" | "Ólafur" (ordenação) |
| Espaços nas pontas (importação) | "␣␣Pinhão Digital␣␣" | "  Sam   Lee " |
| Responsável com nome e e-mail longos | "Maria Eduarda Albuquerque Cavalcanti de Vasconcellos", `maria.eduarda.albuquerque.cavalcanti@demo.wisemakers.local` | Nome e e-mail longos |
| Usuária do parceiro sem nome | `perfis.nome = ''` (default do banco) | (missing) |
| Contato longo | "Maria Aparecida dos Santos Oliveira Wiśniewska", `relacionamento.parcerias.comerciais.e.canais@araucariasistemasdegestao.com.br` | E-mail clássico longo |
| Site e redes longos | URL de 129 caracteres com `utm_source`; três URLs de redes | URL longa |
| Categoria com nome longo | "Gestão de riscos, compliance, proteção de dados pessoais e segurança da informação" (com exatamente 1 parceiro) | Rótulo longo, contagem 1 |
| Muitas categorias num parceiro | Sistemas Araucária em 15 categorias | Doze tags num item |
| Categoria gigante | ERP com 55 parceiros | Um item 10x maior |
| Zero itens | "Z" e "Consultoria Recém Assinada": sem categoria, contato, indicação | 0 itens |
| Exatamente 1 | "Unidade Única Consultoria" com 1 indicação; Araucária com 1 contrapartida pendente e 1 atrasada | Plural com 1 |
| Centenas | Sistemas Araucária com 272 indicações (214 feitas, 58 recebidas) | Coleção grande |
| Cliente no limite | "Cooperativa Agroindustrial Mista dos Produtores Rurais de Leite, Grãos e Proteína Animal do Vale do Ivaí, do Norte Pioneiro e dos Campos Gerais Ltda" (148) | Nome longo |
| Venda de sete e oito dígitos | R$ 23.456.789,10 (Swallow), R$ 12.345.678,90, R$ 2.400.000,00, R$ 87.654.321,09 | 12345678.9 como moeda |
| Comissão de sete dígitos | R$ 1.407.407,35 a pagar; R$ 1.234.567,89 a receber; R$ 5.259.259,27 aguardando | Moeda grande |
| Percentual com três casas | 12,345% | Número com casas |
| Observação longa | observação de comissão de 330 caracteres; observações de indicação de 1.240 | Descrição colada |
| Comentário no limite do formulário | 2000 caracteres | Descrição de 2.000 |
| Próximo passo longo | 186 caracteres, vencido, em 57 parceiros | Rótulo longo |
| Quatro dígitos | 1.075 atividades e 1.665 horas no período | 1284 sem separador |
| Página de RFP cheia | 14 parceiros em 2 categorias, título de 140 e necessidade de 135 caracteres, parceiro não assinado incluído | Coleção, rótulos longos |
| Campos opcionais ausentes | sem razão social (1 em 6), sem cidade (1 em 9), sem responsável (1 em 4), sem último contato (1 em 5), contato sem e-mail ou cargo | Dados parciais |

Todos os passos respeitaram os gatilhos: as assinaturas passaram pela aprovação do Diretor (`aprovacoes`), data de assinatura e etapa; contrapartidas e comissões foram geradas pelo banco (`gerar_contrapartidas`, `sincronizar_comissoes`); nível veio da carteira no ICP e pacote só onde o nível permite. Nada bloqueou o cenário, o que confirma o achado de esquema: nenhum texto tem teto, e um parceiro "Z" sem dados pode ser incluído numa página pública de RFP.

## 3. O que quebrou, por tela (fases 3 e 4)

Auditoria automática feita junto com as capturas (altura da página, nós do DOM e textos truncados sem `title`):

| Tela | Altura em 375 | Altura em 1440 | Nós no DOM | Truncados sem forma de ler (375 / 1440) | Rolagem horizontal |
|---|---|---|---|---|---|
| Painel (jornada) | 5.545 | 2.773 | 754 | 0 / 0 | Não |
| Painel (lista completa) | 6.792 | 4.024 | 1.101 | 37 / 22 | Não |
| Parceiros por categoria | 13.037 | 6.071 | 1.829 | 27 / 54 | Não |
| Parceiros funil | 34.147 | 15.595 | 3.061 | 20 / 96 | Não |
| Parceiros lista | 29.079 | 17.689 | 4.785 | 29 / 250 | Dentro do cartão, em 768 e 1440 |
| Ficha | 6.075 | 3.401 | 669 | 0 / 0 | Não |
| Ficha, aba Indicações | 32.087 | 20.801 | 4.435 | 0 / 103 | Não |
| Indicações | 108.597 | 46.873 | 12.658 | 0 / 810 | Dentro do cartão, em 768 e 1440 |
| Comissões (A pagar) | 9.583 | 6.153 | 954 | 0 / 0 | Não |
| Comissões (Todas) | 394.997 | 248.653 | 28.798 | 505 / 53 | Não |
| Base Ativa | 8.439 | 4.071 | 670 | 0 / 0 | **Sim, a página inteira em 375 (453 px)** |
| Atividades (por parceiro) | 13.902 | 13.472 | 1.334 | 175 / 0 | Não |
| Atividades (lista) | 133.641 | | 9.858 | 0 | **Sim, 390 px em 375** |
| Portal do parceiro | 2.508 | 1.243 | 368 | 0 / 0 | Não |
| Portal, indicações | 29.209 | 25.549 | 1.902 | 0 / 0 | Não |
| RFP pública | 4.510 | 3.079 | 187 | 0 / 0 | **Conteúdo cortado em 375 (cartões com 492 px)** |

Nenhuma tela mostrou travessão nem erro de REST nas capturas.

### 3.1 Painel `/app`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Na aba Lista completa, os cartões de comissão em duas colunas quebram o número no meio: "R$ 3.193.27" numa linha e "3,13" na outra; "R$ 22.055," e "00". O leitor lê outro valor | crítico | Catálogo, números e dinheiro: "12345678.9 como moeda"; break-ui "nunca truncar números"; wise-design-system §3 (`tabular-nums`) | `detalhe/painel-lista-375-y3600.jpg` (375) | Em `Indicador` (`src/components/painel/Blocos.tsx:99`) trocar `break-words` por `whitespace-nowrap tabular-nums`, reduzir a fonte do valor em telas estreitas (`text-lg sm:text-xl`) ou passar a uma coluna abaixo de 400 px. Valor nunca quebra nem trunca |
| Em "Parceiros esfriando" os dois selos ("Sem motivo" e "Dormente") têm `shrink-0` e o nome fica com 9 letras: "Grupo Cam…", "Associação …", "Último contato: nun…". Em 1440 ainda corta ("Associação Com…") | alto | Assinatura "ação no fim empurrada para fora" ao contrário: o selo nunca cede; break-ui "truncar nome que identifica" | `detalhe/painel-lista-375-y1200.jpg` (375), `detalhe/painel-lista-1440-y0.jpg` (1440) | Em `ListaParceiros` (`Blocos.tsx:64-72`) levar os avisos para a linha de baixo quando houver dois, ou manter só um selo ("Dormente, sem motivo"); nome com `min-w-0 flex-1` e até 2 linhas |
| "Contrapartidas atrasadas" corta a data no fim: "Contrato assinado e responsável nomeado · 2…". A data é o que diferencia os itens | alto | break-ui "nunca truncar datas"; truncar no fim só quando o início carrega o sentido | `detalhe/painel-lista-375-y2400.jpg` (375) | Em `src/components/painel/ListaCompleta.tsx:85` pôr a data primeiro ("22/01/2026 · Contrato...") ou numa linha própria |
| 37 nomes e detalhes truncados sem `title` nem tooltip em 375 (22 em 1440) | médio | Assinatura "texto truncado sem como ler" | `detalhe/painel-lista-375-y1200.jpg` | `title` no `Link` de `ListaParceiros` e no detalhe |
| "e mais 104" em "Parceiros esfriando", "e mais 62" em "Contrapartidas atrasadas" e o bloco "Negociações paradas" não têm link: os itens além dos 6 primeiros são inalcançáveis pelo painel | médio | wise-dashboards §5 (todo número leva à lista filtrada) | `detalhe/painel-lista-1440-y0.jpg` | Passar `linkMais` também nesses blocos, para a lista de parceiros filtrada por status ou para Pendências |
| "Atividades do período" mostra "8 · 12 h": o 8 não tem unidade; os 39 tipos aparecem todos | baixo | Catálogo, números: contagem sem rótulo; wise-dashboards §3 (detalhe vai para aba) | `detalhe/painel-lista-375-y5600.jpg` | `ListaCompleta.tsx:235`: "8 atividades · 12 h" com plural; mostrar os 6 maiores e "ver todos" |
| Na aba Por etapa, "10 de 3" e "4 de 5" quebram entre o número e o "de" em 375 | baixo | Catálogo, rótulo que quebra | `detalhe/painel-375-y0.jpg` | `whitespace-nowrap` no trecho em `src/components/gestao/FasePrograma.tsx:64` |
| O botão flutuante "+" (`AppLayout.tsx:158`) cobre abas, selos e o último botão da tela em 375 (aqui, a aba Onboarding; em Comissões, "Mudar estado") | médio | Catálogo, ambiente "dispositivo de toque"; assinatura "ação no fim inalcançável" | `detalhe/painel-375-y0.jpg`, `detalhe/comissoes-sete-digitos-375-alvo.jpg` | Reservar `padding-bottom` de 88 px no conteúdo em telas pequenas ou recolher o botão ao rolar |
| A aba Por etapa tem mais de 30 cartões iguais em sequência (5.545 px em 375); o cenário extremo só alonga o problema | médio | wise-dashboards §3 (nunca mais de 6 cards iguais; uma camada por função) | `painel-375.jpg`, `painel-1440.jpg` | Decisão de desenho do painel (fora do break-ui): número principal, 3 a 6 KPIs, gráficos e o resto em abas |

### 3.2 Parceiros `/app/parceiros?vista=categorias`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| O cartão ERP lista os 55 parceiros sem limite e estica a linha da grade: CRM e MES ficam com cerca de 1.900 px de vazio ao lado; a página vai a 13.037 px em 375 | alto | Catálogo, coleções: "um item 10x maior que os outros"; wise-dashboards §7 (200 parceiros) | `detalhe/parceiros-categorias-1440-y0.jpg`, `detalhe/parceiros-categorias-1440-y1400.jpg` (1440) | Em `VisaoCategorias.tsx:99` mostrar até 8 nomes e "Ver os 55" com link para `?vista=lista&categoria=`; `items-start` na grade (`:35`, `:51`) |
| 54 nomes truncados sem `title` em 1440; "Araucária Sistemas de Ge…" se repete igual em várias categorias | médio | Assinatura "texto truncado sem como ler" | `detalhe/parceiros-categorias-1440-y1400.jpg` | `title` no link; nome em até 2 linhas |
| Em 375 a etapa some (`hidden sm:inline`), então a mesma lista diz coisas diferentes por largura | baixo | Catálogo, ambiente 320 px | `detalhe/parceiros-categorias-375-y0.jpg` | Etapa como segunda linha pequena no celular |
| O selo "Menos de 3 assinados" espreme o título da categoria em 3 linhas ("SST (saúde e / segurança do / trabalho)") | médio | Assinatura "selo que quebra ou espreme" | `detalhe/parceiros-categorias-1440-y1400.jpg` | Selo abaixo do título (`VisaoCategorias.tsx:89`) |

### 3.3 Parceiros `/app/parceiros?vista=funil`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Colunas de cerca de 190 px em 1440: nomes de 20 caracteres já truncam ("Consultoria Caram…", "Consultoria Jaguari…", "Associação Comer…") e parceiros diferentes ficam iguais na tela, sem `title` (96 truncados) | alto | break-ui "embrulhar o texto que identifica"; catálogo "itens com nomes idênticos" | `detalhe/parceiros-funil-1440-y0.jpg` (1440) | `QuadroFunil.tsx:91`: nome em até 2 linhas (`line-clamp-2`) com `title` |
| A descrição do próximo passo não tem limite: 11 linhas por cartão, colunas desalinhadas | alto | Catálogo "descrição colada de 2.000"; break-ui "clamp em prévias de cartão" | `detalhe/parceiros-funil-1440-y0.jpg` | `QuadroFunil.tsx:108`: `line-clamp-2` e texto completo na ficha |
| Sem limite por coluna: 25 cartões em "Sem contato", página de 15.595 px (1440) e 34.147 px (375); Onboarding e Parceria ativa ficam abaixo de tudo | alto | Catálogo, coleções "1.000+ itens sem paginação"; wise-dashboards §7 | `parceiros-funil-1440.jpg`, `parceiros-funil-375.jpg` | Rolagem interna por coluna com altura fixa, ou 10 cartões por coluna e "ver mais" para a lista filtrada |
| Cada cartão traz um `Select` de etapa: 3.061 nós no DOM para 200 parceiros | médio | Catálogo "rolar 1.000 linhas engasga" | auditoria de DOM | Trocar etapa por menu sob demanda (abre ao clicar) |

### 3.4 Parceiros `/app/parceiros?vista=lista`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| 200 linhas sem paginação nem virtualização: 17.689 px (1440), 29.079 px (375), 4.785 nós | alto | Catálogo "1.000+ itens"; wise-design-system §5 (`DataTable` com paginação) | `parceiros-lista-1440.jpg`, `parceiros-lista-375.jpg` | Migrar para o `DataTable` do kit com paginação de 50 |
| O nome do parceiro, que identifica a linha, trunca em 220 px ("Araucária Sistemas de Ge…", "Associação Brasileira das …") enquanto Etapa e Responsável quebram em 2 a 4 linhas: a hierarquia fica invertida | alto | break-ui "embrulhar nomes, truncar metadado" | `detalhe/parceiros-lista-1440-y1400.jpg` (1440) | `ListaParceiros.tsx:222`: nome em até 2 linhas; razão social truncada com `title` |
| Responsável longo quebra em 4 linhas e a linha vai a 112 px | médio | wise-design-system §4 (linha de tabela de 40 px) | `detalhe/parceiros-lista-1440-y1400.jpg` | Mostrar primeiro nome e sobrenome ou iniciais com `title` |
| Em 768 a tabela é mais larga que a tela: Status cortado ("Dormen…"), Responsável, Cidade e Último contato ficam fora, sem sinal de rolagem (524 elementos fora da área) | alto | Catálogo, ambiente "barra lateral estreita"; break-ui "ação no fim inalcançável" | `detalhe/parceiros-lista-768-y700.jpg` (768) | Usar os cartões do celular até `lg`, ou esconder colunas secundárias abaixo de 1024 px |
| Ordenação pelo banco com collation `C.UTF-8`: "assessoria…", "kumbuca…", "Árvore…" e "Ômega…" vão para depois de "Z"; "Fábrica" vem depois de "Força"; "␣␣Pinhão Digital" vai para o topo | médio | Catálogo "Ólafur, dana, espaços" (ordenação) | `detalhe/parceiros-lista-1440-y0.jpg` | `dados.ts:331`: ordenar no cliente com `localeCompare('pt-BR', { sensitivity: 'base' })` ou collation ICU pt-BR; `trim` do nome num gatilho |
| Campos ausentes viram célula vazia (Responsável, Último contato, Nível e pacote); no celular aparece "Sem responsável", no computador nada | médio | wise-design-system §6 (parcial sinalizado); catálogo "dados parciais" | `detalhe/parceiros-lista-1440-y0.jpg`, `detalhe/parceiros-lista-375-y1200.jpg` | Marcador neutro igual nas duas larguras ("Sem responsável", "Nunca") |

### 3.5 Ficha `/app/parceiros/d0000000-0000-4000-a000-000000001001`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Na aba Indicações, os cartões de comissão (`Numero`, `src/components/parceiros/ui.tsx:58`) não quebram e "R$ 3.638.598,43" vaza a borda do cartão e encosta na borda da tela em 375. O mesmo dado falha de outro jeito no painel: são dois componentes para o mesmo KPI | alto | Catálogo, moeda grande; wise-design-system §5 (um `KpiTile` canônico) | `detalhe/ficha-comissoes-375-y1300.jpg` (375) | Um só componente de número com `whitespace-nowrap tabular-nums` e fonte que reduz; em 375 uma coluna |
| Tabela de 272 indicações sem paginação (20.801 px em 1440, 32.087 px em 375); o cliente trunca em 25 caracteres e duas linhas seguidas viram "Cooperativa Agroindustria…" idênticas (103 truncados sem `title`) | alto | Catálogo "itens com nomes idênticos" e "1.000+ itens"; break-ui "truncar no meio quando difere no fim" | `detalhe/ficha-indicacoes-1440-y0.jpg` (1440) | Paginação de 25 e link "ver todas" para `/app/indicacoes?parceiro=`; cliente em 2 linhas |
| Site e redes sociais usam `break-all` em colunas de 160 px: 6 linhas para o site, 13 para as redes, quebrando no meio das palavras | médio | Assinatura "palavra quebrada no meio" (`break-all`) | `detalhe/ficha-1440-y0.jpg` (1440) | `DadosEmpresa.tsx:95-100`: mostrar o domínio (`araucariasistemasdegestao.com.br/…`) com truncamento no meio, `title` com a URL e `overflow-wrap:anywhere` |
| 16 abas viram 7 linhas (cerca de 250 px) em 375; o primeiro dado aparece só no segundo scroll | médio | Catálogo, ambiente 320 px | `detalhe/ficha-375-y0.jpg` (375) | Abas roláveis numa linha ou seletor de aba no celular |
| Campo "Pausar até" mostra `mm/dd/yyyy` (inferido: segue o idioma do navegador) | baixo | wise-design-system §8 (data `24/10/2026` em formulários) | `detalhe/ficha-1440-y0.jpg` | Seletor de data próprio com formato pt-BR, ou `lang="pt-BR"` no documento |

### 3.6 Indicações `/app/indicacoes`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Em 1440 a tabela de 10 colunas é mais larga que o cartão: "Valor base" aparece cortado na borda ("R$ 87.6…") e "Responsável" fica fora. A barra de rolagem horizontal está no fim de um cartão de 46.873 px. Em 768 Origem, Etapa, Nota, Valor e Responsável ficam fora | crítico | break-ui "nunca truncar valores"; catálogo "R$ 12.345.678,90 estoura a coluna de totais" | `detalhe/indicacoes-1440-y0.jpg` (1440), `detalhe/indicacoes-768-y0.jpg` (768) | `Indicacoes.tsx:236`: ordem de colunas por prioridade (valor e etapa antes de sentido e origem), Sentido e Origem como ícone ou uma coluna, Responsável por iniciais com `title`, coluna de valor com largura mínima; paginação para a barra ficar à vista |
| 478 indicações sem paginação: 12.658 nós no DOM, 46.873 px (1440) e 108.597 px (375); a página inteira em 375 nem cabe num JPEG. Frágil: no Supabase hospedado, sem `max_rows` no `config.toml`, a consulta para em 1.000 linhas em silêncio (inferido) | alto | Catálogo "1.000+ itens"; wise-design-system §5 (`DataTable`) | `indicacoes-1440.jpg`, `detalhe/indicacoes-375-y0.jpg` | Paginação no servidor (`range`) com contagem exata, ou virtualização; dizer "Mostrando 50 de 478" |
| "478 indicação(ões)" (e "849 comissão(ões)" em Comissões) | médio | Catálogo "1 members" (plural); wise-design-system §8 | `detalhe/indicacoes-1440-y0.jpg` | `Intl.PluralRules` em `Indicacoes.tsx:197` e `Comissoes.tsx:180`, com milhar formatado |
| Parceiro truncado em 180 px e responsável em 140 px, sem `title` (810 truncados) | médio | Assinatura "texto truncado sem como ler" | `detalhe/indicacoes-1440-y0.jpg` | `title` e nome em 2 linhas |
| O marcador "SLA vencido: Validação e primeiro contato, Retorno ao parceiro" é uma pílula arredondada de 3 linhas dentro da célula do cliente; a linha vai a 108 px | médio | Assinatura "selo que quebra em duas linhas" | `detalhe/indicacoes-1440-y0.jpg` | Selo curto ("SLA vencido (2)") com a lista no `title` ou no detalhe |
| Filtro "Paradas há 15 dias" aqui e "Paradas há 30 dias" no painel para a mesma ideia | baixo | wise-design-system §8 (consistência de texto) | `detalhe/indicacoes-1440-y0.jpg` | Um parâmetro só |

### 3.7 Comissões `/app/comissoes`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Os quatro totais do topo em duas colunas quebram o número no meio em 375: "R$ 10.850.92" e "9,13", "R$ 686.094," e "46", "R$ 1.547.237," e "39". É a tela do financeiro | crítico | Catálogo, moeda grande; break-ui "nunca truncar números" | `detalhe/comissoes-375-y0.jpg` (375) | Mesmo ajuste do `Indicador` (`Blocos.tsx:99`); em 375 os totais em uma coluna ou em lista rótulo e valor |
| Aba Todas com 849 cartões de cerca de 340 px sem paginação: 248.653 px (1440), 394.997 px (375), 28.798 nós no DOM | alto | Catálogo "1.000+ itens"; wise-design-system §5 | `detalhe/comissoes-todas-1440-y0.jpg`, `detalhe/comissoes-todas-375-y0.jpg` | `DataTable` com paginação, agrupado por indicação (parceiro e responsável juntos) |
| O rótulo do valor da base vem do dado (`base_descricao`) e trunca sem `title`: "Valor total do contrato de licenciamento e implantação, pago em até 36…" (505 truncados em 375) | médio | Catálogo "rótulo vindo de dado" | `detalhe/comissoes-todas-375-y0.jpg` | Rótulo fixo "Base" e a descrição completa como texto abaixo, em `text-xs` |
| "A pagar" ordena só pelas mais antigas: a comissão de R$ 1.407.407,35 fica no fim de 9.583 px de lista | médio | wise-dashboards §3 (ação ordenada por urgência) e §5 (ordenação na URL) | `comissoes-375.jpg` | Ordenação escolhível (data ou valor) |
| O botão flutuante cobre "Mudar estado" do cartão em 375 | médio | Assinatura "ação no fim inalcançável" | `detalhe/comissoes-sete-digitos-375-alvo.jpg` | Ver Painel, botão flutuante |

### 3.8 Base Ativa `/app/base-ativa`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| O nome inquebrável (49 caracteres) estoura o cartão da fila e cria rolagem horizontal na página inteira em 375 (453 px) | alto | Catálogo, e-mails e URLs: string inquebrável; assinatura "texto vaza a caixa" | `detalhe/base-ativa-375-y0.jpg`, `base-ativa-375.jpg` (375) | `FilaItem.tsx:59`: `min-w-0` no bloco e `overflow-wrap:anywhere` no nome |
| Fila de 33 sem paginação (8.439 px em 375), cada item com campo de data e botão | médio | Catálogo "coleção grande" | `base-ativa-375.jpg` | Mostrar os 10 primeiros e "ver fila completa"; previsão editável no detalhe |
| Datas dos encontros e da previsão em `mm/dd/yyyy` (inferido: idioma do navegador) | baixo | wise-design-system §8 | `detalhe/base-ativa-ciclo-375-y0.jpg` | Ver Ficha |

### 3.9 Atividades `/app/atividades`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Na visão Por parceiro, em 375, o texto da direita ("105 atividades · 155 h 20 min · R$ 2.674,43") tem `shrink-0` e o nome fica com 1 a 5 letras: "S…" (Sem parceiro), "Venda…", "Fomen…", "Integra…". 175 nomes truncados sem `title` | crítico | Assinatura "conteúdo do meio tomou o espaço"; break-ui "embrulhar o que identifica" | `detalhe/atividades-375-y0.jpg` (375) | `Atividades.tsx:171-178`: nome numa linha, números na linha de baixo em telas estreitas (`flex-col sm:flex-row`) |
| Números sem separador de milhar: "1075" atividades e "1665 h 40 min" (as horas também nunca viram dias) | alto | Catálogo "1284 precisa de separador"; wise-design-system §3 e §8 | `detalhe/atividades-375-y0.jpg` | `Atividades.tsx:144` com `Intl.NumberFormat('pt-BR')`; `minutosParaHoras` (`src/lib/formato.ts:42`) com milhar |
| A visão Lista renderiza 1.075 cartões: 133.641 px e 9.858 nós em 375; o nome inquebrável dá rolagem horizontal (390 px) | alto | Catálogo "1.000+ itens"; string inquebrável | `detalhe/atividades-lista-375-y0.jpg` | Paginação de 50 e `overflow-wrap:anywhere` no nome do parceiro |

### 3.10 Portal do parceiro `/parceiro`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Saudação "Olá," sozinha quando o perfil não tem nome (o default do banco é `''`, caso real de quem entrou por convite) | alto | Catálogo, pessoas: "(missing) só o e-mail" e "espaços nas pontas" | `detalhe/portal-375-y0.jpg` (375) | `Inicio.tsx:94`: `nome.trim().split(/\s+/)[0]`; sem nome, "Olá" sem vírgula ou o nome da empresa |
| "1 pendentes" e "1 atrasadas" | alto | Catálogo "1 members"; wise-design-system §8 | `detalhe/portal-375-y1200.jpg` (375) | `Inicio.tsx:198` com plural por contagem ("1 pendente", "1 atrasada") |
| O contador de indicações usa `String(n)`: hoje "272", com 1.284 sairia "1284" | baixo (frágil) | Catálogo "1284" | `detalhe/portal-375-y1200.jpg` | `Inicio.tsx:199` com `Intl.NumberFormat` |
| O e-mail do responsável quebra no meio do domínio ("...cavalcanti@de" e "mo.wisemakers.local") | baixo | Assinatura "palavra quebrada no meio" | `detalhe/portal-375-y0.jpg` | `overflow-wrap:anywhere` em vez de `break-all`, ou truncar no meio com botão de copiar |
| O pacote aparece pela letra para o parceiro ("A · Base Ativa") | baixo | wise-design-system §2 (para parceiro, pelo nome, nunca pela letra) | `detalhe/portal-375-y0.jpg` | Nome do pacote sem a letra no portal |

### 3.11 Portal, indicações `/parceiro/indicacoes`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| 214 feitas e 58 recebidas, sem paginação, busca ou filtro: 29.209 px em 375 e 25.549 px em 1440 | alto | Catálogo "1.000+ itens"; wise-design-system §6 | `portal-indicacoes-375.jpg`, `portal-indicacoes-1440.jpg` | Busca por cliente, filtro por etapa e paginação de 20 |
| O selo de etapa muda de lugar: à direita com nome curto, embaixo do nome com nome longo (`flex-wrap`), e a coluna de status some no meio da lista | médio | Catálogo "dados parciais / larguras variáveis" | `detalhe/portal-indicacoes-375-y0.jpg` (375) | `Indicacoes.tsx:109` (portal): selo sempre na mesma posição (`flex-nowrap`, nome com `min-w-0 flex-1`) |

### 3.12 Página pública de RFP `/r/<token>`

| O que quebra | Gravidade | Regra violada | Captura | Correção proposta |
|---|---|---|---|---|
| Em 375, um único nome inquebrável define a largura mínima da grade da categoria: os 9 cartões do ERP ficam com 492 px numa tela de 375 e o contêiner `overflow-x-hidden` corta o lado direito de todos. Nomes, textos e o botão "Falar com este parceiro" ficam cortados para o cliente final | crítico | Catálogo, string inquebrável; assinatura "filho de grid com `min-width:auto`" | `detalhe/rfp-publica-375-y0.jpg`, `detalhe/rfp-publica-375-y1200.jpg` (375) | `ConteudoPaginaRfp.tsx:62`: `grid-cols-[minmax(0,1fr)]` e `sm:grid-cols-[repeat(2,minmax(0,1fr))]`; `:89` com `overflow-wrap:anywhere` no `h3` |
| Em 1440 o mesmo nome vaza a borda do cartão | alto | Mesma regra | `detalhe/rfp-publica-1440-y1400.jpg` (1440) | Mesma correção |
| 10 dos 14 parceiros aparecem como "Indisponível no momento" (sem contato comercial cadastrado, ou "Z", que nem assinou): o cliente vê uma grade de botões desativados sem explicação. O editor deixou publicar | médio | wise-design-system §6 (parcial sinalizado) | `detalhe/rfp-publica-1440-y1400.jpg` | No editor, avisar antes de publicar parceiro sem contato ou não assinado; na página, explicar ("fale com o consultor para este contato") |
| A pílula "Necessidade" é `rounded-full` e com 135 caracteres vira uma bolha de 4 linhas | médio | Assinatura "selo que quebra em várias linhas" | `detalhe/rfp-publica-375-y0.jpg` (375) | `ConteudoPaginaRfp.tsx:48`: raio de 10 px ou texto simples com rótulo |
| Título de 140 caracteres vira 9 linhas em 375 (`text-3xl`) | baixo | Catálogo "título longo" | `detalhe/rfp-publica-375-y0.jpg` | `text-2xl` no celular; o editor sugerir título de até 80 caracteres |

### 3.13 Frágil no esquema (vale para todas as telas)

| O que quebra | Gravidade | Regra violada | Correção proposta |
|---|---|---|---|
| Nenhum campo de texto tem limite no banco (`nome_fantasia`, `razao_social`, `perfis.nome`, `contatos.email`, `observacoes`, `comissoes.observacao`, blocos da RFP); os formulários internos também não têm `maxLength`. Uma importação ou a API pode gravar qualquer tamanho | médio (frágil) | break-ui regra 1 ("sem limite é um achado") | `check (char_length(...) <= n)` nas migrações (nome fantasia 80, razão social 150, nome de pessoa 120, e-mail 254) e `maxLength` igual nos formulários |
| `nome_fantasia` aceita espaços nas pontas e `perfis.nome` aceita `''` | médio (frágil) | Catálogo "espaços nas pontas", "(missing)" | `trim` e `check (btrim(nome) <> '')` nos gatilhos |

## 4. Decisões para o time

* **Nome do parceiro: quebrar ou truncar?** Recomendo quebrar em até 2 linhas em todas as listas e tabelas (é o que identifica), e truncar só razão social, categoria e detalhes, sempre com `title`.
* **Listas grandes: paginar ou virtualizar?** Recomendo paginação no servidor com contagem (50 por página) em Indicações, Comissões, Atividades e Parceiros: resolve o DOM, o limite de 1.000 linhas do PostgREST e deixa a barra de rolagem horizontal à vista. Virtualização só se a equipe quiser rolar sem páginas.
* **Valores grandes em cartões de duas colunas:** recomendo uma coluna abaixo de 400 px em vez de reduzir a fonte do número; valor nunca quebra.
* **Página de RFP com parceiro indisponível:** recomendo bloquear a publicação de parceiro não assinado e avisar sobre parceiro sem contato, em vez de esconder o cartão na página.
* **Ordenação:** ordenar no cliente com `localeCompare` pt-BR (rápido de fazer) ou mudar a collation das colunas de nome para ICU pt-BR (corrige também relatórios e exportações).

## 5. O que aguentou

* Valores de oito e nove dígitos em uma coluna: "R$ 140.790.392,19" no painel, "R$ 87.654.321,09" no cartão de indicação em 375, "R$ 1.407.407,35" no cartão de comissão. O cartão de comissão com razão social de 148 caracteres, endereço longo, observação de 330 caracteres e percentual "12,345%" se manteve legível em 375 e 1440 (`detalhe/comissoes-sete-digitos-375-alvo.jpg`).
* Cabeçalho da ficha com nome, razão social e responsável longos (`break-words`), cartões do celular da lista de parceiros e de indicações, e a página de RFP em 1440 com nomes longos com espaço.
* Zero aparece como "0" em tom secundário nos KPIs; "Nenhuma negociação parada." aparece como estado vazio.
* Plural correto em "1 parceiro · 1 assinado" (categorias), "1 resposta" (NPS) e "1 atividade" (Atividades).
* Escape: "&" e apóstrofo renderizam como texto. Diacríticos (ś, Ô, Á) sem corte.
* Nenhum travessão, nenhuma meia-risca e nenhum erro de REST nas capturas.

## 6. As 5 quebras mais graves

1. **Valores em reais partidos no meio do número** nos totais de Comissões e nos cartões de comissão do painel em 375 ("R$ 10.850.92" e "9,13"), e vazando o cartão na ficha. Quem lê pode registrar outro valor. Causa única: `break-words` em `Indicador` (`Blocos.tsx:99`) e falta de controle em `Numero` (`ui.tsx:58`).
2. **Página pública de RFP cortada em 375** por um nome sem espaço: todos os cartões da categoria e seus botões perdem o lado direito, na tela que o cliente final vê (`ConteudoPaginaRfp.tsx:62` e `:89`).
3. **Indicações em 1440 escondem o valor base e o responsável** atrás de uma rolagem horizontal cuja barra está 46 mil px abaixo; em 768 somem cinco colunas.
4. **Nomes reduzidos a 1 a 9 letras** quando os metadados não cedem: Atividades por parceiro ("S…", "Venda…") e Parceiros esfriando no painel ("Grupo Cam…", "Associação …"), sem `title`.
5. **Nenhuma lista tem paginação**: Comissões chega a 394.997 px e 28.798 nós, Atividades a 133.641 px, Indicações a 108.597 px, o funil a 34.147 px e a lista de parceiros a 29.079 px com 200 parceiros, e no Supabase hospedado as listas acima de 1.000 linhas seriam cortadas sem aviso.
