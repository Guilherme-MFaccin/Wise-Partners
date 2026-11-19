# Revisão crítica, parte 1: macroprocessos 1 (Arquitetar), 2 (Gerir por rituais) e 3 (Medir e aprender).
JUR = {"X1": "Jurídico"}

# ================================================================ 1 Arquitetar o ecossistema
R("P-01",
  "Uma vez por ano, ou quando o programa muda de fase, decidir as regras do jogo: o papel da Wise, o valor entregue, quem é o parceiro ideal, os níveis, a comissão e como se mede o custo do canal.",
  "Sem um desenho único e publicado, cada conversa com parceiro vira uma negociação à parte. Com centenas de parceiros entrando pela campanha, as regras precisam ser poucas, iguais para todos e visíveis no portal.",
  [("Quando acontece", "Uma vez por ano e a cada mudança de fase, não a cada parceiro.", V7),
   ("Quem decide", "O Gerente de Parcerias prepara; o Diretor participa, aprova as regras e define as metas.", V7),
   ("Onde fica", "O portal guarda o desenho vigente e publica as regras na área do parceiro.", V7)],
  ["O macroprocesso não recebia nada. Pelo teste de entrada sem origem do método, o desenho anual precisa receber o resultado do ano: as medidas, a saúde do programa e os portões."],
  ["Passa a receber a saúde do programa e os portões (3.5) e o CAC e o valor devolvido (3.1)."])
LIGA("P-19", "Saúde do programa e portões", "P-01"); LIGA("P-15", "CAC e valor devolvido", "P-01")

R("P-02",
  "Listar quem está em volta do cliente da Wise (fornecedores, concorrentes e complementadores) e decidir, por categoria de parceiro, onde a Wise lidera e onde só acompanha.",
  "É daqui que sai a resposta para a pergunta: que tipo de parceiro vale buscar na próxima campanha? A campanha atual, de software de gestão, saiu dessa leitura: a dor do cliente do software é a mesma que a Wise resolve.",
  [("Unidade de análise", "A categoria de parceiro (CRM, ERP, PCP e as demais da lista aprovada).", "FO-06"),
   ("Resultado", "Um papel por categoria: a Wise lidera, segue ou não atua. Agências ficam fora porque concorrem com a Wise.", "FO-06"),
   ("Uso", "Alimenta o perfil de parceiro ideal (1.3) e a escolha do público da próxima campanha (4.1).", RV)],
  ["A entrega ia só para o perfil de parceiro ideal. Com a campanha de aquisição, ela também decide o público de cada campanha."],
  ["Entrega nova: categorias prioritárias para 4.1 Rodar a campanha de aquisição.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Planejamento anual
        t1 t G Listar clientes, fornecedores, concorrentes e complementadores do grupo
        t2 t G Decidir, por categoria, onde a Wise lidera e onde segue
        t3 s G Registrar o papel de cada categoria
        f1 f G Papel por categoria definido"""))
LIGA("P-02", "Categorias prioritárias", P98)

R("P-03",
  "Rever os cinco tipos de valor que a indústria recebe do ecossistema (descobrir, comparar e decidir, implantar integrado, pertencer e aprender, confiar) e ver quais estão bem cobertos por parceiros e quais estão fracos.",
  "Mostra onde falta parceiro para a Wise recomendar aos próprios clientes. Isso importa para a Prateleira, que passou a ser benefício do Premium: a matriz diz em quais categorias vale convidar parceiros a subir.",
  [("Os cinco elementos", "Descobrir, Comparar e decidir, Implantar integrado, Pertencer e aprender, Confiar.", V7),
   ("Quem conta na cobertura", "Só parceiros Premium e Elite, que são os que a Wise recomenda. O Select não conta como cobertura.", RV)],
  ["A matriz contava todos os parceiros. Com a escada nova, só Premium e Elite são recomendados aos clientes da Wise, então só eles cobrem um elemento."],
  ["Regra nova: a cobertura considera só Premium e Elite.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Planejamento anual
        t1 a G Montar a matriz de parceiros Premium e Elite por elemento de valor
        t2 t G Marcar os elementos com cobertura fraca
        t3 t G Escolher as categorias em que falta parceiro para recomendar
        f1 f G Matriz de cobertura revista"""),
  desc="Revisar os cinco elementos de valor e a cobertura de cada um pelos parceiros Premium e Elite, que são os que a Wise recomenda.",
  portal="mostra a matriz de parceiros Premium e Elite por elemento e onde a cobertura está fraca.")

R("P-04",
  "Escrever quem a Wise quer como parceiro e os critérios usados para aprovar um cadastro da fila.",
  "A fila existe para não deixar entrar concorrente nem curioso. Os critérios precisam estar escritos para que a qualificação pelo WhatsApp seja igual para todos e possa, um dia, ser feita por outra pessoa.",
  [("Critérios da fila", "Ter clientes empresariais que podem estar no ICP da Wise; não ser concorrente; mostrar interesse real em oferecer a consultoria; ter um responsável pela parceria.", "FO-11 e FO-12"),
   ("Sem mínimo de clientes", "Não há número mínimo de clientes ativos para entrar.", "FO-11"),
   ("Vale para qualquer tipo de parceiro", "O perfil não é só de software. A campanha é que escolhe o tipo.", "FO-11"),
   ("O que é concorrente", "Quem vende consultoria ou treinamento de gestão comercial, e agências de marketing e vendas. Um software que cobra pela implantação do próprio sistema não é concorrente.", RV),
   ("Regra da recomendação", "Só recomendar a um cliente quem a Wise indicaria ao seu melhor cliente. Vale para a subida ao Premium, não para a entrada.", V7)],
  ["O que conta como concorrente não estava escrito. Sem definição, a decisão na fila depende de quem olha."],
  ["O perfil passa a trazer a definição de concorrente.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Planejamento anual
        t1 t G Rever o ICP da Wise e as categorias prioritárias
        t2 t G Escrever os critérios da fila e a definição de concorrente
        t3 s G Publicar o perfil e os critérios no portal
        f1 f G Perfil e critérios publicados"""))

R("P-05",
  "Manter poucas regras, iguais para todos: níveis e benefícios, comissão, regulamento, política de dados e o termo de adesão.",
  "Regra única é o que permite crescer sem negociar caso a caso. O parceiro lê as regras no portal e não precisa perguntar.",
  [("Poucas e estáveis", "Uma mudança de regra só vale 30 dias depois de publicada.", V7),
   ("Aprovação", "O Diretor aprova cada mudança antes de publicar.", V7)],
  ["A descrição ainda falava em pacotes e contrapartidas, termos do desenho antigo."],
  ["Descrição atualizada para níveis, benefícios e critérios de subida."],
  desc="Níveis, benefícios e critérios de subida, regra única de comissão, contrapartida da Prateleira, regulamento curto, política de dados e termo de adesão, todos poucos e estáveis.")

R("P-61",
  "Manter a tabela dos três níveis: o que cada um recebe e o que é preciso para subir.",
  "É a regra que mais mudou em novembro. Antes o nível vinha do tamanho da carteira; agora todos entram pelo Select e sobem pelo resultado. A tabela precisa estar fechada porque o portal apura os critérios sozinho e mostra ao parceiro o que falta.",
  [("Três níveis", "Select (C), Premium (B) e Elite (A).", "FO-12"),
   ("Entrada", "Todo parceiro entra pelo Select, qualquer que seja o tamanho da carteira. Empresa grande não recebe mais por ser grande.", "FO-12"),
   ("O que o Select recebe", "Consultoria gratuita para os clientes da carteira que estão no ICP da Wise, comissão por regra única, certificado de parceiro, Wise Hub com as duas marcas, grupo de WhatsApp, comunidade e minicurso.", "FO-11 e FO-12"),
   ("O que o Premium recebe a mais", "Recomendação pela Wise aos clientes dela (nas consultorias e na Prateleira), mentoria mensal aberta à carteira, eventos e formações da Wise e apresentações a outros parceiros.", "FO-12"),
   ("O que o Elite recebe a mais", "O Base Ativa: formação gratuita e exclusiva para a base do parceiro, organizada pela Wise.", "FO-11 e FO-12"),
   ("Para subir ao Premium", "60 dias no programa e, além disso, pelo menos 3 clientes fechados com a Wise vindos dele ou a avaliação do Gerente com o Diretor. Esta é a minha leitura da sua resposta; a pergunta logo abaixo serve para confirmar.", "FO-12"),
   ("Para subir ao Elite", "60 dias no Premium, ou 6 clientes fechados vindos dele, ou a avaliação do Gerente com o Diretor.", "FO-12"),
   ("O nível nunca desce", "Se um cliente da Wise tiver problema sério com o parceiro, a Wise só deixa de recomendá-lo, sem avisar (10.3).", "FO-12"),
   ("Parceiros atuais", "Voltam ao Select, menos os que já receberam a promessa verbal dos benefícios do Premium ou do Elite. Isso acontece uma vez só, então fica registrado como decisão, não como processo.", "FO-12"),
   ("O que o parceiro deve em troca", "Nada obrigatório no Select: sem exclusividade e sem meta. No Premium, a contrapartida só aparece quando ele entra num pedido da Prateleira.", "Página dos parceiros e v7")],
  ["O nome falava em pacotes e contrapartidas, termos do desenho antigo. O que a tabela guarda hoje são benefícios por nível e critérios de subida.",
   "A entrada vinha de 'Parceiros', mas era o gatilho repetido, não uma entrega (teste de entrada sem origem).",
   "A reclassificação dos parceiros atuais acontece uma vez: pelo checklist do método (repete?), é projeto, não processo."],
  ["Nome novo: Definir níveis, benefícios e critérios de subida.", "Entrada falsa retirada; passa a receber a saúde do programa (3.5).",
   "A tabela vai também para 3.4 Revisar o nível, que aplica os critérios.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Revisão anual das regras
        t1 t G Rever os benefícios de cada nível com os resultados do ano
        t2 t G Rever os critérios de subida
        t3 t D Aprovar a tabela de níveis
        t4 s G Atualizar a tabela no portal
        f1 f G Tabela de níveis publicada"""),
  nome="Definir níveis, benefícios e critérios de subida")
IO("P-61", entradas=[]); LIGA("P-19", "Saúde do programa e portões", "P-61"); LIGA("P-61", "Tabela de níveis e critérios", "P-18")
ABERTA("criterio_premium", "P-61", "Como se combinam os critérios para subir ao Premium?",
       ["No FO-12 você escreveu: 'Tempo mínimo no programa, 60 dias e; pelo menos 3 clientes fechados com a Wise vindos dele, ou; avaliação sem critério definido por mim e pelo Igor'.",
        "O 'e' e o 'ou' permitem duas leituras. O portal precisa de uma só para listar quem está apto no fechamento trimestral."],
       ["60 dias no programa e, além disso, 3 clientes fechados ou a avaliação com o Igor", "Qualquer um dos três basta: 60 dias, ou 3 clientes fechados, ou a avaliação",
        "60 dias e 3 clientes fechados; a avaliação com o Igor só abre exceção", "Outra combinação (comente)"],
       "A primeira. Os 60 dias evitam recomendar quem a Wise acabou de conhecer; os 3 clientes ou a avaliação mostram entrega.")

R("P-62",
  "Manter a regra do dinheiro: quanto o parceiro ganha, quando recebe e o que o fornecedor dá para entrar num pedido da Prateleira.",
  "Comissão igual para todos evita negociação e ciúme entre parceiros, e deixa o portal calcular sozinho. A página dos parceiros já promete essa regra, então ela é um compromisso público.",
  [("Quanto", "40% da primeira mensalidade ao parceiro e 10% ao Gerente na Wise Makers e na Tríade; 6% e 2% do projeto na Swallow.", V7),
   ("Quando", "Depois que o primeiro pagamento do cliente compensar, ao CNPJ do parceiro, com nota fiscal. Uma vez por cliente novo.", "v7 e FO-11"),
   ("O que não gera comissão", "O Wise Hub não gera comissão.", "FO-09"),
   ("Sem exceção", "A mesma regra para quem entra pela página e para qualquer nível.", "FO-11"),
   ("Contrapartida da Prateleira", "Para entrar num pedido, o fornecedor dá algo não financeiro: ação conjunta ou condição comercial para o cliente.", V7),
   ("Revisão da regra", "Depois de dois trimestres com dados de permanência dos clientes indicados.", V7)],
  ["Entrada falsa, como em 1.4.1.",
   "A página dos parceiros fala só da consultoria da Wise Makers, e a regra guarda as três empresas do grupo. Não está decidido se o parceiro da campanha indica as três."],
  ["Entrada falsa retirada; passa a receber a checagem de 6 e 12 meses (6.8), que traz a permanência dos clientes.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Revisão anual das regras
        t1 a G Reunir os dados de permanência dos clientes indicados
        t2 t G Comparar a comissão paga com a receita dos clientes vindos de parceiros
        t3 t D Decidir se a regra muda
        t4 s G Atualizar a regra e o simulador de ganho no portal
        f1 f G Regra de comissão confirmada ou atualizada"""))
IO("P-62", entradas=[]); LIGA("P-39", "Checagem registrada", "P-62")
ABERTA("empresas_grupo", "P-62", "O parceiro que entra pela campanha indica só a Wise Makers ou as três empresas do grupo?",
       ["A regra de comissão guarda três empresas: Wise Makers e Tríade (40% da primeira mensalidade) e Swallow (6% do projeto). O kit de vendas e o simulador de ganho também falam das três.",
        "A página dos parceiros e a página do cliente falam só da consultoria comercial da Wise Makers, a seu pedido. A resposta muda o kit, o simulador, o minicurso e para qual closer o lead vai."],
       ["Só a Wise Makers; Tríade e Swallow saem do kit e do simulador do parceiro", "Só a Wise Makers no Select; as três para Premium e Elite",
        "As três empresas para todos, como está na regra", "Não sei: decidir com o Igor"],
       "A segunda. O Select aprende uma oferta só, que é a da página; as outras entram quando a relação cresce.")

R("P-63",
  "Manter, em uma página, as regras de convivência do programa e o que a Wise faz com os dados.",
  "O parceiro e o cliente dele entregam dados à Wise. Regra curta e política clara sustentam a confiança, e a LGPD exige que isso esteja escrito.",
  [("Regulamento", "Quem participa, como se divide o valor e como se resolvem conflitos.", V7),
   ("Dados", "Só dados de empresa; cruzamento de carteiras só com consentimento e revelando só as coincidências; o parceiro vê o resultado do cliente só com autorização do cliente.", "v7 e FO-10"),
   ("Pesquisa acadêmica", "Os textos de 07/11 já preveem o uso em pesquisa, com consentimento próprio e dados anonimizados.", "Pedido de 07/11"),
   ("Revisão jurídica", "Todo texto novo passa pelo jurídico antes de ir ao ar. Os textos de 07/11 ainda estão nessa etapa.", "Conversa de 07/11")],
  ["A política de privacidade da página e a política de dados do regulamento eram tratadas em lugares diferentes. Para quem entrega os dados, é um texto só.",
   "A revisão jurídica, que você já pediu para os textos novos, não aparecia como passo."],
  ["A política de privacidade passa a ser mantida aqui; o termo de adesão fica em 1.4.4.", "Passo novo: revisão jurídica antes de publicar.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança de regra ou de uso de dados
        t1 t G Redigir a mudança no regulamento ou na política
        e1 em G Retorno do jurídico
        t2 t D Aprovar o texto
        f1 f G Texto aprovado para publicação""", ext=JUR, msg=[("t1", "X1", "Texto para revisão"), ("X1", "e1", "Parecer")]),
  desc="Poucas regras (quem participa, como se divide o valor, como se resolvem conflitos) e a política de privacidade e de dados (só dados de empresa, consentimento no cruzamento, resultado do cliente só com autorização, pesquisa com consentimento próprio). Todo texto novo passa pelo jurídico.")

R("P-64",
  "Manter o texto do termo que o parceiro aceita no cadastro, com número de versão.",
  "O termo é o contrato da parceria. Como o aceite é feito na página, sem assinatura à parte, o que prova o combinado é a versão exata do texto que estava no ar no dia do cadastro.",
  [("Um termo só", "Igual para todos, sem campos negociados por parceiro e sem minuta.", "FO-12"),
   ("Aceite na página", "O parceiro aceita o termo e a política no formulário do cadastro. O portal guarda a versão, a data e a hora.", "FO-12"),
   ("Saída", "Qualquer lado sai com aviso de 30 dias, sem multa; comissões já geradas continuam sendo pagas.", "v7 e página dos parceiros"),
   ("Texto de 07/11", "A versão nova espera a validação do jurídico antes de ir para a página.", "Conversa de 07/11")],
  ["O processo ainda descrevia um termo com campos por parceiro e geração de minuta, que deixaram de existir com o aceite na página.",
   "Não está definido o que acontece com quem já aceitou uma versão quando o texto muda."],
  ["Nome novo: Manter o termo de adesão.", "Descrição refeita para o termo único com versão.",
   "Entrada falsa retirada; a entrega vai para 4.2 Receber o cadastro com o aceite.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança de regra que afeta o termo
        t1 t G Redigir a nova versão do termo
        e1 em G Retorno do jurídico
        t2 t D Aprovar a nova versão
        t3 s G Publicar a versão na página com a data de vigência
        f1 f G Termo publicado com nova versão""", ext=JUR, msg=[("t1", "X1", "Texto para revisão"), ("X1", "e1", "Parecer")]),
  nome="Manter o termo de adesão",
  desc="Termo de adesão curto e igual para todos, aceito no formulário do cadastro. Cada mudança gera uma versão nova com data de vigência; o aceite de cada parceiro fica ligado à versão que ele leu.",
  portal="guarda as versões do termo e mostra na página a versão vigente.")
IO("P-64", entradas=[], saidas=[]); LIGA("P-64", "Termo de adesão vigente", "P-21")
ABERTA("termo_versao", "P-64", "Quando o termo de adesão muda, o que acontece com os parceiros que aceitaram a versão anterior?",
       ["Hoje o portal guarda a versão que cada parceiro aceitou no cadastro. Quando o texto mudar (por exemplo, com a versão de 07/11), quem já está dentro continua ligado à versão antiga.",
        "A regra geral do programa diz que mudança de regra vale depois de 30 dias de aviso."],
       ["O portal pede o aceite da versão nova no próximo acesso, depois dos 30 dias de aviso", "Só o aviso de 30 dias; quem continuar no programa aceitou",
        "Nada: cada parceiro segue com a versão que aceitou", "Não sei: perguntar ao jurídico"],
       "A primeira. Fica um registro claro de que cada parceiro leu a versão vigente, sem depender de interpretação.")

R("P-06",
  "Fixar a conta que diz se o programa vale a pena: quanto custa conquistar um cliente por meio de parceiros.",
  "O programa existe para ser um canal de aquisição mais barato que os canais ativos. Sem a fórmula fixa, o número muda conforme quem calcula.",
  [("Fórmula", "Comissões, horas dedicadas e custos diretos, divididos pelos clientes fechados vindos de parceiros.", V7),
   ("Só o Wise Partners", "Ninguém informa o CAC de outros canais no portal; a leitura é pela tendência, trimestre contra trimestre.", V7),
   ("Anúncios entram na conta", "O gasto com os anúncios da campanha de parceiros entra nos custos diretos. Sem isso, o CAC parece menor do que é.", RV),
   ("Dois custos intermediários", "Acompanhar também o custo por parceiro aprovado e o custo por parceiro ativado, que mostram se a campanha traz gente que indica.", RV)],
  ["A fórmula foi definida antes da campanha paga. O gasto com anúncios não aparecia em lugar nenhum (teste do dinheiro: como os custos são pagos)."],
  ["Custos diretos passam a incluir o gasto com anúncios.", "Dois números novos: custo por parceiro aprovado e por parceiro ativado.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Planejamento anual
        t1 t G Listar os custos do canal: comissões, horas, anúncios e outros custos diretos
        t2 t D Confirmar a fórmula do CAC e os custos intermediários
        t3 s G Registrar a fórmula no portal
        f1 f G Fórmula do CAC definida"""),
  desc="Fixar como se calcula o CAC do Wise Partners: comissões, horas e custos diretos (inclusive os anúncios da campanha de parceiros) divididos pelos clientes fechados vindos de parceiros, e os custos por parceiro aprovado e por parceiro ativado. Ninguém informa o CAC de outros canais.",
  portal="calcula o CAC do Wise Partners a cada mês a partir de comissões, horas, anúncios e custos diretos.")

R("P-07",
  "A cada trimestre, registrar em que fase o programa está, o que falta para passar à próxima e as metas que o Diretor definir.",
  "O programa cresce por fases com portões de evidência: só se aumenta o ritmo quando os números mostram que a fase atual funciona.",
  [("Fases", "Experimentação, Tração e Crescimento, com portões medidos por trimestre.", V7),
   ("Metas", "O Diretor define; entram quando fizer sentido, sem obrigação de fixar agora.", V7),
   ("Dono", "O Diretor é o dono; o Gerente prepara os números.", V7)],
  ["Os portões foram escritos antes da campanha e usam a ativação antiga (primeira indicação que virou reunião). Exemplo: 5 parceiros ativados para sair da Experimentação. Com a ativação pelo link, esse número ficou fácil demais para servir de portão."],
  ["Nada muda no desenho. A revisão pede uma decisão sobre os portões (pergunta abaixo).", "Passo a passo escrito (não existia)."],
  FL("""i1 it D Início de cada trimestre
        t1 a G Mostrar a distância de cada portão
        t2 t D Decidir se o programa muda de fase
        t3 t D Definir ou rever as metas do trimestre
        t4 s G Registrar a fase e as metas
        f1 f G Fase e metas registradas"""))
ABERTA("portoes", "P-07", "Os portões de fase continuam com os números de antes da campanha?",
       ["Portões validados na v7 para sair da Experimentação: 5 parceiros ativados; desfecho devolvido ao parceiro em toda oportunidade; 3 clientes fechados vindos de parceiros; CAC apurado no trimestre; metade das oportunidades qualificadas virando reunião; rituais rodando dois trimestres iguais.",
        "Para sair da Tração: 15 parceiros ativos com 40% em Ritmo alto, CAC caindo dois trimestres seguidos, entre outros.",
        "Naquela época, ativar era gerar a primeira indicação que virou reunião. Agora é o primeiro cliente cadastrado pelo link, e a campanha busca volume. Cinco ativados pode acontecer na primeira semana."],
       ["Rever os números com o Igor antes de publicar a fila", "Manter como está e rever no próximo fechamento trimestral",
        "Trocar 'parceiros ativados' por 'parceiros com cliente fechado' e manter os números", "Não sei: decidir com o Igor"],
       "A segunda. Um trimestre de campanha dá os números reais para calibrar; mudar agora seria chute.")

# ================================================================ 2 Gerir o programa por rituais
R("P-08",
  "Tocar o programa com poucos encontros fixos (dia, semana, mês e trimestre) e uma fila única do que saiu da regra.",
  "Uma pessoa só opera o programa. O que segue a regra roda no portal sem ninguém olhar; o trabalho humano fica para a exceção e para as decisões.",
  [("Ritmos", "Diário (exceções), semanal (com o Diretor), mensal (portfólio) e trimestral (fechamento).", V7),
   ("Pauta pronta", "O portal monta a pauta de cada ritual com os dados do período.", V7),
   ("O dia do Gerente", "Três frentes: a fila de candidatos (4), a agenda de conversas de entrada e de diagnósticos (4.4 e 6.1) e as exceções (2.1). As duas primeiras são trabalho de regra; só a terceira é exceção.", RV)],
  ["Com a campanha, o trabalho diário do Gerente deixou de ser só exceção: a fila de candidatos e as conversas marcadas são trabalho de regra, todo dia. A descrição dizia que tudo era exceção."],
  ["A descrição passa a nomear as três frentes do dia."],
  desc="Uma agenda de rituais e uma fila de exceções no lugar de muitos quadros. O dia do Gerente tem três frentes: a fila de candidatos, a agenda de conversas de entrada e de diagnósticos, e as exceções.")

R("P-09",
  "Todo dia, abrir a lista do que saiu da regra e resolver uma a uma, por ordem de prazo.",
  "É o que permite a uma pessoa cuidar de centenas de parceiros: ela não olha parceiro por parceiro, olha só o que o portal apontou.",
  [("O que entra na fila", "Marco atrasado, contato vencido, mudança de tipo no cubo, oportunidade parada, cadastro sem contato há mais de 24 horas úteis, parceiro parado numa etapa depois do lembrete e retorno pendente ao parceiro.", "v7, FO-11 e FO-12"),
   ("Quem resolve", "O Gerente é dono de todas as tarefas. Quando outra pessoa executa (closer, consultor, financeiro ou parceiro), ele combina por WhatsApp ou pessoalmente e registra o retorno.", V7),
   ("Ordem", "Por prazo.", V7)],
  ["O nome usava 'tratar', verbo vago pelo método.", "O fluxo decidia quem executa sem antes pegar uma tarefa da fila.", "A lista de quem executa não tinha o consultor."],
  ["Nome novo: Resolver as exceções do dia.", "Passo novo: pegar a próxima tarefa antes de decidir quem executa."],
  FL("""i1 it G Início do dia de trabalho no programa
        t1 s G Abrir a fila ordenada por prazo
        t0 s G Pegar a próxima tarefa da fila
        g1 d G Quem executa a tarefa?
        t2 s G Concluir a tarefa e registrar o resultado
        t3 w G Combinar com quem executa, pessoalmente ou por mensagem
        e1 e G Retorno de quem executa
        t4 s G Registrar o retorno na tarefa
        g2 d G Ainda há tarefa vencendo hoje?
        f1 f G Fila do dia resolvida""",
     "i1>t1>t0>g1; g1:O Gerente>t2; g1:Closer, consultor, financeiro ou parceiro>t3>e1>t4; t2>g2; t4>g2; g2:Sim>t0; g2:Não>f1"),
  nome="Resolver as exceções do dia")

R("P-10",
  "Uma conversa por semana entre o Gerente e o Diretor: primeiro os números, depois os casos, um a um, com decisão.",
  "Mantém o Diretor dentro do programa sem ele operar o portal, e garante que nenhum caso fique sem próximo passo por mais de uma semana.",
  [("Formato", "Painel com poucos números e lista de casos (parceiros que mudaram de tipo, oportunidades paradas, decisões pendentes).", V7),
   ("Acesso do Diretor", "O Diretor vê o painel e os casos no portal, só para leitura.", "FO-06"),
   ("Assinatura", "Se algum caso pede a assinatura do Diretor (aviso de desligamento), ela sai nesta conversa.", V7),
   ("Funil da campanha no painel", "O painel ganha o funil da campanha (cadastros, na fila, aprovados, ativados, clientes pelo link, diagnósticos, oportunidades e fechados) e o custo por parceiro aprovado.", RV)],
  ["O nome trazia o nome de uma pessoa; o método pede o papel.",
   "O painel foi definido antes da campanha e não mostra o funil de entrada, que hoje é o que mais muda de uma semana para outra.",
   "O fluxo falava em assinar o termo, que não existe mais com o aceite na página."],
  ["Nome novo: Revisar o programa com o Diretor.", "O passo de assinatura fica só para o aviso formal de desligamento.", "O painel passa a receber o resultado da campanha (4.1)."],
  FL("""i1 it G Dia da conversa semanal
        t1 a G Montar o painel da semana, o funil da campanha e a lista de casos
        t2 s G Anotar uma proposta para cada caso
        t3 t G Passar pelos números do painel com o Diretor
        t4 t D Discutir cada caso e decidir o próximo passo
        g1 d G Algum caso pede a assinatura do Diretor?
        t5 t D Assinar o aviso formal
        t6 s G Registrar a decisão de cada caso e criar as tarefas
        f1 f G Semana revisada, com decisão por caso""",
     "i1>t1>t2>t3>t4>g1; g1:Sim>t5>t6; g1:Não>t6; t6>f1"),
  nome="Revisar o programa com o Diretor")
LIGA(P98, "Resultado da campanha", "P-10")

R("P-11",
  "Uma vez por mês, olhar todos os parceiros de uma vez e decidir onde o Gerente põe as horas do mês.",
  "Atenção proporcional ao valor e ao potencial. Sem essa visão, as horas vão para quem chama mais, não para quem rende mais.",
  [("Lente dos ativados", "O cubo: o tipo de cada parceiro ativado, quem mudou de tipo e a jogada sugerida.", V7),
   ("Lente dos que ainda não ativaram", "O funil do onboarding: quantos parceiros estão em cada etapa e há quantos dias. O cubo só faz sentido depois da ativação.", RV),
   ("Resultado", "Um plano de atenção do mês, que vira tarefas na fila diária.", V7)],
  ["A mesa olhava só o cubo. Com centenas de Select em onboarding, a maior parte do portfólio ainda não tem tipo e ficaria invisível.",
   "A entrada 'Parceiro em crescimento' vinha de um macroprocesso inteiro. O que a mesa recebe de fato é o tipo de cada parceiro e a situação do onboarding."],
  ["Segunda lente: funil do onboarding.", "Entradas corrigidas: tipo e jogada (3.2) e situação do onboarding (5.2).", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Primeira semana do mês
        t1 a G Mostrar o cubo, as mudanças de tipo e o funil do onboarding
        t2 t G Escolher os parceiros que recebem atenção no mês
        t3 t G Decidir a jogada de cada um
        t4 s G Registrar o plano de atenção do mês
        f1 f G Plano de atenção do mês definido"""),
  desc="Ver o portfólio inteiro por duas lentes: o cubo, para os parceiros ativados (tipo de cada um e quem mudou de tipo), e o funil do onboarding, para os que ainda não ativaram. Decidir onde pôr as horas do mês.",
  portal="mostra o cubo, as mudanças de tipo, a jogada sugerida para cada parceiro e o funil do onboarding com os dias em cada etapa.")
CORTA("P-40", "P-11"); LIGA("P-16", "Tipo e jogada de cada parceiro", "P-11"); LIGA("P-94", "Situação do onboarding", "P-11")

R("P-12",
  "No primeiro dia útil de cada trimestre, fechar as contas do programa: quem sobe de nível, como está a relação, a saúde do programa e a Prateleira.",
  "Junta num dia só as decisões que dependem do trimestre inteiro, para não ficarem espalhadas e esquecidas.",
  [("Quando", "Primeiro dia útil de janeiro, abril, julho e outubro.", V7),
   ("O que entra", "Revisão de nível (3.4), pulso da relação (3.3), saúde e portões (3.5), permanência na Prateleira (10.2) e a agenda das revisões conjuntas.", "v7 e FO-12"),
   ("Subida de nível só aqui", "O convite para subir sai do fechamento, não a qualquer momento.", "FO-12"),
   ("Resumo ao Diretor", "O Diretor recebe o resumo do trimestre.", V7)],
  ["A revisão da Prateleira (10.2) tinha o gatilho 'fechamento trimestral', mas não aparecia no passo a passo do fechamento: ficava sem ninguém chamar.",
   "As revisões conjuntas agendadas aqui passaram a valer só para Premium e Elite (o Select tem o encontro trimestral)."],
  ["Passo novo: revisar a permanência na Prateleira.", "A agenda de revisões é só de Premium e Elite."],
  FL("""i1 it G Primeiro dia útil do trimestre
        s1 sub G P-18
        s2 sub G P-17
        s3 sub G P-19
        s4 sub G P-87
        t1 s G Agendar as revisões conjuntas com Premium e Elite
        t2 t G Enviar ao Diretor o resumo do trimestre
        f1 f G Trimestre fechado"""),
  desc="Revisar níveis, pulso da relação, saúde do ecossistema, portões e permanência na Prateleira, e agendar as revisões conjuntas do trimestre com Premium e Elite.")

R("P-13",
  "Quando uma regra muda, publicar a versão nova com data para começar a valer e avisar os parceiros.",
  "Regra que muda sem aviso quebra a confiança. Os 30 dias dão tempo ao parceiro de se ajustar ou de sair.",
  [("Vigência", "A mudança só vale 30 dias depois de publicada.", V7),
   ("Aprovação", "O Diretor aprova antes.", V7),
   ("Aviso", "No grupo de cada parceiro e no comunicado do mês; o portal guarda a versão antiga.", V7)],
  ["O processo misturava dois casos: mudança de regra e comunicados em geral. Pelo checklist do método, cada processo trata um caso. O comunicado do mês já tem processo próprio (8.2.1)."],
  ["Nome novo: Publicar mudança de regra. Os comunicados ficam em 8.2.1.", "A entrega passa a ir para 8.2.1 Publicar o comunicado do mês.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Texto novo de regra, regulamento ou termo aprovado
        t1 s G Registrar a nova versão com vigência em 30 dias
        t2 w G Avisar os parceiros no grupo de cada um
        t3 t G Enviar a mudança para o comunicado do mês
        e1 et G 30 dias
        t4 a G Aplicar a regra nova
        f1 f G Regra nova em vigor"""),
  nome="Publicar mudança de regra", gatilho="Texto novo de regra, regulamento ou termo aprovado",
  desc="Publicar cada mudança de regra com vigência mínima de 30 dias, depois da aprovação do Diretor, e avisar os parceiros.",
  portal="versiona a regra, registra a publicação e aplica a regra nova na data.")
CORTA("P-13", "P-47"); LIGA("P-13", "Mudança de regra avisada", "P-82")

# ================================================================ 3 Medir e aprender
R("P-14",
  "Medir o programa e cada parceiro com números que o portal calcula, e transformar cada medida numa decisão.",
  "Troca a impressão por fatos. Com volume, ninguém consegue sentir como está cada parceiro.",
  [("Duas medidas-mãe", "CAC do Wise Partners e valor devolvido ao parceiro, lado a lado, com o mesmo peso.", V7),
   ("Por parceiro", "O cubo (Valor, Ritmo e Relação) para os ativados; o nível pela escada.", "v7 e FO-12"),
   ("O portal calcula", "O Gerente só informa o que o portal não tem como saber.", V7)],
  ["Faltava dizer que o cubo vale só para parceiros ativados."],
  ["Regra explícita: parceiro em onboarding não tem tipo no cubo."])

R("P-15",
  "Todo mês, calcular quanto custou cada cliente vindo de parceiro e quanto valor a Wise devolveu aos parceiros.",
  "São os dois números que dizem se o programa cumpre o que promete: para a Wise, cliente mais barato; para o parceiro, receber antes de dar.",
  [("CAC", "Comissões, horas e custos diretos divididos pelos clientes fechados vindos de parceiros.", V7),
   ("Valor devolvido", "Desfechos devolvidos, oportunidades enviadas de volta, apresentações feitas e acessos dados.", V7),
   ("Valor devolvido na escada nova", "Contar também os diagnósticos feitos na base do parceiro e as formações do Base Ativa, que hoje são o principal valor entregue.", RV),
   ("Anúncios", "O gasto com anúncios entra no CAC (ver 1.5). Alguém informa o valor do mês, porque o portal não lê a conta de anúncios.", RV),
   ("Leitura", "Pela tendência do trimestre, no painel da semana.", V7)],
  ["O valor devolvido não contava o que a escada nova definiu como o benefício central: a consultoria gratuita para a base do parceiro.",
   "O gasto com anúncios não entrava (ver 1.5)."],
  ["Valor devolvido passa a incluir diagnósticos na base do parceiro e formações do Base Ativa.", "Passo novo: registrar o gasto com anúncios do mês.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento do mês
        t1 s G Conferir as horas dedicadas e registrar o gasto com anúncios do mês
        t2 a G Somar comissões, horas, anúncios e custos diretos
        t3 a G Dividir pelos clientes fechados vindos de parceiros
        t4 a G Contar o valor devolvido aos parceiros no mês
        t5 a G Mostrar as duas medidas e a tendência do trimestre no painel
        f1 f G CAC e valor devolvido apurados"""),
  desc="As duas medidas-mãe, com o mesmo peso. CAC: comissões, horas e custos diretos (inclusive anúncios) divididos pelos clientes fechados vindos de parceiros. Valor devolvido: diagnósticos feitos na base do parceiro, formações do Base Ativa, desfechos devolvidos, oportunidades enviadas de volta, apresentações feitas e acessos dados.")
LIGA(P98, "Gasto com anúncios", "P-15")

R("P-16",
  "Ler cada parceiro ativado em três fatores (Valor, Ritmo e Relação), cada um alto ou baixo, e com isso saber qual dos oito tipos ele é.",
  "O tipo diz o que fazer com o parceiro sem depender de memória ou de simpatia: cada tipo tem uma ação, uma abordagem e uma cadência.",
  [("Três fatores", "Valor: receita e pipeline em 12 meses. Ritmo: recência e frequência de ações de valor. Relação: pulso trimestral, retorno mútuo e equilíbrio entre dar e receber.", V7),
   ("Oito tipos", "Embaixador, Gerador sob tensão, Âncora esfriando, Valioso em risco, Promissor, Ativo sem tração, Cordial seletivo e Desertor.", V7),
   ("Frequência", "Valor e Ritmo todo dia; Relação a cada trimestre.", V7),
   ("Só ativados", "O cubo começa a valer na ativação. Antes disso o parceiro aparece no funil do onboarding.", RV),
   ("O parceiro não vê", "O tipo e o equilíbrio entre dar e receber são leitura interna.", V7)],
  ["Sem a regra dos ativados, centenas de Select recém-chegados cairiam todos no tipo Desertor (tudo baixo) e encheriam a fila de exceções com jogadas sem sentido."],
  ["Regra nova: só parceiros ativados são classificados."],
  gatilho="Leitura diária do portal, para parceiros ativados; revisão na mesa mensal",
  desc="Ler cada parceiro ativado em Valor (receita e pipeline ponderado em 12 meses), Ritmo (recência e frequência de ações de valor) e Relação (pulso trimestral, retorno mútuo e equilíbrio entre dar e receber); o tipo sai da tabela de oito células. Parceiro em onboarding não entra no cubo.")

R("P-65",
  "Somar o que o parceiro já trouxe de receita em 12 meses e o que está em negociação, e dizer se o Valor é alto ou baixo.",
  "É o fator que separa quem já rende de quem só promete.",
  [("Conta", "Receita ganha em 12 meses com origem no parceiro mais o pipeline aberto, ponderado pela etapa.", V7),
   ("Automático", "O portal calcula todo dia; ninguém digita.", V7)],
  ["As entradas eram cópia das entradas do processo de cima e não tinham relação com a conta (pulso, checagem, ações). O Valor usa só oportunidades e clientes fechados."],
  ["Entradas corrigidas: oportunidades e clientes fechados, vindos de 6 Gerar oportunidades.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Leitura diária do portal
        t1 a G Somar a receita ganha em 12 meses com origem no parceiro
        t2 a G Somar o pipeline aberto ponderado pela etapa
        t3 a G Comparar o total com o corte de Valor
        f1 f G Valor alto ou baixo"""))
IO("P-65", entradas=[]); LIGA("P-31", "Oportunidades e clientes fechados", "P-65")

R("P-66",
  "Ver há quanto tempo e com que frequência o parceiro faz algo de valor, e dizer se o Ritmo é alto ou baixo.",
  "Mostra quem está ativo agora, mesmo que ainda não tenha gerado receita, e quem esfriou.",
  [("O que é ação de valor", "Indicação, retorno a uma oportunidade ou a um pedido da Prateleira, ação do Base Ativa e presença em revisão.", V7),
   ("Ações novas", "Contar também cliente cadastrado pelo link e diagnóstico feito na base do parceiro, que hoje são o gesto mais comum do Select.", RV),
   ("Automático", "O portal calcula todo dia.", V7)],
  ["A lista de ações de valor era do desenho antigo e não tinha o link da página do cliente, que virou a principal forma de indicar.", "Entradas copiadas do processo de cima."],
  ["Ações de valor passam a incluir cliente cadastrado pelo link e diagnóstico feito.", "Entradas corrigidas.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Leitura diária do portal
        t1 a G Listar as ações de valor do parceiro
        t2 a G Medir a recência e a frequência
        t3 a G Comparar com o corte de Ritmo
        f1 f G Ritmo alto ou baixo"""),
  desc="Recência e frequência de ações de valor: cliente cadastrado pelo link, diagnóstico feito na base, indicação, retorno a oportunidade ou pedido da Prateleira, ação de Base Ativa e presença em revisão.")
IO("P-66", entradas=[]); LIGA("P-95", "Clientes e diagnósticos pelo link", "P-66"); LIGA("P-43", "Ação comprovada", "P-66"); LIGA("P-31", "Oportunidades e clientes fechados", "P-66")

R("P-67",
  "A cada trimestre, juntar o pulso da relação e o equilíbrio entre o que cada lado deu, e dizer se a Relação é alta ou baixa.",
  "Um parceiro pode render e estar insatisfeito. Este fator avisa antes que ele vá embora.",
  [("Conta", "Pulso trimestral, retorno mútuo e equilíbrio entre indicações enviadas e recebidas.", V7),
   ("Equilíbrio só para quem recebe indicação", "O equilíbrio entre dar e receber conta só para Premium e Elite. O Select não recebe indicações da Wise, então para ele a Relação usa só o pulso.", RV)],
  ["Com a escada nova, a Wise só indica parceiros Premium e Elite. Medir equilíbrio de indicações para o Select daria sempre o mesmo resultado: só dá, nunca recebe.", "Entradas copiadas do processo de cima."],
  ["Regra por nível para o equilíbrio.", "Entradas corrigidas: pulso (3.3) e dar entre parceiros (8.3).", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento trimestral
        t1 a G Juntar as respostas do pulso
        t2 a G Calcular o equilíbrio entre dar e receber dos Premium e Elite
        t3 a G Comparar com o corte de Relação
        f1 f G Relação alta ou baixa"""),
  desc="Pulso trimestral e retorno mútuo para todos; equilíbrio entre indicações enviadas e recebidas só para Premium e Elite, que são os que recebem indicação da Wise.")
IO("P-67", entradas=[]); LIGA("P-17", "Pulso de cada parceria", "P-67"); LIGA("P-50", "Dar registrado e reconhecido", "P-67")

R("P-68",
  "Com os três fatores, achar o tipo do parceiro na tabela e, se mudou, criar a tarefa da jogada do tipo novo.",
  "É o que transforma a medida em ação: toda mudança de tipo gera uma tarefa com dono e prazo.",
  [("Tabela", "Oito células, uma por combinação de alto e baixo.", V7),
   ("Só na mudança", "A tarefa nasce quando o tipo muda, não todo dia.", V7),
   ("Intensidade", "O Potencial do parceiro decide quanto esforço a jogada merece.", V7)],
  [], ["Passo a passo escrito (não existia)."],
  FL("""i1 i G Fator recalculado
        t1 a G Ler o tipo na tabela de oito células
        g1 d G O tipo mudou?
        t2 a G Criar a tarefa da jogada do novo tipo
        f1 f G Tipo mantido
        f2 f G Tipo atualizado e jogada criada""", "i1>t1>g1; g1:Não>f1; g1:Sim>t2>f2"))

R("P-17",
  "A cada trimestre, perguntar ao parceiro, em três perguntas de 1 a 5, como está a parceria.",
  "É a única medida que vem do parceiro. Sem ela, a Wise só sabe o que ele fez, não o que ele pensa.",
  [("Três perguntas", "Daria referência positiva; a parceria cumpre o combinado; há equilíbrio no que cada lado dá. Mais a nota de satisfação.", V7),
   ("Dois lados", "O parceiro responde sobre a Wise e o Gerente responde sobre o parceiro.", V7),
   ("Envio", "O portal envia a pesquisa e junta as respostas.", V7)],
  ["O Gerente responder três perguntas sobre cada parceiro funcionava com poucos. Com centenas de Select por trimestre, não cabe na agenda de uma pessoa."],
  ["O passo a passo abaixo já supõe que o Gerente responde só sobre Premium e Elite. A pergunta abaixo decide.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento trimestral
        t1 a G Enviar a pesquisa de pulso aos parceiros
        t2 s G Responder as perguntas sobre cada parceiro Premium e Elite
        e1 em G Respostas dos parceiros
        t3 a G Juntar as respostas e alimentar a Relação
        f1 f G Pulso do trimestre registrado""", ext={"X1": "Parceiro"}, msg=[("t1", "X1", "Pesquisa de pulso"), ("X1", "e1", "Respostas")]))
ABERTA("pulso_select", "P-17", "No pulso trimestral, sobre quais parceiros o Gerente também responde?",
       ["O pulso tem dois lados: o parceiro avalia a Wise e o Gerente avalia o parceiro, nas mesmas três perguntas. As duas notas juntas formam o fator Relação do cubo.",
        "Com a campanha, podem ser centenas de Select por trimestre. O lado do parceiro é automático; o lado do Gerente é trabalho manual."],
       ["O Gerente responde só sobre Premium e Elite; para o Select vale só a nota do parceiro", "O Gerente responde sobre todos, como hoje",
        "O pulso inteiro vale só para Premium e Elite; o Select não recebe a pesquisa"],
       "A primeira. Mantém a voz de todo parceiro e gasta o tempo do Gerente só onde há relação próxima.")

R("P-18",
  "A cada trimestre, ver quem cumpre os critérios para subir de nível e decidir quem é convidado.",
  "A subida é o reconhecimento do parceiro que entrega. Decidir só no fechamento, com critério escrito, evita promessa avulsa no meio do trimestre.",
  [("Quando", "Só no fechamento trimestral.", "FO-12"),
   ("Quem toma a iniciativa", "A Wise convida; o parceiro não pede.", "FO-12"),
   ("Critérios", "Os da tabela de níveis (1.4.1). O portal lista quem cumpre os números; os casos sem número fixo o Gerente avalia com o Diretor.", "FO-12"),
   ("Duas perguntas para a avaliação sem número", "Usar as duas perguntas que antes ficavam na qualificação do candidato: o parceiro deu antes de pedir? A Wise o indicaria a um cliente importante?", RV),
   ("Não há descida", "O nível só sobe.", "FO-12"),
   ("O que acontece depois", "O convidado ao Premium passa pelo encontro de alinhamento (7.6) e só então sobe. O convidado ao Elite entra na fila do Base Ativa (7.4).", "FO-12")],
  ["O fluxo deixava a revisão trimestral aberta até o fim do Base Ativa de cada parceiro, que dura semanas. A revisão é um caso por trimestre; a entrada no Premium e o Base Ativa são um caso por parceiro. Pelo método, processos com casos diferentes não ficam um dentro do outro.",
   "A leitura de comportamento (deu antes de pedir, indicaria a um cliente importante) estava depois do convite, dentro do encontro de alinhamento. Ela é critério para convidar, então precisa vir antes."],
  ["A revisão termina quando os convites saem. A entrada no Premium (7.5) e o Base Ativa (7.4) começam cada um com o próprio gatilho.",
   "As duas perguntas de comportamento passam a orientar a avaliação com o Diretor."],
  FL("""i1 it G Primeiro dia útil do trimestre
        t1 a G Listar quem cumpre os critérios do nível acima
        t2 t D Avaliar com o Gerente os casos sem critério numérico
        t3 s G Registrar a decisão de cada parceiro com o motivo
        g1 d G Algum parceiro sobe?
        t4 w G Convidar para o encontro de alinhamento quem sobe para Premium
        t5 s G Pôr na fila do Base Ativa quem sobe para Elite
        f1 f G Níveis mantidos
        f2 f G Convites enviados""", "i1>t1>t2>t3>g1; g1:Não>f1; g1:Sim>t4>t5>f2"),
  desc="No fechamento trimestral, o portal lista quem cumpre os critérios do nível acima; o Gerente avalia com o Diretor os casos sem número fixo, com duas perguntas: o parceiro deu antes de pedir, e a Wise o indicaria a um cliente importante? Quem é convidado ao Premium segue para o encontro de alinhamento; quem sobe para Elite entra na fila do Base Ativa. Não há descida de nível.")
IO("P-18", saidas=[("Nível revisto", "EXT:Parceiro")]); LIGA("P-18", "Parceiro convidado para o Premium", "P-45"); LIGA("P-18", "Parceiro Elite na fila do Base Ativa", "P-44")

R("P-19",
  "A cada trimestre, tirar três medidas do programa inteiro e ver quanto falta para cada portão de fase.",
  "O CAC diz se o canal é barato; estas três dizem se ele é saudável: produz, se sustenta e se renova.",
  [("Produtividade", "Oportunidades e clientes por parceiro ativo, e o CAC caindo.", V7),
   ("Robustez", "Parceiros ativos que continuam ativos, e a base que não depende de um só.", V7),
   ("Criação de nicho", "Categorias e tipos de parceiro novos que geram valor.", V7),
   ("Portões", "Cada portão aparece em verde ou vermelho no portal.", V7)],
  ["'Parceiro ativo' mudou de sentido com a ativação pelo link. As medidas continuam válidas, mas os números dos portões pedem revisão (ver a pergunta em 1.6)."],
  ["Entrega também para 1 Arquitetar o ecossistema e para 1.4.1.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento trimestral
        t1 a G Calcular produtividade, robustez e criação de nicho
        t2 a G Comparar com cada portão da fase
        t3 t G Anotar a leitura do trimestre para o Diretor
        f1 f G Saúde do programa e portões apurados"""))
