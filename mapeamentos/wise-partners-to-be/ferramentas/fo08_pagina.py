# Formulário V2 do roteiro do vídeo: fatos que só o patrocinador tem e as decisões pendentes do documento.
import json
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
ITENS = []
def Q(k, bloco, texto, tipo, contexto, opcoes=(), placeholder="", logica=""):
    ITENS.append({"id": "V2-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes), "contexto": contexto if isinstance(contexto, list) else [contexto],
                  "logica": logica, "citacoes": [], "visual": "", "placeholder": placeholder})
A, B, C, D = "Números e prova", "O que é a consultoria incluída", "Decisões que estavam no documento", "Página e chamada"

Q("numeros", A, "Quantos anos tem a Wise Makers e quantas empresas ela já atendeu?", "texto",
  "O Igor diz isso no bloco \"O que a Wise viu\". Só entra número que a Wise consiga mostrar se alguém perguntar.",
  placeholder="Ex.: 8 anos, 120 empresas atendidas. De onde vem o número (contratos, CRM, estimativa)?")
Q("dep_tipos", A, "Que depoimentos você tem?", "multipla",
  "Depoimento de parceiro de software fala direto com quem assiste; o de cliente com resultado prova o método.",
  ["Cliente da Wise Makers com resultado", "Empresa de software (CRM ou ERP) que já conversou ou já é parceira", "Cliente de um parceiro que fez o diagnóstico", "Outro (comente)"])
Q("dep1", A, "Depoimento 1: conte os detalhes.", "texto",
  ["Com esses dados eu escrevo o trecho do roteiro e a legenda. Se for vídeo já gravado, diga a frase mais forte e a duração."],
  placeholder="Nome, cargo e empresa\nQual era o problema antes\nO que mudou, com número e prazo\nFormato: vídeo, áudio, texto ou print\nAutoriza nome, rosto e logo? (sim ou não)")
Q("dep2", A, "Depoimento 2, se houver.", "texto", "Deixe em branco se só houver um.",
  placeholder="Nome, cargo e empresa\nO que mudou, com número e prazo\nFormato\nAutoriza nome, rosto e logo?")
Q("dep_onde", A, "Onde os depoimentos entram?", "escolha",
  "Um trecho de 10 a 15 segundos dentro do vídeo dá prova na hora; na página, abaixo do vídeo, sustenta quem rola a tela.",
  ["Dentro do vídeo, no bloco da prova, e também na página", "Só na página, logo abaixo do vídeo", "Só dentro do vídeo"])
Q("caso", A, "Qual caso o Igor conta em uma frase no bloco da prova?", "texto",
  "Pode ser o mesmo de um depoimento. A frase segue o modelo: cliente, como estava, o que mudou e em quanto tempo.",
  placeholder="Ex.: uma indústria de embalagens que saiu de 60% para 95% da meta em 6 meses depois de montar funil e rotina com a Wise.")

Q("diagnostico", B, "O diagnóstico está descrito certo: 40 a 60 minutos, conduzido pelo Guilherme, olhando meta, funil, time e rotina comercial?", "escolha",
  "É o passo 1 do vídeo. Se algo mudou (duração, quem conduz, o que é avaliado), comente.",
  ["Está certo", "Ajustar (comente)"])
Q("mapa", B, "O que o cliente recebe no mapa de planejamento?", "texto",
  "No vídeo, o Igor diz \"o que fazer e em que ordem para vender mais\". Preciso saber o que o documento traz de fato, para a página e para a tela do vídeo.",
  placeholder="Ex.: nota de maturidade por área, as 5 prioridades, um plano de 90 dias, metas sugeridas. Formato: PDF, planilha, apresentação?")
Q("hub", B, "O que existe hoje dentro do Wise Hub?", "texto",
  "É o passo 3 do vídeo e o motor do ciclo de valor. Números concretos (quantas aulas, quais ferramentas) tornam a promessa crível.",
  placeholder="Quantas aulas ou trilhas, sobre quais temas\nFerramentas e modelos (planilhas, roteiros, playbooks)\nAulas ao vivo? Com que frequência?\nAcesso por quanto tempo?")
Q("imagens", B, "Que imagens reais existem para mostrar no vídeo?", "multipla",
  "Os três passos ganham força com imagem real. Mapa só sem dados de cliente, ou com autorização.",
  ["Telas do Wise Hub", "Exemplo de mapa de planejamento sem dados de cliente", "Fotos ou vídeos de diagnóstico, aula ou evento", "Nenhuma ainda: precisa produzir"])

Q("formato", C, "Como a consultoria chega à base inteira do parceiro, com um diagnóstico individual por dia?", "escolha",
  ["Um parceiro com 200 clientes, 30% no perfil, gera uns 60 diagnósticos: três meses da sua agenda só para ele. Por isso o formato decide se a frase \"vale para a sua base de hoje\" se sustenta.",
   "O autodiagnóstico online pode nascer do roteiro da sua pesquisa, que já tem as perguntas."],
  ["Autodiagnóstico online com mapa na hora e acesso ao Hub; reunião individual para quem está no perfil e pede",
   "Diagnóstico em turma, até 10 empresas por encontro, no lançamento de cada parceiro",
   "Os dois: turma no lançamento e autodiagnóstico depois",
   "Ondas por parceiro, um de cada vez"],
  logica="Minha recomendação: os dois, turma no lançamento e autodiagnóstico depois.")
Q("beneficio_video", C, "Qual benefício entra no vídeo, no bloco \"O que muda para você\"?", "escolha",
  "Uma frase só, depois de \"o seu cliente usa mais e renova\" e \"um argumento que o concorrente não tem\".",
  ["Selo Wise Makers para o site e a proposta", "Relatório trimestral da maturidade comercial da sua base, sem identificar clientes", "Treinamento de gestão comercial para o seu time", "Outro (comente)"],
  logica="Minha recomendação: o treinamento do time, porque fala ao dono do software como benefício para ele e já está aprovado.")
Q("beneficios_pagina", C, "Quais benefícios entram na página? Marque os que a Wise consegue cumprir desde o primeiro parceiro.", "multipla",
  "São os do brainstorm. Marque só o que já dá para entregar; o resto pode entrar depois.",
  ["Selo Wise Makers para o site e a proposta", "Material de venda assinado pelos dois", "Caso publicado em conjunto", "Relatório trimestral da base", "Aviso de cliente em risco, com autorização do cliente",
   "Trilha no Wise Hub sobre o uso do sistema na gestão comercial", "Aula ao vivo trimestral para a base do parceiro", "Treinamento do time comercial do parceiro",
   "Diagnóstico do comercial do próprio parceiro", "Acesso do time do parceiro ao Wise Hub", "Clientes da Wise apresentados à solução do parceiro",
   "Apresentações a outros parceiros", "Encontros pequenos e presenciais", "Destaque e palco nos eventos da Wise"])
Q("selo", C, "Quem recebe o selo Wise Makers?", "escolha",
  "No Playbook v3.1, certificado e selo são do pacote B (Premium e Elite que divulgam a mentoria e o Hub para a própria base).",
  ["Todo SaaS que assina o termo", "Só quem chega ao pacote B", "Sem selo por enquanto"])

Q("agenda", D, "Como o lead marca a conversa de 45 minutos?", "escolha",
  "O botão abaixo do vídeo precisa levar a um lugar só. Se já existe link, cole no comentário.",
  ["Agenda online (Google Agenda, Calendly ou similar)", "Formulário curto e retorno por WhatsApp", "Botão direto para o WhatsApp"])
Q("nomes", D, "Como apresentar o Igor e o Guilherme no vídeo e na página?", "texto",
  "Nome e cargo exatos para a legenda do Igor e para a frase da chamada, que cita o Guilherme.",
  placeholder="Ex.: Igor Makoto, diretor e fundador da Wise Makers\nGuilherme Faccin, gerente de parcerias")
Q("evitar", D, "Algo que o vídeo precisa dizer ou evitar?", "texto", "Palavras, promessas ou comparações que a Wise não usa, ou um ponto que ficou de fora.",
  placeholder="Opcional")

json.dump(ITENS, open(BASE + "/ferramentas/fo08_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo08_modelo.html", encoding="utf-8").read()
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas")
