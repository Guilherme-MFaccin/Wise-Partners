# Plano de UX/UI do Portal Wise Partners

Como levar o portal de "funcional e genérico" para o nível dos melhores softwares de gestão, com as skills certas, na ordem certa e com os prompts prontos para o Claude Code.

## 1. Diagnóstico da versão atual

Lido no código da v1 (`src/pages/app/Painel.tsx`, `src/components/painel/Blocos.tsx`, `src/components/layout/AppLayout.tsx`, `package.json`):

| Sintoma | Causa no código | Efeito |
|---|---|---|
| Widgets iguais | Um único componente `Bloco` (card com número e lista) usado para tudo, em grade de 3 colunas | O olho não sabe por onde começar; pendência e indicador têm o mesmo peso |
| Nenhum gráfico | Não há biblioteca de gráficos no projeto; o único elemento visual é uma barra de progresso | Tendência, conversão e composição não aparecem |
| Número sem contexto | `Indicador` mostra valor e rótulo, sem comparação nem meta | Não dá para saber se 12 é bom ou ruim |
| Navegação plana | 11 itens na barra lateral na ordem das tabelas | A rotina (hoje, parceiros, mercado, resultado) não aparece |
| Estilo solto | Classes como `rounded-[14px] border-white/10` repetidas nos componentes, sem camada de tokens semânticos | Cada tela fica um pouco diferente e a evolução é cara |
| Agregação na tela | O painel recebe um JSON grande e o componente monta listas | Difícil de testar, de reaproveitar e de transformar em gráfico |

O que já está bom e deve ser mantido: tokens de cor da marca no Tailwind, fontes certas (Plus Jakarta Sans e Baloo 2), shadcn/ui, TanStack Query, `cmdk` instalado, regras de acesso no banco.

## 2. Skills e ferramentas escolhidas

Pesquisa feita em 24/10/2026 nos repositórios e listas mais citados. Estrelas conferidas na página de cada repositório nessa data.

### Instalar (núcleo)

| # | Skill ou ferramenta | Repositório | Para que serve aqui |
|---|---|---|---|
| 1 | **Impeccable** | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (85,5 mil estrelas) | Espinha dorsal de design. Versão ampliada da skill `frontend-design` da Anthropic, com comandos de método: `init`, `document`, `shape`, `critique`, `audit`, `layout`, `typeset`, `colorize`, `harden`, `onboard`, `clarify`, `polish`, `distill`, `animate`, `extract`, `live` |
| 2 | **Skills do projeto** | Neste kit: `.claude/skills/wise-design-system` e `.claude/skills/wise-dashboards` | O que nenhuma skill pública sabe: a marca Wise, os tokens, o mapa de telas, o gráfico certo para cada indicador do spec 002 e a regra de dados prontos no banco |
| 3 | **shadcn/ui (oficial)** | [ui.shadcn.com/docs/skills](https://ui.shadcn.com/docs/skills) | O portal é shadcn. A skill lê o `components.json`, usa a CLI, segue os padrões e traz os gráficos (shadcn chart, Recharts) |
| 4 | **Vercel agent-skills** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (32,9 mil) | `web-design-guidelines` (mais de 100 regras de interface, acessibilidade e UX), `react-best-practices` (desempenho) e `composition-patterns` (arquitetura de componentes sem excesso de props) |
| 5 | **Emil Kowalski skills** | [emilkowalski/skills](https://github.com/emilkowalski/skills) (49,3 mil) | Movimento e acabamento: `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `animation-performance`; mais `break-ui` (testa com dados extremos) e `mobile-native` (parceiros usam o celular) |
| 6 | **Web Quality Skills** | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) (3 mil) | Auditoria de acessibilidade (WCAG 2.2), desempenho e Core Web Vitals |
| 7 | **Playwright MCP** | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) (38 mil) | O Claude abre o portal, navega e tira capturas em 3 larguras. Sem isso, ele desenha às cegas |
| 8 | **Chrome DevTools MCP** | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) (52,9 mil) | Console, rede, desempenho e contraste durante as correções |
| 9 | **Context7** | [upstash/context7](https://github.com/upstash/context7) | Documentação atual de Recharts, shadcn, TanStack Table e Query, para não usar API antiga |

### Consulta pontual

| Skill | Repositório | Como usar |
|---|---|---|
| **UI/UX Pro Max** | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (139,7 mil) | Tem 25 tipos de gráfico e 119 regras de UX. Use só para conferir escolha de gráfico e checklist. Ela também sugere estilos e paletas prontas; o `CLAUDE.md` deste kit proíbe aplicá-los, porque a identidade é da Wise |

### Não instalar agora

| Skill | Motivo |
|---|---|
| `frontend-design` oficial da Anthropic | O Impeccable já inclui uma versão ampliada dela, com o mesmo nome; as duas juntas duplicam instruções |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Ótima para sites e landing pages, mas impõe direção de arte própria e brigaria com a marca Wise |
| [obra/superpowers](https://github.com/obra/superpowers) | Excelente processo de desenvolvimento, mas o projeto já usa o Spec Kit; os dois disputariam o fluxo |
| Skills de dashboard pequenas ([dashboard-design-skill](https://github.com/abdiraimov-otabek/dashboard-design-skill), [dataviz-skill](https://github.com/indi256s/dataviz-skill)) | Pouco uso (10 e 1 estrela), Tailwind 4 ou ECharts, e uma delas acrescenta propaganda do autor; a skill `wise-dashboards` cobre melhor o caso |

### Cuidados

* Skills e plugins rodam com as suas permissões. Leia o `SKILL.md` e os scripts antes de instalar, principalmente os que executam código (UI/UX Pro Max usa Python; Impeccable tem CLI).
* Cada servidor MCP ativo consome contexto no início da sessão. Deixe ativos só Playwright e Context7 no dia a dia; ligue o Chrome DevTools nas fases de auditoria.
* O Lovable não lê `.claude/skills`. A seção 6 explica como levar as regras para lá.
* Os MCPs de navegador precisam de um navegador disponível: prefira o Claude Code no aplicativo de computador ou no terminal para as fases com capturas de tela.

## 3. Instalação (uma vez, na raiz do repositório)

Abra o Claude Code no repositório do portal e rode, na ordem:

```text
# 1. Impeccable (plugin)
/plugin marketplace add pbakaus/impeccable
/plugin            → instalar "impeccable" na lista

# 2. Web Quality Skills (plugin)
/plugin marketplace add addyosmani/web-quality-skills
/plugin install web-quality-skills@addy-web-quality-skills

# 3. UI/UX Pro Max (plugin, só consulta)
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

No terminal, na raiz do repositório:

```bash
npx skills add shadcn/ui
npx skills add vercel-labs/agent-skills        # escolher: web-design-guidelines, react-best-practices, composition-patterns
npx skills@latest add emilkowalski/skills      # escolher: emil-design-eng, find-animation-opportunities, improve-animations,
                                               # review-animations, animation-performance, break-ui, mobile-native
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

Depois:

1. Descompacte este kit na raiz (cria `.claude/skills/wise-*` e `docs/ux/`).
2. Cole o trecho de `docs/ux/CLAUDE_md_trecho.md` no `CLAUDE.md`.
3. Feche e abra o Claude Code e confira com `/skills` e `/mcp` se tudo aparece.

Os comandos de instalação podem mudar; se algum falhar, siga o README do repositório correspondente.

## 4. Ordem de trabalho

A feature 002 (spec 2.0) ainda não foi implementada e cria 15 telas novas, inclusive o painel. Por isso a ordem é: **fundação primeiro, 002 em cima da fundação, depois o resto da v1 e o acabamento**. Assim nenhuma tela nova nasce no padrão genérico.

| Fase | O que sai | Portão de revisão |
|---|---|---|
| 0. Preparação | Branch, seed de demonstração, contexto do produto | Seed carregado e telas com dados |
| 1. Diagnóstico | `PRODUCT.md`, `DESIGN.md`, `docs/ux/diagnostico.md` com capturas | Você lê e prioriza |
| 2. Arquitetura de informação | `docs/ux/arquitetura.md` e esboços das telas principais | Você aprova antes de qualquer código |
| 3. Fundação técnica | Tokens, kit de componentes, gráficos, tabela, vitrine, camada de dados | Vitrine aprovada |
| 4. Feature 002 com o kit | As 15 histórias da 002 implementadas no padrão novo | Cada tela passa no ciclo da seção 5 |
| 5. Telas restantes da v1 | Ficha, parceiros, indicações, comissões, Base Ativa, atividades, portal do parceiro, páginas públicas | Cada tela passa no ciclo |
| 6. Movimento | Transições e microinterações discretas | Revisão de animações sem itens altos |
| 7. Robustez e qualidade | Dados extremos, celular, acessibilidade, desempenho | Auditorias sem itens críticos |
| 8. Polimento e regressão visual | Passada final e capturas de referência nos testes | Checklist da seção 7 |
| 9. Lovable | Regras de design no conhecimento do projeto | Edição de teste no Lovable respeita a marca |

## 5. Prompts para o Claude Code

Mande um prompt por vez, na ordem. Cada um termina com algo para você revisar. Não pule os portões.

### Fase 0. Preparação

**Prompt 0.1, seed de demonstração**

```text
Crie uma branch ux-fundacao. Depois crie supabase/seed_demo.sql com dados fictícios realistas para avaliar o visual: 40 parceiros em todas as etapas, níveis e categorias (nomes de empresas brasileiras inventados, alguns bem longos), 3 usuários internos, 6 usuários de parceiros, 180 pontos de contato nos últimos 9 meses, 90 indicações nas três empresas do grupo em todas as etapas, comissões em todos os estados, 2 ciclos do Base Ativa e 1 pedido de RFP publicado. Respeite todas as regras e gatilhos do banco (use as funções, como registrar_indicacao, em vez de inserir direto onde houver regra). Nenhum texto com travessão. Esse arquivo nunca entra em migração nem no projeto de produção: documente isso no topo do arquivo e no README. Rode no banco local, confirme que as telas mostram os dados e me diga quantos registros foram criados por tabela.
```

### Fase 1. Diagnóstico (sem mudar código)

**Prompt 1.1, contexto e design atual**

```text
Leia as skills wise-design-system e wise-dashboards e o arquivo docs/ux/PRODUCT_rascunho.md.
1. Rode /impeccable init usando o rascunho como resposta às perguntas e gere o PRODUCT.md.
2. Rode /impeccable document para gerar o DESIGN.md a partir do código atual. Onde o código divergir da skill wise-design-system, registre a divergência numa seção "Diferenças a corrigir" e mantenha a skill como regra.
Não altere nenhum arquivo de src/. Me mostre o resumo dos dois arquivos.
```

**Prompt 1.2, auditoria com capturas**

```text
Com o seed de demonstração carregado e o app rodando, use o Playwright para capturar estas telas em 375, 768 e 1440 px: painel, parceiros (categorias, funil e lista), ficha de um parceiro Elite assinado, indicações, comissões, Base Ativa, atividades, configurações, portal do parceiro (início e indicações) e a página pública de RFP. Salve em docs/ux/capturas/antes/.
Para cada tela, rode /impeccable critique e /impeccable audit, aplique a skill web-design-guidelines e use a skill break-ui para listar o que quebra com dados extremos.
Escreva docs/ux/diagnostico.md com: problemas por tela, gravidade (crítico, alto, médio, baixo), a regra violada (skill e item) e a captura de referência. Termine com os 10 problemas mais importantes do portal inteiro. Não altere código.
```

Portão: leia o `diagnostico.md` e marque o que discorda.

### Fase 2. Arquitetura de informação

**Prompt 2.1**

```text
Leia docs/ux/diagnostico.md, a skill wise-dashboards (inclusive referencias/mapa-de-telas.md e graficos.md), o spec specs/002-evolucao-metodo-octo/spec.md (histórias e Apêndice L) e as rotas em src/App.tsx.
Escreva docs/ux/arquitetura.md com:
1. A navegação final por grupos e por papel, conferindo com a matriz de permissões do briefing técnico da 002.
2. Para cada tela (v1 e 002): a pergunta que responde, o público, as cinco camadas (herói, apoio, explicação, ação, detalhe), os gráficos escolhidos e a função SQL ou hook que alimenta cada bloco, dizendo se já existe ou precisa ser criada.
3. Os fluxos principais em passos: registrar contato pelo celular, preparar a reunião semanal, montar uma página de RFP, parceiro indicando um cliente, parceiro vendo o que falta para subir de nível.
4. Esboços em texto (blocos e proporções da grade de 12 colunas) do painel, da ficha do parceiro, do resultado do canal e do início do portal do parceiro.
Onde discordar do mapa de telas da skill, explique e proponha. Não altere código.
```

Portão: aprove ou ajuste a arquitetura. Ela vira a referência das fases seguintes.

### Fase 3. Fundação técnica

**Prompt 3.1, tokens e tipografia**

```text
Implemente a camada de tokens da skill wise-design-system (referencias/tokens.md) em src/index.css e tailwind.config.ts, mantendo os nomes do shadcn apontando para os tokens novos. Crie utilitários para superfícies, texto, estados, gráficos e níveis. Ajuste a escala tipográfica e tabular-nums. Confira o contraste de todos os pares de texto e fundo com o Chrome DevTools e ajuste tons onde não passar AA, registrando no DESIGN.md. Troque as classes soltas (rounded-[14px], border-white/10, text-red-300 e similares) pelos tokens em todo src/, sem mudar layout ainda. Rode build, lint e testes. Mostre o diff resumido e capturas de 3 telas para eu ver que nada quebrou.
```

**Prompt 3.2, kit de componentes e vitrine**

```text
Usando as skills shadcn, wise-design-system, wise-dashboards e composition-patterns, crie src/components/kit/ com: PageHeader, HeroMetric, KpiTile (valor, delta com cor semântica, meta, minigráfico, link), ChartCard (título de leitura, legenda, "ver dados", estados), BarList, FunnelBars (barras decrescentes com taxa entre etapas), BulletChart (meta), Heatmap de calendário, Radar (8 eixos), DataTable (TanStack Table com ordenação, filtro, colunas fixas, densidade, exportação, linha clicável), FilterBar com estado na URL, StatusBadge, NivelBadge, EmptyState, Skeletons por formato, Timeline e Stepper.
Adicione o shadcn chart (npx shadcn add chart) e o @tanstack/react-table. Gráficos carregados com React.lazy.
Crie a rota /app/vitrine, visível só para administradores e só fora de produção, mostrando cada componente em todos os estados (carregando, vazio, erro, normal, extremo) com dados fictícios.
Escreva testes Vitest para formatação e para os estados. Use Context7 para conferir a API atual de Recharts e TanStack Table. Capture a vitrine em 375 e 1440 px.
```

Portão: a vitrine é o seu "design system vivo". Aprove antes de seguir.

**Prompt 3.3, camada de dados**

```text
Organize a camada de dados das telas conforme a seção 6 da skill wise-dashboards:
1. src/lib/chaves.ts com as chaves do TanStack Query por domínio.
2. Esquemas zod para as respostas das funções do banco usadas pelas telas; erro de formato vira estado de erro.
3. Hooks por tela ou indicador (usePainel, useIndicador, useFichaParceiro etc.) em src/hooks/dados/.
4. Formatação só por src/lib/formato.ts (moeda, percentual, número abreviado, datas), com testes.
5. Liste no docs/ux/arquitetura.md as funções SQL que precisam devolver séries prontas para gráfico e que ainda não existem; não crie migração agora, isso entra no plano da 002.
Rode build e testes.
```

**Prompt 3.4, navegação e paleta de comandos**

```text
Refaça o AppLayout conforme a navegação aprovada em docs/ux/arquitetura.md: grupos na barra lateral, item ativo, recolher no desktop, menu no celular, cabeçalho com busca e notificações. Implemente a paleta de comandos com cmdk (Ctrl ou Cmd mais K): buscar parceiros, indicações e pedidos de RFP, e ações rápidas (registrar contato, nova indicação, novo pedido de RFP). Navegação inteira por teclado. Capture em 375 e 1440 px.
```

### Fase 4. Feature 002 com o kit

**Prompt 4.1, antes do plano**

```text
Vamos implementar a feature specs/002-evolucao-metodo-octo. Antes de rodar /speckit.plan, acrescente ao briefing técnico da 002 uma seção "Interface" que diga: toda tela segue docs/ux/arquitetura.md e as skills wise-design-system e wise-dashboards; usa só componentes do kit; cada função SQL de indicador devolve séries prontas para gráfico; cada tarefa de tela no tasks.md termina com o ciclo de verificação de docs/ux/PLANO_UX.md (seção 5, "Ciclo por tela"). Depois rode /speckit.plan.
```

Depois siga o Spec Kit normalmente: `/speckit.tasks`, `/speckit.analyze`, `/speckit.implement`, revisando cada saída. Em cada tela pronta, rode o ciclo abaixo.

### Ciclo por tela (usar nas fases 4 e 5)

**Prompt modelo, troque [TELA]**

```text
Refaça a tela [TELA] seguindo docs/ux/arquitetura.md e as skills wise-design-system e wise-dashboards.
1. Capture o antes em 375, 768 e 1440 px (docs/ux/capturas/antes/).
2. Escreva em 5 linhas o layout que vai implementar (pergunta, herói, apoio, explicação, ação, detalhe) e siga.
3. Implemente só com componentes do kit; se faltar componente, crie no kit e na vitrine.
4. Capture o depois nas três larguras, com o seed normal, vazio e extremo.
5. Rode /impeccable critique e /impeccable audit na tela e corrija tudo que for crítico ou alto.
6. Confira cada número da tela com a consulta SQL equivalente.
7. Me mostre antes e depois lado a lado e a lista do que ficou como médio ou baixo.
```

### Fase 5. Telas restantes da v1

Use o prompt modelo nesta ordem: ficha do parceiro; parceiros (categorias, funil e lista); indicações; comissões; Base Ativa; atividades e horas; pendências; portal do parceiro (início, indicações, materiais, ficha); página pública de RFP; configurações e usuários.

Para as páginas públicas, acrescente ao prompt:

```text
Esta é uma página pública e vitrine da marca. Use Baloo 2 no título, a textura escura da marca só no topo, uma coluna, botões grandes e carregamento rápido (meta: LCP abaixo de 2 segundos em 4G). Rode a skill mobile-native e a auditoria de desempenho do web-quality-skills.
```

### Fase 6. Movimento

**Prompt 6.1**

```text
Rode a skill find-animation-opportunities no portal inteiro e proponha no máximo 12 animações que ajudem a entender mudança de estado (abrir painel lateral, filtrar, salvar, subir de nível, concluir trilha). Siga a seção 7 da skill wise-design-system (120 a 200 ms, ease-out, sem loop, prefers-reduced-motion). Depois de eu aprovar a lista, implemente com /impeccable animate e rode review-animations e animation-performance, corrigindo os itens altos.
```

### Fase 7. Robustez e qualidade

**Prompt 7.1**

```text
Rode, tela por tela: /impeccable harden (textos longos, erros, estados de borda), a skill break-ui com dados extremos, a skill mobile-native nas telas do portal do parceiro e nas páginas públicas, e /impeccable adapt para celular. Depois rode as skills accessibility e performance do web-quality-skills e a react-best-practices no código das telas. Corrija críticos e altos e registre o restante em docs/ux/pendencias.md.
```

**Prompt 7.2, textos**

```text
Rode /impeccable clarify em todos os textos de interface (títulos, botões, mensagens de erro, estados vazios, e-mails). Siga a voz da skill wise-design-system. Procure e remova qualquer travessão ou meia-risca no repositório inteiro, inclusive em seeds e textos de e-mail.
```

### Fase 8. Polimento e regressão visual

**Prompt 8.1**

```text
Rode /impeccable polish em cada tela, na ordem do menu. Depois crie testes de regressão visual com Playwright (toHaveScreenshot) para a vitrine e para as 10 telas principais em 375 e 1440 px, com o seed de demonstração, e documente no README como atualizar as capturas de referência. Termine com o checklist da seção 7 do PLANO_UX.md preenchido, item por item, com evidência.
```

### Fase 9. Lovable

**Prompt 9.1**

```text
Gere docs/ux/conhecimento-lovable.md com as regras essenciais das skills wise-design-system e wise-dashboards em até 2.500 caracteres, para colar no conhecimento do projeto no Lovable: tokens, componentes do kit, regra de uma pergunta por tela, estados, gráficos só com shadcn chart, sem travessão.
```

Cole o resultado em Lovable, nas configurações do projeto (conhecimento do projeto), e faça uma edição de teste para conferir que ele respeita o kit.

## 6. Como manter

* Toda tela nova passa pelo ciclo por tela.
* Componente novo entra no kit e na vitrine no mesmo commit.
* A cada trimestre, rodar de novo o prompt 1.2 e comparar com o diagnóstico anterior.
* Atualizar as capturas de referência só quando a mudança visual for intencional.

## 7. Checklist do "digno dos melhores"

| Critério | Como medir |
|---|---|
| Cada tela responde a uma pergunta | Pergunta no subtítulo de todas as telas |
| Leitura em 5 segundos | Alguém que não conhece o portal diz o principal de cada tela em 5 segundos |
| Número sempre com contexto | Nenhum KPI sem comparação ou meta, exceto contagens de pendência |
| Gráficos que explicam | Todo gráfico tem título de leitura e "ver dados" |
| Consistência | Nenhuma cor, fonte ou espaço fora dos tokens (busca no código) |
| Estados | As 5 situações em todas as telas de dados |
| Velocidade | Navegação entre telas internas abaixo de 1 segundo com o seed; LCP das páginas públicas abaixo de 2 segundos em 4G |
| Celular | Registro de contato em menos de 1 minuto no celular; portal do parceiro sem rolagem horizontal |
| Teclado | Fluxos principais completos só com teclado; paleta de comandos funcionando |
| Acessibilidade | Auditoria WCAG 2.2 AA sem itens críticos ou altos |
| Texto | Nenhum travessão; voz da skill em todos os textos |
| Regressão | Testes visuais passando no CI |

## Fontes

* [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
* [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
* [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
* [emilkowalski/skills](https://github.com/emilkowalski/skills)
* [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills)
* [shadcn/ui, skills](https://ui.shadcn.com/docs/skills.md)
* [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
* [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
* [anthropics/skills](https://github.com/anthropics/skills)
* [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
* [obra/superpowers](https://github.com/obra/superpowers)
* [wilwaldon/Claude-Code-Frontend-Design-Toolkit](https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit)
* [Best Claude Code Skills (2026), DesignRevision](https://designrevision.com/blog/best-claude-code-skills)
* [NTCoding/claude-skillz, data-visualization](https://github.com/NTCoding/claude-skillz/blob/main/data-visualization/SKILL.md)
