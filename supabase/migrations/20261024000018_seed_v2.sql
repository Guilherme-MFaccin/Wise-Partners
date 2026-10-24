-- Portal Wise Partners 2.0: dados iniciais (seção 9 do briefing)

-- ---------------------------------------------------------------------------
-- Atividades por esforço (Apêndice N). Os 10 tipos da v1 são mantidos e reclassificados.
-- ---------------------------------------------------------------------------
update public.tipos_atividade t set chave = x.chave, etapa_jornada = x.etapa, nome = x.nome_novo
  from (values
    ('Mensagem ou follow-up', 'mensagem', 'captacao', 'Mensagem ou follow-up'),
    ('Ligação', 'ligacao', 'captacao', 'Ligação'),
    ('Reunião de apresentação', 'reuniao_apresentacao', 'captacao', 'Reunião de apresentação (45 min mais preparação)'),
    ('Preparação de dossiê ou apresentação personalizada', 'dossie', 'captacao', 'Preparação de dossiê ou apresentação personalizada'),
    ('Documento enviado', 'documento', 'captacao', 'Documento enviado (minuta, resumo, proposta)'),
    ('Check-in mensal', 'checkin_mensal', 'relacionamento', 'Check-in mensal'),
    ('Check-in trimestral', 'checkin_trimestral', 'relacionamento', 'Check-in trimestral'),
    ('Encontro do Base Ativa', 'encontro_base_ativa', 'ida_mercado', 'Encontro do Base Ativa (com preparação)'),
    ('Evento ou palestra', 'evento', 'ida_mercado', 'Evento ou palestra'),
    ('Revisão semanal com o Diretor', 'revisao_semanal', 'gestao', 'Revisão semanal com o Diretor')
  ) as x(nome, chave, etapa, nome_novo)
 where t.nome = x.nome;

insert into public.tipos_atividade (nome, minutos, ordem, chave, etapa_jornada) values
  ('Pesquisa e preparação da abordagem', 20, 101, 'pesquisa_abordagem', 'captacao'),
  ('Preenchimento do scorecard', 15, 106, 'scorecard', 'captacao'),
  ('Negociação e ajuste de proposta', 45, 107, 'negociacao', 'captacao'),
  ('Geração e revisão da minuta de contrato', 30, 109, 'minuta_contrato', 'captacao'),
  ('Aprovação de assinatura com o Diretor', 15, 110, 'aprovacao_diretor', 'captacao'),
  ('Contato de nutrição', 10, 111, 'contato_nutricao', 'captacao'),
  ('Tarefas de implantação do pacote', 60, 201, 'implantacao_pacote', 'onboarding'),
  ('Encontro de alinhamento', 60, 202, 'encontro_alinhamento', 'onboarding'),
  ('Encontro de vendas', 60, 203, 'encontro_vendas', 'onboarding'),
  ('Encontro de produto', 60, 204, 'encontro_produto', 'onboarding'),
  ('Encontro de pós-venda', 45, 205, 'encontro_pos_venda', 'onboarding'),
  ('Emissão de certificado e selos', 15, 206, 'certificado_selos', 'onboarding'),
  ('Revisão de nível do parceiro', 20, 303, 'revisao_nivel', 'relacionamento'),
  ('Avaliação de maturidade', 20, 304, 'avaliacao_maturidade', 'relacionamento'),
  ('Tentativa de retomada', 15, 305, 'tentativa_retomada', 'relacionamento'),
  ('Desligamento (aviso e encerramento)', 45, 306, 'desligamento', 'relacionamento'),
  ('Resposta a dúvida do parceiro', 10, 307, 'duvida_parceiro', 'relacionamento'),
  ('Validação de proposta de ficha ou de comprovação', 5, 308, 'validacao_proposta', 'relacionamento'),
  ('Tratamento de indicação (validação e repasse)', 15, 401, 'tratamento_indicacao', 'ida_mercado'),
  ('Atualização de indicação', 5, 402, 'atualizacao_indicacao', 'ida_mercado'),
  ('Checagem do cliente aos 6 ou 12 meses', 10, 403, 'checagem_cliente', 'ida_mercado'),
  ('Ação conjunta de marketing (arte, post, envio)', 60, 404, 'acao_marketing', 'ida_mercado'),
  ('Análise de cruzamento de carteiras', 45, 407, 'analise_cruzamento', 'ida_mercado'),
  ('Preparação da pauta e do relatório', 20, 502, 'pauta_relatorio', 'gestao'),
  ('Comunicado à base de parceiros', 30, 503, 'comunicado', 'gestao'),
  ('Produção ou atualização de conteúdo de trilha', 120, 504, 'conteudo_trilha', 'gestao'),
  ('Análise da pesquisa de satisfação', 30, 505, 'analise_pesquisa', 'gestao'),
  ('Premiação anual', 240, 506, 'premiacao_anual', 'gestao'),
  ('Gestão geral do programa (sem parceiro)', 60, 507, 'gestao_geral', 'gestao')
on conflict (nome) do nothing;

-- Ordem por etapa da jornada
update public.tipos_atividade set ordem = case chave
  when 'pesquisa_abordagem' then 1 when 'mensagem' then 2 when 'ligacao' then 3 when 'reuniao_apresentacao' then 4
  when 'dossie' then 5 when 'scorecard' then 6 when 'negociacao' then 7 when 'documento' then 8 when 'minuta_contrato' then 9
  when 'aprovacao_diretor' then 10 when 'contato_nutricao' then 11
  when 'implantacao_pacote' then 21 when 'encontro_alinhamento' then 22 when 'encontro_vendas' then 23 when 'encontro_produto' then 24
  when 'encontro_pos_venda' then 25 when 'certificado_selos' then 26
  when 'checkin_mensal' then 31 when 'checkin_trimestral' then 32 when 'revisao_nivel' then 33 when 'avaliacao_maturidade' then 34
  when 'tentativa_retomada' then 35 when 'desligamento' then 36 when 'duvida_parceiro' then 37 when 'validacao_proposta' then 38
  when 'tratamento_indicacao' then 41 when 'atualizacao_indicacao' then 42 when 'checagem_cliente' then 43 when 'acao_marketing' then 44
  when 'evento' then 45 when 'encontro_base_ativa' then 46 when 'analise_cruzamento' then 47
  when 'revisao_semanal' then 51 when 'pauta_relatorio' then 52 when 'comunicado' then 53 when 'conteudo_trilha' then 54
  when 'analise_pesquisa' then 55 when 'premiacao_anual' then 56 when 'gestao_geral' then 57 else ordem end;

-- Atividades já registradas herdam a etapa do tipo
update public.atividades a set etapa_jornada = t.etapa_jornada from public.tipos_atividade t
 where t.id = a.tipo_atividade_id and a.etapa_jornada is null;

-- ---------------------------------------------------------------------------
-- Scorecard de entrada (Apêndice A)
-- ---------------------------------------------------------------------------
insert into public.criterios_scorecard (chave, nome, essencial, peso, regua, elimina_com_zero, conta_na_qualidade, ordem) values
  ('base_icp', 'Base de clientes no ICP da Wise', true, 2,
   '{"0": "Menos de 5 empresas ou desconhecida", "0.5": "5 a 49 empresas", "1": "50 ou mais"}', false, false, 1),
  ('complementaridade', 'Complementaridade com a oferta da Wise', true, 2,
   '{"0": "Concorre ou se sobrepõe à consultoria", "0.5": "Complementa em parte dos clientes", "1": "Complementa e os clientes dele precisam com frequência de estruturação comercial"}', true, true, 2),
  ('valores', 'Alinhamento de valores e de cultura', true, 2,
   '{"0": "Sinais de conflito (prática comercial agressiva, reputação ruim, promessas que a Wise não cumpre)", "0.5": "Neutro ou pouco conhecido", "1": "Alinhado, com referências positivas"}', true, true, 3),
  ('capacidade_venda', 'Capacidade de prospecção e venda', false, 1,
   '{"0": "Sem time comercial", "0.5": "Time pequeno ou só relacionamento", "1": "Time comercial estruturado e contato frequente com a carteira"}', false, true, 4),
  ('disponibilidade', 'Disponibilidade de tempo do responsável', false, 1,
   '{"0": "Sem responsável definido", "0.5": "Responsável com menos de 2 horas por semana no primeiro mês", "1": "Responsável nomeado com 2 horas ou mais por semana no primeiro mês"}', false, true, 5),
  ('presenca_regional', 'Presença regional', false, 1,
   '{"0": "Fora das regiões atendidas", "0.5": "Parte da carteira nas regiões atendidas", "1": "Carteira concentrada nas regiões atendidas (padrão: PR, SC e SP)"}', false, true, 6),
  ('reputacao', 'Reputação e autoridade no setor', false, 1,
   '{"0": "Pouco conhecido", "0.5": "Reconhecido na região", "1": "Referência no setor (eventos, associações, imprensa)"}', false, true, 7);

-- ---------------------------------------------------------------------------
-- Requisitos de nível (Apêndice B). C = Select, B = Premium, A = Elite.
-- ---------------------------------------------------------------------------
insert into public.requisitos_nivel (nivel, grupo, regra, descricao, vigente_desde) values
  ('C', 'resultado', '{}', 'Nenhum requisito', '2026-10-01'),
  ('C', 'capacitacao', '{}', 'Nenhum requisito', '2026-10-01'),
  ('C', 'regras', '{"contrato": true}', 'Contrato vigente e responsável nomeado', '2026-10-01'),
  ('B', 'resultado', '{"indicacoes_qualificadas": 3, "clientes_fechados": 1, "janela_dias": 180}',
   '3 indicações qualificadas ou 1 cliente fechado no ICP nos últimos 180 dias', '2026-10-01'),
  ('B', 'capacitacao', '{"responsavel_certificado": true}', 'Responsável certificado em "Como vender a Wise Makers"', '2026-10-01'),
  ('B', 'regras', '{"contrato": true, "contrapartida_atraso_max_dias": 30}',
   'Contrato vigente, responsável nomeado e nenhuma contrapartida do parceiro atrasada há mais de 30 dias', '2026-10-01'),
  ('A', 'resultado', '{"indicacoes_qualificadas": 6, "clientes_fechados": 2, "janela_dias": 180}',
   '6 indicações qualificadas ou 2 clientes fechados no ICP nos últimos 180 dias', '2026-10-01'),
  ('A', 'capacitacao', '{"responsavel_certificado": true, "pessoas_certificadas": 2}', '2 pessoas certificadas, incluindo o responsável', '2026-10-01'),
  ('A', 'regras', '{"contrato": true, "contrapartida_atraso_max_dias": 30, "acoes_comprovadas": 1, "acoes_janela_dias": 90}',
   'Regras do Premium e ao menos 1 ação conjunta do parceiro concluída e comprovada nos últimos 90 dias', '2026-10-01');

-- ---------------------------------------------------------------------------
-- Régua de atendimento (Apêndice C)
-- ---------------------------------------------------------------------------
insert into public.regua_atendimento (chave, cadencia_dias, tolerancia_dias, descricao) values
  ('pacote:C', 90, 7, 'Pacote C · Prateleira: reunião de acompanhamento trimestral, 30 min'),
  ('pacote:B', 30, 7, 'Pacote B · Formação: reunião de acompanhamento mensal, 45 min'),
  ('pacote:A', 30, 7, 'Pacote A · Base Ativa: reunião mensal fora do ciclo'),
  ('pacote:A:ciclo', 15, 7, 'Pacote A · Base Ativa: reunião quinzenal durante o ciclo'),
  ('faixa:destaque', 30, 7, 'Faixa Destaque: reunião mensal com plano de negócios conjunto e revisão trimestral com o Diretor'),
  ('faixa:potencial', 30, 7, 'Faixa Potencial: reunião mensal, prioridade nas ações conjuntas'),
  ('faixa:base', null, 7, 'Faixa Base: cadência do pacote, comunicados e mentoria coletiva')
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- Ações da Wise (Apêndice H)
-- ---------------------------------------------------------------------------
insert into public.catalogo_acoes_wise (nome, tipo_acao, pacotes, periodicidade, periodicidade_por_pacote, prazo_inicial_dias, comprovacao, ordem) values
  ('Anúncio da parceria nos canais da Wise (post e stories)', 'marketing', '{C,B,A}', 'unica', '{}', 15, 'Link ou print', 1),
  ('Parceiro na prateleira apresentada aos clientes', 'venda', '{C,B,A}', 'continua', '{}', 0, 'Registro na página de RFP', 2),
  ('Destaque do parceiro em comunicação da Wise à base de clientes', 'marketing', '{B,A}', 'trimestral', '{}', 0, 'Link ou print', 3),
  ('Conteúdo conjunto (post, live ou artigo)', 'conteudo', '{B,A}', 'trimestral', '{"A": "bimestral"}', 0, 'Link', 4),
  ('Parceiro convidado em mentoria mensal ou evento da Wise', 'evento', '{A}', 'por_acao', '{}', 0, 'Registro do evento', 5),
  ('Case conjunto quando houver cliente em comum', 'conteudo', '{B,A}', 'por_acao', '{}', 0, 'Link ou arquivo', 6);

-- ---------------------------------------------------------------------------
-- Indicadores por etapa da jornada (Apêndice L), com destaques iniciais
-- ---------------------------------------------------------------------------
insert into public.indicadores (chave, etapa, nome, formato, destaque, so_admin, ordem) values
  ('assinados_meta', 'captacao', 'Parceiros assinados contra meta', 'numero', true, false, 1),
  ('conversao_recrutamento', 'captacao', 'Conversão do funil de recrutamento', 'percentual', true, false, 2),
  ('conversao_origem', 'captacao', 'Conversão por origem', 'lista', true, false, 3),
  ('tempo_ate_assinatura', 'captacao', 'Tempo médio até a assinatura', 'dias', true, false, 4),
  ('nota_scorecard', 'captacao', 'Nota média do scorecard', 'percentual', true, false, 5),
  ('perdas_motivo', 'captacao', 'Perdas por motivo', 'lista', true, false, 6),
  ('em_nutricao', 'captacao', 'Parceiros em nutrição', 'numero', false, false, 7),
  ('negociacoes_paradas', 'captacao', 'Negociações paradas', 'numero', false, false, 8),
  ('ativados', 'onboarding', 'Parceiros ativados', 'numero', true, false, 11),
  ('tempo_primeira_indicacao', 'onboarding', 'Tempo até a primeira indicação', 'dias', true, false, 12),
  ('tempo_ativacao', 'onboarding', 'Tempo até a ativação', 'dias', true, false, 13),
  ('marcos_cumpridos', 'onboarding', 'Marcos de 30, 60 e 90 dias cumpridos', 'percentual', true, false, 14),
  ('pessoas_certificadas', 'onboarding', 'Pessoas certificadas', 'numero', true, false, 15),
  ('ativados_90', 'onboarding', 'Ativados em até 90 dias', 'percentual', true, false, 16),
  ('nao_ativados', 'onboarding', 'Não ativados', 'numero', false, false, 17),
  ('ativos_sobre_assinados', 'relacionamento', 'Parceiros ativos sobre assinados', 'percentual', true, false, 21),
  ('nps', 'relacionamento', 'Satisfação dos parceiros (NPS)', 'numero', true, false, 22),
  ('regua_em_dia', 'relacionamento', 'Régua em dia', 'percentual', true, false, 23),
  ('acoes_em_dia', 'relacionamento', 'Contrapartidas e ações em dia', 'percentual', true, false, 24),
  ('distribuicao_nivel', 'relacionamento', 'Distribuição por nível', 'lista', true, false, 25),
  ('distribuicao_faixa', 'relacionamento', 'Distribuição por faixa', 'lista', true, false, 26),
  ('saida_parceiros', 'relacionamento', 'Saída de parceiros', 'numero', true, false, 27),
  ('em_observacao', 'relacionamento', 'Parceiros em observação', 'numero', false, false, 28),
  ('em_risco', 'relacionamento', 'Parceiros em risco', 'numero', false, false, 29),
  ('propostas_rebaixamento', 'relacionamento', 'Propostas de rebaixamento', 'numero', false, false, 30),
  ('clientes_icp', 'producao', 'Clientes fechados no ICP (número principal)', 'numero', true, false, 31),
  ('conversao_indicacoes', 'producao', 'Conversão indicação, reunião, proposta e venda', 'lista', true, false, 32),
  ('indicacoes_sla', 'producao', 'Indicações dentro do SLA', 'percentual', true, false, 33),
  ('ciclo_venda', 'producao', 'Ciclo de venda via parceiro contra venda direta', 'dias', true, false, 34),
  ('receita_atribuida', 'producao', 'Receita atribuída', 'moeda', true, true, 35),
  ('receita_por_nivel', 'producao', 'Receita atribuída por nível', 'lista', true, true, 36),
  ('clientes_ativos_checagem', 'producao', 'Clientes ativos aos 6 e 12 meses e satisfação', 'lista', true, false, 37),
  ('eficiencia_vendas', 'producao', 'Eficiência de vendas (vendas ÷ parceiros ativos)', 'numero', false, false, 38),
  ('indicacoes_por_parceiro', 'producao', 'Indicações por parceiro', 'numero', false, false, 39),
  ('nota_qualidade', 'producao', 'Nota média de qualidade das indicações', 'numero', false, false, 40),
  ('roi', 'canal', 'ROI do canal', 'percentual', true, true, 41),
  ('custo_total_tipo', 'canal', 'Custo total por tipo', 'lista', true, true, 42),
  ('custo_por_cliente', 'canal', 'Custo por cliente no ICP', 'moeda', true, true, 43),
  ('tempo_retorno', 'canal', 'Tempo de retorno (meses)', 'numero', true, true, 44),
  ('horas_parceiro_etapa', 'canal', 'Horas por parceiro e por etapa', 'lista', true, false, 45),
  ('participacao_receita', 'canal', 'Participação dos parceiros na receita nova da Wise', 'percentual', true, true, 46)
on conflict (chave) do nothing;

insert into public.fase_programa (fase, desde, definida_por) values ('experimentacao', '2026-10-23', null);

-- ---------------------------------------------------------------------------
-- Remuneração de referência (Apêndice M): Guilherme Faccin
-- ---------------------------------------------------------------------------
insert into public.remuneracoes (email, valor_mensal, horas_mensais, fator_encargos, vigente_desde)
values ('guilherme@wisemakers.com.br', 4500, 220, 1.0, '2026-10-01');

-- ---------------------------------------------------------------------------
-- Trilha "Como vender a Wise Makers" (Apêndice G), rascunho sem conteúdo
-- ---------------------------------------------------------------------------
with t as (
  insert into public.trilhas (chave, titulo, descricao, publicada, nota_minima, ordem)
  values ('como_vender', 'Como vender a Wise Makers',
          'Trilha para o time do parceiro reconhecer o cliente ideal da Wise, apresentar e indicar.', false, 70, 1)
  returning id
)
insert into public.trilha_modulos (trilha_id, ordem, titulo, tipo, texto)
select t.id, m.ordem, m.titulo, 'texto', null from t, (values
  (1, 'Quem é a Wise Makers e que problema ela resolve'),
  (2, 'O cliente ideal: os cinco critérios do ICP, com exemplos de quem entra e de quem não entra'),
  (3, 'Como perceber a oportunidade na conversa com o próprio cliente'),
  (4, 'Como apresentar e indicar: roteiro curto, uso do link exclusivo e do formulário do portal'),
  (5, 'O que a Wise entrega ao cliente, cases e respostas às objeções mais comuns'),
  (6, 'Depois da indicação: SLA, acompanhamento, comissão e regras do programa')
) as m(ordem, titulo);

-- ---------------------------------------------------------------------------
-- Parâmetros novos (seção 9) e ajuste da v1
-- ---------------------------------------------------------------------------
insert into public.configuracoes (chave, valor, descricao) values
  ('horas_mensais_padrao', '220', 'Horas mensais de referência para o custo-hora'),
  ('fator_encargos_padrao', '1.0', 'Fator de encargos padrão do custo-hora'),
  ('horizonte_receita_meses', '12', 'Horizonte de receita da Wise Makers no ROI (meses)'),
  ('prazo_contrato_padrao_meses', '12', 'Prazo padrão do contrato do cliente da Wise Makers (meses)'),
  ('margem_contribuicao_pct', '100', 'Margem de contribuição usada no ROI (%)'),
  ('rateio_custo_geral', 'false', 'Ratear o custo geral do programa entre parceiros assinados'),
  ('ciclo_venda_direta_dias', 'null', 'Ciclo médio da venda direta, em dias, para comparação'),
  ('receita_nova_wise_periodo', '0', 'Receita nova total da Wise no período, para a participação dos parceiros'),
  ('protecao_indicacao_dias', '180', 'Proteção da indicação desde a última interação (dias)'),
  ('sla_validacao_dias_uteis', '2', 'SLA: validação e primeiro contato (dias úteis)'),
  ('sla_retorno_parceiro_dias_uteis', '5', 'SLA: retorno ao parceiro (dias úteis do registro)'),
  ('sla_atualizacao_dias', '15', 'SLA: atualização mínima enquanto aberta (dias corridos)'),
  ('sla_parceiro_contato_dias_uteis', '2', 'SLA do parceiro: primeiro contato com o cliente (dias úteis)'),
  ('sla_parceiro_atualizacao_dias_uteis', '5', 'SLA do parceiro: atualização no portal (dias úteis do registro)'),
  ('janela_resultado_dias', '180', 'Janela de apuração do resultado para o nível (dias)'),
  ('isencao_revisao_dias', '180', 'Assinados há menos destes dias ficam isentos da revisão de nível'),
  ('onboarding_dias', '90', 'Duração do onboarding (dias)'),
  ('onboarding_extensao_dias', '120', 'Prazo final do onboarding com extensão (dias)'),
  ('nota_minima_trilha', '70', 'Nota mínima padrão do teste das trilhas (%)'),
  ('nova_tentativa_horas', '24', 'Espera para nova tentativa do teste (horas)'),
  ('faixa_destaque_pct', '5', 'Faixa Destaque: % do topo do ranking'),
  ('faixa_potencial_pct', '15', 'Faixa Potencial: % seguintes do ranking'),
  ('risco_dias_assinatura', '180', 'Desligamento: dias de assinatura para entrar em risco'),
  ('risco_janela_dias', '180', 'Desligamento: janela sem resultado (dias)'),
  ('retomada_intervalo_dias', '15', 'Desligamento: intervalo mínimo entre as tentativas (dias)'),
  ('retomada_espera_dias', '30', 'Desligamento: espera depois da segunda tentativa (dias)'),
  ('aviso_desligamento_dias', '30', 'Desligamento: prazo do aviso até o encerramento (dias)'),
  ('vigencia_minima_regra_dias', '30', 'Vigência mínima de regra que afeta parceiros (dias)'),
  ('cruzamento_min_cnpjs', '20', 'Cruzamento: mínimo de CNPJs por envio'),
  ('cruzamento_max_linhas', '5000', 'Cruzamento: máximo de CNPJs por envio'),
  ('cruzamento_intervalo_dias', '30', 'Cruzamento: intervalo mínimo entre envios do mesmo parceiro (dias)'),
  ('cruzamento_retencao_dias', '180', 'Cruzamento: validade das coincidências (dias)'),
  ('link_limite_hora', '10', 'Link de indicação: envios por hora por endereço de origem'),
  ('regioes_atendidas', '["PR", "SC", "SP"]', 'Regiões atendidas (critério de presença regional)'),
  ('nutricao_cadencia_dias', '30', 'Cadência padrão de contato na nutrição (dias)'),
  ('modelos_atuacao', '["Indicador", "Co-venda", "Implementador ou parceiro técnico", "Tecnologia ou integração", "Institucional ou comunidade"]',
   'Modelos de atuação do parceiro'),
  ('pontos_ranking', '{"indicacao_qualificada": 2, "reuniao": 3, "cliente_icp": 10, "pessoa_certificada": 2, "acao_comprovada": 1}',
   'Pontos do ranking por evento (Apêndice K)'),
  ('categorias_premiacao', '["Parceiro do ano", "Mais clientes no ICP", "Melhor estreante", "Destaque em capacitação"]',
   'Categorias da premiação anual'),
  ('link_indicacao_texto', '"Conhece uma empresa que precisa estruturar a área comercial? Indique pelo nosso link e a Wise Makers entra em contato."',
   'Texto sugerido para o parceiro divulgar o link de indicação'),
  ('termo_cruzamento_versao', '1', 'Versão vigente do termo do cruzamento de carteiras'),
  ('termo_cruzamento_texto', to_jsonb('Termo de cruzamento de carteiras (cláusula 10.4 do Contrato de Parceria Comercial).

1. O cruzamento é facultativo e vale só para este envio.
2. Vocês enviam apenas CNPJs de pessoas jurídicas e o tipo de cada empresa (cliente ou prospect). Nenhum nome, e-mail ou telefone de pessoa.
3. O navegador envia só a raiz do CNPJ (8 primeiros dígitos). A Wise compara com a própria base em memória e descarta a lista no mesmo processamento: nada da lista vai para tabela, log ou armazenamento.
4. Ficam guardadas só as coincidências, por até 180 dias, salvo as que virarem indicação ou ação conjunta.
5. Vocês veem os totais por quadrante. A Wise vê as empresas coincidentes que já são da base dela.
6. Nenhuma das partes aborda cliente da outra apresentando-se como indicada sem acordo prévio, caso a caso.
7. Vocês podem pedir a exclusão das coincidências a qualquer momento, com efeito imediato.
8. Limites: no mínimo 20 e no máximo 5.000 CNPJs por envio, e no máximo 1 cruzamento a cada 30 dias.'::text),
   'Texto do termo do cruzamento de carteiras'),
  ('regras_publicadas', 'null', 'Versão e vigência das regras publicadas (atualizado ao publicar regras)')
on conflict (chave) do nothing;

insert into public.configuracoes (chave, valor, descricao)
values ('indicacao_parada_dias', '15', 'Indicação parada: dias sem atualização')
on conflict (chave) do update set valor = '15', updated_at = now();

-- ---------------------------------------------------------------------------
-- Textos de e-mail novos
-- ---------------------------------------------------------------------------
insert into public.textos_email (chave, assunto, corpo, descricao) values
  ('nivel_subida', 'Novo nível no Wise Partners',
   'Olá, {{nome}}.

Parabéns! {{parceiro}} cumpriu os requisitos e passou para o nível {{nivel}}. O pacote só muda se vocês escolherem um pacote superior.

Veja os detalhes em Meu nível, no portal.', 'Parceiro subiu de nível por resultado'),
  ('nivel_observacao', 'Seu nível no Wise Partners está em observação',
   'Olá, {{nome}}.

Na revisão trimestral, {{parceiro}} não cumpriu todos os requisitos do nível {{nivel}}. O nível continua o mesmo, em observação por um trimestre.

O que falta: {{faltantes}}

Conte com a gente para planejar os próximos passos.', 'Parceiro entrou em observação na revisão trimestral'),
  ('nivel_rebaixamento_confirmado', 'Mudança de nível no Wise Partners',
   'Olá, {{nome}}.

Depois de um trimestre em observação, {{parceiro}} passa para o nível {{nivel}}. O pacote novo vale a partir de {{data}}.

Motivo: {{motivo}}', 'Rebaixamento confirmado'),
  ('sla_vencido', 'Prazo de indicação vencido',
   'Olá, {{nome}}.

A indicação de {{cliente}} está com prazo vencido: {{prazo}}.', 'Prazo do SLA de indicação vencido'),
  ('regua_atrasada', 'Reunião de acompanhamento atrasada',
   'Olá, {{nome}}.

{{parceiro}} está sem reunião de acompanhamento desde {{data}}. A cadência combinada é de {{cadencia}} dias.', 'Régua de atendimento atrasada'),
  ('onboarding_sem_ativacao', 'Onboarding sem ativação',
   'Olá, {{nome}}.

{{parceiro}} chegou aos 90 dias de onboarding sem ativação. O prazo final é {{data}}.', 'Onboarding de 90 dias sem ativação'),
  ('retomada_parceiro', 'Vamos conversar sobre a parceria?',
   'Olá, {{nome}}.

Faz um tempo que não temos indicações nem ações conjuntas com {{parceiro}}. Queremos entender o momento de vocês e combinar os próximos passos. Que tal uma conversa de 30 minutos nesta semana?', 'Mensagem sugerida de tentativa de retomada'),
  ('aviso_desligamento', 'Aviso de encerramento do Contrato de Parceria Comercial',
   'Prezados, {{parceiro}}.

Conforme a cláusula 13.4 do Contrato de Parceria Comercial, comunicamos o encerramento da parceria em {{data_encerramento}}, por {{motivo}}.

Até essa data, as indicações em andamento seguem normalmente, e as comissões das indicações fechadas serão pagas conforme o contrato.

Agradecemos a parceria até aqui.

Wise Makers', 'Aviso formal de desligamento (texto sem IA)'),
  ('comunicado', '{{titulo}}', '{{corpo}}', 'Comunicado à base de parceiros'),
  ('pesquisa_satisfacao', 'Pesquisa de satisfação do Wise Partners',
   'Olá, {{nome}}.

Conte como está a parceria com a Wise. São duas perguntas e leva menos de 1 minuto.', 'Convite trimestral da pesquisa de satisfação'),
  ('certificado_emitido', 'Seu certificado do Wise Partners',
   'Olá, {{nome}}.

Parabéns! Você concluiu a trilha "{{trilha}}". O certificado está disponível no portal.', 'Certificado emitido'),
  ('indicacao_link_recebida', 'Nova indicação pelo link do parceiro',
   'Olá, {{nome}}.

Chegou uma indicação de {{cliente}} pelo link de {{parceiro}}. O prazo de validação é de 2 dias úteis.', 'Indicação recebida pelo link exclusivo'),
  ('protecao_expirada', 'Proteção de indicação expirada',
   'Olá, {{nome}}.

A indicação de {{cliente}} ficou 180 dias sem interação e perdeu a proteção.', 'Proteção de 180 dias expirada')
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- Regras do programa: versão 1 publicada na data de início da v2
-- ---------------------------------------------------------------------------
insert into public.versoes_regras (versao, conteudo, mudancas, vigente_desde, afeta_parceiros, publicada_por)
values (1, public.regras_retrato(), 'Versão inicial das regras do programa (Wise Partners 2.0).', '2026-10-23', false, null);
update public.configuracoes set valor = '{"versao": 1, "vigente_desde": "2026-10-23"}', updated_at = now() where chave = 'regras_publicadas';
