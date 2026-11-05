# Conversa com o Igor em 04/11/2026 (executado dentro de tobe6_base.py).
# A transcrição é automática, parcial e não separa quem fala; por isso tudo o que vem dela entra como hipótese
# e só vira desenho com a resposta do patrocinador na Rodada 6.
_TR = re.sub(r"\s+", " ", open(BASE + "/fontes/reunioes/2026-11-04-igor.md", encoding="utf-8").read())
def R(gravacao, tempo, trecho):
    t = re.sub(r"\s+", " ", trecho)
    assert t in _TR, f"Trecho não está na transcrição: {t[:80]}"
    k = ("r", t)
    if k not in _cache:
        _cache[k] = ev_raw("entrevista", "Reunião Guilherme e Igor, 04/11/2026 (transcrição automática parcial)", trecho, f"Gravação {gravacao}, {tempo}")
    return _cache[k]

# ---------------------------------------------------------------- fatos novos (hipóteses)
fato("valor_saas", "proposta_de_valor", "Para parceiros de software de gestão (CRM, ERP e afins), o valor central da Wise é a retenção da base deles: o cliente com processo comercial bom usa melhor o software e continua pagando. Por isso a entrega da Wise passa a fazer parte do processo do parceiro, e não fica só como indicação.",
     "hipotese", [R(2, "07:20", "O problema que a gente resolve para o nosso parceiro é ele ter uma base de clientes que depende do software dele, mas para que eles mantenham o contrato com o software deles, eles precisam de uma eficiência comercial."),
                  R(2, "08:48", "O que a gente entrega tem que fazer parte do processo dele."), VP(KS, 1), VP(RE, 11)])
fato("diagnostico_oferta", "oferta", "Entregável padrão para o parceiro oferecer aos clientes dele: reunião de diagnóstico comercial gratuita, de 40 a 60 minutos, que termina com um mapa de planejamento; depois do diagnóstico, o cliente ganha acesso ao Wise Hub. O diagnóstico é a quinta porta de oportunidade do programa.",
     "hipotese", [R(2, "10:31", "Todo cliente dele fazendo diagnóstico conosco para poder fazer uma avaliação da operação."),
                  R(2, "14:50", "A gente oferecer uma reunião de diagnóstico de graça pra cada cliente."), VP(CS, 4), VP(RE, 0)])
fato("hub_politica", "oferta", "O Wise Hub não é oferecido sozinho, como publicidade: plataforma de aulas sem contato gera pouco engajamento e perde valor. O acesso vem depois de um contato com a Wise (o diagnóstico ou o pacote B).",
     "hipotese", [R(2, "12:42", "Será que não ia desvalorizar demais o próprio Wise e Hammer se a gente fizesse isso para todo mundo?"),
                  R(2, "17:31", "só que eu acho que se ter só ela pra oferecer, eu acho que ele não vai gerar o nível de engajamento nos meus casos."), A("EV-0019")])
fato("pesquisa", "estrategia", "Campanha de lançamento até março: o diagnóstico é ligado ao projeto de pesquisa do Gerente sobre maturidade comercial e CRM, que precisa de 50 entrevistas de cerca de 40 minutos, e os parceiros convidam os clientes deles a participar, com o diagnóstico e o acesso ao Wise Hub como retorno.",
     "hipotese", [R(2, "17:31", "Eu preciso, daqui até mais ou menos março, entrevistar 50 empresas para o meu projeto de pesquisa"),
                  R(2, "23:47", "Uma por dia, em dois meses eu mato tudo."), R(2, "23:47", "eles tão ávidos, eles querem mesmo poder oferecer os nossos serviços pra eles")])
fato("comissao_diagnostico", "receita", "Cliente que contrata a Wise depois de um diagnóstico oferecido pelo parceiro conta como indicação do parceiro e gera a comissão da regra única.",
     "hipotese", [A("EV-0033"), D2("Q-0005"), R(2, "25:41", "porque é um possível cliente também pra gente")])
fato("foco_segmento", "parceiro", "Na fase de Experimentação, o recrutamento foca num segmento só: software de gestão para empresas (CRM e ERP à frente). Agências ficam fora porque concorrem com a Wise. O ecossistema continua pequeno: não é para milhares de parceiros.",
     "hipotese", [R(2, "03:12", "O SaaS, eu acho que é melhor. O SaaS de CRM."), R(2, "03:12", "Agência, Saqueagência, ProAge T11... eu acho que acaba concorrendo demais."),
                  R(1, "29:46", "Aí a gente foca, sei lá, ou agora pegar só, sei lá, software de gestão de manutenção."), R(2, "09:49", "O nosso talvez não vai ser escalado para 5 mil parceiros."),
                  B("ecosystem-economy", "Focar em um segmento")])
fato("categorias", "parceiro", "Categorias de parceiro e da Prateleira citadas na conversa. Comerciais: ERP, CRM, PCP, SST, ESG, EPM, consultoria de gestão, design, tecnologia digital, infraestrutura e data center, dados e ciência de dados, software de gestão de manutenção, automação industrial, qualidade e laboratório, eficiência energética, segurança da informação, comércio exterior e logística internacional, jurídico, tributário, contabilidade consultiva e RH. Institucionais: federações e confederações, Sistema S, institutos, associações comerciais e empresariais, associações setoriais, secretarias de indústria e comércio, sindicatos patronais, parques tecnológicos e universidades.",
     "hipotese", [R(2, "03:12", "ERP, CRM, PCP, SST, ESG, EPM, Consultoria de Gestão."), R(2, "04:40", "Secretaria de Indústria e Comércio de Desenvolvimento.")])
fato("escopo_portal", "recurso", "Primeira entrega do portal com o to-be: o núcleo pequeno que sustenta a operação, e o resto entra conforme o programa ganha liquidez.",
     "hipotese", [VP(KS, 4), B("platform-revolution", "Manter o núcleo do portal pequeno"), VP(CS, 10)])

# ---------------------------------------------------------------- processos novos (hipóteses)
proc("5.5", "Executar o plano de ativação de 90 dias", "M5", 5, "Ação de início logo depois do termo, para o parceiro sentir o valor antes de indicar: anúncio conjunto da parceria nos dois lados, treinamento curto de gestão comercial para o time dele e diagnóstico dos primeiros clientes dele; no segundo mês, divulgação à base do parceiro; no terceiro, encontro com a base e as primeiras oportunidades.",
     "monta o plano de 90 dias pelo pacote, cria as tarefas de cada mês e mostra ao parceiro o que já foi feito.", GP, "Termo assinado", ("Parceiro com o primeiro valor recebido", "P-5.4"), "Empresa parceira",
     [R(1, "00:03", "uma vez o onboard, é fazer o cara ganhar um dinheiro rápido."), R(1, "02:45", "Na vez de esperar 2, 3 meses, já conseguia pregar valor colocado desde o início."),
      R(1, "03:50", "fazer uma postagem conjunto que começou a parceria, fazer umas publicações sobre a parceria, sobre a Wise."), VP(CS, 4)],
     status="hipotese", part=[RESP_P], sist=[SI_POR, SI_WPP], freq="Uma vez por parceiro", principios=["primeiro_valor", "valor_antes"])
proc("6.9", "Conduzir o diagnóstico do cliente do parceiro", "M6", 9, "O cliente do parceiro marca pelo link do parceiro; a Wise faz a reunião de diagnóstico comercial, entrega o mapa de planejamento e libera o acesso ao Wise Hub; se o cliente quiser seguir, vira oportunidade com a origem no parceiro.",
     "recebe o agendamento pelo link do parceiro, registra o diagnóstico, libera o Hub e cria a oportunidade quando há interesse.", GP, "Cliente do parceiro marca o diagnóstico", ("Mapa de planejamento entregue", "EXT:Cliente do parceiro"), "Cliente do parceiro e parceiro",
     [R(2, "14:50", "A gente oferecer uma reunião de diagnóstico de graça pra cada cliente."), R(2, "24:48", "Pro próprio cara do time de CS"), VP(RE, 0)],
     status="hipotese", part=[RESP_P], sist=[SI_POR, SI_HUB], principios=["valor_antes", "interacao"], hipoteses=["regras"])
proc("11.4", "Manter o kit de convite ao diagnóstico", "M11", 4, "Página com vídeo explicando o diagnóstico gratuito, mensagem pronta para o parceiro enviar e agenda para o cliente marcar sozinho, sempre com o link do parceiro.",
     "gera a página e a mensagem com o link exclusivo do parceiro.", GP, "Parceiro novo ou mudança na oferta", ("Kit de convite publicado", "EXT:Parceiros"), "Parceiros",
     [R(2, "21:04", "A LP é uma oferta talvez bem agressiva."), R(2, "22:50", "fazer o vídeo com o canal LP pro David e eles são mandando link"), VP(RE, 5)],
     status="hipotese", principios=["ensinar"])
_p22 = next(x for x in d["processos"] if x["id"] == P["2.2"])
_p22["hipoteses"].append("acesso_do_diretor")
for _k in ("5.5", "6.9", "11.4"):
    _p = next(x for x in d["processos"] if x["id"] == P[_k])
    for _s in _p["saidas"]:
        if _s["para"].startswith("P-") and _s["para"][2:] in P:
            _s["para"] = P[_s["para"][2:]]
            _dest = next(x for x in d["processos"] if x["id"] == _s["para"])
            _dest["entradas"].append({"nome": _s["nome"], "de": _p["id"]})
    _p["fluxo_dispensado"] = f"{DE_FLUXO}: hipótese da conversa de 04/11; o passo a passo vem depois da Rodada 6"
