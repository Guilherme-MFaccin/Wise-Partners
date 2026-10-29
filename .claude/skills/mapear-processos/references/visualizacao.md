# Visualização e entrega

Tudo sai de um comando: `python3 mapa.py renderizar PASTA`. As saídas ficam em `PASTA/saidas/`. Rode de novo a cada atualização do `mapa.json`; os arquivos são recriados.

## Sumário

1. O que cada saída é e para quem serve
2. Mapa interativo (principal)
3. Miro
4. draw.io (diagrams.net)
5. bpmn.io, Camunda e Bizagi
6. Mermaid
7. Relatório de situação
8. Como apresentar ao usuário

---

## 1. O que cada saída é e para quem serve

| Arquivo | Para quê | Quem usa |
|---|---|---|
| `mapa-interativo.html` | Navegar o mapa inteiro: cadeia de valor, hierarquia, fluxos em BPMN com leitura em frases, lacunas por pessoa, modelo de negócio, quem faz o quê | Todos; é a entrega principal |
| `mapa-interativo.artifact.html` | O mesmo mapa, no formato para publicar como artifact (link compartilhável) | Publicação no Claude |
| `miro/*.svg` | Módulos para montar um quadro no Miro pelo conector | Workshops e equipes que usam Miro |
| `mapa.drawio` | Arquivo editável com uma página por visão (cadeia, hierarquia, um fluxo por página), com links entre as páginas | Quem quer editar à mão, de graça |
| `bpmn/*.bpmn` | Fluxos em BPMN 2.0 padrão | Analistas de processo, ferramentas BPM |
| `mermaid/*.mmd` | Texto de diagrama que Notion, GitHub, Obsidian e mermaid.live desenham | Documentação |
| `relatorio.md` | Situação, lacunas por pessoa, contradições e conferência lógica | Acompanhamento com o patrocinador |

Todas usam a mesma legenda de status: confirmado (verde), declarado (amarelo), hipótese (branco; com borda tracejada onde o formato permite, ou seja, fora do BPMN), contestado (vermelho).

## 2. Mapa interativo (principal)

- **Com a ferramenta Artifact disponível** (Claude no app ou na web): publique `saidas/mapa-interativo.artifact.html` com ícone `map` e uma descrição de uma frase. Nas atualizações, publique de novo o mesmo arquivo (mesmo caminho) para manter o mesmo link. O botão "Baixar arquivos editáveis" do mapa usa a capacidade de downloads; ao publicar a primeira vez, declare `capabilities: {"downloads": true}`.
- **Sem Artifact** (Claude Code no terminal): entregue `saidas/mapa-interativo.html`; ele abre em qualquer navegador (o visualizador BPMN e as fontes vêm da internet; sem internet, a leitura em frases continua funcionando).
- O mapa embute o `mapa.json` inteiro. Se ele tiver dados sensíveis do cliente, lembre ao usuário que o link do artifact é privado até ele compartilhar.

## 3. Miro

Use quando o conector do Miro estiver disponível nesta sessão (ferramentas `mcp__Miro__*`, às vezes carregadas sob demanda) e o usuário quiser o mapa no Miro. Criar quadro é uma ação que não se desfaz: confirme com o usuário antes.

Passo a passo:
1. Gere as saídas (`renderizar`). Os módulos ficam em `saidas/miro/`, já posicionados para não se sobrepor:
   - `01-cadeia-de-valor.svg`: as faixas de gestão, finalísticos e suporte, com setas entre os finalísticos.
   - `02-legenda.svg`: como ler as cores e as lacunas que ainda não têm pergunta.
   - `03-hierarquia.svg`: árvore da esquerda para a direita, com conectores.
   - `10-fluxo-*.svg`: um quadro por fluxo, com o diagrama nativo do Miro (Mermaid).
2. Carregue as instruções do conector uma vez por conversa: chame `canvas_get_canvas_composer_skill` sem passo e siga os passos que cada resposta indicar (para criar conteúdo novo, até chegar ao formato SVG); depois `canvas_load_format_skill` com `format_name: "diagramming"` e `notation: "flowchart"`. Os SVGs já seguem esse formato; as instruções servem para você corrigir algo se o conector reclamar.
3. Crie o quadro com `board_create` (nome: "Processos [empresa]"), ou use um quadro que o usuário indicar.
4. Envie cada arquivo, em ordem, com `canvas_create_from_svg` (um arquivo por chamada; o limite é 200 mil caracteres por chamada).
5. Se o resultado avisar que dimensões mudaram (diagramas se ajustam ao conteúdo), reposicione os quadros seguintes com `canvas_update_from_svg`, usando os ids devolvidos.
6. Mostre o quadro ao usuário com `board_show`.

Atualizações: o Miro não sincroniza com o `mapa.json`. Para refletir uma rodada nova, crie os módulos de novo num quadro novo ou numa área livre do mesmo quadro (o conector não apaga sem confirmação). Mudanças feitas pela equipe no Miro (post-its, comentários) são evidência de workshop: registre no `mapa.json`.

Sem o conector do Miro nesta sessão, ofereça o mapa interativo ou o draw.io, e diga em uma linha que, com o Miro conectado, o quadro é montado automaticamente.

## 4. draw.io (diagrams.net)

- Abra https://app.diagrams.net, Arquivo > Abrir de > Dispositivo, e escolha `mapa.drawio`. Também abre no app de desktop, no Google Drive (com o draw.io instalado), no Confluence e no VS Code.
- Páginas: "Cadeia de valor", "Hierarquia" e uma por fluxo. Na hierarquia, clicar num processo que tem fluxo leva à página do fluxo; num fluxo, clicar num subprocesso leva ao fluxo filho.
- É editável à mão. Edições feitas lá não voltam ao `mapa.json`.

## 5. bpmn.io, Camunda e Bizagi

- https://demo.bpmn.io: arraste o arquivo `.bpmn` para a página. Edite, baixe de novo.
- Camunda Modeler (desktop, gratuito) e Bizagi Modeler (desktop, gratuito) abrem os mesmos arquivos.
- As cores de status ficam gravadas no arquivo e aparecem no bpmn.io e no Camunda.

## 6. Mermaid

- Cole o conteúdo do `.mmd` em https://mermaid.live, num bloco ```mermaid do Notion, GitHub ou Obsidian, ou no draw.io (Organizar > Inserir > Avançado > Mermaid).
- Bom para documentação; para apresentação e edição, prefira o mapa interativo, o Miro ou o draw.io.

## 7. Relatório de situação

`relatorio.md` resume completude e validação, processos por nível, lacunas agrupadas por pessoa, contradições e alertas. Use para a mensagem de acompanhamento ao patrocinador ou para a reunião semanal. Se o usuário quiser um documento para circular, transforme em documento no formato que a sessão oferece.

## 8. Como apresentar ao usuário

Depois de cada rodada processada:
1. Uma frase com o que mudou (ex.: "6 processos novos declarados, 3 confirmados, 1 contradição sobre quem aprova descontos").
2. O mapa interativo atualizado (o card do artifact ou o arquivo).
3. As lacunas que ainda importam, por pessoa, e a proposta da próxima rodada (quem recebe, quantas perguntas, por qual canal).
4. Se o usuário pediu, o quadro do Miro ou o pacote editável.

Evite despejar o JSON ou a lista inteira de evidências na conversa: o mapa mostra tudo isso de forma navegável.
