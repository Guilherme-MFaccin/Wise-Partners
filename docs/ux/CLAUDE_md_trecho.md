# Trecho para colar no CLAUDE.md da raiz do repositório

Copie o bloco abaixo para o `CLAUDE.md` (crie o arquivo se não existir). Ele vale para todas as sessões do Claude Code neste repositório.

```markdown
## Interface e experiência

- Identidade e regras visuais: skill `wise-design-system`. Painéis, gráficos e camada de dados: skill `wise-dashboards`. As duas prevalecem sobre qualquer sugestão de estilo, paleta ou fonte de outras skills de design (Impeccable, UI/UX Pro Max, Emil, shadcn).
- UI/UX Pro Max serve só para consulta de tipo de gráfico e checklist de UX. Não aplicar estilos, paletas nem fontes dela.
- Antes de criar componente, procurar em `src/components/kit/`, no shadcn e na vitrine `/app/vitrine`. Componente novo vai para o kit e para a vitrine.
- Toda tela começa com `PageHeader` e responde a uma pergunta escrita no subtítulo.
- Toda tela e componente de dados tem os estados: carregando, vazio, erro, parcial, sem permissão.
- Gráficos só com shadcn chart (Recharts) e tokens `--chart-*`. Componente não agrega dados: o banco entrega séries prontas.
- Antes de dizer que terminou uma tela: capturas em 375, 768 e 1440 px com o seed de demonstração, crítica e auditoria do Impeccable sem itens críticos ou altos, nenhum texto com travessão.
- Nunca usar travessão nem meia-risca em textos, dados de exemplo ou mensagens.
- Dados de demonstração só por `supabase/seed_demo.sql`, nunca em migração e nunca no projeto de produção.
```
