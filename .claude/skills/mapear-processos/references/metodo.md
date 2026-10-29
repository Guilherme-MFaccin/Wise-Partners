# Método de mapeamento: fundamentos e regras de decisão

Este arquivo explica o raciocínio por trás de cada fase. Leia a seção da fase em que você está. As fontes entre colchetes estão listadas no fim.

## Sumário

1. Princípios
2. Níveis da arquitetura
3. Tipos de processo
4. Checklist: isto é mesmo um processo?
5. Como chegar aos macroprocessos (identificação ponta a ponta)
6. Modelo operacional (como a empresa se organiza)
7. Priorização: o que detalhar primeiro
8. Os desafios da descoberta e como os formulários lidam com eles
9. Evidência, status e triangulação
10. Testes lógicos de completude
11. Critérios de pronto
12. Diagnóstico opcional (depois do mapa)
13. Fontes

---

## 1. Princípios

1. **Nada é suposto.** Uma afirmação só entra no mapa como "declarado" se alguém da organização (ou um documento dela) a fez, e o mapa guarda a citação literal. Raciocínio seu, analogia com outras empresas ou modelo de referência entram como **hipótese** e geram uma pergunta. [Dumas cap. 5; CBOK]
2. **Pergunte a quem sabe, sobre o que a pessoa faz.** O conhecimento do processo é fragmentado: cada pessoa conhece bem a própria parte e mal o todo. Por isso o levantamento é feito em rodadas, e cada pessoa recebe perguntas sobre o trabalho dela, sobre o que recebe e o que entrega. [Dumas 5.1]
3. **Casos reais, não opiniões.** Pessoas pensam em casos ("cada cliente é diferente"). Peça o último caso real, do começo ao fim, e pergunte "o que acontece se...". Disso saem as regras de decisão. [Dumas 5.1]
4. **Valide em linguagem comum.** Quem executa o trabalho não lê BPMN. Valide lendo o fluxo em frases ("primeiro o vendedor registra...; se faltar medida, ele pede ao cliente..."). [Dumas 5.4]
5. **Mínimo necessário.** Colete só o que responde ao objetivo do mapeamento. Detalhe demais custa caro e atrasa. [TOGAF; Dumas 5.3]
6. **Estado atual, não o ideal.** Registre como as coisas são hoje, num dia comum. Ideias de melhoria vão para a lista de ideias, fora do mapa. [Lean Enterprise cap. 7; CBOK cap. 5]

## 2. Níveis da arquitetura

Cada organização define quantos níveis precisa; o padrão abaixo é o ponto de partida e pode ser renomeado em `organizacao.niveis` (combine com o patrocinador e registre em `decisoes`). [CBOK cap. 4; Dumas cap. 2]

| Nível | Nome padrão | O que mostra | Quem usa | Forma |
|---|---|---|---|---|
| 0 | Organização | Modelo de negócio, ofertas, clientes, modelo operacional | Diretoria | Fatos por tema, quadrante operacional |
| 1 | Macroprocesso | Cadeia de valor: gestão, finalísticos, suporte | Diretoria | Faixas com setas (chevrons) |
| 2 | Processo | Processos ponta a ponta de cada macroprocesso, com dono, gatilho, entregas | Donos de processo | Ficha do processo |
| 3 | Subprocesso | Trabalho de uma área, com o passo a passo | Gestores e equipe | Fluxo com raias (BPMN) |
| 4+ | Atividade e tarefa | Como cada passo é feito | Quem executa | Fluxo detalhado ou procedimento |

Regras práticas:
- Nível 1 com até cerca de 20 macroprocessos; cada nó costuma ter de 3 a 8 filhos. Mais que 10 filhos indica um nível intermediário faltando; um único filho indica que falta mapear os outros ou que a divisão não é necessária. [Dumas 2.2; CBOK]
- Uma organização inteira cabe em algo como 150 a 200 processos no nível 3. Uma empresa pequena pode ter 10. [CBOK; Dumas]
- Só as **folhas priorizadas** ganham passo a passo. O resto pode ficar na ficha (nome, dono, gatilho, entregas).
- Cada nível precisa detalhar exatamente o nível de cima: os filhos, juntos, começam no gatilho do pai e terminam nas entregas do pai. Se não fecham, falta algo ou há algo sobrando. [CBOK]

## 3. Tipos de processo

| Tipo | Pergunta-guia | Exemplos |
|---|---|---|
| Finalístico (primário) | O cliente paga pelo resultado? | Vender, produzir, entregar, atender pós-venda |
| Suporte | O que é preciso para os finalísticos rodarem? | Pessoas, finanças, compras, TI, jurídico |
| Gestão | Como a empresa define rumo, mede e corrige? | Estratégia, orçamento, metas, gestão de parceiros, compliance |

- Um processo de suporte vira finalístico quando faz parte do que o cliente compra (ex.: numa empresa de recrutamento, "Recrutar" é finalístico). Pergunte em vez de deduzir. [Dumas 2.1]
- Se uma categoria inteira não apareceu nas respostas, isso é uma **lacuna**, não uma conclusão: pergunte se existe e quem faz.

## 4. Checklist: isto é mesmo um processo?

Use para cada candidato antes de colocá-lo como processo de nível 2 ou abaixo. [Dumas 2.1; Silver cap. 2]

1. **Tem um caso tratado?** Dá para dizer "cada X" (cada pedido, cada parceiro, cada contratação). "Gestão de RH" sem caso é uma função ou um macroprocesso, não um processo.
2. **Repete?** Se acontece uma vez, é projeto, não processo.
3. **Tem começo e fim claros?** Um gatilho (pedido chega, data vence, decisão é tomada) e resultados nomeáveis (pedido entregue, proposta recusada). "Monitorar", "acompanhar", "gerenciar" sem fim são funções contínuas.
4. **Importa?** O cliente paga pelo resultado, ou a empresa pagaria alguém para fazer, ou a lei obriga. Se nada disso, provavelmente não vale mapear.
5. **Tamanho certo?** Grande demais: atividades que não acontecem uma vez por caso (limpar a fábrica não faz parte de "fabricar pedido"). Pequeno demais: um único papel sem passagem de trabalho; vira um passo de outro processo.

Nomes: verbo no infinitivo + objeto, em poucas palavras ("Emitir nota fiscal", "Qualificar parceiro"). Evite verbos vagos (fazer, realizar, tratar) e nomes de área ("Comercial" é área; "Vender consultoria" é processo). Eventos: objeto + particípio ("Pedido recebido", "Termo assinado").

## 5. Como chegar aos macroprocessos (identificação ponta a ponta)

Adaptação do método de 7 passos de Dumas, sempre por perguntas: [Dumas 2.2]

1. **Vocabulário.** Anote os termos da empresa e o que significam (`glossario`). Use os termos dela nos formulários e no mapa.
2. **Ofertas e caminhos ponta a ponta.** Comece pelo que a empresa vende e para quem. Para cada oferta, peça o caminho do último cliente: do primeiro contato até o dinheiro entrar e o cliente ficar atendido. Separe caminhos diferentes só quando o trabalho interno for realmente diferente (por oferta, canal ou tipo de cliente).
3. **Sequência dentro do caminho.** Corte o caminho onde muda o objeto de negócio (lead vira proposta, proposta vira contrato, pedido vira fatura), onde o trabalho passa de uma área para outra, ou onde há um intervalo de tempo natural.
4. **Gestão e suporte.** Para cada processo finalístico pergunte: "o que é preciso para isso rodar?" (pessoas, dinheiro, sistemas, compras, parceiros) e "quem define metas e acompanha?".
5. **Decompor até ter um dono.** Divida até que cada processo possa ser respondido por um único papel.
6. **Ficha de cada processo.** Nome, propósito, dono, cliente e o que ele espera, gatilho, entregas, entradas e de quem vêm, papéis, sistemas, indicadores. É a lista de campos do `mapa.json`.
7. **Completude.** Compare com um modelo de referência (APQC, cadeia de Porter) **só para gerar perguntas** sobre o que não apareceu. Confira: todo processo tem uma área (via dono) e toda área tem processo.

Cadeias de valor (value streams) são o caminho ponta a ponta visto pelo cliente: nome em verbo + objeto do ponto de vista de quem inicia, gatilho, valor entregue e etapas com critério de entrada e saída. Ligue cada etapa aos processos que a executam. [TOGAF 10, arquitetura de negócio]

## 6. Modelo operacional (como a empresa se organiza)

Duas perguntas decidem, e devem ser feitas à diretoria (nunca deduzidas pelo porte ou setor): [Ross, Weill e Robertson cap. 2]

- **Integração:** "Para concluir o trabalho de uma área ou unidade, quanto ela depende de dados de outras (pedido, cliente, estoque)? O que acontece quando esses dados atrasam ou vêm errados?"
- **Padronização:** "A empresa ganha quando todas as áreas ou unidades fazem o mesmo trabalho do mesmo jeito? Em quais processos sim e em quais não?"

| | Padronização baixa | Padronização alta |
|---|---|---|
| **Integração alta** | Coordenação: dados compartilhados, cada área com seu jeito | Unificação: mesmos dados e mesmo jeito |
| **Integração baixa** | Diversificação: unidades independentes | Replicação: mesmo jeito, dados locais (franquias) |

Uso no mapeamento:
- Em replicação (franquias, filiais), mapeie o processo padrão uma vez e pergunte em cada unidade onde ela foge do padrão.
- Em diversificação, cada unidade pode ter sua própria cadeia de valor.
- Sinais de contradição para registrar: diz que padroniza, mas existem vários jeitos ou sistemas para a mesma atividade; diz que integra, mas as pessoas redigitam dados entre sistemas ou o cliente recebe respostas diferentes de áreas diferentes.

## 7. Priorização: o que detalhar primeiro

Antes da rodada de passo a passo, peça ao patrocinador e aos donos uma nota de 1 a 5 para cada processo folha: [Dumas 2.3]

- **Importância:** impacto na estratégia e no cliente (patrocinador responde).
- **Saúde:** quão bem funciona hoje (5 = funciona bem). Use queixas reais, perguntando com que frequência acontecem e quando foi a última vez.
- **Viabilidade:** chance de conseguir mapear e melhorar agora (dono responde).

Guarde em `prioridade: {importancia, saude, viabilidade}`. Detalhe primeiro o que é importante e está com saúde baixa, mas evite começar pelo pior de todos se a viabilidade for baixa: uma primeira vitória ajuda.

## 8. Os desafios da descoberta e como os formulários lidam com eles

| Desafio | Efeito | Resposta da skill |
|---|---|---|
| Conhecimento fragmentado | Cada um conhece só a própria parte | Formulários por papel; pergunta "de quem você recebe e para quem entrega" |
| Pensar em casos | "Cada caso é diferente" | Pedir o último caso real e perguntar "o que acontece se..." |
| Não ler notação | Ninguém valida um diagrama | Validação por frases (`mapa.py validacao`) |
| Questionário traz descrições diferentes do mesmo trabalho | Divergências | Registrar contradição e fazer rodada de conciliação dirigida |
| Respostas sobre o ideal | Mapa irreal | Perguntar "e na última vez, como foi?" |
| Medo ou política | Dados distorcidos | Explicar o objetivo, dizer que ninguém será avaliado pelas respostas, preferir números de um dia comum |
| Pessoa não sabe | Lacuna persiste | "Quem saberia?" em todo formulário (bola de neve) |

Fontes: [Dumas 5.1; CBOK cap. 5 (questionários exigem conciliação); Lean Enterprise cap. 7]

## 9. Evidência, status e triangulação

Status de qualquer elemento (fato, processo, fluxo, papel, sistema):

| Status | Quando usar | Exige |
|---|---|---|
| `hipotese` | Você deduziu, ou veio de modelo de referência, ou de terceiros que não participam do mapeamento (site de outra empresa, notícia, opinião de mercado) | Uma pergunta pendente que o teste |
| `declarado` | Uma pessoa da organização ou um documento dela afirmou | Pelo menos uma evidência ligada |
| `confirmado` | O dono (ou responsável) validou, ou duas fontes independentes concordam. Passo a passo: só com a validação do dono | Evidência do tipo `validacao` ou duas evidências de pessoas ou fontes diferentes |
| `contestado` | Fontes discordam | Uma contradição aberta registrada |

Regras de interpretação:
- Documento descreve o desenho oficial; vale como `declarado`, mas a validação deve vir de quem executa.
- O que o usuário da skill afirma conta como `declarado`, com evidência em nome dele. Se a organização é dele, é fonte interna. Se é um cliente, é a visão de quem vê de fora: vale como uma fonte e precisa de confirmação de alguém de dentro para chegar a `confirmado`. Se o nome do usuário não for conhecido, cadastre-o como "Quem pediu o mapeamento" e troque pelo nome quando souber.
- Quando duas fontes discordam, não escolha um lado. Registre a contradição, marque `contestado`, e pergunte às duas pessoas e ao dono. A resolução também vira evidência.
- Campo preenchido por dedução fica listado em `hipoteses` do elemento, com pergunta ligada.
- Respostas "Não sei" não fecham lacuna; viram indicação de quem saberia.

## 10. Testes lógicos de completude

Rode `mapa.py validar` e `mapa.py status`. Além do que o script confere, pense nestes testes e transforme cada falha em pergunta:

1. **Oferta sem caminho:** toda oferta tem uma cadeia de valor do pedido à entrega e ao recebimento?
2. **Entrada sem origem e saída sem destino:** tudo que um processo recebe vem de algum processo ou de alguém de fora; tudo que entrega vai para alguém. Uma passagem só é aceita quando os dois lados a confirmam.
3. **Ciclo de vida dos objetos de negócio:** para cada objeto (cliente, contrato, pedido, parceiro), em que processo nasce, onde é usado, quem altera e onde termina ou é arquivado? Teste do substantivo: "alguém precisa saber, guardar ou mexer nisso?". [TOGAF]
4. **Dinheiro:** como a receita é faturada e cobrada; como os custos são pagos.
5. **Gestão de cada finalístico:** quem define metas, acompanha e corrige?
6. **Pessoas e áreas:** todo papel aparece em algum processo; toda área tem processo; todo processo tem dono.
7. **Fluxos:** começa e termina; todo passo tem entrada e saída; toda decisão diz as condições; todo caminho chega a um fim; nada trava (um ramo paralelo esperando para sempre).
8. **Exceções:** para cada fluxo, perguntou-se o "dia de chuva": cancelamento, falta de insumo, prazo estourado, sistema fora do ar?

## 11. Critérios de pronto

Combine com o patrocinador na rodada 0 e registre em `decisoes`. Padrão:

- Nível 0: os cinco temas obrigatórios do negócio declarados (oferta, cliente, proposta de valor, canal, receita), áreas e papéis levantados, modelo operacional classificado quando houver mais de uma área.
- Nível 1: todos os macroprocessos com tipo, propósito e dono; as três categorias perguntadas.
- Nível 2: campos mínimos de todos os processos; entradas e saídas confirmadas dos dois lados.
- Folhas priorizadas com passo a passo validado pelo dono.
- `mapa.py validar` sem erros; nenhuma contradição aberta; hipóteses e lacunas restantes aceitas pelo patrocinador numa decisão com `aceita_lacunas`.
- Indicadores do `status`: completude a partir de 90% e validação a partir de 70%, salvo outro acordo.

Pare quando os critérios forem atingidos. Mapear além do que o objetivo pede é desperdício.

## 12. Diagnóstico opcional (depois do mapa)

Só depois do estado atual validado, e só se o objetivo pedir melhoria:

- Para cada passo: o cliente pagaria por isso? É exigido por lei ou pelo negócio? Senão, é desperdício. [Lean Thinking; Dumas cap. 6]
- Tempo de espera contra tempo de trabalho em cada passo, e o percentual que chega completo e correto da etapa anterior (%C/A). Grande espera ou %C/A baixo mostram onde olhar. [Lean Enterprise cap. 7]
- Os oito desperdícios: espera, transporte (passagens de trabalho), movimentação (inclusive alternar sistemas), estoque (trabalho parado), superprocessamento, superprodução (orçamentos recusados, cancelamentos), defeitos (retrabalho) e entregar o que o cliente não precisa.
- Registre problemas em `ideias` ou num registro de problemas à parte; nunca altere o mapa do estado atual para refletir o que "deveria ser".

Campos opcionais por passo do fluxo: `tempo_execucao`, `tempo_espera`, `pca` (percentual completo e correto), `valor` (`cliente`, `negocio`, `desperdicio`).

## 13. Fontes

- [Dumas] Dumas, La Rosa, Mendling e Reijers, *Fundamentals of Business Process Management*, 2ª ed. Cap. 2 (identificação, arquitetura, checklist, 7 passos, priorização), cap. 5 (descoberta, entrevistas, workshops, qualidade), cap. 6 (análise de valor e desperdícios).
- [Silver] Bruce Silver, *BPMN Method and Style*, 2ª ed. Método hierárquico de cima para baixo e regras de estilo.
- [CBOK] ABPMP, *BPM CBOK* v4. Níveis, tipos de processo, técnicas de levantamento (inclusive a ressalva sobre questionários), governança e indicadores.
- [TOGAF] *The TOGAF Standard 10th Edition: A Pocket Guide*. Capacidades, value streams, mapa de informação, partes interessadas e o princípio do mínimo necessário.
- [Ross, Weill e Robertson] *Enterprise Architecture as Strategy*. Modelo operacional e diagrama do núcleo.
- [Lean Thinking] Womack e Jones. Valor do ponto de vista do cliente e tipos de desperdício.
- [Lean Enterprise] Humble, Molesky e O'Reilly. Mapeamento de fluxo de valor com quem faz o trabalho, lead time, process time e %C/A.
