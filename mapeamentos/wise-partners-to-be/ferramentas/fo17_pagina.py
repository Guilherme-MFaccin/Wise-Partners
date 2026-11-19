# FO-17: validar o quadro de modelo de negócio (separado do mapa) e fechar a contradição dos níveis, a comissão do parceiro e os valores reais da conta.
import json, os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from modelo_negocio_dados import CANVAS, CONTA, VPC_CLIENTE, COMUM, CATEGORIAS, CANAIS, FASES, HIPOTESES

BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-17/formulario.html"
QUADRO = "https://claude.ai/artifact/JG7tRMHV3LCo7mcRz5jmHV"
ITENS = []
def item(iid, bloco, texto, selo, cls, secoes, opcoes, tipo="escolha"):
    ITENS.append({"id": "MN-" + iid, "bloco": bloco, "texto": texto, "selo": selo, "cls": cls, "secoes": [s for s in secoes if s and s.get("v")], "opcoes": opcoes, "tipo": tipo})
AP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"]
TAG = {"D": "Já decidido por você", "P": "Proposta da revisão", "F": "Fonte documental"}

# ---------------------------------------------------------------- o que precisa da sua decisão
G0 = "Decisões em aberto"
item("niveis", G0, "Qual é a ordem e o critério de cada nível?", "Contradição a resolver", "aberto", [
    {"t": "O que estava aprovado (FO-14)", "k": "kv", "v": [["Select", "Entrada de todos."], ["Premium", "60 dias no programa e, além disso, 3 clientes fechados ou a avaliação com o Igor. É no Premium que a Wise passa a recomendar o parceiro aos clientes dela."],
                                                          ["Elite", "60 dias no Premium, ou 6 clientes fechados, ou a avaliação. Recebe o Base Ativa."]]},
    {"t": "O que você escreveu no FO-16", "k": "p", "v": ["'Para passar para o nível elite, o parceiro tem que passar, pelo menos 1 cliente para fazermos o diagnóstico. Só assim podemos indicá-lo para nossos clientes. Para passar para o nível premium, pelo menos, 1 cliente tem que fechar a consultoria da wise makers.'"]},
    {"t": "Por que é uma contradição", "k": "p", "v": ["Lido ao pé da letra, o Elite (1 cliente diagnosticado) fica mais fácil que o Premium (1 cliente fechado), e a recomendação aos clientes da Wise, que era do Premium, passa para o Elite. Pela escada, o nível de cima deveria pedir mais. Imagino que os nomes tenham trocado de lugar, mas preciso que você confirme."]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["A primeira opção: Premium com pelo menos 1 cliente que fez o diagnóstico (é quando a Wise já viu o parceiro trazer cliente e passa a recomendá-lo) e Elite com pelo menos 1 cliente que fechou a consultoria. Mantém a escada, e os critérios ficam simples para o portal apurar sozinho."]}],
    ["Premium: 1 cliente diagnosticado (passa a ser recomendado). Elite: 1 cliente que fechou a consultoria", "Como escrevi: Elite com 1 cliente diagnosticado e recomendação; Premium com 1 cliente fechado (comente a ordem da escada)",
     "Continuam os critérios do FO-14", "Outra regra (comente)"])
item("niveis_tempo", G0, "Os 60 dias no programa e a avaliação com o Igor continuam valendo junto com os critérios novos?", "Decisão em aberto", "aberto", [
    {"t": "Contexto", "k": "p", "v": ["Os critérios do FO-14 tinham tempo mínimo e uma porta de exceção (a avaliação com o Igor). Os do FO-16 falam só em clientes."]}],
    ["Não: só os critérios de clientes", "Sim: 60 dias e o critério de clientes", "Só a avaliação com o Igor continua, como exceção"])
item("comissao_wise", G0, "Quanto o parceiro paga à Wise quando um cliente da Wise fecha com ele?", "Decisão em aberto", "aberto", [
    {"t": "Contexto", "k": "p", "v": ["No FO-16 você disse que o parceiro pode pagar com a comissão dele quando um cliente da Wise, recomendado pela Prateleira, fecha com ele. Antes, a contrapartida da Prateleira era só não financeira.",
                                       "Para ser uma regra única e simples, vale a mesma lógica que a Wise paga: um percentual da primeira mensalidade ou do primeiro pagamento."]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["Espelhar a regra que a Wise paga: o parceiro paga 40% do primeiro pagamento do cliente que a Wise indicou. O parceiro entende na hora, porque é a mesma regra que ele recebe."]}],
    ["40% do primeiro pagamento, espelhando a regra da Wise", "20% do primeiro pagamento", "10% do valor do contrato no primeiro ano", "Outro (comente)"])
item("valores", G0, "Quais são os valores reais para a conta do canal?", "Valores", "aberto", [
    {"t": "Por que", "k": "p", "v": [f"Você pediu os custos em reais. A calculadora do quadro ({QUADRO}) usa valores de partida do Playbook e da especificação, e exemplos onde não há dado. Preencha o que souber; o que não souber, deixe em branco que fica como exemplo."]},
    {"t": "Valores de partida no quadro", "k": "kv", "v": [[r, f"{str(v).replace('.', ',')} {u} · {o}"] for k, r, v, u, o in CONTA]}],
    [], tipo="texto")
item("hub_marcas", G0, "Como o parceiro Select recebe o 'Wise Hub com as duas marcas'?", "Decisão em aberto desde o FO-14", "aberto", [
    {"t": "Contexto", "k": "p", "v": ["Continua em aberto desde a revisão do FO-14. O que já existe: a página do cliente no portal mostra a logo do parceiro ao lado da Wise, e o cliente recebe o link do Hub depois do diagnóstico. Agora o roteiro de cada reunião também vai ficar no Hub."]}],
    ["A página do cliente com as duas marcas já cumpre; dentro do Hub nada muda", "Alguém da Wise configura a logo do parceiro dentro do Hub, a cada parceiro novo (comente quem)",
     "O Hub já faz isso sozinho a partir de algum cadastro (comente como)", "Não sei: ver com quem cuida do Hub"])

# ---------------------------------------------------------------- o quadro do modelo de negócio, seção por seção
G1 = "O quadro do modelo de negócio"
def sec_canvas(k):
    nome, lista = CANVAS[k]
    return [nome, [[t, "", TAG[o]] for t, o in lista]]
item("canvas", G1, "O Business Model Canvas está claro e certo agora?", "Refeito", "mudou", [
    {"t": "O que mudou depois do FO-16", "k": "ul", "v": [f"O canvas saiu do mapa de processos e está num quadro próprio: {QUADRO}", "Cada bloco tem só o conteúdo do modelo, em frases curtas, sem números de processo.",
                                                        "Os custos aparecem em reais e a conta completa está na calculadora logo abaixo do canvas.", "Os canais de entrada de parceiros vão muito além do anúncio."]}]
    + [{"t": n, "k": "dec", "v": v} for n, v in (sec_canvas(k) for k in ("pv", "seg", "can", "rel", "rec", "rk", "ak", "par", "cus"))], AP)
item("conta", G1, "A conta do canal (CAP, custo por diagnóstico e CAC) está montada do jeito certo?", "Proposta da revisão", "mudou", [
    {"t": "Como a calculadora monta a conta", "k": "ul", "v": [
        "Comissões por cliente: 40% mais 10% da primeira mensalidade (R$ 3.000 numa mensalidade de R$ 6.000).",
        "Custo de um diagnóstico: horas de quem conduz vezes o custo-hora (3 horas: 2 de reunião, mais revisão do roteiro gerado por IA e do plano).",
        "Diagnósticos por cliente fechado: 100 dividido pela conversão. Com 10%, cada cliente custa 10 diagnósticos.",
        "CAP (custo de aquisição do parceiro): anúncios do mês divididos pelos aprovados, mais as horas de fila e conversa. Depois, dividido pelos que ativam e pelos clientes que cada ativado traz.",
        "CAC: comissões, mais os diagnósticos do cliente, mais o CAP que cabe a ele. Com os valores de partida, R$ 4.450 por cliente, contra R$ 72.000 de receita em 12 meses."]},
    {"t": "Leitura dos valores de partida", "k": "p", "v": ["As comissões pesam mais que as horas. O que mais limita o canal não é o dinheiro, é a agenda: com 10% de conversão, cada cliente consome cerca de 38 horas do Gerente entre diagnósticos e parceiros."]}], AP)
item("dois_lados", G1, "A leitura de plataforma de dois lados e do padrão isca e anzol está certa?", "Proposta da revisão", "mudou", [
    {"t": "No quadro", "k": "ul", "v": ["O programa só funciona com os dois lados presentes: parceiros que mandam o link e clientes que fazem o diagnóstico.", "Os dois lados não pagam; paga o cliente que contrata a consultoria.",
                                      "O diagnóstico gratuito é isca e anzol (caro para quem oferece, leva à compra paga); o Wise Hub fica mais perto do freemium (custa pouco por usuário)."]}], AP)
item("vpc_cliente", G1, "A proposta de valor para o cliente do parceiro, refeita com os benefícios da consultoria, está certa?", "Refeito", "mudou", [
    {"t": "O que a Wise oferece", "k": "kv", "v": [["Produtos e serviços", "; ".join(VPC_CLIENTE["produtos"])], ["Aliviam as dores", "; ".join(VPC_CLIENTE["aliviam"])], ["Criam ganhos", "; ".join(VPC_CLIENTE["criam"])]]},
    {"t": "O cliente do parceiro", "k": "kv", "v": [["Tarefas", "; ".join(VPC_CLIENTE["tarefas"])], ["Dores", "; ".join(VPC_CLIENTE["dores"])], ["Ganhos", "; ".join(VPC_CLIENTE["ganhos"])]]},
    {"t": "O que mudou", "k": "p", "v": ["Saiu 'mostra onde a venda trava'. Os benefícios são os da consultoria completa (processo de vendas, metas e comissionamento, CRM, script e playbook, rotina de gestão, recrutamento e integração de vendedores), porque o diagnóstico é a mesma consultoria em formato breve."]}], AP)
for g in dict.fromkeys(c[0] for c in CATEGORIAS):
    cats = [c for c in CATEGORIAS if c[0] == g]
    item("vpc-" + re.sub(r"[^a-z]", "", g.lower()), G1, f"Propostas de valor para parceiros de {g.lower()} ({len(cats)} categorias): estão certas?", "Proposta da revisão", "mudou",
         [{"t": "Igual para todas as categorias", "k": "ul", "v": COMUM}] +
         [{"t": f"{nome}: {vende}", "k": "kv", "v": [["Tarefas", "; ".join(tar)], ["Dores", "; ".join(dor)], ["Ganhos", "; ".join(gan)], ["O programa alivia", "; ".join(ali)], ["O programa cria", "; ".join(cri)]]}
          for _, nome, vende, tar, dor, gan, ali, cri in cats], AP + ["Retirar alguma categoria (comente qual)"])
item("canais", G1, "Os canais nas cinco fases, corrigidos, estão certos?", "Refeito", "mudou", [
    {"t": lado, "k": "kv", "v": [[f"{i + 1}. {FASES[i]}", c] for i, c in enumerate(cel)]} for lado, cel in CANAIS.items()], AP)
item("hipoteses", G1, "A ordem das hipóteses a testar está certa?", "Proposta da revisão", "mudou", [
    {"t": "Muito importantes e com pouca evidência: testar primeiro", "k": "ul", "v": [f"{t} ({tipo.lower()})" for t, tipo, imp, evi in HIPOTESES if imp == 3 and evi == 1]},
    {"t": "As demais", "k": "ul", "v": [f"{t} ({tipo.lower()})" for t, tipo, imp, evi in HIPOTESES if not (imp == 3 and evi == 1)]}], AP)
item("portfolio", G1, "O programa está na fase de explorar, e só passa a operação padrão com evidência: concorda?", "Proposta da revisão", "mudou", [
    {"t": "No quadro", "k": "p", "v": ["A consultoria da Wise é o negócio estabelecido; o Wise Partners é um projeto de exploração, que cresce em apostas pequenas e só vira canal padrão (com metas e orçamento próprios) quando os portões de fase forem cumpridos."]}], AP)
item("mais", G1, "Algo mais sobre o modelo de negócio?", "Comentário livre", "igual", [{"t": "", "k": "p", "v": ["Qualquer ajuste que não coube acima."]}], [], tipo="texto")

# ---------------------------------------------------------------- página (renderizador do FO-14)
json.dump(ITENS, open(BASE + "/ferramentas/fo17_itens.json", "w"), ensure_ascii=False, indent=1)
src14 = open(BASE + "/ferramentas/fo14_pagina.py", encoding="utf-8").read()
MONTAR = src14[src14.index('MONTAR = r"""') + len('MONTAR = r"""'):src14.index('"""\npagina = pagina[:i] + MONTAR')]
CSS = src14[src14.index('pagina = pagina.replace("</style>", """') + len('pagina = pagina.replace("</style>", """'):src14.index('</style>""", 1)')]
MONTAR = MONTAR.replace("card.append(b, obs);", "if (it.tipo === 'texto') { obs.hidden = false; b.hidden = true; obs.rows = 8; obs.placeholder = 'Escreva aqui'; }\n    card.append(b, obs);")
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
i = pagina.index("function montar() {"); j = pagina.index("function ler(it) {")
pagina = pagina[:i] + MONTAR + pagina[j:]
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Validar o Modelo de Negócio</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo22_itens', META = 'respostas/FO-22', CHAVE = 'fo22-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
esc = lambda t: str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
blocos = []
for it in ITENS:
    if not blocos or blocos[-1][0] != it["bloco"]: blocos.append([it["bloco"], it["id"], 0])
    blocos[-1][2] += 1
indice = "".join(f'<li><a href="#c-{esc(a)}">{esc(b)}</a> <span>{n} {"pergunta" if n == 1 else "perguntas"}</span></li>' for b, a, n in blocos)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + f"""<header>
    <p class="eyebrow">FO-17 · Modelo de negócio do Wise Partners</p>
    <h1>Validar o quadro do modelo de negócio e fechar o que ficou aberto</h1>
    <p class="lead">O mapa de processos já foi atualizado com o FO-16 (versão 12). O modelo de negócio agora é um quadro separado, com o canvas refeito, a conta do canal em reais, a proposta de valor do cliente e de cada uma das {len(CATEGORIAS)} categorias de parceiro, os canais, as hipóteses e o portfólio. Abra o quadro ao lado deste formulário: <strong>{QUADRO}</strong>. Primeiro vêm as decisões que só você pode tomar; depois, a validação do quadro, seção por seção.</p>
    <nav class="indice" aria-label="Blocos do formulário"><ol>{indice}</ol></nav>
  </header>""" + pagina[j:]
pagina = pagina.replace("</style>", CSS + "</style>", 1)
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas;", len(pagina) // 1024, "KB")
