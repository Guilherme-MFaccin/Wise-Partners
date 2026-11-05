# Rodada 6: o que muda com a conversa com o Igor de 04/11 e o que entra na primeira entrega do portal (executado dentro de tobe6_base.py).
FO6 = []
def Q6(chave, bloco, texto, tipo, opcoes, alvo, contexto, logica, cits, recomendo=""):
    ids = []
    for a in alvo:
        if a.startswith("F:"): ids.append(FT[a[2:]])
        elif a.startswith("P:"): ids.append(PR[a[2:]])
        else:
            k, _, campo = a.partition("|"); ids.append(P[k] + ("." + campo if campo else ""))
    FO6.append(add("perguntas", "Q", texto=texto, tipo=tipo, opcoes=opcoes, alvo=ids, para=["PE-01"], rodada=6, bloco=bloco, status="em_formulario",
                   formulario=None, respostas=[], chave=chave, contexto=contexto, logica=logica, citacoes=cits, visual=chave, recomendo=recomendo))
AP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"]
B1, B2, B3, B4 = "A nova proposta de valor", "O diagnóstico como entrega padrão", "Foco e ativação", "Para levar ao portal"

Q6("valor_saas", B1, "Para parceiros de software de gestão, o valor central da Wise passa a ser a retenção da base deles, com a entrega da Wise dentro do processo do parceiro. Você aprova?", "escolha", AP,
   ["F:valor_saas"],
   ["Na conversa com o Igor apareceu a ideia que mais muda o modelo de negócio desde a Rodada 1. Até aqui, o valor para o parceiro era receber demanda de volta, conhecimento para indicar, comunidade e comissão. A conversa trouxe um valor mais forte para um tipo específico de parceiro: o software de gestão (CRM, ERP e afins).",
    "O raciocínio da conversa: a base de clientes do software depende de eficiência comercial para continuar pagando. Muitos clientes não usam a ferramenta inteira porque não têm processo de gestão. A Wise resolve exatamente isso. Então a Wise ajuda o parceiro a reter a própria base, e não só a ganhar comissão.",
    "A frase-chave foi: o que a gente entrega tem que fazer parte do processo dele. Isso converge com Keystone (criar valor antes de capturar) e com Referral Engine (o parceiro que recebe valor indica melhor). Também foi citado que dois parceiros com quem você conversou na semana passada estão ávidos por isso."],
   "Se a entrega da Wise vira parte do processo do parceiro, a indicação deixa de depender de lembrança ou boa vontade: ela acontece toda vez que o parceiro ganha um cliente. É o mesmo efeito que os softwares conseguem com programas de milhares de parceiros, numa escala que cabe na Wise.",
   [R(2, "07:20", "O problema que a gente resolve para o nosso parceiro é ele ter uma base de clientes que depende do software dele, mas para que eles mantenham o contrato com o software deles, eles precisam de uma eficiência comercial."),
    R(2, "08:48", "O que a gente entrega tem que fazer parte do processo dele."), VP(KS, 1), VP(RE, 11)], "Aprovo")

Q6("diagnostico", B2, "O diagnóstico comercial gratuito para cada cliente novo do parceiro vira a entrega padrão do programa?", "escolha",
   ["Sim, para todos os parceiros, desde já", "Sim, só para parceiros de software de gestão", "Primeiro como piloto com 2 ou 3 parceiros, depois padroniza", "Não (comente)"],
   ["F:diagnostico_oferta", "6.9"],
   ["A proposta da conversa: todo cliente novo do parceiro recebe a oferta de uma reunião de diagnóstico com a Wise, de 40 a 60 minutos, que termina com um mapa de planejamento. Depois do diagnóstico, o cliente ganha acesso ao Wise Hub. Se ele quiser seguir, vira oportunidade.",
    "No mapa, isso vira a quinta porta de oportunidade (junto com link, Prateleira, cruzamento de carteiras e Base Ativa) e um processo novo: 6.9 Conduzir o diagnóstico do cliente do parceiro.",
    "A conversa também levantou o limite: a Wise não escala como um software, e cada diagnóstico custa uma hora de alguém. Uma por dia dá cerca de 20 por mês. Os livros que você seguiu na Rodada 4 pedem começar pequeno e provar antes de abrir para todos."],
   "Um piloto com os dois ou três parceiros que já estão ávidos mostra, em poucas semanas, quantos clientes aceitam o diagnóstico, quantos viram oportunidade e quanto tempo isso consome. Com esses números, padronizar fica seguro.",
   [R(2, "10:31", "Todo cliente dele fazendo diagnóstico conosco para poder fazer uma avaliação da operação."), R(2, "14:50", "A gente oferecer uma reunião de diagnóstico de graça pra cada cliente."),
    R(2, "09:49", "O nosso talvez não vai ser escalado para 5 mil parceiros."), VP(KS, 4), VP(CS, 4)], "Primeiro como piloto")

Q6("quem_diagnostica", B2, "Quem conduz os diagnósticos, e com que limite?", "escolha",
   ["Eu, no máximo um por dia", "Eu e os consultores da Wise, com o meu roteiro", "Os consultores, e eu acompanho pela fila", "Não sei: decidir com o Igor"],
   ["6.9"],
   ["Na conversa, o cálculo foi seu: uma entrevista de 40 minutos por dia fecha 50 em dois meses. Isso funciona enquanto o diagnóstico serve também à pesquisa. Se ele virar entrega padrão do programa, a demanda pode passar disso.",
    "Customer Success chama atenção para o mesmo ponto: atenção de alta intensidade cabe a poucos por pessoa, e o resto precisa de um formato um para muitos. Você manteve, na Rodada 4, ser dono de tudo sem teto. O diagnóstico é a primeira entrega que pode passar desse limite, porque não depende só de você."],
   "Definir agora quem conduz e qual é o limite evita prometer ao parceiro uma oferta que a agenda não sustenta.",
   [R(2, "23:47", "Uma por dia, em dois meses eu mato tudo."), VP(CS, 3), F(PP, 4, 0)])

Q6("hub", B2, "Como fica o acesso ao Wise Hub?", "escolha",
   ["Só depois de um contato com a Wise: diagnóstico para o cliente do parceiro, pacote B para a base do parceiro", "Hub aberto a toda a base do parceiro, como benefício solto", "Só pelo pacote B, como no Playbook v3.1 (sem acesso pelo diagnóstico)"],
   ["F:hub_politica"],
   ["Hoje o Playbook v3.1 põe o Wise Hub com as duas marcas no pacote B, para a base de Premium e Elite que divulgam. A conversa trouxe uma preocupação: oferecer o Hub para todo mundo, como publicidade, pode desvalorizar a plataforma.",
    "E trouxe uma observação de mercado: plataforma de aulas sozinha gera pouco engajamento. O que engaja é o contato antes: o cliente faz o diagnóstico, vê o que está errado no negócio dele, e aí recebe as aulas que resolvem aquilo."],
   "O acesso depois do contato preserva o valor do Hub e aumenta o uso, porque o cliente chega à plataforma sabendo o que procurar.",
   [R(2, "12:42", "Será que não ia desvalorizar demais o próprio Wise e Hammer se a gente fizesse isso para todo mundo?"),
    R(2, "17:31", "só que eu acho que se ter só ela pra oferecer, eu acho que ele não vai gerar o nível de engajamento nos meus casos."), A("EV-0019")], "Só depois de um contato")

Q6("pesquisa", B2, "O diagnóstico do programa fica ligado ao seu projeto de pesquisa sobre maturidade comercial e CRM?", "escolha",
   ["Sim, como campanha de lançamento até março, se a universidade aprovar o formato", "Sim, mas a pesquisa usa só o roteiro: o retorno comercial fica separado e opcional", "Não ligar as duas coisas"],
   ["F:pesquisa"],
   ["Você contou ao Igor que precisa entrevistar 50 empresas até março para o projeto de pesquisa, e que já tem o roteiro de diagnóstico. A ideia foi juntar as duas coisas: os parceiros convidam os clientes deles, o cliente recebe o diagnóstico e o acesso ao Hub, a pesquisa ganha as entrevistas e a Wise ganha contato com empresas no ICP.",
    "Há um cuidado que a conversa já começou a tratar: você ia confirmar com a universidade se o vínculo pode ser apresentado assim. Quando a mesma conversa serve à pesquisa e à venda, o participante precisa saber disso desde o convite. Isso pede um termo de consentimento que separe o uso científico dos dados do contato comercial, e o direito de participar da pesquisa sem receber contato comercial depois."],
   "Ligar as duas coisas resolve o seu problema de agenda e dá ao programa uma campanha de lançamento com motivo claro. Separar o retorno comercial protege a pesquisa e a confiança do cliente do parceiro.",
   [R(2, "17:31", "Eu preciso, daqui até mais ou menos março, entrevistar 50 empresas para o meu projeto de pesquisa"),
    R(2, "23:47", "eles tão ávidos, eles querem mesmo poder oferecer os nossos serviços pra eles"), VP(NE, 6, 1)])

Q6("resumo_parceiro", B2, "O parceiro recebe o resultado do diagnóstico do cliente dele?", "escolha",
   ["Sim, só com autorização escrita do cliente, dada no próprio agendamento", "Só um resumo agregado da base dele, sem identificar nenhum cliente", "Não: o resultado é só do cliente"],
   ["6.9|regras"],
   ["Na conversa apareceu a ideia de dar ao time de sucesso do cliente do parceiro um resumo do diagnóstico: quem usa pouco o sistema, quem tem dificuldade. Para o parceiro de software, isso vale muito, porque mostra onde a base dele está em risco.",
    "A regra de dados que você já aprovou no programa é: só dados de empresa, cruzamento com consentimento e só as coincidências reveladas. O diagnóstico é uma conversa do cliente com a Wise. Passar o conteúdo ao parceiro sem autorização quebra a confiança que o próprio diagnóstico cria."],
   "O resumo agregado dá ao parceiro o padrão da base sem expor ninguém. A autorização individual permite o detalhe quando o cliente quer ajuda do parceiro.",
   [R(2, "24:48", "Pro próprio cara do time de CS"), VP(NE, 9, 2), VP(KS, 8)])

Q6("comissao_diag", B2, "Se o cliente contrata a Wise depois do diagnóstico oferecido pelo parceiro, isso gera comissão para o parceiro?", "escolha",
   ["Sim, como indicação normal, quando o cliente marcou pelo link do parceiro", "Sim, mas com uma regra própria (comente)", "Não: o diagnóstico já é o valor que a Wise entrega ao parceiro"],
   ["F:comissao_diagnostico"],
   ["O Playbook v3.1 diz que comissiona quem gerou o primeiro contato registrado. Se o cliente chega ao diagnóstico pelo link do parceiro, o primeiro contato é do parceiro. A conversa também lembrou que os clientes menores dos parceiros, de sistemas mais simples, são possíveis clientes da Wise.",
    "Você decidiu que a comissão é regra única, sem exceção. A dúvida aqui é só se o diagnóstico conta como indicação. Se não contar, o parceiro passa a mandar clientes para a Wise sem ganhar nada quando eles fecham."],
   "A regra mais simples e coerente com a sua decisão é tratar o link do parceiro como o registro de origem, como já acontece com a indicação.",
   [A("EV-0033"), R(2, "25:41", "porque é um possível cliente também pra gente"), VP(RE, 4)], "Sim, pelo link")

Q6("convite_kit", B2, "Para o parceiro convidar os clientes dele ao diagnóstico, o que entra no kit?", "multipla",
   ["Página com vídeo da Wise explicando o diagnóstico gratuito e o que o cliente leva", "Mensagem pronta para o parceiro enviar, já com o link dele", "Agenda online para o cliente marcar sozinho", "Vídeo curto gravado junto com o parceiro", "Texto padrão para o parceiro incluir no processo de entrada do cliente dele"],
   ["11.4"],
   ["A conversa terminou com a pergunta prática: como o parceiro convida o cliente? Manda uma página? Um vídeo? Marca uma reunião? A resposta que surgiu foi uma página com vídeo e um link que o parceiro envia.",
    "Referral Engine diz que o gesto de indicar precisa ser fácil, com a ferramenta pronta na mão de quem indica. O último item da lista leva a ideia central da conversa ao fim: o convite entra no processo de entrada de todo cliente novo do parceiro."],
   "Quanto menos o parceiro precisa explicar, mais clientes chegam ao diagnóstico.",
   [R(2, "21:04", "A LP é uma oferta talvez bem agressiva."), R(2, "22:50", "fazer o vídeo com o canal LP pro David e eles são mandando link"), VP(RE, 5)])

Q6("ativacao", B3, "No plano de ativação de 90 dias, o que o parceiro recebe logo no começo?", "multipla",
   ["Semana 1: anúncio conjunto da parceria, com postagem dos dois lados", "Mês 1: treinamento curto de gestão comercial para o time do parceiro", "Mês 1: diagnóstico dos dois ou três primeiros clientes do parceiro", "Mês 2: divulgação do diagnóstico e do treinamento para a base do parceiro", "Mês 3: encontro com a base do parceiro e as primeiras oportunidades"],
   ["5.5"],
   ["A conversa abriu com um exemplo de outro programa: na entrada, o objetivo é fazer o parceiro ganhar dinheiro rápido, com um plano de 30 dias semana a semana. A conclusão foi que a Wise precisa de uma ação de início que agregue valor desde o primeiro mês, em vez de esperar dois ou três meses.",
    "O mapa já tinha o princípio (primeiro valor em até 90 dias, entregue em fatias), mas não tinha as fatias. Esta pergunta as define. O processo novo é o 5.5 Executar o plano de ativação de 90 dias, que vale para todos os pacotes. A escada do Playbook continua valendo: o que exige mais horas, como a Base Ativa, segue só para o pacote A."],
   "Uma ação concreta na primeira semana dá ao parceiro uma razão para falar da Wise antes de ter qualquer indicação, e o treinamento faz o time dele sentir o valor que depois vai indicar.",
   [R(1, "00:03", "uma vez o onboard, é fazer o cara ganhar um dinheiro rápido."), R(1, "02:45", "Na vez de esperar 2, 3 meses, já conseguia pregar valor colocado desde o início."),
    R(1, "03:50", "fazer uma postagem conjunto que começou a parceria, fazer umas publicações sobre a parceria, sobre a Wise."), VP(CS, 4)])

Q6("foco", B3, "Na fase de Experimentação, em que segmento de parceiro o programa foca?", "escolha",
   ["Software de gestão, com CRM e ERP à frente", "Só software de CRM", "Software de gestão de manutenção", "Sem foco: todas as categorias ao mesmo tempo"],
   ["F:foco_segmento"],
   ["A conversa passou pela lista inteira de categorias e chegou a duas opiniões. Agências concorrem demais com a Wise. Software, sobretudo de CRM, é melhor, porque a dor do cliente dele é a mesma que a Wise resolve. Também apareceu, de passagem, o software de gestão de manutenção como exemplo de foco.",
    "Ecosystem Economy recomenda focar num segmento de parceiro por vez e entregar uma melhora forte a poucos, em vez de uma oferta rasa para todos. Keystone diz para provar a liquidez num recorte pequeno antes de ampliar. O foco não fecha a porta para os outros: só decide onde vão as horas de recrutamento agora."],
   "Com um segmento só, o diagnóstico, o kit e o discurso ficam iguais para todos os parceiros da fase, e os resultados ficam comparáveis.",
   [R(2, "03:12", "O SaaS, eu acho que é melhor. O SaaS de CRM."), R(2, "03:12", "Agência, Saqueagência, ProAge T11... eu acho que acaba concorrendo demais."),
    R(1, "29:46", "Aí a gente foca, sei lá, ou agora pegar só, sei lá, software de gestão de manutenção."), B("ecosystem-economy", "Focar em um segmento"), VP(KS, 4)], "Software de gestão")

Q6("categorias", B3, "A lista de categorias citada na conversa vira a lista oficial do portal (Prateleira e cadastro de parceiros)?", "escolha", AP,
   ["F:categorias"],
   ["Comerciais: ERP, CRM, PCP, SST, ESG, EPM, consultoria de gestão, design, tecnologia digital, infraestrutura e data center, dados e ciência de dados, software de gestão de manutenção, automação industrial, qualidade e laboratório, eficiência energética, segurança da informação, comércio exterior e logística internacional, jurídico, tributário, contabilidade consultiva e RH.",
    "Institucionais: federações e confederações, Sistema S, institutos, associações comerciais e empresariais, associações setoriais, secretarias de indústria e comércio, sindicatos patronais, parques tecnológicos e universidades.",
    "A transcrição é automática e alguns nomes saíram truncados. Se faltou ou sobrou alguma categoria, escreva no comentário."],
   "O portal precisa de uma lista fechada para a Prateleira recomendar parceiros por categoria e para o painel mostrar a cobertura de cada uma.",
   [R(2, "03:12", "ERP, CRM, PCP, SST, ESG, EPM, Consultoria de Gestão."), R(2, "04:40", "Secretaria de Indústria e Comércio de Desenvolvimento.")])

Q6("portal_escopo", B4, "Este é o último formulário antes de levar o to-be ao portal. O que entra na primeira entrega?", "multipla",
   ["Núcleo: card do parceiro, jornada, oportunidades com as cinco portas e fila única de exceções",
    "Painel da semana com o Igor, com os oito números e a lista de casos",
    "Área do parceiro: kit, link exclusivo, simulador de ganho, oportunidades e regras",
    "Diagnóstico: agendamento pelo link do parceiro, registro e liberação do Hub",
    "Plano de ativação de 90 dias, com as tarefas de cada mês",
    "Cubo e tipos, com a jogada sugerida",
    "Cadência de contato e lembretes",
    "Comunidade: comunicado do mês, encontros e reconhecimento"],
   ["F:escopo_portal"],
   ["O portal atual foi construído antes das cinco rodadas, e quase todo o to-be muda alguma coisa nele. Levar tudo de uma vez é o erro que Keystone descreve como o mais comum nos ecossistemas que falharam: investir grande em tecnologia antes da liquidez. Platform Revolution diz o mesmo de outro jeito: o núcleo da plataforma é pequeno, e o que serve a poucos fica na borda até provar valor.",
    "Customer Success acrescenta: racionalizar à mão antes de automatizar. O que você ainda vai testar (o diagnóstico em piloto, por exemplo) pode começar com registro simples e ganhar automação depois."],
   "Marque o que precisa estar no portal no dia em que o primeiro parceiro do to-be entrar. O resto entra em entregas seguintes, na ordem que o uso mostrar.",
   [VP(KS, 4), B("platform-revolution", "Manter o núcleo do portal pequeno"), VP(CS, 10)], "Núcleo, painel da semana, área do parceiro e diagnóstico")

Q6("igor_portal", B4, "O Igor entra no portal?", "escolha",
   ["Sim, para ver o painel da semana e os casos", "Sim, para ver o painel e assinar termos e avisos pelo portal", "Não: eu mostro o painel na conversa semanal"],
   ["2.2|acesso_do_diretor"],
   ["Você decidiu que toda semana revê o programa com o Igor, apoiado no painel, e que ele assina o termo e o aviso formal. Para levar isso ao portal, falta saber se ele acessa o portal ou se o painel só aparece na sua tela durante a conversa.",
    "Customer Success pede métricas visíveis para quem decide, mas não exige que o diretor opere o sistema. A assinatura continua no Autentique em qualquer opção."],
   "Isso define as permissões do portal: quem vê o quê. Com acesso só de leitura, o Igor pode olhar os números antes da conversa, sem mudar nada.",
   [D3("Q-0008"), D3("Q-0009"), VP(CS, 8)])

fo6 = add("formularios", "FO", titulo="Rodada 6: a conversa com o Igor e a primeira entrega do portal", rodada=6, para=["PE-01"], canal="artifact", perguntas=FO6,
          introducao="Último formulário antes de levar o to-be ao portal.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw", status="enviado", enviado_em=HOJE, prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO6: q["formulario"] = fo6
d["historico"].append({"data": HOJE, "evento": "To-be v6: conversa com o Igor de 04/11 registrada como hipóteses (diagnóstico como entrega padrão, foco em software de gestão, ativação de 90 dias); Rodada 6 enviada"})
