# Visuais da Rodada 3 (usa box, seta, txt, svg de fo03_cab.py)
V = {}
# 1. princípios em quatro camadas
camadas = [("Por que existe", ["1 Canal mais barato (CAC)", "2 Valor antes de capturar", "3 Uma interação central", "4 Ocupar pouco"]),
           ("Como se organiza", ["5 Interface simples", "6 Portal no centro", "7 Atenção proporcional", "8 Só a exceção vira trabalho"]),
           ("Como se relaciona", ["9 Primeiro valor em 90 dias", "10 Fechar o ciclo", "11 Ensinar a indicar", "12 Norma social", "13 Reciprocidade visível", "14 Comunidade com ritual"]),
           ("Como se mede", ["15 Fatores objetivos", "16 Fases e portões", "17 Ritmos fixos", "18 Governança clara"])]
c = []; y = 8
novos = {"2 Valor antes de capturar", "10 Fechar o ciclo", "11 Ensinar a indicar", "12 Norma social", "13 Reciprocidade visível", "14 Comunidade com ritual", "15 Fatores objetivos", "16 Fases e portões"}
for nome, itens in camadas:
    c.append(txt(10, y + 22, nome, 12, cls="tx", bold=True))
    for k, it in enumerate(itens):
        col, lin = k % 3, k // 3
        c.append(box(150 + col * 168, y + lin * 38, 160, 32, [it], "b hi" if it in novos else "b", 11))
    y += 38 * ((len(itens) + 2) // 3) + 12
c.append(txt(10, y + 8, "Em azul, os oito princípios novos desta rodada; os demais você já aprovou.", 11))
V["principios"] = svg(660, y + 18, "".join(c), "Dezoito princípios em quatro camadas")
# 2. hierarquia com o portal no centro
c = ['<circle cx="330" cy="150" r="62" class="b hi"/>', txt(330, 145, "Portal", 14, "middle", "tx", True), txt(330, 163, "no centro", 12, "middle", "tx")]
import math
macros = ["1 Arquitetar", "2 Rituais", "3 Medir e aprender", "4 Atrair", "5 Integrar", "6 Oportunidades", "7 Desenvolver", "8 Comunidade", "9 Reter", "10 Prateleira", "11 Equipar", "12 Operar o portal"]
for i, m in enumerate(macros):
    a = -math.pi / 2 + i * 2 * math.pi / 12
    x, yy = 330 + 230 * math.cos(a), 150 + 118 * math.sin(a)
    cls = "b2" if i in (9, 10, 11) else ("b hi" if i in (2, 7) else "b")
    c += [f'<line x1="{330 + 64 * math.cos(a):.0f}" y1="{150 + 64 * math.sin(a):.0f}" x2="{x - 50 * math.cos(a):.0f}" y2="{yy - 14 * math.sin(a):.0f}" class="ln fino"/>', box(x - 62, yy - 15, 124, 30, [m], cls, 11)]
c.append(txt(330, 296, "Gestão e finalísticos em branco, suporte em cinza; em azul, os dois macroprocessos novos.", 11, "middle"))
V["hap"] = svg(660, 306, "".join(c), "Doze macroprocessos em volta do portal")
# 3. cubo como tabela de oito células
tipos = [("A", "A", "A", "Embaixador"), ("A", "A", "B", "Gerador sob tensão"), ("A", "B", "A", "Âncora esfriando"), ("A", "B", "B", "Valioso em risco"),
         ("B", "A", "A", "Promissor"), ("B", "A", "B", "Ativo sem tração"), ("B", "B", "A", "Cordial seletivo"), ("B", "B", "B", "Desertor")]
c = [txt(10, 18, "Valor", 12, cls="tx", bold=True), txt(70, 18, "Ritmo", 12, cls="tx", bold=True), txt(130, 18, "Relação", 12, cls="tx", bold=True), txt(210, 18, "Tipo", 12, cls="tx", bold=True)]
for i, (v, r, q, t) in enumerate(tipos):
    y = 28 + i * 30
    for k, val in enumerate((v, r, q)):
        c.append(f'<rect x="{12 + k * 60}" y="{y}" width="44" height="22" rx="5" class="{"barra1" if val == "A" else "b2"}"/>')
        c.append(txt(34 + k * 60, y + 15, "alto" if val == "A" else "baixo", 10, "middle", "tx" if val == "B" else "inv"))
    risco = t in ("Âncora esfriando", "Valioso em risco", "Cordial seletivo", "Desertor")
    c.append(box(210, y - 2, 170, 26, [t], "b" if not risco else "b2", 11, not risco))
c += [txt(400, 50, "Valor: receita ganha em 12 meses", 11, cls="tx"), txt(400, 65, "mais pipeline ponderado.", 11),
      txt(400, 95, "Ritmo: recência e frequência de", 11, cls="tx"), txt(400, 110, "ações de valor (o R e o F do RFV).", 11),
      txt(400, 140, "Relação: pulso trimestral, retorno", 11, cls="tx"), txt(400, 155, "mútuo e equilíbrio entre dar e receber.", 11),
      txt(400, 185, "Potencial (4 Cs) não muda o tipo:", 11, cls="tx"), txt(400, 200, "decide só a intensidade da atenção.", 11),
      txt(10, 278, "Três fatores, dois níveis cada: 2 × 2 × 2 = 8 tipos, por regra. Em cinza, os quatro tipos de risco.", 11)]
V["cubo"] = svg(660, 288, "".join(c), "Cubo Valor, Ritmo e Relação")
# 4. tabela de abordagens
abord = [("Embaixador", "Proteger e alavancar; tom de sócio", "Mensal"), ("Gerador sob tensão", "Diagnosticar a tensão em 7 dias", "Quinzenal"),
         ("Âncora esfriando", "Chegar com oportunidade pronta", "Quinzenal"), ("Valioso em risco", "Ouvir por ligação; decidir em 15 dias", "Semanal"),
         ("Promissor", "Primeira venda em 90 dias", "Semanal"), ("Ativo sem tração", "Descobrir por que não vira receita", "Quinzenal"),
         ("Cordial seletivo", "Recrutar de novo com foco único", "Mensal leve"), ("Desertor", "Decidir, sem insistir", "Trimestral")]
c = [txt(10, 18, "Tipo", 12, cls="tx", bold=True), txt(190, 18, "Jogada", 12, cls="tx", bold=True), txt(540, 18, "Cadência", 12, cls="tx", bold=True)]
for i, (t, j, k) in enumerate(abord):
    y = 30 + i * 30
    c += [f'<rect x="6" y="{y - 4}" width="648" height="26" rx="5" class="{"b" if i % 2 == 0 else "b2"}"/>', txt(14, y + 13, t, 12, cls="tx", bold=True), txt(190, y + 13, j, 12, cls="tx"), txt(540, y + 13, k, 12)]
V["tipos"] = svg(660, 278, "".join(c), "Jogada por tipo")
# 5. CAC
c = [box(10, 20, 300, 110, ["CAC do canal de parcerias =", "comissões + horas + custos diretos", "÷ clientes fechados vindos de parceiros"], "b hi", 12),
     box(350, 20, 300, 110, ["CAC dos canais ativos =", "o custo médio de trazer um cliente", "por prospecção, eventos e mídia"], "b2", 12),
     txt(330, 80, "comparado a", 12, "middle", "tx", True),
     txt(10, 160, "O portal calcula o lado esquerdo sozinho. O lado direito é o único número que vem de fora.", 12),
     txt(10, 180, "Regra de decisão: o que não baixa o CAC nem aumenta a adesão dos parceiros não entra no programa.", 12, cls="tx")]
V["cac"] = svg(660, 192, "".join(c), "CAC do canal comparado aos canais ativos")
# 6. saúde do ecossistema
c = []
for i, (n, d1, d2) in enumerate([("Produtividade", "oportunidades e clientes por", "parceiro ativo; CAC caindo"), ("Robustez", "ativos que seguem ativos; não", "depender de um só parceiro"), ("Criação de nicho", "categorias e tipos novos", "gerando valor")]):
    x = 10 + i * 218
    c += [box(x, 20, 200, 40, [n], "b hi", 13, True), txt(x + 100, 82, d1, 11, "middle"), txt(x + 100, 97, d2, 11, "middle")]
c.append(txt(10, 132, "Painel trimestral do programa inteiro; o cubo continua sendo a leitura de cada parceiro.", 11))
V["saude"] = svg(660, 142, "".join(c), "Três medidas de saúde do ecossistema")
# 7. portões
c = [box(10, 150, 190, 50, ["Experimentação"], "b hi", 13, True), box(230, 100, 190, 50, ["Tração"], "b", 13, True), box(450, 50, 190, 50, ["Crescimento"], "b", 13, True),
     seta(200, 170, 228, 130), seta(420, 120, 448, 80)]
p1 = ["5 parceiros ativados", "3 clientes de parceiros", "CAC ≤ canais ativos", "50% viram reunião", "rituais estáveis"]
p2 = ["15 ativos, 40% em Ritmo alto", "20% dos clientes novos", "CAC na metade", "50% da conversa dos parceiros", "80% seguem ativos"]
for k, t in enumerate(p1): c.append(txt(14, 222 + k * 15, "• " + t, 11, cls="tx"))
for k, t in enumerate(p2): c.append(txt(234, 172 + k * 15, "• " + t, 11, cls="tx"))
c.append(txt(454, 120, "Categorias e regiões novas;", 11)); c.append(txt(454, 135, "segunda pessoa no time quando", 11)); c.append(txt(454, 150, "o custo de servir passar das horas.", 11))
V["portoes"] = svg(660, 302, "".join(c), "Fases e portões recomendados")
# 8. semana e mês
c = [box(10, 20, 300, 70, ["Semanal: você revisa as oportunidades", "abertas e conversa com cada closer"], "b hi", 12),
     box(350, 20, 300, 70, ["Mensal: resumo ao Igor em poucos números", "(CAC, ativos, oportunidades, portões)"], "b", 12),
     txt(10, 116, "Saem as três perguntas na reunião comercial. Fica o princípio: o programa vive dentro da rotina de venda.", 11)]
V["semana"] = svg(660, 126, "".join(c), "Rituais semanal e mensal")
# 9. diretor
c = [box(10, 30, 180, 50, ["Critérios no portal:", "tempo, tentativas, tipo"], "b2", 11), seta(190, 55, 230, 55), box(232, 30, 180, 50, ["Gerente decide"], "b hi", 13, True),
     seta(412, 55, 452, 55), box(454, 30, 190, 50, ["Igor: informado ou assina", "o aviso (sua escolha)"], "b", 11)]
V["diretor"] = svg(660, 100, "".join(c), "Quem decide o desligamento")
# 10. fechar o ciclo
etapas = ["Recebida", "Com o closer", "Primeiro contato", "Proposta", "Fechada ou perdida"]
c = [f'<line x1="40" y1="60" x2="620" y2="60" class="ln"/>']
for i, e in enumerate(etapas):
    x = 40 + i * 145
    c += [f'<circle cx="{x}" cy="60" r="8" class="pt"/>', txt(x, 40, e, 11, "middle", "tx", True), txt(x, 86, "mensagem ao parceiro", 10, "middle")]
c.append(box(470, 104, 180, 34, ["No fim: o impacto gerado"], "b hi", 11)); c.append(txt(40, 124, "O portal prepara cada mensagem; você envia no grupo do parceiro.", 11))
V["ciclo"] = svg(660, 150, "".join(c), "Fechar o ciclo em cada etapa")
# 11. ensinar
c = []
for i, (t, s2) in enumerate([("Perfil do cliente ideal", "uma página por empresa"), ("Frases-gatilho", "o que o cliente diz"), ("Mensagem pronta", "com o link exclusivo"), ("Prática curta", "na integração")]):
    x = 10 + i * 162
    c += [box(x, 20, 150, 44, [t], "b hi", 12, True), txt(x + 75, 84, s2, 11, "middle")]
c.append(txt(10, 116, "Reconhecer o momento + saber o que dizer + gesto sem atrito = mais indicações com o mesmo CAC.", 11))
V["ensinar"] = svg(660, 126, "".join(c), "Ferramentas para indicar")
# 12. comunidade
c = ['<circle cx="330" cy="110" r="58" class="b hi"/>', txt(330, 106, "Comunidade", 13, "middle", "tx", True), txt(330, 122, "Wise Partners", 13, "middle", "tx", True)]
for (x, y, t) in [(30, 20, ["Objetivo por fase:", "parceiros e oportunidades"]), (470, 20, ["Rituais fixos:", "mês, trimestre, mentoria"]), (30, 160, ["Grupo geral com pedidos", "e contribuições à vista"]), (470, 160, ["Reconhecimento por status,", "rede e acesso"])]:
    c.append(box(x, y, 170, 44, t, "b", 11))
    c.append(f'<line x1="{x + (170 if x < 300 else 0)}" y1="{y + 22}" x2="{330 + (-55 if x < 300 else 55)}" y2="{110 + (-25 if y < 100 else 25)}" class="ln fino"/>')
c.append(txt(330, 228, "A comissão fica fora da conversa da comunidade: norma social antes de norma de mercado.", 11, "middle"))
V["comunidade"] = svg(660, 238, "".join(c), "Comunidade como macroprocesso")
# 13. qualificação
c = [box(10, 20, 150, 50, ["Scorecard"], "b", 12), seta(160, 45, 180, 45), box(182, 20, 150, 50, ["Ficha de jogo"], "b", 12), seta(332, 45, 352, 45),
     box(354, 20, 150, 50, ["Sobreposição"], "b", 12), seta(504, 45, 524, 45), box(526, 20, 124, 50, ["Comportamento"], "b hi", 12, True),
     txt(10, 100, "Duas perguntas novas na ficha: o que ele já deu antes de pedir? A Wise o indicaria ao melhor cliente?", 11)]
V["qualificacao"] = svg(660, 112, "".join(c), "Qualificação com leitura de comportamento")
