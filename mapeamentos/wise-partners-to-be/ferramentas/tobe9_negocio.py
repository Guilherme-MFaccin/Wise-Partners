# Princípios e modelo de negócio to-be v7 (executado dentro de tobe9_base.py)
AN, CV, EP, EJ, PP = "alianca-e-negociacao", "co-venda-e-canal", "ecossistema-e-plataforma", "estrategia-do-jogo", "programa-de-parceiros"
KS, CS, BB, RE, GT, NE = "keystone-advantage", "customer-success", "business-of-belonging", "referral-engine", "give-and-take", "never-eat-alone"
FT, PR = {}, {}
def fato(k, tema, texto, status, evs):
    FT[k] = add("fatos", "F", tema=tema, texto=texto, status=status, evidencias=evs)

# ================================================================ 18 princípios em quatro camadas
CAMADAS = ["Por que o programa existe", "Como o programa se organiza", "Como o programa se relaciona", "Como o programa se mede e evolui"]
PRINCIPIOS = [
 (1, 0, "cac", "O programa é um canal de aquisição mais barato que os canais ativos, julgado por duas medidas com o mesmo peso, em todas as fases: o CAC do Wise Partners e o valor devolvido ao parceiro.",
  "Comissão, regras e rituais existem para trazer clientes com custo menor sem deixar de entregar valor ao parceiro. O que aumenta a complexidade sem baixar o CAC, sem aumentar o valor devolvido ou sem aumentar a adesão sai.", "confirmado",
  [D2("Q-0015"), D3("Q-0005"), D4("Q-0014"), VP(KS, 1), VP(GT, 10), F(PP, 3, 5)]),
 (2, 0, "valor_antes", "Criar valor antes de capturar, e dividir o que se cria.",
  "O parceiro recebe demanda, conhecimento e reconhecimento antes do pedido de indicação; quem só extrai vira dono de pedágio e é abandonado.", "hipotese",
  [VP(KS, 1), VP(GT, 0), VP(NE, 0, 1), VP(RE, 11), F(CV, 3, 4)]),
 (3, 0, "interacao", "Uma interação central: a oportunidade compartilhada.",
  "Indicação, Prateleira, cruzamento, Base Ativa e diagnóstico são portas para a mesma unidade de valor, numa esteira só.", "confirmado", [D2("Q-0002"), D6("Q-0046"), F(EP, 0, 0), F(EP, 0, 1)]),
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
  [VP(RE, 6), VP(GT, 5), VP(BB, 4), VP(NE, 9, 0)]),
 (11, 2, "ensinar", "Ensinar e equipar o parceiro a indicar.",
  "Perfil do cliente ideal, frases que reconhecem a dor, material de cada empresa do grupo e um gesto de indicação sem atrito.", "hipotese", [VP(RE, 2), VP(RE, 5), D("Q-0012")]),
 (12, 2, "norma_social", "Norma social antes de norma de mercado.",
  "Na comunidade, o parceiro é reconhecido por status, rede e acesso; a comissão é a regra única e fica fora da conversa da comunidade.", "hipotese", [VP(BB, 10), VP(RE, 4), F(EJ, 2, 3)]),
 (13, 2, "reciprocidade", "Reciprocidade visível: pedir de forma explícita, mostrar o dar e julgar pelo comportamento.",
  "A maior parte do dar nasce de um pedido. O equilíbrio entre indicações enviadas e recebidas é medido só por dentro, para a leitura do cubo; o parceiro nunca vê placar, e na comunidade aparece o dar, não a conta. Quem só toma é reconhecido pelo comportamento, não pela simpatia.", "confirmado",
  [VP(GT, 2), VP(GT, 6), F(CV, 3, 4), VP(NE, 0, 1), D4("Q-0023")]),
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
  "O Gerente é o dono do programa, negocia com autonomia num texto único e decide o desligamento; o Igor assina o termo e o aviso formal e revê o programa toda semana com o Gerente; a saída é um resultado válido, prevista no termo.", "confirmado",
  [D2("Q-0011"), D3("Q-0008"), D3("Q-0009"), VP(KS, 9), VP(CS, 8), F(AN, 7, 0)]),
]
# Never Eat Alone (17º livro) entra na camada de relação, depois do 14
_NEA = [
 (0, 2, "antes_de_precisar", "Construir a relação antes de precisar e mantê-la por cadência proporcional à importância.",
  "Cada parceiro e cada candidato tem um ritmo de contato (mensal, trimestral ou duas a três vezes por ano); cada contato leva algo de valor; depois de cada encontro, retorno em até 24 horas; quem sai da parceria continua na lista.", "hipotese",
  [VP(NE, 1), VP(NE, 3), VF(NE, 2, 1), VF(NE, 2, 5), VF(NE, 2, 4)]),
 (0, 2, "ponte", "Ser a ponte entre parceiros e reunir as pessoas.",
  "A Wise apresenta parceiros entre si sem esperar pedido, sempre em torno de uma oportunidade específica, e recebe parceiros em encontros pequenos e presenciais, com um convidado âncora.", "hipotese",
  [VP(NE, 4), VP(NE, 4, 1), VP(NE, 5), VF(NE, 5, 4), VP(NE, 9, 3)]),
 (0, 2, "pessoa_a_pessoa", "Pessoa a pessoa, nunca em massa, e com respeito também na saída.",
  "Mensagens que o portal prepara saem personalizadas pelo Gerente; compromissos ficam claros para os dois lados; quem deixa o programa é tratado como alguém que continua na rede.", "hipotese",
  [VP(NE, 8), VP(NE, 6, 3), VP(NE, 10, 2)]),
]
_pos = max(i for i, x in enumerate(PRINCIPIOS) if x[1] == 2) + 1
PRINCIPIOS[_pos:_pos] = _NEA
PRINCIPIOS = [(i + 1,) + t[1:] for i, t in enumerate(PRINCIPIOS)]
for n, cam, k, frase, expl, status, evs in PRINCIPIOS:
    fato("p_" + k, "estrategia", f"Princípio {n} ({CAMADAS[cam]}): {frase} {expl}", status, evs)
    PR[k] = FT["p_" + k]

# ================================================================ ofertas e fatos do modelo de negócio
OF1 = add("ofertas", "OF", nome="Parceria Comercial", tipo="servico", clientes=["Empresas que vendem para a mesma indústria (softwares e serviços)"],
          canais=["Comunidade Wise Partners no WhatsApp", "Portal do parceiro", "Link exclusivo"], status="declarado",
          evidencias=[S("s1", "o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word", "User Story 4")])
OF2 = add("ofertas", "OF", nome="Parceria Institucional", tipo="servico", clientes=["Associações, feiras e entidades que reúnem indústrias"],
          canais=["Eventos e calendário da entidade"], status="declarado", evidencias=[S("s2", "Parceria institucional não usa scorecard nem nível por resultado nesta versão.", "Apêndice A")])
fato("oferta", "oferta", "Duas parcerias: a Comercial, com três pacotes por nível (C Prateleira, B Formação e A Base Ativa) e contrapartidas dos dois lados, e a Institucional, para entidades que reúnem indústrias. Os três pilares existem desde o início, mas a entrega sobe em escada: o pacote C (Prateleira, indicação e grupo) vale para todos; o B (certificado, Hub, mentoria, eventos e formações) para Premium e Elite que divulgam à própria base; o A (Base Ativa) só para Elite, conforme as horas. O que o parceiro recebe acompanha o que ele consegue devolver, e abrir mais é orgânico, conforme a relação cresce.",
     "confirmado", [S("s1", "O usuário escolhe o pacote disponível para o nível, e o sistema carrega as contrapartidas do pacote, com periodicidade e forma de comprovação.", "User Story 5"), D("Q-0002"), D4("Q-0017"), A("EV-0025"), A("EV-0019"), VP(KS, 4), VP(BB, 5)])
fato("interacao", "estrategia", "Interação central: uma indústria com necessidade conhecida encontra, com contexto, quem resolve; a unidade de valor é a oportunidade compartilhada, com cinco portas (indicação por link, Prateleira, cruzamento de carteiras, Base Ativa e diagnóstico do cliente do parceiro).",
     "confirmado", [D2("Q-0002"), D6("Q-0046"), F(EP, 0, 0), F(EP, 0, 1)])
fato("papel", "estrategia", "Papel da Wise: orquestradora de um ecossistema pequeno; controla a relação com a indústria e a qualidade da oportunidade; lidera onde a demanda do grupo dá legitimidade e segue onde o parceiro tem programa próprio.",
     "confirmado", [D2("Q-0003"), F(EP, 5, 1), F(EJ, 7, 1)])
fato("arquitetura", "proposta_de_valor", "Arquitetura de valor para a indústria em cinco elementos: Descobrir, Comparar e decidir, Implantar integrado, Pertencer e aprender, Confiar; cada pilar e cada parceiro preenche elementos.",
     "confirmado", [D2("Q-0004"), F(EJ, 5, 0)])
fato("valor_parceiro", "proposta_de_valor", "Valor ao parceiro: para o software de gestão, a retenção da própria base pelo diagnóstico e pelo Wise Hub dados aos clientes dele; para todos, demanda de volta pela Prateleira, carteira ativa pelo Base Ativa, conhecimento para vender as três empresas do grupo (kit e simulador de ganho), comunidade e reconhecimento, e comissão por regra única.",
     "confirmado", [D("Q-0012"), F(PP, 3, 1), D2("Q-0015"), D6("Q-0045")])
fato("rede", "parceiro", "Rede de valor: cada parceiro pode ser complementador, concorrente parcial, cliente ou fornecedor ao mesmo tempo; o papel é registrado por escopo e o termo separa regras de cooperação e de divisão.",
     "confirmado", [D2("Q-0003"), F(EJ, 0, 1), F(EJ, 0, 3)])
fato("clientes", "cliente", "Dois clientes: a indústria, consumidora final, e o parceiro, cliente do programa, que recebe valor antes de ouvir o pedido.", "declarado", [D("Q-0001", validacao=False), F(CV, 3, 0)])
fato("comissao", "receita", "Comissão por regra única, sem exceção: 40% da primeira mensalidade ao parceiro e 10% ao Gerente na Wise Makers e na Tríade; 6% e 2% do projeto na Swallow. Sobre o LTV, fica entre 2% e 4% para clientes de 12 a 24 meses. O dinheiro é igual para todos; o que varia por tipo de parceiro é o não monetário (acesso, palco, apoio). A regra é revista depois de dois trimestres com dados de permanência dos clientes indicados.",
     "confirmado", [D2("Q-0005"), D("Q-0006"), D("Q-0005"), D4("Q-0015"), VP(RE, 3), B("bech-partner-channels", "Manter a regra de comissão")])
fato("captura", "receita", "Nada é cobrado do parceiro. Para entrar num pedido da Prateleira, o fornecedor dá uma contrapartida não financeira (ação conjunta ou condição comercial para a indústria).",
     "confirmado", [D2("Q-0015"), F(EJ, 1, 4)])
fato("metrica_mae", "receita", "Duas medidas-mãe, lado a lado e com o mesmo peso em todas as fases: o CAC do Wise Partners (comissões, horas e custos diretos divididos pelos clientes fechados vindos de parceiros; ninguém informa o CAC de outros canais) e o valor devolvido ao parceiro (desfechos devolvidos, oportunidades enviadas de volta, apresentações feitas e acessos dados).",
     "confirmado", [D3("Q-0005"), D4("Q-0014"), D2("Q-0015"), VP(RE, 8), VP(KS, 1)])
fato("cac_leitura", "receita", "O CAC se lê pela tendência, trimestre contra trimestre, no painel da semana; a meta, quando houver, é do Igor.",
     "confirmado", [D4("Q-0020"), D3("Q-0005"), D("Q-0021")])
fato("canal", "canal", "Canais: a comunidade Wise Partners no WhatsApp para a conversa; o portal com a face interna (operada pelo Gerente) e a do parceiro (kit, simulador, trilhas, oportunidades, regras).",
     "confirmado", [D("Q-0012"), F(PP, 7, 3)])
fato("ativos", "estrategia", "Parceiro conta quando ativa: primeira indicação no ICP que virou reunião.", "confirmado", [D("Q-0003"), F(PP, 1, 1)])
fato("capacidade", "recurso", "O programa registra o tempo dedicado e o custo de servir cada parceiro; horas e metas numéricas ficam para depois, e o Diretor define as metas.", "confirmado", [D("Q-0004"), D("Q-0021")])
fato("interno", "modelo_operacional", "Lead vindo de parceiro vai direto ao closer da empresa do grupo; o Gerente conversa com o closer quando há indicação ou proposta nova, sem SLA interno nem sistema para o closer; cada closer avisa o Gerente por WhatsApp a cada mudança de etapa, e o Gerente registra no portal. Toda semana, o Gerente revê o programa com o Igor num painel simples, caso a caso.", "confirmado", [D2("Q-0014"), D3("Q-0008"), D4("Q-0016")])
fato("saude_ecossistema", "estrategia", "Saúde do programa em três medidas: produtividade (oportunidades e clientes por parceiro ativo e o CAC caindo), robustez (parceiros ativos que continuam ativos e a base que não depende de um só) e criação de nicho (categorias e tipos de parceiro novos que geram valor).",
     "confirmado", [D3("Q-0006"), VF(KS, 0, 0), VF(KS, 0, 1), VF(KS, 0, 2)])
fato("cubo", "parceiro", "Cada parceiro é lido em três fatores binários (Valor, Ritmo e Relação), que formam um cubo de oito tipos com ação, abordagem e cadência próprias; o Potencial não define o tipo, só a atenção.",
     "confirmado", [D3("Q-0003"), D3("Q-0004"), FTC(7), FTC(6), VF(CS, 1, 0), VF(GT, 0, 0)])
fato("fase", "estrategia", "Fases e portões, com CAC e valor devolvido lado a lado em todas as fases. Experimentação para Tração, medida por um trimestre: 5 parceiros ativados; desfecho devolvido ao parceiro em toda oportunidade; 3 clientes fechados vindos de parceiros; CAC do Wise Partners apurado no trimestre; metade das oportunidades qualificadas virando reunião; rituais rodando dois trimestres iguais. Tração para Crescimento: 15 parceiros ativos com 40% em Ritmo alto; CAC do Wise Partners caindo dois trimestres seguidos; valor devolvido aos parceiros crescendo dois trimestres seguidos; metade das conversas da comunidade iniciadas por parceiros; 80% dos ativos seguindo ativos depois de dois trimestres. Os números são provisórios e se calibram na primeira revisão trimestral com dados reais.",
     "confirmado", [D3("Q-0007"), D4("Q-0014"), D3("Q-0005"), VP(GT, 10), VP(BB, 0), VF(KS, 5, 3)])
d["modelo_operacional"] = {"integracao": "alta", "padronizacao": "alta", "tipo": "unificacao",
    "justificativa": "As três empresas tratam o lead vindo de parceiro do mesmo jeito: vai direto ao closer, com retorno ao parceiro; só a comissão da Swallow difere, por ser por projeto.",
    "status": "confirmado", "evidencias": [D("Q-0005"), D2("Q-0014")]}
