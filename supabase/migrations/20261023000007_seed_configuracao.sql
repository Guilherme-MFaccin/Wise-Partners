-- Portal Wise Partners: valores iniciais da configuração (spec, Apêndices A, C e D). Todos editáveis pelo administrador.

insert into public.empresas_grupo (codigo, nome, base_calculo, pct_parceiro, pct_responsavel, descricao_institucional, ordem) values
  ('wise', 'Wise Makers', 'Primeira mensalidade da consultoria', 40, 10, 'Consultoria de estruturação comercial, de Maringá/PR. Organiza processos, rotinas e gestão da área comercial de empresas que vendem produto.', 1),
  ('triade', 'Tríade', 'Primeira parcela', 40, 10, 'Marketing e geração de demanda.', 2),
  ('swallow', 'Swallow', 'Valor do projeto', 6, 2, 'Produção audiovisual.', 3);

insert into public.niveis (tipo_parceria, codigo, nome, faixa_min, faixa_max, dias_morno, dias_dormente, cor) values
  ('comercial', 'A', 'Elite', 50, null, 30, 60, '#111827'),
  ('comercial', 'B', 'Premium', 15, 49, 60, 120, '#1E3A8A'),
  ('comercial', 'C', 'Select', 0, 14, 90, 180, '#365314'),
  ('institucional', 'A', 'Institucional A', null, null, 60, 120, '#111827'),
  ('institucional', 'B', 'Institucional B', null, null, 60, 120, '#1E3A8A'),
  ('institucional', 'C', 'Institucional C', null, null, 90, 180, '#365314');

insert into public.pacotes (codigo, nome, niveis_permitidos, wise_hub, ordem, entregas, tarefas_onboarding) values
  ('C', 'C · Prateleira', '{A,B,C}', false, 1,
   '["Prateleira de fornecedores recíproca", "Comissão por indicação", "Grupo de WhatsApp com a Wise", "Acompanhamento trimestral"]',
   '["Comunicar a entrada na prateleira, com a categoria", "Criar o grupo de WhatsApp Wise Partners com o parceiro", "Solicitar logo, cores e dados cadastrais"]'),
  ('B', 'B · Formação', '{A,B}', true, 2,
   '["Prateleira de fornecedores recíproca", "Comissão por indicação", "Grupo de WhatsApp com a Wise", "Certificado e selo Wise Partner", "Wise Hub com as duas marcas", "Mentoria mensal aberta à carteira", "Convite aos eventos presenciais", "Acompanhamento mensal"]',
   '["Comunicar a entrada na prateleira, com a categoria", "Criar o grupo de WhatsApp Wise Partners com o parceiro", "Solicitar logo, cores e dados cadastrais", "Publicar a página do parceiro no Wise Hub e enviar o link no grupo", "Emitir o certificado Wise Partner e o kit de selos", "Enviar o convite para a próxima mentoria mensal, para o parceiro e a carteira"]'),
  ('A', 'A · Base Ativa', '{A}', true, 3,
   '["Prateleira de fornecedores recíproca", "Comissão por indicação", "Grupo de WhatsApp com a Wise", "Certificado e selo Wise Partner", "Wise Hub com as duas marcas", "Mentoria mensal aberta à carteira", "Convite aos eventos presenciais", "Programa Base Ativa conforme a fila", "Palco mediante acordo", "Acompanhamento quinzenal no ciclo, mensal fora dele"]',
   '["Comunicar a entrada na prateleira, com a categoria", "Criar o grupo de WhatsApp Wise Partners com o parceiro", "Solicitar logo, cores e dados cadastrais", "Publicar a página do parceiro no Wise Hub e enviar o link no grupo", "Emitir o certificado Wise Partner e o kit de selos", "Enviar o convite para a próxima mentoria mensal, para o parceiro e a carteira", "Informar a data do primeiro encontro do Base Ativa ou a posição na fila"]');

insert into public.catalogo_contrapartidas (nome, tipo_parceria, pacotes, niveis, natureza_juridica, periodicidade, periodicidade_por_pacote, prazo_inicial_dias, comprovacao, meta, ordem) values
  ('Contrato assinado e responsável nomeado', 'comercial', '{A,B,C}', null, null, 'na_assinatura', '{}', 0, 'Contrato e cadastro do responsável', null, 10),
  ('Manter a Wise entre as opções de consultoria comercial apresentadas aos clientes', 'comercial', '{A,B,C}', null, null, 'continua', '{}', 0, 'Declaração na revisão trimestral', null, 20),
  ('Anúncio da parceria (post no feed e stories, arte fornecida pela Wise)', 'comercial', '{A,B,C}', null, null, 'unica', '{}', 15, 'Link ou print', 'Uma vez, até 15 dias após a assinatura', 30),
  ('Wise na página de parceiros ou no rodapé do site', 'comercial', '{A,B,C}', null, null, 'continua', '{}', 30, 'Link', 'Até 30 dias após a assinatura e contínuo', 40),
  ('Participação nas reuniões de acompanhamento', 'comercial', '{A,B,C}', null, null, 'trimestral', '{"B": "mensal", "A": "mensal"}', 0, 'Registro da reunião', 'Pacote A: quinzenal durante o ciclo do Base Ativa, mensal fora dele', 50),
  ('Divulgação da mentoria mensal e do Wise Hub à carteira', 'comercial', '{A,B}', null, null, 'mensal', '{}', 0, 'Print do envio', 'No mínimo uma comunicação por mês', 60),
  ('Stories sobre a mentoria ou o Hub', 'comercial', '{A,B}', null, null, 'mensal', '{}', 0, 'Print', null, 70),
  ('Conteúdo conjunto (post, live ou artigo)', 'comercial', '{A,B}', null, null, 'trimestral', '{"A": "bimestral"}', 0, 'Link', null, 80),
  ('Usuários ativos no Wise Hub', 'comercial', '{B}', '{B}', null, 'unica', '{}', 90, 'Relatório do Hub anexado pela Wise', '10 usuários ativos em 90 dias', 90),
  ('Usuários ativos no Wise Hub', 'comercial', '{A,B}', '{A}', null, 'unica', '{}', 90, 'Relatório do Hub anexado pela Wise', '25 usuários ativos em 90 dias', 91),
  ('Responsável com 2 a 4 horas semanais durante o ciclo', 'comercial', '{A}', null, null, 'por_ciclo', '{}', 0, 'Presença nos encontros', null, 100),
  ('Evento com a base no fim do ciclo, com a Wise integrada (fala, marca e inscrição com opção de contato com a Wise)', 'comercial', '{A}', null, null, 'por_ciclo', '{}', 0, 'Registro do evento', 'Uma vez por ciclo', 110),
  ('Wise integrada nos eventos da comunidade formada no Base Ativa', 'comercial', '{A}', null, null, 'por_acao', '{}', 0, 'Registro do evento', 'Contínuo após o ciclo', 120),
  ('Case ou depoimento ao fim do ciclo', 'comercial', '{A}', null, null, 'por_ciclo', '{}', 0, 'Link ou arquivo', 'Uma vez por ciclo', 130),
  ('Divulgação das ações com 15 dias de antecedência', 'institucional', '{}', null, null, 'por_acao', '{}', 0, 'Link ou print', null, 200),
  ('Público mínimo combinado por ação', 'institucional', '{}', null, null, 'por_acao', '{}', 0, 'Lista de presença agregada ou registro da ação', null, 210),
  ('Inscrição com opção de contato com a Wise', 'institucional', '{}', null, null, 'por_acao', '{}', 0, 'Link do formulário de inscrição', null, 220),
  ('Avaliação ao fim de cada ação', 'institucional', '{}', null, null, 'por_acao', '{}', 0, 'Resultado da avaliação', null, 230),
  ('Anúncio da parceria', 'institucional', '{}', null, '{privada}', 'unica', '{}', 15, 'Link ou print', null, 240),
  ('Marca da Wise no material', 'institucional', '{}', null, '{privada}', 'por_acao', '{}', 0, 'Arquivo ou link do material', null, 250);

insert into public.tipos_atividade (nome, minutos, ordem) values
  ('Mensagem ou follow-up', 5, 1),
  ('Ligação', 15, 2),
  ('Reunião de apresentação', 75, 3),
  ('Check-in mensal', 45, 4),
  ('Check-in trimestral', 30, 5),
  ('Encontro do Base Ativa', 90, 6),
  ('Evento ou palestra', 180, 7),
  ('Documento enviado', 30, 8),
  ('Preparação de dossiê ou apresentação personalizada', 60, 9),
  ('Revisão semanal com o Diretor', 30, 10);

insert into public.etapas_funil (codigo, nome, ordem, perda) values
  ('sem_contato', 'Sem contato', 1, false),
  ('contato_feito', 'Contato feito', 2, false),
  ('retornou', 'Retornou', 3, false),
  ('reuniao_agendada', 'Reunião agendada', 4, false),
  ('reuniao_realizada', 'Reunião realizada', 5, false),
  ('proposta_decisor', 'Proposta com o decisor', 6, false),
  ('fechamento', 'Fechamento', 7, false),
  ('onboarding', 'Onboarding', 8, false),
  ('nao_elegivel', 'Não elegível', 90, true),
  ('sem_interesse', 'Sem interesse', 91, true),
  ('parceria_encerrada', 'Parceria encerrada', 92, true);

insert into public.criterios_icp (chave, descricao, ordem) values
  ('vendedores', 'Tem dois ou mais vendedores', 1),
  ('faturamento', 'Fatura a partir de R$ 250 mil por mês', 2),
  ('estruturacao', 'Tem necessidade de estruturação comercial', 3),
  ('produto', 'Vende produto, não só serviço', 4),
  ('nao_varejo_baixo', 'Não é varejo de ticket baixo e giro alto', 5);

insert into public.configuracoes (chave, valor, descricao) values
  ('email_financeiro', '""', 'E-mail do responsável financeiro que recebe os avisos de comissão a pagar'),
  ('wise_hub_url', '""', 'Endereço do Wise Hub (botão no portal do parceiro, pacotes B e A)'),
  ('app_url', '""', 'Endereço público do portal, usado nos links dos e-mails e da página de RFP'),
  ('horario_alertas', '"07:00"', 'Horário do e-mail diário (Brasília, hora cheia)'),
  ('relatorio_semanal_dia', '1', 'Dia da semana do relatório do Diretor (1 = segunda)'),
  ('relatorio_semanal_hora', '"08:00"', 'Horário do relatório semanal do Diretor (Brasília)'),
  ('validade_link_rfp_dias', '30', 'Validade, em dias, do link da página de RFP'),
  ('parada_contato_feito_dias_uteis', '4', 'Dias úteis em "contato feito" para alertar negociação parada'),
  ('parada_proposta_dias', '7', 'Dias em "proposta com o decisor" para alertar negociação parada'),
  ('indicacao_parada_dias', '30', 'Dias sem atualização para alertar indicação parada'),
  ('meta_assinados', '100', 'Meta de parceiros assinados'),
  ('meta_data', '"2027-06-30"', 'Data da meta de assinados'),
  ('estrategico_carteira_minima', '100', 'Carteira no ICP acima deste valor sugere parceiro estratégico'),
  ('estrategico_reunioes', '3', 'Indicações que viraram reunião para sugerir parceiro estratégico'),
  ('estrategico_janela_dias', '90', 'Janela, em dias, das indicações que viraram reunião'),
  ('texto_aviso_relacao_comercial', '"A Wise Makers mantém relação comercial com os fornecedores apresentados nesta página. A decisão de contratação é sempre sua, e recomendamos conversar com mais de uma opção antes de decidir."', 'Aviso de relação comercial exibido em toda página de RFP'),
  ('mensagem_whatsapp_rfp', '"Olá, sou cliente da Wise Makers e preciso resolver {problema resumido}. Eles indicaram o contato de vocês para eu conhecer melhor a solução."', 'Mensagem pronta do botão de WhatsApp da página de RFP'),
  ('tarefas_onboarding_institucional', '["Comunicar o início da parceria institucional", "Combinar o calendário de ações e o público mínimo por ação", "Solicitar logo e dados cadastrais"]', 'Tarefas criadas no onboarding de parceria institucional'),
  ('calendario_mentoria', '[]', 'Próximas edições da mentoria mensal: lista de {data, titulo, link}'),
  ('calendario_eventos', '[]', 'Próximos eventos: lista de {data, titulo, local, link}'),
  ('materiais_parceiro', '[]', 'Materiais para todos os parceiros: lista de {titulo, link}');

insert into public.feriados (data, nome) values
  ('2026-01-01', 'Confraternização Universal'), ('2026-02-16', 'Carnaval'), ('2026-02-17', 'Carnaval'),
  ('2026-04-03', 'Sexta-feira Santa'), ('2026-04-21', 'Tiradentes'), ('2026-05-01', 'Dia do Trabalho'),
  ('2026-06-04', 'Corpus Christi'), ('2026-09-07', 'Independência'), ('2026-10-12', 'Nossa Senhora Aparecida'),
  ('2026-11-02', 'Finados'), ('2026-11-15', 'Proclamação da República'), ('2026-11-20', 'Consciência Negra'),
  ('2026-12-25', 'Natal'),
  ('2027-01-01', 'Confraternização Universal'), ('2027-02-08', 'Carnaval'), ('2027-02-09', 'Carnaval'),
  ('2027-03-26', 'Sexta-feira Santa'), ('2027-04-21', 'Tiradentes'), ('2027-05-01', 'Dia do Trabalho'),
  ('2027-05-27', 'Corpus Christi'), ('2027-09-07', 'Independência'), ('2027-10-12', 'Nossa Senhora Aparecida'),
  ('2027-11-02', 'Finados'), ('2027-11-15', 'Proclamação da República'), ('2027-11-20', 'Consciência Negra'),
  ('2027-12-25', 'Natal');

-- Textos de e-mail (marcadores entre chaves duplas). O e-mail do link de acesso usa o modelo do Supabase Auth.
insert into public.textos_email (chave, assunto, corpo, descricao) values
  ('convite_parceiro', 'Seu acesso ao Portal Wise Partners',
   'Olá, {{nome}}.

A parceria com a Wise Makers começou, e o portal do parceiro já está disponível para você. Lá você acompanha a parceria, envia comprovações, registra indicações e vê os pedidos em que a sua empresa foi apresentada.

Use o botão abaixo para entrar. O acesso é por link no e-mail, sem senha.', 'Convite de acesso ao usuário do parceiro'),
  ('convite_interno', 'Seu acesso ao Portal Wise Partners',
   'Olá, {{nome}}.

Você recebeu acesso ao Portal Wise Partners. Use o botão abaixo para entrar. O acesso é por link no e-mail, sem senha.', 'Convite de acesso ao usuário interno'),
  ('resumo_diario', 'Suas pendências do Wise Partners hoje',
   'Bom dia, {{nome}}. Estes são os itens que precisam da sua ação hoje:', 'E-mail diário por responsável'),
  ('relatorio_semanal', 'Relatório semanal do Wise Partners',
   'Olá, {{nome}}. Este é o resumo do programa na última semana:', 'Relatório semanal do Diretor'),
  ('notificacao', '{{titulo}}', '{{mensagem}}', 'Avisos imediatos (aprovação pendente, proposta de ficha, comprovação, indicação nova, clique na página de RFP)'),
  ('comissao_a_pagar', 'Comissão a pagar: {{parceiro}}',
   'Há uma comissão a pagar no Wise Partners.

Parceiro: {{parceiro}}
Cliente: {{cliente}}
Empresa do grupo: {{empresa}}
Beneficiário: {{beneficiario}}
Valor: {{valor}}
Dados para nota fiscal: {{dados_nf}}', 'Aviso ao financeiro'),
  ('backup_concluido', 'Backup semanal do Wise Partners concluído',
   'O backup completo dos dados foi gerado e está disponível no armazenamento, na pasta {{pasta}}.', 'Aviso ao administrador');

-- Usuário inicial. Igor (Diretor) é convidado pela tela de usuários, com a marcação de Diretor.
insert into public.convites (email, nome, papel, empresa_grupo_id)
select 'guilherme@wisemakers.com.br', 'Guilherme Faccin', 'admin', id from public.empresas_grupo where codigo = 'wise';
