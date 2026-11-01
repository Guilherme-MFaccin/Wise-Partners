# Perguntas do FO-02 (executado dentro de tobe2_base.py): cada uma com contexto, lógica, citações e visual para a página
FO2 = []
def Q(chave, bloco, texto, tipo, opcoes, alvo, contexto, logica, cits, visual):
    alvo_ids = []
    for a in alvo:
        base, _, campo = a.partition(".") if a.startswith(("F:", "OB:", "CV:")) else (a, "", "")
        if a.startswith("F:"): alvo_ids.append(FT[a[2:]])
        elif a.startswith("OB:"): alvo_ids.append(OBJ[a[3:]])
        elif a.startswith("CV:"): alvo_ids.append(a[3:])
        elif a.startswith("NOVO.") or a.startswith("NEGOCIO."): alvo_ids.append(a)
        else:
            k, _, campo = a.partition("|")
            alvo_ids.append(P[k] + ("." + campo if campo else ""))
    qid = add("perguntas", "Q", texto=texto, tipo=tipo, opcoes=opcoes, alvo=alvo_ids, para=["PE-01"], rodada=2, bloco=bloco, status="em_formulario",
              formulario=None, respostas=[], chave=chave, contexto=contexto, logica=logica, citacoes=cits, visual=visual)
    FO2.append(qid)

APROVA = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"]

Q("hap", "A nova arquitetura", "Você aprova a nova hierarquia em 12 macroprocessos: Arquitetar o ecossistema e Gerir por rituais (gestão); Atrair e selecionar, Integrar e ativar, Gerar oportunidades, Desenvolver, Reter ou encerrar (finalísticos); Prateleira, Conteúdos, Dados, Ecossistema interno e Portal (suporte)?",
  "escolha", APROVA, ["M1", "M2"],
  ["A primeira versão do to-be organizava o programa pelos processos que o web app já tinha. Esta versão parte dos modelos dos livros. O Método Octo divide a construção de um ecossistema em três movimentos: arquitetar, conduzir a jornada do parceiro e gerir para escalar. Strategic Alliances diz que a governança cobre o começo, a operação e o fim da relação.",
   "Daí saem dois macroprocessos de gestão que não existiam: Arquitetar o ecossistema (papel da Wise, arquitetura de valor, perfil ideal, regras, fase) e Gerir por rituais (fila diária, revisão semanal, mesa mensal, fechamento trimestral, fila do Diretor). Os cinco finalísticos seguem a jornada do parceiro, com Gerar oportunidades no centro, porque é ali que o valor acontece. O suporte ganha Dados e Ecossistema interno.",
   "Ao todo são 12 macroprocessos, 42 processos e 25 subprocessos, com 11 fluxos detalhados. Todos estão no mapa to-be, com a fonte de cada elemento."],
  "Um processo só existe se tem caso, gatilho e fim. Por isso rituais e arquitetura viraram processos com data, não funções vagas. A jornada do parceiro dá a ordem dos finalísticos, e a oportunidade dá o centro.",
  [F(PP, 0, 2), F(AN, 0, 0), F(PP, 1, 0)], "hap")

Q("interacao", "Modelo de negócio", "A unidade de valor do programa passa a ser a oportunidade compartilhada, e os pilares viram quatro portas para ela (indicação por link, Prateleira, cruzamento de carteiras, Base Ativa). Você aprova?",
  "escolha", APROVA, ["F:interacao", "M5", "M5|fluxo", "OB:oportunidade", "5.6", "CV:CV-02"],
  ["Platform Revolution diz que toda plataforma bem-sucedida começa por uma única interação central, que gera valor alto e repetido. Ela tem três partes: participantes, unidade de valor e filtro. No Wise Partners, a interação é esta: uma indústria com uma necessidade conhecida encontra, com contexto, quem resolve. Ou o parceiro traz ao grupo uma indústria que precisa de gestão comercial.",
   "Hoje cada pilar tem o próprio funil, como se fossem negócios diferentes. Pela lógica do livro, todos produzem a mesma coisa: uma oportunidade com contexto. A indicação por link é o parceiro trazendo uma indústria. A Prateleira é a Wise levando uma indústria ao parceiro. O cruzamento revela contas em comum. O Base Ativa ativa a carteira do parceiro, que gera contatos.",
   "Resultado prático: as oportunidades de todas as portas ficam num único quadro, com a porta como etiqueta. Uma esteira só, com as mesmas etapas, o mesmo SLA e o mesmo retorno ao parceiro."],
  "Unificar a unidade de valor reduz o número de processos e quadros e deixa o programa medir o que importa: quantas interações boas acontecem e quantas viram negócio. O papel do parceiro também fica claro: ele abre a porta e a Wise conduz, porque a transação e o contrato ficam com o grupo.",
  [F(EP, 0, 0), F(EP, 0, 1), F(EP, 0, 2), F(CV, 3, 1)], "interacao")

Q("papel", "Modelo de negócio", "A Wise passa a declarar o próprio papel por categoria: orquestradora onde a demanda das indústrias do grupo dá legitimidade, seguidora onde o parceiro já tem programa de canais (grandes ERPs). E cada parceiro é registrado com papéis múltiplos na rede de valor (complementador, concorrente parcial, cliente, fornecedor). Você aprova?",
  "escolha", APROVA, ["F:papel", "F:rede", "1.1", "1.1.1", "1.1.2", "1.1.3", "3.2.2"],
  ["The Ecosystem Economy divide os papéis em orquestrador e participante e avisa que muitas empresas não conseguem orquestrar. Por isso a escolha precisa ser realista. Winning the Right Game acrescenta que liderança num ecossistema é papel, não resultado, e depende de os outros aceitarem você como líder. Com grandes ERPs que já têm programa de canais, a Wise faz melhor como seguidora inteligente.",
   "Co-Opetition traz a rede de valor: clientes, fornecedores, concorrentes e complementadores. Um ERP que vende para a mesma indústria é complementador quando a indústria valoriza mais a Wise por ter o ERP. É concorrente onde também vende consultoria. Rotular o parceiro com um papel só esconde isso.",
   "No to-be, o papel por categoria é decidido uma vez por ano (1.1). Cada candidato ganha uma ficha de jogo antes do workshop (3.2.2), com os papéis dele, quem ganha com a entrada dele e as regras de escopo onde ele concorre com o grupo."],
  "Saber o papel evita dois erros caros: tentar liderar quem não aceita ser liderado e descartar um bom complementador porque ele concorre num pedaço do escopo. O contrato separa as regras de cooperação (Prateleira, comunidade, evento) das de divisão (comissão, escopo, proteção).",
  [F(EP, 5, 4), F(EJ, 7, 1), F(EJ, 0, 1), F(EJ, 0, 3)], "rede")

Q("arquitetura", "Modelo de negócio", "A proposta de valor do programa passa a ser escrita para a indústria em cinco elementos (Descobrir quem resolve, Comparar e decidir, Implantar de forma integrada, Pertencer e aprender, Confiar), e cada pilar e cada parceiro é mapeado nos elementos que preenche. Você aprova?",
  "escolha", APROVA, ["F:arquitetura", "1.2"],
  ["Winning the Right Game separa modelo de negócio (como você é pago) de arquitetura de valor (como o valor que o cliente recebe é construído). A arquitetura é feita de elementos, e cada parceiro preenche um ou mais deles. Quando um elemento muda, o jogo inteiro pode mudar.",
   "Aplicado ao Wise Partners, o consumidor final é a indústria. A Prateleira preenche Descobrir e Comparar e decidir. A consultoria do grupo com o software do parceiro preenche Implantar de forma integrada. O Base Ativa e os eventos preenchem Pertencer e aprender. As regras, o SLA e a política de dados preenchem Confiar.",
   "A visão central passa a ser uma matriz de parceiros por elemento. Assim fica claro onde a cobertura é fraca, e é ali que vale recrutar ou criar uma porta nova."],
  "Medir o programa pela cobertura dos elementos, e não pela soma de cards, diz onde investir. Também protege a Wise da inversão de valor: um parceiro que fica dez vezes melhor num elemento pode mudar o equilíbrio do programa.",
  [F(EJ, 5, 0), F(EJ, 5, 1), F(EJ, 5, 5)], "arquitetura")

Q("comissao", "Modelo de negócio", "Você perguntou que parâmetro os livros usam para a comissão. Sobre o LTV, os 40% da primeira mensalidade (mais 10% ao Gerente) ficam perto de 2 a 4% para clientes de 12 a 24 meses. O que você quer adotar?",
  "multipla", ["Publicar no regulamento o critério objetivo da comissão (a conta sobre o LTV e as referências de mercado)",
               "Somar reconhecimento em espécie por nível, divulgado antes (palco, selo, mentoria, prioridade na Prateleira)",
               "Manter a regra única, sem exceção por parceiro", "Estudar comissão recorrente pequena no lugar da primeira mensalidade"],
  ["F:ltv", "F:lealdade", "1.4.2", "6.5"],
  ["Os livros não trazem um número único. The Channel Advantage cita 5 a 15% da venda para quem só gera lead, mas o exemplo é de varejo digital (afiliados da Amazon), longe do caso Wise. O Método Octo não fixa percentual: manda calibrar a comissão pelo trabalho que fica com quem vende, pela qualidade do lead, e escolher entre pagamento único e recorrente. Bech chama a margem de fator de higiene: a falta dela incomoda, mas ela sozinha não muda comportamento.",
   "Fazendo a sua conta: 40% de uma mensalidade, sobre um cliente que fica 12 meses, é 3,3% do LTV. Com 24 meses, 1,7%. Somando os 10% do Gerente, o total vai de 4,2% a 2,1%. Na Swallow, 6% do projeto mais 2% dá 8% do valor do projeto. Dentro ou abaixo da faixa citada, portanto.",
   "Getting to Yes diz que a regra convence quando tem critério objetivo, independente da vontade das partes e aplicável aos dois lados. Publicar essa conta transforma os 40% em regra com fundamento, não em número para negociar."],
  "A comissão já está decidida (40%). A questão agora é como sustentá-la: com critério escrito, com reconhecimento que vale mais do que custa e sem exceções que viram precedente.",
  [B("channel-advantage", "Calibrar os 40% da primeira mensalidade"), B("ecossistema-de-parceiros", "Calibrar a comissão ao trabalho"), B("bech-partner-channels", "Não tentar competir por parceiros só com percentual"),
   F(AN, 6, 0), F(EJ, 2, 3)], "ltv")

Q("quadros", "Funis e tarefas", "No lugar dos oito funis: um quadro da jornada (um card por parceiro, do candidato ao encerramento, com os marcos dentro do card), um quadro de oportunidades (um card por oportunidade), uma fila única de tarefas por exceção e uma agenda de rituais. Você aprova?",
  "escolha", APROVA, ["OB:parceiro", "OB:tarefa", "2.1", "2.1|fluxo", "CV:CV-01"],
  ["Você disse que um card por parceiro em cada funil vira coisa demais para gerir. As cinco frentes de leitura chegaram, por caminhos diferentes, à mesma resposta.",
   "Strategic Alliances propõe um ciclo de vida único por parceiro. O Método Octo propõe a jornada como um único quadro, com o onboarding em marcos de 30, 60, 90 e 120 dias dentro do card. Ecosystem-Led Growth e Platform Revolution tiram do quadro tudo o que segue a regra: só a exceção vira trabalho humano. Nearbound avisa que o parceiro nunca entra no portal tanto quanto se espera.",
   "Resultado: dois quadros e uma fila. O parceiro aparece uma vez só, na fase da jornada. A oportunidade aparece uma vez só, na etapa da esteira. Revisão de nível, Base Ativa, revisões conjuntas e ações conjuntas viram datas na agenda, com pauta montada pelo portal. A fila diária traz só o que fugiu da regra: SLA vencendo, marco atrasado, régua atrasada, risco, pedido parado."],
  "Menos quadros não é menos controle. As regras rodam no portal e o Gerente só olha a exceção, o que libera as horas para os parceiros que mais rendem. Os oito funis aprovados continuam existindo como visões filtradas dos dois quadros.",
  [F(AN, 0, 0), F(PP, 1, 3), F(CV, 2, 3), F(CV, 5, 4), F(EP, 0, 2)], "quadros")

Q("atencao", "Funis e tarefas", "Cada parceiro ganha, além do nível (potencial e resultado), um segmento de atenção revisto todo mês: gerenciado (cadência humana) ou atendido pelo portal e pela comunidade (sem acompanhamento individual, só exceções). Você aprova?",
  "escolha", APROVA, ["2.3"],
  ["Bech chama isso de pirâmide do canal: cerca de 5% dos parceiros crescem sozinhos, 15% crescem se ajudados e 80% não têm potencial de crescimento. O tempo do gerente vai para os dois primeiros grupos. Os demais são atendidos pelo portal, com chat e e-mail.",
   "Ecosystem-Led Growth chama os demais de parceiros não gerenciados. Eles não ficam esquecidos numa lista: geram resultado por automação e quando a equipe os aciona. Strategic Alliances classifica o portfólio por importância e dificuldade de gestão e dá intensidade diferente a cada grupo.",
   "Com poucos parceiros no início, as proporções não valem como número. Vale o princípio: a mesa mensal do portfólio decide onde as horas vão no mês. Nível e segmento são coisas diferentes: um parceiro pode ser Elite pela carteira e estar parado no comportamento."],
  "Sem segmento de atenção, todo parceiro pede o mesmo cuidado, e o tempo do Gerente acaba antes do mês. Com ele, o custo de servir cada parceiro fica proporcional ao que ele demonstra.",
  [F(PP, 7, 0), F(PP, 7, 2), F(CV, 2, 3), F(AN, 3, 0)], "piramide")

Q("rituais", "Funis e tarefas", "A gestão passa a seguir uma agenda de rituais: fila diária de exceções, revisão semanal (com três perguntas levadas à reunião comercial do grupo), mesa mensal do portfólio, fechamento trimestral e arquitetura anual; e o Diretor recebe uma fila de decisões só de sim ou não. Você aprova?",
  "escolha", APROVA, ["M2", "2.8", "2.4|fluxo"],
  ["Nearbound diz que cultura é o que se promove e o que se tolera, mais as cadências e os rituais que fazem isso valer. Strategic Alliances recomenda uma revisão operacional regular, provavelmente mensal, em toda relação importante. The Ecosystem Economy mostra check-ins semanais, e às vezes mais frequentes, focados em remover obstáculos.",
   "Na semana, a ideia é não criar reunião nova. A revisão de terça com o Igor continua, e três perguntas entram na reunião comercial do grupo: que oportunidades novas têm parceiro, que negócios parados podem usar um parceiro, que pedidos a parceiros estão sem retorno. É assim que o programa vira parte da rotina de venda.",
   "Getting to Yes sugere o procedimento do texto único: o Diretor recebe a proposta pronta e só decide sim ou não. Assinatura, desligamento, descida de nível e exceção de regra chegam a ele numa fila própria."],
  "Os rituais agrupam as decisões em datas fixas, em vez de espalhá-las em quadros que alguém precisa abrir todo dia. O custo de gestão fica previsível e cabe no tempo disponível.",
  [F(CV, 5, 0), F(CV, 5, 1), F(AN, 0, 3), F(EP, 7, 2), F(AN, 7, 1)], "rituais")

Q("saude", "Funis e tarefas", "No fechamento trimestral, cada parceria ganha uma nota de saúde em três fatores (qualidade da parceria, inovação colaborativa, criação de valor) e um tipo entre oito, que indica a jogada padrão. O que você adota?",
  "escolha", ["Os três fatores e os oito tipos", "Só os três fatores de saúde", "Não agora"], ["2.4.2", "6.7"],
  ["Strategic Alliances diz que as empresas medem entradas e saídas, mas quase nunca o processo da parceria. Por isso os problemas aparecem tarde demais. O livro propõe três fatores como indicadores que antecipam o sucesso ou o fracasso, e três perguntas simples: o parceiro nos recomendaria a um cliente? A parceria melhorou a satisfação dos clientes? Houve ganho real?",
   "O mesmo livro classifica as parcerias em oito tipos, e o tipo muda com o comportamento. Cada tipo pede uma jogada diferente. O catador de cerejas, por exemplo, deve ser abordado como se estivesse sendo recrutado pela primeira vez. Com o desertor, a decisão crítica é se a relação ainda vale o tempo investido.",
   "No portal, a maior parte da nota sai dos dados que já existem: indicações, SLA, trilhas, ações conjuntas, presença nas revisões. O tipo é escolhido na mesa do portfólio."],
  "O nível diz quanto de gestão o parceiro recebe. O tipo diz como essa gestão é feita. A saúde diz se vale continuar investindo. As três respostas juntas substituem a percepção pela evidência.",
  [F(AN, 1, 0), F(AN, 1, 5), F(AN, 2, 0), F(AN, 2, 3), F(AN, 2, 4)], "saude")

Q("recrutamento", "Atrair e selecionar", "No recrutamento, o que você adota?", "multipla",
  ["A lista de candidatos é tabela, não quadro: o candidato só vira card depois da primeira reunião",
   "Ficha de jogo do candidato antes do workshop (papéis na rede de valor, quem ganha com a entrada dele)",
   "Estimativa de sobreposição de carteiras antes de investir horas",
   "Caso de negócio do parceiro no workshop: quantos negócios saem da carteira dele, quanto ganha, que demanda recebe de volta"],
  ["3.1|regras", "3.2.2", "3.2.3", "3.4|descricao"],
  ["Bech compara recrutar parceiros com contratar por headhunter. A lista longa deve ter pelo menos dez vezes o número de parceiros que se quer assinar, e o recrutamento num território novo leva de 6 a 9 meses. Ele recomenda fazer o workshop estratégico antes de assinar e montar o P&L do parceiro: quanto ele ganha com a parceria, vendendo primeiro para a base que já tem.",
   "Co-Opetition manda fazer a pergunta de Cícero antes de aceitar alguém no jogo: quem ganha com isso? The Ecosystem Economy pontua cada candidato em atratividade e viabilidade e pergunta se a carteira dele complementa a sua.",
   "Você já aprovou o workshop de alinhamento como uma conversa mais longa. A proposta é que ele inclua o caso de negócio do parceiro, porque um parceiro que vê o próprio ganho no papel investe mais."],
  "Como os parceiros chegam de forma orgânica, o risco não é falta de candidato, e sim gastar horas com quem não vai render. As quatro práticas filtram antes do custo.",
  [F(PP, 6, 1), F(PP, 6, 4), F(PP, 6, 5), F(EJ, 1, 3), F(EP, 6, 5)], "recrutamento")

Q("texto_unico", "Atrair e selecionar", "A negociação passa a usar o texto único: um termo-quadro modular, preenchido e enviado como rascunho pedindo críticas, até virar a proposta que o Diretor aprova com sim ou não; termos fora do pacote gatilho encerram a negociação ou voltam ao desenho. Você aprova?",
  "escolha", APROVA, ["3.5|fluxo", "1.4.4"],
  ["Getting to Yes conta o procedimento de Camp David: um mediador redige um texto único, as partes só criticam e ele revisa até não conseguir melhorar. Fazer concessões é difícil, criticar é fácil. No fim, cada parte tem uma única decisão a tomar: sim ou não.",
   "O mesmo livro recomenda definir antes um pacote gatilho. Antes de aceitar qualquer acordo pior do que ele, pare e reexamine a situação. Recomenda também perguntar, antes de negociar, quem tem alçada do outro lado.",
   "Strategic Alliances diz que muitas vezes o melhor contrato é o que se arquiva e esquece depois de assinado. Por isso o termo deve ser curto, pensado para a saída. O termo-quadro modular (1.4.4) junta as duas ideias: um texto curto, igual para todos, com campos que mudam por parceiro."],
  "O texto único tira o Gerente da posição de quem cede, porque ele é quem medeia. O Diretor também sai do papel de segunda rodada de negociação, porque só responde sim ou não. A negociação fica mais curta e a regra se mantém igual para todos.",
  [F(AN, 7, 0), F(AN, 7, 1), F(AN, 6, 5), F(AN, 7, 4), F(AN, 0, 5)], "texto_unico")

Q("comunidade", "Desenvolver o parceiro", "A comunidade Wise Partners no WhatsApp ganha um processo próprio (animar a comunidade): comunicado do mês, troca de práticas entre parceiros, inclusive concorrentes, convites para mentoria e eventos. Você aprova?",
  "escolha", APROVA, ["6.4", "6.4.1", "6.4.2"],
  ["Você decidiu que a conversa com os parceiros fica na comunidade do WhatsApp, e Nearbound concorda: o parceiro nunca vai entrar no portal tanto quanto você gostaria. Com os principais, é preciso mandar mensagem e ligar com frequência, sem depender de portal.",
   "Bech diz que a troca de práticas entre parceiros pesa mais do que margem. Co-Opetition mostra que reunir concorrentes no mesmo evento cria o mercado para todos antes de dividi-lo, como as lojas de antiguidades que ficam na mesma rua.",
   "Se a comunidade é o canal, ela precisa de dono, ritmo e pauta. Sem isso, um grupo de WhatsApp vira silêncio ou ruído."],
  "Tratar a comunidade como processo transforma o canal que você já escolheu num ativo do programa: retenção, troca e reconhecimento público custam pouco e valem muito para o parceiro.",
  [F(CV, 5, 4), F(CV, 5, 5), B("bech-partner-channels", "Orquestrar troca de práticas"), F(EJ, 1, 5)], "comunidade")

Q("fase", "Gestão do programa", "O programa registra a fase (experimentação, tração, crescimento) e os portões para passar de uma à outra, medidos por ativação, liquidez das oportunidades, qualidade da combinação e confiança; uma vez por ano, faz o autodiagnóstico nos oito eixos do Método Octo. Metas numéricas ficam para depois. Você aprova?",
  "escolha", APROVA, ["F:fase", "1.5.1", "1.5.2"],
  ["Você pediu para não fixar metas agora, só a capacidade de defini-las. Os livros dizem o que medir em cada fase. Platform Revolution: na partida, as métricas são liquidez, qualidade da combinação e confiança, e o que conta é compromisso e uso, não cadastro. The Ecosystem Economy: no começo, o único objetivo que importa é entregar o básico e chegar aos clientes; mais tarde, a medida principal vira o valor criado para todos.",
   "Winning the Right Game define o ecossistema mínimo viável como a menor configuração capaz de gerar a prova que atrai novos parceiros. Você decidiu abrir os três pilares desde o primeiro parceiro, e isso se mantém. A proposta é que os portões controlem o ritmo de escala (quantos parceiros, quantas categorias), não a abertura dos pilares.",
   "O autodiagnóstico do Método Octo mostra quais eixos estão fracos, para equilibrar antes de refinar."],
  "Com fase e portões, a decisão de crescer depende de evidência, não de calendário. E a meta, quando vier, nasce ligada ao que a fase pede.",
  [F(EP, 4, 0), F(EP, 4, 1), F(EP, 7, 3), F(EJ, 6, 0), F(PP, 0, 3)], "fases")

Q("interno", "Gestão do programa", "Antes do primeiro parceiro ativo, Wise Makers, Tríade e Swallow realinham a rotina comercial para receber oportunidades de parceiros: SLA interno, briefing, dono da conta e crédito integral na meta de quem fecha (uma receita só). Você aprova?",
  "escolha", APROVA + ["Não sei: perguntar ao Igor"], ["F:interno", "M11"],
  ["Winning the Right Game conta casos em que o ecossistema foi dobrado para funcionar, mas não realinhado para virar rotina, e por isso falhou. Wise Makers, Tríade e Swallow são um ecossistema interno. Se o comercial de cada empresa não tiver SLA e incentivo para tratar a oportunidade do parceiro, o retorno ao parceiro atrasa e a confiança cai.",
   "Nearbound diz que é uma receita só, não direta e indireta. The Channel Advantage mostra que o crédito duplo de receita costuma ser um jeito melhor de pagar canais do que fazê-los disputar a mesma comissão. Você já aprovou o crédito integral na meta de quem fecha.",
   "O processo M11 formaliza esse acordo interno, revisto a cada mudança de regra."],
  "O parceiro julga o programa pela velocidade do retorno. Quem dá esse retorno é o comercial do grupo, que não entra no portal. Sem acordo interno, o melhor desenho quebra na primeira indicação.",
  [F(EJ, 7, 5), F(CV, 5, 2), F(CV, 6, 4)], "interno")

Q("monetizacao", "Modelo de negócio", "Hoje o dinheiro só corre da Wise para o parceiro. Para o futuro, o que você quer manter aberto como opção?", "multipla",
  ["Nada cobrado do parceiro, em nenhuma fase", "Contrapartida não financeira para entrar num pedido da Prateleira (ação conjunta, condição comercial para a indústria)",
   "Estudar, numa fase futura, taxa de sucesso do fornecedor quando a Prateleira gera contrato", "Estudar serviços pagos ao fornecedor (destaque marcado, relatório de por que perdeu um pedido)"],
  ["F:captura"],
  ["Platform Revolution recomenda subsidiar a entrada em vez de cobrar para participar, e cobrar só na conclusão, quando a interação gerou valor para os dois lados. O livro lembra também que quem se encontra pela plataforma tem incentivo para fechar por fora. A captura de valor depende de a plataforma resolver problemas para as duas partes.",
   "Co-Opetition diz o contrário em um ponto: competição é valiosa, então não a ofereça de graça. Quando a Wise coloca um fornecedor num pedido da Prateleira, ela entrega a ele uma chance que a indústria valoriza.",
   "As duas ideias convivem se a cobrança, quando houver, vier depois do resultado e nunca na entrada. Nada disso muda a comissão já decidida."],
  "É uma decisão de direção, não de agora. Deixar escrito o que pode e o que não pode ser cobrado evita mudar a regra no meio do caminho, que é o que mais desgasta a confiança dos parceiros.",
  [F(EP, 2, 4), F(EP, 2, 2), F(EP, 2, 3), F(EJ, 1, 4)], "monetizacao")

Q("retencao", "Reter ou encerrar", "Na retomada do parceiro em risco, a primeira tentativa leva uma oportunidade concreta (não um convite genérico) e a segunda é por telefone, porque conversa difícil não se faz por texto. Você aprova?",
  "escolha", APROVA, ["M7|fluxo"],
  ["Strategic Alliances diz que o parceiro passivo, o catador de cerejas, deve ser abordado como se estivesse sendo recrutado pela primeira vez, em torno de uma oportunidade concreta. Para o desertor, a decisão crítica é se a relação vale o tempo e a energia.",
   "Getting to Yes mostra que o texto curto e as abreviações de mensagens aumentam muito a chance de mal-entendido. Conversa sobre relação se faz por voz ou em pessoa, e a mensagem escrita só confirma.",
   "O fluxo de desligamento da especificação continua igual: duas tentativas, sugestão, aprovação do Diretor, aviso de 30 dias. Muda o conteúdo das tentativas."],
  "A maioria das parcerias esfria por falta de motivo para conversar, não por conflito. Levar uma oportunidade dá esse motivo. E a ligação evita que um silêncio vire ruptura por um mal-entendido de texto.",
  [F(AN, 2, 3), F(AN, 2, 4), F(AN, 7, 5)], "retencao")

fo2 = add("formularios", "FO", titulo="Rodada 2: o to-be refeito a partir dos livros", rodada=2, para=["PE-01"], canal="artifact", perguntas=FO2,
          introducao="Cada pergunta traz o contexto, a lógica, o que os livros dizem e um visual.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw",
          status="enviado", enviado_em=HOJE, prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO2: q["formulario"] = fo2
d["historico"].append({"data": HOJE, "evento": "To-be v2 refeito do zero a partir da segunda leitura dos livros; formulário FO-02 com contexto e visuais"})
