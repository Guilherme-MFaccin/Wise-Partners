# A3: Portal do parceiro (Início, Indicações) e página pública de RFP

Avaliação A (revisão de design) da crítica Impeccable. Só diagnóstico: nada foi alterado em `src/` nem em `supabase/`.

**Escopo**: `/parceiro` (Início), `/parceiro/indicacoes` (Indicações) e `/r/:token` (página pública de RFP). Largura principal: 375 px.

**Base da avaliação**
* Método: `impeccable/reference/critique.md`, Avaliação A, com o guia de pontuação de Nielsen, a carga cognitiva, as personas e a gravidade P0 a P3 (P0 = crítico, P1 = alto, P2 = médio, P3 = baixo).
* Regras: `wise-design-system` (com `tokens.md`), `wise-dashboards` (com `mapa-de-telas.md`), `mobile-native` e `web-design-guidelines` (Vercel). O WebFetch das diretrizes da Vercel funcionou, mas devolveu um resumo por seção e não o texto literal. As referências "web-design-guidelines: <seção>" usam os nomes dessas seções.
* Evidência: capturas em `docs/ux/capturas/antes/` com dados de demonstração (usuária Ana, responsável da Sistemas Araucária, parceira Elite), leitura do código e medições no navegador.
* Capturas extras feitas para esta parte, todas em 375 px: `portal-inicio-dobra-375.jpg` (primeira dobra, 375 x 812), `portal-menu-aberto-375.jpg`, `portal-indicacoes-recebidas-375.jpg`, `portal-nova-indicacao-375.jpg`, `rfp-publica-dobra-375.jpg`, `rfp-publica-link-invalido-375.jpg` e `rfp-publica-carregando-375.jpg` (rede limitada a cerca de 1,6 Mbps com 300 ms de latência).
* Limite: tudo foi visto em Chromium emulando celular. Pela regra 5 da `mobile-native`, hover preso, destaque de toque, zoom em campo, áreas seguras e teclado precisam ser confirmados num aparelho real.

Medições que aparecem nas tabelas:
* Alvos de toque abaixo de 44 px: na Início, "Ver meu nível", "Ver ações conjuntas", "Ver comunicados" e o e-mail do responsável têm 20 px de altura; o sino tem 36 x 36 e o menu 40 x 40. Nas Indicações, as abas "Feitas" e "Recebidas" têm 32 px. Na RFP, os botões "Falar com este parceiro" têm 40 px, e o e-mail e o telefone do consultor têm 20 px.
* Altura da Início em 375 px: 2.516 px, ou seja, pouco mais de 3 telas.
* RFP: o título (h1) está em Plus Jakarta Sans. O `<head>` só tem `charset`, `viewport`, `theme-color` e o `robots` injetado por JS, sem nenhuma meta Open Graph. São transferidos 232 KB de JS e CSS, dos quais 217 KB são o pacote principal do app. Com a rede limitada, o h1 aparece em cerca de 2,9 s.
* Foco: `:focus-visible` global em `src/index.css` é `box-shadow: 0 0 0 3px rgba(0,225,147,.18)`. Sobre o card #1c1c20, isso dá cerca de 1,6:1, abaixo do mínimo de 3:1. Os botões do shadcn têm anel próprio; links, `NavLink` e cards-link ficam só com essa sombra fraca.

---

## 1. Portal do parceiro, Início (`/parceiro`)

### Pergunta da tela
**"Como está a minha parceria e o que faço agora?"** (mapa-de-telas, Portal do parceiro, Início)

**Responde? Não.** No celular, a primeira dobra mostra a saudação, um botão para um site externo (Wise Hub) e uma ficha estática (parceria, nível, pacote, data de início, responsável): só dados que nunca mudam. O "como está" depende do nível, e o card "Nível Elite" traz uma frase genérica, sem dizer se os requisitos estão em dia. O "o que faço agora" só aparece na terceira tela ("Ações da semana", com 5 itens "atrasada" sem data e sem ação). Faltam o herói e os indicadores de apoio que o mapa pede (indicações no ano, clientes fechados, comissões recebidas), e não há "indicar um cliente".

### Veredito de especificidade de design
**Genérico.** É a grade de cards de mesmo peso da v1 que a `wise-dashboards §1` manda abandonar: caixa com rótulo em caixa alta, card com ícone menta e link "Ver ...", três contadores iguais e duas listas longas. Trocando o logo, serviria a qualquer portal de parceiros. A marca aparece só na paleta. A Baloo 2 não aparece no número principal, e nada usa o que é próprio deste produto, como os três grupos do nível, a régua de 90 dias ou a comissão a receber.

### Heurísticas de Nielsen

| # | Heurística | Nota | Motivo |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 2 | Mostra atrasos, mas esconde se o nível está em risco. Quando uma consulta falha, aparece 0 em vez de erro |
| 2 | Correspondência com o mundo real | 2 | "Pacote A · Base Ativa", "Contrapartidas" e tarefas internas da Wise escritas na voz da Wise |
| 3 | Controle e liberdade | 3 | Navegação simples, sem ações destrutivas |
| 4 | Consistência e padrões | 2 | O check menta quer dizer "incluído" num bloco e "feito" no outro. Os contadores misturam conceitos ("feitas e recebidas") |
| 5 | Prevenção de erros | 3 | Pouco risco na tela, que é quase só leitura |
| 6 | Reconhecer em vez de lembrar | 2 | Ações atrasadas sem data nem atalho para comprovar. O parceiro precisa abrir outra tela para agir |
| 7 | Flexibilidade e eficiência | 1 | Indicar exige abrir a gaveta, rolar e escolher entre "Indicar" e "Indicações". Não há atalho na Início |
| 8 | Estética e minimalismo | 2 | 9 blocos de mesmo peso, um checklist de 10 entregas e menta em todos os títulos |
| 9 | Reconhecer, diagnosticar e recuperar erros | 1 | `ErroCarga` mostra a mensagem técnica sem "tentar de novo". Falhas parciais ficam silenciosas |
| 10 | Ajuda e documentação | 2 | "Regras do programa" existe no menu, mas não há ajuda no ponto de decisão (o que conta para o nível) |
| | **Total** | **20/40** | Aceitável, no limite inferior |

### Carga cognitiva
Itens que falham no checklist (5 de 8, carga **alta**):
* **Foco único**: o Wise Hub (externo) disputa o topo com a ficha cadastral; nenhum bloco domina.
* **Agrupamento em até 4**: "Entregas da Wise" tem 10 itens, "Primeiros passos" tem 7 e a gaveta de navegação tem 17 itens planos.
* **Hierarquia visual**: todos os blocos usam o mesmo card com título de 16 px, 600, e ícone menta.
* **Poucas escolhas**: 17 destinos no menu, mais 6 links e 3 contadores clicáveis na página.
* **Revelação progressiva**: as entregas do pacote e as tarefas de onboarding aparecem inteiras sempre, mesmo para um parceiro assinado há 8 meses.

**Jornada emocional**: a tela abre com um "Olá, Ana" caloroso e depois mostra dados de cadastro. O primeiro sinal com carga emocional é uma coluna de cinco "atrasada" em âmbar, sem dizer quanto nem o que fazer. A tela termina numa lista de tarefas que o parceiro não pode cumprir. O fim fica com sensação de dívida, não de progresso: o oposto do que a vitrine da Wise para o parceiro deveria deixar (regra do pico e do fim).

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A primeira dobra no celular é gasta com a ficha estática (parceria, nível, pacote, início, responsável) e com um link externo. Nada responde "como está" nem "o que faço agora" | alto | wise-dashboards §2 e §3; Nielsen #8 | portal-inicio-dobra-375.jpg (375) | Abrir com o herói do nível e a próxima ação. Mover a ficha para "Nossa parceria" ou para um bloco recolhido no fim da página |
| Sem herói de nível: o card "Nível Elite" não mostra o progresso nos três grupos. Quando os requisitos atuais não estão cumpridos (`nivel.atual.cumpre` falso), mostra só "Veja o que manter em dia" e esconde o risco de rebaixamento | alto | mapa-de-telas (Início, herói); wise-dashboards §3.1; PRODUCT princípio 4 | portal-inicio-375.jpg (375), portal-inicio-1440.jpg (1440) | `HeroMetric` com o nome do nível em Baloo 2, `Stepper` com os três grupos (cumprido ou faltando) e o estado "em dia" ou "em risco até a revisão de DD/MM", com o que falta em até 3 itens |
| Não existe "Indicar um cliente" na Início. A única ação em destaque é "Acessar o Wise Hub", que leva para fora do portal | alto | mapa-de-telas (Início, ação: indicar um cliente); wise-dashboards §3.4; persona Casey (zona do polegar) | portal-inicio-dobra-375.jpg (375) | Botão principal "Indicar um cliente" (abre o formulário e oferece "copiar meu link exclusivo"). O Wise Hub vira link secundário |
| Os indicadores de apoio estão errados e sem contexto. "Indicações 9, feitas e recebidas" soma os dois sentidos sem recorte de ano. "4 pendentes, 4 atrasadas" são conjuntos disjuntos (o código conta `pendente` e `recusada` de um lado e `atrasada` do outro) que se leem como subconjunto, e na verdade há 8 em aberto. Faltam clientes fechados e comissões recebidas. Nenhum número tem comparação | alto | mapa-de-telas (Início, apoio); wise-dashboards §3 ("todo número tem contexto"); wise-design-system §5 (`KpiTile`) | portal-inicio-375.jpg (375), portal-inicio-768.jpg (768) | Três `KpiTile`: indicações feitas no ano (contra o ano anterior), clientes fechados (com a taxa) e comissões recebidas em R$ (com o valor a receber). Contrapartidas saem dos números e vão para a lista de ação |
| "Primeiros passos" mostra tarefas internas da Wise, escritas do ponto de vista da Wise ("Criar o grupo de WhatsApp... com o parceiro", "Solicitar logo, cores e dados cadastrais"), como se fossem afazeres do parceiro: círculo vazio e prazo "até 27/10/2026". O parceiro não consegue concluir nenhuma | alto | Nielsen #2; PRODUCT princípio 4; wise-design-system §8 (voz) | portal-inicio-375.jpg (375), portal-inicio-1440.jpg (1440) | Renomear para "O que a Wise está preparando para vocês", reescrever na voz do parceiro, usar ícone e estado "a Wise está fazendo" e mostrar só durante o onboarding |
| "Ações da semana": 5 itens "atrasada" sem data nem dias de atraso, linhas não clicáveis e sem "Comprovar". "Conteúdo conjunto (post, live ou artigo)" aparece duas vezes, uma de cada lado, e parece duplicado | médio | mapa-de-telas (Início, ação: comprovar uma ação); wise-dashboards §3.4 (próximo passo clicável); Nielsen #6 | portal-inicio-375.jpg (375) | Linha clicável com "atrasada há 12 dias", o lado como rótulo ("Com vocês", "Com a Wise") e o botão "Comprovar", que abre o `EnviarComprovacaoDialog` já existente |
| Falhas silenciosas: se a consulta de contrapartidas, indicações ou RFP falhar, os contadores mostram 0 e "Nenhuma atrasada" (dado falso). O erro principal mostra `erro.message` cru, sem "tentar de novo" | médio | wise-design-system §6 (estados de erro e parcial); Nielsen #9 | (código: `Inicio.tsx` linhas 58 a 64 e 196 a 200) | Estado de erro por bloco ("Não carregou. Tentar de novo") e o estado parcial sinalizado. Nunca transformar falha em 0 |
| A página tem 9 blocos de mesmo peso e 2.516 px no celular (pouco mais de 3 telas). "Entregas da Wise no seu pacote" lista 10 itens com check menta, que se lê como "entregue" | médio | wise-dashboards §1 e §3; wise-design-system §2 (menta é sinal); carga cognitiva (agrupamento) | portal-inicio-375.jpg (375) | Entregas vão para "Nossa parceria" ou ficam recolhidas, com ícone neutro. A Início fica com herói, apoio, ação e comunicados |
| A navegação no celular é uma gaveta com 17 itens planos, sem agrupamento e sem barra inferior. Indicar e Indicações pedem 2 toques e rolagem | médio | mapa-de-telas (agrupar pela rotina); carga cognitiva (8 ou mais itens, sobrecarga); persona Casey | portal-menu-aberto-375.jpg (375) | Barra inferior com 4 destinos (Início, Indicar, Indicações, Mais), com `env(safe-area-inset-bottom)`. A gaveta "Mais" agrupa: Minha parceria, Aprender, Ida ao mercado, Conta |
| O logo fica esticado na gaveta: o `<img>` com `w-auto` é esticado pelo `flex-col` (alinhamento padrão `stretch`) | médio | wise-design-system §1 (assinatura da marca) | portal-menu-aberto-375.jpg (375) | `self-start` no logo, mais `width` e `height` explícitos na `<img>` (corrige também a página de link indisponível) |
| Foco visível quase invisível em links, `NavLink` e cards-link: sombra menta a 18%, cerca de 1,6:1 | médio | web-design-guidelines (Focus States); wise-design-system §2 (3:1 para elementos gráficos); persona Sam | (código: `src/index.css`, `:focus-visible`) | Anel de 2 px menta sólido com afastamento de 2 px, só em `:focus-visible` |
| Menta diluído: ícone menta em todos os títulos de card, nos links "Ver ...", nos 10 checks, nos contadores e no selo do sino | médio | wise-design-system §2 (menta é sinal, não decoração) | portal-inicio-1440.jpg (1440), portal-inicio-375.jpg (375) | Ícones de título em `text-secondary`. Menta só no botão principal, no estado "em dia" e no número que bateu a meta |
| Alvos de toque pequenos: "Ver meu nível", "Ver ações conjuntas", "Ver comunicados" e o e-mail do responsável com 20 px de altura; sino com 36 px | médio | mobile-native (alvos de toque, persona Casey: 44 pt); web-design-guidelines (Touch & Interaction) | portal-inicio-dobra-375.jpg (375) | Altura mínima de 44 px (`min-h-11`, com padding vertical), ou o card inteiro clicável |
| O responsável na Wise aparece só com e-mail. No celular, o parceiro quer WhatsApp ou ligação | médio | Nielsen #7; PRODUCT (parceiro usa celular) | portal-inicio-dobra-375.jpg (375) | Botões "WhatsApp" e "Ligar" ao lado do nome, num bloco de contato perto da ação |
| "Pacote A · Base Ativa": a letra de código interno aparece para o parceiro | baixo | wise-design-system §2 (para parceiro, pelo nome, nunca pela letra; mesmo espírito para pacote); Nielsen #2 | portal-inicio-375.jpg (375) | Mostrar só "Base Ativa" e trocar `PACOTES` para rótulos sem letra no portal |
| Tipografia fora da escala: h1 com 24 px (a escala pede 22 ou 28), número do sino e da gaveta com 11 px, contadores sem `tabular-nums`, "4 pendentes" em 24 px misturando número e palavra | baixo | wise-design-system §3 | portal-inicio-375.jpg (375) | h1 com 22 px no celular e 28 no desktop, selos com 12 px, `tabular-nums`, número e rótulo separados no `KpiTile` |
| O cabeçalho não traz a pergunta da tela, e o subtítulo "Portal Wise Partners de Sistemas Araucária" só repete o contexto | baixo | wise-dashboards §2 | portal-inicio-dobra-375.jpg (375) | Subtítulo com o estado em uma frase: "Elite, requisitos em dia. 2 ações para esta semana." |
| Hover sem condição (o card contador fica com borda menta presa depois do toque), sem `-webkit-tap-highlight-color` e sem `touch-action: manipulation`. O cabeçalho fixo usa `backdrop-blur` (efeito de vidro) | baixo | mobile-native §1, §2 e §5; wise-design-system §1 (sem vidro) | (código: `tailwind.config.ts`, `src/index.css`, `ParceiroLayout.tsx`) | `future.hoverOnlyWhenSupported` no Tailwind 3, base CSS da `mobile-native` e cabeçalho com `surface-0` sólido |
| Carregamento mostrado como texto "Carregando..." no centro, sem esqueleto com o formato | baixo | wise-design-system §6 | (código: `Estados.tsx`) | `Skeleton` com o formato do herói e dos `KpiTile` |

### Pontos fortes
* **Comunicados não lidos** com contagem e título na própria Início, e o aviso da pesquisa de satisfação ("leva menos de 1 minuto") condicionado a quem ainda não respondeu: bons exemplos de "o que faço agora".
* **O nível aparece pelo nome** ("Elite") em todo lugar, com o selo nas cores corretas do nível, como pede a regra da marca.
* A lógica do Wise Hub (só para pacotes que o incluem e só depois da assinatura) e o aviso "parceria ainda em conversa" mostram cuidado com as regras do programa.

### Sinais de alerta por persona

**Dono da empresa parceira, no celular entre duas visitas a clientes** (deriva da Casey e do PRODUCT: usa uma mão, tem 30 segundos, conexão variável)
* Abre a Início e a tela inteira é cadastro. Precisa rolar quase 3 telas para achar algo para fazer.
* Acabou de sair de um cliente com uma oportunidade: não há "Indicar" na Início. A gaveta tem 17 itens e dois com nome parecido ("Indicar" e "Indicações").
* Vê 5 "atrasada" e não sabe se é grave, desde quando nem o que fazer. Não há botão "Comprovar".
* Quer saber "quanto já ganhei com a Wise": comissões recebidas não aparecem na Início.
* Quer falar com o Guilherme: só tem o e-mail, e o link tem 20 px de altura.
* Vê "Primeiros passos" com 7 círculos vazios vencendo em 3 dias e acha que está devendo tarefas que, na verdade, são da Wise.

**Sam (leitor de tela e teclado)**: os links e os cards-link perdem o foco visível (sombra a 18%). O "atrasada" é texto, o que é bom, mas a lista não tem `<time>` nem data legível.

---

## 2. Portal do parceiro, Indicações (`/parceiro/indicacoes`)

### Pergunta da tela
O mapa diz: "Meu nível, Capacitação, Ranking, Indicações: mesmas regras, sempre com o próximo passo explícito". Do ponto de vista do parceiro: **"Minhas indicações estão andando, quanto vou ganhar e o que preciso fazer agora?"**

**Responde? Em parte.** Mostra a etapa e o estado da comissão de cada indicação, mas não há visão de conjunto (quantas no ano, quantas fecharam, quanto a receber). Também não diz o próximo passo: em "Recebidas", todos os cartões têm o mesmo "Atualizar resultado", sem dizer quais estão parados ou esperando o parceiro. A ordem é por data, não por urgência.

### Veredito de especificidade de design
**Genérico.** Abas do shadcn e uma lista de cards com título, linha cinza, pílula colorida e uma linha de texto. A razão social completa domina o desenho. Nada mostra o caminho de uma indicação (nova, contato, reunião, proposta, fechada) nem a comissão, que é o que torna esta tela própria do programa.

### Heurísticas de Nielsen

| # | Heurística | Nota | Motivo |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 2 | A etapa aparece, e a atualização "aguardando confirmação da Wise" é um ótimo sinal. Faltam a última movimentação e o prazo de resposta |
| 2 | Correspondência com o mundo real | 2 | Razão social completa no lugar do nome que o parceiro usa. "Aguardando compensação" é jargão |
| 3 | Controle e liberdade | 3 | O diálogo tem "Cancelar". Não há ação destrutiva |
| 4 | Consistência e padrões | 2 | "Proposta" em âmbar (cor de alerta). "Nova indicação" aqui e "Indicar" no menu |
| 5 | Prevenção de erros | 2 | No formulário, campos de contato só com placeholder, CNPJ sem máscara e sem aviso de cliente já indicado |
| 6 | Reconhecer em vez de lembrar | 2 | O cartão não abre detalhe: histórico, contato e motivo de perda ficam fora de alcance |
| 7 | Flexibilidade e eficiência | 1 | Sem busca, filtro ou ordenação, e a aba ativa não vai para a URL |
| 8 | Estética e minimalismo | 2 | O título de 3 linhas empurra status e comissão. Quatro cartões ocupam a tela inteira |
| 9 | Reconhecer, diagnosticar e recuperar erros | 2 | O toast de erro existe, mas a falha de carga mostra a mensagem técnica sem "tentar de novo" |
| 10 | Ajuda e documentação | 2 | O vazio de "Feitas" orienta. O de "Recebidas" não explica nada. Não há ajuda sobre comissão |
| | **Total** | **20/40** | Aceitável, no limite inferior |

### Carga cognitiva
Itens que falham (3 de 8, carga **moderada**):
* **Hierarquia visual**: o nome jurídico em 16 px, 600, com 3 linhas, pesa mais que a etapa e a comissão, que são o que o parceiro procura.
* **Memória de trabalho**: para saber o que falta numa indicação, o parceiro precisa lembrar o que combinou com a Wise, porque a tela não mostra histórico nem próximo passo.
* **Revelação progressiva** (formulário): 3 opções de empresa com descrições longas, 7 campos e um consentimento numa única rolagem. Não há passo a passo nem campos que só aparecem quando fazem falta (o consentimento já aparece sob demanda, o que é bom).

**Jornada emocional**: o momento de pico é ver uma "Fechada" com "R$ 7.800,00", mas ele fica enterrado no terceiro cartão, em texto de 14 px igual aos demais. Não há celebração nem total acumulado. Em "Recebidas", cinco botões iguais de "Atualizar resultado" passam a sensação de cobrança genérica.

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A tela não responde à pergunta: não há resumo (feitas no ano, fechadas, comissão a receber e recebida) nem próximo passo por indicação. É só uma lista cronológica | alto | mapa-de-telas (Portal, Indicações: próximo passo explícito); wise-dashboards §2 e §3 | portal-indicacoes-375.jpg (375), portal-indicacoes-1440.jpg (1440) | Faixa com 3 `KpiTile` no topo (feitas no ano contra o ano anterior, clientes fechados, comissão a receber e recebida). Em cada cartão, a linha "Agora: a Wise marca a reunião até DD/MM" |
| Em "Recebidas", todos os cartões têm "Atualizar resultado" com o mesmo peso, em ordem de data. Não aparece qual está parado nem qual espera o parceiro | alto | wise-dashboards §3.4 (lista de trabalho ordenada por urgência); Nielsen #1 | portal-indicacoes-recebidas-375.jpg (375) | Bloco "Precisam da sua atualização" no topo ("sem atualização há 15 dias"), o resto abaixo. O botão aparece só onde faz sentido, e as fechadas e perdidas ficam em leitura |
| A razão social completa ocupa 3 linhas no celular e empurra etapa e comissão. Quatro cartões enchem a tela | médio | web-design-guidelines (Content Handling); wise-design-system §4 (densidade) | portal-indicacoes-375.jpg (375) | Nome fantasia ou nome curto como título, com `line-clamp-2`. A razão social vai para o detalhe |
| Selo de etapa só com cor e texto, sem ícone. "Proposta" usa âmbar (alerta) sem ser alerta. Não há noção de avanço entre as etapas | médio | wise-design-system §2 (cor semântica só com significado) e §5 (`StatusBadge` com ícone além da cor) | portal-indicacoes-375.jpg (375), portal-indicacoes-768.jpg (768) | Etapas em andamento em tom neutro ou informação, menta só para "Fechada", vermelho só para "Perdida". Ícone por etapa ou mini trilha de 5 passos com o atual marcado |
| O cartão não abre detalhe: o parceiro não vê histórico, contato registrado, data da reunião, motivo de perda nem a regra da comissão | médio | Nielsen #6; wise-dashboards §3.5 (detalhe) | portal-indicacoes-375.jpg (375) | Cartão inteiro clicável que abre uma folha (sheet) com a linha do tempo (`Timeline`), os dados enviados e a comissão prevista |
| Jargão de comissão: "Aguardando compensação". "Aguardando fechamento" se repete em todos os cartões sem valor previsto | médio | Nielsen #2; wise-design-system §8 (voz) | portal-indicacoes-375.jpg (375) | "Cliente pagou, comissão liberada após a compensação (previsão DD/MM)". Antes do fechamento: "Comissão de X% quando fechar" |
| "Nova indicação" fica no topo, fora do alcance do polegar, e convive com o item "Indicar" do menu (link exclusivo) com outro nome, sem explicar a diferença | médio | Nielsen #4; persona Casey (ação principal na zona do polegar) | portal-indicacoes-375.jpg (375), portal-menu-aberto-375.jpg (375) | Um único fluxo "Indicar um cliente" com as duas formas (formulário ou link exclusivo). No celular, botão fixo no rodapé com `env(safe-area-inset-bottom)` |
| O formulário de nova indicação no celular é um diálogo centralizado com `max-h-[90vh]`: 3 opções longas e 7 campos numa rolagem, com os botões só no fim. Nome, e-mail e telefone do contato têm só placeholder (sem rótulo), nenhum campo tem `autocomplete` e o telefone é `type=text` | médio | mobile-native §3 (vh) e §4 (teclado: `type="tel"`); web-design-guidelines (Forms: rótulos, autocomplete) | portal-nova-indicacao-375.jpg (375) | Tela cheia ou folha com `100dvh` e rodapé fixo ("Registrar indicação") com área segura. Rótulos visíveis, `autocomplete="name|email|tel"`, `type="tel"`, máscara de CNPJ e CNPJ primeiro, com aviso de cliente já indicado |
| A aba ativa não vai para a URL, então o contador "Indicações" da Início não leva direto a "Recebidas" | médio | web-design-guidelines (Navigation & State); wise-dashboards §5 | portal-indicacoes-recebidas-375.jpg (375) | `?aba=recebidas` sincronizada com as `Tabs` |
| Estados incompletos: carregando em texto, erro técnico sem "tentar de novo" e o vazio de "Recebidas" só com o título "Nenhuma indicação recebida" | médio | wise-design-system §6 | (código: `Indicacoes.tsx` linhas 53 e 80) | Esqueleto de cartão, erro com botão de nova tentativa e vazio que explica ("Quando o grupo indicar um cliente a vocês, ele aparece aqui para vocês atualizarem o resultado") |
| As abas têm 32 px de altura | baixo | mobile-native (alvos de toque); web-design-guidelines (Touch & Interaction) | portal-indicacoes-375.jpg (375) | Abas com 44 px no celular |
| Valores em R$ sem `tabular-nums`. Datas "18/10/2026" na lista (a regra pede "18 out 2026" em listas e tabelas) | baixo | wise-design-system §3 e §8 | portal-indicacoes-1440.jpg (1440) | `tabular-nums` e `data curta` de `formato.ts` |
| Sem busca nem filtro por empresa do grupo ou etapa. Hoje são 4 e 5 itens, mas um parceiro Elite ativo passa de 30 em um ano | baixo | Nielsen #7 | portal-indicacoes-375.jpg (375) | Filtro por etapa (pílulas) e por empresa, com estado na URL |

### Pontos fortes
* **Separação "Feitas" e "Recebidas"** com contagem na aba: um modelo mental correto do programa de mão dupla.
* **"Atualização para X aguardando confirmação da Wise"**: estado intermediário honesto, com ícone de relógio e texto, sem fingir que a mudança já valeu.
* O formulário pede consentimento só quando há dado pessoal (LGPD) e explica por que CNPJ e necessidade aumentam a qualidade da indicação.

### Sinais de alerta por persona

**Dono da empresa parceira, no celular entre visitas**
* Quer indicar o cliente que acabou de visitar: o botão está no topo e o formulário abre como diálogo, com 7 campos e botões só no fim da rolagem. Com o teclado aberto, perde o "Registrar indicação" de vista.
* No campo "Telefone", o teclado é numérico, mas não é o de telefone. Não há preenchimento automático.
* Quer saber "quanto tenho a receber": precisa somar de cabeça os cartões.
* Em "Recebidas", não sabe qual atualizar primeiro: todos parecem pedir a mesma coisa.

**Riley (testa os limites)**: um nome jurídico longo já quebra em 3 linhas. Com 30 indicações, a lista vira 30 telas de rolagem sem filtro. Uma falha de rede mostra "Não foi possível carregar: TypeError: Failed to fetch".

---

## 3. Página pública de RFP (`/r/:token`)

### Pergunta da tela
O mapa define a página como "vitrine da marca, não tela de sistema", com fichas comparáveis e o WhatsApp sempre à mão. Do ponto de vista do cliente: **"Quais fornecedores a Wise recomenda para a minha necessidade, como eles se comparam e como falo com eles agora?"**

**Responde? Em parte.** Mostra para quem é a página, a necessidade, os três parceiros e um botão de contato em cada um. Mas as fichas não se comparam: o texto é livre e os destaques variam em quantidade e assunto (um tem 2, outro 1). No desktop, a grade é de 2 colunas com o terceiro cartão sozinho na linha de baixo, em vez de 3 lado a lado. E, quando a rede falha, a página diz que o link acabou.

### Veredito de especificidade de design
**Parcialmente específico.** O conteúdo é próprio do produto: nome do cliente, "Necessidade", aviso de transparência sobre a comissão e consultor nomeado. Isso é raro e bom. A forma, porém, é uma landing escura genérica: o título em Plus Jakarta (a regra pede Baloo 2), nenhuma textura da marca no topo, três cartões iguais com um botão menta cheio cada e uma pílula verde. Sem o logo, poderia ser de qualquer consultoria.

### Heurísticas de Nielsen

| # | Heurística | Nota | Motivo |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 2 | Há um spinner no botão ao clicar, mas sem "Abrindo o WhatsApp...", e os outros botões continuam ativos. O carregamento é só logo e spinner |
| 2 | Correspondência com o mundo real | 3 | Linguagem clara ("Converse com cada um e compare"), necessidade nas palavras do cliente |
| 3 | Controle e liberdade | 3 | Sem menus nem armadilhas. O consultor aparece como saída |
| 4 | Consistência e padrões | 3 | Cartões e botões consistentes, mas o rótulo do botão é idêntico nos três |
| 5 | Prevenção de erros | 3 | Pouco a errar. O botão indisponível fica desabilitado |
| 6 | Reconhecer em vez de lembrar | 2 | Comparar exige guardar na cabeça o cartão anterior: não há campos alinhados |
| 7 | Flexibilidade e eficiência | 2 | O consultor não tem WhatsApp. Os links de contato têm 20 px |
| 8 | Estética e minimalismo | 3 | Uma coluna limpa, mas o menta aparece em 7 elementos diferentes |
| 9 | Reconhecer, diagnosticar e recuperar erros | 1 | Qualquer erro vira "Este link não está mais disponível", sem nova tentativa |
| 10 | Ajuda e documentação | 3 | O bloco do consultor e o aviso de comissão orientam bem |
| | **Total** | **25/40** | Aceitável |

### Carga cognitiva
Itens que falham (1 de 8, carga **baixa**):
* **Memória de trabalho**: no celular, as fichas ficam empilhadas e sem estrutura comum. Para comparar "prazo de implantação" ou "atende indústria de alimentos", o cliente rola para cima e para baixo e lembra.

Pontos de decisão: 3 parceiros mais o consultor, dentro do limite de 4.

**Jornada emocional**: a abertura é forte (o nome da empresa do cliente, "Opções de ERP para a Laticínios Vale do Ivaí", e a necessidade dele). O aviso de comissão gera confiança no momento certo. O ponto fraco está no fim: o rodapé em texto de 12 px e, no pior caso, a tela "Este link não está mais disponível" com o logo distorcido, que destrói a confiança de quem recebeu o link de alguém de confiança.

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| Falha de rede ou tempo esgotado vira "Este link não está mais disponível. Fale com o seu consultor". O código troca qualquer `error` por `nao_encontrada`, com `retry: false`, e, sem dados, nem o contato do consultor aparece: beco sem saída justamente no 4G lento | alto | wise-design-system §6 (erro com "tentar de novo"); Nielsen #9 | rfp-publica-link-invalido-375.jpg (375) | Separar o erro de rede ("Não conseguimos carregar a página. Confira a conexão.", botão "Tentar de novo", uma nova tentativa automática) do link expirado ou revogado. Em ambos, um contato fixo da Wise (WhatsApp geral) |
| O link é aberto pelo WhatsApp, mas não há meta Open Graph (`og:title`, `og:description`, `og:image`). O título só muda por JS, então a prévia mostra "Portal Wise Partners" genérico, sem imagem | alto | mapa-de-telas (páginas públicas são vitrines da marca); persona Jordan (confiança no primeiro contato) | (medido: `<head>` da RFP sem OG) | Metas OG estáticas da marca no `index.html` (título "Wise Makers: opções selecionadas para você", imagem 1200 x 630 com a textura da marca). Se possível, uma função de borda que injete o nome do cliente para `/r/*` |
| As fichas não são comparáveis: texto livre e destaques em quantidade e assunto variáveis, sem campos fixos (cidade e UF, porte atendido, prazo típico, experiência no setor). No desktop, 2 colunas com o terceiro cartão órfão em vez de 3 lado a lado | alto | mapa-de-telas (RFP: "fichas comparáveis lado a lado no desktop e empilhadas no celular"); Nielsen #6 | rfp-publica-1440.jpg (1440), rfp-publica-768.jpg (768), rfp-publica-375.jpg (375) | Campos fixos na mesma ordem em todas as fichas (cidade e UF já vêm em `Candidato` e não chegam à página). Grade de 3 colunas a partir de 1024 px (`max-w` maior). Linhas alinhadas entre os cartões |
| O título está em Plus Jakarta 30 px, 700, e não há textura escura da marca no topo | médio | mapa-de-telas (Baloo 2 no título, textura só no topo); wise-design-system §3 | rfp-publica-dobra-375.jpg (375), rfp-publica-1440.jpg (1440) | `font-display` (Baloo 2, 800) no h1 e faixa de topo com a textura da marca, apenas no cabeçalho |
| Logo esticado na página de link indisponível (`<img>` dentro de `flex-col`) | médio | wise-design-system §1 | rfp-publica-link-invalido-375.jpg (375) | `self-start` e dimensões explícitas no `Logo` |
| Três botões com o mesmo texto "Falar com este parceiro": o leitor de tela ouve três vezes o mesmo rótulo, sem nome | médio | web-design-guidelines (Accessibility e Content & Copy: rótulos específicos); persona Sam | rfp-publica-375.jpg (375) | `aria-label="Falar com Sistemas Araucária pelo WhatsApp"` ou o texto visível "Chamar no WhatsApp" com o nome no `aria-describedby` |
| O consultor tem só e-mail e telefone (sem WhatsApp), e os links de contato têm 20 px de altura. O mapa pede o botão de WhatsApp sempre à mão | médio | mapa-de-telas (RFP: WhatsApp sempre visível); mobile-native (alvos de toque) | rfp-publica-375.jpg (375) | Botão "Falar com Mariana no WhatsApp" de 44 px no bloco do consultor. E-mail e telefone como linhas de 44 px |
| Carregamento: a folha do Google Fonts (2 famílias, 7 pesos) bloqueia a renderização, e a página pública baixa o mesmo pacote principal do app interno (217 KB transferidos). A espera é só logo e spinner | médio | mapa-de-telas ("carregamento instantâneo"); web-design-guidelines (Performance: pré-carregar fontes críticas); wise-design-system §6 (esqueleto) | rfp-publica-carregando-375.jpg (375) | Fontes locais em woff2 só com os pesos usados (com `preload`), um pacote enxuto para as rotas públicas e um esqueleto com o formato do título e dos cartões |
| O clique em "Falar" passa pela função de borda antes de abrir o `wa.me`. No 4G, o botão só gira, os outros seguem clicáveis e o erro sai num toast | médio | Nielsen #1; mobile-native §5 (resposta ao toque) | rfp-publica-375.jpg (375) | Texto "Abrindo o WhatsApp...", desabilitar os outros botões durante a ida e, se a função demorar mais de 3 s, oferecer o link direto ou o consultor |
| A pílula "Necessidade" com `rounded-full` quebra em 2 linhas no celular e vira uma bolha | baixo | wise-design-system §4 (raio: pílula só para elementos curtos) | rfp-publica-dobra-375.jpg (375) | Bloco com raio de 10 px e o rótulo "Necessidade" em cima, em `text-secondary` |
| Menta em 7 elementos: "Seleção exclusiva", nome do cliente, pílula, marcadores, borda do aviso, rótulo do consultor e 3 botões cheios | baixo | wise-design-system §2 (menta é sinal) | rfp-publica-375.jpg (375) | Menta só nos botões de contato. Rótulos, marcadores e borda em neutro |
| Base de celular incompleta: sem `viewport-fit=cover`, sem `color-scheme: dark`, sem `-webkit-tap-highlight-color`, hover sem condição. O `noindex` só é injetado por JS | baixo | mobile-native §2, §7 e §10; web-design-guidelines (Dark Mode & Theming) | (código: `index.html`, `src/index.css`) | Aplicar a base da `mobile-native`, `<meta name="color-scheme" content="dark">` e `X-Robots-Tag` ou meta estática para `/r/*` |
| O botão "Indisponível no momento" fica com 50% de opacidade e não oferece alternativa | baixo | Nielsen #9 | (código: `ConteudoPaginaRfp.tsx`, `CartaoParceiro`) | Texto "Fale com a Mariana para falar com este parceiro", com o link do consultor |

### Pontos fortes
* **Transparência sobre a comissão** ("A Wise Makers mantém parceria comercial com as empresas apresentadas e pode receber comissão"), num bloco calmo com ícone de escudo: constrói confiança no momento certo.
* **Personalização real**: o nome da empresa do cliente no topo e no título, a necessidade nas palavras dele e um consultor com nome e frase própria. Não parece um catálogo.
* **Uma coluna, sem menu interno e com botões de largura total no celular**: o essencial da vitrine pública está certo, sem rolagem horizontal em nenhuma largura.

### Sinais de alerta por persona

**Cliente que abre o link pelo WhatsApp num celular com 4G lento** (Casey com Jordan: uma vez, sem conta, desconfiado)
* A prévia no WhatsApp diz "Portal Wise Partners", sem imagem nem descrição: parece um link de sistema, não um convite.
* Se a conexão cair durante a carga, a página afirma que o link "não está mais disponível". O cliente acredita e desiste. Não há "tentar de novo".
* A folha de fontes bloqueia a primeira pintura. O cliente vê um fundo preto com spinner antes de qualquer texto.
* Para comparar, precisa rolar entre fichas com informações diferentes em cada uma.
* Toca em "Falar com este parceiro": o botão gira sem explicar. Se tocar em outro, dispara um segundo pedido.
* Quer falar com a Mariana pelo WhatsApp: só há e-mail e um telefone com área de toque de 20 px.

**Sam (leitor de tela)**: ouve três vezes "Falar com este parceiro, botão", sem saber de qual. O aviso de comissão é um `<section>` sem título.

---

## Contagem por gravidade

| Tela | Crítico | Alto | Médio | Baixo | Total |
|---|---|---|---|---|---|
| Início | 0 | 5 | 9 | 5 | 19 |
| Indicações | 0 | 2 | 8 | 3 | 13 |
| Página de RFP | 0 | 3 | 6 | 4 | 13 |
| **Total** | **0** | **10** | **23** | **12** | **45** |

Nenhum problema impede completamente a tarefa no caminho feliz, por isso nenhum é crítico. O primeiro da lista abaixo chega perto disso para quem está com conexão ruim.

## Os 5 maiores problemas nas minhas telas

1. **A página de RFP transforma falha de rede em "link não disponível"** (alto). No 4G lento, o cliente vê um beco sem saída, sem "tentar de novo" e, sem dados, sem contato. É a única vez que esse cliente abre a página. Corrigir separando o erro de rede (com nova tentativa) do link expirado e mantendo um contato fixo da Wise. (`PaginaRfp.tsx`, `rfp-publica-link-invalido-375.jpg`)
2. **A Início não responde "como está a minha parceria"**: a primeira dobra no celular é cadastro estático, e o nível não tem herói nem progresso nos três grupos. Pior, quando os requisitos atuais não estão em dia, o risco fica escondido atrás de uma frase genérica. Corrigir com um `HeroMetric` de nível em Baloo 2 e um `Stepper` dos três grupos no topo. (`portal-inicio-dobra-375.jpg`)
3. **Indicar um cliente, a ação que gera resultado para o programa, está fora de alcance**: não aparece na Início, fica no topo da tela de Indicações (longe do polegar), tem dois nomes ("Indicar" e "Nova indicação") e o formulário é um diálogo de 90vh com rótulos só em placeholder. Corrigir com um único fluxo "Indicar um cliente", botão fixo no rodapé ou barra inferior e formulário em tela cheia. (`portal-inicio-dobra-375.jpg`, `portal-nova-indicacao-375.jpg`)
4. **As Indicações não dizem o que fazer nem quanto o parceiro ganha**: não há resumo (no ano, fechadas, comissão a receber e recebida), a ordem é por data e não por urgência, e "Atualizar resultado" aparece igual em todos os cartões recebidos. Corrigir com `KpiTile` no topo, o bloco "Precisam da sua atualização" e uma linha de próximo passo em cada cartão. (`portal-indicacoes-375.jpg`, `portal-indicacoes-recebidas-375.jpg`)
5. **As fichas da RFP não se comparam**: texto livre, destaques variáveis e grade 2 + 1 no desktop. Isso contraria o pedido explícito do mapa ("fichas comparáveis lado a lado"). Corrigir com campos fixos alinhados (cidade e UF já disponíveis, porte, prazo, experiência no setor) e 3 colunas no desktop. (`rfp-publica-1440.jpg`, `rfp-publica-375.jpg`)

Quase entraram: o "Primeiros passos" com tarefas internas da Wise mostradas como afazeres do parceiro (alto) e a falta de prévia Open Graph no link da RFP (alto).
