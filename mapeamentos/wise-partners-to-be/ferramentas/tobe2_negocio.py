# Modelo de negócio to-be v2 (executado dentro de tobe2_base.py)
AN, CV, EP, EJ, PP = "alianca-e-negociacao", "co-venda-e-canal", "ecossistema-e-plataforma", "estrategia-do-jogo", "programa-de-parceiros"
FT = {}
def fato(k, tema, texto, status, evs):
    FT[k] = add("fatos", "F", tema=tema, texto=texto, status=status, evidencias=evs)

OF1 = add("ofertas", "OF", nome="Parceria Comercial", tipo="servico", clientes=["Empresas que vendem para a mesma indústria (softwares e serviços)"],
          canais=["Comunidade Wise Partners no WhatsApp", "Portal do parceiro", "Link exclusivo"], status="declarado",
          evidencias=[S("s1", "o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word", "User Story 4")])
OF2 = add("ofertas", "OF", nome="Parceria Institucional", tipo="servico", clientes=["Associações, feiras e entidades que reúnem indústrias"],
          canais=["Eventos e calendário da entidade"], status="declarado",
          evidencias=[S("s2", "Parceria institucional não usa scorecard nem nível por resultado nesta versão.", "Apêndice A")])

fato("oferta", "oferta", "O programa oferece duas parcerias: a Comercial, com três pacotes por nível (C Prateleira, B Formação e A Base Ativa) e contrapartidas dos dois lados, e a Institucional, para entidades que reúnem indústrias.",
     "declarado", [S("s1", "O usuário escolhe o pacote disponível para o nível, e o sistema carrega as contrapartidas do pacote, com periodicidade e forma de comprovação.", "User Story 5"), D("Q-0002")])
fato("interacao", "estrategia", "Interação central do programa: uma indústria com necessidade conhecida encontra, com contexto, o parceiro certo, ou um parceiro traz ao grupo uma indústria com necessidade; o resultado volta ao portal. A unidade de valor é a oportunidade compartilhada, e os pilares são portas de entrada para ela: indicação por link, Prateleira de RFP, cruzamento de carteiras e Base Ativa.",
     "hipotese", [F(EP, 0, 0), F(EP, 0, 1), F(EP, 0, 2), F(CV, 0, 1)])
fato("papel", "estrategia", "Papel da Wise: orquestradora de um ecossistema pequeno, controlando dois pontos que não delega (a relação com a indústria e a qualidade da oportunidade); líder onde tem legitimidade (a demanda das indústrias do grupo) e seguidora onde o parceiro já tem programa próprio (grandes ERPs).",
     "hipotese", [F(EP, 5, 0), F(EP, 5, 1), F(EP, 5, 3), F(EJ, 7, 1), F(EJ, 7, 3)])
fato("arquitetura", "proposta_de_valor", "Arquitetura de valor para a indústria em cinco elementos: Descobrir quem resolve o quê; Comparar e decidir entre alternativas verificadas; Implantar de forma integrada com a consultoria; Pertencer e aprender (comunidade e evento); Confiar (regras e dados). Cada pilar e cada parceiro preenche elementos, e o programa se mede pela cobertura deles.",
     "hipotese", [F(EJ, 5, 0), F(EJ, 5, 1), F(EJ, 5, 2)])
fato("valor_parceiro", "proposta_de_valor", "Valor ao parceiro além da comissão: demanda de volta pela Prateleira, carteira ativa pelo Base Ativa, credibilidade (trilha, certificado, selo, palco), conhecimento para vender as três empresas do grupo (kit de vendas e quanto ganha por indicação) e reconhecimento por nível.",
     "confirmado", [D("Q-0012"), F(PP, 3, 1), S("s2", "ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação", "User Story 10")])
fato("rede", "parceiro", "Rede de valor: cada parceiro pode ser ao mesmo tempo complementador, concorrente parcial, cliente ou fornecedor; o papel é registrado por escopo, e o contrato separa duas camadas de regras: as de cooperação (Prateleira, comunidade, evento, ações conjuntas) e as de divisão (comissão, escopo, proteção de 180 dias, cruzamento).",
     "hipotese", [F(EJ, 0, 0), F(EJ, 0, 1), F(EJ, 0, 3), F(EJ, 0, 5)])
fato("clientes", "cliente", "Dois clientes: a indústria, consumidora final do valor criado, e o parceiro, cliente do programa, que precisa receber valor antes de ouvir o pedido de indicação.",
     "declarado", [D("Q-0001", validacao=False), F(CV, 3, 0), F(PP, 5, 2)])
fato("comissao", "receita", "Comissão: na Wise Makers e na Tríade, 40% da primeira mensalidade ao parceiro e 10% ao Gerente de Parcerias; na Swallow, 6% do projeto ao parceiro e 2% ao Gerente. O tratamento da indicação é o mesmo nas três empresas.",
     "confirmado", [D("Q-0006"), D("Q-0005"), S("s1", "o sistema calcula 40% da primeira mensalidade para o parceiro e 10% para o responsável pela parceria", "User Story 6, cenário 1")])
fato("ltv", "receita", "Critério objetivo da comissão: medida sobre o LTV do cliente, a comissão total (parceiro e gerente) fica perto de 2 a 4% para clientes que ficam de 12 a 24 meses, abaixo da faixa de 5 a 15% que os livros citam para quem só gera lead; o regulamento publica essa base para a regra não parecer arbitrária.",
     "hipotese", [D("Q-0006", validacao=False), F(CV, 7, 0), F(AN, 6, 0), F(AN, 6, 1), F(PP, 3, 5)])
fato("captura", "receita", "Captura de valor: nada é cobrado do parceiro para entrar; a Wise paga por resultado e o que não passa pelo registro não gera proteção nem comissão. Cobrança do fornecedor pela Prateleira (taxa de sucesso, destaque, relatório de perda) fica como opção de fase futura.",
     "hipotese", [F(EP, 2, 4), F(EP, 2, 1), F(EP, 2, 2), F(EJ, 1, 4)])
fato("lealdade", "proposta_de_valor", "Reconhecimento em espécie por nível (palco no evento, selo, mentoria, prioridade na Prateleira), divulgado antes, como camada além da comissão em dinheiro.",
     "hipotese", [F(EJ, 2, 3), F(EJ, 2, 4), F(EJ, 2, 5)])
fato("canal", "canal", "Canais: a comunidade Wise Partners no WhatsApp, com um grupo por parceiro, para toda a conversa; o portal com duas faces (a interna, operada pelo Gerente de Parcerias, e a do parceiro, de autoatendimento: kit de vendas, simulador de comissão, trilhas, status das oportunidades, regras).",
     "confirmado", [D("Q-0012"), F(PP, 7, 3), F(CV, 5, 4)])
fato("ativos", "estrategia", "Parceiro conta como parceiro quando ativa (primeira indicação no ICP que virou reunião); assinatura sem ativação não conta como resultado.",
     "confirmado", [D("Q-0003"), F(PP, 1, 1), F(PP, 2, 0)])
fato("capacidade", "recurso", "Capacidade: o programa registra o tempo dedicado e o custo de servir cada parceiro, para decidir onde pôr as horas; o número de horas não é fixado agora.",
     "confirmado", [D("Q-0004"), F(AN, 3, 0)])
fato("fase", "estrategia", "Fase: o programa está em experimentação. Nesta fase valem compromisso e uso (ativação, liquidez das oportunidades, qualidade da combinação, confiança), não cadastros; a passagem de fase depende de limiares desses indicadores, e as metas numéricas ficam para depois.",
     "hipotese", [F(EP, 4, 0), F(EP, 4, 1), F(EP, 7, 3), F(PP, 4, 3), D("Q-0003", validacao=False)])
fato("interno", "estrategia", "Ecossistema interno: Wise Makers, Tríade e Swallow realinham a rotina comercial para receber oportunidades de parceiros como rotina (SLA, briefing, crédito integral na meta de quem fecha), uma receita só.",
     "hipotese", [F(EJ, 7, 5), F(CV, 5, 2), F(CV, 6, 4), D("Q-0015")])
d["modelo_operacional"] = {"integracao": "alta", "padronizacao": "alta", "tipo": "unificacao",
    "justificativa": "As três empresas tratam a oportunidade vinda de parceiro do mesmo jeito (registro, SLA, retorno ao parceiro); só a regra de comissão da Swallow difere, por ser por projeto.",
    "status": "confirmado", "evidencias": [D("Q-0005")]}
