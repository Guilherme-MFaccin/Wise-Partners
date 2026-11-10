# Perguntas da Rodada 4 que vêm de Never Eat Alone (executado dentro de tobe9_perguntas.py)
B3 = "Never Eat Alone"

Q("ct_placar", B1, "O portal mede o equilíbrio entre o que cada parceiro dá e recebe, ou o programa dá primeiro sem manter placar?", "escolha",
  ["Manter o que aprovei: o equilíbrio entra na Relação do cubo e aparece na comunidade",
   "Meio-termo: o portal mede o equilíbrio só para a leitura interna do cubo, e o parceiro nunca vê placar; na comunidade aparece o dar, não a conta",
   "Seguir Never Eat Alone: tirar o equilíbrio do cubo; a Relação fica só com o pulso e o retorno mútuo"],
  ["CT:placar", "P:reciprocidade", "3.2.3"],
  ["Esta divergência é entre dois livros, e a sua aprovação da Rodada 3 ficou do lado de um deles. Give and Take mostra que a maior parte do dar nasce de um pedido explícito, que o dar visível faz os outros darem, e que quem só toma se reconhece pelo comportamento. Por isso o cubo mede o equilíbrio entre indicações enviadas e recebidas, e você aprovou.",
   "Never Eat Alone diz o contrário na superfície: é melhor dar antes de receber, e nunca manter placar. A moeda da rede é a generosidade, não a ganância. Mas o mesmo livro, quando fala de trocar redes com outra pessoa, pede que os dois sejam parceiros iguais, que dão tanto quanto recebem.",
   "A conciliação entre os dois está em quem vê a conta. Give and Take quer o dar visível, não o saldo de cada um. Ferrazzi condena o placar como atitude com o outro, não a gestão do relacionamento."],
  "Medir por dentro e mostrar só o dar mantém a utilidade do dado para encontrar quem só toma, sem transformar a comunidade numa contabilidade de favores, que é a troca de norma social por norma de mercado que Business of Belonging também condena.",
  [VP(NE, 0, 1), VF(NE, 4, 4), VP(GT, 2), VP(GT, 6), VP(BB, 10)], "ct_placar", "Meio-termo")

Q("nea_cadencia", B3, "Do sistema de relacionamento de Never Eat Alone, o que entra na rotina do programa?", "multipla",
  ["Cadência de contato por importância: mensal para atenção alta, trimestral para os demais ativos, duas a três vezes por ano para candidatos e ex-parceiros",
   "Cada contato leva algo de valor (oportunidade, conteúdo ou apresentação), nunca só o \"como vai\"",
   "Retorno em até 24 horas depois de cada reunião com parceiro ou candidato",
   "Quem sai da parceria continua na lista, com contato duas a três vezes por ano",
   "As mensagens que o portal prepara sempre saem personalizadas por mim, nunca em massa"],
  ["7.6", "P:antes_de_precisar", "P:pessoa_a_pessoa"],
  ["Never Eat Alone é o 17º livro, o que faltava. É um livro de rede pessoal, não de programa de parceiros, então ele não confirma nem contraria os fatores do cubo. O que ele traz de novo é o método de manter relações vivas, e isso tinha uma lacuna no to-be: havia jogada por tipo, mas não havia o contato de rotina entre uma jogada e outra.",
   "O livro chama esse contato de ping e dá regras de bolso: um vínculo novo precisa ver o seu nome em três meios diferentes; depois, um contato por mês; para virar amigo, dois encontros fora do escritório; para manter um laço secundário, dois a três contatos por ano. Para as pessoas importantes, o autor prefere o contato que agrega valor. E diz que o retorno entre 12 e 24 horas depois de conhecer alguém já coloca você acima de 95% das pessoas.",
   "Ele também avisa contra a eficiência que mata a relação: o autor errou mandando cartões em massa e conclui que conectar não é jogo de números. No portal, isso vira o processo 7.6, Manter a cadência de contato com o parceiro: o portal lembra quem passou da cadência e sugere o que levar; o contato é seu."],
  "A cadência é a parte do relacionamento que não depende de oportunidade. É ela que impede o parceiro de esfriar entre uma indicação e outra, que é a causa do tipo Âncora esfriando.",
  [VF(NE, 2, 0), VF(NE, 2, 1), VF(NE, 2, 3), VF(NE, 2, 4), VF(NE, 2, 5), VP(NE, 8, 1)], "nea_cadencia")

Q("nea_ponte", B3, "Para a Wise ser a ponte entre os parceiros, o que você adota?", "multipla",
  ["Apresentar parceiros entre si sem esperar pedido, sempre em torno de uma oportunidade específica",
   "Avisar quem apresentou de como foi a conversa",
   "Encontro presencial pequeno (seis a dez pessoas) por trimestre, com um convidado âncora e sem pauta de venda",
   "Encontros dentro de feiras e eventos do setor, organizados pela Wise",
   "Usar as entidades da Parceria Institucional como conectoras, com o papel de convidar para os encontros"],
  ["8.5", "8.6", "P:ponte"],
  ["O segundo achado do livro é sobre poder na rede: ele vem de ser indispensável, e se torna indispensável quem faz a ponte, passando informação, contatos e boa vontade entre grupos que não se falam. O gesto-chave é não esperar pedido: quando alguém menciona um problema, pensar em quem resolve. E proteger a rede dos outros: nunca entregar a lista inteira, trocar contatos em torno de eventos ou causas específicas.",
   "O terceiro achado é reunir as pessoas. O autor organiza jantares de seis a dez pessoas, usa um convidado âncora para atrair quem não viria e cria encontros dentro de conferências. Quando não é aceito num clube, funda o seu.",
   "Isso reforça o que Give and Take e Business of Belonging já diziam e você aprovou na Rodada 3 (grupo geral, encontro trimestral), mas acrescenta o presencial, que o WhatsApp não substitui. O livro diz que os meios digitais são eficientes, mas fracos para criar relação."],
  "A Wise vale mais para o parceiro quando o conecta a quem ele não chegaria sozinho. Isso é valor antes da captura, o princípio de Keystone, feito de um jeito que custa poucas horas.",
  [VP(NE, 4), VP(NE, 4, 1), VF(NE, 3, 5), VP(NE, 9, 0), VF(NE, 5, 1), VF(NE, 5, 4)], "nea_ponte")
