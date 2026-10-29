/**
 * Cria o formulário no Google Forms e a planilha de respostas.
 * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,
 * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.
 * Ao terminar, abra 'Registro de execução' e copie o link para enviar.
 * Gerado por mapear-processos para o formulário FO-04.
 */
function criarFormulario() {
  var form = FormApp.create("Rodada 1: comissão ao parceiro (financeiro)");
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
  form.addPageBreakItem().setTitle("Comissão ao parceiro");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Sim", "Não", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Vocês já pagaram alguma comissão a um parceiro do Wise Partners?");
  item = form.addParagraphTextItem();
  item.setTitle("Conte o último pagamento de comissão por indicação (a um parceiro ou a outro fornecedor): quem pediu, o que foi conferido antes e como foi pago.");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Pelo extrato ou pelo sistema financeiro", "O comercial avisa", "O Guilherme avisa", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Como vocês ficam sabendo que o primeiro pagamento do cliente indicado foi compensado?");
  item = form.addCheckboxItem();
  item.setChoiceValues(["Nota fiscal do parceiro", "Contrato assinado com o parceiro", "Aprovação do diretor", "Aprovação do Guilherme", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("O que precisa estar em mãos antes de pagar a comissão?");
  item = form.addTextItem();
  item.setTitle("Depois de receber a nota fiscal, em quantos dias o pagamento costuma sair?");
  item = form.addTextItem();
  item.setTitle("Em qual sistema o pagamento é registrado?");
  form.addPageBreakItem().setTitle("Indicações e comissão");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O financeiro da Wise Makers", "O financeiro da empresa que fechou o cliente (Wise, Tríade ou Swallow)", "O Guilherme", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem responde pelo pagamento da comissão ao parceiro?");
  form.addPageBreakItem().setTitle("Registro e retorno");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Eu aviso", "O Guilherme avisa", "O financeiro vê no sistema", "Ainda não aconteceu", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando um cliente indicado fecha e paga a primeira mensalidade, como o financeiro fica sabendo que há comissão a pagar ao parceiro?");
  form.addPageBreakItem().setTitle("Para fechar");
  item = form.addParagraphTextItem();
  item.setTitle("Quem mais deveríamos ouvir sobre estes assuntos? Diga nome, função e, se puder, contato.");
  item = form.addParagraphTextItem();
  item.setTitle("Existe algum documento, planilha, sistema ou link que mostre como isso funciona? Cole aqui ou descreva onde está.");
  item = form.addParagraphTextItem();
  item.setTitle("Algo importante que não perguntamos?");
  var planilha = SpreadsheetApp.create("Rodada 1: comissão ao parceiro (financeiro) (respostas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());
  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}
  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());
  Logger.log('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
