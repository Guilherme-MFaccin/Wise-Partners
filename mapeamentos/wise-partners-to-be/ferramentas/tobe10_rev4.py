# Revisão crítica, parte 4: macroprocessos 8 (Comunidade), 9 (Reter ou encerrar), 10 (Prateleira), 11 (Equipar) e 12 (Portal).

# ================================================================ 8 Cultivar a comunidade Wise Partners
R("P-47",
  "Fazer os parceiros se sentirem parte de algo: um canal de conversa, um comunicado por mês, um encontro por trimestre e reconhecimento para quem contribui.",
  "Comissão sozinha não segura parceiro: qualquer um paga comissão. O que faz o parceiro continuar indicando é pertencer, ser reconhecido e aprender.",
  [("Todos entram desde a entrada", "O Select já faz parte da comunidade.", "FO-11"),
   ("Canal", "WhatsApp, com um grupo por parceiro; o portal não é canal de conversa.", "v7 e FO-11"),
   ("Rituais para todos", "Comunicado do mês e encontro trimestral de parceiros.", "v7 e FO-11"),
   ("Só Premium e Elite", "Mentoria mensal aberta à carteira, eventos e formações da Wise, apresentações a outros parceiros e encontros pequenos.", "FO-12"),
   ("Reconhecimento", "Por status, rede e acesso, nunca por dinheiro.", V7),
   ("Um grupo geral?", "Não está dito se existe um grupo único com todos os parceiros. Pergunta abaixo.", "Em aberto")],
  ["'Comunidade' tinha dois sentidos no mapa: o grupo de cada parceiro com a Wise e um espaço comum entre parceiros (pedidos, contribuições, apresentações). Com a campanha, muitos parceiros são concorrentes entre si (vários CRMs e ERPs). Um espaço comum com todos pede decisão.",
   "Não estava claro o que da comunidade vale para cada nível."],
  ["A descrição passa a separar o que é de todos e o que é de Premium e Elite."],
  desc="A comunidade como lugar de pertencer: utilidade primeiro, ritual fixo e reconhecimento por status, rede e acesso. Para todos, desde a entrada: grupo de WhatsApp com a Wise, comunicado do mês e encontro trimestral. Para Premium e Elite: mentoria, eventos e formações, apresentações entre parceiros e encontros pequenos.")
ABERTA("comunidade_select", "P-47", "Existe um grupo único com todos os parceiros?",
       ["Hoje o desenho tem um grupo de WhatsApp por parceiro (a Wise e as pessoas dele). Alguns processos da comunidade (pedidos e contribuições entre parceiros, apresentações) supõem um espaço em que os parceiros se veem.",
        "A campanha traz muitos parceiros do mesmo tipo: vários CRMs, vários ERPs. Num grupo único, concorrentes diretos ficam lado a lado e veem quem mais é parceiro da Wise."],
       ["Não: cada parceiro tem só o próprio grupo com a Wise; o que é de todos vai pelo comunicado e pelo encontro trimestral",
        "Sim, um grupo geral só para Premium e Elite, além do grupo de cada um", "Sim, um grupo geral com todos os parceiros, só para avisos (só a Wise escreve)", "Sim, um grupo geral aberto com todos"],
       "A primeira para o Select e a segunda quando houver Premium suficiente. Evita expor concorrentes uns aos outros e não cria um grupo que o Gerente teria de moderar.")

R("P-48",
  "A cada fase do programa, escolher um ou dois resultados que a comunidade deve gerar e medir só esses.",
  "Comunidade sem objetivo vira grupo de bom-dia. Um ou dois resultados dizem o que publicar, quem convidar e o que cortar.",
  [("Poucos resultados", "Um ou dois por fase.", V7),
   ("Escolha da v7 para esta fase", "Trazer parceiros e trazer oportunidades.", V7),
   ("Com a campanha", "Como os parceiros agora chegam pela campanha, o objetivo desta fase passa a ser ativar parceiros e trazer oportunidades.", RV)],
  ["O objetivo 'trazer parceiros' foi escolhido quando a entrada era por relacionamento. Com a campanha trazendo os parceiros, o gargalo passou a ser a ativação."],
  ["Proposta para esta fase: ativar parceiros e trazer oportunidades.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança de fase do programa
        t1 t G Escolher um ou dois resultados para a comunidade na fase
        t2 t G Rever os rituais para servirem a esses resultados
        t3 s G Registrar os resultados que serão medidos
        f1 f G Objetivo da comunidade definido"""),
  desc="Escolher um ou dois resultados por fase e medir só esses. Nesta fase, com os parceiros chegando pela campanha: ativar parceiros e trazer oportunidades.")

R("P-49",
  "O calendário fixo da comunidade: um comunicado por mês, um encontro por trimestre, a mentoria mensal e os convites a eventos.",
  "Ritual fixo cria hábito: o parceiro sabe quando vai ouvir a Wise e o que esperar. É também o que substitui o contato individual com o Select.",
  [("Formato fixo", "Mesma cadência e mesmo formato; o conteúdo varia.", V7),
   ("Para todos", "Comunicado do mês e encontro trimestral.", "FO-11"),
   ("Premium e Elite", "Mentoria mensal e eventos e formações.", "FO-12")],
  [], ["Nada muda neste nível; as mudanças estão nos quatro rituais abaixo."])

R("P-82",
  "Uma mensagem por mês para todos os parceiros, sempre no mesmo formato: novidades, resultados do programa, oportunidades e agenda.",
  "Para o Select, é o contato regular da Wise. Também é o lugar de reconhecer quem se destacou e de avisar mudanças de regra.",
  [("Uma por mês", "No início do mês.", V7),
   ("Formato", "Novidades, resultados do programa, oportunidades e agenda.", V7),
   ("Rascunho pronto", "O portal prepara o rascunho com os números do mês; o Gerente revisa.", V7),
   ("O que mais entra", "Mudanças de regra (2.5), novos parceiros do mês e reconhecimentos (8.4).", RV),
   ("Canal principal", "E-mail para todos; no grupo de WhatsApp, só para Premium e Elite. Enviar a mesma mensagem à mão em centenas de grupos não cabe na agenda.", "Proposta da revisão; você citou o e-mail do mês no FO-11")],
  ["Recebia entradas copiadas do processo de cima.",
   "Com um grupo por parceiro, publicar no WhatsApp significa enviar a mesma mensagem em cada grupo, à mão."],
  ["Entradas corrigidas: mudança de regra (2.5) e reconhecimentos (8.4).", "E-mail como canal principal.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Início do mês
        t1 a G Preparar o rascunho com os números do mês
        t2 t G Completar com novidades, mudanças de regra, novos parceiros e reconhecimentos
        t3 a G Enviar por e-mail a todos os parceiros
        t4 w G Publicar nos grupos de Premium e Elite
        f1 f G Comunicado do mês publicado"""),
  entradas=[],
  desc="Uma mensagem por mês, no mesmo formato: novidades, resultados do programa, oportunidades, agenda, mudanças de regra, novos parceiros e reconhecimentos. Vai por e-mail a todos e pelo grupo de WhatsApp aos parceiros Premium e Elite.",
  portal="prepara o rascunho com os números do mês e envia o e-mail.")
LIGA("P-13", "Mudança de regra avisada", "P-82"); LIGA("P-51", "Reconhecimentos do período", "P-82")

R("P-83",
  "Um encontro por trimestre, aberto a todos os parceiros, com casos, reconhecimento e uma mensagem do Diretor.",
  "Para o Select, é o contato do trimestre com a Wise, no lugar da reunião individual. Para todos, é onde se vê que há mais gente indicando e ganhando, o que puxa quem está parado.",
  [("Para todos", "Todos os parceiros são convidados.", "FO-11"),
   ("Abertura", "Mensagem gravada do Igor, como voz do programa.", V7),
   ("Conteúdo", "Casos de parceiros, resultados do trimestre e reconhecimento.", V7),
   ("Formato", "Online, para caber qualquer número de parceiros, e gravado para quem não foi.", RV),
   ("Presença", "A presença é registrada.", V7)],
  ["Não tinha passo a passo.", "Não dizia o formato. Com centenas de parceiros de várias regiões, só online comporta.",
   "O gatilho era o fechamento trimestral, mas o encontro usa os resultados do fechamento: acontece depois dele."],
  ["Gatilho corrigido: trimestre fechado.", "Formato online e gravado.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Trimestre fechado
        t1 a G Agendar o encontro e convidar todos os parceiros
        t2 t D Gravar a mensagem de abertura
        t3 t G Escolher os casos e os reconhecimentos do trimestre
        t4 t G Conduzir o encontro online
        t5 a G Registrar a presença
        t6 a G Enviar a gravação e o resumo a todos os parceiros
        f1 f G Encontro trimestral realizado"""),
  entradas=[], gatilho="Trimestre fechado",
  desc="Encontro online de todos os parceiros, com casos, resultados do trimestre e reconhecimento, aberto por uma mensagem gravada do Igor como voz do programa. A gravação e o resumo vão para quem não foi.",
  portal="agenda, convida, lembra o Igor de gravar a mensagem, registra a presença e envia a gravação.")
LIGA("P-12", "Trimestre fechado", "P-83"); LIGA("P-51", "Reconhecimentos do período", "P-83")

R("P-84",
  "Todo mês, convidar os clientes dos parceiros Premium e Elite para a mentoria aberta da Wise.",
  "Dá ao parceiro Premium algo recorrente para oferecer à base dele, e põe a Wise na frente de empresas do perfil uma vez por mês.",
  [("Para quem", "Carteiras dos parceiros Premium e Elite.", "FO-12"),
   ("Ritmo", "Mensal, no calendário da mentoria da Wise.", V7),
   ("Convite", "O portal envia o convite ao parceiro, que repassa à base.", V7),
   ("Origem protegida", "O convite leva o link do parceiro. Cliente que chega pela mentoria conta como vindo dele.", RV)],
  ["Entradas copiadas do processo de cima.", "Não dizia se o cliente que chega pela mentoria conta como indicação do parceiro."],
  ["Regra nova: o convite leva o link do parceiro.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Calendário mensal da mentoria
        t1 a G Enviar o convite aos parceiros Premium e Elite, com o link de cada um
        t2 t P Repassar o convite à própria base
        t3 a G Registrar os clientes de cada parceiro que participaram
        f1 f G Mentoria do mês aberta à carteira dos parceiros"""),
  entradas=[])

R("P-85",
  "Quando a Wise tem um evento ou uma formação, abrir vagas para os parceiros Premium e Elite.",
  "É reconhecimento por acesso: o parceiro entra onde só gente da Wise entra. Custa pouco e vale muito para a relação.",
  [("Para quem", "Premium e Elite, e parceiros em destaque.", "FO-12 e v7"),
   ("Convite", "Pelo portal, a partir do calendário; a presença é registrada.", V7)],
  ["Entradas copiadas do processo de cima."],
  ["Entradas corrigidas.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Evento ou formação da Wise agendado
        t1 s G Escolher quem convidar entre Premium, Elite e destaques
        t2 a G Enviar os convites
        t3 a G Registrar a presença
        f1 f G Parceiros convidados e presença registrada"""),
  entradas=[], gatilho="Evento ou formação da Wise agendado")

R("P-50",
  "Registrar e mostrar quem pediu ajuda e quem ajudou, e agradecer em público a quem deu.",
  "A maior parte da ajuda nasce de um pedido. Quando o dar aparece, mais gente dá; quando só aparece a comissão, a relação vira mercado.",
  [("O que se registra", "Pedidos e contribuições entre parceiros, favores de cinco minutos e o agradecimento público.", V7),
   ("O parceiro não vê placar", "O equilíbrio entre dar e receber é leitura interna; na comunidade aparece só o dar.", V7),
   ("Onde acontece", "Entre parceiros Premium e Elite, que se conhecem pelas apresentações e pelos encontros. Para o Select, o agradecimento público é no comunicado e no encontro trimestral.", RV)],
  ["Foi desenhado para um ecossistema pequeno, em que os parceiros se conhecem. Com centenas de Select, muitos concorrentes entre si, pedidos abertos entre todos não funcionam do mesmo jeito.",
   "Não tinha passo a passo."],
  ["Regra nova de onde acontece, por nível.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Pedido ou contribuição de um parceiro
        t1 s G Registrar o pedido ou a contribuição
        t2 w G Agradecer em público a quem contribuiu
        t3 a G Contar a contribuição no equilíbrio de dar e receber
        f1 f G Dar registrado e reconhecido"""))

R("P-51",
  "Todo mês e todo trimestre, escolher quem merece destaque e reconhecer com algo que não é dinheiro.",
  "Reconhecimento público custa quase nada e é o que os parceiros mais comentam. Também mostra aos outros qual comportamento a Wise valoriza.",
  [("Formas", "Destaque público, acesso antecipado a pedidos da Prateleira, convite a palco e apresentação a pessoas.", V7),
   ("Quem", "O portal sugere a partir do cubo e do ranking; o Gerente decide.", V7),
   ("Por nível", "Para o Select, destaque no comunicado e no encontro trimestral. Acesso antecipado à Prateleira só faz sentido para Premium e Elite.", RV),
   ("Onde aparece", "No comunicado do mês (8.2.1) e no encontro trimestral (8.2.2).", RV)],
  ["Não dizia para onde vai o reconhecimento: o comunicado e o encontro, que são onde ele acontece, não o recebiam.", "Uma das formas (acesso antecipado à Prateleira) não se aplica ao Select."],
  ["Entregas novas: reconhecimentos para 8.2.1 e 8.2.2.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento do mês ou do trimestre
        t1 a G Sugerir quem reconhecer pelo cubo e pelo ranking
        t2 t G Escolher os reconhecidos e a forma de reconhecer
        t3 s G Registrar o reconhecimento
        f1 f G Reconhecimentos definidos para o comunicado e o encontro"""))

R("P-52",
  "Quando um parceiro Premium ou Elite menciona um problema ou uma oportunidade que outro parceiro resolve, a Wise apresenta os dois.",
  "A Wise como ponte entre parceiros. Cada boa apresentação é valor devolvido sem custo, e amarra os dois ao ecossistema.",
  [("Benefício de Premium e Elite", "Apresentações a outros parceiros entram a partir do Premium.", "FO-12"),
   ("Sem esperar pedido", "A Wise toma a iniciativa.", V7),
   ("Em torno de uma oportunidade", "Nunca a lista inteira de contatos.", V7),
   ("Com o aceite dos dois", "A Wise confirma com os dois lados antes de apresentar.", V7),
   ("Retorno", "A Wise pergunta aos dois como foi e registra.", V7)],
  ["Sem achados no passo a passo, que já estava validado."], ["Nada muda."])

R("P-53",
  "Encontros presenciais de seis a dez pessoas, sem pauta de venda, juntando parceiros, clientes da Wise e gente que o parceiro quer conhecer.",
  "Relação forte se faz em mesa pequena. É o gesto de maior valor para os parceiros mais importantes e não escala, por isso é para poucos.",
  [("Tamanho", "Seis a dez pessoas.", V7),
   ("Âncora", "Um convidado âncora atrai os demais.", V7),
   ("Sem venda", "Nenhuma pauta de venda.", V7),
   ("Quando", "Uma vez por trimestre ou dentro de feiras e eventos do setor.", V7),
   ("Quem é convidado", "Parceiros Premium e Elite, e Select com Potencial alto, a critério do Gerente.", RV),
   ("Entidades", "As entidades da Parceria Institucional ajudam a convidar.", V7)],
  ["Não dizia quem, entre centenas de parceiros, é convidado."],
  ["Regra nova de quem é convidado. O passo a passo, já validado, não muda."],
  desc="Encontros presenciais de seis a dez pessoas, com um convidado âncora que atrai os demais, misturando parceiros Premium e Elite (e Select com Potencial alto), clientes do grupo e gente que o parceiro quer conhecer, sem pauta de venda; também dentro de feiras e eventos do setor. As entidades da Parceria Institucional atuam como conectoras e convidam.")

# ================================================================ 9 Reter ou encerrar a parceria
R("P-54",
  "O que fazer quando um parceiro ativado esfria, entra em risco, descumpre o combinado ou quer sair: tentar retomar e, se não der, encerrar com respeito.",
  "Perder um parceiro que já indicou custa mais do que conquistar outro. E, quando a parceria acaba, o jeito de acabar decide se ele fala bem ou mal da Wise.",
  [("Primeiro retomar", "Cada tipo de risco tem a própria abordagem (9.1).", V7),
   ("Desligamento", "O Gerente decide; o Diretor assina o aviso formal de 30 dias (9.2).", V7),
   ("Saída a pedido", "Com aviso de 30 dias e registro do motivo (9.3).", V7),
   ("Sem descida de nível", "O nível não é rebaixado; a recomendação pode ser suspensa em silêncio (10.3).", "FO-12"),
   ("Select parado não é desligado", "Parceiro que nunca ativou fica adormecido (ver a pergunta em 5.4), sem aviso formal nem assinatura do Diretor.", RV),
   ("Quando desligar", "Quando a abordagem do tipo não dá resultado e o parceiro consome atenção; ou quando há descumprimento do termo ou dano a um cliente.", RV)],
  ["O fluxo do macroprocesso repetia, passo por passo, o que os filhos 9.1 e 9.2 fazem. Pelo método, o pai mostra os filhos como blocos e não repete o conteúdo deles.",
   "O gatilho era só a mudança de tipo no cubo. Descumprimento do termo e pedido de saída também começam este caminho.",
   "Com centenas de Select, desligar formalmente cada um que não ativa, com assinatura do Diretor, não faz sentido."],
  ["Passo a passo refeito com os três filhos como blocos e os três jeitos de começar.", "O detalhe de cada abordagem foi para 9.1 e o do desligamento para 9.2."],
  FL("""i1 i G Parceiro entra num tipo de risco
        i2 i G Descumprimento do termo ou dano a um cliente
        i3 i P Parceiro pede para sair
        s1 sub G P-55
        g1 d G O parceiro foi retomado?
        s2 sub G P-56
        g2 d G A parceria foi encerrada?
        s3 sub G P-57
        f1 f G Parceiro retomado
        f2 f G Parceria encerrada pela Wise
        f3 f G Parceiro mantido em observação
        f4 f G Parceria encerrada a pedido""",
     "i1>s1>g1; g1:Sim>f1; g1:Não>s2; i2>s2; s2>g2; g2:Sim>f2; g2:Não>f3; i3>s3>f4"),
  participantes=[DIR, RESP_P], gatilho="Parceiro entra em tipo de risco, descumpre o termo ou pede para sair")

R("P-55",
  "Para cada tipo de risco, uma abordagem diferente, com 30 dias para ver se o parceiro volta a ter ritmo.",
  "Parceiros esfriam por motivos diferentes. Chegar com cobrança a quem está insatisfeito, ou com conversa a quem só precisa de uma oportunidade, piora.",
  [("Âncora esfriando", "Chegar com uma oportunidade pronta.", V7),
   ("Valioso em risco", "Ouvir primeiro e decidir em 15 dias se vale.", V7),
   ("Cordial seletivo", "Recrutar de novo, com um foco único.", V7),
   ("Desertor", "Decidir, sem insistir.", V7),
   ("Prazo", "30 dias para o Ritmo voltar a ser alto; senão, o portal sugere o desligamento.", V7)],
  ["O passo a passo estava só no macroprocesso de cima."],
  ["Passo a passo trazido para cá, sem mudar o conteúdo."],
  FL("""i1 i G Parceiro entra num tipo de risco
        t0 a G Mostrar o tipo, a abordagem e a mensagem sugerida
        g1 d G Qual é o tipo?
        t1 w G Levar uma oportunidade pronta ao parceiro
        t2 w G Ouvir o parceiro e decidir em 15 dias se vale
        t3 w G Recrutar de novo com um foco único
        e1 et G 30 dias
        g2 d G O Ritmo voltou a ser alto?
        f1 f G Parceiro retomado
        f2 f G Desligamento sugerido""",
     "i1>t0>g1; g1:Âncora esfriando>t1>e1; g1:Valioso em risco>t2>e1; g1:Cordial seletivo>t3>e1; g1:Desertor>f2; e1>g2; g2:Sim>f1; g2:Não>f2"))

R("P-56",
  "Encerrar a parceria por decisão da Wise, com aviso formal de 30 dias, em conversa e por escrito.",
  "Um desligamento mal feito vira ruído no mercado. O aviso formal, a conversa e o prazo mostram respeito e protegem a Wise.",
  [("Quem decide", "O Gerente decide; o Diretor assina o aviso formal.", V7),
   ("Aviso", "30 dias, entregue em conversa e por escrito.", V7),
   ("Na data", "Acessos revogados; comissões já geradas continuam sendo pagas.", "v7 e página dos parceiros"),
   ("O link do parceiro", "Deixa de aceitar novos cadastros na data; os clientes que já entraram continuam atendidos pela Wise e com o Hub.", RV),
   ("Depois", "O ex-parceiro fica na lista de contato, duas a três vezes por ano.", V7),
   ("Oportunidades em andamento", "Não está dito o que acontece com as oportunidades abertas na data do encerramento. Pergunta abaixo.", "Em aberto")],
  ["O passo a passo estava só no macroprocesso de cima.", "Não dizia o que acontece com o link do parceiro e com os clientes que já entraram por ele.", "Não dizia o que acontece com as oportunidades abertas."],
  ["Passo a passo trazido para cá, com o fechamento do link.", "Gatilho ampliado: também começa por descumprimento do termo."],
  FL("""i1 i G Desligamento sugerido, descumprimento do termo ou dano a um cliente
        t1 t G Decidir o desligamento com o motivo
        g1 d G Desligar?
        t2 t D Assinar o aviso formal
        t3 w G Comunicar o encerramento em conversa e por escrito
        e1 et G 30 dias de aviso
        t4 a G Encerrar a parceria, revogar os acessos e fechar o link
        t5 s G Pôr o ex-parceiro na lista de contato anual
        f1 f G Parceiro mantido em observação
        f2 f G Parceria encerrada""", "i1>t1>g1; g1:Não>f1; g1:Sim>t2>t3>e1>t4>t5>f2"),
  gatilho="Desligamento sugerido, descumprimento do termo ou dano a um cliente")
ABERTA("saida_oportunidades", "P-56", "Quando a parceria acaba, o que acontece com as oportunidades do parceiro que ainda estão em negociação?",
       ["A página dos parceiros diz: 'Comissões já geradas continuam sendo pagas'. Uma oportunidade em negociação ainda não gerou comissão, mas a origem dela está protegida por 180 dias.",
        "Vale para o desligamento (9.2) e para a saída a pedido (9.3)."],
       ["A proteção de 180 dias continua valendo: se o cliente fechar dentro do prazo, a comissão é paga", "Só recebe o que já estava fechado na data do encerramento",
        "Continua valendo na saída a pedido; no desligamento por descumprimento do termo, não"],
       "A terceira. Quem sai em paz mantém o que plantou; quem descumpriu o combinado, não.")

R("P-57",
  "Quando o parceiro pede para sair: entender o motivo, cumprir os 30 dias e fechar sem atrito.",
  "O motivo de quem sai é a informação mais barata para melhorar o programa. E quem sai bem tratado pode voltar ou indicar.",
  [("Qualquer lado pode sair", "Com aviso de 30 dias, sem multa.", "v7 e página dos parceiros"),
   ("Motivo registrado", "Para aprender.", V7),
   ("Comissões", "As já geradas continuam sendo pagas.", "Página dos parceiros"),
   ("Depois", "O ex-parceiro fica na lista de contato anual.", V7)],
  ["Não tinha passo a passo."],
  ["Passo a passo escrito (não existia)."],
  FL("""i1 i P Parceiro pede para sair
        t1 w G Conversar para entender o motivo
        t2 s G Registrar o pedido e o motivo
        e1 et G 30 dias de aviso
        t3 a G Encerrar a parceria, revogar os acessos e fechar o link
        t4 s G Pôr o ex-parceiro na lista de contato anual
        f1 f G Parceria encerrada de forma amigável"""),
  participantes=[RESP_P])

# ================================================================ 10 Manter a Prateleira de fornecedores
R("P-58",
  "Manter a lista de parceiros que a Wise recomenda aos próprios clientes, por categoria, com ficha conferida.",
  "A Prateleira é a confiança da Wise emprestada. Um parceiro ruim recomendado custa o cliente; por isso só entra quem passou pelo Premium e só fica quem mantém a qualidade.",
  [("Quem entra", "Parceiros Premium e Elite.", "FO-11"),
   ("Sem limite por categoria", "Vários parceiros podem estar na mesma categoria.", V7),
   ("Permanência", "Pela nota de qualidade e pelo retorno dos clientes, revista a cada trimestre.", V7),
   ("Suspensão silenciosa", "Problema sério suspende a recomendação sem avisar o parceiro e sem rebaixar o nível.", "FO-12")],
  ["A suspensão da recomendação acontecia dentro da revisão trimestral. Um problema sério com um cliente não pode esperar o fim do trimestre."],
  ["Processo novo 10.3 para suspender a recomendação no dia do problema."])

R("P-86",
  "Antes de um parceiro aparecer na Prateleira, conferir os dados, os casos e a apresentação de vendas dele.",
  "É a última barreira antes de a Wise pôr o nome dela ao lado do parceiro diante de um cliente.",
  [("Quando", "Na subida ao Premium e sempre que a ficha muda.", "FO-12 e v7"),
   ("O que se confere", "Dados da empresa, categorias, casos e apresentação de vendas.", V7),
   ("Quem", "O Gerente.", V7)],
  ["O gatilho era 'parceiro assinado', do tempo em que todo parceiro entrava na Prateleira.", "Não tinha passo a passo."],
  ["Gatilho corrigido: subida ao Premium ou ficha alterada.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Ficha para conferência ou ficha alterada
        t1 s G Conferir os dados, as categorias e os casos
        t2 s G Conferir a apresentação de vendas
        g1 d G A ficha está completa e correta?
        t3 w G Pedir a correção ao parceiro
        t4 s G Publicar a ficha na Prateleira
        f1 f G Ficha publicada""", "i1>t1>t2>g1; g1:Não>t3>t1; g1:Sim>t4>f1"),
  gatilho="Parceiro sobe para Premium ou ficha alterada")

R("P-87",
  "A cada trimestre, ver a nota de qualidade e o retorno dos clientes de cada parceiro recomendado e decidir quem continua.",
  "Mantém a Prateleira confiável ao longo do tempo: a entrada foi conferida uma vez, mas a qualidade muda.",
  [("Quando", "No fechamento trimestral.", V7),
   ("Critério", "Nota de qualidade e retorno dos clientes, inclusive a pergunta de 30 dias de 6.5.", "v7; a pergunta de 30 dias é proposta da revisão"),
   ("Quem sai", "Sai da Prateleira sem rebaixar o nível e sem aviso.", "FO-12"),
   ("Suspensões", "As recomendações suspensas (10.3) são revistas aqui.", RV)],
  ["Misturava dois casos: a revisão do trimestre e a suspensão por problema sério, que acontece a qualquer momento.", "Não tinha passo a passo."],
  ["A suspensão por problema sério foi para 10.3.", "Passo a passo escrito (não existia)."],
  FL("""i1 it G Fechamento trimestral
        t1 a G Calcular a nota de qualidade de cada parceiro recomendado
        t2 a G Sinalizar quem está abaixo
        t3 t G Decidir quem continua, quem sai e quais suspensões são revistas
        t4 s G Registrar a decisão
        f1 f G Prateleira revista"""),
  desc="A cada trimestre, quem fica e quem sai da Prateleira, pela nota de qualidade e pelo retorno dos clientes; as recomendações suspensas são revistas. Quem sai não é avisado nem rebaixado.",
  portal="calcula a nota, sinaliza quem está abaixo e registra a decisão.")

R(P99,
  "Quando um cliente da Wise tem um problema sério com um parceiro recomendado, parar de recomendá-lo, sem avisar o parceiro e sem mexer no nível dele.",
  "Você decidiu que o nível nunca desce, porque rebaixar faria o parceiro parar de indicar a Wise. A proteção do cliente fica então nesta regra, e ela precisa valer no dia do problema, não no fim do trimestre.",
  [("Sem aviso e sem rebaixar", "O parceiro continua com o nível e os outros benefícios.", "FO-12"),
   ("Marca interna", "A suspensão é uma marca interna no portal; o parceiro some das listas de recomendação.", "FO-12"),
   ("O parceiro não é ouvido sobre o caso", "Sua resposta diz que a Wise simplesmente deixa de recomendar. O passo a passo não inclui conversa com o parceiro.", "FO-12"),
   ("Quem decide", "O Gerente, depois de ouvir o consultor e o cliente; o Diretor fica sabendo na conversa da semana.", RV),
   ("Revisão", "A pergunta abaixo decide se a suspensão pode ser desfeita.", "Em aberto")],
  ["A suspensão estava escondida dentro da revisão trimestral (10.2). É um caso diferente (cada problema, não cada trimestre), então pede processo próprio.",
   "Não dizia quem decide nem o que conta como problema sério."],
  ["Processo novo."],
  FL("""i1 i S Consultor relata problema de um cliente com um parceiro recomendado
        t1 t G Ouvir o consultor e o cliente
        g1 d G O problema é sério?
        t2 s G Registrar o problema na ficha do parceiro
        t3 s G Marcar a recomendação como suspensa
        t4 t G Levar o caso à conversa da semana com o Diretor
        f1 f G Problema registrado, recomendação mantida
        f2 f G Recomendação suspensa""", "i1>t1>g1; g1:Não>t2>f1; g1:Sim>t3>t4>f2"),
  participantes=[CONSUL, DIR], gatilho="Cliente da Wise relata problema com um parceiro recomendado", cliente="Clientes da Wise", frequencia="Quando acontece",
  desc="Quando um cliente da Wise relata um problema sério com um parceiro recomendado, o Gerente ouve o consultor e o cliente e, se o problema for sério, suspende a recomendação: o parceiro some das listas de recomendação, sem aviso e sem rebaixar o nível.",
  portal="guarda a marca interna de recomendação suspensa e tira o parceiro das listas de recomendação.")
LIGA(P99, "Recomendação suspensa", "P-35"); LIGA(P99, "Suspensões a rever", "P-87"); LIGA(P99, "Caso para a conversa da semana", "P-10")
ABERTA("suspensao_revisao", P99, "A recomendação suspensa de um parceiro pode voltar?",
       ["A suspensão é silenciosa: o parceiro não sabe. Se ela for definitiva, um problema pontual tira o parceiro das recomendações para sempre; se for revista, alguém precisa decidir com que critério."],
       ["É revista a cada fechamento trimestral: volta se o cliente disser que foi resolvido e não houver novo problema", "É definitiva", "Só volta por decisão do Igor, caso a caso"],
       "A primeira. Dá uma saída para problemas pontuais sem criar trabalho novo: a revisão já acontece no trimestre.")

# ================================================================ 11 Equipar o parceiro para indicar
R("P-59",
  "Manter atualizado tudo o que o parceiro usa para indicar: minicurso, kit de vendas, simulador de ganho, perfil do cliente ideal e a página do cliente.",
  "O parceiro indica bem quando sabe para quem, o que dizer e quanto ganha, e quando acha tudo sozinho no portal, sem pedir nada ao Gerente.",
  [("Autoatendimento", "Tudo fica na área do parceiro.", V7),
   ("Quem produz", "O Igor grava e revisa os vídeos; o Gerente mantém atualizado.", "FO-11"),
   ("Uma oferta ou três", "O kit hoje cobre as três empresas do grupo; a pergunta em 1.4.2 decide se continua assim.", "Em aberto")],
  ["As entregas iam para o antigo 5.2 Ensinar o parceiro a indicar, que saiu."],
  ["As entregas passam a ir para 5.2 Conduzir o onboarding."])
LIGA("P-59", "Parceiro equipado", "P-94")

R("P-88",
  "Produzir e manter atualizado o minicurso de como vender a Wise e o certificado que o parceiro recebe.",
  "O minicurso ensina o parceiro a indicar sem depender do tempo do Gerente. Se fica desatualizado, o parceiro promete ao cliente o que a Wise não entrega mais.",
  [("Quem grava", "O Igor.", "FO-11"),
   ("Quem revisa", "O próprio Igor; não há outra revisão.", "FO-11"),
   ("Quem atualiza", "O Gerente.", "FO-11"),
   ("Conteúdo", "Perfil do cliente ideal, frases que reconhecem a dor, como oferecer a consultoria gratuita e como indicar pelo link.", "FO-11 e v7"),
   ("Certificado", "Vale desde o Select; o momento da emissão está na pergunta de 5.1.", "FO-12; em aberto"),
   ("Trilhas por empresa", "As trilhas da Tríade e da Swallow dependem da pergunta de 1.4.2.", "Em aberto")],
  ["Não tinha passo a passo.", "O gatilho 'material novo' não dizia quando o minicurso precisa ser revisto: quando a oferta, a comissão ou a página mudam.",
   "O nome falava em trilhas e certificação; o que existe hoje, e o que a página promete, é o minicurso."],
  ["Nome novo: Manter o minicurso e o certificado.", "Gatilho corrigido.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança na oferta, na regra de comissão ou na página
        t1 t G Listar o que precisa mudar no minicurso
        t2 t D Gravar ou regravar o trecho
        t3 s G Publicar na área do parceiro
        t4 a G Avisar os parceiros da atualização
        f1 f G Minicurso atualizado"""),
  nome="Manter o minicurso e o certificado", gatilho="Mudança na oferta, na regra de comissão ou na página", participantes=[DIR])
LIGA("P-88", "Minicurso publicado", "P-94")

R("P-89",
  "Manter o material de vendas que o parceiro usa e a calculadora que mostra quanto ele ganha por indicação.",
  "O simulador responde à primeira pergunta de todo parceiro: quanto eu ganho? O kit evita que cada parceiro invente a própria apresentação da Wise.",
  [("Kit", "Material de vendas por empresa do grupo.", V7),
   ("Arte do anúncio conjunto", "A arte e o texto que o parceiro usa para anunciar a parceria ficam no kit.", RV),
   ("Simulador", "Calcula pela regra única de comissão.", V7),
   ("Atualização", "Sempre que o material ou a regra muda.", V7)],
  ["A arte do anúncio conjunto, que o onboarding pede ao parceiro, não tinha lugar definido.", "Não recebia a regra de comissão, de que o simulador depende.", "Não tinha passo a passo."],
  ["O kit passa a ter a arte do anúncio conjunto.", "Entrada nova: regra de comissão vigente (1.4.2).", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Material ou regra de comissão nova
        t1 s G Atualizar o material de vendas e a arte do anúncio conjunto
        t2 a G Recalcular o simulador pela regra vigente
        f1 f G Kit e simulador atualizados"""))
LIGA("P-89", "Kit e simulador atualizados", "P-94"); LIGA("P-62", "Regra de comissão vigente", "P-89")

R("P-90",
  "Manter a página que diz ao parceiro quem é o cliente certo para a Wise e o que esse cliente costuma dizer quando precisa de ajuda.",
  "O parceiro não é vendedor da Wise. Ele precisa reconhecer a dor na conversa com o cliente dele; as frases são o atalho para isso.",
  [("Perfil", "Empresa com mais de 3 vendedores, como na triagem da página do cliente.", "FO-10"),
   ("Frases", "O que o cliente diz quando precisa de gestão comercial.", V7),
   ("Onde aparece", "Na área do parceiro e dentro do minicurso.", "v7 e FO-11"),
   ("Um perfil só", "O perfil mostrado ao parceiro é o mesmo da triagem da página do cliente; quando um muda, o outro muda junto.", RV)],
  ["O perfil mostrado ao parceiro e a regra de triagem da página do cliente não tinham ligação: um poderia mudar sem o outro, e o parceiro mandaria clientes que a página barra.", "Não tinha passo a passo."],
  ["Regra nova: perfil e triagem andam juntos.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança de oferta ou da regra do ICP
        t1 s G Atualizar o perfil do cliente ideal e as frases
        t2 s G Conferir se o perfil bate com a triagem da página do cliente
        f1 f G Perfil e frases atualizados"""),
  gatilho="Mudança de oferta ou da regra do ICP")
LIGA("P-90", "Perfil e frases atualizados", "P-88")

R("P-96",
  "Manter no ar a página que o cliente do parceiro vê e a mensagem pronta que o parceiro envia.",
  "É a vitrine da oferta para o cliente final. Qualquer erro aqui (vídeo errado, agenda fora do ar, regra do ICP desatualizada) derruba a porta principal do programa.",
  [("O que tem", "As duas marcas, vídeo da Wise, cadastro de qualificação, agenda, autodiagnóstico e a mensagem pronta.", "FO-10"),
   ("Texto genérico", "A página serve a qualquer tipo de sistema, não só CRM.", "Pedido seu, em novembro"),
   ("Quem grava", "O Igor grava o vídeo; o roteiro está pronto, em formato quadrado.", "Conversa de novembro"),
   ("Quem administra", "O Gerente, em Configurações: publicação, vídeo, agenda, link do Hub e regra do ICP.", "FO-11"),
   ("Conferência", "Depois de cada mudança, o Gerente testa o caminho inteiro com um cadastro de teste.", RV)],
  ["Não tinha passo a passo.", "Não previa conferir a página depois de mexer nela."],
  ["Passo novo: testar o caminho inteiro depois de cada mudança.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Mudança na oferta, no vídeo, na agenda ou na regra do ICP
        t1 s G Atualizar a configuração da página do cliente
        t2 s G Atualizar a mensagem pronta
        t3 t G Testar o caminho inteiro com um cadastro de teste
        f1 f G Página do cliente e kit de convite no ar"""),
  gatilho="Mudança na oferta, no vídeo, na agenda ou na regra do ICP", situacao="em_implantacao",
  hoje="No ar. Configurações tem a aba 'Landing page dos clientes', com publicação, vídeo, formato, agenda, link do Hub e regra do ICP. O vídeo do cliente ainda vai ser gravado pelo Igor.")
LIGA("P-90", "Perfil e frases atualizados", "P-96")

# ================================================================ 12 Operar o portal no centro da gestão
R("P-60",
  "Cuidar do próprio portal: as regras que rodam sozinhas, os dados, a privacidade e quem tem acesso.",
  "O programa inteiro depende de o portal registrar, calcular e avisar certo. Se ele erra uma comissão ou vaza um dado, a confiança dos parceiros vai junto.",
  [("Primeiro à mão", "Cada regra é feita à mão e entendida antes de ser automatizada.", V7),
   ("Só dados de empresa", "O portal não guarda dados pessoais além do contato de trabalho.", V7),
   ("Domínio", "partners.wisemakers.com.br, para o portal e as duas páginas.", "FO-11"),
   ("Quem administra", "Quem tem acesso de administrador; o responsável é o Gerente.", "FO-11")],
  ["O gatilho juntava quatro casos diferentes; cada filho tem o seu."], ["Nada muda neste nível."])

R("P-91",
  "Criar, ajustar e conferir as regras que o portal executa sozinho: avisos, lembretes, cálculos e mudanças de situação.",
  "É o que substitui o trabalho manual. Uma regra errada repete o erro para todos os parceiros de uma vez, por isso cada uma é testada à mão primeiro.",
  [("Regras que rodam", "Marcos, contato vencido, cubo, nível, risco e retorno ao parceiro; com a campanha, também fila sem contato, lembrete de etapa e ativação.", "v7, FO-11 e FO-12"),
   ("À mão primeiro", "Só se automatiza o que já se fez à mão e se entendeu.", V7),
   ("Teste", "Toda regra nova é conferida com casos reais antes de valer para todos.", RV)],
  ["Não tinha passo a passo.", "A lista de regras não tinha as três novas da campanha."],
  ["Lista de regras atualizada.", "Passo a passo escrito (não existia), com o teste em casos reais."],
  FL("""i1 i G Regra nova ou ajuste de regra
        t1 t G Aplicar a regra à mão em alguns casos
        t2 t G Escrever a regra: quando dispara e o que faz
        t3 s G Configurar a regra no portal
        t4 t G Conferir o resultado em casos reais
        g1 d G A regra fez o esperado?
        t5 a G Ligar a regra para todos
        f1 f G Regra rodando""", "i1>t1>t2>t3>t4>g1; g1:Não>t2; g1:Sim>t5>f1"),
  desc="Cada regra (marcos, contato vencido, cubo, nível, risco, retorno ao parceiro, fila sem contato, lembrete de etapa e ativação) roda sozinha; primeiro se faz à mão e se entende, depois se automatiza e se confere em casos reais.")

R("P-92",
  "Cuidar dos dados que parceiros e clientes entregam: cruzar carteiras só com consentimento, guardar só o necessário e atender quem pede para ver ou apagar os próprios dados.",
  "A LGPD obriga, e a confiança depende disso: o parceiro entrega a carteira dele e o cliente dele entrega dados da empresa.",
  [("Cruzamento", "Com consentimento, revelando só as coincidências; só dados de empresa.", V7),
   ("Resultado do cliente", "O parceiro só vê com autorização do cliente.", "FO-10"),
   ("Pesquisa", "Uso em pesquisa só com consentimento próprio e dados anonimizados.", "Textos de 07/11"),
   ("Pedido de quem se cadastrou", "Quem se cadastrou numa das páginas pode pedir para ver, corrigir ou apagar os dados; o Gerente atende dentro do prazo da lei, que o jurídico confirma.", "Proposta da revisão; a lei obriga"),
   ("Auditoria", "O portal registra quem acessou o quê.", V7)],
  ["O processo cobria só o cruzamento de carteiras. Com as duas páginas, o portal passou a guardar dados de candidatos e de clientes dos parceiros, e não havia caminho para o pedido de quem quer ver ou apagar os próprios dados.",
   "Não tinha passo a passo."],
  ["Segundo caso: pedido de quem se cadastrou.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Carteira recebida para cruzamento
        i2 i G Pedido de alguém sobre os próprios dados
        t1 s G Conferir o consentimento do parceiro
        t2 a G Cruzar as carteiras e guardar só as coincidências
        t3 s G Conferir quem pede e quais dados existem
        t4 s G Atender o pedido: mostrar, corrigir ou apagar
        t5 s G Registrar o atendimento
        f1 f G Coincidências guardadas com consentimento
        f2 f G Pedido atendido e registrado""", "i1>t1>t2>f1; i2>t3>t4>t5>f2"),
  gatilho="Carteira recebida ou pedido de alguém sobre os próprios dados",
  desc="Cruzamento com consentimento que revela só coincidências, só dados de empresa, auditoria de acesso, e o atendimento de quem pede para ver, corrigir ou apagar os dados que deixou numa das páginas.",
  portal="processa o cruzamento, guarda só as coincidências e registra cada pedido atendido.")

R("P-93",
  "Criar, ajustar e revogar o acesso de cada pessoa ao portal: time da Wise, Diretor e pessoas dos parceiros.",
  "Cada acesso a mais é um risco a mais. O portal guarda carteiras, comissões e dados de clientes; só deve ver cada coisa quem precisa.",
  [("Perfis", "Administrador, time de parcerias, Diretor só para leitura e parceiro.", "v7 e FO-06"),
   ("Parceiro", "A conta nasce na conversa de entrada, com senha provisória trocada no primeiro acesso.", "FO-11 e portal"),
   ("Mais de uma pessoa por parceiro", "O parceiro pode pedir acesso para colegas; o Gerente cria.", RV),
   ("Revogação", "No encerramento da parceria, os acessos são revogados na data.", V7),
   ("Versões do termo", "Passaram para 1.4.4 Manter o termo de adesão.", RV)],
  ["O processo juntava dois casos: versões de contrato e acessos. As versões do termo têm hoje processo próprio (1.4.4).", "Não tinha passo a passo."],
  ["Nome novo: Conceder e revogar acessos ao portal.", "As versões do termo saíram daqui.", "Passo a passo escrito (não existia)."],
  FL("""i1 i G Pessoa nova, mudança de função ou encerramento de parceria
        t1 s G Conferir o pedido e o perfil necessário
        g1 d G O que é preciso?
        t2 s G Criar o acesso com o perfil certo
        t3 s G Ajustar o perfil
        t4 s G Revogar o acesso
        f1 f G Acessos em ordem""", "i1>t1>g1; g1:Acesso novo>t2>f1; g1:Mudança>t3>f1; g1:Saída>t4>f1"),
  nome="Conceder e revogar acessos ao portal", gatilho="Pessoa nova, mudança de função ou encerramento de parceria",
  desc="Usuários e permissões do portal: criar o acesso com o perfil certo, ajustar quando a função muda e revogar na saída.",
  portal="controla os acessos e registra quem acessou o quê.")
