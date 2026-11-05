# Formulário do roteiro do vídeo da landing page (Rodada V1): promessa ao parceiro e pontos pendentes.
import json, html, textwrap, re
_src = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo03_pagina.py").read().splitlines()
esc = html.escape
exec("\n".join(_src[8:24]))   # box, seta, txt, svg
BASE = "/home/user/mapeamentos/wise-partners-to-be"
RE_ = json.load(open(BASE + "/fontes/v3/referral-engine.json"))
TR = re.sub(r"\s+", " ", open(BASE + "/fontes/reunioes/2026-11-04-igor.md", encoding="utf-8").read())
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
def RE(i, j): c = RE_["principios"][i]["citacoes"][j]; return {"livro": "The Referral Engine", "pagina": c["pagina"], "trecho": c["trecho"]}
def CONV(t, trecho):
    assert re.sub(r"\s+", " ", trecho) in TR; return {"livro": "Reunião Guilherme e Igor, 04/11/2026", "pagina": t, "trecho": trecho}
OCTO = {"livro": "Ecossistema de Parceiros", "pagina": "p. 136", "trecho": "Você sabe que as regras do seu programa estão claras quando um parceiro consegue explicá-las para outros parceiros."}
def w(t, n): return textwrap.wrap(t, n)[:4]
def colunas(itens, destaque=(), legenda=""):
    n = len(itens); gap = 12; bw = (648 - gap * (n - 1)) / n
    c = []
    for i, (tit, sub) in enumerate(itens):
        x = 6 + i * (bw + gap)
        c.append(box(x, 14, bw, 58, w(tit, int(bw / 7.2)), "b hi" if i in destaque else "b", 11.5, True))
        for k, l in enumerate(w(sub, int(bw / 6.2))): c.append(txt(x + bw / 2, 92 + k * 15, l, 11, "middle"))
    if legenda: c.append(txt(6, 166, legenda, 11))
    return svg(660, 176 if legenda else 128, "".join(c), "Opções")
AP = None
ITENS = []
def Q(k, bloco, texto, tipo, opcoes, contexto, logica, cits, visual, recomendo=""):
    ITENS.append({"id": "V1-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": opcoes, "contexto": contexto,
                  "logica": logica + (f" Minha recomendação: {recomendo}." if recomendo else ""), "citacoes": cits, "visual": visual})
B1, B2 = "A promessa ao parceiro", "O que falta para gravar"

# ---- visual: o roteiro atual tem benefícios demais
c = [txt(6, 20, "O roteiro atual pede ao parceiro que guarde sete coisas", 12.5, cls="tx", bold=True)]
itens_atuais = ["Diagnóstico gratuito", "Mapa de planejamento", "Wise Hub", "Anúncio conjunto", "Treinamento do time", "Lista da Wise", "Comissão"]
for i, t in enumerate(itens_atuais):
    x = 6 + (i % 4) * 162; y = 34 + (i // 4) * 46
    c.append(box(x, y, 150, 36, [t], "b", 11.5))
c.append(box(6, 134, 648, 40, ["Proposta: uma promessa em uma frase, até dois apoios e o como em três passos"], "b hi", 12, True))
V_PROB = svg(660, 186, "".join(c), "Benefícios demais no roteiro atual")

Q("promessa", B1, "Qual é a promessa que o parceiro precisa entender nos primeiros 10 segundos?", "escolha",
  ["Venda o seu software com consultoria comercial incluída, sem custo para você",
   "Seus clientes usam mais o sistema e cancelam menos",
   "Ganhe comissão indicando a Wise para a sua base",
   "Receba clientes novos indicados pela Wise"],
  ["Você tem razão: o roteiro ficou complexo. Ele cita sete coisas que o parceiro recebe (a figura mostra). Cada uma é verdadeira, mas juntas viram uma lista para decorar, e o parceiro sai sem saber o que ganha.",
   "Há também um desencontro com o anúncio. Os 5 vídeos do Meta prometem diferenciação num mercado competitivo. O roteiro abriu com a dor de depois da venda (o cliente que usa pouco e cancela), que é outro problema. Quem clicou por diferenciação espera ouvir como vai se diferenciar.",
   "A primeira opção responde ao anúncio com uma frase só: quem compra o software do parceiro leva junto uma consultoria comercial, e o concorrente não oferece isso. Na conversa com o Igor apareceu exatamente essa ideia, do ponto de vista do cliente: não estou contratando só o software, estou contratando uma forma de aprender a usar."],
  "Uma promessa só, dita em uma frase, é o que o parceiro consegue repetir para o sócio dele depois do vídeo. O resto do programa continua existindo; ele só não precisa estar no vídeo.",
  [CONV("Gravação 2, 11:41", "não estou contratando só o software eu estou contratando também é uma forma de eu aprender a usar isso daqui"), RE(0, 1), RE(10, 0), OCTO],
  V_PROB, "a primeira, que responde ao anúncio")

Q("apoios", B1, "Além da promessa, quais benefícios aparecem no vídeo? Marque no máximo dois.", "multipla",
  ["Seus clientes usam mais o sistema e cancelam menos", "Comissão quando um cliente seu contrata a Wise", "Clientes da Wise apresentados à sua solução",
   "Treinamento de gestão comercial para o seu time", "Selo de parceiro Wise para usar na sua venda", "Anúncio conjunto da parceria"],
  ["Os apoios sustentam a promessa sem competir com ela. Dois cabem numa frase cada; três já viram lista.",
   "O selo é a única opção que ainda não estava no roteiro. No Playbook v3.1, certificado e selo fazem parte do pacote B (Premium e Elite que divulgam à própria base). Para um SaaS, o selo é diferenciação visível na página de vendas dele, o que conversa direto com a promessa. Se você marcar, preciso saber no comentário se o selo vale para todo SaaS que entrar ou só para quem chega ao pacote B."],
  "Retenção e comissão são os apoios mais fortes para o dono do software: um fala do contrato que ele já tem, o outro do dinheiro que entra a mais.",
  [RE(3, 1), RE(5, 2)],
  colunas([("Promessa", "uma frase"), ("Apoio 1", "uma frase"), ("Apoio 2", "uma frase"), ("Sem custo", "uma frase")], (0,)),
  "retenção e comissão")

Q("nome_oferta", B1, "Como chamar, no vídeo e na página, o que o cliente do parceiro recebe?", "escolha",
  ["Consultoria comercial incluída", "Diagnóstico comercial gratuito", "Programa de gestão comercial Wise", "Outro nome (comente)"],
  ["Hoje o que o cliente recebe tem três partes com três nomes: diagnóstico, mapa de planejamento e Wise Hub. Para o parceiro, um nome só basta, e os detalhes ficam na página.",
   "O nome escolhido aparece na frase da promessa, na página e na mensagem pronta que o parceiro manda ao cliente. Por isso precisa ser algo que o parceiro diga com naturalidade numa venda."],
  "Um nome que o vendedor do parceiro consegue dizer em uma frase é o que transforma a parceria em argumento de venda.",
  [RE(5, 0), OCTO],
  colunas([("Consultoria comercial incluída", "fala o que o cliente leva"), ("Diagnóstico comercial gratuito", "fala da primeira entrega"), ("Programa de gestão comercial Wise", "fala da marca")], (0,)),
  "Consultoria comercial incluída")

Q("como", B1, "Quanto do como funciona entra no vídeo?", "escolha",
  ["Três passos: você entra no programa, seu cliente faz o diagnóstico grátis, ele sai com plano e plataforma",
   "Só a promessa e o sem custo; o como fica na página",
   "O passo a passo completo, como no roteiro atual"],
  ["O roteiro atual explica o caminho inteiro: diagnóstico, mapa, Hub, 90 dias, lista da Wise, comissão, contrapartida. Isso é o que o parceiro precisa saber na conversa de 45 minutos, não no primeiro minuto.",
   "Três passos dão ao parceiro a sensação de que é simples de começar, sem esconder que existe um método."],
  "O vídeo vende a conversa, não a parceria inteira. Quanto menos o parceiro precisa entender para clicar, mais gente clica.",
  [RE(5, 1), RE(3, 1)],
  colunas([("1. Você entra", "conversa e termo"), ("2. Seu cliente faz o diagnóstico", "gratuito, com a Wise"), ("3. Ele sai com plano e plataforma", "e usa melhor o seu sistema")], ()),
  "três passos")

Q("duracao", B1, "Qual a duração do vídeo da página?", "escolha", ["Até 60 segundos", "Até 90 segundos", "Cerca de 2 min 30 s, como no roteiro atual"],
  ["Com uma promessa, dois apoios e três passos, o vídeo cabe em 60 a 90 segundos. O roteiro atual tinha 2 min 30 s porque carregava a lista de benefícios."],
  "Vídeo mais curto, com a página detalhando, costuma ser assistido até o fim por mais gente.", [],
  colunas([("60 s", "promessa, um apoio, chamada"), ("90 s", "promessa, dois apoios, três passos, chamada"), ("2 min 30 s", "roteiro atual")], (1,)), "até 90 segundos")

Q("prova", B1, "Que prova pode aparecer no vídeo ou logo abaixo dele?", "multipla",
  ["Depoimento curto de um parceiro de software que já conversou com a gente", "Número real de empresas atendidas pela Wise", "Caso de um cliente da Wise com resultado mensurável", "Nenhuma por enquanto"],
  ["Promessa sem prova pede ao parceiro que confie no apresentador. Na conversa com o Igor, você contou de dois parceiros de software que estão ávidos para oferecer a Wise aos clientes deles. Um depoimento de 15 segundos de um deles vale mais que qualquer frase do roteiro.",
   "Só entra o que for real e autorizado: nome, número ou resultado que a Wise consiga mostrar se perguntarem."],
  "Uma prova curta logo depois da promessa responde à dúvida que o parceiro tem e não diz: isso funciona de verdade?",
  [CONV("Gravação 2, 23:47", "eles tão ávidos, eles querem mesmo poder oferecer os nossos serviços pra eles"), RE(10, 1)],
  colunas([("Depoimento", "um parceiro de software"), ("Número", "empresas atendidas"), ("Caso", "resultado de um cliente")], ()))

Q("quem_fala", B2, "Quem fala no vídeo? No comentário, escreva os dados reais do bloco de apresentação (anos de Wise e empresas atendidas).", "escolha",
  ["Eu, do começo ao fim", "O Igor, do começo ao fim", "O Igor abre e eu conduzo o resto"],
  ["O bloco de apresentação precisa de números reais. Sem número confirmado, a frase sai do roteiro.",
   "Quem fala no vídeo é quem o parceiro espera encontrar na conversa de 45 minutos."],
  "Uma pessoa só deixa o vídeo mais simples; o Igor abrindo dá peso de diretoria em poucos segundos.", [],
  colunas([("Guilherme", "quem atende o parceiro"), ("Igor", "peso de diretoria"), ("Igor abre", "e Guilherme conduz")], ()))

Q("perfil", B2, "Como dizer qual cliente do parceiro pode fazer o diagnóstico?", "escolha",
  ["Empresas com time comercial (B2B), de qualquer setor", "Indústrias", "Indústrias e distribuidoras", "Outro recorte (comente o porte ou o setor)"],
  ["Na Rodada 6, você decidiu que o diagnóstico vale só para clientes dentro do ICP da Wise. O vídeo precisa dizer isso em poucas palavras, sem soar como restrição. Na conversa com o Igor, apareceu que o foco não é só indústria."],
  "O recorte certo evita que o parceiro prometa o diagnóstico a um cliente que a Wise não vai atender.",
  [CONV("Gravação 2, 01:47", "É porque eu estou falando que só indústria, mas não é só indústria, né?")],
  colunas([("B2B com time comercial", "mais amplo"), ("Indústrias", "o ICP histórico"), ("Indústrias e distribuidoras", "meio-termo")], ()))

Q("comissao", B2, "O que a página diz sobre a comissão?", "escolha",
  ["Mostra o percentual: 40% da primeira mensalidade na Wise Makers e na Tríade e 6% do projeto na Swallow", "Diz só que há comissão; o percentual fica para a conversa", "Não fala de comissão"],
  ["O vídeo só cita que a comissão existe. A página precisa decidir se mostra o número. Mostrar dá concretude; guardar para a conversa mantém o foco na promessa."],
  "Se a comissão for um dos dois apoios, o número na página ajuda; se não for, ela pode ficar para a conversa.", [RE(3, 0)],
  colunas([("Percentual na página", "concreto"), ("Só que existe", "foco na promessa"), ("Não fala", "só na conversa")], ()))

Q("agenda", B2, "A página avisa que o diagnóstico segue a agenda disponível?", "escolha",
  ["Sim, numa linha discreta perto do botão", "Sim, só no termo do parceiro", "Não"],
  ["Você conduz no máximo um diagnóstico por dia. Se vários parceiros entrarem ao mesmo tempo, a fila cresce. Avisar desde o começo evita a sensação de promessa quebrada."],
  "Uma linha discreta protege a promessa sem diminuí-la.", [], colunas([("Linha na página", "transparente"), ("Só no termo", "na conversa"), ("Não avisar", "risco de fila")], (0,)), "uma linha discreta")

Q("contrapartida", B2, "A contrapartida \"a Wise entre as opções que você apresenta aos seus clientes\", do Playbook v3.1, continua para SaaS?", "escolha",
  ["Continua e aparece no vídeo", "Continua, mas fica só na conversa e no termo", "Não vale para SaaS"],
  ["No Playbook, a Wise pede um responsável nomeado e ser mantida entre as opções de consultoria que o parceiro apresenta. Para o SaaS, a promessa nova já faz isso: a consultoria vem incluída. Repetir no vídeo pode soar como cobrança."],
  "Contrapartida é assunto da conversa e do termo; no vídeo, o que aparece é o que o parceiro ganha.", [],
  colunas([("No vídeo", "transparência"), ("Na conversa e no termo", "vídeo mais leve"), ("Não vale", "regra muda")], (1,)), "na conversa e no termo")

Q("marcas", B2, "O vídeo cita quais marcas?", "escolha",
  ["Só a Wise Makers", "Wise Makers, Tríade e Swallow", "O grupo, com a Wise Makers à frente"],
  ["As três empresas têm comissão no programa, mas a promessa (consultoria comercial incluída) é da Wise Makers. Citar as três aumenta o que o parceiro precisa entender."],
  "Uma marca no vídeo deixa a promessa limpa; as outras podem aparecer na página, na parte de comissão.", [],
  colunas([("Só Wise Makers", "promessa limpa"), ("As três", "programa completo"), ("Grupo com a Wise à frente", "meio-termo")], (0,)), "só a Wise Makers")

json.dump(ITENS, open(BASE + "/ferramentas/fo07_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo07_modelo.html", encoding="utf-8").read()
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas")
