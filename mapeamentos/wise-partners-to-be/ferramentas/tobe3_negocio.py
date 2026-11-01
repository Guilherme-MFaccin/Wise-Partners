# Princípios e modelo de negócio to-be v3 (executado dentro de tobe3_base.py)
AN, CV, EP, EJ, PP = "alianca-e-negociacao", "co-venda-e-canal", "ecossistema-e-plataforma", "estrategia-do-jogo", "programa-de-parceiros"
KS, CS, BB, RE, GT = "keystone-advantage", "customer-success", "business-of-belonging", "referral-engine", "give-and-take"
FT, PR = {}, {}
def fato(k, tema, texto, status, evs):
    FT[k] = add("fatos", "F", tema=tema, texto=texto, status=status, evidencias=evs)

# ================================================================ 18 princípios em quatro camadas
CAMADAS = ["Por que o programa existe", "Como o programa se organiza", "Como o programa se relaciona", "Como o programa se mede e evolui"]
PRINCIPIOS = [
 (1, 0, "cac", "O programa é um canal de aquisição mais barato que os canais ativos: tudo se julga pelo CAC e pela adesão dos parceiros.",
  "Comissão, regras e rituais existem para trazer clientes com custo menor. O que aumenta a complexidade sem baixar o CAC ou sem aumentar a adesão sai.", "confirmado",
  [D2("Q-0015"), F(PP, 3, 5), F(PP, 4, 2)]),
 (2, 0, "valor_antes", "Criar valor antes de capturar, e dividir o que se cria.",
  "O parceiro recebe demanda, conhecimento e reconhecimento antes do pedido de indicação; quem só extrai vira dono de pedágio e é abandonado.", "hipotese",
  [VP(KS, 1), VP(GT, 0), VP(RE, 11), F(CV, 3, 4)]),
 (3, 0, "interacao", "Uma interação central: a oportunidade compartilhada.",
  "Indicação, Prateleira, cruzamento e Base Ativa são portas para a mesma unidade de valor, numa esteira só.", "confirmado", [D2("Q-0002"), F(EP, 0, 0), F(EP, 0, 1)]),
 (4, 0, "pouco", "Ocupar pouco do ecossistema e liderar só onde há legitimidade.",
  "A Wise controla dois pontos (a relação com a indústria e a qualidade da oportunidade) e deixa o resto aos parceiros; segue onde o parceiro já tem programa próprio.", "confirmado",
  [D2("Q-0003"), VP(KS, 2), F(EJ, 7, 1)]),
 (5, 1, "simples", "Interface simples e estável, operação mudando por dentro.",
  "Regra única de comissão, poucas regras aplicadas sempre do mesmo jeito, termo curto; a complexidade fica dentro do portal, nunca na frente do parceiro.", "confirmado",
  [D2("Q-0005"), VP(KS, 5), VP(BB, 11), F(PP, 3, 4)]),
 (6, 1, "portal", "O portal no centro da gestão: cada regra roda nele e o custo de servir cai a cada parceiro novo.",
  "O portal registra, calcula, alerta e monta pautas; a conversa fica no WhatsApp; primeiro se faz à mão e se entende, depois se automatiza.", "confirmado",
  [D2("Q-0001"), VP(KS, 3), VP(CS, 10), F(PP, 7, 4)]),
 (7, 1, "atencao", "Atenção proporcional ao valor e ao potencial.",
  "Cadência humana para quem tem valor ou potencial alto; portal, comunidade e regras para os demais.", "confirmado", [D2("Q-0007"), VP(CS, 3), F(PP, 7, 0)]),
 (8, 1, "excecao", "Todo sinal vira ação com dono e prazo, e só a exceção vira trabalho.",
  "O que segue a regra não gera card nem tarefa; o que foge dela vira uma tarefa do Gerente, com prazo.", "confirmado", [D2("Q-0006"), VP(CS, 2), F(CV, 2, 4)]),
 (9, 2, "primeiro_valor", "Primeiro valor em até 90 dias; o parceiro só conta quando ativa.",
  "A ativação (primeira indicação no ICP que virou reunião) é a linha que separa parceiro de contrato assinado.", "confirmado", [A("EV-0110"), VP(CS, 4), F(PP, 1, 1)]),
 (10, 2, "ciclo", "Fechar o ciclo com quem indica, em cada fase, e mostrar o impacto.",
  "O parceiro desanima quando não vê o que a indicação gerou. Cada mudança de etapa volta para ele, com o desfecho e o valor gerado.", "hipotese",
  [VP(RE, 6), VP(GT, 5), VP(BB, 4)]),
 (11, 2, "ensinar", "Ensinar e equipar o parceiro a indicar.",
  "Perfil do cliente ideal, frases que reconhecem a dor, material de cada empresa do grupo e um gesto de indicação sem atrito.", "hipotese", [VP(RE, 2), VP(RE, 5), D("Q-0012")]),
 (12, 2, "norma_social", "Norma social antes de norma de mercado.",
  "Na comunidade, o parceiro é reconhecido por status, rede e acesso; a comissão é a regra única e fica fora da conversa da comunidade.", "hipotese", [VP(BB, 10), VP(RE, 4), F(EJ, 2, 3)]),
 (13, 2, "reciprocidade", "Reciprocidade visível: pedir de forma explícita, mostrar o dar e julgar pelo comportamento.",
  "A maior parte do dar nasce de um pedido. O equilíbrio entre indicações enviadas e recebidas é medido, e quem só toma é reconhecido pelo comportamento, não pela simpatia.", "hipotese",
  [VP(GT, 2), VP(GT, 6), F(CV, 3, 4)]),
 (14, 2, "comunidade", "Comunidade com ritual, começando pequena e manual.",
  "Cadência fixa, formato fixo e conteúdo variando; convite pessoa a pessoa; crescimento planejado, com o orgânico como bônus.", "hipotese", [VP(BB, 7), VP(BB, 2), VP(BB, 3), D2("Q-0012")]),
 (15, 3, "medir", "Medir o ecossistema inteiro e cada parceiro por fatores objetivos.",
  "Três medidas de saúde do programa e um cubo de três fatores por parceiro, calculados pelo portal, no lugar da percepção.", "hipotese",
  [VP(KS, 0), VP(CS, 1), FTC(7), D2("Q-0009")]),
 (16, 3, "fases", "Crescer por fases, com portões de evidência.",
  "Os três pilares ficam abertos; o que o portão controla é o ritmo de escala (parceiros, categorias, regiões, pessoas).", "hipotese",
  [VP(KS, 4), F(EJ, 6, 0), F(EP, 4, 1), D2("Q-0013")]),
 (17, 3, "ritmos", "Ritmos fixos substituem quadros.",
  "Diário, semanal, mensal, trimestral e anual, com pauta montada pelo portal.", "confirmado", [D2("Q-0008"), F(CV, 5, 1), VP(BB, 7)]),
 (18, 3, "governanca", "Governança clara: dono único, regras visíveis, negociação por princípios e saída prevista.",
  "O Gerente é o dono do programa e negocia com autonomia num texto único; o Diretor assina; a saída é um resultado válido, prevista no termo.", "confirmado",
  [D2("Q-0011"), VP(KS, 9), VP(CS, 8), F(AN, 7, 0)]),
]
for n, cam, k, frase, expl, status, evs in PRINCIPIOS:
    fato("p_" + k, "estrategia", f"Princípio {n} ({CAMADAS[cam]}): {frase} {expl}", status, evs)
    PR[k] = FT["p_" + k]

# ================================================================ ofertas e fatos do modelo de negócio
OF1 = add("ofertas", "OF", nome="Parceria Comercial", tipo="servico", clientes=["Empresas que vendem para a mesma indústria (softwares e serviços)"],
          canais=["Comunidade Wise Partners no WhatsApp", "Portal do parceiro", "Link exclusivo"], status="declarado",
          evidencias=[S("s1", "o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word", "User Story 4")])
OF2 = add("ofertas", "OF", nome="Parceria Institucional", tipo="servico", clientes=["Associações, feiras e entidades que reúnem indústrias"],
          canais=["Eventos e calendário da entidade"], status="declarado", evidencias=[S("s2", "Parceria institucional não usa scorecard nem nível por resultado nesta versão.", "Apêndice A")])
fato("oferta", "oferta", "Duas parcerias: a Comercial, com três pacotes por nível (C Prateleira, B Formação e A Base Ativa) e contrapartidas dos dois lados, e a Institucional, para entidades que reúnem indústrias. Os três pilares abrem juntos.",
     "confirmado", [S("s1", "O usuário escolhe o pacote disponível para o nível, e o sistema carrega as contrapartidas do pacote, com periodicidade e forma de comprovação.", "User Story 5"), D("Q-0002")])
fato("interacao", "estrategia", "Interação central: uma indústria com necessidade conhecida encontra, com contexto, quem resolve; a unidade de valor é a oportunidade compartilhada, com quatro portas (indicação por link, Prateleira, cruzamento de carteiras, Base Ativa).",
     "confirmado", [D2("Q-0002"), F(EP, 0, 0), F(EP, 0, 1)])
fato("papel", "estrategia", "Papel da Wise: orquestradora de um ecossistema pequeno; controla a relação com a indústria e a qualidade da oportunidade; lidera onde a demanda do grupo dá legitimidade e segue onde o parceiro tem programa próprio.",
     "confirmado", [D2("Q-0003"), F(EP, 5, 1), F(EJ, 7, 1)])
fato("arquitetura", "proposta_de_valor", "Arquitetura de valor para a indústria em cinco elementos: Descobrir, Comparar e decidir, Implantar integrado, Pertencer e aprender, Confiar; cada pilar e cada parceiro preenche elementos.",
     "confirmado", [D2("Q-0004"), F(EJ, 5, 0)])
fato("valor_parceiro", "proposta_de_valor", "Valor ao parceiro: demanda de volta pela Prateleira, carteira ativa pelo Base Ativa, conhecimento para vender as três empresas do grupo (kit e simulador de ganho), comunidade e reconhecimento, e comissão por regra única.",
     "confirmado", [D("Q-0012"), F(PP, 3, 1), D2("Q-0015")])
fato("rede", "parceiro", "Rede de valor: cada parceiro pode ser complementador, concorrente parcial, cliente ou fornecedor ao mesmo tempo; o papel é registrado por escopo e o termo separa regras de cooperação e de divisão.",
     "confirmado", [D2("Q-0003"), F(EJ, 0, 1), F(EJ, 0, 3)])
fato("clientes", "cliente", "Dois clientes: a indústria, consumidora final, e o parceiro, cliente do programa, que recebe valor antes de ouvir o pedido.", "declarado", [D("Q-0001", validacao=False), F(CV, 3, 0)])
fato("comissao", "receita", "Comissão por regra única, sem exceção: 40% da primeira mensalidade ao parceiro e 10% ao Gerente na Wise Makers e na Tríade; 6% e 2% do projeto na Swallow. Sobre o LTV, fica entre 2% e 4% para clientes de 12 a 24 meses.",
     "confirmado", [D2("Q-0005"), D("Q-0006"), D("Q-0005")])
fato("captura", "receita", "Nada é cobrado do parceiro. Para entrar num pedido da Prateleira, o fornecedor dá uma contrapartida não financeira (ação conjunta ou condição comercial para a indústria).",
     "confirmado", [D2("Q-0015"), F(EJ, 1, 4)])
fato("metrica_mae", "receita", "Métrica-mãe do programa: o CAC dos clientes vindos de parceiros (comissões, horas e custos diretos divididos pelos clientes fechados), comparado ao CAC médio dos canais ativos do grupo.",
     "hipotese", [D2("Q-0015"), F(PP, 3, 5), VP(RE, 8)])
fato("canal", "canal", "Canais: a comunidade Wise Partners no WhatsApp para a conversa; o portal com a face interna (operada pelo Gerente) e a do parceiro (kit, simulador, trilhas, oportunidades, regras).",
     "confirmado", [D("Q-0012"), F(PP, 7, 3)])
fato("ativos", "estrategia", "Parceiro conta quando ativa: primeira indicação no ICP que virou reunião.", "confirmado", [D("Q-0003"), F(PP, 1, 1)])
fato("capacidade", "recurso", "O programa registra o tempo dedicado e o custo de servir cada parceiro; horas e metas numéricas ficam para depois, e o Diretor define as metas.", "confirmado", [D("Q-0004"), D("Q-0021")])
fato("interno", "modelo_operacional", "Lead vindo de parceiro vai direto ao closer da empresa do grupo; o Gerente combina com ele pessoalmente, sem SLA interno nem sistema para o closer.", "confirmado", [D2("Q-0014")])
fato("saude_ecossistema", "estrategia", "Saúde do programa em três medidas: produtividade (oportunidades e clientes por parceiro ativo e o CAC caindo), robustez (parceiros ativos que continuam ativos e a base que não depende de um só) e criação de nicho (categorias e tipos de parceiro novos que geram valor).",
     "hipotese", [VF(KS, 0, 0), VF(KS, 0, 1), VF(KS, 0, 2)])
fato("cubo", "parceiro", "Cada parceiro é lido em três fatores binários (Valor, Ritmo e Relação), que formam um cubo de oito tipos com ação, abordagem e cadência próprias; o Potencial não define o tipo, só a atenção.",
     "hipotese", [FTC(7), FTC(6), VF(CS, 1, 0), VF(GT, 0, 0)])
fato("fase", "estrategia", "Fases e portões recomendados. Experimentação para Tração, por um trimestre: 5 parceiros ativados; 3 clientes fechados vindos de parceiros; CAC do canal menor ou igual ao dos canais ativos; metade das oportunidades qualificadas virando reunião; rituais rodando dois trimestres iguais. Tração para Crescimento: 15 parceiros ativos com 40% em Ritmo alto; parceiros originando 20% dos clientes novos do grupo; CAC do canal na metade do dos canais ativos; metade das conversas da comunidade iniciadas por parceiros; 80% dos ativos seguindo ativos depois de dois trimestres.",
     "hipotese", [D2("Q-0013"), F(EJ, 6, 0), VF(KS, 5, 3), VF(CS, 5, 4), VF(BB, 1, 0)])
d["modelo_operacional"] = {"integracao": "alta", "padronizacao": "alta", "tipo": "unificacao",
    "justificativa": "As três empresas tratam o lead vindo de parceiro do mesmo jeito: vai direto ao closer, com retorno ao parceiro; só a comissão da Swallow difere, por ser por projeto.",
    "status": "confirmado", "evidencias": [D("Q-0005"), D2("Q-0014")]}
