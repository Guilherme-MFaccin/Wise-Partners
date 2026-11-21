# FO-19: Wise Partners como hub de negócios. Os clientes da Wise veem o catálogo de parceiros e usam condições especiais;
# qualquer cliente pode também ser parceiro. Perguntas para decidir antes de reestruturar o modelo de negócio e o portal.
import json, os
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-19/formulario.html"
ITENS = []
def item(iid, bloco, texto, selo, cls, secoes, opcoes, tipo="escolha"):
    ITENS.append({"id": "HB-" + iid, "bloco": bloco, "texto": texto, "selo": selo, "cls": cls, "secoes": [s for s in secoes if s and s.get("v")], "opcoes": opcoes, "tipo": tipo})
def rec(t): return {"t": "O que eu recomendo, e por quê", "k": "rec", "v": [t]}
def ctx(*t): return {"t": "Contexto", "k": "p", "v": list(t)}
def kv(t, *pares): return {"t": t, "k": "kv", "v": [list(p) for p in pares]}

HOJE = kv("Como o modelo está hoje (to-be v14 e canvas)",
          ("Parceiros", "Empresas que vendem para empresas, em 30 categorias (21 comerciais e 9 institucionais), entrando pela fila e pela conversa de entrada."),
          ("Clientes dos parceiros", "Recebem a consultoria da Wise sem custo (diagnóstico de 2 horas e Wise Hub) pelo link do parceiro."),
          ("Clientes da Wise", "Recebem recomendações pela Prateleira: a Wise indica parceiros Premium e Elite quando o cliente pede um fornecedor."),
          ("Receita", "Mensalidade da consultoria; comissão que o parceiro paga à Wise quando um cliente da Wise fecha com ele."))

# ---------------------------------------------------------------- 1. quem participa
G1 = "Quem participa do hub"
item("ofertantes", G1, "Quem pode oferecer produtos e serviços no catálogo?", "Mudança de modelo", "mudou", [
    HOJE,
    ctx("Você disse que o portal passa a ser de parceiros que não precisam estar nas categorias definidas antes, e que os clientes da Wise também podem ser parceiros. Vira uma comunidade de indústrias e de empresas que prestam serviço para indústrias."),
    rec("Qualquer empresa B2B aprovada pela Wise, inclusive clientes da Wise, com as categorias virando filtro do catálogo (não porta de entrada). Quem não se encaixa escolhe 'Outra' e a Wise cria a categoria na aprovação. A conversa de entrada continua: é ela que mantém a qualidade do catálogo.")],
    ["Qualquer empresa B2B aprovada pela Wise, inclusive clientes da Wise; categorias viram filtro", "Só as categorias atuais, mais os clientes da Wise",
     "Qualquer empresa, sem aprovação da Wise", "Outro (comente)"])
item("compradores", G1, "Quem pode entrar no portal para ver o catálogo e usar as condições?", "Mudança de modelo", "mudou", [
    ctx("O catálogo é o benefício para quem compra. Quanto mais gente vê, mais valor para o parceiro; quanto mais restrito, mais exclusivo."),
    rec("Começar pelos clientes ativos da consultoria Wise (o catálogo vira mais um motivo para ficar e renovar) e pelos parceiros, que também compram uns dos outros. Os clientes dos parceiros que fizeram o diagnóstico entram numa segunda fase, como gancho para contratar a consultoria.")],
    ["Clientes ativos da Wise e os parceiros (recomendado)", "Clientes ativos, ex-clientes da Wise e parceiros", "Também os clientes dos parceiros que fizeram o diagnóstico",
     "Qualquer indústria que se cadastrar, com aprovação"], tipo="multipla")
item("dois_papeis", G1, "Uma mesma empresa pode comprar e oferecer no hub?", "Arquitetura", "aberto", [
    ctx("Exemplo: uma indústria cliente da Wise oferece embalagens no catálogo e, ao mesmo tempo, compra serviços de contabilidade de outro parceiro."),
    rec("Sim. Uma empresa, um cadastro, dois papéis: membro (compra) e parceiro (oferece). As pessoas da empresa usam o mesmo login e veem as duas coisas.")],
    ["Sim, uma empresa com os dois papéis e o mesmo login", "Sim, mas com cadastros separados", "Não: cada empresa tem um papel só"])
item("entrada_cliente", G1, "Como o cliente da Wise recebe o acesso ao hub?", "Processo novo", "aberto", [
    ctx("Hoje só parceiros e o time da Wise têm login. Os clientes da consultoria não entram no portal."),
    rec("O acesso nasce quando o cliente contrata a consultoria: o consultor cria pelo portal, com senha provisória (o mesmo fluxo dos parceiros). Sai do hub quando o contrato termina, a não ser que a empresa também seja parceira.")],
    ["Criado pela Wise quando o cliente contrata a consultoria", "Convite do consultor quando ele achar que faz sentido", "Autocadastro do cliente com aprovação da Wise", "Outro (comente)"])

# ---------------------------------------------------------------- 2. o que é oferecido
G2 = "O que o catálogo oferece"
item("oferta", G2, "O que aparece para cada parceiro no catálogo?", "Arquitetura", "aberto", [
    ctx("Hoje o parceiro tem uma ficha de apresentação (P-86), usada nas recomendações da Prateleira."),
    rec("A ficha da empresa e uma ou mais ofertas, cada uma com: o que é, para quem serve, a condição especial para membros (desconto, bônus ou prazo), validade e como usar. O cliente compara ofertas, não só empresas.")],
    ["Ficha da empresa e ofertas com condição especial (recomendado)", "Só a ficha da empresa com a condição geral", "Só ofertas, sem ficha"])
item("condicao", G2, "A condição especial é obrigatória para estar no catálogo?", "Regra nova", "aberto", [
    ctx("O que diferencia o hub de uma lista de fornecedores é o benefício exclusivo para quem é membro."),
    rec("Sim. Toda oferta precisa de uma condição só para membros, validada pela Wise: desconto mínimo de 10% ou um benefício equivalente (por exemplo, implantação grátis ou um mês sem custo).")],
    ["Sim, com desconto mínimo de 10% ou benefício equivalente", "Sim, com o valor que o parceiro quiser", "Não: a condição é opcional", "Outro (comente o mínimo)"])
item("uso", G2, "Como o cliente usa uma condição do catálogo?", "Processo novo", "aberto", [
    ctx("Precisamos saber que o negócio nasceu no hub, para medir valor, cobrar a comissão e dar retorno às duas partes."),
    rec("O cliente clica em 'Quero esta condição' e confirma que aceita compartilhar o contato. O portal gera um pedido com protocolo, avisa o parceiro, e os dois acompanham o andamento (contato feito, proposta, fechado, perdido). É o mesmo modelo das indicações, que já existe.")],
    ["Pedido pelo portal com protocolo e acompanhamento (recomendado)", "Código de desconto que o cliente informa ao parceiro", "Contato direto, sem registro no portal"])
item("avaliacao", G2, "O cliente avalia o parceiro depois do serviço?", "Regra nova", "aberto", [
    ctx("A permanência na Prateleira já usa uma nota (P-87). Uma avaliação de quem comprou daria a base mais confiável."),
    rec("Sim: nota de 1 a 5 e um comentário, pedidos 30 dias depois do fechamento. A nota aparece só para a Wise no começo; depois de juntar avaliações, pode aparecer no catálogo.")],
    ["Sim, nota só para a Wise no começo", "Sim, nota visível no catálogo desde o início", "Não por enquanto"])

# ---------------------------------------------------------------- 3. dinheiro e níveis
G3 = "Dinheiro e níveis"
item("receita", G3, "Como a Wise ganha com o hub?", "Mudança no canvas", "mudou", [
    ctx("No FO-16 você disse que o parceiro pode pagar comissão à Wise quando um cliente da Wise fecha com ele. O percentual ainda está em aberto no FO-18."),
    rec("Comissão do parceiro sobre negócio fechado pelo hub, com o percentual do FO-18. Sem mensalidade no começo: o catálogo precisa encher antes de cobrar para aparecer. A receita principal continua sendo a consultoria, e o hub vira motivo de entrada e de retenção.")],
    ["Comissão do parceiro sobre negócio fechado pelo hub (recomendado)", "Mensalidade do parceiro para aparecer no catálogo", "Destaque pago no catálogo", "Gratuito por enquanto, sem cobrança"], tipo="multipla")
item("niveis", G3, "Quem aparece no catálogo, em relação aos níveis?", "Decisão ligada ao FO-18", "aberto", [
    ctx("Hoje a recomendação na Prateleira é benefício do Premium. Também está em aberto se os pacotes (Base Ativa, Formação, Prateleira) continuam."),
    rec("Todo parceiro aprovado aparece no catálogo, inclusive o Select. Premium e Elite ganham destaque e a recomendação ativa da Wise (a Prateleira). Os pacotes saem e os benefícios passam a seguir só o nível.")],
    ["Todos aparecem; Premium e Elite com destaque e recomendação ativa; pacotes saem", "Só Premium e Elite aparecem", "Todos aparecem igual, sem destaque", "Outro (comente)"])
item("comissao_cliente_parceiro", G3, "A comissão de 40% que a Wise paga ao parceiro continua igual?", "Confirmação", "igual", [
    ctx("Hoje a Wise paga 40% da primeira mensalidade quando um cliente trazido pelo parceiro contrata a consultoria. O hub não muda isso, mas cria o caminho inverso (cliente da Wise que compra do parceiro)."),
    rec("Continua igual. Os dois sentidos ficam simétricos: quem traz o cliente recebe.")],
    ["Continua igual", "Muda (comente)"])

# ---------------------------------------------------------------- 4. como chamar e quando fazer
G4 = "Nome, prioridade e prazo"
item("nome", G4, "Como chamar a área que o cliente vê?", "Comunicação", "aberto", [
    rec("Manter Wise Partners como nome do programa e chamar a área do cliente de 'Catálogo de parceiros', com o selo 'condição para membros' em cada oferta. É direto e não cria uma marca nova.")],
    ["Catálogo de parceiros", "Clube Wise Partners", "Benefícios Wise", "Outro (comente)"])
item("fases", G4, "O que entra na primeira entrega do hub?", "Ordem de construção", "aberto", [
    rec("Fase 1: cadastro de ofertas pelo parceiro, validação pela Wise, catálogo para clientes ativos e parceiros, pedido com protocolo e acompanhamento. Fase 2: avaliações, comissão do hub e clientes dos parceiros. Fase 3: abrir para outras indústrias.")],
    ["Ofertas e validação pela Wise", "Catálogo com busca e filtros por categoria", "Pedido com protocolo e acompanhamento", "Acesso dos clientes da Wise", "Avaliações",
     "Comissão do hub", "Acesso dos clientes dos parceiros"], tipo="multipla")
item("prazo", G4, "Até quando a primeira entrega precisa estar no ar?", "Prazo", "aberto", [], [], tipo="texto")
item("mais", G4, "Algo mais sobre o hub que não apareceu aqui?", "Comentário livre", "igual", [{"t": "", "k": "p", "v": ["Exemplos de parceiros e ofertas que você já imagina, conversas com o Igor ou com clientes."]}], [], tipo="texto")

# ---------------------------------------------------------------- página (renderizador do FO-14, como no FO-18)
json.dump(ITENS, open(BASE + "/ferramentas/fo19_itens.json", "w"), ensure_ascii=False, indent=1)
src14 = open(BASE + "/ferramentas/fo14_pagina.py", encoding="utf-8").read()
MONTAR = src14[src14.index('MONTAR = r"""') + len('MONTAR = r"""'):src14.index('"""\npagina = pagina[:i] + MONTAR')]
CSS = src14[src14.index('pagina = pagina.replace("</style>", """') + len('pagina = pagina.replace("</style>", """'):src14.index('</style>""", 1)')]
MONTAR = MONTAR.replace("card.append(b, obs);", "if (it.tipo === 'texto') { obs.hidden = false; b.hidden = true; obs.rows = 6; obs.placeholder = 'Escreva aqui'; }\n    card.append(b, obs);")
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
i = pagina.index("function montar() {"); j = pagina.index("function ler(it) {")
pagina = pagina[:i] + MONTAR + pagina[j:]
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Hub de Negócios Wise</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo24_itens', META = 'respostas/FO-24', CHAVE = 'fo24-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
esc = lambda t: str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
blocos = []
for it in ITENS:
    if not blocos or blocos[-1][0] != it["bloco"]: blocos.append([it["bloco"], it["id"], 0])
    blocos[-1][2] += 1
indice = "".join(f'<li><a href="#c-{esc(a)}">{esc(b)}</a> <span>{n} {"pergunta" if n == 1 else "perguntas"}</span></li>' for b, a, n in blocos)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + f"""<header>
    <p class="eyebrow">FO-19 · Wise Partners como hub de negócios</p>
    <h1>O catálogo de parceiros para os clientes da Wise</h1>
    <p class="lead">O Wise Partners passa a ser um hub: os clientes da Wise veem o catálogo de parceiros e usam condições especiais, e qualquer cliente também pode ser parceiro. Antes de reestruturar o modelo de negócio e o portal, preciso de algumas decisões. Cada pergunta traz o contexto e a minha recomendação. As respostas são salvas enquanto você marca.</p>
    <nav class="indice" aria-label="Blocos do formulário"><ol>{indice}</ol></nav>
  </header>""" + pagina[j:]
pagina = pagina.replace("</style>", CSS + "</style>", 1)
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas;", len(pagina) // 1024, "KB")
