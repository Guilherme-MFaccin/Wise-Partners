---
name: wise-design-system
description: Identidade visual, tokens, tipografia, componentes canônicos e voz do Portal Wise Partners. Use em qualquer tarefa que crie ou altere tela, componente, estilo, texto de interface, e-mail ou PDF do portal, inclusive quando outra skill de design estiver ativa.
---

# Wise Design System para o Portal Wise Partners

Desde 26/11/2026 a **forma** do portal segue a skill `apple-design` (regra número 1 do CLAUDE.md): layout, hierarquia, tipografia, espaçamento, materiais, movimento, modo claro e escuro e acessibilidade. Esta skill guarda a **marca**: logo, verde menta como destaque, cores de estado e de nível, voz e as regras de texto. Onde as duas falam do mesmo assunto, vale a `apple-design` para a forma e esta para a marca. Outras skills de design (Impeccable, UI/UX Pro Max, shadcn, Emil) ajudam com método, crítica e técnica, sem trocar nenhuma das duas.

Leia também `referencias/tokens.md` antes de mexer em cores, superfícies ou gráficos.

## 1. Personalidade

Software de gestão para quem vende por relacionamento. Sério, calmo e preciso, com o acabamento dos apps da Apple e a assinatura da Wise: verde menta usado com parcimônia para o que importa. No escuro, fundo quase preto e texto branco; no claro, fundo cinza agrupado (`#f5f5f7`) com cartões brancos. Materiais translúcidos só nas barras e folhas (menu lateral, barra do topo, diálogos), nunca como enfeite. Nada de gradiente decorativo, sombra pesada, ilustração genérica ou emoji em interface.

## 2. Regras de cor

* O menta `#00E193` é **sinal**, não decoração: botão principal, item ativo, a série principal de um gráfico, o número que bateu a meta. Se mais de 10% da área visível da tela está menta, há excesso.
* Hierarquia por superfícies: fundo, cartões e, por cima, menus e diálogos. Diferencie camadas por superfície e borda fina; sombra só suave nos cartões do modo claro e nos elementos flutuantes (`sombra-cartao`, `sombra-flutuante`).
* Toda cor sai de token e tem par no claro e no escuro (`src/index.css`). `white`, `neutro`, `menta-200` a `menta-400`, `red-200`, `red-300`, `sky-300`, `violet-200` e `violet-300` acompanham o tema; o menta de botão (`menta-500`, `primary`) é o mesmo nos dois. Branco literal sobre foto ou cor sólida: `puro`.
* Cores semânticas só com significado: sucesso (menta), alerta (`#F5A623`), perigo (`#F0473A`), informação (azul do token). Nunca use vermelho para "negativo" neutro (por exemplo, uma redução de custo).
* Cores de nível (Elite, Premium, Select) só em selos, marcações de nível e gráficos que separam níveis, com as variantes claras do `tokens.md`. Em texto para parceiro e cliente, o nível aparece pelo nome, nunca pela letra.
* Contraste mínimo AA: 4,5:1 para texto, 3:1 para elementos gráficos e bordas de campos.

## 3. Tipografia

* **Fonte do sistema** (`font-sans`: SF Pro no Mac e no iPhone, Segoe UI no Windows, Roboto no Android), como pede a `apple-design`. **`font-display`** (a versão arredondada do sistema, SF Pro Rounded) só para o número principal de uma tela e para títulos de páginas públicas. Nunca para tabelas, botões ou rótulos. Os PDFs continuam com as fontes embutidas em `public/fonts`.
* Escala do `tailwind.config.ts`, com entrelinha e espaçamento por tamanho: texto grande aperta (título de página com -0,024em), texto pequeno abre levemente. Corpo 14; tabelas 13; rótulos 12; título de página 28 no celular e 34 no computador; número principal 36 ou 48.
* Números sempre com `tabular-nums` em tabelas, KPIs e eixos.
* Pesos: 400 texto, 500 rótulos e células, 600 títulos, 700 números de destaque. Evite 800 fora de páginas públicas.

## 4. Espaço, forma e densidade

* Grade de 4 px. Espaços usados: 4, 8, 12, 16, 20, 24, 32, 48.
* Raio: 14 px em cards e diálogos, 10 px em campos e botões, 6 px em selos, círculo em avatares e pílulas.
* Densidade de ferramenta de trabalho: linha de tabela de 40 px (44 px no celular), cards com 16 a 20 px de respiro, nada de seções de 600 px de altura com um número só.
* Largura de leitura: texto corrido até 68 caracteres.

## 5. Componentes canônicos

Antes de criar qualquer elemento, procure no kit (`src/components/kit/`) e no shadcn. Só crie novo se não existir, e então coloque no kit e na vitrine (`/app/vitrine`).

| Componente | Uso |
|---|---|
| `PageHeader` | Título, pergunta que a tela responde, contexto (período, filtro ativo) e ações. Toda página interna começa com ele |
| `KpiTile` | Número com rótulo, comparação (delta com seta e cor semântica), meta opcional, minigráfico opcional e link para o detalhe |
| `HeroMetric` | O número principal da tela, em Baloo 2, com meta e tendência |
| `ChartCard` | Moldura de gráfico com título que é uma frase de leitura ("Indicações cresceram 18% no trimestre"), legenda, alternância "ver dados" e estados |
| `BarList` | Ranking horizontal com barra proporcional, valor e link por linha |
| `DataTable` | TanStack Table: ordenação, filtro, colunas fixas, densidade, paginação no cliente, exportação, linha clicável |
| `FilterBar` | Filtros e período com estado na URL |
| `StatusBadge`, `NivelBadge` | Estados e níveis, com ícone além da cor |
| `EmptyState` | O que é a tela, por que está vazia e a ação para preencher |
| `Skeleton` por formato | Esqueleto com o desenho real do componente |
| `Timeline` | Linha do tempo de contatos, histórico e onboarding |
| `Stepper` | Etapas com progresso (onboarding, revisão de nível) |

## 6. Estados obrigatórios

Toda tela e todo componente de dados tem: carregando (esqueleto do formato), vazio (explica e oferece ação), erro (mensagem humana e "tentar de novo"), parcial (dados incompletos sinalizados), sem permissão. Valor zero aparece como `0` em tom secundário, nunca some.

## 7. Movimento

Segue a `apple-design`: resposta ao pressionar (`pressionavel`, escala 0,97 em 100 ms), menus e popovers nascem do botão que os abriu, folhas com a curva `ease-folha` e diálogos com `ease-saida`. Sem bounce, a não ser em gesto com impulso. Anima mudança de estado, nunca decoração em loop. Respeite `prefers-reduced-motion`, `prefers-reduced-transparency` e `prefers-contrast` (já tratados em `src/index.css`).

## 8. Voz e texto

* Português do Brasil, frase com inicial maiúscula e o resto minúsculo, verbo no botão ("Registrar contato", não "Novo").
* **Nunca use travessão nem meia-risca** em nenhum texto: interface, e-mail, PDF, comentários de código voltados a texto, nem em dados de exemplo. Use vírgula, dois-pontos ou ponto.
* Moeda `R$ 1.234,56`; percentual `12,5%`; datas `24 out 2026` em tabelas e `24/10/2026` em formulários; tempo relativo ("há 3 dias") só em listas de atividade.
* "Mentoria mensal", nunca "webinário". Base Ativa nunca aparece como opcional para parceiros.
* Títulos de gráfico dizem o que ver, não o que é: "Conversão caiu na etapa de proposta" é melhor que "Funil de conversão".

## 9. Antes de entregar uma tela

1. Usa só tokens (nenhuma cor, fonte ou espaço solto no código).
2. Tem os cinco estados da seção 6.
3. Passou na largura de 375, 768 e 1440 px, com captura de tela conferida.
4. Nenhum texto com travessão.
5. Contraste AA conferido nos textos secundários e nos gráficos.
