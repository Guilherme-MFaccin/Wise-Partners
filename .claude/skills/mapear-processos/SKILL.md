---
name: mapear-processos
description: Mapeia a hierarquia e a arquitetura de processos de qualquer organização (cliente, prospect, parceiro, a própria empresa ou um programa interno) sem supor nada. Descobre os fatos com rodadas de formulários dirigidos às pessoas certas, liga cada afirmação à evidência de onde veio e gera o mapa visual (cadeia de valor, hierarquia, fluxos BPMN) como mapa interativo, quadro no Miro, draw.io e bpmn.io. Use sempre que o pedido envolver mapear processos, arquitetura ou hierarquia de processos, cadeia de valor, macroprocessos, fluxograma ou BPMN de uma empresa, levantamento do estado atual (as-is), diagnóstico de como uma operação funciona, ou montar questionários para entender o trabalho de uma equipe, mesmo que a palavra "processo" não apareça. Também para continuar um mapeamento já iniciado, processar respostas de formulários ou atualizar o mapa.
---

# Mapear processos

Esta skill conduz um mapeamento de processos do início ao fim, em rodadas, até a arquitetura estar completa e validada. Ela serve para qualquer organização: um cliente da consultoria, um prospect, um parceiro, a própria empresa do usuário ou um programa interno.

Três ideias sustentam tudo:

1. **Nada é suposto.** Cada afirmação no mapa aponta para uma evidência: a citação literal, quem disse, quando e onde. O que vem do seu raciocínio, de analogia com outras empresas ou de modelos de referência entra como **hipótese** e vira pergunta. Isso existe porque um mapa com suposições parece pronto e está errado, e ninguém consegue saber onde.
2. **Perguntar é o método.** O conhecimento de uma organização está espalhado: cada pessoa conhece bem a própria parte. Por isso o levantamento acontece em rodadas de formulários curtos, cada um dirigido a quem sabe, e cada pergunta fecha uma lacuna ou testa uma hipótese.
3. **Uma fonte de verdade.** Tudo fica num arquivo, `mapa.json`. As visualizações são geradas a partir dele e refeitas a cada rodada.

O método vem de Dumas et al. (*Fundamentals of BPM*), Silver (*BPMN Method and Style*), ABPMP (*BPM CBOK*), TOGAF 10, Ross, Weill e Robertson (*Enterprise Architecture as Strategy*) e do pensamento Lean. Os detalhes estão em `references/`.

## Ferramenta

O script `scripts/mapa.py` (Python 3, só biblioteca padrão) faz o trabalho mecânico: valida a lógica, mede a cobertura, lista as lacunas por pessoa, gera formulários, lê respostas e desenha as saídas. O caminho é `${CLAUDE_SKILL_DIR}/scripts/mapa.py` no Claude Code; em outras superfícies, use a pasta informada como "Base directory" ao carregar a skill. Abaixo, `M` = esse caminho e `PASTA` = a pasta do mapeamento.

| Comando | Para quê |
|---|---|
| `python3 M iniciar PASTA --empresa "Nome" [--consultor "Nome"] [--forcar]` | Cria a pasta e o `mapa.json` vazio |
| `python3 M status PASTA [--max N]` | Cobertura, lacunas agrupadas por pessoa e pendências (rode no começo de toda sessão) |
| `python3 M lacunas PASTA [--sem-pergunta] [--para PE-xx] [--json]` | Lacunas em ordem de prioridade |
| `python3 M validar PASTA` | Conferência lógica; termine sempre com 0 erros |
| `python3 M id PASTA PREFIXO --n N` | Próximos ids livres (P, EV, Q, FO, PA, PE...) |
| `python3 M evidencia PASTA --tipo T --fonte F --trecho "..." [--pessoa PE-xx] [--local L]` | Registra uma evidência (ex.: de documento) e devolve o id |
| `python3 M formulario PASTA FO-xx` | Gera o formulário: Google Forms (Apps Script), texto e página |
| `python3 M ingerir PASTA FO-xx ARQUIVO` | Lê respostas (CSV do Google Forms ou JSON do artifact) e cria evidências |
| `python3 M responder PASTA Q-xxxx --pessoa PE-xx --texto "..."` | Registra uma resposta que veio por conversa, texto ou entrevista e fecha a pergunta |
| `python3 M validacao PASTA P-05,P-06 --para PE-02 --formulario FO-07 [--so-fluxo \| --sem-fluxo] [--raias PA-xx]` | Cria frases de confirmação a partir do que já foi declarado (rodada 4 por padrão) |
| `python3 M frases PASTA P-05` | Lê o fluxo de um processo em frases numeradas |
| `python3 M renderizar PASTA [--formatos html,bpmn,drawio,mermaid,miro,relatorio]` | Gera mapa interativo, BPMN, draw.io, Mermaid, Miro e relatório |
| `python3 M exemplo PASTA` | Copia um mapeamento fictício completo, para ver as saídas |

Se a pasta `scripts/` não existir junto desta skill (instalação só com o SKILL.md), avise o usuário que a versão completa está no repositório `mapeamento-de-processos` e siga as mesmas regras à mão: mantenha o `mapa.json` no formato de `references/modelo-de-dados.md` (ou do resumo no fim deste arquivo), escreva os formulários em texto e desenhe os fluxos em Mermaid.

## Argumentos do comando

Quando a skill for chamada com argumentos (aparecem como `ARGUMENTS:`), leia assim:

- `iniciar <empresa>` ou só o nome de uma empresa: começa um mapeamento novo (Fase 0).
- `status`: mostra a situação do mapeamento ativo e a próxima ação recomendada.
- `rodada` ou `formulario`: prepara a próxima rodada de formulários a partir das lacunas.
- `ingerir <arquivo ou link>`: processa respostas recebidas. Descubra o formulário (FO-xx) pelo nome do arquivo ou comparando as perguntas com `formularios/*/itens.json`; se houver dúvida, pergunte.
- `documento <arquivo>`: registra um documento como fonte e extrai os fatos.
- `validacao`: prepara a rodada de validação dos processos declarados (usa `mapa.py validacao`).
- `conferir`: roda a conferência lógica (`mapa.py validar`) e explica o que encontrou.
- `mapa`, `visualizar`, `miro`, `drawio`, `bpmn`: gera e entrega as visualizações.

Sem argumentos: se houver um mapeamento em andamento (pasta com `mapa.json`), rode `status` e proponha o próximo passo; se não houver, pergunte qual organização mapear e comece a Fase 0.

## Onde o mapeamento fica guardado

Um mapeamento dura semanas e passa por várias sessões. A pasta tem esta estrutura:

```
mapeamentos/<slug-da-empresa>/
  mapa.json        a fonte de verdade
  fontes/          documentos recebidos (cópias)
  formularios/     uma subpasta por formulário gerado
  respostas/       CSV, JSON e textos que voltaram
  saidas/          mapa interativo, BPMN, draw.io, Mermaid, Miro, relatório
```

Onde criar:
- **Claude Code no computador do usuário:** dentro do projeto atual (`./mapeamentos/<slug>`), ou onde o usuário indicar.
- **Sessão na nuvem (app ou web):** o espaço de trabalho é temporário. Guarde a pasta num lugar durável e restaure de lá no começo de cada sessão: uma pasta conectada do computador do usuário, se houver; senão os documentos do Projeto do Claude, se a sessão estiver num Projeto (por exemplo `mapeamentos/<slug>/mapa.json`); senão o Google Drive conectado. Se nada disso existir, entregue o `mapa.json` ao usuário no fim de cada sessão e peça para ele anexar na próxima. Nunca deixe o mapeamento só no espaço temporário sem avisar.

No começo de cada sessão, encontre o `mapa.json` mais recente antes de qualquer outra coisa: na pasta do projeto local, nos documentos do Projeto (procure por `mapeamentos/`), na pasta conectada ou no Drive. Restaure a pasta inteira para o espaço de trabalho e só então rode `status`. Ao salvar de volta, guarde ao menos o `mapa.json` e os arquivos de `respostas/`; as `saidas/` podem ser refeitas a qualquer momento.

## O ciclo

```
Fase 0  Escopo com o usuário ou patrocinador          (campo rodada = 0)
Fase 1  Documentos e fontes existentes                 (sem formulário)
Fase 2  Rodada 1: modelo de negócio e grandes frentes  (rodada = 1)
Fase 3  Rodada 2: processos de cada área               (rodada = 2)
Fase 4  Rodada 3: passo a passo dos prioritários       (rodada = 3)
Fase 5  Rodada 4: validação em frases                  (rodada = 4)
        ... repete rodadas dirigidas (5, 6...) até os critérios de pronto
```

Cada rodada segue o mesmo laço:

1. `status` e `lacunas --sem-pergunta`: o que falta e quem deveria saber.
2. Escrever as perguntas no `mapa.json`, cada uma com `alvo` (a lacuna que fecha) e `para` (quem responde).
3. Criar o formulário e gerar com `formulario`.
4. Entregar ao usuário os formulários, o convite e as instruções de envio. Marcar como `enviado` quando ele confirmar.
5. Quando as respostas voltarem: `ingerir`, interpretar e atualizar o mapa com as evidências.
6. `validar`, registrar contradições, `renderizar` e mostrar o que mudou.
7. Decidir a próxima rodada.

Use a lista de tarefas para acompanhar as fases quando ela existir na sessão. Entre uma rodada e outra o usuário precisa agir (enviar formulários, esperar respostas), então cada entrega termina dizendo exatamente o que ele precisa fazer e o que você fará quando as respostas chegarem.

## Fase 0: escopo

Sempre primeiro. Pergunte ao usuário (de preferência com perguntas de múltipla escolha, até quatro por vez), registrando cada resposta como evidência `entrevista` com `pessoa` = o usuário:

1. Qual organização, e o que ela faz em uma frase.
2. Para que serve o mapa (documentar, implantar CRM ou ERP, melhorar, treinar, preparar crescimento ou franquia). O objetivo define a profundidade.
3. Escopo: a organização toda ou uma parte (área, unidade, programa). O que fica de fora.
4. Quem aprova e decide divergências (patrocinador).
5. Pessoas-chave por área e como falar com elas.
6. Documentos disponíveis (organograma, manuais, playbooks, apresentações, contratos, relatórios de sistema, site).
7. Canal de formulário que funciona com essas pessoas (Google Forms, página do Claude, texto por WhatsApp ou e-mail, conversa).
8. Prazo e critério de pronto (padrão em `references/metodo.md` seção 11).

Com as respostas, preencha `organizacao.objetivo_do_mapeamento`, `organizacao.escopo.inclui` e `organizacao.escopo.exclui`, `organizacao.patrocinador` (o id `PE-xx` da pessoa, cadastrada em `pessoas`) e, se mudar os nomes dos níveis, `organizacao.niveis`. Sem esses campos, o `status` continua mostrando lacunas de escopo. O critério de pronto, o canal e o prazo vão em `decisoes`.

Se o usuário não puder responder agora, siga com a leitura mais razoável e registre cada suposição como decisão provisória (`"provisoria": true`, `"por": null` e `"pergunta"` com o id da pergunta que a confirma). O `status` mostra as decisões provisórias até alguém confirmar. Diga no topo da entrega o que foi suposto.

O usuário conta como fonte: o que ele afirma entra como `declarado`, com evidência em nome dele (se o nome não for conhecido, cadastre "Quem pediu o mapeamento"). Quando a organização é dele, é fonte interna; quando é um cliente, é a visão de quem vê de fora, que conta como uma fonte e precisa de alguém de dentro para virar `confirmado`.

## Fase 1: documentos

Leia o que existe antes de perguntar: deixa os formulários mais curtos e mais precisos.

- Para cada fato útil, registre uma evidência `documento` com o trecho literal e o local (página, seção), e crie ou atualize o elemento como `declarado`.
- Documento descreve o desenho oficial, que pode diferir da prática. Use-o como fonte, mas confirme com quem executa.
- Site e materiais públicos entram como evidência `site`. Informação sobre a empresa vinda de terceiros entra como hipótese.
- Use o que leu para formar hipóteses e perguntas melhores ("o playbook diz X; na prática, como funciona?"), nunca para preencher o que não está escrito.
- **Desenho que ainda não roda:** se o documento descreve como o trabalho vai funcionar, mas ele ainda não aconteceu (programa novo, área em implantação), registre os processos com `"situacao": "no_papel"` (ou `"em_implantacao"` se roda em parte). O mapa mostra a marca, e as perguntas passam a ser "isso já aconteceu alguma vez? como foi?". Processo só no papel nunca vira `confirmado` pela prática, só pelo desenho aprovado.
- **Documento indicado que você não consegue abrir:** diga ao usuário qual é e peça para anexar ou colar; siga com as outras fontes e registre em `historico`. Não presuma o conteúdo.
- **Anotações de conversas anteriores, memória ou resumos** (sem citação literal da pessoa) não são evidência: entram como `hipotese`, cada uma com uma frase de confirmação para quem disse.
- **Documento contra hipótese sua:** se um documento contradiz algo que você tinha suposto, a hipótese simplesmente cai; atualize o elemento para o que o documento diz. Contradição é só entre fontes.

## Fase 2: modelo de negócio e grandes frentes (Rodada 1)

Público: diretoria, sócios, patrocinador. Objetivo: ofertas, clientes, proposta de valor, canais, receitas, áreas e papéis, modelo operacional e os macroprocessos (nível 1).

- Banco de perguntas: `references/formularios.md` seção 4, Rodada 1.
- Quando o objeto do mapeamento é um programa interno ou uma área (não a empresa inteira), traduza o banco: "cliente" é quem recebe o resultado do programa (ex.: o parceiro), "receita" é como o programa gera valor para a empresa, e a Rodada 1 vai para quem conhece o programa inteiro (às vezes o gerente, não a diretoria).
- A pergunta mais valiosa: "Pense no último cliente que fechou. Conte o caminho dele, do primeiro contato até o dinheiro entrar e ele ficar atendido." Dela saem os macroprocessos finalísticos e a primeira cadeia de valor.
- Chegue aos macroprocessos pelo método de identificação ponta a ponta (`references/metodo.md` seção 5): ofertas, caminhos, cortes onde muda o objeto de negócio ou a área, depois gestão e suporte.
- Modelo operacional: só pelas duas perguntas de integração e padronização (`metodo.md` seção 6), nunca pelo porte ou setor.
- Categorias (gestão, finalísticos, suporte) que não apareceram são lacunas e viram pergunta, não conclusão.

## Fase 3: processos de cada área (Rodada 2)

Público: gestores e responsáveis de cada área. Objetivo: processos de nível 2 com nome, propósito, dono, gatilho, entradas, saídas, cliente, papéis, sistemas e frequência.

- Banco de perguntas: Rodada 2. Um formulário por área ou por perfil.
- Aplique o checklist "isto é mesmo um processo?" (`metodo.md` seção 4) a cada candidato. O que não passa vira atividade de outro processo, função contínua ou projeto, e você pergunta para confirmar.
- Passagens de trabalho: quando a área A diz que entrega algo para a área B, pergunte à B se recebe. O `validar` aponta passagens confirmadas só de um lado.
- Antes da Rodada 3, peça a priorização (importância, saúde, viabilidade) das folhas: só as prioritárias ganham passo a passo agora.

## Fase 4: passo a passo (Rodada 3)

Público: quem executa cada processo prioritário (e o dono). Objetivo: o fluxo.

- Confirme primeiro o escopo do processo: como começa, o que define o fim, o que é um caso, quais os jeitos de terminar (`references/fluxos-bpmn.md` seção 1).
- Peça o último caso real, passo a passo, e depois o "dia de chuva": o que acontece quando falta informação, o cliente some, o prazo estoura, o sistema cai.
- Escreva o fluxo no `mapa.json` de cima para baixo, com as regras de estilo de `fluxos-bpmn.md`: verbo no infinitivo nos passos, decisões como pergunta com condição em cada saída, um fim por resultado, raias por papel, externos fora com mensagens.
- Fluxo montado a partir das respostas fica `declarado`, mesmo que várias pessoas tenham descrito partes dele: o passo a passo só vira `confirmado` com a validação do dono (Fase 5). Partes que você deduziu para fechar a lógica (um passo que "deve existir") ficam como nó com `status: "hipotese"` e geram pergunta.

## Fase 5: validação (Rodada 4)

Público: dono do processo e quem executa.

- Para o dono: `python3 M validacao PASTA P-05 --para PE-02 --formulario FO-xx` cria as frases de confirmação (propósito, dono, gatilho, entregas, cliente e cada passo). Para quem executa e não é dono: rode de novo com `--so-fluxo` (e `--raias PA-xx` se a pessoa faz só uma parte) e outro formulário. Depois, `formulario` gera cada um. Quem executa valida frases, não diagramas.
- Na ingestão, "Sim, está correto" de quem ocupa o papel de dono vira evidência de `validacao` ([VALIDOU]); de outra pessoa, conta só como mais uma fonte ([CONFIRMOU, MAS NÃO É O DONO]). Fatos e contexto do negócio são validados pelo patrocinador ou pela liderança.
- Elemento validado pelo dono passa a `confirmado`. Fatos, papéis e sistemas também podem chegar a `confirmado` por duas fontes independentes que concordam; o passo a passo, só pelo dono.
- Correções viram atualização do mapa, com a evidência da correção, e uma nova frase de confirmação se a mudança for relevante.

## Como interpretar respostas

Esta é a parte em que um mapeamento costuma se perder. Para cada resposta ingerida:

1. **Atribua o fato ao campo certo** e ligue o id da evidência em `evidencias` do elemento. Use as palavras de quem respondeu; termos próprios da empresa vão para o `glossario`.
2. **Uma fonte = `declarado`.** Validação do dono, ou duas fontes independentes que concordam = `confirmado` (exceto o passo a passo, que exige o dono).
3. **Fontes discordam:** não escolha um lado e não faça média. Registre em `contradicoes` (com as duas evidências e `pergunta` apontando para a pergunta de conciliação), marque o elemento como `contestado` e crie a pergunta de conciliação para as pessoas envolvidas e para o dono (modelo em `formularios.md`), com `alvo` incluindo o `CT-xx` e o campo em disputa. A resolução também é evidência.
4. **Dedução sua** (ex.: "se emitem nota, alguém cobra") entra como elemento `hipotese`, ou como campo listado em `hipoteses`, sempre com pergunta pendente. Nunca como `declarado`.
5. **Modelos de referência** (APQC, cadeia de Porter, Business Model Canvas) servem de lista de verificação para gerar perguntas sobre o que não apareceu. Não copie processos deles para o mapa.
6. **"Não sei"** não fecha lacuna. Use a indicação de quem saberia: cadastre a pessoa em `pessoas` com `indicado_por` e direcione a pergunta a ela.
7. **Ideal contra real:** se a resposta descreve como deveria ser ("o certo é..."), pergunte como foi na última vez. Ideias de melhoria vão para `ideias`, fora do mapa do estado atual.
8. **Números** ficam como foram ditos ("uns 40 por semana"). Não arredonde nem converta.
9. **Fora do escopo:** registre o que apareceu (pode virar lacuna de outra frente), mas não aprofunde sem decisão do patrocinador.
10. **Dados pessoais:** guarde só nome, cargo e contato de trabalho das pessoas. Opiniões sobre colegas e queixas pessoais não entram no mapa; se forem relevantes para um problema de processo, registre o problema sem identificar pessoas.
11. **Passagem de trabalho contada por um lado só:** registre só o lado que falou (a saída de quem entrega, com a evidência). Não preencha a entrada nem o gatilho do processo que recebe a partir do relato de quem entrega: o alerta A04 fica de propósito até o outro lado confirmar, e vira pergunta para ele.
12. **Dividir um processo a partir de uma resposta:** divida por caso tratado (cada contratação, cada folha mensal, cada desligamento), nunca por quem faz: quem faz cada parte vira raia no passo a passo. Se a pessoa citou os casos ("eu decido quem entra e quem sai; a Sônia faz a papelada da admissão, a folha e o desligamento"), os filhos entram como `declarado` com essa evidência, e você pode ajustar o nome para verbo + objeto sem mudar o sentido. Se a divisão é ideia sua, os filhos são `hipotese` com pergunta. Quando cada um faz uma parte, o dono do todo continua sendo uma pergunta ("quem responde pelo resultado completo?"); não escolha.
13. **Decisões de profundidade:** quando o patrocinador decide não detalhar algo agora ("passo a passo só do comercial nesta fase"), marque os processos afetados com `fluxo_dispensado` citando o id da decisão. Assim o `status` para de pedir o que foi deliberadamente deixado de fora.
14. **Conciliação respondida pelo dono** (ou pelas duas partes, concordando) resolve a contradição: `status: "resolvida"`, `resolucao` com o texto e `evidencias_resolucao` com os ids. Se quem respondeu é o dono do processo, mude o `tipo` dessa evidência para `validacao`. O elemento sai de `contestado` para `confirmado` se o dono validou ou se as duas partes concordaram (duas fontes); para `declarado` se a resolução veio de uma pessoa só.
15. **Lacuna que o patrocinador aceita deixar aberta** (uma categoria que a empresa não tem, uma hipótese que não vale perguntar agora): registre uma decisão com `aceita_lacunas: ["ESTRUTURA.tipo_suporte", ...]` usando o mesmo formato de alvo do `lacunas`. Ela some do `status` e da conferência.

### Depois de cada ingestão (lista de conferência)

1. Leia o resumo do `ingerir` pergunta por pergunta, inclusive o campo de comentários ("algo importante que não perguntamos?"), que costuma trazer fatos que ninguém pediu, e atualize os campos, ligando a evidência indicada.
2. Frases marcadas [VALIDOU] pelo dono: suba o elemento para `confirmado`. [NÃO CONFIRMOU]: leia o campo de correções do bloco e corrija.
3. Cadastre as pessoas indicadas (o resumo lista as indicações) com `indicado_por`.
4. Registre contradições novas e resolva as que a rodada fechou.
5. Mova ideias de melhoria para `ideias`.
6. Perguntas cuja resposta não fechou a lacuna: crie uma pergunta nova, mais específica.
7. `validar` (0 erros; o erro E10 aponta hipóteses que perderam a pergunta porque ela foi respondida: atualize o elemento com a resposta), `status`, `renderizar`, e explique ao usuário o que mudou. Se a completude caiu porque o mapa ganhou processos novos, diga isso: é sinal de progresso, não de retrocesso.

## Formulários

Regras completas, banco de perguntas e canais em `references/formularios.md`. O essencial:

- Até 12 perguntas do mapeamento por formulário, no máximo 4 narrativas (10 a 15 minutos). O script acrescenta identificação, "quem mais deveríamos ouvir" e "que documento mostra isso"; não repita essas perguntas. Para o próprio usuário, pergunte na conversa em vez de gerar formulário.
- Linguagem de quem responde, sem termos técnicos de processos. Caso real antes de regra geral. Uma coisa por pergunta. Nada que induza a resposta.
- Toda pergunta tem `alvo` e `para`. Pessoas do mesmo papel recebem o mesmo formulário: as diferenças entre elas revelam variações.
- Canais (valor do campo `canal` entre parênteses): **Google Forms** (`google_forms`, padrão para quem não usa o Claude: o usuário cola o `google-forms.gs` em script.google.com e executa; as respostas vão para uma planilha, baixada como CSV ou lida pelo conector do Google Drive); **página do Claude** (`artifact`: publique `formulario.artifact.html` com banco de respostas, para pessoas da mesma organização no Claude; leia com `ArtifactData`); **texto** (`documento`: `formulario.md` para WhatsApp, e-mail ou roteiro de conversa); **conversa direta** (`entrevista`), com o usuário quando ele mesmo é quem sabe. Respostas por texto ou conversa entram com `mapa.py responder`, uma por pergunta.
- Entregue junto um convite curto para o usuário mandar (modelo em `formularios.md` seção 6).

## Visualização e entrega

`python3 M renderizar PASTA` gera tudo em `saidas/`. Detalhes em `references/visualizacao.md`.

- **Mapa interativo** (entrega principal): cadeia de valor clicável, hierarquia com busca e filtros por status, fluxos em BPMN com a leitura em frases ao lado, lacunas por pessoa, modelo de negócio e matriz de quem faz o quê, cada afirmação com a citação de origem. Com a ferramenta Artifact, publique `mapa-interativo.artifact.html` (ícone `map`, `capabilities: {"downloads": true}` na primeira publicação) e republique o mesmo arquivo a cada rodada para manter o link. Sem ela, entregue `mapa-interativo.html`.
- **Miro:** se o conector estiver disponível e o usuário quiser, confirme a criação do quadro, carregue as instruções do conector e envie os módulos de `saidas/miro/` em ordem com `canvas_create_from_svg`.
- **Arquivos editáveis:** `mapa.drawio` (diagrams.net, uma página por visão com links), `bpmn/*.bpmn` (bpmn.io, Camunda, Bizagi), `mermaid/*.mmd` (Notion, GitHub, Obsidian). O próprio mapa interativo tem um botão que baixa todos num .zip.
- **Relatório:** `relatorio.md` para o acompanhamento com o patrocinador.

Ao entregar: uma frase com o que mudou, o mapa, as lacunas que ainda importam por pessoa e a proposta da próxima rodada.

## Critérios de pronto

Combine na Fase 0 e confira com `status` (detalhes em `metodo.md` seção 11):

- Negócio: os cinco temas obrigatórios declarados; áreas e papéis levantados; modelo operacional classificado quando há mais de uma área.
- Macroprocessos com tipo, propósito e dono; as três categorias perguntadas.
- Processos com os campos mínimos; passagens confirmadas dos dois lados.
- Folhas prioritárias com passo a passo validado pelo dono.
- `validar` sem erros, nenhuma contradição aberta, hipóteses e lacunas restantes aceitas pelo patrocinador numa decisão com `aceita_lacunas`.
- Completude a partir de 90% e validação a partir de 70%, salvo outro acordo.

Pare quando os critérios forem atingidos. Detalhar além do que o objetivo pede custa tempo das pessoas e não melhora o mapa.

## Editando o mapa.json

- Peça ids com `id`. Faça mudanças pequenas e localizadas (ferramenta de edição ou um script Python curto que lê, altera e grava). Nunca reescreva o arquivo inteiro de memória: é assim que dados se perdem.
- Depois de cada lote, `validar`. Erros de evidência (E04) significam que um status está acima do que a evidência sustenta: rebaixe o status ou ligue a evidência certa.
- Guarde a pasta no lugar durável combinado ao fim de cada bloco de trabalho.

## Resumo do modelo de dados

Completo em `references/modelo-de-dados.md`; exemplo válido em `exemplos/exemplo-mapa.json`.

- Ids com prefixo e número, únicos no arquivo: `P-01`, `EV-0001`, `Q-0001`, `FO-01`, `PA-01`, `PE-01`, `AR-01`, `SI-01`, `OB-01`, `F-001`, `OF-01`, `CV-01`, `CT-01`, `DE-01`, `GL-01`, `ID-01`.
- `organizacao` (nome, objetivo_do_mapeamento, escopo {inclui, exclui}, patrocinador, niveis), `configuracao`, `modelo_operacional` (integracao, padronizacao, tipo, justificativa, status, evidencias)
- `fatos` (tema, texto), `ofertas`, `cadeias_de_valor` (gatilho, valor, ofertas, etapas ligadas a processos)
- `areas`, `papeis` (área), `pessoas` (papéis, perfil, contato, indicado_por), `sistemas`, `objetos` (ciclo de vida: cria, usa, encerra)
- `processos`: id, nome, pai, tipo (nível 1), ordem, descricao, dono, participantes, gatilho, entradas [{nome, de}], saidas [{nome, para}], cliente, sistemas, indicadores, frequencia, dores, regras, prioridade, situacao (em_operacao, em_implantacao, no_papel), fluxo_dispensado, status, hipoteses, evidencias, fluxo
- `fluxo`: status, evidencias, raias (papéis), externos, nos (inicio, fim, tarefa, subprocesso, decisao, paralelo, inclusivo, espera), ligacoes (de, para, rotulo), mensagens
- `evidencias`: tipo, fonte, pessoa, data, trecho literal, local
- `perguntas`: texto, tipo, opcoes, alvo (`ID`, `ID.campo` ou `NEGOCIO.`/`ESTRUTURA.`/`ESCOPO.`/`NOVO.`), para, rodada, bloco, status, respondida_por; `formularios`: perguntas, para, canal, status, respondido_por
- `contradicoes` (descricao, elemento, evidencias, pergunta, status, resolucao, evidencias_resolucao), `decisoes` (texto, por, provisoria, pergunta, aceita_lacunas), `glossario`, `ideias`, `historico`
- Status: `hipotese` (precisa de pergunta com alvo nele), `declarado` (precisa de evidência), `confirmado` (validação do dono, ou duas fontes; fluxo só pelo dono), `contestado` (contradição aberta)

## Referências

- `references/metodo.md`: princípios, níveis, tipos de processo, checklist "é processo?", identificação ponta a ponta, modelo operacional, priorização, testes de completude, critérios de pronto, diagnóstico opcional e fontes. Leia na Fase 0 e sempre que precisar decidir algo de método.
- `references/formularios.md`: regras de redação, como montar a rodada, tipos de pergunta, banco de perguntas por rodada, canais de envio e retorno, convite. Leia antes de cada rodada.
- `references/fluxos-bpmn.md`: escopo do processo, método de cima para baixo, padrões de linguagem para nós, regras de estilo, hierarquia entre fluxos, exemplo comentado. Leia na Fase 4.
- `references/modelo-de-dados.md`: o `mapa.json` campo a campo. Consulte ao editar.
- `references/visualizacao.md`: cada saída, publicação como artifact, Miro passo a passo, draw.io, bpmn.io, Mermaid. Leia ao entregar.
