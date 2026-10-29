/**
 * Cria o formulário no Google Forms e a planilha de respostas.
 * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,
 * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.
 * Ao terminar, abra 'Registro de execução' e copie o link para enviar.
 * Gerado por mapear-processos para o formulário FO-01.
 */
function criarFormulario() {
  var form = FormApp.create("Rodada 1: o programa visto pela diretoria");
  form.setDescription("Estamos desenhando o mapa de como o trabalho do Programa Wise Partners acontece, para organizar os funis e as tarefas do portal. Não tem resposta certa ou errada e ninguém será avaliado pelas respostas: vale como funciona hoje, na prática. Leva cerca de 10 minutos.");
  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage('Obrigado! Suas respostas vão direto para o mapa de processos.');
  var item;
  form.addSectionHeaderItem().setTitle("Sobre você");
  item = form.addTextItem();
  item.setTitle("Seu nome");
  item.setRequired(true);
  item = form.addTextItem();
  item.setTitle("Sua função ou cargo");
  item.setRequired(true);
  item = form.addTextItem();
  item.setTitle("Área ou equipe em que você trabalha");
  item = form.addTextItem();
  item.setTitle("Seu e-mail (opcional, só para tirarmos dúvidas)");
  form.addPageBreakItem().setTitle("O programa na prática");
  item = form.addParagraphTextItem();
  item.setTitle("Pense no último parceiro com quem você conversou ou negociou. Conte o caminho dele, do primeiro contato até hoje: quem falou com ele, o que foi combinado e em que ponto está.");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Muito: cada indicação passa por mais de uma empresa", "Em parte: só em alguns casos", "Pouco: cada empresa trata as próprias indicações sozinha", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Para uma indicação de parceiro virar cliente, o quanto a Wise, a Tríade e a Swallow dependem de informações umas das outras?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Sim, deve ser igual nas três", "Em parte: igual no registro e no retorno ao parceiro, livre na venda", "Não: cada empresa trata do seu jeito", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("O programa ganha quando Wise, Tríade e Swallow tratam a indicação do mesmo jeito (mesmo prazo, mesmo registro, mesmo retorno ao parceiro)?");
  form.addPageBreakItem().setTitle("Duas regras que não batem");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["(a) Só pela carteira", "(b) Pelo resultado, na revisão trimestral", "As duas: entra pela carteira e depois acompanha o resultado", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Recebemos duas descrições sobre quando o nível de um parceiro muda. (a) Só quando a carteira dele muda de tamanho, ou quando uma informação nova corrige a estimativa. (b) Depois da entrada, o nível acompanha o resultado, com revisão a cada trimestre. Como deve valer?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["(a) Na primeira entrega concluída", "(b) Na ativação (primeira indicação que virou reunião)", "As duas: a primeira entrega fecha a negociação e a ativação fecha o onboarding", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Recebemos duas descrições sobre quando termina o onboarding de um parceiro. (a) Quando a primeira entrega do pacote é concluída. (b) Na ativação: quando a primeira indicação do parceiro, com ICP confirmado pela Wise, vira reunião. Como deve valer?");
  form.addPageBreakItem().setTitle("Assinatura e encerramento");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Volta para ajuste da minuta e nova aprovação", "A negociação é perdida", "Fica parada até uma nova conversa", "Nunca aconteceu", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando você não aprova a assinatura de um termo, o que acontece com a negociação?");
  item = form.addParagraphTextItem();
  item.setTitle("Quando uma parceria precisa acabar (por decisão do parceiro ou da Wise), quem decide e o que precisa ser feito? Se já aconteceu, conte o caso.");
  form.addPageBreakItem().setTitle("Gestão do programa");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O Igor", "O Guilherme", "Os dois juntos", "Os sócios da Wise", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem define as metas do programa e a fase em que ele está (experimentação, tração, crescimento)?");
  item = form.addTextItem();
  item.setTitle("De quanto em quanto tempo as metas do programa são revisadas, e em qual reunião?");
  item = form.addParagraphTextItem();
  item.setTitle("Pense na última vez que um parceiro ganhou palco num evento da Wise (palestra, painel, estande). Quem decidiu, como foi combinado e o que o parceiro recebeu? Se ainda não aconteceu, escreva \"ainda não\".");
  form.addPageBreakItem().setTitle("Indicações e comissão");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O financeiro da Wise Makers", "O financeiro da empresa que fechou o cliente (Wise, Tríade ou Swallow)", "O Guilherme", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem responde pelo pagamento da comissão ao parceiro?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O Guilherme", "O comercial da empresa que vai atender (Wise, Tríade ou Swallow)", "Um consultor da Wise", "Depende do caso", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando um parceiro indica um cliente, quem faz o primeiro contato com esse cliente?");
  form.addPageBreakItem().setTitle("Para fechar");
  item = form.addParagraphTextItem();
  item.setTitle("Quem mais deveríamos ouvir sobre estes assuntos? Diga nome, função e, se puder, contato.");
  item = form.addParagraphTextItem();
  item.setTitle("Existe algum documento, planilha, sistema ou link que mostre como isso funciona? Cole aqui ou descreva onde está.");
  item = form.addParagraphTextItem();
  item.setTitle("Algo importante que não perguntamos?");
  var planilha = SpreadsheetApp.create("Rodada 1: o programa visto pela diretoria (respostas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());
  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}
  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());
  Logger.log('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
