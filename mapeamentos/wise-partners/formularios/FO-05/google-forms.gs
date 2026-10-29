/**
 * Cria o formulário no Google Forms e a planilha de respostas.
 * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,
 * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.
 * Ao terminar, abra 'Registro de execução' e copie o link para enviar.
 * Gerado por mapear-processos para o formulário FO-05.
 */
function criarFormulario() {
  var form = FormApp.create("Rodada 1: perguntas ao patrocinador (conversa)");
  form.setDescription("Estamos desenhando o mapa de como o trabalho acontece na Programa Wise Partners. Não existe resposta certa ou errada, e ninguém será avaliado pelas respostas: descreva como funciona hoje, na prática, mesmo que seja diferente do ideal. Se alguma pergunta não for do seu dia a dia, marque 'Não sei / não é comigo' ou deixe em branco e indique quem saberia.");
  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage('Obrigado! Suas respostas vão direto para o mapa de processos.');
  var item;
  form.addSectionHeaderItem().setTitle("Funis e sistemas");
  item = form.addCheckboxItem();
  item.setChoiceValues(["Recrutamento", "Onboarding (integração e plano de 90 dias)", "Base Ativa", "Indicações", "Resgate de parceiro inativo", "Encerramento de parceria", "Ações conjuntas e contrapartidas", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quais destes trabalhos repetitivos devem virar funil (kanban próprio) no portal?");
  form.addPageBreakItem().setTitle("Duas regras que não batem");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["(a) Só pela carteira", "(b) Pelo resultado, na revisão trimestral", "As duas: entra pela carteira e depois acompanha o resultado", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Recebemos duas descrições sobre quando o nível de um parceiro muda. (a) Só quando a carteira dele muda de tamanho, ou quando uma informação nova corrige a estimativa. (b) Depois da entrada, o nível acompanha o resultado, com revisão a cada trimestre. Como deve valer?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["(a) Na primeira entrega concluída", "(b) Na ativação (primeira indicação que virou reunião)", "As duas: a primeira entrega fecha a negociação e a ativação fecha o onboarding", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Recebemos duas descrições sobre quando termina o onboarding de um parceiro. (a) Quando a primeira entrega do pacote é concluída. (b) Na ativação: quando a primeira indicação do parceiro, com ICP confirmado pela Wise, vira reunião. Como deve valer?");
  form.addPageBreakItem().setTitle("Funis e sistemas");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["No RD Station", "No portal", "Nos dois, em paralelo", "Está migrando do RD para o portal", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Hoje o funil de recrutamento roda no RD Station ou no portal?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["Por caso: cada necessidade é um atendimento com começo e fim", "Manutenção contínua do catálogo", "As duas coisas", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("A Prateleira de RFP funciona por caso (cada necessidade de cliente atendida com um parceiro) ou como manutenção contínua do catálogo?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["A data de retomada marcada", "Um sinal do prospect (resposta, evento, pedido)", "As duas coisas", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quando um prospect vai para nutrição, o que faz ele voltar para a negociação?");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O Guilherme", "O Igor", "O Guilherme, com aprovação do Igor", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem decide e publica as regras do programa e os comunicados aos parceiros?");
  form.addPageBreakItem().setTitle("Gestão do programa");
  item = form.addMultipleChoiceItem();
  item.setChoiceValues(["O Igor", "O Guilherme", "Os dois juntos", "Os sócios da Wise", "Não sei / não é comigo"]);
  item.showOtherOption(true);
  item.setTitle("Quem define as metas do programa e a fase em que ele está (experimentação, tração, crescimento)?");
  form.addPageBreakItem().setTitle("Funis e sistemas");
  item = form.addTextItem();
  item.setTitle("Quem são, com nome e contato de trabalho, o consultor da Wise, o comercial da Tríade ou da Swallow e a pessoa do financeiro que vão responder aos formulários?");
  var planilha = SpreadsheetApp.create("Rodada 1: perguntas ao patrocinador (conversa) (respostas)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());
  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}
  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());
  Logger.log('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
