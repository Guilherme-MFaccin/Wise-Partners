# Portal Wise Partners

Especificações em `specs/`, princípios em `.specify/memory/constitution.md`, plano de UX em `docs/ux/PLANO_UX.md`.

## Interface e experiência

- **Regra número 1 de design: skill `apple-design`.** Ela manda na forma de todo o portal: layout, hierarquia, tipografia (fonte do sistema, espaçamento e entrelinha por tamanho), espaçamento, materiais translúcidos, movimento (resposta ao toque, interrupção, molas), modo claro e escuro e acessibilidade (menos movimento, menos transparência, mais contraste).
- A marca vem da skill `wise-design-system`: logo, verde menta como destaque e tom de voz. Painéis, gráficos e camada de dados: skill `wise-dashboards`. As três valem acima de qualquer sugestão de estilo de outras skills de design (Impeccable, UI/UX Pro Max, Emil, shadcn), que entram como método, crítica e técnica.
- Cores só por tokens (`src/index.css`): os mesmos papéis no claro (`:root`) e no escuro (`.dark`). As áreas logadas seguem a escolha da pessoa (Minha conta, Aparência) ou o sistema; as páginas públicas ficam no escuro (`src/lib/tema.ts`). Para branco literal sobre foto ou cor sólida, use `puro`, não `white` (que acompanha o tema).
- UI/UX Pro Max serve só para consulta de tipo de gráfico e checklist de UX. Não aplicar estilos, paletas nem fontes dela.
- Antes de criar componente, procurar em `src/components/kit/`, no shadcn e na vitrine `/app/vitrine`. Componente novo vai para o kit e para a vitrine.
- Toda tela começa com `PageHeader` e responde a uma pergunta escrita no subtítulo.
- Toda tela e componente de dados tem os estados: carregando, vazio, erro, parcial, sem permissão.
- Gráficos só com shadcn chart (Recharts) e tokens `--chart-*`. Componente não agrega dados: o banco entrega séries prontas.
- Antes de dizer que terminou uma tela: capturas em 375, 768 e 1440 px com o seed de demonstração, crítica e auditoria do Impeccable sem itens críticos ou altos, nenhum texto com travessão.
- Nunca usar travessão nem meia-risca em textos, dados de exemplo ou mensagens.
- Dados de demonstração só por `supabase/seed_demo.sql`, nunca em migração e nunca no projeto de produção. Única exceção, pedida pelo patrocinador em 26/11/2026: as dez contas do Ver como criadas por `scripts/contas-demonstracao/`, com a marca `demonstracao` (fora dos números, das listas, das rotinas e dos e-mails do time real). Nada além delas.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
