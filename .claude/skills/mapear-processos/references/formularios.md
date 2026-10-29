# Formulários: como escrever, montar, enviar e ler

## Sumário

1. Regras de redação
2. Como montar uma rodada
3. Tipos de pergunta
4. Banco de perguntas por rodada
5. Canais de envio e de retorno
6. Texto de convite
7. Depois que as respostas chegam

---

## 1. Regras de redação

Cada regra existe porque um formulário mal escrito traz resposta inútil ou enviesada.

1. **Toda pergunta tem alvo.** Ela fecha uma lacuna (`P-07.gatilho`) ou testa uma hipótese (`P-11`). Pergunta sem alvo não entra.
2. **Curto.** Até 12 perguntas do mapeamento por formulário, das quais no máximo 4 do tipo `aberta` (respostas longas, como "conte o último caso"), para caber em 10 a 15 minutos. Para respostas curtas use `curta` ou `lista`. Mais que isso, divida em dois formulários ou em duas rodadas. A identificação e as perguntas de fecho são acrescentadas pelo script; não escreva perguntas suas sobre "quem mais saberia" ou "que documentos existem", porque o fecho já pergunta.
3. **Uma coisa por pergunta.** "Quem faz e quanto tempo leva?" vira duas perguntas.
4. **Linguagem de quem responde.** Sem termos de processos (BPMN, gateway, raia, macroprocesso, fluxo de valor). Use as palavras da empresa (glossário).
5. **Caso real antes de regra geral.** "Pense no último pedido que você atendeu. O que aconteceu, do começo ao fim?" funciona melhor que "Como funciona o atendimento de pedidos?".
6. **Sem pergunta que induz.** Errado: "O financeiro aprova os descontos, certo?". Certo: "Quando um cliente pede desconto, quem decide?". Para testar uma hipótese explicitamente, use o tipo `confirmacao`, que oferece "Sim, Parcialmente, Não, Não sei".
7. **Pergunte o dia de chuva.** "E quando dá errado (falta informação, o cliente some, o sistema cai), o que acontece?"
8. **Números com âncora.** "Quantos por semana, mais ou menos?" e "Quando foi a última vez?". Aceite faixas.
9. **Sempre há saída.** Perguntas de escolha ganham "Não sei / não é comigo" automaticamente. Perguntas abertas são opcionais.
10. **Bola de neve.** O script acrescenta "Quem mais deveríamos ouvir?" e "Existe documento ou sistema que mostre isso?" ao final. Use as respostas para cadastrar pessoas e fontes.
11. **Respeite o papel.** Não pergunte a um vendedor como funciona a folha de pagamento; pergunte a quem faz. Gestores respondem sobre o processo inteiro da área; executores, sobre o próprio trabalho e as passagens.
12. **Diga para que serve.** A introdução explica o objetivo e que ninguém será avaliado pelas respostas. Medo distorce dado.

## 2. Como montar uma rodada

1. `mapa.py status PASTA` (lacunas agrupadas por pessoa sugerida) e `mapa.py lacunas PASTA --sem-pergunta` (lista completa por prioridade, com `--para PE-xx` para filtrar uma pessoa).
2. Escolha os respondentes. Se a lacuna aponta "responsável ainda não identificado", a primeira pergunta é "quem faz isso?", dirigida ao patrocinador.
3. Escreva as perguntas em `mapa.json > perguntas`, usando o banco da seção 4 como ponto de partida e adaptando ao que já se sabe. Campos: `id` (use `mapa.py id PASTA Q --n N`), `texto`, `tipo`, `opcoes` (se houver), `alvo` (lista), `para` (pessoas), `rodada`, `bloco` (título da seção no formulário), `status: "aberta"`.
4. Crie o formulário em `mapa.json > formularios`: `id` (FO-xx), `titulo`, `rodada`, `para`, `canal`, `perguntas` (ids), `status: "rascunho"`, `introducao` (opcional).
5. Gere: `mapa.py formulario PASTA FO-xx`. Saem `google-forms.gs`, `formulario.md`, `formulario.artifact.html` e `itens.json` em `formularios/FO-xx/`.
6. Revise o `formulario.md` como se fosse o respondente: dá para responder em 15 minutos sem perguntar nada a ninguém?
7. Entregue ao usuário com o convite (seção 6) e as instruções do canal (seção 5). Quando ele confirmar o envio, marque `status: "enviado"` e `enviado_em`.

Um formulário por perfil de respondente na rodada (diretoria, gestor comercial, quem executa orçamentos...). Pessoas do mesmo papel recebem o mesmo formulário: respostas diferentes do mesmo papel revelam variações e divergências, o que é útil.

As rodadas organizam o conteúdo, não a hierarquia. Em empresa pequena, a mesma pessoa pode responder sobre o negócio e sobre a própria área: misture perguntas de rodadas diferentes no mesmo formulário, separadas em blocos (campo `bloco`).

Uma pergunta pode ir em mais de um formulário para cruzar versões (por exemplo, "o caminho do último cliente" para o dono e para a responsável comercial). Coloque as duas pessoas em `para`: a pergunta só conta como respondida quando todas responderem, e a lacuna continua coberta até lá.

Não gere formulário para o próprio usuário quando ele estiver na conversa: pergunte direto (seção 5, canal D). Se ele estiver indisponível e você quiser deixar as perguntas prontas, crie o formulário com `"canal": "entrevista"`; o script não acrescenta identificação nem fecho nesse caso (ou use `"identificacao": false` em qualquer canal).

## 3. Tipos de pergunta

| Tipo | Uso | Observação |
|---|---|---|
| `aberta` | Narrativas, casos, explicações | Texto longo |
| `curta` | Nome, número, termo | Uma linha |
| `lista` | Enumerar (sistemas, clientes, etapas) | Texto longo com "um por linha" |
| `escolha` | Uma opção entre várias | "Não sei" é acrescentado; "Outro" só aparece no Google Forms |
| `multipla` | Várias opções | Idem |
| `escala` | Nota de 1 a 5 (prioridade, saúde) | Diga o que 1 e 5 significam no texto |
| `confirmacao` | Testar uma afirmação | Vira "Frase N" com Sim, Parcialmente, Não, Não sei, e um campo de correção por bloco |

Para validar processos já declarados, não escreva as frases à mão: `mapa.py validacao PASTA P-05,P-06 --para PE-02 --rodada 4 --formulario FO-07` gera as afirmações sobre propósito, dono, gatilho, entregas, cliente e cada passo do fluxo.

Rode o `validacao` uma vez para o dono (todas as frases) e outra com `--so-fluxo` para quem executa e não é dono, cada uma num formulário (o formulário criado pelo comando sai com canal `google_forms`; mude o campo se for usar outro). O padrão de `--rodada` é 4.

Para quem executa só uma parte do fluxo, use `--raias PA-xx` (os papéis da pessoa): saem só as frases dos passos dela. Antes de gerar o formulário, leia as frases e troque nomes internos (de processos e papéis) pelos termos que a pessoa usa no dia a dia, editando o `texto` das perguntas no `mapa.json`.

Frases de confirmação são rápidas (marcar uma opção), então o limite é outro: até 25 frases por formulário, mais as perguntas abertas que couberem no limite de 12. Um processo com fluxo longo pode ocupar um formulário inteiro; nesse caso, valide um processo por formulário. O `mapa.py formulario` avisa quando um formulário passa desses limites. A validação vai para o dono do processo e, para os passos, para quem os executa; não mande frases de um processo para quem não participa dele.

## 4. Banco de perguntas por rodada

Use como inspiração. Adapte o texto à empresa e corte o que já se sabe. Entre colchetes, o alvo típico, no mesmo formato que `mapa.py lacunas` usa (troque `P-xx` e `AR-xx` pelos ids reais). Alvos de contexto começam com `NEGOCIO.`, `ESTRUTURA.`, `ESCOPO.` ou `NOVO.`.

### Rodada 0: escopo (com o usuário ou patrocinador, de preferência ao vivo)

1. O que vai ser feito com o mapa quando ele estiver pronto? [ESCOPO.objetivo]
2. O mapeamento cobre a empresa toda ou uma parte (uma área, uma unidade, um programa)? O que fica de fora? [ESCOPO.escopo]
3. Quem aprova o resultado e decide quando há divergência? [ESCOPO.patrocinador]
4. Liste as pessoas-chave de cada área, com função e contato (e-mail ou WhatsApp). [ESTRUTURA.papeis] (lista)
5. Que documentos existem: organograma, manuais, playbooks, contratos, apresentações, relatórios do sistema? [ESCOPO.fontes]
6. Até quando o mapa precisa estar pronto? Até que nível de detalhe? [ESCOPO.criterios]
7. Qual canal de formulário funciona melhor com essas pessoas? [ESCOPO.canal]

### Rodada 1: modelo de negócio e grandes frentes (diretoria, sócios)

1. O que a empresa vende? Liste os produtos ou serviços principais. [NEGOCIO.oferta] (lista)
2. Para quem vende? Descreva os tipos de cliente e o que diferencia um do outro. [NEGOCIO.cliente]
3. Por que o cliente escolhe vocês e não outra empresa? [NEGOCIO.proposta_de_valor]
4. Como o cliente chega até vocês e como é atendido (canais)? [NEGOCIO.canal]
5. Como a empresa ganha dinheiro: forma de cobrança, recorrência, prazos? [NEGOCIO.receita]
6. Pense no último cliente que fechou. Conte o caminho dele, do primeiro contato até o dinheiro entrar e ele ficar atendido. [ESTRUTURA.macroprocessos e, quando as ofertas já existem, OF-xx.cadeia]
7. Quais áreas ou equipes existem, e o que cada uma faz em uma frase? [ESTRUTURA.areas]
8. Além de vender e entregar, que trabalhos mantêm a empresa funcionando (pessoas, dinheiro, compras, sistemas, parceiros, jurídico)? [ESTRUTURA.tipo_suporte]
9. Como as metas da empresa são definidas e acompanhadas ao longo do ano? Conte como foi da última vez. [ESTRUTURA.tipo_gestao]
10. Para uma área concluir o trabalho dela, quanto depende de informações de outras áreas? O que acontece quando essas informações atrasam ou vêm erradas? [NEGOCIO.modelo_operacional]
11. A empresa ganha quando todas as áreas ou unidades fazem o mesmo trabalho do mesmo jeito? Onde sim e onde não? [NEGOCIO.modelo_operacional]
12. Existe alguma lei, norma ou certificação que obrigue a fazer algo de um jeito específico? [NEGOCIO.regulacao]

### Rodada 2: processos de cada área (gestores ou responsáveis)

Para a área X:
1. Quais são os principais trabalhos que a sua área faz e que se repetem (cada pedido, cada cliente, cada mês)? [AR-xx.processos] (lista)
2. Para cada um: o que faz esse trabalho começar? [P-xx.gatilho]
3. O que a sua área entrega no fim, e para quem? [P-xx.saidas, P-xx.cliente]
4. O que vocês precisam receber de outras áreas ou de fora para começar? De quem? [P-xx.entradas]
5. Quem é responsável pelo resultado de cada trabalho? [P-xx.dono]
6. Que funções participam? [P-xx.participantes]
7. Que sistemas, planilhas ou ferramentas vocês usam? [P-xx.sistemas]
8. Quantas vezes isso acontece por semana ou mês, mais ou menos? [P-xx.frequencia]
9. Como vocês sabem se o trabalho foi bem feito? Existe algum número acompanhado? [P-xx.indicadores]
10. Onde o trabalho costuma travar ou voltar? Quando foi a última vez? [P-xx.dores]

### Rodada 3: passo a passo (quem executa)

Para o processo P:
1. Pense na última vez que você fez [P]. O que disparou o trabalho? [P-xx.fluxo]
2. Descreva o que aconteceu, passo a passo, até terminar. Diga quem fez cada passo. [P-xx.fluxo] (aberta)
3. Em que momentos alguém precisa decidir algo (aprovar, escolher um caminho)? O que define o caminho? [P-xx.fluxo]
4. Como termina? Existem jeitos diferentes de terminar (deu certo, foi cancelado, ficou pendente)? [P-xx.fluxo]
5. O que acontece quando dá errado: falta informação, o cliente não responde, o prazo estoura, o sistema cai? [P-xx.fluxo]
6. Em que passos o trabalho passa para outra pessoa ou área? O que é entregue e por qual meio? [P-xx.fluxo, P-xx.saidas]
7. Em que passos você usa sistema, planilha ou mensagem? Qual? [P-xx.sistemas]
8. Algum passo depende de alguém de fora (cliente, fornecedor, parceiro)? O que vocês trocam? [P-xx.fluxo]
9. Quanto tempo leva cada caso, do início ao fim, mais ou menos? [P-xx.duracao]
10. Desse tempo, quanto o trabalho fica parado esperando alguém ou alguma coisa? [P-xx.duracao]
11. De cada 10 vezes que o trabalho chega até você, em quantas ele vem completo e certo? [P-xx.fluxo]

### Rodada 4: validação (dono e quem executa)

Gerada por `mapa.py validacao`. Revise as frases antes de enviar. Inclua, quando útil:
- "O passo a passo acima vale para todos os casos ou existe um tipo de caso que segue outro caminho?" [P-xx.fluxo]
- "Falta algum passo importante entre os listados?" [P-xx.fluxo]

### Conciliação de contradições (pessoas envolvidas e o dono)

- Apresente as duas versões sem dizer quem disse o quê: "Recebemos duas descrições sobre quem conduz as contratações: (a) a diretoria; (b) o financeiro. Como acontece na prática?" com opções a, b, as duas (cada uma faz uma parte), outra. Ponha no `alvo` o `CT-xx` e o campo em disputa, e ligue a pergunta em `contradicoes[].pergunta`.
- Pergunte ao dono qual vale quando ainda houver divergência. A decisão do dono vira evidência de validação.

### Priorização (patrocinador e donos)

- Para cada processo listado: "Importância para os resultados da empresa (1 a 5)", "Hoje funciona bem? (1 = muito mal, 5 = muito bem)", "Dá para mexer nisso agora? (1 a 5)". [P-xx.prioridade]

## 5. Canais de envio e de retorno

### A) Google Forms (padrão para quem não usa Claude)

Envio:
1. O usuário abre https://script.google.com, cria um projeto, cola o conteúdo de `google-forms.gs`, salva e executa `criarFormulario`, autorizando o acesso.
2. No "Registro de execução" aparecem três links: o formulário para enviar, a edição e a planilha de respostas.
3. Se o formulário vier fechado para respostas, em Google Forms > Configurações, ative "Aceitando respostas" (o script já tenta publicar).

Retorno:
- Pela planilha de respostas: Arquivo > Fazer download > CSV. Salve em `respostas/FO-xx.csv`.
- Ou, se houver conector do Google Drive nesta sessão, leia a planilha por ele, salve como CSV e ingira.

### B) Página de formulário como artifact (para quem tem acesso ao Claude na mesma organização)

1. Publique `formularios/FO-xx/formulario.artifact.html` com o Artifact, declarando:
   `capabilities: {"db": {"rules": [{"path": "respostas", "read": "admin", "write": "self"}, {"path": "respostas/{self}", "read": "view", "write": "interact"}]}, "user": {}}`
   Cada pessoa grava só a própria resposta; só o dono e editores leem todas.
2. O usuário compartilha o link dando a cada respondente acesso de quem pode interagir (contribuir).
3. Para ler: `ArtifactData` com `action: "list"` e `collection: "respostas"`; salve o resultado em `PASTA/respostas/FO-xx.json` e rode `mapa.py ingerir PASTA FO-xx PASTA/respostas/FO-xx.json`.
4. Quem abre fora do Claude ou sem acesso vê um botão para copiar as respostas e mandar por outro meio.

### C) Texto (WhatsApp, e-mail, documento, roteiro de entrevista)

`formulario.md` serve para colar numa mensagem, num documento ou para conduzir uma conversa. As respostas voltam como texto: salve em `PASTA/respostas/FO-xx-nome.txt` e registre cada resposta com `mapa.py responder PASTA Q-xxxx --pessoa PE-xx --texto "trecho literal" --tipo formulario`. O comando cria a evidência (local `FO-xx/Q-xxxx`), liga à pergunta e a fecha quando todos de `para` tiverem respondido. Se a pessoa ainda não está cadastrada, cadastre antes em `pessoas`.

### D) Entrevista ao vivo com o usuário

Quando a pessoa que sabe é o próprio usuário, pergunte direto na conversa (AskUserQuestion, até 4 perguntas por vez). Registre cada resposta com `mapa.py responder PASTA Q-xxxx --pessoa PE-xx --texto "..."` (tipo `entrevista` por padrão). Para respostas que não correspondem a uma pergunta escrita antes, use `mapa.py evidencia --tipo entrevista`.

## 6. Texto de convite

Ofereça ao usuário um texto curto para mandar junto com o link, no tom da empresa:

> Oi, [nome]. Estamos desenhando o mapa de como o trabalho acontece na [empresa], para [objetivo em uma frase]. Separei umas perguntas sobre o seu dia a dia, leva uns 15 minutos: [link]. Não tem resposta certa ou errada; vale como funciona hoje, na prática. Se puder, responde até [data]. Obrigado!

## 7. Depois que as respostas chegam

1. `mapa.py ingerir PASTA FO-xx arquivo` cria uma evidência por resposta, cadastra quem respondeu (se ainda não estiver cadastrado) e mostra as respostas agrupadas por pergunta, com o alvo de cada uma. Respostas a frases de confirmação aparecem como [VALIDOU] ou [NÃO CONFIRMOU].
2. Para cada resposta, atualize o `mapa.json` seguindo as regras de interpretação do SKILL.md e de `metodo.md` seção 9: preencha o campo, ligue a evidência, ajuste o status, registre contradições, hipóteses e ideias.
3. Indicações de pessoas (bola de neve): o `ingerir` lista as indicações recebidas, mas não cadastra ninguém sozinho (o texto livre precisa de interpretação). Cadastre cada pessoa indicada em `pessoas` com `indicado_por` e, se der, o papel.
4. Documentos indicados: peça ao usuário e registre em `fontes/`.
5. Feche as perguntas respondidas (o script marca `respondida`; se a resposta não fechou a lacuna, crie nova pergunta mais específica).
6. `mapa.py validar` e `mapa.py status`. Atualize as visualizações e mostre ao usuário o que mudou.
