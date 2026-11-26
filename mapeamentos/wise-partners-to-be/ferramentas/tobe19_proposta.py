# To-be v19 (26/11/2026): proposta comercial da Wise Makers integrada ao programa. Diagnóstico gratuito igual ao de antes,
# com o plano para 6 meses; jornada paga opcional (mês 1 guiado, mês 2 Plano de Tração, continuidade mensal); comissão por
# tipo de venda; prova só com empresas B2B.
H19 = "2026-11-26"
PDF19 = "Proposta comercial: Método Wise Makers, Programa de Estruturação Comercial (PDF de 14 páginas)"
def DOC19(trecho, local):
    return ev_raw("documento", PDF19, trecho, local, data=H19)
def U19(trecho, local):
    return ev_raw("entrevista", "Respostas do patrocinador no Claude Code, 26/11/2026", trecho, local, pessoa="PE-01", data=H19)

EV_JORNADA = DOC19("Diagnóstico gratuito, O Plano · mês 1, Plano de Tração · mês 2, Continuidade · meses 3 a 6", "página 1")
EV_PRECOS = DOC19("O Plano · Mês 1 · 4 de 2h · R$ 4.997 · Plano de Tração · Mês 2 · +4 de 2h · + R$ 4.997 · Continuidade · Meses 3 a 6 · 2 por mês, de 3 a 4h · R$ 3.997/mês", "página 13, Investimento")
EV_CONDICAO = DOC19("Condição exclusiva para clientes [Seu CRM]: O Plano sai por R$ 4.997 (valor de tabela R$ 7.000). Pagamento à vista ou parcelado.", "página 13")
EV_MES2 = DOC19("05 Metas, da meta da empresa à atividade de cada vendedor; 06 Comissão e bônus; 07 Playbook, scripts, objeções e cadências do time; 08 Reativação, campanha na base de clientes inativos", "página 8, Etapa 2")
EV_CONT = DOC19("01 Leitura dos indicadores; 02 Gestão do time; 03 Aquisição e canais; 04 Retenção e base", "página 9, Etapa 3")
EV_INCLUSO = DOC19("Comunidade Wise Makers: treinamentos ao vivo quinzenais; Formação de gestores: treinamentos quinzenais; Plataforma Wise: +100 aulas sobre estruturação comercial", "página 10")
EV_INDICADORES = DOC19("Atividade do time; Oportunidades no funil; Funil atualizado: negócios parados há mais de 15 dias; Conversão por etapa; Tempo de resposta; Previsão de vendas", "página 11")
EV_40B2B = DOC19("+40 empresas estruturadas. Indústrias e empresas B2B de Maringá e região que decidiram crescer com método.", "página 12")
EV_OFERTA = U19("O diagnóstico que está falando na proposta será exatamente o que já oferecíamos antes, que custava R$5.000,00 e estamos dando de graça. "
    "Um detalhe, caso não tivesse dessa forma antes, vamos precisar fazer o planejamento do diagnóstico gratúito para os 6 meses seguintes e não 12 meses. "
    "Se o cliente quiser que façamos um acompanhamento guiado em 4 seções semanais de 2h cada, podemos fazer com um valor descontado de R$4.997,00 para "
    "estruturarmos as ferramentas e treinar a equipe dentro do plano que já tínhamos e dar uma perspectiva de 12 meses. Para um acompanhamento de mais um mês "
    "o valor fica mais R$4.997,00 e vamos fazer tudo aquilo que está falando na proposta que vamos fazer no segundo mês. Do terceiro mês em diante, fazemos "
    "um plano mensal para seguirmos com a consultoria, como está na proposta", "Resposta sobre a oferta")
EV_COMISSAO = U19("Vamos fazer 6% de todas as vendas pontuais (1 ou 2 meses) e 40% da primeira mensalidade no contrato de consultoria contínuo. "
    "Leve em consideração que os 6% de venda pontual são os mesmos da venda de um produto da Swallow. 1,5% fica para o gerente de parcerias", "Resposta sobre a comissão")
EV_NUMEROS = U19("Usar +40 empresas B2B (Recomendado)", "Resposta sobre os números de prova")
EV_B2C = U19("Existe um erro com relação aos clientes da Wise e preciso que você desconsidere esta informação: Chamego não é total b2b, totonho e cristal é b2c. "
    "Resposta: Tirar da prova B2B (Recomendado)", "Correção e resposta sobre os cases")
PX19 = {p["id"]: p for p in d["processos"]}

def anexa(pid, texto, portal=None, evs=()):
    p = PX19[pid]
    p["descricao"] = (p.get("descricao") or "").rstrip() + " " + texto
    if portal: p["portal"] = portal
    p.setdefault("evidencias", []).extend(evs)

anexa("P-95", "Desde 26/11/2026 (proposta comercial), o diagnóstico gratuito é o mesmo de antes (valor de referência de R$ 5.000), com o plano de ação para os "
    "próximos 6 meses. Na devolutiva, o consultor apresenta o caminho recomendado e a jornada opcional: mês 1 de acompanhamento guiado (4 encontros semanais "
    "de 2 horas, R$ 4.997 em vez de R$ 7.000 para quem chegou pelo parceiro), mês 2 Plano de Tração (mais 4 encontros, mais R$ 4.997) e, do mês 3 em diante, "
    "o plano mensal de continuidade (R$ 3.997).", evs=[EV_OFERTA, EV_JORNADA, EV_CONDICAO])
anexa("P-33", "O closer apresenta a jornada da proposta comercial e registra na indicação o que o cliente comprou: a venda pontual (mês 1, ou mês 1 e mês 2) e, "
    "se houver, a primeira mensalidade do contrato contínuo, cada uma com a data de compensação.",
    portal="registra para quem foi o lead e quando, e na indicação da Wise a venda pontual e o contrato contínuo, cada um com a sua compensação.", evs=[EV_PRECOS, EV_COMISSAO])
anexa("P-38", "A Wise paga duas comissões possíveis por cliente: 6% das vendas pontuais (1 ou 2 meses) e 40% da primeira mensalidade do contrato contínuo, cada uma "
    "depois que o pagamento do cliente compensa.", portal="calcula cada parcela (venda pontual e contrato contínuo) e avisa o financeiro quando o pagamento compensa.",
    evs=[EV_COMISSAO])
anexa("P-62", "Regra da Wise desde 26/11/2026: venda pontual da consultoria (mês 1, ou mês 1 e mês 2), 6% ao parceiro e 1,5% ao gerente de parcerias, como na "
    "Swallow; contrato contínuo, 40% ao parceiro e 10% ao gerente sobre a primeira mensalidade.",
    portal="guarda as duas regras da Wise (pontual e contínuo) em Regras e configurações e calcula cada comissão sozinho.", evs=[EV_COMISSAO])
anexa("P-100", "Só entram como prova empresas B2B: Chamego (não é totalmente B2B), Totonho (B2C) e Cristal Móveis (B2C) saíram dos cases e do depoimento em 26/11/2026. "
    "O número de prova da Wise passa a ser o da proposta: mais de 40 indústrias e empresas B2B estruturadas.", evs=[EV_B2C, EV_40B2B, EV_NUMEROS])

for texto, evs in [
    ("O diagnóstico gratuito continua o mesmo (reunião, plano de ação e Wise Hub, valor de referência de R$ 5.000), com o plano para os próximos 6 meses, e não 12.", [EV_OFERTA]),
    ("Depois do diagnóstico, a jornada opcional da proposta comercial: mês 1 de acompanhamento guiado, 4 encontros semanais de 2 horas, por R$ 4.997 em vez de R$ 7.000, para estruturar as ferramentas, treinar a equipe dentro do plano e dar a perspectiva de 12 meses.", [EV_OFERTA, EV_CONDICAO]),
    ("Mês 2, Plano de Tração: mais 4 encontros e mais R$ 4.997, com metas, comissão e bônus, playbook e reativação da base.", [EV_OFERTA, EV_MES2]),
    ("Do mês 3 em diante, plano mensal de continuidade, como na proposta: 2 encontros por mês, de 3 a 4 horas, por R$ 3.997 por mês.", [EV_OFERTA, EV_PRECOS, EV_CONT]),
    ("Comissão da Wise ao parceiro: 6% das vendas pontuais (1 ou 2 meses), como na Swallow, com 1,5% para o gerente de parcerias; 40% da primeira mensalidade do contrato contínuo, com 10% para o gerente.", [EV_COMISSAO]),
    ("O número de prova é mais de 40 indústrias e empresas B2B estruturadas; sai o de 300 empresas e 1.500 vendedores.", [EV_NUMEROS, EV_40B2B]),
    ("Chamego, Totonho e Cristal Móveis não entram como prova B2B: saem dos cases ativos e do depoimento em vídeo.", [EV_B2C]),
]:
    add("decisoes", "DE", data=H19, texto=texto, por="PE-01", provisoria=False, evidencias=evs)

def pergunta19(texto, recomendo, opcoes=()):
    add("perguntas", "Q", texto=texto, tipo="escolha" if opcoes else "aberta", opcoes=list(opcoes), alvo=["P-62"], para=["PE-01"], rodada=15, bloco="Proposta comercial",
        status="aberta", formulario=None, respostas=[], respondida_por=[], chave="pendente-v19", contexto=[], logica="", citacoes=[], visual="", recomendo=recomendo)
pergunta19("O gerente de parcerias fica com 1,5% também nas vendas da Swallow, hoje com 2%?", "Sim, se a regra das vendas pontuais for a mesma da Swallow.",
           ("Sim, 1,5% também na Swallow", "Não, a Swallow continua com 2%"))
pergunta19("A Comunidade Wise Makers da proposta (treinamentos ao vivo quinzenais para quem contrata) é diferente da Comunidade Wise Partners do portal. Os nomes ficam assim?",
           "Manter os dois, explicando no minicurso que uma é a turma de clientes da consultoria e a outra é o ecossistema de negócios.")
pergunta19("A Plataforma Wise da proposta (+100 aulas) é o mesmo Wise Hub que o diagnóstico gratuito libera?", "Confirmar o nome único para usar nas páginas e no minicurso.")

d["historico"].append({"data": H19, "evento": "To-be v19: proposta comercial integrada. Diagnóstico gratuito com plano de 6 meses; jornada opcional (mês 1 guiado R$ 4.997 em vez de R$ 7.000, mês 2 Plano de Tração R$ 4.997, continuidade R$ 3.997 por mês); comissão por tipo de venda (6% e 1,5% no pontual, 40% e 10% no contínuo); prova só B2B (+40 empresas; Chamego, Totonho e Cristal fora); P-33, P-38, P-62, P-95 e P-100 atualizados; canvas e calculadora refeitos."})
print("v19: proposta comercial")
