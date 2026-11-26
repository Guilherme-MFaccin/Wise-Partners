# To-be v17 (26/11/2026): entrada única pela página do portal. Uma página e um formulário para qualquer empresa; todo
# cadastro avisa o gerente da comunidade com o perfil declarado; ele confere quem é e adiciona. Para o cliente do grupo,
# a primeira tela é a Comunidade (o catálogo), depois as outras opções.
H17 = "2026-11-26"
_ev17 = {}
def U17(k, trecho):
    if k not in _ev17:
        _ev17[k] = ev_raw("entrevista", "Pedido do patrocinador no Claude Code, 26/11/2026", trecho, "Conversa de 26/11/2026, " + k, pessoa="PE-01", data=H17)
    return _ev17[k]

EV_BENEFICIO = U17("beneficio", "No caso dos clientes do grupo Tríade, o maior benefício que eles teriam dentro do portal Wise Partners seria a comunidade Wise Partners. "
    "Isso quer dizer, conseguir contratar serviços de outras empresas que estão no ecossistema com um preço descontado e, ao mesmo tempo, publicar os seus serviços, produtos ali dentro.")
EV_PRIMEIRA = U17("primeira_tela", "Então, a primeira tela tem que ser isso daí, como se fosse uma página mesmo, que ele entrasse e conseguisse ver todo o catálogo. "
    "E depois, todas as outras opções, para poder indicar a Wisemakers, para poder ter acesso às notificações de como, se existem propostas vindas para ele através do portal")
EV_HIERARQUIA = U17("hierarquia", "Tudo isso que eu estou falando já está construído. A única coisa que tem que fazer é estruturar hierarquicamente.")
EV_ENTRADA = U17("entrada", "Outra questão lógica que temos que fazer para a jornada do cliente do grupo Tríade é tentar simplificar e fazer realmente como está proposto, "
    "que é entrar através da landing page do portal Wise Partners. Diretamente a landing page do parceiro.")
EV_VIDEO = U17("video", "especialmente o vídeo que nós gravamos do Igor falando sobre o portal. Ele está específico para empresas de software. Temos que deixar isso abrangente para qualquer tipo de parceiro.")
EV_FORM = U17("formulario", "temos que fazer um cadastro, um formulário para qualquer pessoa se cadastrar ali. E independente do que a pessoa responder dentro desse formulário, "
    "vai chegar uma notificação dentro do portal Wise Partners para mim, no caso que eu sou gerente da comunidade, e vou verificar quem que é a pessoa. "
    "Se ele indicar ali que já é um cliente do grupo Tríade, vai aparecer como cliente do grupo Tríade dentro da notificação para mim. "
    "E eu vou confirmar se efetivamente é um cliente e depois eu vou adicioná-lo. Isso serve para qualquer tipo de categoria.")
EV_ABRANGENTE = U17("abrangente", "Caso eventualmente seja efetivamente um cliente do grupo Tríade, talvez ele não tenha interesse em vender o serviço da Wisemakers, "
    "estruturação comercial, para os clientes dele, como, por exemplo, se faz um CRM. Mas ele vai se beneficiar com outras coisas do portal Wise Partners, "
    "como, por exemplo, o catálogo, onde ele pode apresentar os produtos dele ou os serviços dele, etc.")
PX17 = {p["id"]: p for p in d["processos"]}

ent = PX17[P_ENTRADA]
ent["nome"] = "Receber o cadastro pela página do portal"
ent["descricao"] = ("Qualquer empresa conhece o Wise Partners pela página do portal, que fala com clientes do Grupo Tríade, com quem quer ser parceiro e com quem "
    "quer conhecer o ecossistema, e se cadastra no mesmo formulário: a empresa, a relação com o grupo (se é cliente e de qual empresa) e o que quer no portal. "
    "Todo cadastro entra na fila e avisa o gerente da comunidade, com o perfil declarado no aviso. Ele confere quem é e adiciona: como cliente do grupo, "
    "como empresa da comunidade ou, depois da conversa de entrada, como parceiro. O acesso sai com senha provisória, pelo WhatsApp.")
ent["gatilho"] = "Empresa que enviou o cadastro na página do portal"
ent["dono"] = GP
ent["portal"] = ("é a página /parceiros (Entrar e Cadastrar no menu, formulário único), a fila em Cadastros, com o perfil declarado e a ação Adicionar "
    "(cliente do grupo, empresa da comunidade ou parceiro), e o aviso ao gerente; /comunidade leva à mesma página.")
ent["evidencias"] += [EV_ENTRADA, EV_FORM]
ent["fluxo"] = FL("""i1 i L Empresa enviou o cadastro na página do portal
        t1 s G Pôr o cadastro na fila e avisar o gerente com o perfil declarado
        t2 t G Conferir quem é a empresa
        g1 d G O que a empresa é?
        t3 t G Confirmar o contrato com a empresa do grupo
        t4 s G Adicionar como cliente do grupo
        t5 s G Adicionar como empresa da comunidade
        t6 s G Seguir a conversa de entrada do parceiro
        t7 s G Mandar o acesso pelo WhatsApp
        f1 f L Empresa no portal""", links="i1>t1>t2>g1; g1:Cliente do grupo>t3>t4>t7; g1:Empresa sem vínculo>t5>t7; g1:Quer ser parceiro>t6>t7; t7>f1")
ent["fluxo"]["status"] = "declarado"; ent["fluxo"]["evidencias"] = [EV_FORM]

vin = PX17[P_VINCULO]
vin["nome"] = "Confirmar o cliente do grupo"
vin["descricao"] = ("Quem diz no cadastro que é cliente de uma empresa do grupo aparece para o gerente como cliente do Grupo Tríade. O gerente confere o contrato "
    "e adiciona a empresa como cliente: a primeira tela dela passa a ser a Comunidade, com as condições, as próprias ofertas e os pedidos. "
    "Se não for cliente, ela entra como empresa da comunidade. O cadastro do cliente pela CS da Tríade ou pelo consultor também confirma.")
vin["portal"] = "é a ação Adicionar da fila de cadastros, com a empresa do grupo escolhida; Comunidade, Empresas mostra quem entrou."
vin["evidencias"] += [EV_FORM]

hub = PX17[P_HUB]
hub["descricao"] += (" Para o cliente do grupo, o maior benefício é a comunidade: contratar das outras empresas com desconto e publicar os próprios produtos e "
    "serviços, sem precisar vender a consultoria da Wise. A primeira tela dele é a Comunidade, como uma página; depois vêm Indicar a Wise Makers, "
    "Conhecer a Wise Makers e Notificações.")
hub["evidencias"] += [EV_BENEFICIO, EV_PRIMEIRA, EV_ABRANGENTE]

for texto, evs in [
    ("A entrada de qualquer empresa é pela página do portal Wise Partners (/parceiros), com Entrar e Cadastrar; não há uma página separada da comunidade.", [EV_ENTRADA]),
    ("Um formulário só, para qualquer empresa. Todo cadastro avisa o gerente da comunidade com o perfil declarado; ele confere quem é e adiciona. Ninguém recebe acesso na hora.", [EV_FORM]),
    ("A página do portal conta os benefícios para qualquer empresa: o cliente do grupo aproveita o catálogo e a vitrine para os próprios produtos, mesmo sem vender a consultoria.", [EV_ABRANGENTE, EV_BENEFICIO]),
    ("Para o cliente do grupo, a primeira tela é a Comunidade, como uma página com todo o catálogo; depois vêm indicar a Wise Makers, os pedidos recebidos e as notificações.", [EV_PRIMEIRA, EV_HIERARQUIA]),
    ("O vídeo do Igor no topo da página precisa ser geral, para qualquer tipo de empresa, e não só para empresas de software.", [EV_VIDEO]),
]:
    add("decisoes", "DE", data=H17, texto=texto, por="PE-01", provisoria=False, evidencias=evs)

# As decisões provisórias de 23/11 sobre conta na hora e página da comunidade caem; as demais seguem
for de in d["decisoes"]:
    if de.get("data") == H16 and de.get("provisoria") and (de["texto"].startswith("Cliente do grupo declarado no cadastro vê")
                                                            or de["texto"].startswith("A raiz do portal")):
        de["provisoria"] = False; de["por"] = "PE-01"
        de["texto"] = de["texto"] + " (Substituída em 26/11/2026: o cadastro entra na fila e o gerente confere antes de dar o acesso; a raiz abre a página do portal.)"
        de.setdefault("evidencias", []).append(EV_FORM)
        for q in d["perguntas"]:
            if q["id"] == de.get("pergunta"):
                q["status"] = "respondida"; q["respostas"] = [EV_FORM]; q["respondida_por"] = ["PE-01"]
for de in d["decisoes"]:
    if de.get("data") == H16 and de["texto"].startswith("O cadastro na comunidade pergunta o necessário"):
        de["texto"] += " (Em 26/11/2026: o cadastro passa a ser o formulário único da página do portal, sem conta na hora.)"
        de["evidencias"].append(EV_FORM)

d["historico"].append({"data": H17, "evento": "To-be v17: entrada única pela página do portal. Um formulário para qualquer empresa, aviso ao gerente com o perfil declarado, conferência e adição (P-106 e P-107 refeitos); Comunidade como primeira tela do cliente do grupo; vídeo geral a regravar; canvas atualizado."})
print("v17: entrada única;", P_ENTRADA, P_VINCULO)
