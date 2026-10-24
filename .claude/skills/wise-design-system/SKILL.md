---
name: wise-design-system
description: Identidade visual, tokens, tipografia, componentes canônicos e voz do Portal Wise Partners. Use em qualquer tarefa que crie ou altere tela, componente, estilo, texto de interface, e-mail ou PDF do portal, inclusive quando outra skill de design estiver ativa.
---

# Wise Design System para o Portal Wise Partners

Esta skill manda na identidade do portal. Outras skills de design (Impeccable, UI/UX Pro Max, shadcn, Emil) ajudam com método, crítica e técnica, mas **nunca trocam a marca**: paleta, fontes, voz e regras abaixo prevalecem sobre qualquer sugestão de estilo, paleta ou "direção estética" vinda delas.

Leia também `referencias/tokens.md` antes de mexer em cores, superfícies ou gráficos.

## 1. Personalidade

Software de gestão para quem vende por relacionamento. Sério, calmo e preciso, como Linear, Stripe Dashboard e Attio, com a assinatura da Wise: fundo quase preto, texto branco e verde menta usado com parcimônia para o que importa. Nada de gradiente decorativo, vidro, sombra pesada, ilustração genérica ou emoji em interface.

## 2. Regras de cor

* O menta `#00E193` é **sinal**, não decoração: botão principal, item ativo, a série principal de um gráfico, o número que bateu a meta. Se mais de 10% da área visível da tela está menta, há excesso.
* Hierarquia por superfícies (do fundo para cima): `surface-0` fundo, `surface-1` áreas, `surface-2` cards, `surface-3` hover e cards elevados, `surface-4` popovers e campos. Diferencie camadas por superfície e borda fina, não por sombra.
* Cores semânticas só com significado: sucesso (menta), alerta (`#F5A623`), perigo (`#F0473A`), informação (azul do token). Nunca use vermelho para "negativo" neutro (por exemplo, uma redução de custo).
* Cores de nível (Elite, Premium, Select) só em selos, marcações de nível e gráficos que separam níveis, com as variantes claras do `tokens.md`. Em texto para parceiro e cliente, o nível aparece pelo nome, nunca pela letra.
* Contraste mínimo AA: 4,5:1 para texto, 3:1 para elementos gráficos e bordas de campos.

## 3. Tipografia

* **Plus Jakarta Sans** para toda a interface. **Baloo 2** só para o número principal de uma tela e para títulos de páginas públicas (RFP, link de indicação). Nunca para tabelas, botões ou rótulos.
* Escala: 12, 13, 14, 16, 18, 22, 28, 36, 48. Corpo 14; tabelas 13; rótulos 12; título de página 22 ou 28; número principal 36 ou 48.
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

Discreto e funcional: 120 a 200 ms, `ease-out` para entrar, sem bounce. Anima mudança de estado (abrir, filtrar, salvar), nunca decoração em loop. Respeite `prefers-reduced-motion`.

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
