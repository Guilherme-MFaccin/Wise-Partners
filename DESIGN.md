---
name: Portal Wise Partners
description: Ferramenta de gestão do programa de parcerias da Wise Makers, em fundo escuro com o menta como sinal.
colors:
  menta-sinal: "#00e193"
  menta-claro: "#4defa9"
  menta-texto: "#12e893"
  menta-profundo: "#0a6b48"
  fundo-app: "#101012"
  superficie-card: "#1c1c20"
  superficie-campo: "#303036"
  texto-principal: "#ffffff"
  texto-secundario: "#adadb3"
  texto-desabilitado: "#61616a"
  alerta-ambar: "#f5a623"
  perigo-vermelho: "#f0473a"
  nivel-elite-fundo: "#111827"
  nivel-elite-ouro: "#d97706"
  nivel-premium-fundo: "#1e3a8a"
  nivel-select-fundo: "#365314"
typography:
  display:
    fontFamily: "Baloo 2, Plus Jakarta Sans, sans-serif"
    fontWeight: 800
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  pilula: "9999px"
  card: "14px"
  campo: "10px"
  interno: "8px"
spacing:
  card-padding: "16px"
  card-padding-lg: "20px"
  secao: "24px"
components:
  button-primary:
    backgroundColor: "{colors.menta-sinal}"
    textColor: "{colors.fundo-app}"
    rounded: "{rounded.pilula}"
    height: "40px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.fundo-app}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.pilula}"
    height: "40px"
  card:
    backgroundColor: "{colors.superficie-card}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  input:
    backgroundColor: "{colors.fundo-app}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.campo}"
    height: "40px"
  pilula-menta:
    textColor: "{colors.menta-claro}"
    rounded: "{rounded.pilula}"
  nav-item-ativo:
    textColor: "{colors.menta-claro}"
    rounded: "{rounded.interno}"
---

# Design System: Portal Wise Partners

Este arquivo registra o sistema visual **como está no código hoje** (`src/index.css`, `tailwind.config.ts`, `src/components/ui`, `src/components/comum`). A regra da marca é a skill `wise-design-system` (`.claude/skills/wise-design-system/`, com `referencias/tokens.md`). Onde o código diverge da skill, a divergência está na seção final "Diferenças a corrigir" e **a skill prevalece**.

## Overview

**Creative North Star: "Sinal sobre silêncio"**

Uma ferramenta de trabalho escura, calma e precisa, na linha de Linear, Stripe Dashboard e Attio, com a assinatura da Wise Makers: fundo quase preto, texto branco e o verde menta reservado para o que pede atenção. O silêncio são as superfícies neutras e as bordas finas; o sinal é o menta no botão principal, no item ativo e no número que importa.

Hoje a interface é densa em texto e organizada em cards de mesmo peso: a hierarquia vem mais da ordem dos blocos do que de tamanho, cor ou gráfico. O menta já é usado como acento, mas aparece em muitos lugares (títulos de seção, links, pílulas, barras), o que dilui o sinal.

**Key Characteristics:**
- Tema escuro único, sem modo claro.
- Profundidade por superfície e borda branca translúcida, quase sem sombra.
- Plus Jakarta Sans em toda a interface; Baloo 2 só no logotipo e em títulos públicos.
- Pílulas arredondadas para estados, níveis e botões.
- Sem gráficos: números em cards e barras de progresso simples.

## Colors

Neutros quase pretos com um único acento verde menta e duas cores de estado.

### Primary
- **Menta sinal** (#00e193): botão principal, item ativo da navegação, foco, barras de progresso. Variáveis `--primary` e `--ring`.
- **Menta claro** (#4defa9) e **menta texto** (#12e893): texto em pílulas e links sobre fundo escuro (`text-menta-300` e `text-menta-400`).
- **Menta profundo** (#0a6b48): fundos suaves de destaque (menta a 10 a 15% de opacidade na prática).

### Neutral
- **Fundo do app** (#101012): `--background`.
- **Superfície de card** (#1c1c20): `--card` e `--popover`.
- **Superfície de campo e secundária** (#303036): `--secondary` e `--accent`.
- **Texto principal** (#ffffff) e **texto secundário** (#adadb3): `--foreground` e `--muted-foreground`.
- **Bordas**: branco a 12% (`--border`) e 16% (`--input`); no código também `border-white/10` e `bg-white/5` soltos.

### Named Rules
**A Regra do Sinal.** O menta marca o que pede ação ou bateu a meta; se mais de 10% da área visível está menta, há excesso.

**A Regra da Cor com Significado.** Âmbar (#f5a623) é alerta, vermelho (#f0473a) é perigo. Nenhuma das duas serve para "negativo" neutro.

## Typography

**Display Font:** Baloo 2 (com Plus Jakarta Sans de reserva)
**Body Font:** Plus Jakarta Sans (com system-ui)

**Character:** Plus Jakarta Sans dá o tom de software sério e legível; Baloo 2, arredondada e pesada, é a voz da marca e aparece pouco.

### Hierarchy
- **Display** (800, Baloo 2): logotipo e títulos de páginas públicas. No código, `font-display` aparece uma única vez.
- **Headline** (700, 24 a 30 px, `text-2xl sm:text-3xl`): título de página no `Cabecalho`.
- **Title** (600, 16 a 18 px): títulos de seção e de card.
- **Body** (400, 14 px): texto corrido, células e descrições.
- **Label** (600, 12 px; às vezes 10 e 11 px): pílulas, rótulos de campo e metadados.

## Layout

Barra lateral fixa de 240 px no computador e menu em gaveta no celular; conteúdo com respiro de 24 a 32 px. As páginas empilham `Cabecalho` (título, descrição, ações) e seções em cards, em grades de 1 a 3 colunas (`md:grid-cols-2`, `xl:grid-cols-3`). Tabelas usam o `Table` do shadcn com rolagem horizontal; no celular, várias listas viram cards. Abas (`Tabs`) organizam telas longas, como a ficha do parceiro e as configurações.

## Elevation & Depth

Sistema plano: a profundidade vem do contraste entre fundo (#101012) e card (#1c1c20) e da borda branca translúcida. O `Card` do shadcn ainda carrega `shadow-sm`, e há 14 usos de sombra soltos (popovers, diálogos, alguns cards).

### Named Rules
**A Regra Plana.** Camadas se separam por superfície e borda, não por sombra; sombra só em camadas flutuantes.

## Shapes

Cantos generosos: 14 px em cards e diálogos (`--radius`), 10 px em campos, 8 px em itens internos e da navegação, e pílula completa em botões, selos e estados. Na prática os raios aparecem como valores soltos (`rounded-[14px]`, `rounded-[10px]`, `rounded-[8px]`) em mais de 300 lugares.

## Components

### Buttons
- **Shape:** pílula completa (9999 px), altura de 40 px (36 px no tamanho pequeno).
- **Primary:** fundo menta (#00e193) com texto quase preto, 600.
- **Hover / Focus:** menta a 90%; foco com anel menta.
- **Outline / Ghost:** borda branca a 16% sobre o fundo; ghost sem borda, com fundo #303036 no hover.

### Chips
- **Style:** `Pilula` com fundo do tom a 15% e texto claro do tom: neutro, menta, alerta, perigo (`text-red-300`) e informação (`sky-300`).
- **Níveis:** `SeloNivel` com Elite em fundo #111827 e texto e contorno ouro (#d97706), Premium em #1e3a8a e Select em #365314, ambos com texto branco.

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** #1c1c20 (`bg-card`), às vezes `bg-white/5` para blocos internos.
- **Shadow Strategy:** plana; ver Elevation & Depth.
- **Border:** branco a 10 ou 12%.
- **Internal Padding:** 16 a 20 px (`p-4 sm:p-5`).

### Inputs / Fields
- **Style:** fundo do app, borda branca a 16%, 10 px de raio, 40 px de altura.
- **Focus:** anel menta de 2 px.

### Navigation
- **Style:** lista vertical de 20 itens na barra lateral, 14 px, 500; item ativo com fundo menta a 10% e texto menta; ícones Lucide de 16 px. No celular, a mesma lista numa gaveta.

### Indicador e Bloco (painel)
- Card com rótulo, número grande e uma linha de detalhe; usado igual para indicadores, pendências e listas.

## Do's and Don'ts

### Do:
- **Do** usar o menta só como sinal (botão principal, item ativo, valor que bateu a meta).
- **Do** separar camadas por superfície e borda branca translúcida.
- **Do** mostrar nível pelo nome para parceiros e clientes.
- **Do** escrever sem travessão nem meia-risca.

### Don't:
- **Don't** criar valores soltos de raio, cor ou tamanho de fonte: usar os tokens.
- **Don't** usar vermelho para variação negativa neutra.
- **Don't** usar Baloo 2 em tabelas, botões ou rótulos.

## Diferenças a corrigir

Divergências entre o código atual e a skill `wise-design-system`. **A skill é a regra**; estes itens entram na fase 3 do plano (fundação técnica).

| # | Tema | Código hoje | Regra da skill | Onde |
|---|---|---|---|---|
| 1 | Superfícies | 2 níveis (fundo #101012 e card #1c1c20) mais `bg-white/5` e `bg-white/10` soltos | 5 tokens: `surface-0` #101012, `surface-1` #151518, `surface-2` #1c1c20, `surface-3` #24242a, `surface-4` #303036 | `src/index.css`; 68 usos de `bg-white/N` |
| 2 | Bordas | `border-white/10`, `/15`, `/20` soltos (222 usos) e `--border` a 12% | `border-subtle` 8%, `border-default` 12%, `border-strong` 20% | Componentes de página |
| 3 | Raios | `rounded-[14px]` (171), `rounded-[10px]` (106), `rounded-[8px]` (28), outros | Tokens `radius-card` 14, `radius-control` 10, `radius-badge` 6 | Todo `src/` |
| 4 | Raio do botão | Botão em pílula completa | 10 px em botões e campos; círculo só em avatares e pílulas | `src/components/ui/button.tsx` |
| 5 | Texto terciário | Só `muted-foreground` #adadb3 (625 usos) para tudo que é secundário | `text-tertiary` #8b8b93 para metadados e eixos (conferir contraste) | `src/index.css` |
| 6 | Cores de estado | `text-red-300`, `sky-500/300`, `amber` e similares da paleta do Tailwind (36 usos) | Tokens `state-success`, `state-warning`, `state-danger`, `state-info` (#6b9cf5) com fundo suave | `Selos.tsx` e telas |
| 7 | Gráficos | Não há tokens nem biblioteca de gráficos; radar em SVG próprio | Paleta `--chart-1` a `--chart-5`, `--chart-muted`, grade e eixo; shadcn chart (Recharts) | Fase 3 |
| 8 | Níveis | Premium e Select com texto branco; sem cores de nível para gráfico | Premium texto #c7d6ff, Select texto #d9f99d; gráfico Elite #e9a23b, Premium #6b8ff0, Select #8cc152 | `Selos.tsx`, `tailwind.config.ts` |
| 9 | Sombra | `shadow-sm` no `Card` e 14 sombras soltas | Sem sombra em cards; `shadow-popover` só em camadas flutuantes | `src/components/ui/card.tsx` |
| 10 | Números | `tabular-nums` não é usado em nenhum lugar | `tabular-nums` em tabelas, KPIs e eixos | Todo `src/` |
| 11 | Escala tipográfica | `text-[10px]` e `text-[11px]` (12 usos); título de página 24 a 30 px | Escala 12, 13, 14, 16, 18, 22, 28, 36, 48; título 22 ou 28; nada abaixo de 12 | Selos, tabelas, `Cabecalho` |
| 12 | Número principal | Baloo 2 usada uma vez; números de destaque em Plus Jakarta | `HeroMetric` em Baloo 2 com meta e tendência | Painel, resultado do canal |
| 13 | Movimento | Sem tokens de duração e curva; animações padrão do shadcn | `duration-fast` 120 ms, `duration-base` 180 ms, `ease-out` cubic-bezier(.2,.8,.2,1), `prefers-reduced-motion` | `tailwind.config.ts` |
| 14 | Componentes canônicos | `Cabecalho`, `Secao`, `Bloco`, `Indicador`, `Pilula`, `Vazio` | Kit `src/components/kit/` com `PageHeader`, `KpiTile`, `HeroMetric`, `ChartCard`, `DataTable` e demais, mais a vitrine `/app/vitrine` | Fase 3 |
| 15 | Estados | Carregando com texto ("Carregando..."), vazio e erro genéricos | Esqueleto com o formato do componente; estados parcial e sem permissão | `src/components/comum/Estados.tsx` |
