# Avaliação B: detector, evidência de navegador e auditoria técnica

Portal Wise Partners, branch `ux-fundacao`, 24/10/2026. Somente diagnóstico: nada em `src/`, `supabase/` ou `index.html` foi alterado. Esta avaliação rodou isolada da Avaliação A (não li as partes A1, A2 e A3).

Regras de referência: skill `wise-design-system` (com `referencias/tokens.md`), skill `wise-dashboards`, skill `accessibility` (WCAG 2.2), skill `performance` e o `audit.md` do Impeccable. Divergências de token já listadas em `DESIGN.md`, seção "Diferenças a corrigir", são citadas pelo número do item (DESIGN #N) em vez de repetidas.

## 1. Notas de execução

| Etapa | Situação | Detalhe |
|---|---|---|
| Lista de ignorados | Não existe | `.impeccable/critique/ignore.md` ausente; há só `.impeccable/design.json`, que o detector leu como contexto do DESIGN.md |
| Detector em código (`impeccable detect --json`, v4.7.1) | Rodou, cobertura parcial | 12 escopos (páginas e componentes de cada tela, `src/components/layout`, `src/components/ui` e `src` inteiro). Para `.tsx` o detector só faz correspondência por regex e avisa que as regras de elemento (contraste, texto miúdo etc.) não rodam: o resultado é subcontagem, não atestado de limpeza. 11 achados, todos consultivos |
| Detector na página renderizada (`detect --cdp`) | Rodou nas 13 telas | Chromium headless (Playwright 1.56, chromium-1243) aberto com `--remote-debugging-port=9233`, sessão gravada no `localStorage` (`sb-127-auth-token`, JWT HS256 do PostgREST de teste), uma página aberta por vez e `detect --cdp 9233 --target <rota> --json`. 13 telas em 1440 px e 4 telas também em 375 px |
| Overlay do Impeccable | Rodou | `live-server --background` (porta 8400, pid 11398). Pré-teste de mutação aprovado (troca de `document.title` e `<script>` anexado). `detect.js` injetado por `addScriptTag` em 5 telas (painel, lista de parceiros, ficha, portal início, RFP); o console devolveu `[impeccable] N anti-pattern(s) found` em todas, com contagens iguais às da varredura CDP. O navegador é headless, então não há aba `[Human]` visível para o usuário: o overlay ficou registrado nas capturas `b-overlay-*-1440.jpg` |
| Parada do live-server | Feita | `live-server stop --keep-inject`; `/health` não responde mais; `git status` sem mudanças em `index.html`, `src/` e `supabase/` |
| Medidas no navegador | Rodaram | Script próprio: contraste por estilos computados (texto e fundo efetivo, com composição de camadas translúcidas e opacidade de ancestrais), alvos de toque em 375 px (regra de espaçamento da 2.5.8), 40 tabulações em painel, lista de parceiros e portal início, árvore de acessibilidade do Chromium (CDP `Accessibility.getFullAXTree`) para títulos, marcos e controles sem nome, chunks JS carregados por rota |
| LCP da RFP | Rodou | 375 px, `isMobile`, cache desativado, 3 rodadas sem limitação e 3 com o perfil "Slow 4G" via CDP (150 ms de RTT, 1,6 Mbps de descida, 750 kbps de subida, CPU 4x) |
| Não testado | | Leitor de tela real, Lighthouse e axe (não instalados; a árvore de acessibilidade do Chromium substituiu), zoom de texto a 200%, gestos de toque (não há superfícies de arrasto no código: nenhum `draggable`, `onDrag` ou `onPointerDown`), estados de carregando, vazio e erro (fora do escopo desta avaliação) |
| Fontes | Observação | Google Fonts carregou Plus Jakarta Sans 400 a 700 em todas as telas. Baloo 2 não foi carregada em nenhuma das 13 telas, porque nenhum elemento a usa |
| Limpeza | Feita | Scripts `b-*.mjs` da pasta `pw` e a pasta temporária `b-audit` removidos ao final. Ficaram só as capturas `b-*` em `docs/ux/capturas/antes/` |

Capturas desta avaliação (todas em `docs/ux/capturas/antes/`): `b-<tela>-1440.jpg` e `b-<tela>-375.jpg` (página inteira) para as 13 telas, `b-painel-foco-teclado-1440.jpg`, `b-parceiros-lista-foco-teclado-1440.jpg`, `b-portal-inicio-foco-teclado-1440.jpg`, `b-overlay-{painel,parceiros-lista,ficha,portal-inicio,rfp}-1440.jpg` e `b-rfp-4g-lento-375.jpg`.

## 2. Achados do detector

### 2.1 Varredura do código (regex em `.tsx`)

11 achados, todos `design-system-font-size` (consultivo): tamanho de fonte fora da escala do DESIGN.md. São verdadeiros pela skill (escala começa em 12; DESIGN #11).

| Arquivo:linha | Valor | Tela |
|---|---|---|
| `src/components/layout/AppLayout.tsx:103` | 11px | Todas as internas (contador de notificações) |
| `src/components/layout/ParceiroLayout.tsx:66` e `:119` | 11px | Portal |
| `src/components/parceiros/ficha/AbaFichaApresentacao.tsx:191` | 10px | Ficha |
| `src/components/parceiros/ficha/AbaFichaApresentacao.tsx:198` e `:202` | 11px | Ficha |
| `src/components/parceiros/ficha/AbaPerfil.tsx:90` | 10px | Ficha |
| `src/components/contrato/AbaContrato.tsx:136` | 10px | Ficha |
| `src/components/config/SecoesV2.tsx:280` e `:329` | 11px | Configurações |
| `src/pages/app/Maturidade.tsx:213` | 11px | Fora do escopo |

Nenhum outro padrão apareceu no código, o que confirma a limitação do modo regex: as regras de elemento só rodaram na página renderizada (2.2).

### 2.2 Varredura da página renderizada, por tela

Legenda: (c) consultivo; FP falso positivo.

| Tela | 1440 px | 375 px | Verdadeiros | Falsos positivos e julgamento |
|---|---|---|---|---|
| Painel `/app` | `overused-font` | `overused-font`, `dark-glow` no botão flutuante, `straggler` (c) | `dark-glow`: `AppLayout.tsx:158`, `shadow-[0_0_24px_rgba(0,225,147,0.35)]` no botão "Registrar contato" do celular; viola a regra de sombra da skill (DESIGN #9). `straggler` em texto de bloco: polimento | `overused-font` é FP para este projeto: Plus Jakarta Sans é imposta pela skill `wise-design-system` §3 e a skill prevalece sobre sugestões de estilo de outras skills. Vale para todas as telas abaixo |
| Parceiros, categorias | `skipped-heading` (h2 para h4), 3 `unbalanced-heading` (c), `overused-font` | não varrida | `skipped-heading`: `VisaoCategorias.tsx:87` usa `h4` direto sob o `h2` da linha 34 | `unbalanced-heading`: nomes de categoria quebrando em 2 linhas no card; cosmético |
| Parceiros, funil | `skipped-heading` (h1 para h3), 40 `nested-cards`, `overused-font` | não varrida | `skipped-heading`: `QuadroFunil.tsx:45`, `:58`, `:70` usam `h3` sem `h2` | `nested-cards`: parcialmente FP. Coluna de quadro (`QuadroFunil.tsx:43`, `section` com borda e `bg-card/60`) contendo cartões (`:90`, borda e `bg-card`) é o padrão normal de kanban. O problema real é outro: as duas camadas usam a mesma borda `white/10` e quase a mesma superfície, em vez de `surface-1` para a coluna e `surface-2` para o cartão (DESIGN #1) |
| Parceiros, lista | `overused-font` | `overused-font`, `dark-glow`, `straggler` (c) | `dark-glow` (mesmo botão flutuante) | |
| Ficha do parceiro | `nested-cards` (3), `straggler` (c), `overused-font` | não varrida | `nested-cards`: blocos `rounded-[10px]` com borda dentro de cards `rounded-[14px]` com borda na aba Visão geral | |
| Indicações | 24 `cramped-padding`, `overused-font` | não varrida | `cramped-padding`: pílulas de marcadores dentro das células da tabela com 3,5 px acima e abaixo de texto de 12 px (`Selos.tsx:31`, `py-0.5`; usadas em `Indicacoes.tsx:290` a `297`). Polimento | |
| Comissões | `overused-font` | não varrida | nenhum | |
| Base Ativa | `overused-font` | não varrida | nenhum | |
| Atividades | `overused-font` | não varrida | nenhum | |
| Configurações | `overused-font` | não varrida | nenhum | |
| Portal, início `/parceiro` | `straggler` (c), `overused-font` | `overused-font` | `straggler`: polimento | |
| Portal, indicações | `overused-font` | não varrida | nenhum | |
| RFP pública `/r/<token>` | `overused-font` | `overused-font` | nenhum | |

Overlay (console do navegador, 1440 px): painel 1, lista de parceiros 1, ficha 5, portal início 2, RFP 1 anti-padrão, idênticos à varredura CDP.

Leitura: o detector achou poucos "tiques" visuais genéricos. O que ele não mede (rótulos de campo, foco, peso de pacote, teclado) é onde estão os problemas técnicos sérios, medidos na seção 3.

## 3. Medidas técnicas

### 3.1 Contraste de texto (WCAG 1.4.3) e de elementos gráficos (1.4.11)

Todos os pares abaixo foram medidos nos estilos computados das 13 telas a 1440 px. Nenhum texto habilitado ficou abaixo de 4,5:1.

| Tom | Texto sobre fundo real | Razão mínima medida | Ocorrências | Resultado |
|---|---|---|---|---|
| `muted-foreground` #adadb3 | card #1c1c21 | 7,60:1 | 572 em 12 telas | Passa |
| `muted-foreground` #adadb3 | hover de aba #26262b | 6,74:1 | 60 | Passa |
| `muted-foreground` #adadb3 | fundo #101012 e #111113 | 8,45:1 | 260 | Passa |
| Pílula menta: #4defa9 | menta 15% sobre card (#183a32) | 8,47:1 | 156 em 6 telas | Passa |
| Item ativo da navegação: #12e893 | menta 10% (#0e251f) | 9,97:1 | 12 telas | Passa |
| Pílula alerta: #f5a524 | âmbar 15% (#3d3121) | 6,24:1 | 48 em 6 telas | Passa |
| Pílula perigo: #fca5a5 (`text-red-300`) | vermelho 15% (#3c2224) | 7,65:1 | 40 em 3 telas | Passa, mas é cor fora do token (DESIGN #6) |
| Pílula informação: #7dd3fc (`text-sky-300`) | azul 15% (#1a313f) | 8,14:1 | 36 em 3 telas | Passa, cor fora do token (DESIGN #6) |
| Selo Elite #d97706 | #111827 | 5,57:1 | 12 em 5 telas | Passa |
| Botão primário #111113 | #00e08a | 10,80:1 | 13 telas | Passa |
| Botão "Salvar" desabilitado (opacidade 50%) | #00e08a | 3,14:1 | Configurações | Isento (desabilitado) |
| Botão `destructive`: branco | #f0473a | 3,71:1 (calculado) | 4 usos em `src`, não visível nas telas medidas | Falha 1.4.3 quando aparecer (`button.tsx:13` e `:14`) |
| Anel de foco global `rgba(0,225,147,.18)` 3 px | #101012 e card | 1,42:1 e 1,46:1 | Links, itens de navegação, botões simples, cartões-link | Falha 1.4.11; indicador quase invisível |
| Borda de campo `--input` branco 16% | campo #111113 | 1,58:1 | Todos os `Input` e `SelectTrigger` | Falha a regra da skill (3:1 para bordas de campos) e 1.4.11. Precisa de cerca de 34% de branco (#626263) para chegar a 3:1 |
| Borda de card branco 10% | #101012 | 1,29:1 | Todos os cards | Aceitável para divisão decorativa; não pode ser o único sinal de um controle |

Observação de token: os valores HSL de `src/index.css` não reproduzem os hex da marca. O fundo computado do conteúdo é #111113 (não #101012), o card é #1c1c21 (não #1c1c20) e o botão primário é #00e08a (não #00e193). A barra lateral, que usa `bg-neutro-900` em hex, sai #101012, então fundo da lateral e do conteúdo diferem por arredondamento.

### 3.2 Alvos de toque a 375 px (WCAG 2.5.8 e skill §4)

| Tela | Alvos | Menores que 24 px | Falham 2.5.8 (após exceção de espaçamento) | Menores que 44 px | Exemplos |
|---|---|---|---|---|---|
| Painel | 24 | 5 | 0 | 20 | "Ver todos (8)" 72x16; abas 32 px de altura |
| Parceiros, categorias | 50 | 40 | 0 | 48 | links de nome de parceiro 219x20 |
| Parceiros, funil | 90 | 0 | 0 | 88 | cartões e abas de 32 a 40 px |
| Parceiros, lista | 60 | 0 | 0 | 18 | links de nome 188x20 |
| Ficha | 47 | 1 | 0 | 40 | "Parceiros" (voltar) 82x20 |
| Indicações | 110 | 4 | 0 | 16 | caixas de seleção 16x16 |
| Comissões | 40 | 14 | 0 | 37 | abas 32 px, "Mudar estado" 36 px |
| Base Ativa | 12 | 0 | 0 | 10 | abas 32 px, link "Fomento Já" 89x24 |
| Atividades | 33 | 0 | 0 | 31 | abas 32 px |
| Configurações | 54 | 0 | 0 | 48 | abas 32 px |
| Portal, início | 10 | 4 | 0 | 7 | "Ver meu nível" 104x20, "Ver comunicados" 134x20 |
| Portal, indicações | 7 | 0 | 0 | 6 | abas 32 px |
| RFP | 5 | 2 | 0 | 5 | e-mail e telefone de contato 301x20 |

Nenhuma tela falha a 2.5.8 (24 px com espaçamento). A régua da skill (linha de 44 px no celular) é descumprida em quase todos os controles: abas Radix com 32 px, botões pequenos de 36 px, links de texto de 20 px de altura usados como ação principal de cartão.

Rolagem horizontal a 375 px: nenhuma das 13 telas. Altura da página a 375 px: Indicações 18.715 px (93 indicações em cartões, sem paginação), funil 7.495 px, categorias 7.470 px, comissões 7.211 px, lista 6.641 px, painel 5.449 px.

### 3.3 Teclado (painel, lista de parceiros, portal início)

| Medida | Painel | Lista de parceiros | Portal início |
|---|---|---|---|
| Link "pular para o conteúdo" | Não há | Não há | Não há |
| Tabulações até a primeira ação do conteúdo | 26 ("Pauta da semana") | 26 ("Novo parceiro") | 21 ("Acessar o Wise Hub") |
| Ordem | Lógica: logotipo, botão lateral, 20 itens de navegação, perfil, sair, notificações, conteúdo de cima para baixo | Igual | Igual |
| Armadilha de foco | Nenhuma em 40 tabulações | Nenhuma | Nenhuma (volta ao início depois de 28) |
| Foco visível | Dois estilos: `Button`, `Input` e `Select` do shadcn usam anel menta sólido de 2 px com afastamento (contraste 11:1, bom); links, itens de navegação, botões simples ("Ver todos") e o painel de aba usam o anel global de 18% (1,42:1, quase invisível) | Igual; os 8 filtros têm anel bom, os links de nome de parceiro têm o anel fraco | Igual; os 3 cartões-link e os 4 links "Ver ..." têm o anel fraco |

Evidência visual: `b-painel-foco-teclado-1440.jpg` (foco no item "Comissões", só um contorno verde-escuro quase imperceptível). Origem: `src/index.css:37`, `:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(0, 225, 147, 0.18); }`.

Na lista de indicações (1440 px), as 93 linhas da tabela abrem o detalhe só com clique: `TableRow` com `onClick` e `cursor-pointer`, sem `tabindex`, papel ou link (`src/pages/app/Indicacoes.tsx:254`). Nenhum outro elemento da linha é focável. No celular a mesma lista usa `<button>` (linha 214), então o problema é só no layout de computador.

### 3.4 Semântica: títulos, marcos, rótulos, imagens, título do documento

| Tela | Títulos (árvore de acessibilidade) | Marcos | Controles sem nome acessível |
|---|---|---|---|
| Painel | h1 Painel; 5 h2 de etapa, cada um com o texto do botão dentro ("CAPTAÇÃO Ver todos (8)") | banner, navigation, complementary, main | 0 |
| Parceiros, categorias | h1, h2, depois h4 (salta h3) | completos | 0 |
| Parceiros, funil | h1, depois 12 h3 (salta h2) | completos | 0 |
| Parceiros, lista | só h1 | completos | 9 (8 filtros `combobox`, 1 não focável) e a busca só com `placeholder` |
| Ficha | h1 e 7 h2 | completos | 10 (3 `combobox`, 2 `spinbutton`, 5 `textbox`) |
| Indicações | só h1 | completos | 6 `combobox` (filtros) |
| Comissões, Base Ativa, Atividades, Portal indicações | só h1 | completos | 0 |
| Configurações | só h1 | completos | 18 (12 `textbox`, 6 `spinbutton`) |
| Portal início | h1 e 5 h2 | completos | 0 |
| RFP | h1, h2, h3 por parceiro | banner e contentinfo, **sem main** | 0 |

Causa dos controles sem nome: os componentes de campo renderizam `<Label>` sem `htmlFor` e o filho sem `id`. Ocorre em `src/components/parceiros/ui.tsx:32` (`Campo`, usado na ficha), `src/pages/app/Indicacoes.tsx:306` (`Filtro`), `src/components/config/TabelaConfig.tsx:227`, `src/components/indicacoes/NovaIndicacaoDialog.tsx:291` e `src/components/indicacoes/DetalheIndicacao.tsx:270`; na lista de parceiros os `SelectTrigger` de `ListaParceiros.tsx:117`, `:139`, `:165` e `:176` não têm rótulo associado e a busca (`:132`) depende do `placeholder`. O formulário público `src/pages/publico/IndicacaoLink.tsx:234` já faz certo (recebe `id`), e serve de modelo.

Outros itens:
* `lang="pt-BR"` presente. Imagens: só o logotipo, com `alt="Wise Makers"`. Nenhuma imagem sem `alt`.
* Título do documento: "Portal Wise Partners" fixo nas 12 telas internas (WCAG 2.4.2). Só a RFP tem título próprio.
* O link de notificações tem `aria-label="Notificações"`, que encobre o contador ("81") do nome acessível (`AppLayout.tsx:100` a `104`). O portal repete o caso no link de notificações (`ParceiroLayout.tsx:117` a `119`) e põe o `aria-label` do contador de comunicados num `span` genérico (`ParceiroLayout.tsx:66` e `:67`), onde não é lido.
* `tabular-nums`: 0 elementos com `font-variant-numeric: tabular-nums` nas 13 telas (DESIGN #10).

### 3.5 Movimento (`prefers-reduced-motion`)

Nenhuma ocorrência de `prefers-reduced-motion`, `motion-reduce` ou `motion-safe` em `src/`, `tailwind.config.ts` ou no CSS gerado (`index-CBWjPK6K.css`). Há 95 `animate-spin` (indicadores de carregamento), 11 `animate-in` e 11 `animate-out` (diálogos e menus com `zoom` e `slide`), 1 `animate-pulse` (`skeleton.tsx:9`) e 33 `transition`. Com `reducedMotion: "reduce"` emulado, nada muda. As animações são curtas e funcionais, então o impacto é moderado, mas a skill pede o respeito explícito (§7, DESIGN #13).

### 3.6 Pacotes e desempenho

Arquivos do build atual (`index.html` aponta para `index-BecVZQ65.js` e `index-CBWjPK6K.css`; a pasta `assets` ainda guarda chunks de 3 builds antigos, sem efeito no app):

| Chunk | Bruto | gzip | Quem carrega |
|---|---|---|---|
| `index-BecVZQ65.js` (principal) | 752.747 B | 221.174 B | Todas as rotas, inclusive a RFP pública |
| `pdf-CkH_3zX9.js` (pdf-lib e fontkit) | 1.151.283 B | 510.111 B | Painel, Ficha, Configurações (medido na rede) |
| `FichaParceiro-DOQzCSmc.js` (inclui docxtemplater) | 482.540 B | 142.298 B | Ficha |
| `index-CBWjPK6K.css` | 48.360 B | 9.171 B | Todas |

JS comprimido baixado por rota (soma gzip dos chunks pedidos): painel 745 KB, ficha 879 KB, configurações 758 KB, lista de parceiros 233 KB, portal início 223 KB, RFP 221 KB. A orientação da skill `performance` é menos de 300 KB comprimidos: três telas passam do dobro.

Por que o painel baixa o pdf-lib: `PainelJornada.tsx:7` importa `gestao/Indicadores.tsx`, que importa `./formato` (linha 6); `gestao/formato.ts` importa `papaparse` (linha 1) e `baixarBlob` de `@/lib/pdf` (linha 3), e `lib/pdf.ts:1` importa `pdf-lib` de forma estática. Uma função de formatar número arrasta 510 KB gzip de PDF para a tela mais aberta do produto. Configurações cai no mesmo caminho por `SecoesV2.tsx:19` (`gestao/Remuneracoes.tsx:20`). A ficha carrega o PDF por `CabecalhoFicha.tsx:11` e o docxtemplater por `AbaContrato` (`lib/contrato.ts:5`), ambos estáticos.

Pontos bons: 44 rotas com `React.lazy` em `src/App.tsx`; o servidor entrega gzip; sem imagens pesadas; sem `will-change`; sem animação de propriedade de layout.

LCP da RFP pública a 375 px, cache frio (3 rodadas cada):

| Perfil | LCP | FCP | JS transferido | Total transferido |
|---|---|---|---|---|
| Sem limitação | 496 a 572 ms | 416 a 508 ms | 229 KB | 289 KB em 13 pedidos |
| 4G lento (150 ms RTT, 1,6 Mbps, CPU 4x) | 2.188 a 2.236 ms | 1.680 a 1.724 ms | 229 KB | 289 KB |

O elemento de LCP é o parágrafo de introdução (`p.whitespace-pre-line`, "Separamos três parceiros..."), que só aparece depois da chamada ao PostgREST. Fica abaixo de 2,5 s, mas com 0,3 s de folga e com o banco local: em produção soma-se o tempo de ida e volta ao Supabase. 222 KB dos 229 KB de JS são o chunk principal da aplicação inteira; o código próprio da página (`PaginaRfp` e `ConteudoPaginaRfp`) tem 3,5 KB. Captura: `b-rfp-4g-lento-375.jpg`.

### 3.7 Temas e tokens (contagem em `src/`)

| Item | Contagem | DESIGN.md |
|---|---|---|
| `bg-white/N`, `border-white/N`, `divide-white/N`, `text-white`, `bg-black` | 68, 222, 24, 5, 3 (322 no total) | #1, #2 |
| Raios soltos: `rounded-[14px]`, `[10px]`, `[8px]`, `[6px]`, `[18px]`, `[20px]` | 171, 106, 28, 1, 1, 1 (308) | #3 |
| Raios da escala do Tailwind (`rounded-full`, `-md`, `-sm`, `-lg`) | 56, 12, 10, 3 | #3, #4 |
| Cores da paleta do Tailwind (`red-*`, `sky-*`) | 34 e 4 (38), por exemplo `Selos.tsx:25` e `:26`, `Blocos.tsx:13`, `Estados.tsx:23`, `QuadroFunil.tsx:101` e `:106` | #6 |
| Hex e `rgba()` literais em `.tsx` e `.ts` | 21 (12 em PDF e certificado, aceitáveis; 5 no radar SVG `gestao/Radar.tsx`; 1 no brilho de `AppLayout.tsx:158`) | #7, #9 |
| Fonte fora da escala: `text-[10px]`, `text-[11px]` | 4 e 8 | #11 |
| Fonte da escala Tailwind fora da escala da skill: `text-xl` (20), `text-2xl` (24), `text-3xl` (30) | 10, 12, 5 | #11 |
| Sombras em componentes | 16 | #9 |
| `style={{...}}` inline | 8 | |
| `tabular-nums` | 0 | #10 |
| `font-display` (Baloo 2) | 1 | #12 |
| `text-muted-foreground` | 625 | #5 |
| `prefers-reduced-motion` | 0 | #13 |

Tema único escuro, sem modo claro, o que é a decisão do produto; não há tema quebrado a corrigir. As variáveis do shadcn existem e são usadas para texto e superfícies principais, mas a camada semântica da skill (`surface-1` a `surface-4`, `text-tertiary`, `state-*`, `chart-*`, raio, duração) ainda não existe no código.

## 4. Placar da auditoria

| # | Dimensão | Nota | Achado principal e evidência |
|---|---|---|---|
| 1 | Acessibilidade | 2 | Texto passa AA em todas as telas (menor razão 5,57:1), marcos e `lang` corretos. Mas: 43 controles sem nome acessível em 4 telas (árvore de acessibilidade), linhas da tabela de Indicações só com mouse (`Indicacoes.tsx:254`), anel de foco global a 1,42:1 (`index.css:37`), borda de campo a 1,58:1, sem link de pular navegação (26 tabulações), título de documento fixo, sem `prefers-reduced-motion` |
| 2 | Desempenho | 2 | Rotas preguiçosas e gzip funcionam, RFP com LCP de 2,2 s em 4G lento. Mas o pdf-lib (510 KB gzip) entra no painel e em configurações por um import de formatação (`gestao/formato.ts:3`), três telas baixam 745 a 879 KB gzip de JS, e Indicações renderiza 93 linhas sem paginação (8.564 px a 1440, 18.715 px a 375) |
| 3 | Temas | 2 | Variáveis CSS existem, mas 322 brancos e pretos translúcidos soltos, 308 raios arbitrários, 38 cores da paleta Tailwind, 39 tamanhos de fonte fora da escala, 0 `tabular-nums`, HSL que não reproduz os hex da marca |
| 4 | Responsivo | 3 | Nenhuma rolagem horizontal a 375 px nas 13 telas, listas viram cartões no celular, nenhuma falha de 2.5.8. Mas a maioria dos alvos fica abaixo de 44 px (abas de 32 px, links de 20 px como ação) e as páginas ficam muito longas no celular |
| 5 | Integridade da implementação | 2 | Detector achou poucos tiques genéricos, mas há saltos de nível de título (categorias, funil), 43 cartões aninhados no funil e na ficha, brilho colorido no botão flutuante, componentes de campo replicados em 5 lugares todos com o mesmo defeito de rótulo, e o kit canônico da skill ainda não existe (DESIGN #14) |
| **Total** | | **11/20** | **Aceitável (10 a 13): trabalho significativo necessário** |

Veredito de integridade: **reprova por pouco**. A identidade escura com menta é coerente e o texto é legível, mas o sistema ainda é shadcn com valores soltos, sem a camada de tokens e componentes que a skill define; os defeitos técnicos se repetem por cópia (o mesmo `Campo` sem `htmlFor` em 5 arquivos, o mesmo anel de foco fraco em todo link).

Contagem de problemas nas tabelas da seção 5: crítico (P0) 1, alto (P1) 9, médio (P2) 16, baixo (P3) 23.

## 5. Problemas por tela

### 5.1 Transversais (todas as telas internas, e o portal quando indicado)

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Anel de foco global quase invisível em links, itens de navegação, botões simples e cartões-link | alto (P1) | WCAG 2.4.7 e 1.4.11 (2.4.13 AAA); skill `wise-design-system` §2 (3:1 para elementos gráficos) | `src/index.css:37`, `box-shadow: 0 0 0 3px rgba(0,225,147,.18)`: 1,42:1 sobre #101012, 1,46:1 sobre card; `b-painel-foco-teclado-1440.jpg` | Um único estilo de foco: anel menta sólido de 2 px com afastamento de 2 px (o mesmo do `Button`, 9,9:1 sobre card), como token `--focus-ring` |
| Rótulos de campo não associados aos controles | alto (P1) | WCAG 1.3.1, 3.3.2, 4.1.2 | 43 controles sem nome acessível (lista 9, indicações 6, ficha 10, configurações 18). `Label` sem `htmlFor` em `parceiros/ui.tsx:32`, `Indicacoes.tsx:306`, `TabelaConfig.tsx:227`, `NovaIndicacaoDialog.tsx:291`, `DetalheIndicacao.tsx:270` | Um `Campo` único no kit que gera `id` com `useId` e liga `htmlFor`, `aria-describedby` (dica) e `aria-required`; modelo em `IndicacaoLink.tsx:234` |
| Borda de campo com contraste de 1,58:1 | alto (P1) | Skill `wise-design-system` §2 (3:1 em bordas de campos); WCAG 1.4.11 | `--input: 0 0% 100% / 0.16` em `src/index.css`; computado `rgba(255,255,255,.16)` sobre #111113 em todos os `Input` e `SelectTrigger` | Token `--border-field` com pelo menos 34% de branco (cerca de #626263 sobre fundo; #67676a sobre card) |
| Sem link "pular para o conteúdo"; 21 a 26 tabulações até o conteúdo | médio (P2) | WCAG 2.4.1; skill `accessibility` (Skip links) | Tabulação medida: 26 no painel e na lista, 21 no portal | Link visível no foco antes da barra lateral em `AppLayout` e `ParceiroLayout`, apontando para `<main id="conteudo">` |
| Título do documento igual em todas as telas | médio (P2) | WCAG 2.4.2 | `document.title` = "Portal Wise Partners" nas 12 telas internas | Hook de título por rota: "Indicações, Portal Wise Partners" |
| Sem respeito a `prefers-reduced-motion` | médio (P2) | Skill `wise-design-system` §7; WCAG 2.3.3 (AAA) | 0 ocorrências em `src` e no CSS gerado; 95 `animate-spin`, 22 `animate-in` e `animate-out` | Variante `motion-reduce:` nos diálogos e menus (troca zoom e deslocamento por opacidade) e nos tokens de movimento (DESIGN #13) |
| Números sem `tabular-nums` | médio (P2) | Skill `wise-design-system` §3 | 0 elementos com `tabular-nums` nas 13 telas; DESIGN #10 | Classe no `KpiTile`, `HeroMetric` e células numéricas do `DataTable` |
| Valores soltos de raio, borda, superfície e cor de estado | médio (P2) | Skill `wise-design-system` §9.1 (só tokens) | 308 raios arbitrários, 322 brancos e pretos translúcidos, 38 cores Tailwind (seção 3.7); DESIGN #1, #2, #3, #6 | Camada de tokens da fase 3 e substituição mecânica por classes semânticas |
| Botão `destructive` com texto branco a 3,71:1 | médio (P2) | WCAG 1.4.3 | `src/components/ui/button.tsx:13` e `:14`, branco sobre #f0473a; 4 usos | Texto #101012 sobre o vermelho (5,1:1) ou vermelho mais escuro para o fundo |
| Chunk principal de 221 KB gzip carregado por todas as rotas | médio (P2) | Skill `performance` (orçamento de 300 KB de JS) e skill `wise-dashboards` §4 (lazy por rota) | `index-BecVZQ65.js` 752.747 B bruto; é 97% do JS da RFP pública | Separar o shell público do interno (`manualChunks` para Radix, React Query e cmdk; RFP e link de indicação sem o layout do app) |
| Fontes de 10 e 11 px | baixo (P3) | Skill `wise-design-system` §3 (nada abaixo de 12) | 12 usos; `AppLayout.tsx:103`, `ParceiroLayout.tsx:66` e `:119`, ficha e configurações (seção 2.1); DESIGN #11 | Usar 12 px; o contador de notificação pode ser 12 px em 600 |
| HSL arredondado não reproduz os hex da marca | baixo (P3) | Skill `wise-design-system` `tokens.md` (valores da marca) | Computado: fundo #111113 (lateral #101012), card #1c1c21, primário #00e08a | Ajustar os HSL com mais casas decimais ou passar as variáveis para hex ou RGB |
| Brilho colorido no botão flutuante do celular | baixo (P3) | Skill `wise-design-system` §1 e tokens (sombra só em camada flutuante, neutra); detector `dark-glow` | `AppLayout.tsx:158`, `shadow-[0_0_24px_rgba(0,225,147,0.35)]`; DESIGN #9 | `--shadow-popover` neutra ou nenhuma |
| Contador de notificações fora do nome acessível | baixo (P3) | WCAG 4.1.2 | `AppLayout.tsx:100` (`aria-label` encobre "81"); `ParceiroLayout.tsx:66` e `:67` (`aria-label` num `span`) | `aria-label` com a contagem no link ("Notificações, 81 não lidas") |
| Abas Radix com 32 px de altura no celular | baixo (P3) | Skill `wise-design-system` §4 (44 px no celular) | Medido em painel, comissões, Base Ativa, atividades, configurações, portal | `TabsTrigger` com `min-h-11` abaixo de `sm` |

### 5.2 Painel `/app`

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| pdf-lib e papaparse carregados para formatar números | alto (P1) | Skill `performance` (orçamento de JS); skill `wise-dashboards` §4 (não pesar a primeira tela) | Rede: `pdf-CkH_3zX9.js` (1.151.283 B, 510 KB gzip) e `papaparse` na abertura; 745 KB gzip de JS no total. Cadeia `PainelJornada.tsx:7` → `gestao/Indicadores.tsx:6` → `gestao/formato.ts:1` e `:3` → `lib/pdf.ts:1` | Tirar `baixarBlob` de `lib/pdf.ts` (arquivo próprio sem dependências) e importar `papaparse` e `pdf-lib` com `import()` dentro das funções de exportar |
| Botões "Ver todos" de 72x16 px dentro do `h2` | médio (P2) | WCAG 2.5.8 passa só pelo espaçamento; skill §4 (44 px); nome do título vira "CAPTAÇÃO Ver todos (8)" | Alvos medidos a 375 px; árvore de acessibilidade | Botão fora do `h2`, com área de toque de 44 px; título em caixa normal |
| Página com 5.449 px a 375 px | baixo (P3) | Skill `wise-dashboards` §3 (celular com herói e KPIs primeiro) | `b-painel-375.jpg`; 2,0 vezes a altura de 1440 | Tratar no redesenho do painel |
| Brilho no botão flutuante | baixo (P3) | Ver transversal | Detector `dark-glow` a 375 px | Ver transversal |

### 5.3 Parceiros, vista categorias

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Salto de nível de título (h2 para h4) | médio (P2) | WCAG 1.3.1; detector `skipped-heading` | `VisaoCategorias.tsx:87` (`h4`) sob `:34` (`h2`) | `h3` para o nome da categoria |
| Links de parceiro com 20 px de altura como ação principal do card | baixo (P3) | Skill §4 (44 px no celular) | 40 de 50 alvos abaixo de 24 px a 375 px (passam 2.5.8 por espaçamento) | Linha inteira clicável com 44 px |

### 5.4 Parceiros, vista funil

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Salto de nível de título (h1 para h3) | médio (P2) | WCAG 1.3.1; detector `skipped-heading` | `QuadroFunil.tsx:45`, `:58`, `:70` | `h2` para o nome da etapa, ou `h2` oculto "Funil de recrutamento" |
| Coluna e cartão com a mesma borda e quase a mesma superfície | baixo (P3) | Skill §2 (camadas por superfície); detector `nested-cards` (40, parcialmente FP) | `QuadroFunil.tsx:43` (`bg-card/60`, `border-white/10`) e `:90` (`bg-card`, `border-white/10`); DESIGN #1 | Coluna em `surface-1` sem borda, cartão em `surface-2` |
| Cor de informação fora do token | baixo (P3) | Skill §2 (cores semânticas de token) | `QuadroFunil.tsx:101` `text-sky-300`; DESIGN #6 | `text-state-info` |

### 5.5 Parceiros, vista lista

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| 8 filtros sem nome acessível e busca só com `placeholder` | alto (P1) | WCAG 1.3.1, 3.3.2, 4.1.2 | Árvore de acessibilidade: 8 `combobox` sem nome; leitor anunciaria "Todos, caixa de combinação" oito vezes. `ListaParceiros.tsx:117`, `:132`, `:139`, `:165`, `:176` | `Campo` do kit com `htmlFor`; `aria-label` na busca |
| Só o `h1` como título | baixo (P3) | WCAG 1.3.1 (boa prática de navegação por títulos) | Árvore de acessibilidade | `h2` oculto para "Filtros" e "Resultados (N)" |

### 5.6 Ficha do parceiro

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| 879 KB gzip de JS na abertura (pdf-lib e docxtemplater estáticos) | alto (P1) | Skill `performance` (orçamento) | Rede: `FichaParceiro-DOQzCSmc.js` (482.540 B, 142 KB gzip) e `pdf-CkH_3zX9.js` (510 KB gzip). `CabecalhoFicha.tsx:11` importa `baixarBlob` de `lib/pdf`; `lib/contrato.ts:5` importa `docxtemplater`, puxado por `AbaContrato` | `import()` no clique de "Exportar PDF" e na geração de minuta; abas pesadas com `React.lazy` |
| 10 campos sem nome acessível | alto (P1) | WCAG 1.3.1, 3.3.2, 4.1.2 | Árvore de acessibilidade: 3 `combobox`, 2 `spinbutton`, 5 `textbox`; `Classificacao.tsx:80` e `:172` via `Campo` de `parceiros/ui.tsx:32` | Ver transversal |
| Cartões aninhados na Visão geral | baixo (P3) | Skill §2; detector `nested-cards` (3, verdadeiro) | Blocos `rounded-[10px]` com borda dentro de cards com borda; `b-overlay-ficha-1440.jpg` | Bloco interno sem borda, separado por espaço ou divisor |
| Textos de 10 e 11 px nas abas | baixo (P3) | Skill §3 | `AbaFichaApresentacao.tsx:191`, `:198`, `:202`; `AbaPerfil.tsx:90`; `AbaContrato.tsx:136` | 12 px |

### 5.7 Indicações

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Linhas da tabela abrem o detalhe só com mouse; no computador, quem usa teclado não abre nenhuma indicação | crítico (P0) | WCAG 2.1.1 (nível A) | `Indicacoes.tsx:254`, `TableRow` com `onClick` sem foco; 93 elementos clicáveis sem foco medidos a 1440 px | Nome do cliente como `<button>` ou link para `?id=` dentro da linha, mantendo a linha clicável para mouse |
| 6 filtros sem nome acessível | alto (P1) | WCAG 1.3.1, 3.3.2, 4.1.2 | Árvore de acessibilidade: 6 `combobox`; `Filtro` em `Indicacoes.tsx:306` com `Label` sem `htmlFor` | Ver transversal |
| Lista inteira sem paginação nem virtualização | médio (P2) | Skill `wise-design-system` §5 (`DataTable` com paginação); skill `performance` (listas longas) | 93 linhas: 8.564 px a 1440 e 18.715 px a 375 | `DataTable` com paginação de 25 ou 50 |
| Pílulas apertadas nas células | baixo (P3) | Detector `cramped-padding` (24, verdadeiro) | 3,5 px acima e abaixo de texto de 12 px; `Selos.tsx:31` (`py-0.5`) | `py-1` no `StatusBadge` |

### 5.8 Comissões

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Alvos pequenos no celular | baixo (P3) | Skill §4 | 37 de 40 alvos abaixo de 44 px e 14 abaixo de 24 px a 375 px (passam 2.5.8) | Abas e "Mudar estado" com 44 px no celular |
| Só o `h1` como título | baixo (P3) | WCAG 1.3.1 (boa prática) | Árvore de acessibilidade | Títulos por grupo (a pagar, a receber) |

Sem outros achados técnicos (contraste, rótulos, marcos e detector limpos).

### 5.9 Base Ativa

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Abas de 32 px e link de 24 px no celular | baixo (P3) | Skill §4 | "Fila (1)" 64x32, "Fomento Já" 89x24 a 375 px | Ver transversal |

Sem outros achados técnicos.

### 5.10 Atividades

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Alvos abaixo de 44 px | baixo (P3) | Skill §4 | 31 de 33 alvos a 375 px | Ver transversal |

Sem outros achados técnicos; é a tela interna mais limpa.

### 5.11 Configurações

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| 18 campos sem nome acessível (aba Empresas e comissões) | alto (P1) | WCAG 1.3.1, 3.3.2, 4.1.2 | Árvore de acessibilidade: 12 `textbox`, 6 `spinbutton`; `TabelaConfig.tsx:227` | Ver transversal |
| pdf-lib carregado na abertura | médio (P2) | Skill `performance` | Rede: `pdf-CkH_3zX9.js`; 758 KB gzip de JS; cadeia `SecoesV2.tsx:19` → `gestao/Remuneracoes.tsx:20` → `gestao/formato.ts:3` | Mesma correção do painel |
| Textos de 11 px | baixo (P3) | Skill §3 | `SecoesV2.tsx:280` e `:329` | 12 px |

### 5.12 Portal do parceiro, início `/parceiro`

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Cartões-link e links "Ver ..." com o anel de foco fraco | médio (P2) | WCAG 2.4.7, 1.4.11 | Tabulação: 7 alvos principais do conteúdo com `rgba(0,225,147,.18)`; `b-portal-inicio-foco-teclado-1440.jpg` | Ver transversal (anel único) |
| Ações principais como links de texto de 20 px | médio (P2) | Skill §4 (44 px no celular); WCAG 2.5.8 passa só por espaçamento | "Ver meu nível" 104x20, "Ver ações conjuntas" 151x20, "Ver comunicados" 134x20, e-mail 258x20 a 375 px | Botões secundários de 44 px ou cartão inteiro clicável |
| Contador de comunicados não lidos com `aria-label` num `span` | baixo (P3) | WCAG 4.1.2 | `ParceiroLayout.tsx:66` e `:67` | Texto visualmente oculto ou rótulo no link |

### 5.13 Portal do parceiro, indicações `/parceiro/indicacoes`

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Abas de 32 px no celular | baixo (P3) | Skill §4 | "Feitas (4)" 85x32, "Recebidas (5)" 116x32 a 375 px | Ver transversal |

Sem outros achados técnicos.

### 5.14 RFP pública `/r/<token>`

| Problema | Gravidade | Regra violada | Evidência | Correção sugerida |
|---|---|---|---|---|
| Página sem marco `main` | médio (P2) | WCAG 1.3.1 e 2.4.1 (marcos) | Árvore de acessibilidade: só banner e contentinfo; conteúdo entre `header` e `footer` de `ConteudoPaginaRfp.tsx:20` e `:28` sem `<main>` | Envolver as seções em `<main>` |
| 229 KB de JS para uma página pública de 3,5 KB de código próprio; LCP com folga de 0,3 s | médio (P2) | Skill `performance` (caminho crítico) | 4G lento: LCP 2.188 a 2.236 ms, FCP 1.680 a 1.724 ms; 222 KB são o chunk principal; LCP depende da chamada ao PostgREST | Entrada pública separada (sem Radix, React Query e layout interno), dados da página pré-buscados ou renderizados no servidor |
| Título público sem Baloo 2 (fonte nem carregada) | baixo (P3) | Skill `wise-design-system` §3 (títulos de páginas públicas em Baloo 2) | `ConteudoPaginaRfp.tsx:46` sem `font-display`; `document.fonts` sem Baloo 2; DESIGN #12 | `font-display` no `h1` e pré-carga da fonte |
| E-mail e telefone de contato com 20 px de altura | baixo (P3) | Skill §4 | 301x20 a 375 px | Área de toque de 44 px |

## 6. Cinco problemas técnicos principais

1. **Indicações inacessível por teclado no computador (P0).** As 93 linhas abrem o detalhe só com clique (`src/pages/app/Indicacoes.tsx:254`); nenhum elemento da linha recebe foco. WCAG 2.1.1, nível A.
2. **Campos sem rótulo associado em 5 componentes de campo (P1).** 43 controles sem nome acessível em lista de parceiros, indicações, ficha e configurações; o mesmo `Label` sem `htmlFor` copiado em `parceiros/ui.tsx:32`, `Indicacoes.tsx:306`, `TabelaConfig.tsx:227`, `NovaIndicacaoDialog.tsx:291` e `DetalheIndicacao.tsx:270`. Um `Campo` único no kit corrige todos.
3. **Foco quase invisível (P1).** O anel global de `src/index.css:37` tem 1,42:1; atinge toda a navegação, links e cartões-link do app e do portal. Junto, a borda de campo a 1,58:1 descumpre a regra de 3:1 da skill.
4. **pdf-lib (510 KB gzip) carregado no painel, na ficha e em configurações (P1).** Um helper de formatação (`gestao/formato.ts:3` importa `baixarBlob` de `lib/pdf.ts`, que importa `pdf-lib` de forma estática) leva o painel a 745 KB gzip de JS, duas vezes e meia o orçamento de 300 KB; a ficha chega a 879 KB com o docxtemplater.
5. **Sistema de tokens ausente na prática (P2, sistêmico).** 308 raios arbitrários, 322 brancos translúcidos soltos, 38 cores da paleta Tailwind, 39 tamanhos de fonte fora da escala, 0 `tabular-nums`, 0 `prefers-reduced-motion` e HSL que não reproduz os hex da marca. É a base de todas as divergências do DESIGN.md e deve vir antes do redesenho das telas.
