# Modelo de dados: o arquivo mapa.json

O `mapa.json` é a única fonte de verdade. Todas as visualizações saem dele. Um exemplo completo e válido está em `exemplos/exemplo-mapa.json` (empresa fictícia); copie com `mapa.py exemplo PASTA` para ver as saídas.

## Sumário

1. Regras gerais
2. Raiz e organização
3. Contexto do negócio (fatos, ofertas, cadeias de valor, modelo operacional)
4. Estrutura (áreas, papéis, pessoas, sistemas, objetos)
5. Processos
6. Fluxo (passo a passo)
7. Evidências
8. Perguntas e formulários
9. Contradições, decisões, glossário, ideias, histórico
10. Campos só de registro
11. Como editar com segurança

---

## 1. Regras gerais

- Todo item de coleção tem `id` único no arquivo inteiro, com prefixo da coleção e número: `P-01`, `EV-0001`, `Q-0001`, `FO-01`, `PA-01`, `PE-01`, `AR-01`, `SI-01`, `OB-01`, `F-001`, `OF-01`, `CV-01`, `CT-01`, `DE-01`, `GL-01`, `ID-01`. Peça ids livres com `mapa.py id PASTA PREFIXO --n N`.
- Ids são permanentes. O código hierárquico exibido (1, 2.1, 2.1.3) é calculado pela posição na árvore; não o use como id.
- Elementos com `status` (fatos, ofertas, cadeias de valor, áreas, papéis, sistemas, objetos, processos e fluxos) seguem as regras de evidência:
  - `hipotese`: pode não ter evidência, mas precisa de uma pergunta pendente com `alvo` igual ao id dele (o `validar` dá erro E10 quando falta).
  - `declarado`: pelo menos uma evidência em `evidencias`.
  - `confirmado`: uma evidência do tipo `validacao` (resposta do dono do processo, ou do patrocinador ou liderança para fatos e contexto), ou duas evidências de pessoas ou fontes diferentes. Exceção: o `fluxo` só fica `confirmado` com evidência de `validacao`.
  - `contestado`: uma contradição aberta com `elemento` apontando para ele.
- Campo deduzido (sem ninguém ter dito) vai para a lista `hipoteses` do elemento, com o nome do campo, e precisa de pergunta pendente.
- Campo vazio é lacuna. Não preencha com "a definir"; deixe `null`, `""` ou `[]`.

## 2. Raiz e organização

```json
{
  "schema": "mapa-processos/1.0",
  "organizacao": {
    "nome": "Nome da organização ou do programa",
    "slug": "nome-da-organizacao",
    "descricao": "Uma frase sobre o que é",
    "setor": "",
    "objetivo_do_mapeamento": "Para que o mapa vai servir",
    "escopo": {"inclui": ["..."], "exclui": ["..."]},
    "patrocinador": "PE-01",
    "consultor": "Quem conduz o mapeamento",
    "niveis": ["Organização", "Macroprocesso", "Processo", "Subprocesso", "Atividade", "Tarefa"],
    "criado_em": "2026-10-29",
    "atualizado_em": "2026-10-29"
  },
  "configuracao": {
    "campos_obrigatorios": {"1": ["tipo", "descricao", "dono"], "2": ["descricao", "dono", "gatilho", "saidas", "cliente"], "3": ["descricao", "dono", "gatilho", "entradas", "saidas", "cliente", "participantes"]}
  }
}
```

`configuracao` é opcional; sem ela valem os campos obrigatórios acima. Mude só por decisão do patrocinador (registre em `decisoes`).

## 3. Contexto do negócio

### fatos

```json
{"id": "F-001", "tema": "oferta", "texto": "Vende consultoria de estruturação comercial em encontros quinzenais.", "status": "declarado", "evidencias": ["EV-0003"]}
```

Temas: `oferta`, `cliente`, `proposta_de_valor`, `canal`, `receita` (os cinco obrigatórios), `estrutura`, `parceiro`, `recurso`, `custo`, `regulacao`, `estrategia`, `modelo_operacional`, `outro`. O texto é uma frase curta fiel ao que foi dito.

### ofertas

```json
{"id": "OF-01", "nome": "Consultoria comercial", "tipo": "servico", "clientes": ["Indústrias com 2 ou mais vendedores"], "canais": ["Indicação de parceiros"], "status": "declarado", "evidencias": ["EV-0003"]}
```

### cadeias_de_valor (caminhos ponta a ponta)

```json
{"id": "CV-01", "nome": "Da indicação ao cliente ativo", "gatilho": "Parceiro indica uma empresa", "valor": "Cliente com consultoria contratada",
 "stakeholder": "Empresa indicada", "ofertas": ["OF-01"],
 "etapas": [{"nome": "Receber indicação", "processos": ["P-04"]}, {"nome": "Diagnosticar", "processos": ["P-05"]}],
 "status": "hipotese", "evidencias": []}
```

### modelo_operacional (objeto único)

```json
{"integracao": "alta|baixa|null", "padronizacao": "alta|baixa|null", "tipo": "unificacao|coordenacao|replicacao|diversificacao|null",
 "justificativa": "Frase que liga as respostas à classificação", "status": "declarado", "evidencias": ["EV-0010", "EV-0011"]}
```

## 4. Estrutura

```json
"areas":    [{"id": "AR-01", "nome": "Comercial", "pai": null, "status": "declarado", "evidencias": ["EV-0002"]}],
"papeis":   [{"id": "PA-01", "nome": "Gerente de parcerias", "area": "AR-01", "externo": false, "status": "declarado", "evidencias": ["EV-0002"]}],
"pessoas":  [{"id": "PE-01", "nome": "Nome", "cargo": "Cargo como a pessoa escreveu", "papeis": ["PA-01"], "perfil": "lideranca|gestor|operacao|externo",
              "contato": "", "sabe_sobre": ["P-01"], "indicado_por": null, "origem": "FO-01"}],
"sistemas": [{"id": "SI-01", "nome": "RD Station CRM", "tipo": "CRM", "status": "declarado", "evidencias": ["EV-0004"]}],
"objetos":  [{"id": "OB-01", "nome": "Parceiro", "ciclo": {"cria": "P-02", "usa": ["P-03"], "encerra": "P-09"}, "status": "hipotese", "evidencias": []}]
```

- Raias e donos são **papéis**, nunca pessoas. Pessoas ocupam papéis.
- `pessoas[].area_texto`: área como o próprio respondente escreveu no formulário (a ingestão preenche); ligue a pessoa a um papel em `papeis` quando souber.
- `perfil: "lideranca"` marca quem recebe as perguntas de negócio quando ninguém mais é indicado.
- `sabe_sobre` ajuda a escolher respondentes quando o dono ainda não é conhecido.
- `objetos` registram os substantivos do negócio e o ciclo de vida, para o teste de completude.
- Pessoas guardam só o necessário para o mapeamento (nome, cargo, contato de trabalho). Nada pessoal além disso.

## 5. Processos

```json
{
  "id": "P-05",
  "nome": "Qualificar parceiro",
  "pai": "P-02",
  "nivel": 2,
  "tipo": "finalistico",
  "ordem": 1,
  "codigo": null,
  "descricao": "Propósito em uma frase",
  "dono": "PA-01",
  "participantes": ["PA-02"],
  "gatilho": "O que faz o processo começar",
  "entradas": [{"nome": "Contato do parceiro", "de": "P-04"}],
  "saidas": [{"nome": "Parceiro classificado", "para": "P-06"}, {"nome": "Proposta", "para": "EXT:Parceiro"}],
  "cliente": "Quem recebe o resultado",
  "estados_finais": ["Parceiro aprovado", "Parceiro descartado"],
  "sistemas": ["SI-01"],
  "objetos": ["OB-01"],
  "indicadores": [{"nome": "Parceiros qualificados por mês", "meta": "4"}],
  "frequencia": "Cerca de 5 por semana",
  "volume": "",
  "duracao": "",
  "dores": ["Texto como foi dito"],
  "regras": ["Só entra parceiro com carteira no ICP"],
  "prioridade": {"importancia": 5, "saude": 2, "viabilidade": 4},
  "status": "declarado",
  "hipoteses": ["cliente"],
  "evidencias": ["EV-0012", "EV-0015"],
  "situacao": "em_operacao",
  "fluxo_dispensado": null,
  "fluxo": { }
}
```

- `pai: null` = macroprocesso (nível 1). `tipo` só é exigido no nível 1; os filhos herdam.
- `nivel` é opcional; se informado, precisa bater com a profundidade real.
- `ordem` define a ordem entre irmãos (a numeração exibida sai dela). Entre macroprocessos, a ordem é por tipo: gestão, finalísticos, suporte.
- `entradas[].de` e `saidas[].para`: id de processo, ou `EXT:Nome` para quem é de fora (cliente, parceiro, governo). Para o teste de passagem de trabalho, os dois processos devem registrar a mesma ligação.
- `situacao`: `em_operacao` (padrão), `em_implantacao` (roda em parte) ou `no_papel` (desenhado, ainda não aconteceu). Use quando o documento descreve um desenho que ainda não foi posto em prática.
- `fluxo_dispensado`: texto com o motivo e o id da decisão, quando uma folha não precisa de passo a passo agora (ex.: `"DE-01: nesta fase só comercial e cobrança"`). O `status` deixa de pedir o fluxo desse processo.
- `codigo`: só preencha para forçar uma numeração que a empresa já usa.

## 6. Fluxo (passo a passo)

```json
"fluxo": {
  "status": "declarado",
  "evidencias": ["EV-0020"],
  "raias": ["PA-01", "PA-03"],
  "externos": [{"id": "X1", "nome": "Parceiro"}],
  "nos": [
    {"id": "i1", "tipo": "inicio", "nome": "Indicação recebida", "raia": "PA-01", "gatilho": "mensagem"},
    {"id": "t1", "tipo": "tarefa", "nome": "Registrar indicação", "raia": "PA-01", "sistema": "SI-01", "modo": "sistema"},
    {"id": "g1", "tipo": "decisao", "nome": "Empresa está no ICP?", "raia": "PA-01"},
    {"id": "s1", "tipo": "subprocesso", "nome": "Conduzir diagnóstico", "raia": "PA-03", "processo": "P-07"},
    {"id": "e1", "tipo": "espera", "nome": "Retorno do cliente", "raia": "PA-01", "evento": "mensagem"},
    {"id": "p1", "tipo": "paralelo", "raia": "PA-01"},
    {"id": "f1", "tipo": "fim", "nome": "Indicação descartada", "raia": "PA-01"}
  ],
  "ligacoes": [
    {"de": "i1", "para": "t1"},
    {"de": "g1", "para": "s1", "rotulo": "Sim"},
    {"de": "g1", "para": "f1", "rotulo": "Não"}
  ],
  "mensagens": [
    {"de": "X1", "para": "i1", "rotulo": "Indicação"},
    {"de": "t5", "para": "X1", "rotulo": "Proposta"}
  ]
}
```

Tipos de nó:

| tipo | BPMN | Campos úteis |
|---|---|---|
| `inicio` | evento de início | `gatilho`: `mensagem` (chega de fora), `tempo` (agenda), vazio (alguém decide começar) |
| `fim` | evento de fim | `nome` = o resultado ("Proposta aceita"); um fim por resultado diferente |
| `tarefa` | tarefa | `modo`: `sistema` (pessoa usando sistema), `automatico` (sistema sozinho), vazio; `sistema`: id |
| `subprocesso` | subprocesso recolhido | `processo`: id do processo filho que detalha o passo |
| `decisao` | desvio exclusivo | `nome` em forma de pergunta; cada ligação de saída com `rotulo` (a condição) |
| `paralelo` | desvio paralelo | sem rótulos; usado para abrir e para juntar caminhos simultâneos |
| `inclusivo` | desvio inclusivo | evite; use só se um ou mais caminhos podem acontecer juntos |
| `espera` | evento intermediário | `evento`: `mensagem` ou `tempo`; `nome` = o que se espera ("5 dias", "Resposta do cliente") |

Campos opcionais por nó: `status` (quando um passo foi validado e o resto não), `descricao`, `tempo_execucao`, `tempo_espera`, `pca`, `valor`.

Regras que o `validar` confere: tem início e fim; início sem entrada, fim sem saída; todo passo tem entrada e saída; todo nó está num caminho do início a um fim; decisões com condição em cada saída; nomes de passos com verbo no infinitivo; fins e passos sem nomes repetidos; início por mensagem tem de onde a mensagem vem; até 30 elementos por fluxo. Detalhes de como levantar e desenhar em `fluxos-bpmn.md`.

## 7. Evidências

```json
{"id": "EV-0012", "tipo": "formulario", "fonte": "FO-02: Rodada 2, Parcerias", "pessoa": "PE-01", "data": "2026-10-29",
 "trecho": "Citação literal do que a pessoa respondeu ou do documento", "local": "FO-02/Q-0014"}
```

Tipos: `documento`, `formulario`, `entrevista`, `workshop`, `observacao`, `sistema`, `site`, `validacao`.

- `trecho` é sempre literal (corte o necessário, sem reescrever). É o que permite a qualquer pessoa conferir de onde veio cada afirmação.
- `local`: página e seção do documento, ou formulário e pergunta.
- `pessoa` vazio para documentos e sites.
- Registre com `mapa.py evidencia PASTA --tipo documento --fonte "Playbook v3" --trecho "..." --local "seção 4"`; a ingestão de formulários cria as evidências sozinha.

## 8. Perguntas e formulários

```json
{"id": "Q-0014", "texto": "Quando um parceiro indica uma empresa, o que acontece primeiro?", "tipo": "aberta", "opcoes": [],
 "ajuda": "Pense na última indicação que chegou.", "alvo": ["P-04.gatilho", "P-04.fluxo"], "para": ["PE-01"],
 "rodada": 2, "bloco": "Indicações", "status": "aberta", "formulario": null, "respostas": []}
```

- `obrigatoria` (opcional, `true`): torna a pergunta obrigatória no formulário. `numerar` (interno): o `validacao` usa `false` nos passos do fluxo, que já vêm numerados.
- `alvo`: `ID` ou `ID.campo`, ou contexto (`NEGOCIO.receita`, `ESTRUTURA.areas`, `ESCOPO.objetivo`, `NOVO.algo`). É o que liga a pergunta à lacuna e evita perguntar duas vezes. `ID` sozinho cobre só a existência do elemento; para cobrir um campo (inclusive o passo a passo), use `ID.campo` (`P-08.fluxo`). Uma pergunta pode ter vários alvos.
- `status`: `aberta` (escrita), `em_formulario` (gerada num formulário), `respondida`, `sem_resposta`, `cancelada`. Quando `para` tem mais de uma pessoa, a ingestão guarda quem já respondeu em `respondida_por` e só marca `respondida` quando todos responderam.
- `tipo`: `aberta`, `curta`, `lista`, `escolha`, `multipla`, `escala`, `confirmacao`.

```json
{"id": "FO-02", "titulo": "Rodada 2: como funcionam as parcerias", "rodada": 2, "para": ["PE-01", "PE-02"], "canal": "google_forms",
 "perguntas": ["Q-0014", "Q-0015"], "introducao": "Texto opcional de abertura", "link": "", "status": "rascunho", "enviado_em": "", "prazo": ""}
```

Campos que o script preenche: `respostas_recebidas` (quantas linhas já foram ingeridas) e `respondido_por` (pessoas que já responderam). O formulário só passa a `respondido` quando todos de `para` responderam; até lá fica `enviado` e o `status` continua mostrando quem falta. Uma pergunta pode estar em mais de um formulário: a lista certa é `formularios[].perguntas` (o campo `perguntas[].formulario` guarda só o último).

`canal`: `google_forms`, `artifact`, `documento`, `entrevista`. `status`: `rascunho`, `enviado`, `respondido`, `encerrado`. `identificacao` (padrão `true`, e `false` quando o canal é `entrevista`) controla se o script acrescenta as perguntas de identificação e de fecho.

## 9. Contradições, decisões, glossário, ideias, histórico

```json
"contradicoes": [{"id": "CT-01", "descricao": "Quem aprova desconto: a diretora diz que é o comercial; o comercial diz que é a diretoria.",
                  "elemento": "P-06", "evidencias": ["EV-0010", "EV-0011"], "status": "aberta", "pergunta": "Q-0033", "resolucao": "", "evidencias_resolucao": []}],
"decisoes":     [{"id": "DE-01", "data": "2026-10-29", "texto": "Escopo: só o programa de parcerias.", "por": "PE-01"},
                 {"id": "DE-02", "data": "2026-10-29", "texto": "Suposição: o patrocinador é o dono da empresa.", "por": null, "provisoria": true, "pergunta": "Q-0003"}],
"glossario":    [{"id": "GL-01", "termo": "Base Ativa", "definicao": "Como a empresa define", "sinonimos": []}],
"ideias":       [{"id": "ID-01", "texto": "Ideia de melhoria como foi dita", "processo": "P-05", "evidencias": ["EV-0020"]}],
"historico":    [{"data": "2026-10-29", "evento": "Rodada 1 enviada"}]
```

Ao resolver uma contradição: `status: "resolvida"`, `resolucao` com a explicação e a evidência que decidiu, e ajuste o status do elemento.

`aceita_lacunas` (lista de alvos no formato do `lacunas`, como `"ESTRUTURA.tipo_suporte"` ou `"P-07.fluxo"`): o patrocinador aceita deixar essas lacunas em aberto; elas saem do `status` e da conferência. Vale só em decisão não provisória.

Decisões provisórias são as suposições de escopo feitas sem o patrocinador (quem aprova, o que fica de fora, canal, critério de pronto). Ficam com `provisoria: true`, `por: null` e a pergunta que as confirma; o `status` lista as que ainda estão abertas. Quando alguém confirmar, troque `provisoria` para `false`, preencha `por` e ligue a evidência em `evidencias`.

## 10. Campos só de registro

Estes campos são guardados e aparecem no mapa interativo quando fazem sentido, mas o script não confere nem calcula nada com eles: `processos[].estados_finais` (os fins do fluxo são a referência), `papeis[].externo`, `processos[].prioridade` (usado só para ordenar as lacunas de passo a passo), e os campos de diagnóstico dos nós (`tempo_execucao`, `tempo_espera`, `pca`, `valor`).

## 11. Como editar com segurança

- Edite com mudanças pequenas e localizadas (ferramenta de edição ou um script Python curto que lê, altera e grava). Nunca reescreva o arquivo inteiro de memória.
- Depois de cada lote de mudanças: `mapa.py validar PASTA` deve terminar com 0 erros.
- O `mapa.py` grava de forma atômica e atualiza `atualizado_em`. Se você editar à mão, mantenha o JSON válido (aspas duplas, sem vírgula sobrando).
- Guarde uma cópia em local durável depois de cada sessão (veja o SKILL.md).
