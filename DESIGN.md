---
name: Portal Wise Partners
description: Ferramenta de gestão do programa de parcerias da Wise Makers, com a forma dos apps da Apple, modo claro e escuro e o menta como sinal da marca.
colors:
  menta-sinal: "#00e193"
  menta-texto-escuro: "#12e893"
  menta-texto-claro: "#007a4d"
  menta-foco-claro: "#00905e"
  fundo-claro: "#f5f5f7"
  cartao-claro: "#ffffff"
  texto-claro: "#1d1d1f"
  texto-secundario-claro: "#626266"
  fundo-escuro: "#101012"
  cartao-escuro: "#1c1c20"
  popover-escuro: "#232327"
  texto-escuro: "#ffffff"
  texto-secundario-escuro: "#adadb3"
  alerta-claro: "#8a4b00"
  alerta-escuro: "#f5a623"
  perigo-claro: "#b8281d"
  perigo-escuro: "#f0473a"
  nivel-elite-fundo: "#111827"
  nivel-elite-ouro: "#d97706"
  nivel-premium-fundo: "#1e3a8a"
  nivel-select-fundo: "#365314"
typography:
  display:
    fontFamily: "ui-rounded, SF Pro Rounded, -apple-system, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.024em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    letterSpacing: "-0.024em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    letterSpacing: "-0.014em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    letterSpacing: "-0.006em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.004em"
rounded:
  pilula: "9999px"
  dialogo: "18px"
  card: "14px"
  menu: "12px"
  campo: "10px"
  segmento: "9px"
spacing:
  card-padding: "16px"
  card-padding-lg: "20px"
  secao: "24px"
  cabecalho: "32px"
components:
  button-primary:
    backgroundColor: "{colors.menta-sinal}"
    textColor: "{colors.fundo-escuro}"
    rounded: "{rounded.pilula}"
    height: "40px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.cartao-claro}"
    textColor: "{colors.texto-claro}"
    rounded: "{rounded.pilula}"
    height: "40px"
  card:
    backgroundColor: "{colors.cartao-claro}"
    textColor: "{colors.texto-claro}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  input:
    backgroundColor: "{colors.fundo-claro}"
    textColor: "{colors.texto-claro}"
    rounded: "{rounded.campo}"
    height: "40px"
  segmented-control:
    backgroundColor: "{colors.fundo-claro}"
    textColor: "{colors.texto-secundario-claro}"
    rounded: "{rounded.campo}"
  nav-item-ativo:
    textColor: "{colors.menta-texto-claro}"
    rounded: "{rounded.campo}"
---

# Design System: Portal Wise Partners

Desde 26/11/2026 a forma do portal segue a skill `apple-design` (regra número 1 do CLAUDE.md) e a marca segue a skill `wise-design-system` (logo, verde menta como sinal, voz). O código é a fonte: `src/index.css` (tokens dos dois temas, materiais, acessibilidade), `tailwind.config.ts` (fonte, escala, curvas, cores que acompanham o tema), `src/components/ui` e `src/lib/tema.ts`.

## Overview

**Creative North Star: "Ferramenta da Apple com sinal da Wise"**

Calma, precisa e familiar como os apps da Apple: fonte do sistema, títulos grandes com espaçamento apertado, superfícies agrupadas, barras translúcidas por onde o conteúdo passa, resposta no instante do toque. A marca aparece pouco e com intenção: o logo, o menta no botão principal, no item ativo e no número que bateu a meta.

**Key Characteristics:**
- Modo claro e escuro com os mesmos papéis de cor. Nas áreas logadas vale a escolha da pessoa (Minha conta, Aparência: Automático, Claro, Escuro) ou o sistema; as páginas públicas ficam no escuro, como momento da marca.
- Fonte do sistema (SF Pro, Segoe UI, Roboto), com espaçamento e entrelinha por tamanho; `font-display` arredondada só no número principal e em títulos públicos.
- Barras e menu lateral translúcidos (`material-barra`, `material-lateral`), com a linha de separação só quando o conteúdo passa por baixo.
- Botões em pílula que respondem ao pressionar (escala 0,97 em 100 ms); menus que nascem do botão que os abriu.
- Contraste AA conferido em todas as rotas logadas nos dois temas.

## Colors

Um acento (menta) sobre neutros, com par claro e escuro para cada papel.

### Primary
- **Menta sinal** (#00e193): botão principal, item ativo, barras de progresso, a série principal. Igual nos dois temas (`--primary`).
- **Menta para texto**: #12e893 no escuro e #007a4d no claro (`menta-400`, `menta-300`), sempre com 4,5:1 ou mais.
- **Foco**: anel menta (#00e193 no escuro, #00905e no claro) com halo suave de 20%.

### Neutral
- **Claro**: fundo agrupado #f5f5f7, cartão #ffffff, texto #1d1d1f, secundário #626266, bordas em grafite a 10%.
- **Escuro**: fundo #101012, cartão #1c1c20, popover #232327, texto #ffffff, secundário #adadb3, bordas em branco a 12%.
- `white`, `neutro`, `menta-200` a `menta-400`, `red-200`, `red-300`, `sky-300`, `violet-200` e `violet-300` leem variáveis e acompanham o tema. Branco literal sobre foto ou cor sólida: `puro`.

### Named Rules
**A Regra do Sinal.** O menta marca o que pede ação ou bateu a meta; se mais de 10% da área visível está menta, há excesso.

**A Regra do Par.** Toda cor nova nasce com o valor claro e o escuro, e com o contraste conferido nos dois.

## Typography

**Font:** a do sistema. **Display:** a arredondada do sistema (SF Pro Rounded), com a do sistema de reserva.

### Hierarchy
- **Título de página** (700, 28 px no celular e 34 px no computador, -0,024em, entrelinha 1,1): `Cabecalho`.
- **Título de seção** (600, 16 a 18 px, -0,014em).
- **Corpo** (400, 14 px, -0,006em, entrelinha 1,5); descrição de página em 15 px.
- **Rótulo** (500 a 600, 12 px, +0,004em).
- Números com `tabular-nums` em tabelas e indicadores.

## Layout

Menu lateral translúcido de 240 a 250 px no computador e gaveta no celular; barra do topo translúcida e fixa; abas da seção logo abaixo; conteúdo com respiro de 16 a 24 px e largura máxima de 1280 px. Cada página começa pelo `Cabecalho` (título, pergunta que a tela responde, ações).

## Elevation & Depth

Camadas por superfície: fundo, cartões e, por cima, menus, avisos e diálogos. No claro os cartões têm sombra quase invisível (`sombra-cartao`); no escuro, nenhuma. Elementos flutuantes usam `sombra-flutuante`. Diálogos e folhas escurecem o fundo (preto a 40% com desfoque leve) para dar foco.

### Named Rules
**A Regra do Material.** Translucidez só nas barras e folhas; nunca uma superfície translúcida clara sobre outra.

## Shapes

Pílula em botões, selos e estados; 18 px em diálogos; 14 px em cartões; 12 px em menus; 10 px em campos e itens do menu; 9 px nos segmentos.

## Components

### Buttons
- **Primary:** menta com texto quase preto, pílula, 40 px (44 px em tela de toque).
- **Outline:** cartão com borda fina; **Secondary:** véu cinza; **Ghost:** só véu no passar e no pressionar.
- **Pressionar:** escala 0,97 em 100 ms; com menos movimento, sem escala.

### Segmented control
- `SeletorAparencia` e as `TabsList`: trilho com véu cinza, segmento ativo em cartão com sombra leve.

### Cards / Containers
- 14 px, cartão branco no claro e #1c1c20 no escuro, borda fina, 16 a 20 px de respiro.

### Inputs / Fields
- Fundo agrupado, borda com 3:1, 10 px; foco com borda menta e halo de 20%.

### Navigation
- Itens de 40 px, 10 px de raio; ativo com menta a 14% e texto menta em semibold.

### Menus, popovers, avisos e diálogos
- Nascem do ponto de origem (`transform-origin` do Radix), raio 12 a 18 px, `sombra-flutuante`; folhas com a curva `ease-folha` e diálogos com `ease-saida`.

## Motion

- Resposta no pressionar, não no soltar.
- Curvas: `ease-saida` cubic-bezier(0.23, 1, 0.32, 1) para entradas; `ease-folha` cubic-bezier(0.32, 0.72, 0, 1) para folhas. Sem bounce fora de gesto com impulso.
- Troca de tema com transição de cor de 200 ms, sem salto de brilho.
- Menos movimento: deslizes e escalas viram esmaecimento de 150 ms; faixas em loop e esqueletos pulsando param.
- Menos transparência e mais contraste: barras ficam sólidas e as bordas, mais fortes.

## Do's and Don'ts

### Do:
- **Do** usar só tokens; cor nova sempre com par claro e escuro.
- **Do** manter o menta como sinal.
- **Do** mostrar nível pelo nome para parceiros e clientes.
- **Do** escrever sem travessão nem meia-risca.

### Don't:
- **Don't** usar `white` para branco literal (ele acompanha o tema); use `puro`.
- **Don't** empilhar materiais translúcidos.
- **Don't** usar fonte da web nas telas; a do sistema já traz o ajuste fino. Os PDFs mantêm as fontes embutidas.
- **Don't** usar vermelho para variação negativa neutra.
