# Revisão crítica, parte 2: macroprocessos 4 (Atrair e selecionar) e 5 (Integrar e ativar).
CLI = {"X2": "Cliente do parceiro"}

# ================================================================ 4 Atrair e selecionar parceiros
R("P-20",
  "O caminho de quem vê o anúncio até virar parceiro com acesso ao portal: cadastro na página, fila, contato pelo WhatsApp, agenda e conversa de entrada.",
  "A fila existe por dois motivos que você deu: não deixar concorrente nem curioso ter acesso ao que a Wise oferece, e fazer o parceiro começar já sabendo vender e indicar a Wise. O custo é o tempo do Gerente: cada parceiro passa por uma conversa.",
  [("Todos pela fila", "Todo parceiro entra pelo mesmo caminho, sem exceção.", "FO-11"),
   ("Um processo para qualquer tipo de parceiro", "Só a campanha muda de um tipo para outro.", "FO-11"),
   ("Primeiro contato", "Pelo Gerente, sempre, em até 24 horas úteis.", "FO-11"),
   ("Conferência antes do contato", "Antes de chamar no WhatsApp, o Gerente olha o cadastro e o site do candidato. Concorrente evidente e cadastro inválido saem sem conversa.", RV),
   ("Ordem de atendimento", "Por ordem de chegada.", RV),
   ("Quem some no caminho", "Candidato que não responde ou não marca horário segue para a retomada (4.5).", RV),
   ("Quatro jeitos de terminar", "Parceiro Select com acesso; cadastro descartado; candidato sem interesse ou não aprovado; candidato sem resposta.", RV)],
  ["O fluxo não dizia o que acontece quando o candidato não responde, não marca horário ou não aparece. São os casos mais comuns numa campanha de anúncios (teste do dia de chuva).",
   "O candidato aparecia na raia 'Responsável nomeado no parceiro', mas ele ainda não é parceiro. Criei o papel 'Candidato a parceiro'.",
   "Cadastro e aceite eram dois processos (os antigos 4.1 e 4.4) para um único gesto do candidato.",
   "Não havia processo para a campanha que traz os cadastros.",
   "Todo cadastro ia direto para o WhatsApp. Uma conferência de um minuto antes poupa a conversa com concorrente."],
  ["Processo novo 4.1 para a campanha.", "Cadastro e aceite juntos em 4.2.", "Conferência antes do contato, retomada de quem some e falta à conversa entram no passo a passo.",
   "Papel novo: Candidato a parceiro."],
  FL("""i1 i K Cadastro com aceite enviado pela landing page
        s1 sub G P-21
        t1 s G Conferir o cadastro e o site do candidato
        g1 d G É concorrente evidente ou cadastro inválido?
        t2 s G Descartar o cadastro com o motivo
        t3 w G Chamar o candidato pelo WhatsApp em até 24 horas úteis
        g2 d G O candidato respondeu?
        s2 sub G P-25
        g3 d G O candidato voltou a responder?
        s3 sub G P-22
        g4 d G Cumpre os critérios da fila?
        t4 w G Enviar o link da agenda
        t5 t K Marcar o horário na agenda
        t6 w G Confirmar o horário na véspera e no dia
        s4 sub G P-23
        g5 d G Como terminou a conversa?
        f1 f G Cadastro descartado
        f2 f G Candidato sem resposta
        f3 f G Candidato sem interesse ou não aprovado
        f4 f G Parceiro Select com acesso ao portal""",
     "i1>s1>t1>g1; g1:Sim>t2>f1; g1:Não>t3>g2; g2:Não>s2>g3; g3:Não>f2; g3:Sim>s3; g2:Sim>s3>g4; g4:Não>t2; g4:Sim>t4>t5>t6>s4>g5; g5:Aprovado>f4; g5:Sem interesse ou não aprovado>f3; g5:Faltou>t4"),
  participantes=[CAND],
  desc="Da campanha de aquisição ao parceiro com acesso. Todo parceiro entra pelo mesmo caminho, sem exceção: anúncio, landing page, cadastro com aceite, fila no portal, conferência do cadastro, contato do Gerente pelo WhatsApp em até 24 horas úteis, qualificação pela mensagem, link da agenda, confirmação na véspera e no dia, e a conversa de entrada, em que a conta é criada. Quem não responde vai para a retomada. A fila existe para que concorrentes e pessoas sem interesse não tenham acesso ao que a Wise oferece.")

R(P98,
  "Planejar, pôr no ar e acompanhar a campanha de anúncios que leva empresas à página dos parceiros.",
  "A jornada do parceiro começa no anúncio, mas o mapa começava no cadastro. Sem este processo, ninguém responde por quanto se gasta, por qual vídeo traz parceiro bom e por quando pausar. É também aqui que se escolhe o tipo de parceiro de cada campanha, que você definiu como a única coisa que muda de uma campanha para outra.",
  [("Um caso é uma campanha", "Cada campanha tem um tipo de parceiro como público. A atual busca software de gestão, com CRM e ERP à frente, com qualquer tamanho de carteira.", "FO-06 e FO-11"),
   ("Canal", "Anúncios no Meta que levam à página dos parceiros.", "Pedido do Igor, 07/11"),
   ("Medição", "Cada vídeo ou anúncio leva um código próprio no link, e a página guarda de qual anúncio veio cada cadastro. O pixel do Meta e o GA4 medem a página.", "Portal e conversa de 07/11"),
   ("O que se acompanha", "Por semana: gasto, cadastros, aprovados e ativados por anúncio. O número que decide é o custo por parceiro ativado, não o custo por cadastro.", RV),
   ("Quando pausar", "Quando a fila passar do que o Gerente atende em 24 horas úteis, ou quando um anúncio trouxer cadastros que não passam na fila.", RV),
   ("Quem é o dono", "Não está decidido. O passo a passo supõe o Diretor, que pediu a campanha e grava os vídeos, com o Gerente configurando a página. A pergunta abaixo decide.", "Em aberto")],
  ["Pelo método, toda etapa da jornada precisa de um processo que a execute. A etapa 'atrair pela campanha' não tinha nenhum.",
   "Teste do dinheiro: o gasto com anúncios não tinha dono nem registro."],
  ["Processo novo."],
  FL("""i1 i D Decisão de abrir ou renovar uma campanha
        t1 t D Escolher o tipo de parceiro e o público da campanha
        t2 t D Gravar os vídeos e montar os anúncios
        t3 s G Configurar a página: vídeo, agenda, pixel e código de cada anúncio
        t4 t D Pôr os anúncios no ar
        e1 et G Fim de cada semana
        t5 s G Informar o gasto e ler o custo por parceiro aprovado e ativado
        g1 d D A campanha continua?
        t6 t D Ajustar ou trocar os anúncios
        t7 t D Encerrar a campanha e registrar o resultado
        f1 f D Campanha encerrada com resultado apurado""",
     "i1>t1>t2>t3>t4>e1>t5>g1; g1:Sim, como está>e1; g1:Sim, com ajustes>t6>e1; g1:Não>t7>f1"),
  dono=DIR, participantes=[GP], gatilho="Decisão de abrir ou renovar uma campanha", cliente="Diretor e Gerente de Parcerias", frequencia="Uma campanha por tipo de parceiro",
  desc="Escolher o tipo de parceiro e o público, gravar os vídeos, montar os anúncios, configurar a página dos parceiros (vídeo, agenda, pixel e código de cada anúncio), pôr no ar e acompanhar toda semana o gasto e o custo por parceiro aprovado e ativado, até encerrar a campanha com o resultado registrado.",
  portal="guarda a configuração da página, registra a origem de cada cadastro e mostra o funil por anúncio.",
  hoje="A página dos parceiros está no ar em partners.wisemakers.com.br, guarda a origem de cada cadastro (campanha, anúncio e vídeo) e aceita o pixel do Meta e o GA4 em Configurações. Faltam os códigos do pixel e do GA4 e os links por vídeo, que dependem do Igor.")
LIGA("P-04", "Perfil e critérios da fila", P98); LIGA(P98, "Cadastros pela página", "P-21")
ABERTA("campanha_dono", P98, "Quem é o dono da campanha de aquisição de parceiros?",
       ["O dono responde pelo resultado: decide o público, aprova os anúncios, acompanha o gasto e decide quando pausar. Não precisa ser quem executa cada passo.",
        "O que sei: o Igor pediu a campanha e a fila, grava os vídeos e vai passar o pixel e o GA4. Você administra as páginas no portal."],
       ["O Igor é o dono; eu configuro a página e informo os números", "Eu (Guilherme) sou o dono; o Igor grava os vídeos e aprova o gasto",
        "Uma agência ou outra pessoa roda os anúncios; o Igor é o dono (comente quem)", "Não sei: decidir com o Igor"],
       "A primeira, porque o gasto e a escolha do público são decisões de direção. Mas é uma decisão de vocês dois.")

R("P-21",
  "O que o portal faz, sozinho, no instante em que alguém envia o formulário da página: valida, registra o aceite, põe na fila e avisa.",
  "É a porta de entrada. As validações evitam trabalho perdido (empresa repetida, quem já tem acesso) e o registro do aceite é a prova do contrato.",
  [("Campos obrigatórios", "Nome, empresa, WhatsApp, e-mail, CNPJ, tipo de software e os dois aceites.", "FO-09 e portal"),
   ("Aceite", "Termo e política aceitos no formulário; o portal guarda a versão de cada texto, a data e a hora. Na aprovação, vira o aceite eletrônico do parceiro.", "FO-12"),
   ("Barreiras", "Não entra: e-mail que já tem acesso ao portal, empresa que já é parceira e empresa que já está na fila.", "Regra já construída no portal"),
   ("Origem", "Cada cadastro guarda de qual campanha, anúncio e vídeo veio.", "Portal"),
   ("Aviso", "Os administradores recebem um aviso no portal a cada cadastro.", "Pedido do Igor, 07/11"),
   ("O que o candidato vê", "'Cadastro recebido. Nossa equipe vai falar com você pelo WhatsApp em até 24 horas úteis.'", "FO-12"),
   ("Outras origens", "Candidato que chega por indicação, evento ou contato direto recebe o link da página e entra pela mesma fila.", RV)],
  ["'Manter a fila' não passava no checklist do método: não tinha começo nem fim; era a tela onde o processo 4 acontece, não um processo.",
   "O aceite (antigo 4.4) é o mesmo gesto do cadastro. Separado, era um processo de um passo e de um papel só."],
  ["Nome novo: Receber o cadastro com o aceite. Passa a descrever o que o portal faz na chegada do formulário.",
   "Absorve o antigo 4.4 Registrar o aceite do termo e da política.", "Passo a passo escrito (não existia)."],
  FL("""i1 i K Formulário da página enviado
        t1 a G Validar os campos e os dois aceites
        g1 d G E-mail com acesso, empresa já parceira ou já na fila?
        t2 a G Mostrar o motivo ao candidato
        t3 a G Registrar o cadastro com a origem e as versões do termo e da política
        t4 a G Avisar os administradores
        t5 a G Mostrar ao candidato que a equipe fala em até 24 horas úteis
        f1 f G Cadastro recusado pela página
        f2 f G Cadastro na fila""", "i1>t1>g1; g1:Sim>t2>f1; g1:Não>t3>t4>t5>f2"),
  nome="Receber o cadastro com o aceite", ordem=1, participantes=[CAND], gatilho="Formulário da página enviado", cliente="Candidato a parceiro",
  desc="No envio do formulário, o portal valida os campos e os dois aceites, barra quem já tem acesso, quem já é parceiro e quem já está na fila, registra o cadastro com a origem (campanha, anúncio e vídeo) e as versões do termo e da política, avisa os administradores e mostra ao candidato o próximo passo. Candidatos de outras origens recebem o link da página e entram pela mesma fila.",
  portal="é a fila de espera em Configurações, com a situação, a observação e os botões de WhatsApp, agenda e aprovação.",
  hoje="Construído e testado (os 4 testes de banco da fila passam). Ainda não publicado: espera o seu 'pode publicar a fila'.")
RETIRAR("P-24", "P-21", "O aceite acontece no mesmo gesto do cadastro. Separado, era um processo de um passo só e de um papel só, o que o checklist do método chama de pequeno demais: vira um passo de outro processo.",
        "O registro do aceite virou passo de 4.2 Receber o cadastro com o aceite; o texto do termo é mantido em 1.4.4.")

R("P-22",
  "Uma troca curta de mensagens em que o Gerente confirma o que o candidato escreveu no cadastro e decide se ele segue para a conversa.",
  "Evita gastar uma conversa de entrada com quem não tem clientes empresariais, é concorrente ou não tem interesse real. Você definiu que a qualificação é breve: só confirmar as informações que ele mesmo deixou.",
  [("Quem", "O Gerente, sempre.", "FO-11"),
   ("Como", "Por mensagem de WhatsApp, a partir da mensagem pronta do portal, com o nome de quem está logado.", "FO-11 e portal"),
   ("O que confirma", "O tipo de empresa e de clientes, se há clientes empresariais que podem estar no ICP da Wise, quem cuidará da parceria e o interesse em oferecer a consultoria aos clientes.", "FO-11 e FO-12"),
   ("Sem mínimo de clientes", "A quantidade de clientes ativos não reprova ninguém.", "FO-11"),
   ("Registro", "Cada contato deixa uma observação no cadastro e muda a situação para contatado.", "Portal"),
   ("Se não passa", "O cadastro é descartado com o motivo. A pergunta abaixo decide se o candidato é avisado.", "Em aberto")],
  ["O processo não tinha passo a passo e é o mais repetido da entrada.",
   "Ainda recebia 'candidato com reunião agendada', sobra do desenho antigo, em que a qualificação vinha depois da primeira reunião.",
   "Não dizia o que fazer com o candidato reprovado."],
  ["Passo a passo escrito (não existia).", "Entradas corrigidas: critérios da fila (1.3) e cadastro na fila (4.2)."],
  FL("""i1 i G Candidato respondeu ao primeiro contato
        t1 w G Confirmar com o candidato os dados do cadastro
        t2 w G Perguntar sobre os clientes, o responsável e o interesse
        t3 s G Registrar a observação e marcar como contatado
        g1 d G Cumpre os critérios da fila?
        f1 f G Candidato não elegível
        f2 f G Candidato qualificado""", "i1>t1>t2>t3>g1; g1:Não>f1; g1:Sim>f2"),
  ordem=2, participantes=[CAND],
  hoje="A fila do portal já tem o botão de WhatsApp com a mensagem pronta, o campo de observação e a situação de cada cadastro.")
ABERTA("aviso_descarte", "P-22", "O candidato que não passa na fila é avisado?",
       ["Hoje o cadastro descartado só muda de situação no portal; o candidato não recebe nada.",
        "O princípio 17 do programa pede respeito também na saída. Por outro lado, avisar um concorrente de que ele foi barrado pode gerar discussão."],
       ["Recebe uma mensagem curta e respeitosa, sem detalhar o motivo", "Não é avisado; só recebe resposta se perguntar",
        "Avisa só quem chegou a conversar; quem foi barrado na conferência do cadastro não recebe nada"],
       "A terceira. Quem trocou mensagens merece um fecho; quem nunca foi chamado não espera resposta.")

R("P-23",
  "A reunião marcada pela agenda em que o Gerente conhece o candidato, apresenta a Wise e o programa e, se os dois quiserem seguir, cria a conta dele ali mesmo.",
  "É o momento em que o parceiro aprende a vender e a indicar a Wise antes de receber o acesso. Você escolheu a conversa no lugar do acesso automático justamente para isso, e para barrar concorrentes.",
  [("Quem conduz", "O Gerente, sempre.", "FO-11"),
   ("Roteiro", "Perguntas sobre o candidato; a Wise Makers, com números e casos; como o parceiro ganha; a consultoria gratuita para os clientes dele; o Wise Hub por dentro; como indicar pelo link; o minicurso.", "FO-11"),
   ("Conta criada na conversa", "O Gerente aprova o cadastro e cria a conta; o parceiro entra no portal com a senha provisória ainda na reunião.", "FO-11"),
   ("Decisão dos dois lados", "Além de o candidato querer seguir, o Gerente pode não aprovar se a conversa mostrar que ele é concorrente ou que não há interesse real.", "Proposta da revisão, a partir dos critérios do FO-11"),
   ("Confirmação", "O horário é confirmado na véspera e no dia.", "FO-11"),
   ("Falta", "Se o candidato não aparece, o Gerente oferece um novo horário. A pergunta abaixo decide quantas vezes.", "Em aberto"),
   ("Duração", "Você não informou a duração. Ela define o tamanho de cada horário da agenda. Pergunta abaixo.", "Em aberto")],
  ["O fluxo só perguntava se o candidato queria seguir. Faltava a decisão do Gerente, que é a razão de existir da fila.",
   "Não previa a falta do candidato.", "A duração da conversa não foi definida no FO-11."],
  ["Entram no passo a passo: a falta do candidato e a decisão do Gerente de aprovar ou não.", "Os sete blocos do roteiro viraram cinco passos, sem mudar o conteúdo."],
  FL("""i1 i G Horário marcado e confirmado
        t0 t G Abrir a reunião no horário marcado
        g0 d G O candidato compareceu?
        t9 w G Oferecer um novo horário
        t1 t G Perguntar sobre a empresa e os clientes do candidato
        t2 t G Apresentar a Wise Makers, os números e os casos
        t3 t G Mostrar como o parceiro ganha e a consultoria gratuita para os clientes dele
        t4 t G Mostrar o Wise Hub por dentro e os resultados dos clientes
        t5 t G Mostrar como indicar pelo link e apresentar o minicurso
        g1 d G O candidato quer seguir?
        t6 t G Avaliar o candidato pelos critérios da fila
        g2 d G O Gerente aprova a entrada?
        t7 s G Descartar o cadastro com o motivo
        t8 s G Aprovar o cadastro e criar a conta no portal
        ta t K Entrar no portal com a senha provisória
        f0 f G Conversa a remarcar
        f1 f G Candidato sem interesse
        f2 f G Cadastro não aprovado
        f3 f G Parceiro conectado ao portal""",
     "i1>t0>g0; g0:Não>t9>f0; g0:Sim>t1>t2>t3>t4>t5>g1; g1:Não>f1; g1:Sim>t6>g2; g2:Não>t7>f2; g2:Sim>t8>ta>f3"),
  ordem=3, participantes=[CAND],
  hoje="A aprovação e a criação da conta com senha provisória estão construídas na fila do portal (botão 'Aprovar e criar acesso'), com a mensagem pronta de acesso para o WhatsApp.")
ABERTA("conversa_duracao", "P-23", "Quanto tempo dura a conversa de entrada?",
       ["O roteiro tem sete blocos e termina com a criação da conta e o primeiro login do parceiro. A duração define o tamanho do horário na agenda do Google e quantas conversas cabem por dia.",
        "Dez conversas de 45 minutos são sete horas e meia de reunião por semana, fora os diagnósticos."],
       ["30 minutos", "45 minutos", "60 minutos"],
       "45 minutos. Em 30 não cabe mostrar o Hub por dentro e ainda criar a conta; 60 reduz muito a capacidade da agenda.")
ABERTA("no_show", "P-23", "O que acontece quando o candidato marca e não aparece?",
       ["Falta em reunião marcada pela internet é comum. Sem regra, o horário se perde e o cadastro fica parado em 'reunião marcada'."],
       ["O Gerente oferece um novo horário uma vez; na segunda falta, o cadastro sai da fila", "O Gerente oferece novo horário quantas vezes for preciso",
        "Na primeira falta o cadastro sai da fila; o candidato pode se cadastrar de novo"],
       "A primeira. Dá uma segunda chance sem prender a agenda.")

R("P-25",
  "O que fazer com quem se cadastrou e sumiu: não respondeu ao WhatsApp, não marcou horário ou pediu para falar depois.",
  "Em campanha de anúncios, boa parte dos cadastros não responde na primeira mensagem. Sem regra, ou o Gerente insiste sem fim, ou a fila enche de cadastros parados e esconde os novos.",
  [("Quando começa", "Candidato sem resposta ao primeiro contato, sem horário marcado depois de receber a agenda, ou que pediu para retomar depois.", RV),
   ("Tentativas", "Um número limitado de mensagens espaçadas. A pergunta abaixo decide quantas.", "Em aberto"),
   ("Sem resposta até o fim", "O cadastro sai da fila como 'sem resposta'. A empresa pode se cadastrar de novo quando quiser.", "Proposta da revisão; o portal já aceita novo cadastro depois do descarte"),
   ("Quem pediu para depois", "Fica com data de retomada; na data, o caso volta para a fila de exceções.", "v7, adaptado"),
   ("Tom", "Cada mensagem leva algo útil (um caso, um número), sem cobrança.", V7)],
  ["O processo antigo (nutrir o candidato com gestos de valor) foi desenhado para poucos candidatos de relação próxima. Para leads de anúncio, não dizia quantas vezes tentar nem quando parar.",
   "O nome 'nutrir' não diz o que acontece."],
  ["Nome novo: Retomar candidato sem resposta.", "Regra de tentativas e fim 'sem resposta'.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Candidato sem resposta ou sem horário marcado
        i2 i G Candidato pediu para retomar depois
        t3 s G Registrar a data de retomada
        e2 et G Data de retomada
        t1 w G Enviar nova mensagem com algo útil
        e1 et G Intervalo entre as tentativas
        g1 d G O candidato respondeu?
        t2 s G Tirar o cadastro da fila como sem resposta
        f1 f G Candidato retomado
        f2 f G Candidato sem resposta""",
     "i1>t1>e1>g1; i2>t3>e2>t1; g1:Sim>f1; g1:Não, e ainda há tentativa>t1; g1:Não, e as tentativas acabaram>t2>f2"),
  nome="Retomar candidato sem resposta", ordem=4, gatilho="Candidato sem resposta, sem horário marcado ou que pediu para retomar depois",
  desc="Para quem não respondeu ao primeiro contato, não marcou horário ou pediu para falar depois: um número limitado de novas mensagens, espaçadas, cada uma com algo útil. Sem resposta até o fim, o cadastro sai da fila como 'sem resposta'; a empresa pode se cadastrar de novo.",
  portal="mostra há quantos dias o cadastro está sem resposta, conta as tentativas e lembra a data de retomada.")
ABERTA("tentativas", "P-25", "Quantas vezes o Gerente tenta falar com um candidato que não responde?",
       ["Cada tentativa é uma mensagem de WhatsApp. Depois da última sem resposta, o cadastro sai da fila como 'sem resposta' e para de aparecer."],
       ["3 mensagens em 7 dias úteis (a primeira e mais duas)", "2 mensagens em 3 dias úteis", "5 mensagens em 15 dias úteis", "Outro número (comente)"],
       "3 em 7 dias úteis. É o suficiente para pegar quem estava ocupado, sem transformar a fila em cobrança.")

# ================================================================ 5 Integrar e ativar parceiro
RETIRAR("P-76", "P-94", "Era uma página de conteúdo (o perfil do cliente ideal) mostrada num encontro de vendas presencial que não existe mais. Não tem caso, começo nem fim: é material, não processo.",
        "O conteúdo virou um bloco do minicurso (etapa de 5.2 Conduzir o onboarding) e é mantido em 11.3.")
RETIRAR("P-77", "P-94", "Mesma situação: ensinar as frases que reconhecem a dor era um bloco de treinamento presencial. Hoje é conteúdo do minicurso gravado.",
        "O conteúdo virou um bloco do minicurso e é mantido em 11.3.")
RETIRAR("P-78", "P-94", "Repetia o que 5.1.2 já faz: entregar a mensagem pronta com o link. Dois processos para a mesma entrega.",
        "A mensagem pronta é entregue em 5.1.2 e mantida em 11.4.")
RETIRAR("P-29", "P-94", "Foi desenhado para encontros de vendas, produto e pós-venda com o time do parceiro. Com o minicurso gravado, o ensino acontece em dois lugares que já existem: a conversa de entrada (4.4) e a etapa do minicurso no onboarding (5.2). Um processo só para isso duplicaria os dois.",
        "O princípio de ensinar o parceiro a indicar continua valendo: está na conversa de entrada (4.4), na etapa do minicurso (5.2) e na manutenção do minicurso (11.1).")

R("P-26",
  "Do dia em que o parceiro recebe o acesso até o primeiro cliente dele entrar pelo link e fazer o diagnóstico.",
  "Parceiro só conta quando ativa. A maioria dos programas perde o parceiro entre o 'sim' e a primeira indicação; as etapas existem para ele sempre saber o próximo passo, e para a Wise ver quem parou.",
  [("Por etapas, sem prazo", "O onboarding não tem prazo em dias; cada parceiro leva o tempo que precisar.", "FO-11"),
   ("Ativação", "Primeiro cliente cadastrado pelo link do parceiro.", "FO-11"),
   ("Todos começam como Select", "Premium e Elite têm entrada própria (7.5 e 7.4).", "FO-12"),
   ("Quem parou", "O portal mostra os dias em cada etapa e manda lembrete (5.4).", "FO-12")],
  ["Dentro deste macroprocesso havia quatro processos de ensinar o parceiro, desenhados para encontros presenciais de treinamento. Com o minicurso gravado, viraram uma etapa do onboarding.",
   "A descrição não citava o lembrete de quem para (5.4)."],
  ["Estrutura mais enxuta: 5.1 Preparar a entrada, 5.2 Conduzir o onboarding, 5.3 Declarar a ativação e 5.4 Lembrar o parceiro parado.",
   "Saem o antigo 5.2 Ensinar o parceiro a indicar e suas três atividades (ver os itens no fim do formulário)."],
  participantes=[RESP_P])

R("P-27",
  "Entregar ao novo parceiro, ainda na conversa de entrada ou logo depois, tudo o que o Select recebe: grupo, link, página do cliente com a logo dele, minicurso e Wise Hub.",
  "O parceiro precisa sair da conversa com as ferramentas na mão. Se a entrega atrasa, o entusiasmo da conversa se perde.",
  [("O que entrega", "Grupo de WhatsApp com a Wise, link da página do cliente com a mensagem pronta, minicurso liberado, Wise Hub com as duas marcas e certificado de parceiro.", "FO-11 e FO-12"),
   ("Quando", "Na própria conversa de entrada.", "FO-11"),
   ("O que fica para o Premium", "Ficha na Prateleira e recomendação aos clientes da Wise.", "FO-11"),
   ("Certificado", "Você definiu que o Select já ganha o certificado. Não ficou dito se é na entrada ou ao concluir o minicurso. Pergunta abaixo.", "Em aberto"),
   ("Wise Hub com as duas marcas", "Não sei como isso é entregue na prática. Pergunta abaixo.", "Em aberto")],
  ["A entrega ainda apontava para o encontro de alinhamento (que virou porta do Premium) e falava em 'ficha publicada' na Prateleira, que o Select não tem.",
   "Não tinha passo a passo.", "Dois itens da entrega não têm forma definida: o certificado e o Hub com as duas marcas."],
  ["Entrega corrigida: vai para 5.2 Conduzir o onboarding.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Acesso criado na conversa de entrada
        s1 sub G P-73
        s2 sub G P-75
        t1 a G Liberar o minicurso e o kit na área do parceiro
        t2 t G Providenciar o Wise Hub com as duas marcas
        f1 f G Parceiro com grupo, link, minicurso e Hub"""),
  ordem=1, saidas=[], entradas=[])
CORTA("P-27", "P-28"); LIGA("P-23", "Parceiro com acesso", "P-27"); LIGA("P-27", "Parceiro equipado para começar", "P-94")
ABERTA("certificado", "P-27", "Quando o Select recebe o certificado de parceiro Wise?",
       ["No FO-12 você escreveu que o certificado de parceiro Wise já se ganha desde o Select. No desenho antigo, o certificado saía depois da trilha com teste.",
        "No FO-11 você disse que um dos objetivos da fila é incentivar o parceiro a assistir o material."],
       ["Ao concluir o minicurso", "Na entrada, junto com o acesso", "Na ativação (primeiro cliente pelo link)"],
       "Ao concluir o minicurso. O certificado vira o motivo para assistir, que é o que você quer incentivar.")
ABERTA("hub_marcas", "P-27", "Como o parceiro Select recebe o 'Wise Hub com as duas marcas'?",
       ["Você definiu que o Wise Hub com as duas marcas é benefício desde o Select. Não sei como o Hub trata a marca do parceiro, e isso muda quem faz o quê na entrada.",
        "O que já existe: a página do cliente no portal mostra a logo do parceiro ao lado da Wise, e o cliente recebe o link do Hub depois do diagnóstico ou do autodiagnóstico."],
       ["A página do cliente com as duas marcas já cumpre; dentro do Hub nada muda", "Alguém da Wise configura a logo do parceiro dentro do Hub, à mão, a cada parceiro novo (comente quem)",
        "O Hub já faz isso sozinho a partir de algum cadastro (comente como)", "Não sei: ver com quem cuida do Hub"])

R("P-73",
  "Abrir o grupo de WhatsApp entre a Wise e as pessoas do parceiro e registrar no portal.",
  "O grupo é o canal de conversa do programa: é por ele que o parceiro recebe o retorno dos clientes que indicou e tira dúvidas. O portal não é canal de conversa.",
  [("Um grupo por parceiro", "A Wise e as pessoas do parceiro.", V7),
   ("Para todos os níveis", "Enquanto o tamanho permitir; quando ficar inviável, a regra é revista.", "FO-11"),
   ("Quem cria", "O Gerente, na conversa de entrada.", RV)],
  ["O nome dizia 'incluir na comunidade', mas o que acontece é a criação do grupo do parceiro. O que 'comunidade' quer dizer para o Select está na pergunta do macroprocesso 8.",
   "Com volume, criar um grupo por parceiro é trabalho manual do Gerente a cada entrada. Vale saber disso ao aprovar."],
  ["Nome novo: Criar o grupo de WhatsApp do parceiro.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Acesso criado na conversa de entrada
        t1 w G Criar o grupo com as pessoas do parceiro
        t2 w G Enviar a mensagem de boas-vindas com o endereço do portal
        t3 s G Registrar o grupo no card do parceiro
        f1 f G Grupo do parceiro ativo"""),
  nome="Criar o grupo de WhatsApp do parceiro")

R("P-75",
  "Dar ao parceiro o link exclusivo dele, a página do cliente com a logo dele e a mensagem pronta para enviar à base.",
  "Indicar tem que ser um gesto sem atrito: copiar e enviar. É o link que registra a origem do cliente e garante a comissão.",
  [("Link", "partners.wisemakers.com.br/c/código, único por parceiro.", "FO-10 e FO-11"),
   ("Página com duas marcas", "A página do cliente mostra a Wise e o parceiro; o parceiro sobe a própria logo.", "FO-10"),
   ("Mensagem pronta", "Texto já com o link, na tela Indicar do parceiro.", "FO-10"),
   ("Proteção da origem", "180 dias a partir do cadastro do cliente.", "FO-11"),
   ("Liberação", "O link é liberado na aprovação, sem depender de contrato assinado à parte.", "FO-12 e portal")],
  ["A entrega apontava para o encontro de alinhamento.", "O passo de subir a logo, que já existe no portal, não aparecia."],
  ["Entrega corrigida: vai para 5.2 Conduzir o onboarding.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Acesso criado na conversa de entrada
        t1 a G Gerar o link exclusivo e a mensagem pronta
        t2 t P Subir a logo da empresa
        t3 a G Montar a página do cliente com as duas marcas
        f1 f G Link e página do cliente prontos"""),
  saidas=[],
  hoje="Construído e no ar: tela Indicar com o link, a mensagem pronta, o envio da logo e a lista de clientes que entraram pelo link.")
CORTA("P-75", "P-28"); LIGA("P-75", "Link e página do cliente prontos", "P-94")

R("P-94",
  "As seis etapas que levam o Select do primeiro login ao primeiro diagnóstico feito na base dele, com o portal mostrando onde cada parceiro está.",
  "Você pediu um onboarding com metas e atividades conjuntas, sem prazo em dias. As etapas dão ao parceiro o próximo passo e dão à Wise a medida de quem avança.",
  [("As seis etapas", "Primeiro login; minicurso assistido; anúncio conjunto publicado; link e mensagem enviados à base; primeiro cliente cadastrado pelo link (ativação); primeiro diagnóstico feito na base.", "FO-12"),
   ("Sem prazo", "Nenhuma etapa tem data limite.", "FO-11"),
   ("Ordem sugerida, não obrigatória", "O parceiro pode enviar o link antes de terminar o minicurso. O portal marca cada etapa quando ela acontece, em qualquer ordem.", RV),
   ("Quem marca cada etapa", "O portal marca sozinho o login, o minicurso, o cliente cadastrado e o diagnóstico. O anúncio e o envio à base são marcados pelo parceiro, porque o portal não tem como ver.", RV),
   ("Minicurso", "O Igor grava e revisa; o Gerente mantém atualizado. Cobre o perfil do cliente ideal, as frases que reconhecem a dor e como indicar pelo link.", "FO-11"),
   ("Anúncio conjunto", "Foi o único passo do plano antigo que você manteve. Quem publica e com que material está na pergunta abaixo.", "FO-11; forma em aberto"),
   ("O parceiro vê", "Na área dele, as etapas feitas e a próxima.", "FO-12")],
  ["O fluxo desenhava as etapas em fila única, como se uma só começasse quando a anterior termina. Na prática o parceiro faz na ordem que quiser.",
   "Não dizia como o portal sabe que o anúncio foi publicado ou que o link foi enviado.",
   "O ensino do parceiro (antigo 5.2 e suas três atividades) acontece hoje no minicurso e na conversa de entrada."],
  ["Regras novas: ordem livre e quem marca cada etapa.", "Absorve o antigo 5.2 Ensinar o parceiro a indicar e as três atividades dele.",
   "Entrega nova: situação do onboarding para a mesa mensal (2.3)."],
  FL("""i1 i G Parceiro com grupo, link, minicurso e Hub
        t1 a G Criar as etapas do onboarding do Select
        t2 t P Assistir ao minicurso de como vender a Wise
        t3 t P Publicar o anúncio conjunto da parceria e marcar no portal
        t4 t P Enviar o link e a mensagem pronta para a base e marcar no portal
        e1 em G Primeiro cliente cadastrado pelo link
        s1 sub G P-30
        e2 em G Primeiro diagnóstico feito na base do parceiro
        t5 a G Marcar o onboarding como concluído
        f1 f G Onboarding do Select concluído""", ext=CLI, msg=[("X2", "e1", "Cadastro pelo link"), ("X2", "e2", "Diagnóstico feito")]),
  ordem=2, gatilho="Parceiro com grupo, link, minicurso e Hub",
  desc="Etapas e metas do Select, sem contar dias: primeiro login, feito na conversa; minicurso assistido; anúncio conjunto da parceria publicado; link e mensagem pronta enviados para a base; primeiro cliente cadastrado pelo link (ativação); primeiro diagnóstico feito na base do parceiro. A ordem é sugerida, não obrigatória. O Premium e o Elite têm entrada própria.",
  portal="cria as etapas, marca sozinho as que consegue ver (login, minicurso, cliente, diagnóstico), deixa o parceiro marcar as outras e mostra a ele o que falta.")
ABERTA("anuncio", "P-94", "Como é feito o anúncio conjunto da parceria?",
       ["No desenho antigo, o anúncio conjunto era uma postagem dos dois lados na primeira semana. Com dezenas de parceiros entrando por mês, a Wise publicar um post para cada um enche o perfil dela e toma tempo.",
        "O que o parceiro publica pode vir pronto do portal: arte e texto no kit."],
       ["O parceiro publica com a arte e o texto prontos do kit; a Wise cita os novos parceiros no comunicado do mês", "Os dois publicam: a Wise faz um post para cada parceiro novo",
        "Só o parceiro publica, com material próprio", "O anúncio conjunto vira benefício de Premium e Elite; no Select sai das etapas"],
       "A primeira. O parceiro tem o gesto de assumir a parceria em público, e a Wise reconhece sem trabalho por parceiro.")

R("P-30",
  "O momento em que o portal reconhece que o parceiro ativou: o primeiro cliente dele se cadastrou pelo link.",
  "A ativação é a linha que separa parceiro de cadastro aprovado: é o que entra nos números do programa, o que liga o cubo e o melhor momento para reforçar o comportamento.",
  [("Critério", "Primeiro cliente cadastrado pelo link.", "FO-11"),
   ("Automático", "O portal marca sozinho e avisa o parceiro e o Gerente.", "FO-11"),
   ("Cadastro de teste não conta", "Cadastro feito com o e-mail ou o CNPJ do próprio parceiro não ativa. Sem isso, o parceiro ativa testando o próprio link.", RV),
   ("Parabéns pessoal", "O Gerente manda uma mensagem pessoal no grupo do parceiro e explica como o cliente dele será atendido.", "Proposta da revisão, pelo princípio de fechar o ciclo com quem indica"),
   ("O que liga", "A partir daqui o parceiro entra no cubo e na mesa mensal.", RV)],
  ["Um passo só e automático seria pequeno demais para ser processo. Ele se justifica porque a ativação muda o estado do parceiro e pede um gesto humano.",
   "A regra não protegia contra o teste do próprio parceiro."],
  ["Regra nova: cadastro de teste não ativa.", "Passo novo: parabéns pessoal no grupo.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Primeiro cliente cadastrado pelo link do parceiro
        t1 a G Conferir se o cadastro não é do próprio parceiro
        g1 d G É cadastro de teste?
        t2 a G Marcar o parceiro como ativado e avisar os dois lados
        t3 w G Parabenizar no grupo e explicar como o cliente será atendido
        f1 f G Cadastro de teste ignorado
        f2 f G Parceiro ativado""", "i1>t1>g1; g1:Sim>f1; g1:Não>t2>t3>f2"),
  ordem=3,
  desc="O parceiro está ativado quando o primeiro cliente se cadastra pelo link dele, desde que não seja um teste do próprio parceiro. Não há prazo: quem não avança recebe o lembrete do portal (5.4).",
  portal="confere se não é teste, marca a ativação sozinho e avisa o parceiro e o Gerente.")
LIGA("P-95", "Cliente cadastrado pelo link", "P-30"); LIGA("P-30", "Parceiro ativado", "P-16")

R("P-97",
  "Quando um parceiro fica tempo demais na mesma etapa, o portal lembra por e-mail; se não adiantar, o caso vai para o Gerente.",
  "Sem prazo, ninguém é reprovado por demorar. Mas alguém precisa notar quem parou, e com centenas de parceiros isso não pode depender de olhar um por um.",
  [("Lembrete, não prazo", "O e-mail lembra o próximo passo; não há punição.", "FO-12"),
   ("Dias na etapa visíveis", "O Gerente vê há quantos dias cada parceiro está na etapa.", "FO-12"),
   ("Depois do lembrete", "Se o parceiro continua parado, o caso entra na fila de exceções e o Gerente decide se vale uma mensagem pessoal.", "FO-12"),
   ("Limite de dias", "Você não definiu depois de quantos dias sai o lembrete. Pergunta abaixo.", "Em aberto"),
   ("Fim da linha", "O processo não dizia o que acontece com quem nunca avança. Pergunta abaixo.", "Em aberto")],
  ["Processo criado na v8 a partir do FO-12. Faltam dois números: o limite de dias e o que fazer com quem nunca avança. Sem o segundo, os lembretes seguem para sempre."],
  ["Nada muda no desenho; as duas perguntas abaixo completam a regra."],
  ordem=4)
ABERTA("limite_lembrete", "P-97", "Depois de quantos dias na mesma etapa o portal manda o lembrete?",
       ["No FO-12 você escolheu o lembrete automático por e-mail, mas não disse depois de quanto tempo."],
       ["7 dias", "14 dias", "21 dias", "30 dias"], "14 dias. Uma semana é pouco para quem depende de outras pessoas na empresa; um mês deixa o parceiro esfriar.")
ABERTA("adormecido", "P-97", "O que acontece com o parceiro que recebe os lembretes e nunca avança?",
       ["Sem prazo em dias, o parceiro nunca é reprovado. Mas, sem um fim, o portal manda lembrete para sempre e o parceiro parado continua contando como parceiro nos números.",
        "Parceiro parado não custa nada para a Wise: mantém o acesso e pode ativar a qualquer momento."],
       ["Depois de 3 lembretes sem avanço, fica como adormecido: mantém o acesso, para de receber lembrete, sai das contas de parceiros ativos e volta sozinho se um cliente se cadastrar",
        "Continua recebendo lembrete sem limite", "Depois de 3 lembretes, a parceria é encerrada e o acesso revogado"],
       "A primeira. Não queima a relação, limpa os números e não gasta o tempo de ninguém.")
