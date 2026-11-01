# Perguntas da Rodada 3 (executado dentro de tobe3_base.py)
FO3 = []
def Q(chave, bloco, texto, tipo, opcoes, alvo, contexto, logica, cits, visual):
    ids = []
    for a in alvo:
        if a.startswith("F:"): ids.append(FT[a[2:]])
        elif a.startswith("P:"): ids.append(PR[a[2:]])
        else:
            k, _, campo = a.partition("|"); ids.append(P[k] + ("." + campo if campo else ""))
    FO3.append(add("perguntas", "Q", texto=texto, tipo=tipo, opcoes=opcoes, alvo=ids, para=["PE-01"], rodada=3, bloco=bloco, status="em_formulario",
                   formulario=None, respostas=[], chave=chave, contexto=contexto, logica=logica, citacoes=cits, visual=visual))
AP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"]

Q("principios", "Os princípios", "Você aprova estes 18 princípios, em quatro camadas, como a base que ordena toda a hierarquia de processos?", "escolha", AP,
  ["P:valor_antes", "P:ciclo", "P:ensinar", "P:norma_social", "P:reciprocidade", "P:comunidade", "P:medir", "P:fases"],
  ["Você pediu para refatorar todos os conceitos de uma vez. Juntei o que os 16 livros dizem em comum e separei em quatro camadas: por que o programa existe, como se organiza, como se relaciona e como se mede e evolui. Cada camada responde a uma pergunta diferente, e cada princípio aponta para os processos que o colocam em prática.",
   "Dez dos dezoito já estavam aprovados nas suas respostas: canal mais barato que os ativos, interação central, ocupar pouco, interface simples, portal no centro, atenção proporcional, só a exceção vira trabalho, primeiro valor em 90 dias, ritmos no lugar de quadros e governança com o Diretor só assinando.",
   "Os oito novos vêm dos livros da segunda pasta: criar valor antes de capturar (Keystone, Give and Take), fechar o ciclo e mostrar o impacto (Referral Engine, Give and Take, Business of Belonging), ensinar a indicar (Referral Engine), norma social antes de norma de mercado (Business of Belonging, Referral Engine), reciprocidade visível (Give and Take), comunidade com ritual (Business of Belonging), medir por fatores objetivos (Keystone, Customer Success) e crescer por fases (Keystone, Winning the Right Game)."],
  "Quando os princípios estão escritos e ordenados, cada decisão nova tem um critério para ser julgada. Um processo que não serve a nenhum princípio é candidato a sair, o que protege o programa da complexidade que você quer evitar.",
  [VP(KS, 1), VP(RE, 6), VP(BB, 10), VP(GT, 2), VP(CS, 1)], "principios")

Q("hap", "A nova arquitetura", "Você aprova a hierarquia v3: três macroprocessos de gestão (Arquitetar, Gerir por rituais, Medir e aprender), seis finalísticos (Atrair, Integrar, Gerar oportunidades, Desenvolver, Cultivar a comunidade, Reter ou encerrar) e três de suporte (Prateleira, Equipar o parceiro, Operar o portal no centro)?",
  "escolha", AP, ["M3", "M8"],
  ["Três mudanças em relação à v2. Medir e aprender virou macroprocesso, porque é ali que o portal calcula o CAC, o cubo de cada parceiro, o nível, a saúde do ecossistema e os portões. Cultivar a comunidade também virou macroprocesso, porque os livros novos mostram que a comunidade é onde o parceiro decide ficar e dar.",
   "No suporte, Dados e Portal viraram um só: Operar o portal no centro da gestão. É onde moram as regras que rodam sozinhas, os dados e a privacidade, os contratos e os acessos. O ecossistema interno saiu como processo, porque você decidiu que o lead vai direto ao closer, sem SLA, e isso virou uma atividade dentro de Gerar oportunidades.",
   "Cada processo agora diz o que o portal faz nele (registra, calcula, alerta, prepara mensagem, monta pauta). Ao todo são 12 macroprocessos, 54 processos e 24 subprocessos, com 13 fluxos detalhados."],
  "Com o portal descrito em cada processo, o web app fica no centro da gestão de forma concreta: dá para ver, processo a processo, o que é trabalho humano e o que é trabalho do sistema.",
  [VP(KS, 3), VP(CS, 10), F(PP, 7, 4)], "hap")

Q("cubo", "Fatores e tipos", "No lugar dos três fatores de saúde e dos oito tipos do livro, você aprova o cubo: Valor, Ritmo e Relação, cada um alto ou baixo, formando oito tipos por regra fixa, com o Potencial definindo só a atenção?",
  "escolha", AP, ["F:cubo", "3.2", "3.2|fluxo", "3.3", "P:medir", "3.2.1", "3.2.2", "3.2.3", "3.2.4"],
  ["Você desconfiou dos três fatores e pediu uma regra lógica que levasse aos oito tipos. Relemos o livro inteiro para isso. O próprio Strategic Alliances diz que a autoavaliação posiciona a parceria só de forma muito aproximada. Os oito tipos são perfis escolhidos entre 64 combinações de quatro níveis em três fatores: só 8 combinações batem exatamente com um perfil, e 22 empatam entre perfis. Nenhum corte alto ou baixo separa os oito. Ou seja, não é uma matriz, e a sua desconfiança procedia.",
   "A proposta mantém a ideia do livro (valor, cooperação, qualidade da relação), mas mede comportamentos que o portal registra e transforma tudo numa matriz de verdade. Valor: o que a relação já entregou em 12 meses, receita ganha mais pipeline ponderado. Ritmo: recência e frequência de ações de valor. Relação: o pulso trimestral, o retorno mútuo e o equilíbrio entre indicações enviadas e recebidas, a reciprocidade de Give and Take. Dois níveis em cada fator dão exatamente oito células, e cada célula é um tipo.",
   "A lógica RFV que você pediu está dentro do cubo: o Ritmo é a recência e a frequência, e o Valor é o V. A Relação acrescenta o que o RFV de clientes não vê, a tensão na relação. O Potencial (os 4 Cs de Nearbound: carteira, credibilidade, capacidade, compromisso) não muda o tipo, só decide se vale pôr mais horas."],
  "Com três fatores binários, qualquer pessoa explica a regra em um minuto, e cada tipo leva a uma ação. Os cortes (12 meses, 30 dias, 2 ações, índice 70) são provisórios e se calibram na primeira revisão trimestral com dados reais.",
  [FTC(6), FTC(7), FTC(4), VF(CS, 1, 1), VF(GT, 0, 0)], "cubo")

Q("tipos", "Fatores e tipos", "Você aprova a ação, a abordagem e a cadência de cada um dos oito tipos, inclusive para quem está em risco (Âncora esfriando, Valioso em risco, Cordial seletivo, Desertor)?",
  "escolha", AP, ["7.1", "9.1", "M9|fluxo"],
  ["Você pediu uma abordagem por tipo, como numa matriz RFV. A tabela da figura mostra o resumo. Embaixador: proteger e alavancar, com tom de sócio. Gerador sob tensão: diagnosticar em 7 dias o que tensiona (lead sem retorno, comissão percebida como injusta). Âncora esfriando: chegar com uma oportunidade pronta, sem cobrança. Valioso em risco: ouvir primeiro, por ligação, e decidir em 15 dias se vale. Promissor: buscar a primeira venda em 90 dias. Ativo sem tração: descobrir em 60 dias por que a atividade não vira receita. Cordial seletivo: recrutar de novo com foco único. Desertor: decidir, sem insistir.",
   "As ações vêm do que o Strategic Alliances recomenda para os perfis equivalentes: o catador de cerejas tratado como recrutamento novo, o desertor como decisão sobre se vale o esforço. A elas se somam Customer Success (todo sinal vira ação com dono e prazo) e Give and Take (julgar quem só toma pelo comportamento).",
   "No portal, a mudança de tipo cria a tarefa da jogada na sua fila, com a mensagem sugerida. A retenção deixa de ser um fluxo único e passa a seguir o tipo de cada parceiro."],
  "Abordar o parceiro pelo motivo real do afastamento economiza tempo e preserva a relação: quem esfriou por falta de oportunidade não precisa de cobrança, e quem nunca teve tração precisa de diagnóstico, não de convite.",
  [FTC(2), FTC(16), VP(CS, 2), VP(GT, 6)], "tipos")

Q("cac", "Modelo de negócio", "A métrica-mãe do programa passa a ser o CAC dos clientes vindos de parceiros, comparado ao CAC dos canais ativos. Quem informa o CAC dos canais ativos?", "escolha",
  ["Eu informo", "O financeiro informa", "O Igor informa", "Não sei: perguntar ao Igor"], ["F:metrica_mae", "1.5", "M3"],
  ["Você deixou claro o porquê do programa: parceria é um canal de aquisição de receita mais barato que os canais ativos, e a comissão só serve para baratear ainda mais o CAC. Se é esse o objetivo, ele precisa ser a primeira medida, não um resultado escondido entre outros.",
   "O portal já tem o que precisa para o lado do canal: comissões, horas registradas e custos diretos, divididos pelos clientes fechados vindos de parceiros. O Método Octo compara a relação entre critério e benefício à de CAC e LTV, e o Referral Engine manda medir fonte, conversão e custo por cliente.",
   "Falta o termo de comparação: o CAC dos canais ativos do grupo (prospecção, eventos, mídia). Só alguém fora do portal tem esse número."],
  "Uma métrica-mãe ligada ao motivo de existir do programa decide sozinha boa parte das discussões: o que não baixa o CAC nem aumenta a adesão não entra.",
  [D2("Q-0015"), F(PP, 3, 5), VP(RE, 8)], "cac")

Q("saude", "Fatores e tipos", "Além do cubo por parceiro, o programa inteiro ganha três medidas de saúde: produtividade (oportunidades e clientes por parceiro ativo, e o CAC caindo), robustez (ativos que seguem ativos e base que não depende de um só parceiro) e criação de nicho (categorias e tipos novos gerando valor). Você aprova?",
  "escolha", AP, ["F:saude_ecossistema", "3.5"],
  ["The Keystone Advantage mostra que um programa pode ter parceiros bons e mesmo assim estar doente. É o caso de quando tudo depende de um parceiro só, ou quando o custo de servir cresce mais do que o valor. Por isso o livro mede o ecossistema inteiro em três medidas: produtividade, robustez e criação de nicho.",
   "Aqui elas viram números do painel trimestral, calculados pelo portal. Produtividade: oportunidades e clientes por parceiro ativo e a tendência do CAC. Robustez: quantos ativos seguem ativos depois de dois trimestres e quanto o resultado depende dos três maiores parceiros. Criação de nicho: categorias e tipos de parceiro novos que já geram oportunidade."],
  "O cubo diz onde agir em cada parceiro. A saúde do ecossistema diz se o programa como um todo está ficando mais forte ou mais frágil, que é a pergunta do Diretor.",
  [VF(KS, 0, 0), VF(KS, 0, 1), VF(KS, 0, 2)], "saude")

Q("portoes", "Gestão do programa", "Você pediu que eu recomendasse os portões. Você aprova os portões abaixo (ajustando números no comentário, se quiser)?", "escolha", AP, ["F:fase", "P:fases", "2.4|fluxo"],
  ["Recomendação, juntando o seu objetivo (CAC menor que os canais ativos) com o que os livros pedem em cada fase. Winning the Right Game pede evidência que atraia o próximo parceiro. Keystone pede liquidez em escala pequena antes de escalar. Customer Success pede um processo que se repete antes de se padronizar. Business of Belonging pede que os parceiros comecem a puxar a conversa.",
   "Experimentação para Tração, valendo por um trimestre: 5 parceiros ativados; 3 clientes fechados vindos de parceiros; CAC do canal menor ou igual ao dos canais ativos; metade das oportunidades qualificadas virando reunião; rituais rodando dois trimestres seguidos do mesmo jeito.",
   "Tração para Crescimento: 15 parceiros ativos, com 40% em Ritmo alto; parceiros originando 20% dos clientes novos do grupo; CAC do canal na metade do dos canais ativos; metade das conversas da comunidade iniciadas por parceiros; 80% dos ativos seguindo ativos depois de dois trimestres. Na fase de Crescimento entram categorias e regiões novas e, quando o custo de servir passar das horas disponíveis, uma segunda pessoa no time.",
   "Os números são inferência minha, calibrada ao tamanho do grupo; nenhum livro dá números para o caso Wise. Os três pilares ficam abertos desde o início, como você decidiu."],
  "O portão controla o ritmo de escala, não a abertura dos pilares. Com portões ligados ao CAC, crescer só faz sentido quando crescer barateia a aquisição.",
  [VP(KS, 4), F(EJ, 6, 0), VF(CS, 5, 4), VF(BB, 1, 0)], "portoes")

Q("semana", "Gestão do programa", "Revisei o princípio das três perguntas, como você pediu: elas saem. No lugar, toda semana você revisa as oportunidades abertas e conversa com cada closer sobre as dele, e uma vez por mês o Igor recebe um resumo de poucos números. Você aprova?",
  "escolha", AP, ["2.2", "2.5"],
  ["As três perguntas vinham de Nearbound, que propõe embutir o programa na reunião comercial (uma receita só, não direta e indireta). O princípio continua certo: o parceiro tem de fazer parte da rotina de venda. Mas o meio estava pesado para o caso Wise. Você já decidiu que o lead vai direto ao closer e que a conversa com ele é pessoal.",
   "Então o ritual semanal fica seu, sem pauta formal com o grupo. O portal lista, por closer, as oportunidades abertas e o último retorno dado ao parceiro, e você conversa com cada um como preferir. Com o Igor, o contato vira um resumo mensal de poucos números: CAC do canal, parceiros ativos, oportunidades e clientes do mês, distância dos portões. Ele já confia na sua autonomia."],
  "O princípio (o programa vive dentro da rotina comercial) fica; o mecanismo vira o mais leve possível. Isso tira uma reunião da agenda dos closers e do Igor e mantém a informação que importa.",
  [F(CV, 5, 2), D2("Q-0014"), D2("Q-0011")], "semana")

Q("diretor", "Gestão do programa", "Como o Igor só assina, quem decide o desligamento de um parceiro?", "escolha",
  ["Eu decido e informo o Igor", "Eu decido e o Igor assina o aviso formal", "O Igor decide, como na especificação", "Não sei: perguntar ao Igor"], ["9.2|dono"],
  ["A especificação prevê aprovação do Diretor no desligamento. Na Rodada 2 você disse que o Igor não faz aprovação criteriosa: ele assina. A governança que os livros pedem (Keystone, Customer Success) é ter um dono único com autoridade e regras visíveis, não necessariamente uma aprovação em duas camadas.",
   "O desligamento já tem critérios objetivos no portal (tempo sem resultado, duas tentativas de retomada, tipo Desertor no cubo). A pergunta é só quem dá a palavra final."],
  "Se você é o dono do programa, a decisão é sua; se o desligamento tem peso de contrato, a assinatura do Igor no aviso fecha o rito sem exigir análise dele.",
  [VP(KS, 9), VP(CS, 8), D2("Q-0011")], "diretor")

Q("ciclo", "A relação com o parceiro", "A cada mudança de etapa de uma oportunidade, o portal prepara a mensagem e você a envia no grupo do parceiro; no fim, mostra o impacto gerado (cliente fechado, valor, comissão). Você aprova?",
  "escolha", AP, ["P:ciclo", "6.3", "6.3|fluxo", "M6|fluxo", "6.1.2"],
  ["Três livros novos chegam ao mesmo ponto. O Referral Engine diz para fechar o ciclo com quem indicou em cada fase, não só no fechamento. Give and Take mostra que quem dá se esgota quando não vê o impacto do que fez, não por dar demais. Business of Belonging diz que, sem validação, a participação não volta.",
   "Como o closer está fora do portal, o retorno ao parceiro só acontece se alguém o fizer. O portal detecta a mudança de etapa e deixa a mensagem pronta. Você só copia, ajusta e envia no WhatsApp, como já é o seu canal."],
  "O parceiro que vê o que sua indicação gerou indica de novo. Este é provavelmente o gesto de maior retorno do programa, e custa um minuto por etapa.",
  [VP(RE, 6), VP(GT, 5), VP(BB, 4)], "ciclo")

Q("ensinar", "A relação com o parceiro", "Na integração, o parceiro aprende a indicar: o perfil do cliente ideal, frases que reconhecem a dor na conversa com o cliente dele e um gesto de indicação sem atrito. O que você adota?", "multipla",
  ["Perfil do cliente ideal de cada empresa do grupo em uma página", "Frases-gatilho: o que o cliente diz quando precisa da Wise, da Tríade ou da Swallow", "Mensagem pronta de indicação para o parceiro enviar ao cliente dele", "Encontro curto de prática na integração"],
  ["P:ensinar", "5.3", "M5|fluxo", "5.3.1", "5.3.2", "5.3.3", "11.3"],
  ["O Referral Engine diz que a indicação falha mais por falta de método do que por falta de vontade. Quem indica precisa reconhecer o cliente certo e saber o que dizer, e qualquer atrito reduz a taxa de indicação.",
   "O kit de vendas e o simulador de ganho que você pediu já entram no portal do parceiro. A proposta acrescenta o que transforma conhecimento em gesto: as frases que o cliente do parceiro diz quando precisa de gestão comercial, e a mensagem pronta para apresentar a Wise."],
  "Ensinar a reconhecer o momento é mais barato que gerar lead do zero, e baixa o CAC sem mudar a comissão.",
  [VP(RE, 2), VP(RE, 5), VF(RE, 1, 0)], "ensinar")

Q("comunidade", "A relação com o parceiro", "Para cultivar a comunidade Wise Partners, o que você adota?", "multipla",
  ["Um ou dois objetivos por fase (nesta, trazer parceiros e trazer oportunidades), medidos pelo portal",
   "Rituais de formato fixo: comunicado do mês, encontro trimestral de parceiros e mentoria mensal",
   "Um grupo geral da comunidade, além dos grupos por parceiro, com pedidos e contribuições à vista",
   "Reconhecimento por status, rede e acesso (destaque, acesso antecipado à Prateleira, palco), separado da comissão"],
  ["M8", "8.1", "8.2", "8.3", "8.4", "P:comunidade", "P:norma_social", "P:reciprocidade", "8.2.1", "8.2.2"],
  ["Business of Belonging diz que a comunidade precisa de um objetivo de negócio claro por fase, de rituais que se repetem e de validação. Diz também que trocar norma social por norma de mercado mata o pertencimento: o parceiro fica pela utilidade e pela identidade, não pelo pagamento.",
   "Give and Take traz o Anel de Reciprocidade: a maior parte do dar nasce de um pedido explícito, e o dar visível faz os outros darem também. Com um grupo por parceiro, ninguém vê ninguém dar. Por isso a proposta de um espaço geral, que fica opcional porque muda a dinâmica que você já tem.",
   "A comissão continua sendo a regra única que você decidiu, só fica fora da conversa da comunidade."],
  "Uma comunidade com objetivo, ritual e reconhecimento custa poucas horas e vira o lugar onde o parceiro decide ficar. Isso pesa na robustez do ecossistema e no CAC.",
  [VP(BB, 0), VP(BB, 7), VP(BB, 10), VF(GT, 3, 0)], "comunidade")

Q("qualificacao", "Atrair e selecionar", "Na qualificação, você aprova incluir a leitura de comportamento (quem só toma se reconhece pelo que faz, não pela simpatia) e a regra de só aceitar quem a Wise indicaria ao seu melhor cliente?", "escolha", AP,
  ["4.2|descricao", "P:valor_antes", "4.2.4"],
  ["Give and Take mostra que quem só toma costuma ser simpático com quem está acima e duro com quem está ao lado, e que se reconhece pelo comportamento e pela reputação. O Referral Engine dá a regra de entrada mais simples possível: só entra na rede quem você indicaria ao seu melhor cliente.",
   "Na prática, isso entra na ficha de jogo que você já aprovou, como duas perguntas: o que esse candidato já deu antes de pedir, e se a Wise o indicaria a um cliente importante. Sem formulário novo."],
  "Um tomador na rede consome horas, pede exceções e desanima quem dá. Filtrar na entrada é muito mais barato que desligar depois.",
  [VP(GT, 6), VP(RE, 1), VP(KS, 1)], "qualificacao")

fo3 = add("formularios", "FO", titulo="Rodada 3: princípios e to-be refatorado com 16 livros", rodada=3, para=["PE-01"], canal="artifact", perguntas=FO3,
          introducao="Cada pergunta traz o contexto, a lógica, o que os livros dizem e um visual.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw",
          status="enviado", enviado_em=HOJE, prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO3: q["formulario"] = fo3
d["historico"].append({"data": HOJE, "evento": "To-be v3: 18 princípios de 16 livros, cubo Valor, Ritmo e Relação, hierarquia refatorada com o portal no centro; Rodada 3"})
