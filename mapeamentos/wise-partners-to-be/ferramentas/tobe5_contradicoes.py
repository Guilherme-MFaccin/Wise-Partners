# Contradições do to-be v5 (executado dentro de tobe5_base.py).
# Regra do patrocinador (FO-03 Q-0001): as decisões dele não pesam mais que os livros. Onde a decisão e um conjunto
# convergente de livros divergem (ou dois livros divergem entre si), a divergência fica aberta, o elemento passa a
# contestado e uma pergunta de conciliação vai para a Rodada 4. Cada contradição guarda as duas posições.
CT = {}
def contradicao(k, elemento, descricao, evs_patrocinador, evs_livros):
    CT[k] = add("contradicoes", "CT", descricao=descricao, elemento=elemento, evidencias=list(evs_patrocinador) + list(evs_livros),
                status="aberta", pergunta=None, resolucao="", evidencias_resolucao=[],
                lado_patrocinador=list(evs_patrocinador), lado_livros=list(evs_livros))
    for col in ("processos", "fatos", "papeis"):
        for o in d[col]:
            if o["id"] == elemento:
                o["status"] = "contestado"
    return CT[k]

contradicao("comissao", FT["comissao"],
    "Comissão em dinheiro, igual para todos e paga só na aquisição. O patrocinador decidiu regra única, sem exceção. Referral Engine, Business of Belonging, Strategic Alliances, o Método Octo e Platform Revolution dizem que a comissão sozinha é motivação fraca e passageira, que ela atrai quem só toma e que o incentivo deveria premiar também a permanência e o comportamento.",
    [D2("Q-0005"), D("Q-0006")],
    [VP(RE, 4), VP(BB, 10), F(PP, 3, 1), B("strategic-alliances", "Além da comissão"), B("platform-revolution", "Efeito de preço")])

contradicao("closer", P["6.2"],
    "Retorno do closer ao Gerente. O patrocinador decidiu que o lead vai direto ao closer, sem SLA e sem registro, com conversa só quando há indicação ou proposta nova. Referral Engine, Give and Take, Never Eat Alone, Channel Advantage e Customer Success dizem que o parceiro abandona quando não sabe o que aconteceu com a indicação, e que cada passagem precisa de registro e de sinal que vire ação.",
    [D2("Q-0014"), D3("Q-0008")],
    [VP(RE, 6), VP(GT, 5), VP(NE, 9, 0), VF(NE, 2, 5), B("channel-advantage", "Documentar cada passagem"), VP(CS, 2)])

contradicao("pilares", FT["oferta"],
    "Três pilares abertos para todos desde o primeiro parceiro. O patrocinador decidiu abrir Prateleira, Base Ativa e indicações juntos. Keystone, Business of Belonging, Winning the Right Game, o Método Octo e Nearbound dizem para provar o valor numa escala pequena antes de abrir tudo: poucos parceiros, um formato que se repete e só então a expansão.",
    [D("Q-0002")],
    [VP(KS, 4), VP(BB, 2), F(PP, 3, 0), B("winning-the-right-game", "Definir o MVE"), B("nearbound", "Ativar poucos parceiros")])

contradicao("dono", GP,
    "Um só dono para todas as tarefas. O patrocinador decidiu que o Gerente é dono de tudo, mesmo do que outros executam. O Método Octo e Customer Success apoiam o dono único no começo, mas Customer Success põe teto de parceiros por gerente, e Business of Belonging e Give and Take dizem que quem faz o trabalho de várias pessoas se esgota e que a escala vem de distribuir o controle com trilhos.",
    [D("Q-0013")],
    [F(PP, 4, 0), VP(CS, 8), VP(BB, 8), VP(GT, 9)])

contradicao("niveis", P["4.2.1"],
    "Nível de entrada pela promessa. A especificação aprovada põe o parceiro em Elite, Premium ou Select já na entrada, pela quantidade de clientes no ICP que ele declara. Bech diz para começar com estrutura simples e diferenciar só quando o desempenho real se mostrar diferente, porque com poucos parceiros todos querem o nível de cima e depois é preciso rebaixar.",
    [S("s2", "O nível de entrada continua definido pela faixa de clientes no ICP (Elite 50 ou mais, Premium 15 a 49, Select menos de 15)", "User Story 3")],
    [B("bech-partner-channels", "Não abrir com níveis"), B("bech-partner-channels", "Com poucos parceiros")])

contradicao("cac_primeiro", PR["cac"],
    "O CAC decide tudo desde o início. O patrocinador definiu o programa como canal de aquisição mais barato, julgado pelo CAC. Keystone, Give and Take, Customer Success e Business of Belonging dizem que o valor ao parceiro vem antes da captura, que dar esperando retorno rápido não funciona e que a comunidade só entrega resultado de negócio depois de seis a doze meses.",
    [D2("Q-0015"), D3("Q-0005")],
    [VP(KS, 1), VP(GT, 10), VP(CS, 7), VP(BB, 1)])

contradicao("placar", PR["reciprocidade"],
    "Medir o equilíbrio entre dar e receber. Na Rodada 3, o patrocinador aprovou o cubo, em que a Relação inclui o equilíbrio entre indicações enviadas e recebidas, e o princípio da reciprocidade visível de Give and Take. Never Eat Alone diz o contrário: dar primeiro e nunca manter placar. O próprio Ferrazzi, porém, pede que quem troca redes seja parceiro igual, que dá tanto quanto recebe.",
    [D3("Q-0003"), D3("Q-0001"), VP(GT, 2), VP(GT, 6)],
    [VP(NE, 0, 1), VP(NE, 0), VF(NE, 4, 4)])
