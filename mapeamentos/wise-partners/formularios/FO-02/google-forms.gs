/**
 * Cria o formulário no Google Forms e a planilha de respostas.
 * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,
 * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.
 * Ao terminar, abra 'Registro de execução' e copie o link para enviar.
 * Gerado por mapear-processos para o formulário FO-02.
 */
function criarFormulario() {
  var form = FormApp.create("Rodada 1: prateleira e clientes indicados (consultoria)");
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
  form.addPageBreakItem().setTitle("Prateleira de fornecedores");
  item = form.addParagraphTextItem();
  item.setTitle("Pense na última vez que você mostrou a um cliente a prateleira de fornecedores (empresas parceiras que atendem uma necessidade dele). O que aconteceu: como surgiu, o que você mostrou e o que veio depois?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Toda semana", "Uma ou duas vezes por mês", "Raramente", "Nunca aconteceu", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Com que frequência isso acontece?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Eu mesmo", "O Guilherme", "O cliente procura o parceiro sozinho", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando o cliente se interessa por um parceiro da prateleira, quem apresenta um ao outro?");
  item = form.addTextItem();
  item.setTitle("Onde fica registrado que você apresentou um parceiro a um cliente?");
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
  form.addPageBreakItem().setTitle("Clientes indicados por parceiros");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O consultor que atende o cliente", "O Guilherme", "Ninguém faz isso hoje", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Depois que um cliente indicado fecha, quem fala com ele para saber se continua ativo e satisfeito?");
  form.addPageBreakItem().setTitle("Para fechar");
  item = form.addParagraphTextItem();
  item.setTitle("Quem mais deveríamos ouvir sobre estes assuntos? Diga nome, função e, se puder, contato.");
  item = form.addParagraphTextItem();
  item.setTitle("Existe algum documento, planilha, sistema ou link que mostre como isso funciona? Cole aqui ou descreva onde está.");
  item = form.addParagraphTextItem();
  item.setTitle("Algo importante que não perguntamos?");
  var planilha = SpreadsheetApp.create("Rodada 1: prateleira e clientes indicados (consultoria) (respostas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());
  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}
  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());
  Logger.log('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
