# To-be v13 (20/11/2026): revisão do portal pedida pelo patrocinador.
# "não vamos fazer uma landing page adaptada para cada parceiro. Vamos fazer uma landing page unica geral para todos, sem citar ninguém";
# controle das páginas pelo portal; tarefas como fila; navegação simplificada sem contradizer processos e canvas.
H13 = "2026-11-20"
EV_PORTAL = ev_raw("entrevista", "Mensagem do patrocinador na sessão de trabalho (20/11/2026)",
    "Não vamos fazer uma landing page adaptada para cada parceiro. Vamos fazer uma landing page unica geral para todos, sem citar ninguém. "
    "Isso serve para a landing page do parceiro e a landing page do cliente do parceiro. [...] não tenho controle nenhum das páginas nem do parceiro "
    "nem do cliente do parceiro. [...] A aba de tarefas está horrível como estava antes. [...] Ficaram muitas abas. [...] Mantenha as funções, mas deixe "
    "toda a estrutura e arquitetura do portal do wise partners coerente com uma hierarquia organizada, equilibrada.",
    "Sessão de trabalho, revisão do portal", pessoa="PE-01", data=H13)
PX13 = {p["id"]: p for p in d["processos"]}

def ajustar(pid, portal=None, descricao_troca=None, extra=None):
    p = PX13[pid]
    if portal is not None: p["portal"] = portal
    if descricao_troca:
        for a, b in descricao_troca: p["descricao"] = p.get("descricao", "").replace(a, b)
    if extra: p["descricao"] = (p.get("descricao", "").rstrip() + " " + extra).strip()
    if EV_PORTAL not in p.setdefault("evidencias", []): p["evidencias"].append(EV_PORTAL)

PAGINA_UNICA = ("A página do cliente é única e geral, igual para todos os parceiros, sem nome, logo ou marca de nenhum deles; "
                "o link exclusivo de cada parceiro só atribui o cadastro a quem mandou.")
ajustar("P-27", portal="gera o link exclusivo e os acessos; a página do cliente é a mesma para todos.",
        descricao_troca=[("a página do cliente com a logo do parceiro", "o link exclusivo para a página do cliente")], extra=PAGINA_UNICA)
ajustar("P-75", portal="gera o link exclusivo e a mensagem pronta na tela Indicar do parceiro; a página que abre é a página única do cliente.", extra=PAGINA_UNICA)
ajustar("P-96", portal="é a tela Programa, Páginas: o Gerente edita os textos de cada bloco, liga e desliga seções, as perguntas frequentes, o vídeo, os valores e o perfil da reunião, e publica ou tira do ar; o link exclusivo de cada parceiro só atribui o cadastro.",
        extra=PAGINA_UNICA + " Os textos, as seções, as perguntas frequentes, o vídeo e os valores são editados pelo portal, sem depender de desenvolvimento.")
ajustar("P-98", portal="é a tela Programa, Páginas (página dos parceiros, única, para qualquer categoria) e a tela Candidatos, Origens e campanha (funil por origem até a ativação).",
        extra="A página dos parceiros é única e fala com empresas de qualquer categoria que vendem para empresas, não só com software.")
ajustar("P-101", portal="registra a origem de cada candidato e mostra em Candidatos, Origens e campanha quantos chegam a parceiro ativo por origem.")
ajustar("P-21", portal="é a tela Candidatos, Fila de cadastros, com a situação, a observação e os botões de WhatsApp, agenda e aprovação; quem está na fila sem contato aparece em Tarefas.")
ajustar("P-25", portal="mostra em Tarefas o candidato contatado há mais de 2 dias sem resposta.")
ajustar("P-100", portal="guarda os cases numa tabela só (Programa, Páginas, Cases), usada pelas duas páginas e pelo kit; a média em destaque é calculada a partir deles.")
ajustar("P-09", portal="é a tela Tarefas: uma fila única gerada pelas regras, em três grupos (decidir, responder, acompanhar) e três faixas de urgência (agora, esta semana, quando der); cada item diz o que fazer, de quem é, há quanto tempo espera e se resolve ali mesmo ou abre o lugar certo. O que segue a regra não aparece.")
ajustar("P-95", portal=PX13["P-95"].get("portal", "") + " A tela Oportunidades, Diagnósticos mostra cada cliente pela etapa (cadastrado, agenda enviada, reunião marcada, reunião feita, plano enviado), com quem conduz, a data da reunião e o registro do plano; o plano atrasado aparece em Tarefas.")
ajustar("P-60", portal="é o próprio processo. A navegação segue a cadeia de valor em seis seções com poucas abas cada: Tarefas, Candidatos, Parceiros, Oportunidades, Resultados e Programa; a área do parceiro tem cinco: Início, Oportunidades, Aprender, Minha parceria e Comunidade.")

for g in d.get("glossario", []):
    if g.get("termo") == "Diagnóstico do cliente do parceiro":
        g["definicao"] = ("Reunião gratuita de cerca de 2 horas com a equipe da Wise (Gerente ou consultor), só para empresas no perfil (3 vendedores ou mais e R$ 250 mil "
                          "por mês), pela Matriz de Governança Comercial 5x5, que termina mostrando o Wise Hub; o plano de ação sai em até 2 dias úteis. Valor de referência "
                          "R$ 2.000, mais R$ 3.000 do Wise Hub. Quinta porta de oportunidade.")
        g.setdefault("evidencias", []).append(EV_PORTAL)

for texto in [
    "As duas páginas públicas (a dos parceiros e a do cliente do parceiro) são únicas e gerais, sem citar nenhum parceiro. O link exclusivo do parceiro só atribui o cadastro.",
    "O patrocinador controla as duas páginas pelo portal (Programa, Páginas): textos, seções, perguntas frequentes, vídeo, valores, cases e publicação.",
    "Tarefas é uma fila única de exceções; o portal se organiza em seis seções pela cadeia de valor, cada uma com poucas abas, mantendo todas as funções.",
]:
    add("decisoes", "DE", data=H13, texto=texto, por="PE-01", provisoria=False, evidencias=[EV_PORTAL])
d["historico"].append({"data": H13, "evento": "To-be v13: páginas públicas únicas sem citar o parceiro e controladas pelo portal; tarefas como fila de exceções; navegação do portal em seis seções pela cadeia de valor (P-09, P-21, P-25, P-27, P-60, P-75, P-95, P-96, P-98, P-100, P-101 e glossário do diagnóstico)."})
print("v13: portal revisado")
