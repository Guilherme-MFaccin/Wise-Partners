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
