/**
 * Cria o formulário no Google Forms e a planilha de respostas.
 * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,
 * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.
 * Ao terminar, abra 'Registro de execução' e copie o link para enviar.
 * Gerado por mapear-processos para o formulário FO-03.
 */
function criarFormulario() {
  var form = FormApp.create("Rodada 1: clientes indicados por parceiros (comercial)");
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
  form.addPageBreakItem().setTitle("Clientes indicados por parceiros");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Sim", "Não", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Você já atendeu algum cliente que chegou por indicação de um parceiro do Wise Partners?");
  item = form.addParagraphTextItem();
  item.setTitle("Se sim, conte o último: como você soube da indicação, o que fez primeiro, em quanto tempo e quando o parceiro que indicou teve retorno.");
  form.addPageBreakItem().setTitle("Indicações e comissão");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O Guilherme", "O comercial da empresa que vai atender (Wise, Tríade ou Swallow)", "Um consultor da Wise", "Depende do caso", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando um parceiro indica um cliente, quem faz o primeiro contato com esse cliente?");
  form.addPageBreakItem().setTitle("Registro e retorno");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Sim, num campo do CRM", "Sim, numa anotação", "Não", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando chega um cliente indicado por parceiro, vocês registram de qual parceiro ele veio?");
  item = form.addTextItem();
  item.setTitle("Em qual sistema vocês registram as oportunidades de venda?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Eu", "O Guilherme", "Ninguém avisa hoje", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem avisa o parceiro sobre o andamento da indicação (primeiro contato, proposta, fechamento)?");
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
  var planilha = SpreadsheetApp.create("Rodada 1: clientes indicados por parceiros (comercial) (respostas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());
  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}
  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());
  Logger.log('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
