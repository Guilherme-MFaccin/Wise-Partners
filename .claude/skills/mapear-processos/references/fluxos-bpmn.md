# Passo a passo: como levantar e escrever os fluxos

Os fluxos são escritos no `mapa.json` (campo `fluxo` do processo) e o `mapa.py` gera o BPMN 2.0, o draw.io, o Mermaid e o quadro do Miro. Você nunca escreve XML; escreve a lógica.

## Sumário

1. Antes do fluxo: o escopo do processo
2. O método de cima para baixo
3. Das respostas aos nós: padrões de linguagem
4. Regras de estilo
5. Hierarquia entre fluxos
6. Quem é de fora: externos e mensagens
7. Exemplo: de uma resposta a um fluxo
8. O que o gerador faz com o fluxo

---

## 1. Antes do fluxo: o escopo do processo

Um fluxo só começa a ser desenhado quando quatro respostas existem (com evidência): [Silver cap. 5, passo 1]

1. **Como começa?** Pedido de fora (mensagem), agenda (tempo) ou alguém decide começar.
2. **O que define o fim?** Depois do fim, nada mais acontece neste processo. Se a cobrança é outro processo, o fluxo de venda termina na fatura emitida.
3. **O que é um caso?** Em geral sai do gatilho: cada pedido, cada parceiro, cada contratação. Resolva zonas cinzentas com a empresa (dois produtos no mesmo pedido são um caso ou dois?).
4. **Quais são os jeitos de terminar?** Sucesso e exceções frequentes ou importantes (aceito, recusado, cancelado). Cada um vira um fim com nome.

Se faltar alguma, a próxima pergunta é essa, não o desenho.

## 2. O método de cima para baixo

Adaptado de Silver (BPMN Method and Style, cap. 5):

1. **Lista de alto nível** (no máximo 10 atividades): cada uma é um passo inteiro, com começo e fim, alinhado a quem responde por ele. Uma atividade começa quando a anterior termina.
2. **Caminho feliz primeiro**: ligue o início às atividades e ao fim de sucesso.
3. **Exceções depois**: para cada atividade, pergunte como ela pode terminar (fins distintos). Se depois dela o caminho muda, ponha uma decisão logo em seguida, em forma de pergunta, com uma saída por resultado.
4. **Passos detalhados viram subprocesso**: se uma atividade tem muitos passos internos, ela vira um nó `subprocesso` que aponta para um processo filho, com o próprio fluxo. O pai continua cabendo numa página.
5. **Quem é de fora** (cliente, parceiro, fornecedor): entra como externo, ligado por mensagens.
6. **Repita nos filhos** até a profundidade que o objetivo pede.

Não monte o fluxo frase a frase na ordem em que as pessoas contam ("primeiro isso, depois aquilo"): isso afoga o diagrama em detalhe. Use a narrativa como matéria-prima e organize de cima para baixo.

## 3. Das respostas aos nós: padrões de linguagem

| A pessoa diz | Vira |
|---|---|
| "Quando chega um pedido...", "Todo dia 5..." | `inicio` com `gatilho` `mensagem` ou `tempo` |
| "Eu confiro / verifico / vejo se..." | `tarefa` ("Conferir X") seguida de `decisao` |
| "Se... senão...", "depende de...", "ou... ou..." | `decisao`, uma saída por condição com `rotulo` |
| "Ao mesmo tempo", "em qualquer ordem", "enquanto isso" | `paralelo` abrindo e outro `paralelo` juntando |
| "Espero o cliente responder", "depois de 5 dias" | `espera` com `evento` `mensagem` ou `tempo` |
| "Passo para o fulano", "mando para o financeiro" | o próximo passo fica na raia do outro papel |
| "Volto e peço de novo", "refaço" | ligação de volta para o passo anterior (o gerador desenha o retorno) |
| "Normalmente vai para X" | pergunte: para onde mais pode ir, e por quê? |
| "Cada caso é diferente" | peça dois ou três casos reais e procure o que decide o caminho |
| "Isso é com a outra área" | é um limite do processo (mensagem ou passagem), ou é outro processo |
| "Controlo / acompanho / gerencio" | não é um passo; pergunte qual é a ação concreta e quando ela acontece |

Uma decisão sempre vem depois de uma tarefa que gera a informação ("Analisar crédito" e depois "Crédito aprovado?"). O desvio só testa; quem decide é a tarefa. [Silver cap. 4]

## 4. Regras de estilo

O `validar` confere várias delas. As outras são de bom senso e valem igual. [Silver cap. 6 e 11; Dumas cap. 5]

1. Passos com **verbo no infinitivo + objeto**, em poucas palavras: "Emitir nota fiscal". Nunca "Emissão de nota" (função) nem "Nota OK" (estado).
2. Decisões em forma de **pergunta** ("Medidas completas?") e cada saída com a **condição** ("Sim", "Não", "Acima de R$ 10 mil").
3. Fins nomeados pelo **resultado** ("Orçamento enviado", "Pedido cancelado"). Um fim por resultado diferente; dois caminhos com o mesmo resultado vão para o mesmo fim.
4. Raias são **papéis**, não pessoas, nem áreas genéricas quando o papel é conhecido.
5. Quem é de fora fica **fora** (externo), sem passos dentro dele. Se o cliente tem tarefas que fazem parte do processo (ex.: preencher um cadastro que você acompanha), aí sim ele pode ser uma raia.
6. Sem passos repetidos com o mesmo nome. Se é a mesma coisa em dois lugares, provavelmente é um subprocesso.
7. Até cerca de 30 elementos por fluxo. Acima disso, agrupe em subprocessos.
8. Caminhos paralelos que se abrem com `paralelo` se juntam com outro `paralelo` antes de seguir, a menos que cada um termine num fim próprio.
9. Nada de "e depois, se quiser, ..." sem decisão: se há escolha, há `decisao`.
10. O fluxo descreve o **que acontece e em que ordem**, não como fazer cada passo, nem tempos médios. Detalhes de execução vão em `descricao` do nó ou em níveis mais baixos.

## 5. Hierarquia entre fluxos

- Um nó `subprocesso` com `processo: "P-xx"` aponta para o processo filho que detalha aquele passo. O filho é um processo normal da árvore (o `pai` dele é o processo do fluxo de cima).
- Os **fins do filho** devem casar com o que o pai faz depois: se o pai tem a decisão "Diagnóstico aprovado?" logo após o subprocesso, o filho precisa ter um fim "Diagnóstico aprovado" e outro para o caso contrário.
- O filho não repete o que acontece antes ou depois dele no pai (erro comum: "Enviar proposta" dentro do subprocesso e de novo no pai).
- As mensagens com externos que aparecem no filho devem aparecer também no pai, no nó do subprocesso, com o mesmo rótulo.
- Enquanto o filho não for levantado, o subprocesso no pai pode ficar sem `processo`; ele serve de marcador do que falta detalhar.

## 6. Quem é de fora: externos e mensagens

- `externos`: cada parte de fora vira uma faixa acima do processo (`{"id": "X1", "nome": "Cliente"}`).
- `mensagens`: o que vai e vem (`{"de": "X1", "para": "i1", "rotulo": "Pedido de orçamento"}`). Rotule com o nome do que é trocado ("Proposta", "Aviso de recusa"), não com uma ação.
- Início disparado por algo de fora: `inicio` com `gatilho: "mensagem"` e uma mensagem chegando nele.
- Espera por algo de fora: `espera` com `evento: "mensagem"` e uma mensagem chegando nela.

## 7. Exemplo: de uma resposta a um fluxo

Resposta (evidência EV-0006, vendedor): "Recebo o pedido no WhatsApp, anoto e vejo se tem todas as medidas. Se faltar, peço ao cliente. Com as medidas, passo para a Lia, que calcula na planilha. Eu envio o orçamento e depois fico acompanhando até o cliente responder."

Leitura:
- Gatilho: pedido chega por WhatsApp, de fora → `inicio` com mensagem do externo "Cliente".
- "anoto" → `Registrar solicitação` (vendedor, WhatsApp).
- "vejo se tem todas as medidas. Se faltar..." → decisão "Medidas completas?" com Sim e Não.
- "peço ao cliente" → `Pedir medidas ao cliente` + mensagem para o cliente + `espera` pela resposta.
- "passo para a Lia, que calcula na planilha" → `Calcular orçamento` na raia do orçamentista (papel da Lia), sistema planilha.
- "Eu envio o orçamento" → `Enviar orçamento` + mensagem para o cliente.
- "fico acompanhando até o cliente responder" → isso já é outro processo (negociação) ou o fim deste? Pergunte. Até a resposta, o fim é "Orçamento enviado" e a dúvida vira pergunta com alvo `P-05.fluxo`.
- A Lia descreveu o passo dela (EV-0007): é uma segunda fonte para aquele passo, mas o fluxo inteiro fica `declarado` até o dono validar as frases. Um nó só recebe `status` próprio quando difere do fluxo (por exemplo, um passo que você deduziu fica `hipotese`).

O JSON resultante está em `exemplos/exemplo-mapa.json`, processo P-05.

## 8. O que o gerador faz com o fluxo

- Calcula colunas pela ordem dos passos, uma faixa por papel e uma faixa por externo; desenha setas em ângulo reto, retornos por baixo e desvios por cima quando há passos no meio.
- Pinta cada elemento pelo status (confirmado verde, declarado amarelo, hipótese branco, contestado vermelho). No draw.io, no Miro e no mapa interativo a hipótese também tem borda tracejada; no BPMN vai só a cor (que o bpmn.io e o Camunda leem).
- Gera BPMN 2.0 com pool, raias, mensagens e rótulos (o formato foi conferido contra o XSD oficial durante o desenvolvimento do gerador). Abre no bpmn.io, no Camunda Modeler e no Bizagi Modeler para edição fina.
- Gera a leitura em frases (`mapa.py frases`) e as perguntas de validação (`mapa.py validacao`).

Edições feitas à mão no bpmn.io não voltam para o `mapa.json`. Se alguém corrigir um diagrama numa ferramenta externa, trate a correção como evidência e atualize o `fluxo` no `mapa.json`.
