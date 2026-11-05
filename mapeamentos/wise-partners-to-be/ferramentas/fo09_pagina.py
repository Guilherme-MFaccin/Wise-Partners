# Formulário da landing page dos parceiros (SaaS de CRM e ERP), guiado pelas skills anexadas.
import json
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
BASE = "/home/user/mapeamentos/wise-partners-to-be"
ITENS = []
def SK(skill, trecho): return {"livro": f"Skill {skill}", "pagina": "SKILL.md", "trecho": trecho}
def Q(k, bloco, texto, tipo, contexto, opcoes=(), placeholder="", logica="", cits=()):
    ITENS.append({"id": "LP-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes), "contexto": contexto if isinstance(contexto, list) else [contexto],
                  "logica": logica, "citacoes": list(cits), "visual": "", "placeholder": placeholder})
A, B, C, D, E = "A ação principal", "A mensagem", "Prova e objeções", "Visual e onde a página fica", "Medição e regras"

Q("cta", A, "O que acontece quando o dono do SaaS clica no botão principal?", "escolha",
  ["A página tem uma ação só. Você decidiu que a entrada é pelo portal Wise Partners, sem conversa. Falta saber se o cadastro acontece na própria página ou se o botão leva para o portal.",
   "O formulário na própria página costuma converter mais, porque o lead não troca de tela; o portal recebe os dados e cria o acesso."],
  ["Formulário curto na própria página, que cria o acesso ao portal e manda o login por e-mail",
   "Botão que leva para a tela de cadastro do portal",
   "Formulário na página só com nome, e-mail e WhatsApp; o resto do cadastro fica no portal"],
  logica="Minha recomendação: formulário curto na própria página, com o resto do cadastro dentro do portal.",
  cits=[SK("landing-page", "one offer → one audience → one primary action"), SK("page-cro", "Too many form fields")])
Q("campos", A, "Quais campos o cadastro pede na página?", "multipla",
  "Cada campo a mais derruba conversão; cada campo a menos deixa entrar quem não é o perfil. Marque só o que precisa estar ali.",
  ["Nome", "E-mail", "WhatsApp", "Nome da empresa", "CNPJ", "Tipo de software (CRM, ERP, outro)", "Quantos clientes ativos na base", "Site da empresa", "Cargo"],
  logica="Minha recomendação: nome, e-mail, WhatsApp, empresa e tipo de software. CNPJ e tamanho da base ficam para o portal.",
  cits=[SK("page-cro", "Required information that shouldn't be required")])
Q("filtro", A, "Quem não é CRM ou ERP e se cadastra, o que acontece?", "escolha",
  "Agências ficaram de fora do foco; outros softwares de gestão podem aparecer pelos anúncios.",
  ["Entra no portal igual, sem filtro", "Entra numa lista de espera, e você aprova ou recusa no portal", "Recebe uma mensagem de que o programa, por enquanto, é só para CRM e ERP"])
Q("termo", A, "Como o parceiro aceita o termo de parceria?", "escolha",
  "Sem conversa e sem assinatura do Igor caso a caso, o termo precisa ser aceito no próprio cadastro ou no primeiro acesso.",
  ["Aceite eletrônico do termo padrão no cadastro, com link para ler", "Aceite eletrônico no primeiro acesso ao portal", "Assinatura no Autentique, enviada automaticamente depois do cadastro"])

Q("anuncios", B, "Quais são as frases de abertura dos 5 vídeos de anúncio?", "texto",
  "O título da página precisa repetir a promessa do anúncio que a pessoa acabou de ver. Cole a primeira frase de cada vídeo e, se tiver, o texto do anúncio.",
  placeholder="Vídeo 1: ...\nVídeo 2: ...\nVídeo 3: ...\nVídeo 4: ...\nVídeo 5: ...\nTexto dos anúncios, se houver",
  cits=[SK("landing-page", "mirror the ad headline in the hero"), SK("page-cro", "Does it match the traffic source's messaging?")])
Q("titulo", B, "Qual linha de título você prefere para a página?", "escolha",
  "As três dizem a mesma promessa do vídeo. Depois de ler os anúncios, ajusto a palavra exata.",
  ["Venda o seu software com consultoria comercial incluída. Sem custo para você.",
   "O seu CRM com consultoria comercial incluída: o argumento que o concorrente não tem.",
   "Pare de competir por preço: inclua consultoria comercial no seu software, sem custo.",
   "Outra (comente)"],
  cits=[SK("landing-page", "Headline (outcome + audience)"), SK("copywriting", "Clarity Over Cleverness")])
Q("tom", B, "Como a página fala com o dono do software?", "escolha", "Vale para o texto inteiro e para os botões.",
  ["Você, direto e profissional, como o Igor no vídeo", "Você, mais informal, como conversa de WhatsApp", "Mais formal, em terceira pessoa (a sua empresa)"])
Q("video", B, "Onde fica o vídeo do Igor?", "escolha",
  "O vídeo carrega a explicação; o título e o botão carregam a decisão.",
  ["No topo, ao lado do título e do botão", "Logo abaixo do título, antes de qualquer outra seção", "No meio da página, depois dos três passos"],
  logica="Minha recomendação: no topo, ao lado do título no computador e logo abaixo dele no celular.",
  cits=[SK("landing-page", "Hero visual (product screenshot/video)")])
Q("tamanho", B, "Qual formato de página?", "escolha",
  ["Página clássica: topo, resultados, três passos, prova, perguntas frequentes e chamada final.",
   "Página longa: as mesmas seções, com mais explicação, para quem chega frio e desconfiado de oferta gratuita."],
  ["Clássica, mais enxuta", "Longa, para tráfego frio", "Mínima: título, vídeo e cadastro"],
  logica="Minha recomendação: clássica. Tráfego de anúncio é frio, mas o vídeo já faz a explicação longa.",
  cits=[SK("landing-page", "you need to educate + overcome skepticism")])

Q("objecoes", C, "Quais dúvidas o dono do software vai ter antes de se cadastrar?", "multipla",
  "Cada objeção marcada vira uma pergunta frequente ou uma linha perto do botão. Comente outras que você já ouviu.",
  ["Por que é de graça? Qual é o porém?", "A Wise vai vender outra coisa para o meu cliente?", "A Wise vai concorrer com o meu time de implantação ou de sucesso do cliente?",
   "Vai dar trabalho para o meu time?", "Quais dados dos meus clientes a Wise vê?", "Meu cliente não é indústria: serve para ele?", "Como e quando recebo a comissão?", "Posso sair quando quiser?"],
  cits=[SK("page-cro", "Will this work for my situation?"), SK("landing-page", "Objection handling is a section, not a footer")])
Q("respostas", C, "Escreva a resposta curta da Wise para as dúvidas que você marcou.", "texto",
  "Só o que a Wise sustenta. Eu reescrevo no tom da página.",
  placeholder="Por que é de graça: ...\nA Wise vende outra coisa ao meu cliente: ...\nComissão: ...")
Q("risco", C, "Quais garantias aparecem perto do botão?", "multipla",
  "Uma linha logo abaixo do botão reduz o risco percebido.",
  ["Sem custo para você e para o seu cliente", "Sem exclusividade", "Sem meta mínima de indicação", "Sai quando quiser", "A Wise nunca recebe a sua lista de clientes"],
  cits=[SK("landing-page", "Reduce risk")])
Q("logos", C, "Que logos de clientes da Wise Makers podem aparecer?", "texto",
  "Logos conhecidos perto do topo funcionam como prova rápida. Só com autorização de cada empresa.",
  placeholder="Protectpool, Fusion Alumínios e outros. Quem já autorizou?",
  cits=[SK("page-cro", "Customer logos (especially recognizable ones)")])

Q("visual", D, "Qual direção visual a página segue?", "escolha",
  ["A regra do projeto diz que a identidade Wise prevalece sobre qualquer estilo sugerido por outra skill: fundo quase preto, texto branco e o verde menta usado só no que importa, como o botão.",
   "Se a Wise Makers tiver outra identidade no site ou nos anúncios, a página precisa seguir a dos anúncios."],
  ["Identidade Wise do portal: fundo quase preto, verde menta só no botão e nos destaques", "Identidade do site e dos anúncios da Wise Makers (mande o link ou o manual)", "Clara, com fundo branco e o verde menta como destaque"],
  logica="Minha recomendação: a mesma identidade dos 5 vídeos de anúncio, para a página parecer a continuação deles.",
  cits=[SK("visual-style-presets", "Do not blend two presets in one interface.")])
Q("ativos", D, "Onde estão os arquivos da marca e as imagens?", "texto",
  "Logo em vetor, fotos do Igor, os vídeos e as três imagens que vamos produzir (telas do Hub, mapa de exemplo, foto de diagnóstico ou aula).",
  placeholder="Link do Drive ou do manual da marca\nLogo em SVG ou PNG\nFotos do Igor\nVídeo final do Igor (quando estiver pronto)")
Q("endereco", D, "Onde a página fica?", "escolha",
  "Dentro do portal, o cadastro e o login ficam no mesmo lugar. Num domínio da Wise Makers, a página ganha a marca no endereço.",
  ["Dentro do portal Wise Partners (ex.: portal-wise-partners.netlify.app/parceiros)", "Num subdomínio da Wise Makers (ex.: parceiros.wisemakers.com.br)", "Na ferramenta de páginas que a Wise já usa (comente qual)"],
  logica="Minha recomendação: subdomínio da Wise Makers apontando para o portal, que junta as duas vantagens.")

Q("pixel", E, "Que medição a página precisa ter?", "multipla",
  "Sem o pixel do Meta registrando o cadastro, o anúncio não aprende quem converte.",
  ["Pixel do Meta com o evento de cadastro", "API de Conversões do Meta (servidor)", "Google Analytics 4", "Parâmetros UTM gravados junto com o cadastro, para saber qual dos 5 vídeos trouxe cada parceiro"],
  logica="Minha recomendação: as quatro. Diga no comentário quem tem acesso ao Gerenciador de Negócios do Meta e o ID do pixel, sem colar senha ou token.",
  cits=[SK("analytics-tracking", "Document all UTMs in a spreadsheet")])
Q("indexar", E, "A página aparece no Google?", "escolha", "Página só de anúncio costuma ficar fora da busca.",
  ["Não: só para quem vem dos anúncios", "Sim: quero que apareça na busca também"],
  logica="Minha recomendação: não, por enquanto.",
  cits=[SK("landing-page", "ad-only campaigns")])
Q("legal", E, "A Wise Makers já tem política de privacidade publicada?", "escolha",
  "O formulário coleta dados pessoais, e a página precisa do link da política e de uma linha de consentimento.",
  ["Sim (cole o link no comentário)", "Não: preciso de uma"])
Q("prazo", E, "Quando os anúncios começam a rodar?", "texto",
  "A página e o cadastro no portal precisam estar prontos antes. Isso define o que entra na primeira versão.",
  placeholder="Data prevista")

json.dump(ITENS, open(BASE + "/ferramentas/fo09_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas")
