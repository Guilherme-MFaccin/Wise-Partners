# Revisão crítica, parte 3: macroprocessos 6 (Gerar oportunidades) e 7 (Desenvolver o parceiro).
PARC = {"X1": "Parceiro"}

# ================================================================ 6 Gerar oportunidades no ecossistema
R("P-31",
  "A esteira única por onde passa toda oportunidade de cliente que nasce de um parceiro: chega, é conferida, vai para o closer, o parceiro é informado a cada etapa e, se fechar, a comissão é paga.",
  "É onde o programa vira receita. Uma esteira só, para qualquer porta de entrada, é o que permite medir o canal e garantir que nenhum parceiro fique sem saber o que aconteceu com o cliente que indicou.",
  [("Cinco portas", "Diagnóstico do cliente do parceiro (pelo link da página do cliente), indicação por link, Prateleira, cruzamento de carteiras e Base Ativa.", "v7 e FO-10"),
   ("A porta principal", "Para o Select, a porta é o link da página do cliente, que leva ao diagnóstico. Prateleira, cruzamento e Base Ativa dependem de Premium ou Elite.", RV),
   ("Proteção da origem", "180 dias em todas as portas.", "FO-11"),
   ("Lead especial", "O lead vindo de parceiro vai direto ao closer, sem ligação fria.", V7),
   ("Retorno ao parceiro", "A cada mudança de etapa.", V7),
   ("Comissão", "Regra única, paga depois do primeiro pagamento compensado.", "v7 e FO-11"),
   ("Checagem", "O cliente é checado aos 6 e 12 meses.", V7)],
  ["O diagnóstico do cliente do parceiro era o último filho (o antigo 6.9), mas é por ele que quase toda oportunidade vai começar.",
   "Na v8, o diagnóstico entregava o cliente direto ao closer, pulando a conferência de duplicidade. Voltei ao desenho da v7: o diagnóstico abre a oportunidade e ela entra na esteira como as outras.",
   "Havia dois processos para a Wise recomendar um parceiro a um cliente dela (os antigos 6.4 e 6.5)."],
  ["O diagnóstico passa a ser 6.1.", "O antigo 6.5 Indicar cliente do grupo ao parceiro foi fundido com a Prateleira.", "Entrega nova para o cubo: oportunidades e clientes fechados."])

R("P-95",
  "O que acontece com a empresa que clica no link do parceiro: cadastro, triagem pelo perfil e, então, reunião de diagnóstico com a Wise ou autodiagnóstico na hora.",
  "É a entrega central do programa: a consultoria gratuita que o parceiro oferece à própria base. Para o parceiro, ajuda a reter os clientes dele; para a Wise, é a porta por onde chegam empresas no perfil.",
  [("Entrada", "Pelo link do parceiro, na página do cliente com as duas marcas.", "FO-10"),
   ("Triagem", "Empresa com mais de 3 vendedores (e faturamento mínimo, se configurado) está no ICP da Wise.", "FO-10"),
   ("No ICP", "Agenda do Google na própria página; reunião pela Matriz 5x5 (cinco pilares, cinco afirmações em cada).", "FO-10 e FO-11"),
   ("Fora do ICP", "Autodiagnóstico na hora, resultado com o link do Wise Hub e um e-mail com o resultado e um próximo passo, sem ligação.", "FO-10 e FO-11"),
   ("Quem conduz", "O Gerente; acima de 10 reuniões por semana, um consultor da Wise assume as que passam.", "FO-11"),
   ("O que o cliente recebe", "Mapa próprio da reunião, num modelo da Wise, em até 2 dias úteis, e acesso ao Wise Hub.", "FO-11"),
   ("O que o parceiro vê", "A empresa e a situação, sempre; o resultado, só se o cliente autorizou.", "FO-10"),
   ("Aviso ao parceiro", "O parceiro é avisado no portal e por e-mail quando um cliente dele entra, e recebe um resumo semanal.", "FO-10"),
   ("Pesquisa da UniCesumar", "Passo opcional da reunião, só depois da aprovação do Comitê de Ética e com consentimento do cliente.", "FO-11"),
   ("Se o cliente quer contratar", "Quem fez o diagnóstico abre a oportunidade, que segue pela esteira até o closer.", "FO-11"),
   ("Não é venda", "O diagnóstico não é conversa de venda; a contratação só entra se o cliente pedir.", "FO-06"),
   ("Falta à reunião", "O Gerente oferece um novo horário ou o autodiagnóstico.", RV),
   ("Empresa que já é cliente ou já negocia com a Wise", "O processo não previa. Pergunta abaixo.", "Em aberto")],
  ["O fluxo entregava o cliente direto ao closer, sem passar pela conferência de duplicidade da esteira. Um cliente que já negocia com a Wise por outro canal geraria comissão indevida ou disputa.",
   "'Aplicar a pesquisa, se aprovada e consentida' era uma escolha sem decisão desenhada (regra de estilo 9 do método).",
   "Não previa a falta do cliente à reunião.",
   "O aviso ao parceiro quando o cliente entra, que você escolheu no FO-10, não aparecia.",
   "A frequência ainda dizia 'no máximo um por dia', regra da v7 que você trocou por 10 por semana.",
   "A outra pessoa da Wise que assume quando a agenda enche não tinha papel. Criei o papel Consultor da Wise Makers."],
  ["Volta a terminar em 'oportunidade aberta', que entra na esteira (6.2) antes de ir ao closer.", "Entram no passo a passo: aviso ao parceiro, falta do cliente e a decisão da pesquisa.",
   "Frequência corrigida.", "Passa a ser 6.1."],
  FL("""i1 i G Cliente se cadastra pelo link do parceiro
        t1 a G Registrar o cadastro com a origem no parceiro e avisar o parceiro
        g1 d G A empresa está no ICP da Wise?
        t2 a G Liberar o autodiagnóstico na hora
        t3 a G Mostrar o resultado e o link do Wise Hub
        t4 a G Enviar o resultado e um próximo passo por e-mail
        t5 a G Liberar a agenda para a reunião
        e1 em G Cliente marca o horário
        t6 s G Conferir a agenda da semana
        g2 d G Passou de 10 reuniões na semana?
        t7 t G Passar a reunião a um consultor da Wise
        t8 t G Abrir a reunião no horário marcado (Gerente ou consultor)
        g0 d G O cliente compareceu?
        t9 w G Oferecer um novo horário ou o autodiagnóstico
        ta t G Conduzir o diagnóstico pela Matriz 5x5
        g3 d G Pesquisa aprovada pelo CEP e consentida pelo cliente?
        tb t G Aplicar a pesquisa
        tc t G Enviar o mapa da reunião em até 2 dias úteis
        td s G Liberar o acesso ao Wise Hub
        g4 d G O cliente autorizou mostrar o resultado ao parceiro?
        te a G Liberar o resultado ao parceiro no portal
        g5 d G O cliente pediu para contratar a consultoria?
        tf s G Abrir a oportunidade com a origem no parceiro
        f0 f G Reunião não realizada
        f1 f G Autodiagnóstico entregue
        f2 f G Diagnóstico entregue
        f3 f G Oportunidade aberta""",
     "i1>t1>g1; g1:Não>t2>t3>t4>f1; g1:Sim>t5>e1>t6>g2; g2:Sim>t7>t8; g2:Não>t8; t8>g0; g0:Não>t9>f0; g0:Sim>ta>g3; g3:Sim>tb>tc; g3:Não>tc; tc>td>g4; g4:Sim>te>g5; g4:Não>g5; g5:Sim>tf>f3; g5:Não>f2",
     ext={"X1": "Parceiro", "X2": "Cliente do parceiro"},
     msg=[("X2", "i1", "Cadastro de qualificação"), ("t1", "X1", "Aviso de novo cliente"), ("t3", "X2", "Resultado e link do Hub"), ("t4", "X2", "E-mail do resultado"),
          ("X2", "e1", "Horário marcado"), ("tc", "X2", "Mapa da reunião"), ("td", "X2", "Acesso ao Hub"), ("te", "X1", "Resultado autorizado")]),
  ordem=0, participantes=[CONSUL], frequencia="Até 10 reuniões por semana com o Gerente; o que passar vai para um consultor da Wise", situacao="em_implantacao",
  saidas=[{"nome": "Diagnóstico ou autodiagnóstico entregue", "para": "EXT:Cliente do parceiro"}],
  desc="O cliente do parceiro abre o link, preenche o cadastro de qualificação e a página decide pelo ICP (mais de 3 vendedores, com faturamento mínimo opcional); o parceiro é avisado. No ICP: agenda do Google, reunião pela Matriz 5x5 conduzida pelo Gerente (acima de 10 por semana, um consultor da Wise assume), mapa próprio da reunião em até 2 dias úteis e acesso ao Wise Hub. Fora do ICP: autodiagnóstico na hora, resultado com o link do Hub e e-mail com um próximo passo, sem ligação. A pesquisa da UniCesumar só entra com aprovação do Comitê de Ética e consentimento. Se o cliente pede para contratar, abre-se a oportunidade, que segue pela esteira.",
  hoje="No ar: página do cliente com o cadastro de qualificação, a regra do ICP, a agenda embutida, o autodiagnóstico com resultado na hora, o link do Hub e a lista de clientes para o parceiro. Faltam o e-mail do resultado (depende do serviço de e-mail) e o endereço da agenda dos clientes em Configurações. Há um cliente de teste no link da PluggMe.")
LIGA("P-95", "Oportunidade aberta", "P-32")
ABERTA("ja_cliente", "P-95", "E quando a empresa que entra pelo link do parceiro já é cliente da Wise ou já está em negociação com ela?",
       ["A regra da esteira (validada na v7) diz que empresa que já está com o grupo não gera comissão. Mas, no caminho do link, essa conferência só acontecia depois, quando a oportunidade abria. Até lá o parceiro acha que indicou um cliente novo.",
        "Você pediu que o portal cruze o cadastro do cliente com o Wise Hub por e-mail e CNPJ. O mesmo cruzamento resolve este caso."],
       ["O portal confere no cadastro; a empresa é atendida normalmente, mas sem proteção de origem nem comissão, e o parceiro é avisado na hora",
        "Só conferir quando a oportunidade abrir, como nas outras portas", "Cliente atual da Wise não recebe o diagnóstico gratuito; a página avisa e encaminha ao consultor dele"],
       "A primeira. O parceiro sabe cedo e com clareza, e o cliente não é mal atendido por um detalhe interno.")

R("P-32",
  "A conferência de entrada da esteira: registrar de onde veio a oportunidade, agradecer ao parceiro e checar se ela é válida.",
  "Garante duas coisas: o parceiro tem a origem protegida desde o primeiro minuto, e a Wise não paga comissão por cliente que já era dela.",
  [("Três passos", "Registrar com a porta de origem; agradecer e confirmar ao parceiro; validar duplicidade e ICP.", V7),
   ("Agradecer antes de validar", "O parceiro recebe o agradecimento na hora; a validação vem depois.", V7),
   ("Se não é válida", "O Gerente explica o motivo ao parceiro.", V7),
   ("Nota de qualidade", "O portal calcula a nota de cada oportunidade.", V7)],
  ["As entradas vinham do encontro de alinhamento e do cruzamento de carteiras, que hoje são portas só de Premium e Elite. Faltava a porta principal: o diagnóstico.", "Não tinha passo a passo próprio."],
  ["Entrada nova: oportunidade aberta no diagnóstico (6.1).", "Passo a passo escrito, chamando as três atividades."],
  FL("""i1 i G Oportunidade chega por uma das portas
        s1 sub G P-79
        s2 sub G P-80
        s3 sub G P-81
        g1 d G A oportunidade é válida?
        f1 f G Oportunidade recusada
        f2 f G Oportunidade qualificada""", "i1>s1>s2>s3>g1; g1:Não>f1; g1:Sim>f2"),
  ordem=1)

R("P-79",
  "Criar o registro da oportunidade com o parceiro de origem e a porta por onde ela chegou, e iniciar a proteção de 180 dias.",
  "É o registro que decide quem recebe a comissão. Sem data e origem gravadas na chegada, qualquer disputa vira palavra contra palavra.",
  [("Portas", "Diagnóstico do cliente (link da página do cliente), link de indicação, cruzamento, Base Ativa, Prateleira ou registro à mão.", "v7 e FO-11"),
   ("Proteção", "180 dias, igual em todas as portas.", "FO-11"),
   ("Vale o primeiro registro", "Recebe a comissão quem gerou o primeiro contato registrado.", V7),
   ("Automático quando há link", "Pelo link, o portal registra sozinho; nas outras portas, o Gerente registra.", V7)],
  ["As entradas eram cópia das entradas do processo de cima."],
  ["Entradas corrigidas.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Oportunidade chega
        t1 s G Registrar a empresa, o parceiro de origem e a porta
        t2 a G Iniciar a proteção de 180 dias
        f1 f G Oportunidade registrada"""),
  entradas=[])
LIGA("P-95", "Oportunidade aberta", "P-79")

R("P-80",
  "Avisar o parceiro, na hora, de que a oportunidade chegou, e agradecer.",
  "Quem indica e não ouve nada para de indicar. O agradecimento imediato é o primeiro retorno do ciclo.",
  [("Na hora", "Assim que a oportunidade é registrada.", V7),
   ("Automático", "O portal envia a confirmação; o Gerente pode completar com uma mensagem pessoal no grupo.", V7)],
  [], ["Passo a passo escrito (não existia)."],
  FL("""i1 i G Oportunidade registrada
        t1 a G Enviar a confirmação e o agradecimento ao parceiro
        f1 f G Parceiro agradecido"""))

R("P-81",
  "Conferir se a empresa já é cliente ou já está em negociação com o grupo, e se está no perfil da Wise.",
  "Protege os dois lados: a Wise não paga comissão por quem já era dela, e o parceiro fica sabendo cedo, com o motivo, quando uma indicação não vale.",
  [("Duplicidade", "Empresa que já é cliente ou já está em negociação com o grupo não gera comissão.", V7),
   ("ICP", "Fora do perfil, a oportunidade é recusada com explicação.", V7),
   ("Nota de qualidade", "Calculada pelo portal para cada oportunidade.", V7),
   ("Explicar sempre", "Oportunidade recusada volta ao parceiro com o motivo.", V7)],
  ["O gatilho era 'Parceiro confirmado', que não dizia o que tinha acontecido."],
  ["Gatilho corrigido: Parceiro agradecido.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Parceiro agradecido
        t1 a G Checar se a empresa já é cliente ou está em negociação com o grupo
        t2 a G Checar o ICP e calcular a nota de qualidade
        g1 d G É duplicada ou está fora do ICP?
        f1 f G Oportunidade recusada
        f2 f G Oportunidade qualificada""", "i1>t1>t2>g1; g1:Sim>f1; g1:Não>f2"),
  gatilho="Parceiro agradecido")

R("P-33",
  "O Gerente leva a oportunidade, com o contexto, ao closer que vai atender, e combina com ele como e quando.",
  "O lead que vem de parceiro chega aquecido e com uma relação em jogo: a do parceiro com o cliente dele. Tratá-lo como lead frio desperdiça a indicação e pode queimar o parceiro.",
  [("Direto ao closer", "Sem fila de pré-venda.", V7),
   ("Pessoalmente", "O Gerente combina com o closer, sem reunião fixa e sem prazo interno.", V7),
   ("Com contexto", "Quando a oportunidade vem de um diagnóstico, o closer recebe o mapa da reunião e o resultado da matriz.", "FO-11"),
   ("O closer não entra no portal", "O Gerente registra para quem foi e quando.", V7)],
  ["Não tinha passo a passo.", "Não dizia o que o closer recebe quando a oportunidade vem do diagnóstico."],
  ["Passo a passo escrito (não existia), com a entrega do contexto do diagnóstico."],
  FL("""i1 i G Oportunidade qualificada
        t1 t G Escolher o closer que vai atender
        t2 t G Levar ao closer o contexto: parceiro, diagnóstico e mapa da reunião
        t3 t C Combinar o primeiro contato com o cliente
        t4 s G Registrar para quem foi o lead e quando
        f1 f G Lead com o closer"""),
  ordem=2)

R("P-34",
  "A cada passo da negociação, contar ao parceiro o que aconteceu com o cliente que ele indicou, até o desfecho.",
  "O parceiro desanima quando não vê o que a indicação gerou. Devolver cada etapa é também o item mais barato do valor devolvido.",
  [("Quando", "A cada mudança de etapa: primeiro contato, proposta, fechamento ou perda.", V7),
   ("Como a Wise fica sabendo", "O closer avisa o Gerente por WhatsApp.", V7),
   ("Onde o parceiro lê", "No grupo de WhatsApp dele, com mensagem personalizada pelo Gerente, e no portal.", "v7 e FO-11"),
   ("No fim", "O parceiro vê o desfecho e o impacto gerado.", V7),
   ("Oportunidade parada", "Mais de 15 dias sem mudança aparece no painel da semana.", V7)],
  ["Sem achados no passo a passo, que já estava validado. Faltava só a entrega do cliente fechado para o pagamento da comissão."],
  ["Entrega nova: cliente fechado para 6.7 Pagar a comissão."],
  ordem=3)
LIGA("P-34", "Cliente fechado", "P-38")

RETIRAR("P-36", "P-35", "Tinha o mesmo gatilho da Prateleira (um cliente da Wise precisa de algo que um parceiro resolve) e o mesmo resultado (o parceiro recebe uma indicação da Wise). Pelo checklist do método, um caso é um processo só.",
        "A indicação direta de um parceiro virou uma variação de 6.5 Recomendar parceiros ao cliente pela Prateleira. Continua contando como valor devolvido e no equilíbrio de dar e receber.")

R("P-35",
  "Quando um cliente da Wise precisa de algo que a Wise não faz, recomendar a ele parceiros Premium e Elite da categoria.",
  "É o benefício que define o Premium: ser recomendado pela Wise. Para o cliente, é uma indicação de confiança; para o parceiro, é demanda de volta.",
  [("Quem pode ser recomendado", "Só Premium e Elite, sem recomendação suspensa.", "FO-11 e FO-12"),
   ("Como começa", "O consultor que atende o cliente relata a necessidade ao Gerente.", V7),
   ("Página do cliente", "O Gerente publica uma página com os parceiros recomendados da categoria; o cliente escolhe com quem falar.", V7),
   ("Contrapartida", "Cada parceiro que entra no pedido dá uma contrapartida não financeira.", V7),
   ("Categoria vazia", "Sem Premium ou Elite na categoria, ela é registrada como categoria a buscar.", "v7, adaptado"),
   ("Indicação direta", "Quando o consultor já sabe qual parceiro resolve, a página pode ter um parceiro só. É o mesmo processo.", RV),
   ("Retorno", "30 dias depois, o Gerente pergunta ao cliente e ao parceiro como foi; a resposta alimenta a nota de qualidade.", RV),
   ("Conta como valor devolvido", "Cada recomendação entra no valor devolvido ao parceiro e no equilíbrio de dar e receber.", V7)],
  ["Havia dois processos com o mesmo gatilho: a Prateleira (antigo 6.4) e a indicação de volta (antigo 6.5).",
   "O fluxo terminava quando o cliente escolhia o parceiro. A nota de qualidade, que decide a permanência na Prateleira (10.2), depende de saber como foi, e ninguém perguntava.",
   "O consultor aparecia na raia do closer."],
  ["Nome novo: Recomendar parceiros ao cliente pela Prateleira.", "Absorve o antigo 6.5.", "Passo novo: perguntar como foi depois de 30 dias.", "O consultor ganha a própria raia."],
  FL("""i1 i S Consultor relata a necessidade do cliente
        t1 s G Registrar o pedido do cliente
        t2 a G Listar os parceiros Premium e Elite da categoria
        g1 d G Há parceiro recomendável na categoria?
        t3 s G Registrar a categoria a buscar
        t4 w G Combinar a contrapartida com cada parceiro
        t5 s G Publicar a página do cliente com os recomendados
        e1 em G Cliente escolhe falar com um parceiro
        t6 w G Avisar o consultor e o parceiro
        e2 et G 30 dias
        t7 t G Perguntar ao cliente e ao parceiro como foi e registrar
        f1 f G Categoria sem parceiro recomendável
        f2 f G Recomendação feita e avaliada""",
     "i1>t1>t2>g1; g1:Não>t3>f1; g1:Sim>t4>t5>e1>t6>e2>t7>f2",
     ext={"X3": "Cliente da Wise"}, msg=[("t5", "X3", "Página com os recomendados"), ("X3", "e1", "Escolha do parceiro")]),
  nome="Recomendar parceiros ao cliente pela Prateleira", ordem=4, participantes=[CONSUL], gatilho="Cliente da Wise precisa de algo fora do escopo da Wise",
  desc="O consultor relata a necessidade, o Gerente registra o pedido e publica a página do cliente com os parceiros Premium e Elite da categoria, sem recomendação suspensa; cada parceiro que entra no pedido dá uma contrapartida não financeira. Quando o consultor já sabe quem resolve, a página pode ter um parceiro só. Trinta dias depois, o Gerente pergunta ao cliente e ao parceiro como foi.",
  portal="lista os parceiros Premium e Elite por categoria, monta a página, registra a contrapartida combinada e o retorno do cliente.")
LIGA("P-35", "Retorno do cliente sobre o parceiro", "P-87")

R("P-37",
  "Depois do encontro de alinhamento, pegar cada cliente em comum ou vizinho entre a Wise e o parceiro e decidir uma jogada para ele.",
  "O cruzamento mostra onde as duas carteiras se tocam. Sem transformar cada coincidência numa ação com dono, a lista vira curiosidade.",
  [("Só Premium e Elite", "O cruzamento acontece no encontro de alinhamento, que é a porta do Premium.", "FO-11 e FO-12"),
   ("Consentimento", "Só com consentimento, só dados de empresa e revelando só as coincidências.", V7),
   ("Três jogadas possíveis", "Apresentar o parceiro a um cliente da Wise; pedir ao parceiro a indicação de um cliente dele; combinar uma ação numa conta em comum.", V7),
   ("Vira oportunidade", "Cada jogada aceita entra na esteira com a porta 'cruzamento'.", V7)],
  ["O nome 'gerar jogadas' escondia o resultado, que são oportunidades.", "Não recebia nada; as coincidências vêm do encontro de alinhamento.", "Não dizia que vale só para Premium e Elite."],
  ["Nome novo: Transformar o cruzamento de carteiras em oportunidades.", "Entrada nova: coincidências do cruzamento, vindas de 7.6.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Coincidências do cruzamento disponíveis
        t1 a G Listar as contas em comum e as vizinhas
        t2 t G Escolher uma jogada para cada conta
        t3 w G Combinar a jogada com o parceiro
        g1 d G O parceiro topa a jogada?
        t4 s G Registrar a oportunidade com a porta cruzamento
        f1 f G Jogada descartada
        f2 f G Oportunidades criadas""", "i1>t1>t2>t3>g1; g1:Não>f1; g1:Sim>t4>f2"),
  nome="Transformar o cruzamento de carteiras em oportunidades", ordem=5,
  desc="Para parceiros Premium e Elite: cada coincidência do cruzamento de carteiras, feito no encontro de alinhamento, vira uma jogada (apresentar o parceiro a cliente da Wise, pedir indicação de cliente do parceiro ou combinar ação numa conta comum); a jogada aceita vira oportunidade.")

R("P-38",
  "Do contrato fechado ao dinheiro na conta do parceiro: calcular, esperar o primeiro pagamento do cliente compensar, receber a nota e pagar.",
  "É a promessa mais concreta da página dos parceiros. Atraso ou erro aqui desfaz a confiança construída em todo o resto.",
  [("Valor", "Regra única (1.4.2): 40% da primeira mensalidade na Wise Makers.", "v7 e FO-11"),
   ("Quando paga", "Depois que o primeiro pagamento do cliente compensar.", V7),
   ("Para quem", "Para o CNPJ do parceiro, com nota fiscal.", "Página dos parceiros"),
   ("Uma vez", "Uma comissão por cliente novo.", "Página dos parceiros"),
   ("Quem paga", "O Financeiro. O Gerente acompanha e registra, porque o Financeiro não entra no portal.", V7),
   ("O parceiro acompanha", "O parceiro vê no portal a comissão prevista, a espera da compensação e o pagamento.", RV),
   ("Se o cliente não paga", "Sem primeiro pagamento compensado, não há comissão; o parceiro é avisado.", "Proposta da revisão; decorre da regra")],
  ["O gatilho era 'primeiro pagamento compensado', mas a descrição começava no fechamento do cliente. O começo real é o fechamento; a compensação é uma espera no meio.",
   "Não tinha passo a passo nem dizia como o portal fica sabendo da compensação, já que o Financeiro não entra nele.",
   "Não previa o cliente que fecha e não paga."],
  ["Gatilho corrigido: cliente fechado com origem em parceiro.", "Passo a passo escrito (não existia), com o aviso do Financeiro ao Gerente e o caso do cliente que não paga."],
  FL("""i1 i G Cliente fechado com origem em parceiro
        t1 a G Calcular a comissão prevista e avisar o parceiro
        e1 e F Primeiro pagamento do cliente
        g1 d F O pagamento compensou?
        t2 w G Avisar o parceiro de que não haverá comissão
        t3 t F Avisar o Gerente da compensação
        t4 w G Pedir a nota fiscal ao parceiro
        t5 t P Emitir a nota fiscal
        t6 t F Pagar a comissão ao CNPJ do parceiro
        t7 s G Registrar o pagamento e avisar o parceiro
        f1 f G Comissão cancelada
        f2 f G Comissão paga""", "i1>t1>e1>g1; g1:Não>t2>f1; g1:Sim>t3>t4>t5>t6>t7>f2"),
  ordem=6, gatilho="Cliente fechado com origem em parceiro", participantes=[GP, RESP_P])

R("P-39",
  "Seis e doze meses depois do fechamento, saber se o cliente indicado continua com a Wise e como está, e contar ao parceiro.",
  "Dá três coisas: o dado de permanência que mostra se a regra de comissão se paga, um novo retorno ao parceiro e um sinal cedo quando o cliente indicado vai mal.",
  [("Quando", "6 e 12 meses depois do fechamento.", V7),
   ("Quem", "A tarefa é do Gerente; quem responde é o consultor que atende o cliente.", V7),
   ("Para onde vai", "Para o cubo e para a revisão da regra de comissão (1.4.2).", V7),
   ("Retorno ao parceiro", "O parceiro que indicou fica sabendo como está o cliente.", RV)],
  ["Não tinha passo a passo.", "O resultado ia só para o cubo. O parceiro, que indicou o cliente, não ficava sabendo, e a revisão da comissão, que depende desse dado, não o recebia."],
  ["Passo a passo escrito (não existia).", "Entregas novas: para a revisão da comissão (1.4.2) e para o parceiro."],
  FL("""i1 it G 6 ou 12 meses do fechamento
        t1 a G Criar a tarefa de checagem
        t2 w G Perguntar ao consultor como está o cliente
        t3 t S Informar se o cliente continua e o resultado obtido
        t4 s G Registrar a checagem
        t5 w G Contar ao parceiro como está o cliente que ele indicou
        f1 f G Checagem registrada e parceiro informado"""),
  ordem=7, participantes=[CONSUL])

# ================================================================ 7 Desenvolver o parceiro
RETIRAR("P-70", "P-28", "Preencher a ficha de jogo é um campo preenchido por uma pessoa durante o encontro de alinhamento. Pelo checklist do método, é pequeno demais para ser processo: vira um passo.",
        "Virou um passo de 7.6 Conduzir o encontro de alinhamento.")
RETIRAR("P-71", "P-28", "A sobreposição de carteiras era estimada pelo que o candidato dizia, antes de ele entrar. Agora o cruzamento real acontece no encontro de alinhamento, com consentimento. A estimativa perdeu a função.",
        "Substituído pelo cruzamento de carteiras, que é um passo de 7.6.")
RETIRAR("P-72", "P-18", "As duas perguntas (deu antes de pedir? a Wise o indicaria a um cliente importante?) são critério para convidar ao Premium. Estavam depois do convite, dentro do encontro. Além disso, eram um campo de uma pessoa só.",
        "As duas perguntas passaram a orientar a avaliação com o Diretor em 3.4 Revisar o nível dos parceiros.")
RETIRAR("P-74", "P-45", "Recolher a apresentação de vendas é um passo de um papel só. A conferência da ficha (10.1) já inclui a apresentação e os casos.",
        "Virou um passo de 7.5 Conduzir a entrada no Premium, antes da conferência da ficha (10.1).")

R("P-40",
  "Depois da ativação, cuidar de cada parceiro conforme o nível e o tipo dele, e fazê-lo subir quando merecer.",
  "Ativar é o começo. O programa só rende se os parceiros continuarem indicando, e você pediu um sistema que dê valor constante para que isso aconteça.",
  [("Para o Select", "Contato automático, encontro trimestral e a jogada do tipo em versão leve.", "FO-11"),
   ("Para o Premium", "Entrada pelo encontro de alinhamento, revisão conjunta, ações conjuntas e recomendação pela Wise.", "FO-12"),
   ("Para o Elite", "O Base Ativa.", "FO-12"),
   ("Atenção proporcional", "As horas do Gerente vão para quem tem valor ou potencial alto.", V7)],
  ["A descrição falava só da jogada do tipo. Com a escada, desenvolver é também subir de nível, e isso estava espalhado sem ligação.",
   "O encontro de alinhamento estava como filho da entrada no Premium, com três atividades de um passo só penduradas nele."],
  ["Descrição refeita por nível.", "O encontro de alinhamento vira processo próprio (7.6), chamado pela entrada no Premium.", "Saem quatro atividades pequenas (ver o fim do formulário)."],
  desc="Depois da ativação, cada parceiro é cuidado conforme o nível e o tipo no cubo: o Select, por contato automático, pelo encontro trimestral e pela jogada do tipo; o Premium, pelo encontro de alinhamento, pela revisão conjunta, pelas ações conjuntas e pela recomendação da Wise; o Elite, pelo Base Ativa.")

R("P-41",
  "Quando o parceiro muda de tipo no cubo, fazer o que o tipo pede: uma ação, com um jeito de abordar e um ritmo de contato.",
  "Dá ao Gerente uma resposta pronta para cada situação, em vez de improvisar. É o que liga a medida ao trabalho do dia.",
  [("Oito jogadas", "Uma por tipo: Embaixador, Gerador sob tensão, Âncora esfriando, Valioso em risco, Promissor, Ativo sem tração, Cordial seletivo e Desertor.", V7),
   ("O Potencial decide o esforço", "Parceiro com potencial baixo recebe a versão leve da jogada.", V7),
   ("Select em escala", "Para o Select, a jogada é uma mensagem preparada pelo portal, que o Gerente personaliza e envia; contato individual só quando o Potencial é alto.", RV),
   ("Tipos de risco", "Âncora esfriando, Valioso em risco, Cordial seletivo e Desertor seguem para 9.1 Retomar parceiro em risco.", V7)],
  ["Não tinha passo a passo.", "Não dizia como aplicar oito jogadas a centenas de Select sem estourar a agenda."],
  ["Regra nova para o Select: mensagem preparada pelo portal.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança de tipo ou decisão da mesa mensal
        t1 a G Mostrar a jogada do tipo e a mensagem sugerida
        g1 d G O tipo é de risco?
        t2 t G Decidir a intensidade pelo Potencial do parceiro
        t3 w G Aplicar a ação do tipo com o parceiro
        t4 s G Registrar a jogada e a próxima data
        f1 f G Caso de risco encaminhado para a retomada
        f2 f G Jogada aplicada""", "i1>t1>g1; g1:Sim>f1; g1:Não>t2>t3>t4>f2"),
  ordem=1)

R("P-42",
  "Uma reunião periódica com cada parceiro Premium e Elite para ver os números juntos e combinar as ações do próximo período.",
  "Com quem a Wise recomenda aos próprios clientes, a relação precisa de conversa regular. A revisão evita que o parceiro só ouça a Wise quando há problema.",
  [("Para quem", "Premium e Elite.", "FO-11"),
   ("Ritmo", "Trimestral; mensal para os destaques.", V7),
   ("Diretor", "Participa das revisões dos parceiros Elite.", V7),
   ("Pauta", "Montada pelo portal com os dados do parceiro.", V7),
   ("Resultado", "Ata e ações com data e responsável.", V7),
   ("Select", "Não tem revisão individual; o contato do trimestre é o encontro trimestral (8.2.2).", "FO-11")],
  ["Sem achados no passo a passo, que já estava validado. A regra de quem participa mudou na v8, com o FO-11."],
  ["Entrada nova: o parceiro que sobe ao Premium (7.5) passa a ter revisão."],
  ordem=2)

R("P-43",
  "Tirar do papel o que foi combinado na revisão: cada ação conjunta com data, responsável, comprovação e resultado.",
  "Ação combinada e não feita desgasta a parceria. O registro mostra aos dois lados quem cumpriu o quê, e cada ação comprovada conta no Ritmo do parceiro.",
  [("De onde vêm", "Da ata da revisão conjunta (7.2).", V7),
   ("O que cada ação tem", "Data, responsável de cada lado, forma de comprovar e resultado.", V7),
   ("Para quem", "Premium e Elite. No Select, a única ação conjunta é o anúncio da parceria, que fica no onboarding.", RV),
   ("Conta no cubo", "Ação comprovada é ação de valor no Ritmo.", V7)],
  ["O nome tinha dois verbos. O planejamento acontece na revisão (7.2); aqui fica a execução.",
   "Recebia 'nível e pacote novos' da subida de nível, sobra do desenho antigo.", "Não tinha passo a passo."],
  ["Nome novo: Cumprir as ações conjuntas combinadas.", "Entrada antiga retirada.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Ação combinada na revisão conjunta
        t1 s G Registrar a ação com data, responsáveis e forma de comprovar
        e1 et G Data da ação
        t2 t G Cumprir a ação combinada com o parceiro
        t3 t P Enviar a comprovação
        t4 s G Registrar a comprovação e o resultado
        f1 f G Ação comprovada"""),
  nome="Cumprir as ações conjuntas combinadas", ordem=3, gatilho="Ação combinada na revisão conjunta")
CORTA("P-45", "P-43")

R("P-44",
  "Organizar, para a base de clientes de um parceiro Elite, uma formação gratuita e exclusiva conduzida pela Wise.",
  "É o benefício mais alto do programa e o que mais custa horas da Wise. Para o parceiro, é um evento de valor para a base dele; para a Wise, é uma sala cheia de empresas no perfil.",
  [("Para quem", "Parceiros Elite.", "FO-12"),
   ("Cinco passos", "Definir com o parceiro o tema e a data; o parceiro convida a própria base com o material da Wise; a Wise conduz a formação; os participantes recebem a oferta do diagnóstico; o parceiro recebe um relatório de presença e resultados.", "FO-12"),
   ("Fila por horas", "Se a Wise não tem horas livres, o parceiro entra numa fila com data prevista.", V7),
   ("Diagnóstico depois", "A oferta do diagnóstico usa o link do parceiro, então a origem fica protegida.", RV),
   ("O método antigo", "A v7 tinha um ciclo de 12 semanas com 6 encontros (diagnosticar a base, categorizar a carteira, estruturar a comunidade do parceiro, oferta e nutrição) e um certificado metodológico. Suas respostas de novembro descrevem só a formação. Pergunta abaixo.", "Em aberto"),
   ("Repetição", "Não está dito se a formação acontece uma vez ou se repete. Pergunta abaixo.", "Em aberto")],
  ["Na v8 eu mantive os oito passos do método antigo de 12 semanas e somei os dois novos, escrevendo que os antigos 'continuam'. Você não disse isso: foi suposição minha, e o método proíbe supor. Refiz o passo a passo só com os cinco passos que você marcou no FO-12.",
   "O fim se chamava 'comunidade validada', resultado do método antigo."],
  ["Passo a passo refeito com os cinco passos do FO-12 e a fila por horas.", "Fim novo: formação entregue e relatório enviado."],
  FL("""i1 i G Subida para Elite decidida
        t0 s G Conferir as horas disponíveis da Wise
        g1 d G Há horas disponíveis?
        t1 s G Colocar o parceiro na fila com a data prevista
        e1 et G Vez do parceiro na fila
        t2 t G Definir com o parceiro o tema e a data da formação
        t3 t G Preparar o material de convite
        t4 t P Convidar a própria base com o material da Wise
        t5 t G Conduzir a formação
        t6 a G Oferecer o diagnóstico aos participantes pelo link do parceiro
        t7 s G Enviar ao parceiro o relatório de presença e resultados
        f1 f G Formação entregue e relatório enviado""", "i1>t0>g1; g1:Não>t1>e1>t2; g1:Sim>t2>t3>t4>t5>t6>t7>f1"),
  ordem=4, saidas=[{"nome": "Formação entregue e relatório enviado", "para": "EXT:Parceiro"}],
  desc="Formação gratuita e exclusiva para a base do parceiro Elite, organizada pela Wise, conforme as horas disponíveis: definir com o parceiro o tema e a data; o parceiro convida a própria base com o material da Wise; a Wise conduz a formação; os participantes recebem a oferta do diagnóstico pelo link do parceiro; o parceiro recebe um relatório de presença e resultados.",
  portal="controla a fila, a agenda, a lista de presença e o relatório.")
ABERTA("base_ativa_formato", "P-44", "O Base Ativa é só a formação, ou continua com o método de 12 semanas?",
       ["Na v7, o Base Ativa era um ciclo de 12 semanas com 6 encontros: diagnosticar a base do parceiro, categorizar a carteira, definir a estrutura e o anúncio da comunidade do parceiro, definir oferta e nutrição, planejar a formação e o evento, e emitir um certificado metodológico.",
        "No FO-11 você descreveu o nível A assim: 'a própria Wise Makers organiza um evento para dar uma formação gratuita e exclusiva para a base de clientes'. No FO-12 marcou cinco passos, todos em torno do evento."],
       ["É só a formação, com os cinco passos; o método de 12 semanas sai", "A formação é a entrega padrão; o método de 12 semanas fica como opção para parceiros escolhidos pelo Igor",
        "Continua o método de 12 semanas, e a formação é o evento final dele"],
       "A primeira, por ser o que você descreveu duas vezes. As 12 semanas por parceiro não cabem num programa de volume com uma pessoa.")
ABERTA("base_ativa_repete", "P-44", "A formação do Base Ativa acontece uma vez por parceiro ou se repete?",
       ["Cada formação consome horas da Wise (preparo, condução e relatório) e gera diagnósticos na semana seguinte. A resposta define o tamanho da fila por horas."],
       ["Uma vez, na subida para Elite", "Uma por ano para cada Elite", "Uma por semestre para cada Elite", "Quando o parceiro pedir e houver horas"],
       "Uma por ano. Mantém o Elite como benefício vivo sem comprometer a agenda.")

R("P-45",
  "O caminho do convite até o parceiro estar pronto para ser recomendado pela Wise aos clientes dela.",
  "Recomendar um parceiro é emprestar a confiança que o cliente tem na Wise. Por isso a entrada no Premium tem um encontro de alinhamento e uma ficha conferida antes de qualquer recomendação.",
  [("Começa pelo convite", "Feito no fechamento trimestral (3.4).", "FO-12"),
   ("Encontro de alinhamento primeiro", "O parceiro só sobe depois do encontro (7.6).", "FO-12"),
   ("Depois do encontro", "Registrar a subida; revisar o perfil para as recomendações e a Prateleira; avisar os consultores da Wise de que ele pode ser recomendado; anunciar o novo nível com o certificado.", "FO-12"),
   ("Ficha conferida", "A ficha do parceiro passa pela conferência de 10.1 antes de entrar na Prateleira, com a apresentação de vendas e os casos.", "v7, adaptado"),
   ("Se o parceiro não aceita", "Segue como Select, sem prejuízo, e pode ser convidado de novo em outro trimestre.", RV),
   ("Passa a ter", "Revisão conjunta trimestral (7.2), mentoria, eventos e apresentações a outros parceiros.", "FO-12")],
  ["Não previa o parceiro que recusa ou adia o convite.", "A revisão do perfil para a Prateleira repetia, com outro nome, a conferência da ficha (10.1).",
   "A apresentação de vendas do parceiro era recolhida por uma atividade à parte (o antigo 7.5.2), de um passo só.",
   "A entrega ia para as ações conjuntas com o nome 'nível e pacote novos'."],
  ["Entra a resposta do parceiro ao convite.", "A revisão do perfil passa a chamar 10.1 Verificar a ficha.", "Absorve o antigo 7.5.2.", "Entregas corrigidas: para a revisão conjunta (7.2) e para a Prateleira (10.1)."],
  FL("""i1 i G Parceiro convidado para o Premium
        e0 em G Resposta do parceiro ao convite
        g0 d G O parceiro aceitou o convite?
        s1 sub G P-28
        t1 s G Registrar a subida para Premium
        t2 t P Enviar a apresentação de vendas e os casos
        s2 sub G P-86
        t3 t G Avisar os consultores da Wise de que ele pode ser recomendado
        t4 w G Anunciar o novo nível ao parceiro, com o certificado
        f0 f G Parceiro segue como Select
        f1 f G Parceiro Premium recomendável""", "i1>e0>g0; g0:Não>f0; g0:Sim>s1>t1>t2>s2>t3>t4>f1",
     ext=PARC, msg=[("X1", "e0", "Resposta ao convite")]),
  ordem=5, participantes=[RESP_P], saidas=[])
LIGA("P-45", "Parceiro Premium", "P-42"); LIGA("P-45", "Ficha para conferência", "P-86"); LIGA("P-45", "Convite aceito", "P-28")

R("P-28",
  "Uma reunião mais longa com o parceiro que vai subir ao Premium, para entender o que é sucesso para ele, cruzar as carteiras e sair com uma primeira oportunidade concreta.",
  "Antes de recomendar um parceiro aos próprios clientes, a Wise precisa conhecê-lo a fundo: o que ele vende, para quem, e onde as duas carteiras se encontram.",
  [("Só para quem sobe ao Premium", "Deixou de ser para todos.", "FO-11"),
   ("O que se registra", "O que é sucesso para o parceiro, na unidade de medida dele, e os papéis dele na rede de valor (a ficha de jogo).", V7),
   ("Cruzamento de carteiras", "Só com consentimento, só dados de empresa e revelando só as coincidências.", V7),
   ("Sai com uma oportunidade", "O encontro termina com a primeira oportunidade concreta escolhida.", V7),
   ("Sobreposição real, não estimada", "Antes, a sobreposição de carteiras era estimada pelo que o candidato dizia. No encontro, o cruzamento mostra o número real.", RV)],
  ["Na v8 pendurei aqui três atividades da antiga qualificação (ficha de jogo, sobreposição estimada e leitura de comportamento). Cada uma é um campo preenchido por uma pessoa só: pelo checklist, são passos.",
   "A estimativa de sobreposição perdeu o sentido: o cruzamento real acontece neste mesmo encontro.",
   "A leitura de comportamento é critério para convidar, então foi para a revisão de nível (3.4).",
   "Ainda recebia entregas da preparação da entrada (5.1), de quando o encontro era para todos."],
  ["Vira processo próprio (7.6), chamado pela entrada no Premium.", "As três atividades viraram passos ou mudaram de lugar.", "Passo a passo escrito (não existia), com o consentimento do cruzamento.",
   "Entrega nova: coincidências do cruzamento para 6.6."],
  FL("""i1 i G Convite para o Premium aceito
        t1 w G Marcar o encontro com o parceiro
        t2 t G Registrar o que é sucesso para o parceiro
        t3 s G Preencher a ficha de jogo: os papéis dele na rede de valor
        t4 t G Pedir o consentimento para cruzar as carteiras
        g1 d G O parceiro consente o cruzamento?
        t5 a G Cruzar as carteiras e mostrar só as coincidências
        t6 t G Escolher com o parceiro a primeira oportunidade concreta
        f1 f G Parceiro alinhado, com a primeira oportunidade escolhida""", "i1>t1>t2>t3>t4>g1; g1:Sim>t5>t6; g1:Não>t6; t6>f1"),
  pai="P-40", ordem=6, gatilho="Convite para o Premium aceito",
  desc="O encontro é a porta do Premium: só com quem a Wise vai passar a recomendar. Registrar o que é sucesso para o parceiro, preencher a ficha de jogo, cruzar as carteiras com consentimento, revelando só as coincidências, e escolher a primeira oportunidade concreta.")
LIGA("P-28", "Coincidências do cruzamento", "P-37")

R("P-46",
  "Garantir que nenhum parceiro fique tempo demais sem ouvir a Wise, com um ritmo de contato conforme o nível e a atenção que ele merece.",
  "Relação se constrói antes de precisar dela. O contato regular, sempre com algo útil, é o que faz o parceiro lembrar da Wise quando o cliente dele reclama de vendas.",
  [("Select", "Contato automático (portal, e-mail do mês e resumo dos clientes) e o encontro trimestral como contato do trimestre.", "FO-11"),
   ("Atenção alta", "Mensal.", V7),
   ("Premium e Elite", "Trimestral, pela revisão conjunta.", "v7 e FO-11"),
   ("Candidatos em pausa e ex-parceiros", "Duas a três vezes por ano.", V7),
   ("Sempre com algo de valor", "Oportunidade, conteúdo ou apresentação.", V7),
   ("Depois de reunião", "Retorno em até 24 horas.", V7),
   ("Pessoal, não em massa", "O contato individual é escrito pelo Gerente, nunca disparo.", V7)],
  ["O nome 'manter' sugere função contínua, mas o processo tem caso (cada contato vencido), começo e fim. Passa no checklist e fica como está."],
  ["Nada muda."],
  ordem=7)
