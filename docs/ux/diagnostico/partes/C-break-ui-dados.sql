-- Cenário extremo do break-ui (diagnóstico de UX, parte C).
-- Rodar SOMENTE no banco de sandbox demo_extremo:
--   psql postgresql://postgres@localhost:54340/demo_extremo -v ON_ERROR_STOP=0 -f C-break-ui-dados.sql
-- Parte da cópia do seed de demonstração (40 parceiros, 93 indicações) e leva a carteira a 200 parceiros.
-- Os dados entram pela mesma fronteira dos dados reais (tabelas e gatilhos do banco), sem tocar no código.
-- Valores longos usam os limites reais conhecidos: o banco não tem limite de tamanho em nenhum campo de texto,
-- então os textos seguem os limites da Receita Federal (nome empresarial 150, nome fantasia 55),
-- o maxLength dos formulários públicos (comentário 2000) e casos reais de mercado.
-- Nenhum texto usa travessão nem meia-risca.

\set ON_ERROR_STOP 0

-- 1. Pessoas da equipe e do parceiro ---------------------------------------------------------------
-- Consultora com nome composto longo e e-mail longo (responsável pela Sistemas Araucária e consultora do RFP)
update perfis set nome = 'Maria Eduarda Albuquerque Cavalcanti de Vasconcellos',
                  email = 'maria.eduarda.albuquerque.cavalcanti@demo.wisemakers.local'
 where id = 'd0000000-0000-4000-a000-000000000003';
-- Usuária do parceiro que entrou por convite e ainda não preencheu o nome (default do banco é '')
update perfis set nome = '' where id = 'd0000000-0000-4000-a000-000000000011';

-- 2. Categoria com nome longo ------------------------------------------------------------------------
insert into categorias (id, nome, tipo, ordem, ativa)
values ('c0000000-0000-4000-a000-000000000001',
        'Gestão de riscos, compliance, proteção de dados pessoais e segurança da informação', 'comercial', 99, true)
on conflict (id) do nothing;

-- 3. Sistemas Araucária (ficha e portal do parceiro) ------------------------------------------------
update parceiros set
  nome_fantasia = 'Araucária Sistemas de Gestão e Integração Industrial',
  razao_social  = 'Araucária Sistemas de Gestão Empresarial, Integração de Processos Industriais, Consultoria em Tecnologia da Informação e Serviços Correlatos Ltda',
  site          = 'https://www.araucariasistemasdegestao.com.br/solucoes/erp-para-industria-de-alimentos/implantacao?utm_source=portal_wise_partners',
  cidade        = 'São José dos Pinhais',
  endereco      = 'Rodovia BR-277, Km 112,5, Condomínio Empresarial Parque Tecnológico do Barigui, Bloco C, Sala 1.204, Bairro Cidade Industrial, CEP 83.090.000',
  redes_sociais = '{"instagram":"https://www.instagram.com/araucariasistemasdegestao.oficial","linkedin":"https://www.linkedin.com/company/araucaria-sistemas-de-gestao-empresarial-e-integracao-industrial","outro":"https://www.youtube.com/@araucariasistemasdegestaoeintegracaoindustrial"}',
  responsavel_id = 'd0000000-0000-4000-a000-000000000003',
  categoria_empresa = 'Software house com implantação própria, fábrica de integrações e central de suporte 24 horas',
  origem = 'Indicação do presidente da associação comercial durante a feira de tecnologia industrial de Londrina'
 where id = 'd0000000-0000-4000-a000-000000001001';

-- Muitas categorias num parceiro só (14 comerciais, incluindo a de nome longo)
insert into parceiro_categorias (parceiro_id, categoria_id, principal)
select 'd0000000-0000-4000-a000-000000001001', c.id, false
  from categorias c
 where c.tipo = 'comercial'
   and c.id <> '135c3e82-9b30-48af-8181-4e163e0ddcc3'
   and c.nome not in ('Recrutamento e RH', 'Jurídico e tributário', 'Contabilidade consultiva', 'Comércio exterior e logística internacional',
                      'Crédito, fomento e incentivos fiscais', 'Eficiência energética', 'Metrologia, qualidade e laboratório', 'SST (saúde e segurança do trabalho)')
on conflict do nothing;

-- Instrumento do parceiro: programa próprio com comissão de 10% (gera a comissão a receber de sete dígitos)
update parceiros_instrumento set programa_proprio = true,
  instrumento_nome = 'Programa de Canais e Alianças Estratégicas Araucária para Consultorias, Integradores e Revendas Autorizadas',
  comissao_pct = 10, comissao_base = 'Valor total do contrato de licenciamento e implantação, pago em até 36 parcelas',
  comissao_condicao = 'Pagamento em até 30 dias após o recebimento integral da primeira parcela pelo parceiro, mediante nota fiscal',
  exigencias = 'Cadastro prévio da oportunidade no portal de canais do parceiro com antecedência mínima de 15 dias da primeira reunião'
 where parceiro_id = 'd0000000-0000-4000-a000-000000001001';

-- Contato com nome e e-mail longos
with c as (
  insert into contatos (id, nome, cargo, email, telefone, whatsapp, observacoes)
  values ('c1000000-0000-4000-a000-000000000001', 'Maria Aparecida dos Santos Oliveira Wiśniewska',
          'Diretora de Canais, Alianças Estratégicas e Desenvolvimento de Novos Negócios',
          'relacionamento.parcerias.comerciais.e.canais@araucariasistemasdegestao.com.br',
          '(41) 3333 4444', '(41) 99999 8888', null)
  on conflict (id) do nothing returning id)
insert into parceiro_contatos (parceiro_id, contato_id, papeis, principal)
select 'd0000000-0000-4000-a000-000000001001', id, '{responsavel_parceria}', false from c
on conflict do nothing;

-- Contrapartidas: exatamente 1 pendente e 1 atrasada (plural)
update contrapartidas set estado = 'validada'
 where parceiro_id = 'd0000000-0000-4000-a000-000000001001'
   and id in ('eb3c58d2-9daa-431c-8d9d-b847d405b2de', '03d2fb37-e5bb-49ce-ad83-723418734f7b', '4e7303e7-c5c6-4b63-8ac7-11a75971ed84',
              'a8f89279-af7a-4331-b33c-0661b5c081f5', '7e7debee-0cdc-4e3d-89c1-ffb20cee26e4', '0951eaf6-6fb0-415c-ae26-c335e70e13a1');

-- 4. Parceiros especiais (e...0001 a e...0015) ------------------------------------------------------
insert into parceiros (id, nome_fantasia, razao_social, tipo_parceria, natureza_juridica, perfil_institucional, cidade, uf,
                       carteira_icp, responsavel_id, etapa, ultimo_contato, created_at)
values
 ('e0000000-0000-4000-a000-000000000001', 'Associação Brasileira das Empresas de Software e Serviços de Tecnologia da Informação do Estado do Paraná',
  'Associação Brasileira das Empresas de Software e Serviços de Tecnologia da Informação do Estado do Paraná', 'institucional', 'privada', 'ecossistema',
  'Curitiba', 'PR', null, 'd0000000-0000-4000-a000-000000000002', 'reuniao_realizada', '2026-10-01', '2025-06-01'),
 ('e0000000-0000-4000-a000-000000000002', 'Z', null, 'comercial', null, null, null, null, null, null, 'sem_contato', null, '2026-10-20'),
 ('e0000000-0000-4000-a000-000000000003', 'JR', 'JR Assessoria Empresarial Ltda', 'comercial', null, null, 'Toledo', 'PR', 9,
  'd0000000-0000-4000-a000-000000000001', 'contato_feito', '2026-05-02', '2025-11-01'),
 ('e0000000-0000-4000-a000-000000000004', 'Kowalczyk & Wiśniewski Consultoria Empresarial', 'Kowalczyk & Wiśniewski Consultoria Empresarial S/S Ltda',
  'comercial', null, null, 'Curitiba', 'PR', 64, 'd0000000-0000-4000-a000-000000000003', 'reuniao_realizada', '2026-10-10', '2025-03-01'),
 ('e0000000-0000-4000-a000-000000000005', 'Silva & Filhos Assessoria Contábil e Tributária', 'Silva & Filhos Assessoria Contábil e Tributária Ltda',
  'comercial', null, null, 'Ponta Grossa', 'PR', 22, 'd0000000-0000-4000-a000-000000000001', 'reuniao_realizada', '2026-09-01', '2025-04-01'),
 ('e0000000-0000-4000-a000-000000000006', 'Sabor d''Ouro Tecnologia para Alimentos', 'Sabor d''Ouro Tecnologia para Alimentos Ltda', 'comercial', null, null,
  'Cascavel', 'PR', 30, 'd0000000-0000-4000-a000-000000000002', 'retornou', '2026-02-15', '2025-08-01'),
 ('e0000000-0000-4000-a000-000000000007', 'kumbuca gestão financeira', 'Kumbuca Gestão Financeira Ltda', 'comercial', null, null, 'Maringá', 'PR', 51,
  'd0000000-0000-4000-a000-000000000003', 'reuniao_realizada', '2026-10-15', '2025-02-01'),
 ('e0000000-0000-4000-a000-000000000008', 'assessoriaempresarialdocentrosulparanaense.com.br', 'Assessoria Empresarial do Centro Sul Paranaense Ltda',
  'comercial', null, null, 'Guarapuava', 'PR', 80, 'd0000000-0000-4000-a000-000000000001', 'reuniao_realizada', '2026-10-12', '2025-01-15'),
 ('e0000000-0000-4000-a000-000000000009', '  Pinhão Digital  ', 'Pinhão Digital Marketing Ltda', 'comercial', null, null, 'Curitiba', 'PR', 12,
  null, 'reuniao_agendada', null, '2026-09-20'),
 ('e0000000-0000-4000-a000-000000000010', 'Ômega Automação Industrial', 'Ômega Automação Industrial Ltda', 'comercial', null, null, 'Londrina', 'PR', 55,
  'd0000000-0000-4000-a000-000000000002', 'reuniao_realizada', '2026-10-20', '2025-01-10'),
 ('e0000000-0000-4000-a000-000000000011', 'Árvore Contabilidade Consultiva', 'Árvore Contabilidade Consultiva Ltda', 'comercial', null, null, 'Toledo', 'PR', 18,
  'd0000000-0000-4000-a000-000000000003', 'qualificacao', '2026-06-01', '2025-09-01'),
 ('e0000000-0000-4000-a000-000000000012', 'Consultoria Recém Assinada', 'Consultoria Recém Assinada Ltda', 'comercial', null, null, 'Umuarama', 'PR', 5,
  'd0000000-0000-4000-a000-000000000001', 'reuniao_realizada', '2026-10-22', '2026-09-01'),
 ('e0000000-0000-4000-a000-000000000013', 'Unidade Única Consultoria', 'Unidade Única Consultoria Ltda', 'comercial', null, null, 'Pato Branco', 'PR', 16,
  'd0000000-0000-4000-a000-000000000002', 'reuniao_realizada', '2026-10-02', '2025-07-01'),
 ('e0000000-0000-4000-a000-000000000014', 'Metalmecânica Integração e Automação de Processos Industriais do Sudoeste do Paraná',
  'Metalmecânica Integração e Automação de Processos Industriais do Sudoeste do Paraná Ltda', 'comercial', null, null, 'Francisco Beltrão', 'PR', 97,
  'd0000000-0000-4000-a000-000000000003', 'reuniao_realizada', '2026-10-21', '2024-11-01'),
 ('e0000000-0000-4000-a000-000000000015', 'Cooperativa Central de Crédito e Investimento dos Empreendedores do Oeste',
  'Cooperativa Central de Crédito e Investimento dos Empreendedores do Oeste do Paraná', 'institucional', 'privada', 'vitrine', 'Cascavel', 'PR', null,
  'd0000000-0000-4000-a000-000000000001', 'proposta_decisor', '2026-03-01', '2025-05-01')
on conflict (id) do nothing;

-- Assinatura dos especiais pelo caminho das regras (aprovação do Diretor, data de assinatura, etapa)
insert into aprovacoes (parceiro_id, aprovado_por, observacao)
select id, 'd0000000-0000-4000-a000-000000000002', 'Aprovado na reunião semanal'
  from parceiros where id in ('e0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000004', 'e0000000-0000-4000-a000-000000000005',
                              'e0000000-0000-4000-a000-000000000007', 'e0000000-0000-4000-a000-000000000008', 'e0000000-0000-4000-a000-000000000010',
                              'e0000000-0000-4000-a000-000000000012', 'e0000000-0000-4000-a000-000000000013', 'e0000000-0000-4000-a000-000000000014');
update parceiros set data_assinatura = date '2025-05-10', etapa = 'parceria_ativa'
 where id in ('e0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000004', 'e0000000-0000-4000-a000-000000000005',
              'e0000000-0000-4000-a000-000000000007', 'e0000000-0000-4000-a000-000000000008', 'e0000000-0000-4000-a000-000000000010',
              'e0000000-0000-4000-a000-000000000013', 'e0000000-0000-4000-a000-000000000014');
update parceiros set data_assinatura = date '2026-10-20', etapa = 'onboarding' where id = 'e0000000-0000-4000-a000-000000000012';

-- 5. Mais 145 parceiros gerados (total 200) ---------------------------------------------------------
do $$
declare
  pref text[] := array['Sistemas','Consultoria','Contabilidade','Tecnologia','Agência','Grupo','Instituto','Escritório','Software','Soluções'];
  lug  text[] := array['Guairacá','Tibagi','Iguaçu','Ivaí','Piquiri','Paranapanema','Cambará','Itaipu','Marumbi','Graciosa','Jaguariaíva','Tapejara','Carambeí','Palmital','Mandaguari','Ubiratã'];
  cid  text[] := array['Curitiba','Londrina','Maringá','Ponta Grossa','Cascavel','Foz do Iguaçu','Guarapuava','Toledo','Apucarana','Campo Mourão','Pato Branco','Francisco Beltrão','Umuarama','Paranaguá','Arapongas','Telêmaco Borba'];
  resp uuid[] := array[null, 'd0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000003']::uuid[];
  v_id uuid; v_nome text; v_tipo text; m int; v_etapa text;
begin
  for i in 16..160 loop
    v_id := ('e0000000-0000-4000-a000-' || lpad(i::text, 12, '0'))::uuid;
    v_nome := pref[i % 10 + 1] || ' ' || lug[(i / 10) % 16 + 1];
    v_tipo := case when i % 7 = 0 then 'institucional' else 'comercial' end;
    m := i % 20;
    v_etapa := case
      when m in (0, 1, 2) then 'sem_contato' when m in (3, 4) then 'contato_feito' when m = 5 then 'retornou'
      when m = 6 then 'reuniao_agendada' when m = 7 then 'reuniao_realizada' when m = 8 then 'qualificacao'
      when m = 9 then 'proposta_decisor' when m = 17 then 'nutricao' when m = 18 then (case when i % 2 = 0 then 'nao_elegivel' else 'sem_interesse' end)
      else 'reuniao_realizada' end;
    insert into parceiros (id, nome_fantasia, razao_social, tipo_parceria, natureza_juridica, perfil_institucional, cidade, uf,
                           carteira_icp, responsavel_id, etapa, nutricao_ate, ultimo_contato, created_at)
    values (v_id, v_nome, case when i % 6 = 0 then null else v_nome || ' Ltda' end, v_tipo,
            case when v_tipo = 'institucional' then (case when i % 3 = 0 then 'publica' else 'privada' end) end,
            case when v_tipo = 'institucional' then (array['ecossistema','convocador','viveiro','vitrine'])[i % 4 + 1] end,
            case when i % 9 = 0 then null else cid[i % 16 + 1] end, case when i % 9 = 0 then null else 'PR' end,
            case when v_tipo = 'comercial' then (i * 37) % 130 end, resp[i % 4 + 1], v_etapa,
            case when v_etapa = 'nutricao' then date '2026-12-15' + i end,
            case when i % 5 = 0 then null else date '2026-10-24' - ((i * 13) % 260) end,
            timestamptz '2024-10-01' + (i || ' days')::interval)
    on conflict (id) do nothing;
    -- Assinados: aprovação do Diretor, data de assinatura e etapa final
    if m between 10 and 16 or m = 19 then
      insert into aprovacoes (parceiro_id, aprovado_por, observacao) values (v_id, 'd0000000-0000-4000-a000-000000000002', 'Aprovado');
      update parceiros set data_assinatura = date '2025-03-01' + i * 3,
                           etapa = case when m = 16 then 'onboarding' else 'parceria_ativa' end
       where id = v_id;
      if m = 19 then update parceiros set etapa = 'parceria_encerrada' where id = v_id; end if;
    end if;
  end loop;
end $$;

-- Pacote igual ao nível nos comerciais assinados (A = Base Ativa, só nível A)
update parceiros set pacote = nivel
 where tipo_parceria = 'comercial' and data_assinatura is not null and pacote is null and nivel is not null
   and id::text like 'e0000000%';

-- Estratégicos (furam a fila do Base Ativa)
update parceiros_interno set estrategico = true
 where parceiro_id in ('e0000000-0000-4000-a000-000000000014', 'e0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000001001');

-- 6. Categorias dos novos parceiros -----------------------------------------------------------------
-- ERP fica com dezenas de parceiros; a categoria de nome longo fica com exatamente 1; Z e Recém Assinada ficam sem nenhuma
insert into parceiro_categorias (parceiro_id, categoria_id, principal)
select p.id,
       case when p.tipo_parceria = 'comercial' and (substr(p.id::text, 25)::int % 3 = 0) then '135c3e82-9b30-48af-8181-4e163e0ddcc3'::uuid
            else (select c.id from categorias c where c.tipo = p.tipo_parceria and c.ativa and c.id <> 'c0000000-0000-4000-a000-000000000001'
                   order by c.ordem, c.nome offset (substr(p.id::text, 25)::int % (case when p.tipo_parceria = 'comercial' then 22 else 24 end)) limit 1) end,
       true
  from parceiros p
 where p.id::text like 'e0000000%'
   and p.id not in ('e0000000-0000-4000-a000-000000000002', 'e0000000-0000-4000-a000-000000000012')
on conflict do nothing;
insert into parceiro_categorias (parceiro_id, categoria_id, principal)
values ('e0000000-0000-4000-a000-000000000004', 'c0000000-0000-4000-a000-000000000001', false)
on conflict do nothing;

-- 7. Contatos dos novos parceiros (metade tem; Z e Recém Assinada não têm) --------------------------
do $$
declare r record; v_c uuid;
begin
  for r in select id, nome_fantasia, substr(id::text, 25)::int as n from parceiros
            where id::text like 'e0000000%' and substr(id::text, 25)::int % 2 = 1
              and id not in ('e0000000-0000-4000-a000-000000000002', 'e0000000-0000-4000-a000-000000000012') loop
    insert into contatos (nome, cargo, email, telefone)
    values ((array['Ana Paula','João Carlos','Jo','Luiz Fernando de Souza Bittencourt Filho','Fernanda','Ricardo','Tatiane','Wellington'])[r.n % 8 + 1],
            case when r.n % 4 = 0 then null else 'Sócio diretor' end,
            case when r.n % 5 = 0 then null else 'contato' || r.n || '@parceiro' || r.n || '.example.com.br' end,
            '(41) 98888 ' || lpad((r.n * 7)::text, 4, '0'))
    returning id into v_c;
    insert into parceiro_contatos (parceiro_id, contato_id, papeis, principal) values (r.id, v_c, '{responsavel_parceria}', true);
  end loop;
end $$;

-- 8. Clientes e indicações --------------------------------------------------------------------------
-- 8a. Sistemas Araucária com 260 indicações (centenas) ao longo de 18 meses
do $$
declare
  tipos text[] := array['Laticínios','Cooperativa Agroindustrial','Metalúrgica','Transportadora','Frigorífico','Construtora','Madeireira','Cerealista','Indústria de Embalagens','Distribuidora de Alimentos','Cerâmica','Têxtil'];
  lug  text[] := array['Guairacá','Tibagi','Iguaçu','Ivaí','Piquiri','Paranapanema','Cambará','Itaipu','Marumbi','Graciosa','Jaguariaíva','Tapejara','Carambeí','Palmital','Mandaguari','Ubiratã'];
  suf  text[] := array['Ltda','S.A.','Eireli'];
  emp  uuid[] := array['41504699-026f-48d9-a536-ea6e3fc28c16','36928df3-866d-4875-80f3-d261277812d3','59940bdf-e018-46ec-9827-e4b92a8a3ad3']::uuid[];
  orig text[] := array['grupo_whatsapp','wise_hub','evento','portal_parceiro','reuniao','link_parceiro','outra'];
  etp  text[] := array['nova','em_contato','em_contato','reuniao','proposta','fechada','perdida','nova'];
  v_cli uuid; v_et text;
begin
  for k in 1..260 loop
    insert into clientes (razao_social, cnpj, consentimento, contato_nome, email)
    values (tipos[k % 12 + 1] || ' ' || lug[(k / 12) % 16 + 1] || ' ' || suf[(k / 192) % 3 + 1],
            case when k % 4 = 0 then null else lpad((20000000 + k * 7919)::text, 8, '0') || '0001' || lpad((k % 97)::text, 2, '0') end,
            k % 3 = 0, case when k % 3 = 0 then 'Contato ' || k end, null)
    returning id into v_cli;
    v_et := etp[k % 8 + 1];
    insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base, data_compensacao, necessidade)
    values (case when k % 5 = 0 then 'grupo_para_parceiro' else 'parceiro_para_grupo' end,
            'd0000000-0000-4000-a000-000000001001', emp[k % 3 + 1], v_cli, orig[k % 7 + 1],
            date '2026-10-24' - (k * 2), v_et,
            case when v_et in ('proposta','fechada') then round((8500 + (k * 7919) % 480000)::numeric, 2) end,
            case when v_et = 'fechada' and k % 2 = 0 then date '2026-10-24' - k end,
            case when k % 10 = 0 then 'Implantar ERP com rastreabilidade de lotes' end);
  end loop;
end $$;

-- 8b. Negócios de sete e oito dígitos (comissões de sete dígitos)
do $$
declare v_cli uuid;
begin
  insert into clientes (razao_social, cnpj, consentimento)
  values ('Cooperativa Agroindustrial Mista dos Produtores Rurais de Leite, Grãos e Proteína Animal do Vale do Ivaí, do Norte Pioneiro e dos Campos Gerais Ltda',
          '76543210000155', false) returning id into v_cli;
  insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base, data_compensacao, necessidade, observacoes)
  values ('parceiro_para_grupo', 'd0000000-0000-4000-a000-000000001001', '59940bdf-e018-46ec-9827-e4b92a8a3ad3', v_cli, 'reuniao',
          date '2026-10-20', 'fechada', 23456789.10, date '2026-10-22', 'Projeto de transformação digital das três plantas',
          'Reunião de alinhamento comercial realizada na sede do cliente em Ponta Grossa com o diretor industrial, a gerente financeira e o coordenador de TI. O cliente opera três plantas (Ponta Grossa, Castro e Carambeí), fatura cerca de R$ 380 milhões por ano e hoje controla pedidos, estoque e faturamento em planilhas compartilhadas e num sistema legado sem suporte desde 2019. Principais dores relatadas: retrabalho no fechamento mensal (cerca de 12 dias), divergência de estoque entre plantas acima de 4%, falta de rastreabilidade de lotes exigida pelos compradores do varejo e dificuldade para emitir notas fiscais de exportação. O decisor final é o conselho de administração, que se reúne na primeira quinta-feira de cada mês; a proposta precisa chegar com 10 dias de antecedência. Orçamento aprovado para o ano que vem, com preferência por pagamento em 36 parcelas. Concorrentes na disputa: dois fornecedores nacionais e um integrador regional. Próximos passos combinados: visita técnica às três plantas, levantamento de processos com os supervisores de produção, demonstração do módulo de qualidade e envio de três referências de clientes do setor de laticínios.');

  insert into clientes (razao_social, cnpj, consentimento) values ('Frigorífico Iguaçu Alimentos S.A.', '11222333000181', false) returning id into v_cli;
  insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base, data_compensacao)
  values ('parceiro_para_grupo', 'd0000000-0000-4000-a000-000000001001', '36928df3-866d-4875-80f3-d261277812d3', v_cli, 'evento',
          date '2026-10-18', 'fechada', 2400000.00, date '2026-10-21');

  insert into clientes (razao_social, cnpj, consentimento) values ('Metalúrgica Tibagi Equipamentos Industriais Ltda', '22333444000172', false) returning id into v_cli;
  insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base, data_compensacao)
  values ('grupo_para_parceiro', 'd0000000-0000-4000-a000-000000001001', '41504699-026f-48d9-a536-ea6e3fc28c16', v_cli, 'reuniao',
          date '2026-10-15', 'fechada', 12345678.90, null);

  insert into clientes (razao_social, cnpj, consentimento) values ('Cerealista Ubiratã Ltda', null, false) returning id into v_cli;
  insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base)
  values ('parceiro_para_grupo', 'e0000000-0000-4000-a000-000000000014', '59940bdf-e018-46ec-9827-e4b92a8a3ad3', v_cli, 'grupo_whatsapp',
          date '2026-10-23', 'fechada', 87654321.09);
end $$;

-- 8c. Exatamente uma indicação para a Unidade Única Consultoria; 2 a 3 para um terço dos gerados
do $$
declare r record; v_cli uuid; j int;
begin
  insert into clientes (razao_social, consentimento) values ('Ômega Têxtil Ltda', false) returning id into v_cli;
  insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa)
  values ('parceiro_para_grupo', 'e0000000-0000-4000-a000-000000000013', '41504699-026f-48d9-a536-ea6e3fc28c16', v_cli, 'portal_parceiro', date '2026-10-24', 'nova');
  for r in select id, substr(id::text, 25)::int as n from parceiros
            where id::text like 'e0000000%' and substr(id::text, 25)::int between 16 and 160 and substr(id::text, 25)::int % 3 = 0 loop
    for j in 1..(2 + r.n % 2) loop
      insert into clientes (razao_social, consentimento) values ('Indústria Cliente ' || r.n || '.' || j || ' Ltda', false) returning id into v_cli;
      insert into indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, data, etapa, valor_base)
      values ('parceiro_para_grupo', r.id, '41504699-026f-48d9-a536-ea6e3fc28c16', v_cli, 'grupo_whatsapp',
              date '2026-10-24' - (r.n + j * 11), (array['nova','em_contato','reuniao','proposta'])[j], case when j = 3 then 15000 + r.n * 100 end);
    end loop;
  end loop;
end $$;

-- 8d. Comissões: observação longa, percentual com três casas e algumas pagas
update comissoes set observacao = 'Nota fiscal emitida com CNPJ da matriz por engano; o financeiro pediu cancelamento e nova emissão com o CNPJ da filial de São José dos Pinhais. Aguardando também a comprovação do recebimento integral da primeira parcela pelo cliente, conforme a condição do instrumento do parceiro, antes de liberar o pagamento.'
 where id = (select c.id from comissoes c join indicacoes i on i.id = c.indicacao_id where i.valor_base = 23456789.10 and c.beneficiario = 'parceiro');
update comissoes set percentual = 12.345, valor = round(base_valor * 12.345 / 100, 2)
 where id = (select c.id from comissoes c join indicacoes i on i.id = c.indicacao_id where i.valor_base = 2400000.00 and c.beneficiario = 'responsavel');
update comissoes set estado = 'paga', paga_em = now() - interval '3 days', nf_recebida_em = now() - interval '10 days'
 where id in (select c.id from comissoes c join indicacoes i on i.id = c.indicacao_id
               where i.parceiro_id = 'd0000000-0000-4000-a000-000000001001' and c.estado = 'aguardando_compensacao' and c.valor is not null
               order by i.data limit 15);

-- 9. Atividades: 1.050 nos últimos 30 dias (contagem de quatro dígitos e mais de mil horas) ----------
do $$
declare
  ps uuid[];
  ts record;
  tipos uuid[]; mins int[];
  pessoas uuid[] := array['d0000000-0000-4000-a000-000000000001','d0000000-0000-4000-a000-000000000002','d0000000-0000-4000-a000-000000000003']::uuid[];
begin
  select array_agg(id order by id) into ps from parceiros;
  select array_agg(id order by ordem), array_agg(minutos order by ordem) into tipos, mins from tipos_atividade where ativo;
  for n in 1..1050 loop
    insert into atividades (parceiro_id, tipo_atividade_id, data, minutos, pessoa_id, descricao)
    values (case when n % 10 = 0 then null else ps[n % array_length(ps, 1) + 1] end,
            tipos[n % array_length(tipos, 1) + 1], date '2026-10-24' - (n % 30), mins[n % array_length(mins, 1) + 1] * (1 + n % 3),
            pessoas[n % 3 + 1],
            case when n % 50 = 0 then 'Reunião longa com o comitê de parceiros para revisar a carteira inteira, alinhar metas do trimestre, validar fichas pendentes, discutir as indicações paradas há mais de 30 dias e combinar a agenda de eventos conjuntos do próximo semestre com as associações comerciais do interior.' end);
  end loop;
end $$;

-- 10. Próximos passos vencidos com descrição longa (painel e quadro do funil) ----------------------
insert into proximos_passos (parceiro_id, descricao, data, responsavel_id, created_by)
select p.id,
       case when substr(p.id::text, 25)::int % 4 = 0
            then 'Enviar a minuta revisada do contrato com as cláusulas de exclusividade regional, a tabela de comissões por empresa do grupo e o anexo de proteção de dados pedido pelo jurídico do parceiro'
            else 'Ligar para retomar' end,
       date '2026-10-24' - (substr(p.id::text, 25)::int % 40) - 1, p.responsavel_id, 'd0000000-0000-4000-a000-000000000001'
  from parceiros p
 where p.id::text like 'e0000000%' and p.etapa in ('contato_feito','retornou','reuniao_agendada','reuniao_realizada','qualificacao','proposta_decisor');

-- 11. Pesquisa de satisfação com comentário no limite do formulário (2000 caracteres) ---------------
insert into pesquisas_satisfacao (perfil_id, parceiro_id, trimestre, nota, comentario, respondida_em)
values ('d0000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000001001', '2026-T4', 3,
        left(repeat('Gostamos muito da mentoria mensal e do Wise Hub, mas sentimos falta de retorno mais rápido sobre as indicações que enviamos: algumas ficaram mais de 40 dias sem nenhuma atualização e o cliente nos cobrou. Também seria bom receber o calendário de eventos com mais antecedência, porque a nossa equipe comercial planeja as viagens com dois meses de folga. ', 6), 2000),
        now() - interval '2 days');

-- 12. Base Ativa: fila longa e um ciclo em andamento com nome longo -------------------------------
insert into ciclos_base_ativa (parceiro_id, estado, entrou_fila_em, previsao_inicio)
select p.id, 'fila', coalesce(p.data_assinatura, date '2026-01-01'), case when substr(p.id::text, 25)::int % 3 = 0 then date '2027-02-01' end
  from parceiros p
 where p.pacote = 'A' and p.data_assinatura is not null and p.id::text like 'e0000000%'
   and p.id <> 'e0000000-0000-4000-a000-000000000014'
   and not exists (select 1 from ciclos_base_ativa c where c.parceiro_id = p.id);
insert into ciclos_base_ativa (parceiro_id, estado, entrou_fila_em)
select 'e0000000-0000-4000-a000-000000000014', 'fila', date '2025-05-10'
 where not exists (select 1 from ciclos_base_ativa where parceiro_id = 'e0000000-0000-4000-a000-000000000014');
update ciclos_base_ativa set estado = 'em_ciclo', inicio = date '2026-09-01' where parceiro_id = 'e0000000-0000-4000-a000-000000000014';

-- 13. RFP com muitos parceiros, cliente de nome longo e necessidade longa ---------------------------
update pedidos_rfp set
  cliente_nome = 'Cooperativa Agroindustrial Mista dos Produtores Rurais de Leite, Grãos e Proteína Animal do Vale do Ivaí, do Norte Pioneiro e dos Campos Gerais Ltda',
  necessidade_resumida = 'preciso de um ERP para indústria de alimentos com rastreabilidade de lotes, integração com o chão de fábrica e nota fiscal de exportação'
 where id = '057e1482-bd60-4b41-9017-0668780798bc';
update paginas_rfp set blocos = jsonb_build_array(
  jsonb_build_object('tipo', 'abertura',
    'titulo', 'Opções de ERP, integração industrial, segurança da informação e gestão de riscos para a Cooperativa Agroindustrial Mista do Vale do Ivaí',
    'texto', 'Separamos catorze parceiros que já implantaram ERP e integrações em indústrias de alimentos. Converse com cada um e compare.'),
  jsonb_build_object('tipo', 'categoria', 'titulo', 'ERP', 'categoria_id', '135c3e82-9b30-48af-8181-4e163e0ddcc3',
    'texto', 'Um ERP organiza pedidos, estoque e faturamento num só lugar.',
    'parceiros', (select jsonb_agg(jsonb_build_object('parceiro_id', id, 'nome', trim(nome_fantasia),
                    'texto', case when id = 'd0000000-0000-4000-a000-000000001001'
                                  then 'Implantação com equipe própria em mais de 140 indústrias de alimentos do Sul do Brasil, com módulos de rastreabilidade de lotes, qualidade, manutenção e exportação, suporte local em Curitiba, Londrina e Cascavel e central de atendimento 24 horas.'
                                  else 'ERP para indústrias de médio porte.' end,
                    'destaques', case when id = 'd0000000-0000-4000-a000-000000001001'
                                      then '["Indústria de alimentos","Suporte no mesmo dia","Rastreabilidade de lotes exigida pelo varejo","Integração com balanças e coletores","Nota fiscal de exportação","Implantação em 120 dias","Treinamento presencial nas três plantas","Hospedagem local ou em nuvem"]'::jsonb
                                      else '["Implantação em 90 dias"]'::jsonb end) order by ord)
                  from (select id, nome_fantasia, row_number() over (order by case when id = 'd0000000-0000-4000-a000-000000001001' then 0 else 1 end, id) as ord
                          from parceiros
                         where id in ('d0000000-0000-4000-a000-000000001001','d0000000-0000-4000-a000-000000001002','d0000000-0000-4000-a000-000000001003',
                                      'e0000000-0000-4000-a000-000000000002','e0000000-0000-4000-a000-000000000004','e0000000-0000-4000-a000-000000000007',
                                      'e0000000-0000-4000-a000-000000000008','e0000000-0000-4000-a000-000000000010','e0000000-0000-4000-a000-000000000014')) s)),
  jsonb_build_object('tipo', 'categoria', 'titulo', 'Gestão de riscos, compliance, proteção de dados pessoais e segurança da informação',
    'categoria_id', 'c0000000-0000-4000-a000-000000000001', 'texto', null,
    'parceiros', (select jsonb_agg(jsonb_build_object('parceiro_id', id, 'nome', trim(nome_fantasia), 'texto', null, 'destaques', '[]'::jsonb))
                    from parceiros where id in ('e0000000-0000-4000-a000-000000000005','e0000000-0000-4000-a000-000000000013',
                                                 'e0000000-0000-4000-a000-000000000001','e0000000-0000-4000-a000-000000000011','e0000000-0000-4000-a000-000000000003'))),
  jsonb_build_object('tipo', 'aviso', 'texto', 'A Wise Makers mantém parceria comercial com as empresas apresentadas e pode receber comissão.'),
  jsonb_build_object('tipo', 'consultor', 'nome', 'Maria Eduarda Albuquerque Cavalcanti de Vasconcellos',
    'email', 'maria.eduarda.albuquerque.cavalcanti@demo.wisemakers.local', 'telefone', '(44) 99999 0000',
    'texto', 'Fale comigo se quiser ajuda para comparar as propostas.'))
 where pedido_id = '057e1482-bd60-4b41-9017-0668780798bc';

-- 14. Status de atividade variado depois das indicações (o gatilho de indicação marca contato hoje)
update parceiros set ultimo_contato = date '2026-10-24' - ((substr(id::text, 25)::int * 17) % 300)
 where id::text like 'e0000000%' and substr(id::text, 25)::int between 16 and 160 and substr(id::text, 25)::int % 3 = 0;
