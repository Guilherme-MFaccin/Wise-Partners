# Perguntas da Rodada 4 (executado dentro de tobe5_base.py).
# Foco: onde os livros discordam das decisões do patrocinador, mais o painel semanal com o Igor e os princípios de Never Eat Alone.
# Rodada 4 respondida: cada pergunta é recriada pela chave, com a resposta do patrocinador como evidência.
# Pergunta com contradição: a resposta do dono resolve a divergência (resolvida) e o elemento volta a confirmado.
# Demais alvos: hipótese aprovada sobe para confirmado; campo em hipótese sai da lista.
FO4 = []
_R4_ANT = {"ct_cac": "Q-0014", "ct_comissao": "Q-0015", "ct_closer": "Q-0016", "ct_pilares": "Q-0017", "ct_dono": "Q-0018", "ct_niveis": "Q-0019",
           "painel": "Q-0020", "igor_voz": "Q-0021", "triade": "Q-0022", "ct_placar": "Q-0023", "nea_cadencia": "Q-0024", "nea_ponte": "Q-0025"}
_RESOLUCAO = {
 "ct_cac": "O patrocinador seguiu os livros: CAC do Wise Partners e valor devolvido ao parceiro ficam lado a lado no painel, com o mesmo peso, em todas as fases.",
 "ct_comissao": "Meio-termo: dinheiro igual para todos; o não monetário varia por tipo de parceiro; a regra é revista depois de dois trimestres com dados de permanência.",
 "ct_closer": "Cada closer avisa o Gerente por WhatsApp a cada mudança de etapa, sem portal; o Gerente registra a etapa e devolve ao parceiro.",
 "ct_pilares": "Segue o Playbook v3.1: a entrega sobe em escada pelo pacote (C, B, A), conforme a capacidade do parceiro de devolver; abrir mais é orgânico. Converge com os livros que pedem começar pequeno.",
 "ct_dono": "Mantido: o Gerente é dono de todas as tarefas, sem teto, como o Método Octo e Customer Success recomendam para o início. As horas dedicadas entram no painel da semana para acompanhar o risco de sobrecarga.",
 "ct_niveis": "Mantida a especificação e o Playbook v3.1: o nível mede potencial pela faixa de clientes no ICP; o pacote, que exige contrapartida, é o que libera as entregas.",
 "ct_placar": "Meio-termo: o equilíbrio é medido só por dentro, para o cubo; o parceiro nunca vê placar, e na comunidade aparece o dar, não a conta.",
}
def Q(chave, bloco, texto, tipo, opcoes, alvo, contexto, logica, cits, visual, recomendo=""):
    ev = D4(_R4_ANT[chave])
    ids = []
    for a in alvo:
        if a.startswith("F:"): ids.append(FT[a[2:]])
        elif a.startswith("P:"): ids.append(PR[a[2:]])
        elif a.startswith("CT:"): ids.append(CT[a[3:]])
        elif a.startswith("PA:"): ids.append(a[3:])
        else:
            k, _, campo = a.partition("|"); ids.append(P[k] + ("." + campo if campo else ""))
    qid = add("perguntas", "Q", texto=texto, tipo=tipo, opcoes=opcoes, alvo=ids, para=["PE-01"], rodada=4, bloco=bloco, status="respondida",
              formulario=None, respostas=[ev], respondida_por=["PE-01"], chave=chave, contexto=contexto, logica=logica, citacoes=cits, visual=visual, recomendo=recomendo)
    resolvidos = set()
    for a in alvo:
        if a.startswith("CT:"):
            ct = next(c for c in d["contradicoes"] if c["id"] == CT[a[3:]])
            ct.update(pergunta=qid, status="resolvida", resolucao=_RESOLUCAO[chave], evidencias_resolucao=[ev])
            resolvidos.add(ct["elemento"])
    por_id = {o["id"]: o for col in ("processos", "fatos", "papeis") for o in d[col]}
    for a in ids:
        base, _, campo = a.partition(".") if not a.startswith("P-") else (a.rpartition(".") if "." in a and not a.rpartition(".")[2].isdigit() else (a, "", ""))
        if a.startswith("P-") and "." in a and not a.rpartition(".")[2].isdigit():
            base, campo = a.rpartition(".")[0], a.rpartition(".")[2]
        elif a.startswith("P-"):
            base, campo = a, ""
        o = por_id.get(base)
        if not o:
            continue
        if campo and campo in (o.get("hipoteses") or []):
            o["hipoteses"].remove(campo)
        if not campo and o.get("status") in ("hipotese", "contestado"):
            o["status"] = "confirmado"
        if ev not in o["evidencias"]:
            o["evidencias"].append(ev)
    FO4.append(qid)
    return qid

B1 = "Onde os livros discordam de você"

Q("ct_cac", B1, "O CAC decide tudo desde o primeiro trimestre, ou o valor ao parceiro vem antes e o CAC passa a decidir a partir da Tração?", "escolha",
  ["Manter: o CAC do Wise Partners decide desde o início",
   "Meio-termo: na Experimentação os portões medem comportamento (ativados, desfechos devolvidos, gestos de valor) e o CAC decide a partir da Tração",
   "Seguir os livros: valor devolvido ao parceiro e CAC lado a lado no painel, com o mesmo peso, em todas as fases"],
  ["CT:cac_primeiro", "P:cac", "F:fase", "P:fases", "F:cac_leitura"],
  ["Você pediu que as suas aprovações não pesassem mais que os livros. Esta é a divergência mais funda que apareceu ao reler tudo com essa regra. A sua decisão: o programa é um canal de aquisição mais barato que os canais ativos, e tudo se julga pelo CAC. Com a resposta da Rodada 3, o CAC é só o do Wise Partners, sem comparar com outros canais.",
   "Quatro livros dizem outra coisa sobre a ordem. Keystone: criar valor antes de capturar, e o hub que só extrai vira dono de pedágio. Give and Take: a vantagem de quem dá cresce com o tempo, e dar esperando retorno rápido costuma não funcionar. Customer Success: lealdade nasce de valor entregue. Business of Belonging: comunidade só entrega resultado de negócio depois de seis a doze meses, e quem vende de forma direta perde a confiança.",
   "Nenhum deles diz que o CAC é a métrica errada. Dizem que, nos primeiros trimestres, ele mede pouco e pode empurrar decisões que afastam o parceiro: cobrar indicação cedo demais, cortar quem ainda não trouxe cliente. Refiz os portões das fases sem comparar com outros canais: na Experimentação só comportamento e 3 clientes fechados; na Tração, o CAC caindo dois trimestres seguidos e abaixo de um terço do LTV dos mesmos clientes. O um terço é inferência minha, para calibrar com dados."],
  "Se o meio-termo for aceito, o CAC continua sendo a métrica-mãe e o motivo de existir do programa, mas só começa a decidir quando há dados suficientes para ele significar alguma coisa. Até lá, o que decide é se o parceiro está recebendo valor e se está agindo.",
  [VP(KS, 1), VP(GT, 10), VP(CS, 7), VP(BB, 1), F(PP, 3, 5)], "ct_cac", "Meio-termo")

Q("ct_comissao", B1, "A comissão em dinheiro, igual para todos e paga só na aquisição, continua sendo o único incentivo financeiro?", "escolha",
  ["Manter a regra única só na aquisição; o reconhecimento não monetário que você já adotou basta",
   "Meio-termo: dinheiro igual para todos, e o que varia por tipo de parceiro é o não monetário (acesso, palco, apoio), revendo a regra depois de dois trimestres com dados de permanência",
   "Seguir os livros: somar à regra única um bônus pequeno e igual para todos quando o cliente indicado completa 12 meses"],
  ["CT:comissao", "F:comissao", "1.4.2"],
  ["A sua decisão: comissão por regra única, sem exceção (40% da primeira mensalidade na Wise Makers e na Tríade, 6% do projeto na Swallow). Simplicidade para não reduzir a adesão.",
   "Cinco livros discordam em pontos diferentes. Referral Engine e Business of Belonging: dinheiro é a motivação mais fraca para indicar e troca a norma social pela de mercado. O Método Octo: modelos baseados só em comissionamento podem ser limitantes. Strategic Alliances: além da comissão, premiar comportamento, como permanência do parceiro e frequência. Platform Revolution: o efeito de preço some quando o incentivo acaba.",
   "Dois livros apoiam a sua decisão em parte. Bech: regra de comissão simples e estável, sem mudar com frequência. Referral Engine: separar dinheiro de abordagem, com o dinheiro único e a abordagem variando por tipo. Na Rodada 3 você adotou reconhecimento por status, rede e acesso, separado da comissão. Isso já resolve metade da divergência. O que sobra é a comissão premiar só a aquisição, e não a permanência do cliente."],
  "A comissão paga a entrada do cliente; o programa quer também que ele fique, porque cliente que fica baixa o CAC real. Um bônus de permanência igual para todos mantém a regra única e alinha o incentivo ao LTV. Variar o não monetário mantém o dinheiro intocado.",
  [VP(RE, 4), VP(BB, 10), F(PP, 3, 1), B("strategic-alliances", "Além da comissão"), B("bech-partner-channels", "Manter a regra de comissão")], "ct_comissao", "Meio-termo")

Q("ct_closer", B1, "Como você fica sabendo que uma oportunidade mudou de etapa, para devolver ao parceiro, se o closer não registra nada?", "escolha",
  ["O portal avisa quando a oportunidade fica 15 dias sem etapa nova, e só aí eu pergunto ao closer (exceção)",
   "Combino com cada closer um aviso curto por WhatsApp a cada etapa, sem portal",
   "As duas coisas: o aviso do closer quando acontece e o alerta do portal quando nada acontece",
   "Manter como está: falo com o closer só quando há indicação ou proposta nova"],
  ["CT:closer", "6.2", "6.3"],
  ["A sua decisão: o lead vai direto ao closer da empresa do grupo, sem SLA e sem sistema para ele, e você conversa com o closer quando há indicação ou proposta nova. Na Rodada 3 você também aprovou devolver ao parceiro cada mudança de etapa.",
   "Aí está a divergência: para devolver cada etapa, alguém precisa saber que a etapa mudou. Referral Engine diz para fechar o ciclo com quem indicou em cada fase, não só no fechamento. Give and Take: quem dá se esgota quando não vê o impacto do que deu. Channel Advantage: cada passagem de bastão precisa de dono, prazo e registro. Customer Success: todo sinal precisa virar ação com dono e prazo.",
   "Nenhum livro exige que o closer entre no portal. Pedem só que o parceiro nunca fique sem notícia. Um combinado leve com os closers e um alerta de oportunidade parada cumprem isso sem criar SLA nem reunião."],
  "Sem uma fonte para a etapa, a promessa de fechar o ciclo vira esforço de memória. O alerta de oportunidade parada transforma o silêncio em exceção na sua fila, que é o princípio que você já aprovou.",
  [VP(RE, 6), VP(GT, 5), B("channel-advantage", "Documentar cada passagem"), VP(CS, 2)], "ct_closer", "As duas coisas")

Q("ct_pilares", B1, "Os três pilares seguem abertos para todos, ou a Base Ativa começa com poucos parceiros-piloto?", "escolha",
  ["Manter: Prateleira, Base Ativa e indicações abertas para todos desde o primeiro parceiro",
   "Meio-termo: os três abertos, mas a Base Ativa só com 2 ou 3 parceiros-piloto até virar um formato que se repete",
   "Meio-termo por parceiro: cada um começa pela porta que escolher e abre a próxima depois do primeiro valor",
   "Os dois meio-termos juntos"],
  ["CT:pilares", "F:oferta", "7.4"],
  ["A sua decisão: os três pilares entram juntos desde o primeiro parceiro. Na Rodada 3 você aprovou que o portão de fase controla o ritmo de escala (parceiros, categorias, regiões), não a abertura dos pilares.",
   "Cinco livros dizem para provar valor numa escala pequena antes de abrir tudo. Keystone: liquidez em escala pequena antes de investir para escalar. Business of Belonging: comece pequeno e faça o que não escala. Winning the Right Game: o ecossistema mínimo viável é a menor configuração que gera evidência para atrair o próximo parceiro. O Método Octo: a primeira versão do programa é um teste controlado com poucos participantes. Nearbound: não ative todos de uma vez, isso decepciona os primeiros.",
   "O pilar mais pesado é a Base Ativa: 12 semanas, 6 encontros e um evento por ciclo. Com um Gerente só, abrir a Base Ativa para todos pode consumir as horas que deveriam ir para ativar parceiros. Prateleira e indicação custam pouco por parceiro."],
  "O meio-termo mantém a sua decisão comercial (os três pilares existem e são oferecidos) e aplica a regra dos livros só onde o custo de servir é alto. Quando a Base Ativa tiver um formato que se repete, abre para todos.",
  [VP(KS, 4), VP(BB, 2), B("winning-the-right-game", "Definir o MVE"), F(PP, 3, 0), B("nearbound", "Ativar poucos parceiros")], "ct_pilares", "Os dois meio-termos juntos")

Q("ct_dono", B1, "Você continua dono de todas as tarefas sem limite, ou o programa ganha um teto de parceiros por pessoa e, na Tração, parceiros embaixadores que assumem parte dos rituais?", "escolha",
  ["Manter: eu sou dono de tudo, sem teto",
   "Dono único com teto: acima de um número de parceiros acompanhados de perto (calculado pelas horas), o parceiro passa ao atendimento pelo portal e pela comunidade",
   "Teto agora e, na Tração, o papel de parceiro embaixador, que conduz parte dos rituais da comunidade e da Base Ativa com roteiro pronto"],
  ["CT:dono", "PA:" + GP],
  ["A sua decisão: o Gerente de Parcerias é dono de todas as tarefas do portal, mesmo das executadas por outros.",
   "Aqui os livros se dividem. Apoiam você: o Método Octo, que prefere atividades centralizadas em poucas pessoas no início para encurtar o ciclo de aprendizado, e Customer Success, que pede um dono único para a retenção. Discordam: Business of Belonging, para quem distribuir controle com trilhos é o que permite escalar, e Give and Take, que descreve o doador que espalha o tempo em tudo e se esgota.",
   "Customer Success dá a ponte: dono único, mas com teto de clientes por gerente na atenção alta e o resto em atendimento um para muitos. É a atenção proporcional que você já aprovou, com um número."],
  "O teto transforma o limite das suas horas numa regra visível, em vez de uma sobrecarga silenciosa. O embaixador é o primeiro passo para o programa não depender de uma pessoa só, que é a robustez que a saúde do ecossistema mede.",
  [F(PP, 4, 0), VP(CS, 8), VP(CS, 3), VP(BB, 8), VP(GT, 9)], "ct_dono", "Teto agora e embaixador na Tração")

Q("ct_niveis", B1, "O parceiro entra já em Elite, Premium ou Select pela base de clientes que declara, ou todos entram no mesmo nível e sobem pelo resultado?", "escolha",
  ["Manter a especificação: nível de entrada pela faixa de clientes no ICP",
   "Seguir Bech: todos entram em Select e sobem na hora em que cumprem os requisitos do nível de cima",
   "Meio-termo: a faixa de clientes sugere o nível, mas o pacote do nível só abre depois da ativação"],
  ["CT:niveis", "4.2.1", "1.4.1"],
  ["A especificação 002 define o nível de entrada pela quantidade de clientes no ICP que o candidato declara: Elite com 50 ou mais, Premium de 15 a 49, Select abaixo de 15, ajustado pela nota de qualidade.",
   "Bech diz o contrário: começar com uma estrutura simples e diferenciar só quando o desempenho real se mostrar diferente. E alerta: com poucos parceiros, todos querem o nível de cima, e depois é preciso rebaixar quem não entrega, o que desgasta a relação. O Método Octo apoia três níveis como a forma mais simples, mas fala da estrutura, não de como se entra nela.",
   "A subida na hora, que você já aprovou, resolve o lado de quem entrega. A divergência é só sobre quem ainda não entregou nada."],
  "Nível por promessa dá benefício antes do valor; nível por resultado dá benefício depois. O segundo evita rebaixar e combina com o princípio de que o parceiro só conta quando ativa.",
  [B("bech-partner-channels", "Não abrir com níveis"), B("bech-partner-channels", "Com poucos parceiros"), F(PP, 3, 3)], "ct_niveis", "Meio-termo")

B2 = "O ritual com o Igor"
Q("painel", B2, "No painel da semana com o Igor, quais números entram? Escolha no máximo cinco.", "multipla",
  ["CAC do Wise Partners no trimestre e a tendência", "Parceiros ativos, novos e em risco", "Oportunidades abertas por etapa e as paradas há mais de 15 dias",
   "Clientes fechados e receita vinda de parceiros no trimestre", "Parceiros que mudaram de tipo no cubo nesta semana", "Distância do próximo portão de fase",
   "Desfechos devolvidos aos parceiros (quantas oportunidades tiveram retorno)", "Horas dedicadas ao programa na semana"],
  ["2.2|indicadores", "F:cac_leitura"],
  ["Você pediu um painel relativamente simples, com informação estratégica, que ao mesmo tempo deixe falar de cada caso. Por isso o ritual semanal virou Revisar o programa com o Igor: substitui a revisão com os closers e o resumo mensal, que saíram.",
   "A proposta tem duas partes. Em cima, poucos números estratégicos, os mesmos toda semana. O Método Octo conta que a Caju reduziu mais de 60 indicadores para 6 por fase, e recomenda não sobrecarregar o time com métricas. Embaixo, a lista de casos: cada parceiro que mudou de tipo, cada oportunidade parada e cada decisão pendente, com o histórico e a jogada sugerida, para vocês decidirem o próximo passo ali mesmo.",
   "Customer Success acrescenta o motivo do ritual: a retenção precisa de voz no topo e de métricas visíveis para quem decide. O painel dá isso ao Igor sem pedir aprovação criteriosa dele."],
  "Cinco números cabem numa tela e numa conversa de meia hora. O resto da conversa é caso a caso, que é onde as decisões de verdade acontecem.",
  [F(PP, 4, 4), F(PP, 4, 5), VP(CS, 8), VP(RE, 8)], "painel")

Q("igor_voz", B2, "O Igor aparece para os parceiros como a voz do programa, por exemplo abrindo o encontro trimestral?", "escolha",
  ["Sim, ele abre o encontro trimestral", "Sim, ele grava uma mensagem por trimestre", "Não, a voz do programa sou eu", "Não sei: perguntar ao Igor"],
  ["8.2.2"],
  ["Na Rodada 2 você decidiu que o Igor só assina, e na Rodada 3, que ele revê o programa com você toda semana. Falta um ponto que dois livros levantam: quem é a voz do programa para os parceiros.",
   "Referral Engine vê o dono da empresa como contador de histórias e guardião do sistema de indicação. Customer Success diz que o compromisso precisa vir de cima. Nenhum dos dois pede aprovação do Igor, só presença."],
  "Uma fala curta do Diretor por trimestre mostra aos parceiros que o programa tem peso na empresa, sem tirar nada da sua autonomia.",
  [VP(CS, 8), VP(RE, 10)], "igor_voz")

Q("triade", "A comunidade", "As formações internas do grupo Tríade ficam abertas a todos os parceiros ou são um acesso de reconhecimento?", "escolha",
  ["Abertas a todos os parceiros ativos", "Abertas a todos, com vagas reservadas para os destaques", "Acesso de reconhecimento: só para os destaques e os níveis de cima"],
  ["8.2.4|regras"],
  ["Você acrescentou na Rodada 3 o convite aos parceiros para as formações internas do grupo Tríade. Ele entrou no mapa como subprocesso de Cultivar a comunidade.",
   "Business of Belonging oferece duas leituras: pedir pouco no começo e aumentar o pedido conforme cresce o compromisso, e recompensar com acesso, que é norma social. Give and Take lembra que o acesso visível a quem dá incentiva os outros a dar."],
  "Aberto a todos fortalece o pertencimento e o conhecimento para indicar. Como reconhecimento, vira um dos acessos que a Rodada 3 adotou no lugar do dinheiro.",
  [VP(BB, 5), VP(BB, 10), VP(GT, 2)], "triade")

exec(open(BASE + "/ferramentas/tobe5_perguntas_nea.py").read())

_ordem = [B1, B2, B3, "A comunidade"]
FO4.sort(key=lambda q: _ordem.index(next(x["bloco"] for x in d["perguntas"] if x["id"] == q)))
fo4 = add("formularios", "FO", titulo="Rodada 4: onde os livros discordam das suas decisões", rodada=4, para=["PE-01"], canal="artifact", perguntas=FO4,
          introducao="Cada divergência mostra a sua decisão, o que os livros dizem e um meio-termo; a escolha é sua.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw",
          status="respondido", respondido_por=["PE-01"], respostas_recebidas=1, enviado_em="2026-11-01", prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO4: q["formulario"] = fo4
d["historico"].append({"data": HOJE, "evento": "Rodada 4 respondida: sete divergências entre livros e decisões resolvidas; painel da semana, voz do Igor, formações da Tríade e práticas de Never Eat Alone confirmados"})
