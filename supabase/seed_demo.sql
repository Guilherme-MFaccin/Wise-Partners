-- =====================================================================================
-- SEED DE DEMONSTRAÇÃO DO PORTAL WISE PARTNERS
--
-- Só para avaliar o visual em banco LOCAL. Dados 100% fictícios (empresas, pessoas, CNPJs, valores).
-- NUNCA entra em migração (supabase/migrations) e NUNCA roda no projeto de produção.
-- Proteção: o script para sozinho se o banco já tiver qualquer parceiro cadastrado.
--
-- Como rodar (banco local recém criado, com todas as migrações aplicadas):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_demo.sql
--
-- O script passa pelas mesmas funções e gatilhos que o portal usa (registrar_indicacao, validar_indicacao,
-- aprovação do Diretor, scorecard antes da proposta, onboarding, atualizar_estado_comissao,
-- publicar_pagina_rfp), assumindo a identidade de cada usuário com request.jwt.claims.
-- Datas relativas a hoje: os últimos 9 meses.
-- =====================================================================================

begin;

do $$
begin
  if exists (select 1 from public.parceiros) then
    raise exception 'Este banco já tem parceiros. O seed de demonstração só roda em banco local vazio.';
  end if;
end $$;

select setseed(0.4242);

-- Identidade de quem age (auth.uid() lê request.jwt.claims)
create or replace function pg_temp.como(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', case when p is null then '' else json_build_object('sub', p, 'role', 'authenticated')::text end, true)
$$;

-- CNPJ fictício válido a partir de um número
create or replace function pg_temp.cnpj(n int) returns text language plpgsql as $$
declare
  b text := lpad((10000000 + n * 7919 % 89999999)::text, 8, '0') || '0001';
  p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int := 0; d1 int; d2 int; i int;
begin
  for i in 1..12 loop s := s + substr(b, i, 1)::int * p1[i]; end loop;
  d1 := case when s % 11 < 2 then 0 else 11 - s % 11 end;
  b := b || d1; s := 0;
  for i in 1..13 loop s := s + substr(b, i, 1)::int * p2[i]; end loop;
  d2 := case when s % 11 < 2 then 0 else 11 - s % 11 end;
  return b || d2;
end $$;

create or replace function pg_temp.uid(n int) returns uuid language sql immutable as $$
  select ('d0000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid
$$;

-- -------------------------------------------------------------------------------------
-- Usuários: 3 internos e 6 de parceiros (perfis criados pelo convite, como no portal)
-- -------------------------------------------------------------------------------------
insert into public.convites (email, nome, papel, empresa_grupo_id, is_diretor) values
  ('guilherme@demo.wisemakers.local', 'Guilherme Faccin', 'admin', (select id from public.empresas_grupo where codigo = 'wise'), false),
  ('igor@demo.wisemakers.local', 'Igor (Diretor)', 'admin', (select id from public.empresas_grupo where codigo = 'wise'), true),
  ('mariana@demo.wisemakers.local', 'Mariana Lopes', 'consultor', (select id from public.empresas_grupo where codigo = 'wise'), false);
insert into auth.users (id, email) values
  (pg_temp.uid(1), 'guilherme@demo.wisemakers.local'),
  (pg_temp.uid(2), 'igor@demo.wisemakers.local'),
  (pg_temp.uid(3), 'mariana@demo.wisemakers.local');

-- Remuneração de referência do Gerente de Parcerias de demonstração (custo-hora do ROI)
insert into public.remuneracoes (perfil_id, valor_mensal, horas_mensais, fator_encargos, vigente_desde)
values (pg_temp.uid(1), 4500, 220, 1.0, (current_date - interval '10 months')::date),
       (pg_temp.uid(3), 6000, 220, 1.0, (current_date - interval '10 months')::date);

-- -------------------------------------------------------------------------------------
-- 40 parceiros
-- -------------------------------------------------------------------------------------
create temp table demo_parceiros (
  n int primary key, nome text, razao text, cidade text, uf text, tipo text, categoria text,
  carteira int, etapa_final text, assinatura_dias int, pacote text, id uuid
) on commit drop;

insert into demo_parceiros (n, nome, razao, cidade, uf, tipo, categoria, carteira, etapa_final, assinatura_dias, pacote) values
  (1,  'Sistemas Araucária', 'Araucária Sistemas de Gestão Empresarial Ltda.', 'Curitiba', 'PR', 'comercial', 'ERP', 72, 'parceria_ativa', 250, 'A'),
  (2,  'Horizonte ERP', 'Horizonte Tecnologia e Software Ltda.', 'Maringá', 'PR', 'comercial', 'ERP', 38, 'parceria_ativa', 220, 'B'),
  (3,  'Mantiqueira Gestão Industrial e Integração de Sistemas Corporativos', 'Mantiqueira Gestão Industrial e Integração de Sistemas Corporativos S.A.', 'São José dos Campos', 'SP', 'comercial', 'ERP', 55, 'parceria_ativa', 190, 'A'),
  (4,  'Litoral CRM', 'Litoral Soluções em Relacionamento Ltda.', 'Florianópolis', 'SC', 'comercial', 'CRM / força de vendas', 24, 'parceria_ativa', 170, 'B'),
  (5,  'Vendamais', 'Vendamais Plataformas Comerciais Ltda.', 'Londrina', 'PR', 'comercial', 'CRM / força de vendas', 12, 'parceria_ativa', 160, 'C'),
  (6,  'Fábrica Conectada', 'Fábrica Conectada Automação e Dados Ltda.', 'Joinville', 'SC', 'comercial', 'MES / PCP / Indústria 4.0', 46, 'parceria_ativa', 140, 'B'),
  (7,  'Prevencionista SST', 'Prevencionista Saúde e Segurança Ocupacional Ltda.', 'Cascavel', 'PR', 'comercial', 'SST (saúde e segurança do trabalho)', 9, 'parceria_ativa', 120, 'C'),
  (8,  'Contábil Paraná Consultiva', 'Contábil Paraná Assessoria Contábil e Consultiva Ltda.', 'Maringá', 'PR', 'comercial', 'Contabilidade consultiva', 31, 'parceria_ativa', 110, 'B'),
  (9,  'Escudo Digital', 'Escudo Digital Segurança da Informação Ltda.', 'Campinas', 'SP', 'comercial', 'Segurança da informação', 18, 'parceria_ativa', 100, 'C'),
  (10, 'Pinhão Software', 'Pinhão Software e Serviços Ltda.', 'Ponta Grossa', 'PR', 'comercial', 'ERP', 15, 'onboarding', 60, 'C'),
  (11, 'Talentos do Sul RH', 'Talentos do Sul Recrutamento e Seleção Ltda.', 'Blumenau', 'SC', 'comercial', 'Recrutamento e RH', 26, 'onboarding', 45, 'B'),
  (12, 'Energia Certa', 'Energia Certa Eficiência Energética Ltda.', 'Ribeirão Preto', 'SP', 'comercial', 'Eficiência energética', 8, 'onboarding', 30, 'C'),
  (13, 'Fomento Já', 'Fomento Já Crédito e Incentivos Ltda.', 'Curitiba', 'PR', 'comercial', 'Crédito, fomento e incentivos fiscais', 52, 'onboarding', 12, 'A'),
  (14, 'Trâmite Jurídico Tributário', 'Trâmite Advocacia Empresarial e Tributária', 'Maringá', 'PR', 'comercial', 'Jurídico e tributário', 20, 'fechamento', null, null),
  (15, 'Dados Previsíveis', 'Dados Previsíveis Inteligência Analítica Ltda.', 'São Paulo', 'SP', 'comercial', 'Dados / predição (produtos)', 40, 'proposta_decisor', null, null),
  (16, 'Manutenção Inteligente', 'Manutenção Inteligente Software Industrial Ltda.', 'Caxias do Sul', 'RS', 'comercial', 'Software de gestão da manutenção', 14, 'proposta_decisor', null, null),
  (17, 'Comex Fácil', 'Comex Fácil Logística Internacional Ltda.', 'Itajaí', 'SC', 'comercial', 'Comércio exterior e logística internacional', 11, 'qualificacao', null, null),
  (18, 'Integra Automação', 'Integra Automação Industrial e Integradores Ltda.', 'Sorocaba', 'SP', 'comercial', 'Automação industrial e integradores', 33, 'qualificacao', null, null),
  (19, 'Medida Exata Metrologia', 'Medida Exata Metrologia e Laboratório Ltda.', 'Toledo', 'PR', 'comercial', 'Metrologia, qualidade e laboratório', 6, 'qualificacao', null, null),
  (20, 'Processo Ágil BPM', 'Processo Ágil Automação de Processos Ltda.', 'Maringá', 'PR', 'comercial', 'BPM / automação / IA', 22, 'reuniao_realizada', null, null),
  (21, 'Nuvem Paraná Datacenter', 'Nuvem Paraná Infraestrutura e Datacenter Ltda.', 'Curitiba', 'PR', 'comercial', 'Infraestrutura / datacenter', 17, 'reuniao_realizada', null, null),
  (22, 'Pixel e Código', 'Pixel e Código Design e Tecnologia Digital Ltda.', 'Maringá', 'PR', 'comercial', 'Design e tecnologia digital', 4, 'reuniao_realizada', null, null),
  (23, 'Verde Futuro ESG', 'Verde Futuro Consultoria em Sustentabilidade Ltda.', 'Florianópolis', 'SC', 'comercial', 'ESG', 7, 'reuniao_agendada', null, null),
  (24, 'Gestão em Foco', 'Gestão em Foco Consultoria Empresarial Ltda.', 'Londrina', 'PR', 'comercial', 'Consultoria de gestão', 13, 'reuniao_agendada', null, null),
  (25, 'Algoritmo Certo', 'Algoritmo Certo Ciência de Dados Ltda.', 'São Carlos', 'SP', 'comercial', 'Consultoria de implementação de data science e IA (serviço)', 10, 'reuniao_agendada', null, null),
  (26, 'Manutenção Total Consultoria', 'Manutenção Total Consultoria Industrial Ltda.', 'Arapongas', 'PR', 'comercial', 'Consultoria de gestão da manutenção', 9, 'retornou', null, null),
  (27, 'Cadeia Fria Logística', 'Cadeia Fria Transportes e Logística Ltda.', 'Chapecó', 'SC', 'comercial', 'Comércio exterior e logística internacional', 5, 'retornou', null, null),
  (28, 'Sistema Norte', 'Sistema Norte Tecnologia Ltda.', 'Umuarama', 'PR', 'comercial', 'ERP', 28, 'contato_feito', null, null),
  (29, 'Força Comercial Brasil', 'Força Comercial Brasil Treinamentos e Software Ltda.', 'Bauru', 'SP', 'comercial', 'CRM / força de vendas', 19, 'contato_feito', null, null),
  (30, 'Linha de Produção', 'Linha de Produção Sistemas Industriais Ltda.', 'Jaraguá do Sul', 'SC', 'comercial', 'MES / PCP / Indústria 4.0', 25, 'contato_feito', null, null),
  (31, 'Segura Trabalho', 'Segura Trabalho Medicina e Segurança Ltda.', 'Paranavaí', 'PR', 'comercial', 'SST (saúde e segurança do trabalho)', 3, 'contato_feito', null, null),
  (32, 'Contas Claras', 'Contas Claras Contabilidade Ltda.', 'Campo Mourão', 'PR', 'comercial', 'Contabilidade consultiva', 2, 'sem_contato', null, null),
  (33, 'Proteção de Dados Sul', 'Proteção de Dados Sul Consultoria em Privacidade e Segurança Cibernética Ltda.', 'Porto Alegre', 'RS', 'comercial', 'Segurança da informação', 6, 'sem_contato', null, null),
  (34, 'Gente que Faz RH', 'Gente que Faz Gestão de Pessoas Ltda.', 'Cianorte', 'PR', 'comercial', 'Recrutamento e RH', 4, 'nutricao', null, null),
  (35, 'Sol Nascente Energia', 'Sol Nascente Energia Solar Ltda.', 'Apucarana', 'PR', 'comercial', 'Eficiência energética', 8, 'nutricao', null, null),
  (36, 'Concorrente Consultoria Comercial', 'Concorrente Consultoria Comercial Ltda.', 'Maringá', 'PR', 'comercial', 'Consultoria de gestão', 30, 'nao_elegivel', null, null),
  (37, 'Rede Varejo Tech', 'Rede Varejo Tecnologia Ltda.', 'Curitiba', 'PR', 'comercial', 'ERP', 10, 'sem_interesse', null, null),
  (38, 'Associação Comercial e Empresarial do Norte Pioneiro', 'Associação Comercial e Empresarial do Norte Pioneiro', 'Jacarezinho', 'PR', 'institucional', 'Associações comerciais e empresariais com núcleos', null, 'sem_contato', null, null),
  (39, 'Federação das Indústrias Demo', 'Federação das Indústrias Demo', 'Curitiba', 'PR', 'institucional', 'Federações e confederações', null, 'reuniao_realizada', null, null),
  (40, 'Parque Tecnológico Vale do Ivaí', 'Parque Tecnológico Vale do Ivaí', 'Ivaiporã', 'PR', 'institucional', 'Parques tecnológicos', null, 'contato_feito', null, null);

update demo_parceiros set id = pg_temp.uid(1000 + n);

-- Parceria encerrada: um parceiro antigo, desligado
insert into demo_parceiros (n, nome, razao, cidade, uf, tipo, categoria, carteira, etapa_final, assinatura_dias, pacote, id)
values (41, 'Antiga Parceira Sistemas', 'Antiga Parceira Sistemas Ltda.', 'Maringá', 'PR', 'comercial', 'ERP', 12, 'parceria_encerrada', 260, 'C', pg_temp.uid(1041));
-- Mantém 40: a encerrada substitui um "sem contato"
delete from demo_parceiros where n = 32;

-- Cadastro (como sistema, igual à importação) e categoria principal
select pg_temp.como(null);
insert into public.parceiros (id, nome_fantasia, razao_social, cnpj, cidade, uf, tipo_parceria, natureza_juridica, carteira_icp,
                              responsavel_id, origem_tipo, origem_detalhe, ultimo_contato, created_at)
select d.id, d.nome, d.razao, case when d.tipo = 'comercial' then pg_temp.cnpj(d.n) end, d.cidade, d.uf, d.tipo,
       case when d.tipo = 'institucional' then 'paraestatal' else 'privada' end, d.carteira,
       case when d.n % 4 = 0 then pg_temp.uid(3) else pg_temp.uid(1) end,
       (array['prospeccao_ativa', 'procura_espontanea', 'indicacao_parceiro', 'indicacao_interna', 'evento'])[1 + d.n % 5],
       'Base de dados de demonstração',
       null, now() - make_interval(days => 270 - d.n * 2)
from demo_parceiros d;
insert into public.parceiro_categorias (parceiro_id, categoria_id, principal)
select d.id, c.id, true from demo_parceiros d join public.categorias c on c.nome = d.categoria;

-- Contato responsável pela parceria de cada parceiro
do $$
declare
  d record;
  v uuid;
  v_nomes text[] := array['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Henrique', 'Isabela', 'João',
    'Karina', 'Lucas', 'Marta', 'Nelson', 'Olívia', 'Paulo', 'Renata', 'Sérgio', 'Tatiana', 'Vinícius'];
  v_sobrenomes text[] := array['Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Ferraz', 'Gonçalves', 'Hoffmann', 'Ishikawa', 'Junqueira'];
begin
  for d in select * from demo_parceiros order by n loop
    insert into public.contatos (nome, cargo, email, telefone)
    values (v_nomes[1 + d.n % 20] || ' ' || v_sobrenomes[1 + (d.n * 3) % 10],
            case when d.tipo = 'institucional' then 'Gerente de relacionamento' else 'Diretor comercial' end,
            'contato' || d.n || '@parceiro.demo', '(44) 9' || lpad((d.n * 7331 % 99999999)::text, 8, '0'))
    returning id into v;
    insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
    values (d.id, v, array['responsavel_parceria', 'decisor'], true);
  end loop;
end $$;

-- -------------------------------------------------------------------------------------
-- Funil: cada parceiro anda pelas etapas com as regras do portal
-- -------------------------------------------------------------------------------------
do $$
declare
  d record;
  v_notas jsonb := '{"base_icp":1,"complementaridade":1,"valores":1,"capacidade_venda":1,"disponibilidade":0.5,"presenca_regional":1,"reputacao":0.5}';
  v_ord text[] := array['sem_contato','contato_feito','retornou','reuniao_agendada','reuniao_realizada','qualificacao','proposta_decisor','fechamento'];
  e text;
  v_ate int;
begin
  for d in select * from demo_parceiros order by n loop
    perform pg_temp.como(pg_temp.uid(1));
    if d.etapa_final in ('nao_elegivel', 'sem_interesse') then
      update public.parceiros set etapa = 'reuniao_realizada' where id = d.id;
      update public.parceiros set etapa = d.etapa_final,
        motivo_perda = case d.etapa_final when 'nao_elegivel' then 'Concorre com a consultoria da Wise' else 'Sem tempo para a parceria neste ano' end
       where id = d.id;
      continue;
    end if;
    if d.etapa_final = 'nutricao' then
      update public.parceiros set etapa = 'reuniao_realizada' where id = d.id;
      update public.parceiros set etapa = 'nutricao', nutricao_ate = current_date + 45 + d.n, nutricao_cadencia_dias = 30 where id = d.id;
      continue;
    end if;
    v_ate := coalesce(array_position(v_ord, case when d.etapa_final in ('onboarding', 'parceria_ativa', 'parceria_encerrada') then 'fechamento' else d.etapa_final end), 1);
    foreach e in array v_ord[2:v_ate] loop
      if e = 'qualificacao' and d.tipo = 'comercial' then
        insert into public.scorecards (parceiro_id, notas) values (d.id,
          case when d.carteira < 15 then v_notas || '{"base_icp":0.5}' else v_notas end);
      end if;
      if e = 'fechamento' then
        perform pg_temp.como(pg_temp.uid(2));
        insert into public.aprovacoes (parceiro_id, aprovado_por, observacao) values (d.id, pg_temp.uid(2), 'Aprovado na reunião semanal');
        perform pg_temp.como(pg_temp.uid(1));
      end if;
      update public.parceiros set etapa = e where id = d.id;
    end loop;
    if d.assinatura_dias is not null then
      update public.parceiros set data_assinatura = current_date - d.assinatura_dias, pacote = d.pacote where id = d.id;
      update public.parceiros set etapa = 'onboarding' where id = d.id;
      -- O plano de 90 dias começa na assinatura
      update public.planos_onboarding set inicio = current_date - d.assinatura_dias, prazo_final = current_date - d.assinatura_dias + 90
       where parceiro_id = d.id;
      update public.marcos_onboarding m set prazo = m.prazo - d.assinatura_dias where m.parceiro_id = d.id;
      update public.contrapartidas c set proxima_data = c.proxima_data - least(d.assinatura_dias, 25) where c.parceiro_id = d.id and c.proxima_data is not null;
    end if;
  end loop;
end $$;

-- Ficha publicada (o que aparece na página de RFP) dos assinados
select pg_temp.como(pg_temp.uid(1));
insert into public.parceiro_campos (parceiro_id, campo_id, valor)
select d.id, c.id, to_jsonb(case c.chave
    when 'o_que_faz' then d.nome || ' atende empresas de ' || d.cidade || ' e região com ' || lower(d.categoria) || ', da implantação ao suporte.'
    when 'diferenciais' then 'Equipe própria de implantação' || chr(10) || 'Suporte em português no mesmo dia' || chr(10) || 'Clientes no ICP da Wise'
    when 'visao_wise' then 'Parceiro com histórico de entrega em indústrias de médio porte, acompanhado de perto pela Wise.'
    when 'para_quem' then 'Empresas que estão estruturando a área comercial e precisam de processos e dados confiáveis.'
    when 'whatsapp_comercial' then '(44) 99' || lpad((d.n * 1234567 % 9999999)::text, 7, '0')
    when 'email_comercial' then 'comercial@parceiro' || d.n || '.demo'
  end)
from demo_parceiros d
join public.campos_categoria c on c.escopo = 'comum_comercial'
  and c.chave in ('o_que_faz', 'diferenciais', 'visao_wise', 'para_quem', 'whatsapp_comercial', 'email_comercial')
where d.assinatura_dias is not null;

-- Modelo de atuação e proposta de valor dos assinados
update public.parceiros p set
  modelos_atuacao = case when d.n % 3 = 0 then array['Indicador', 'Co-venda'] else array['Indicador'] end,
  valor_desejado = 'Ampliar a carteira com clientes em fase de estruturação comercial',
  oferta_valor = 'Indicação qualificada e apresentação na prateleira de fornecedores da Wise',
  entrega_valor = 'Reuniões de acompanhamento, grupo de WhatsApp e mentoria mensal',
  valor_criado = case when d.n % 2 = 0 then 'Cliente com processo comercial e sistema implantados juntos' end,
  horas_semana_combinadas = 2 + d.n % 3
from demo_parceiros d where p.id = d.id and d.assinatura_dias is not null;

-- Instrumento de comissão do parceiro para o grupo (indicações da Wise para o parceiro)
update public.parceiros_instrumento i set comissao_pct = 10, comissao_base = 'Primeira mensalidade do cliente'
from demo_parceiros d where i.parceiro_id = d.id and d.assinatura_dias is not null;

-- -------------------------------------------------------------------------------------
-- 6 usuários de parceiros
-- -------------------------------------------------------------------------------------
insert into public.convites (email, nome, papel, parceiro_id, is_responsavel_parceiro) values
  ('ana@araucaria.demo', 'Ana Ribeiro', 'parceiro', pg_temp.uid(1001), true),
  ('bruno@araucaria.demo', 'Bruno Tavares', 'parceiro', pg_temp.uid(1001), false),
  ('carla@horizonte.demo', 'Carla Menezes', 'parceiro', pg_temp.uid(1002), true),
  ('diego@litoral.demo', 'Diego Fontana', 'parceiro', pg_temp.uid(1004), true),
  ('elisa@fabricaconectada.demo', 'Elisa Kowalski', 'parceiro', pg_temp.uid(1006), true),
  ('fabio@pinhao.demo', 'Fábio Nogueira', 'parceiro', pg_temp.uid(1010), true);
insert into auth.users (id, email) values
  (pg_temp.uid(11), 'ana@araucaria.demo'), (pg_temp.uid(12), 'bruno@araucaria.demo'), (pg_temp.uid(13), 'carla@horizonte.demo'),
  (pg_temp.uid(14), 'diego@litoral.demo'), (pg_temp.uid(15), 'elisa@fabricaconectada.demo'), (pg_temp.uid(16), 'fabio@pinhao.demo');

-- -------------------------------------------------------------------------------------
-- 180 pontos de contato nos últimos 9 meses (cada um gera a atividade e o custo das horas)
-- -------------------------------------------------------------------------------------
do $$
declare
  i int;
  p record;
  v_tipos text[] := array['reuniao_online','whatsapp','ligacao','email','reuniao_presencial','whatsapp','documento_enviado','evento'];
  v_ativ text[] := array['checkin_mensal','mensagem','ligacao','mensagem','reuniao_apresentacao','mensagem','documento','evento'];
  v_textos text[] := array[
    'Alinhamos a agenda de indicações do trimestre e o próximo encontro.',
    'Parceiro pediu a minuta revisada com o pacote atualizado.',
    'Conversa sobre dois clientes da carteira que estão sem processo comercial.',
    'Enviado o material da mentoria mensal e o link de indicação.',
    'Reunião de apresentação com o sócio: interesse em co-venda.',
    'Retorno sobre a indicação: cliente marcou reunião para a próxima semana.',
    'Enviada a proposta de parceria com o resumo do programa.',
    'Encontro no evento da associação comercial, com três clientes em comum.'];
  k int;
  v_autor uuid;
  v_dias int;
begin
  for i in 1..180 loop
    select d.* into p from demo_parceiros d
     where d.etapa_final not in ('sem_contato')
     order by (d.n * 31 + i * 17) % 97 limit 1;
    k := 1 + (i * 7) % 8;
    v_autor := case when i % 5 = 0 then pg_temp.uid(3) else pg_temp.uid(1) end;
    v_dias := (i * 37) % 270;
    if p.assinatura_dias is null and v_dias > 200 then v_dias := v_dias - 120; end if;
    perform pg_temp.como(v_autor);
    insert into public.pontos_contato (parceiro_id, tipo, data, texto, resumo, tipo_atividade_id, autor_id)
    values (p.id, v_tipos[k], now() - make_interval(days => v_dias, hours => i % 9),
            v_textos[k], case when i % 3 = 0 then jsonb_build_object('resumo', v_textos[k], 'decisoes', jsonb_build_array('Seguir com a agenda combinada'), 'pendencias_wise', jsonb_build_array(), 'pendencias_parceiro', jsonb_build_array('Enviar os contatos dos clientes interessados')) end,
            (select id from public.tipos_atividade where chave = v_ativ[k]), v_autor);
  end loop;
end $$;

-- -------------------------------------------------------------------------------------
-- 90 indicações nas três empresas, nos dois sentidos e em todas as etapas
-- -------------------------------------------------------------------------------------
create temp table demo_ind (n int primary key, id uuid, parceiro uuid, empresa text, sentido text, etapa text, dias int, valor numeric)
on commit drop;

do $$
declare
  i int;
  p record;
  v_emp text;
  v_sent text;
  v_etapa text;
  v_dias int;
  v_id uuid;
  v_valor numeric;
  v_quem uuid;
  v_icp jsonb;
  v_clientes text[] := array['Metalúrgica', 'Indústria de Embalagens', 'Distribuidora', 'Moveleira', 'Laticínios', 'Têxtil',
    'Agroindustrial', 'Construtora', 'Autopeças', 'Plásticos', 'Alimentos', 'Química Fina', 'Transportadora', 'Gráfica', 'Cerâmica'];
  v_lugares text[] := array['Maringá', 'Londrina', 'Cascavel', 'Joinville', 'Blumenau', 'Curitiba', 'Campinas', 'Sorocaba', 'Chapecó', 'Toledo'];
  v_razao text;
begin
  for i in 1..90 loop
    -- 4 em cada 5 indicações vão para parceiros ativos; 1 em 5 para quem está no onboarding
    if i % 5 = 0 then
      select d.* into p from demo_parceiros d where d.etapa_final = 'onboarding' order by d.n offset (i / 5) % 4 limit 1;
    else
      select d.* into p from demo_parceiros d where d.etapa_final = 'parceria_ativa' order by d.n offset (i * 7) % 9 limit 1;
    end if;
    v_emp := (array['wise', 'wise', 'wise', 'triade', 'swallow'])[1 + i % 5];
    v_sent := case when i % 6 = 0 then 'grupo_para_parceiro' else 'parceiro_para_grupo' end;
    v_etapa := (array['nova', 'em_contato', 'reuniao', 'proposta', 'fechada', 'fechada', 'perdida', 'reuniao', 'em_contato', 'fechada'])[1 + (i * 3) % 10];
    -- Quem ainda está no onboarding não teve indicação no ICP com reunião (senão já estaria ativado)
    if p.etapa_final = 'onboarding' then v_etapa := (array['nova', 'em_contato'])[1 + i % 2]; end if;
    v_dias := least(p.assinatura_dias - 5, 5 + (i * 29) % 260);
    if v_dias < 2 then v_dias := 2; end if;
    v_valor := case v_emp when 'wise' then 4000 + (i % 7) * 1000 when 'triade' then 9000 + (i % 5) * 3500 else 15000 + (i % 4) * 12000 end;
    v_razao := v_clientes[1 + i % 15] || ' ' || (array['Bortolini', 'Schmidt', 'Moreira', 'Takahashi', 'Andrade', 'Rossi', 'Pereira'])[1 + (i / 15) % 7] || ' ' || v_lugares[1 + (i * 7) % 10] || case when i % 9 = 0 then ' Indústria e Comércio de Componentes Metálicos de Precisão Ltda.' else ' Ltda.' end;
    v_icp := case when i % 4 = 3 then '{"vendedores":true,"faturamento":false,"estruturacao":true,"produto":true,"nao_varejo_baixo":true}'
                  else '{"vendedores":true,"faturamento":true,"estruturacao":true,"produto":true,"nao_varejo_baixo":true}' end;
    -- Parte das indicações do parceiro entra pelo portal do próprio parceiro
    v_quem := case when v_sent = 'parceiro_para_grupo' and i % 4 = 1 then
                (select pf.id from public.perfis pf where pf.parceiro_id = p.id and pf.ativo order by pf.is_responsavel_parceiro desc limit 1) end;
    perform pg_temp.como(coalesce(v_quem, pg_temp.uid(1)));
    v_id := public.registrar_indicacao(jsonb_build_object(
      'sentido', v_sent, 'parceiro_id', p.id, 'empresa_grupo_id', (select id from public.empresas_grupo where codigo = v_emp),
      'cliente_razao_social', v_razao, 'cliente_cnpj', pg_temp.cnpj(500 + i),
      'contato_nome', 'Contato ' || i, 'contato_email', 'contato' || i || '@cliente.demo', 'consentimento', true,
      'necessidade', case when i % 5 <> 0 then 'Estruturar o processo comercial e a equipe de vendas' end,
      'aderencia_icp', v_icp,
      'origem', (array['grupo_whatsapp', 'reuniao', 'evento', 'wise_hub', 'outra'])[1 + i % 5],
      'prazo_meses', case when v_emp = 'wise' then 12 end));
    insert into demo_ind values (i, v_id, p.id, v_emp, v_sent, v_etapa, v_dias, v_valor);
  end loop;
end $$;

-- Datas no passado (o registro de demonstração simula 9 meses de uso)
select pg_temp.como(null);
update public.indicacoes i set data = current_date - d.dias, created_at = now() - make_interval(days => d.dias), sla = '{}'
from demo_ind d where i.id = d.id;
update public.indicacoes i set sla = public.calcular_sla(x) from public.indicacoes x where x.id = i.id and i.id in (select id from demo_ind);

-- Validação da Wise e andamento das etapas
do $$
declare d record; v_reun date; v_fech date;
begin
  for d in select * from demo_ind order by n loop
    perform pg_temp.como(pg_temp.uid(1));
    if d.sentido = 'parceiro_para_grupo' and d.etapa <> 'nova'
       and (select etapa_final from demo_parceiros where id = d.parceiro) <> 'onboarding' then
      perform public.validar_indicacao(d.id, jsonb_build_object('icp_confirmado', d.n % 4 <> 3, 'primeiro_contato', true, 'retorno_parceiro', true));
    end if;
    v_reun := current_date - greatest(d.dias - 10, 1);
    v_fech := current_date - greatest(d.dias - 40, 0);
    if d.etapa in ('em_contato') then
      update public.indicacoes set etapa = 'em_contato' where id = d.id;
    elsif d.etapa = 'reuniao' then
      update public.indicacoes set etapa = 'reuniao', data_reuniao = v_reun where id = d.id;
    elsif d.etapa = 'proposta' then
      update public.indicacoes set etapa = 'proposta', data_reuniao = v_reun where id = d.id;
    elsif d.etapa = 'perdida' then
      update public.indicacoes set etapa = 'perdida', observacoes = 'Cliente adiou o projeto para o ano que vem' where id = d.id;
    elsif d.etapa = 'fechada' then
      update public.indicacoes set etapa = 'reuniao', data_reuniao = v_reun where id = d.id;
      update public.indicacoes set etapa = 'fechada', valor_base = d.valor, data_fechamento = v_fech,
        valor_total = case when d.empresa <> 'wise' then d.valor end,
        data_compensacao = case when d.n % 3 <> 0 then least(v_fech + 20, current_date) end
       where id = d.id;
    end if;
  end loop;
end $$;

-- Comissões em todos os estados: nota fiscal recebida e paga pelo fluxo do financeiro
select pg_temp.como(pg_temp.uid(1));
select public.atualizar_estado_comissao(c.id, 'nf_recebida', 'Nota fiscal recebida')
from public.comissoes c where c.estado = 'a_pagar' and c.beneficiario <> 'grupo' and abs(hashtext(c.id::text)) % 3 = 0;
select public.atualizar_estado_comissao(c.id, 'paga', 'Pago por transferência')
from public.comissoes c where c.estado = 'a_pagar' and abs(hashtext(c.id::text)) % 2 = 0;

-- -------------------------------------------------------------------------------------
-- Ativação no onboarding: os "parceria ativa" já tiveram a primeira indicação no ICP com reunião
-- -------------------------------------------------------------------------------------
select pg_temp.como(null);
select public.verificar_ativacao(d.id) from demo_parceiros d where d.etapa_final = 'parceria_ativa';
-- Quem não ativou pela indicação de demonstração ativa por uma reunião registrada agora
do $$
declare d record; v uuid;
begin
  for d in select * from demo_parceiros where etapa_final = 'parceria_ativa'
             and exists (select 1 from public.planos_onboarding pl where pl.parceiro_id = demo_parceiros.id and pl.situacao <> 'ativado') loop
    perform pg_temp.como(pg_temp.uid(1));
    v := public.registrar_indicacao(jsonb_build_object('parceiro_id', d.id, 'empresa_grupo_id', (select id from public.empresas_grupo where codigo = 'wise'),
      'cliente_razao_social', 'Cliente Ativação ' || d.n || ' Ltda.', 'cliente_cnpj', pg_temp.cnpj(900 + d.n), 'necessidade', 'Organizar o funil de vendas',
      'aderencia_icp', '{"vendedores":true,"faturamento":true,"estruturacao":true,"produto":true,"nao_varejo_baixo":true}'));
    perform public.validar_indicacao(v, '{"icp_confirmado": true, "primeiro_contato": true}');
    update public.indicacoes set etapa = 'reuniao', data_reuniao = current_date - (d.assinatura_dias - 50) where id = v;
  end loop;
end $$;
-- Encontros de onboarding já realizados
select pg_temp.como(pg_temp.uid(1));
select public.registrar_encontro_onboarding(m.id, m.prazo - 2, 'Encontro realizado com o responsável do parceiro')
from public.marcos_onboarding m join demo_parceiros d on d.id = m.parceiro_id
where m.tipo like 'encontro_%' and m.prazo < current_date;

-- -------------------------------------------------------------------------------------
-- Parceria encerrada por inatividade (fluxo completo, com decisão do Diretor)
-- -------------------------------------------------------------------------------------
do $$
declare v_fluxo uuid;
begin
  perform pg_temp.como(null);
  insert into public.fluxos_desligamento (parceiro_id, tipo, estado, em_risco_em, tentativa_1_em, tentativa_2_em, sugerido_em, motivo)
  values (pg_temp.uid(1041), 'inatividade', 'sugerido', current_date - 75, current_date - 75, current_date - 58, current_date - 25,
          'Sem indicação qualificada nem contrapartida comprovada em 180 dias')
  returning id into v_fluxo;
  perform pg_temp.como(pg_temp.uid(2));
  perform public.decidir_desligamento(v_fluxo, true);
  perform pg_temp.como(pg_temp.uid(1));
  perform public.gerar_aviso_desligamento(v_fluxo);
  perform pg_temp.como(null);
  update public.fluxos_desligamento set data_encerramento = current_date where id = v_fluxo;
  perform public.encerrar_parceria(v_fluxo);
end $$;

-- -------------------------------------------------------------------------------------
-- Base Ativa: um ciclo concluído e um em andamento
-- -------------------------------------------------------------------------------------
select pg_temp.como(pg_temp.uid(1));
update public.ciclos_base_ativa set estado = 'em_ciclo', inicio = current_date - 120 where parceiro_id = pg_temp.uid(1001);
update public.base_ativa_encontros e set realizado = true from public.ciclos_base_ativa c
 where c.id = e.ciclo_id and c.parceiro_id = pg_temp.uid(1001);
update public.ciclos_base_ativa set evento_data = current_date - 30, evento_descricao = 'Café com a carteira em Curitiba'
 where parceiro_id = pg_temp.uid(1001);
update public.ciclos_base_ativa set estado = 'em_ciclo', inicio = current_date - 35 where parceiro_id = pg_temp.uid(1003);
update public.base_ativa_encontros e set realizado = true from public.ciclos_base_ativa c
 where c.id = e.ciclo_id and c.parceiro_id = pg_temp.uid(1003) and e.numero <= 2;

-- -------------------------------------------------------------------------------------
-- Pedido de RFP publicado (consultora, 3 opções de ERP)
-- -------------------------------------------------------------------------------------
do $$
declare v_pedido uuid; v_cat uuid := (select id from public.categorias where nome = 'ERP');
begin
  perform pg_temp.como(pg_temp.uid(3));
  insert into public.pedidos_rfp (cliente_nome, consultor_id, empresa_grupo_id, necessidade, necessidade_resumida, porte, regiao, prazo, categorias_sugeridas)
  values ('Laticínios Vale do Ivaí', pg_temp.uid(3), (select id from public.empresas_grupo where codigo = 'wise'),
          'O cliente cresceu e controla pedidos, estoque e faturamento em planilhas. Precisa de um ERP para indústria de alimentos.',
          'preciso de um ERP para indústria de alimentos', 'R$ 1 milhão a R$ 5 milhões por mês', 'Norte do Paraná', 'Até 3 meses',
          jsonb_build_array(jsonb_build_object('categoria_id', v_cat, 'nome', 'ERP', 'motivo', 'Controle de pedidos, estoque e faturamento')))
  returning id into v_pedido;
  insert into public.pedido_rfp_opcoes (pedido_id, categoria_id, parceiro_id, ordem, aderencia, justificativa, selecionado) values
    (v_pedido, v_cat, pg_temp.uid(1001), 1, 92, 'Implanta ERP em indústrias de alimentos do Paraná', true),
    (v_pedido, v_cat, pg_temp.uid(1002), 2, 85, 'Atende indústrias de médio porte em Maringá', true),
    (v_pedido, v_cat, pg_temp.uid(1003), 3, 80, 'Integração com sistemas de chão de fábrica', true),
    (v_pedido, v_cat, pg_temp.uid(1010), 4, 60, 'Ainda em onboarding', false);
  perform public.publicar_pagina_rfp(v_pedido, jsonb_build_array(
    jsonb_build_object('tipo', 'abertura', 'titulo', 'Opções de ERP para a Laticínios Vale do Ivaí',
      'texto', 'Separamos três parceiros que já implantaram ERP em indústrias de alimentos. Converse com cada um e compare.'),
    jsonb_build_object('tipo', 'categoria', 'categoria_id', v_cat, 'titulo', 'ERP',
      'texto', 'Um ERP organiza pedidos, estoque e faturamento num só lugar.',
      'parceiros', jsonb_build_array(
        jsonb_build_object('parceiro_id', pg_temp.uid(1001), 'nome', 'Sistemas Araucária', 'texto', 'Implantação com equipe própria e suporte local.', 'destaques', jsonb_build_array('Indústria de alimentos', 'Suporte no mesmo dia')),
        jsonb_build_object('parceiro_id', pg_temp.uid(1002), 'nome', 'Horizonte ERP', 'texto', 'ERP para indústrias de médio porte.', 'destaques', jsonb_build_array('Implantação em 90 dias')),
        jsonb_build_object('parceiro_id', pg_temp.uid(1003), 'nome', 'Mantiqueira Gestão Industrial e Integração de Sistemas Corporativos', 'texto', 'ERP integrado ao chão de fábrica.', 'destaques', jsonb_build_array('Integração com MES', 'Projetos complexos')))),
    jsonb_build_object('tipo', 'aviso', 'texto', 'A Wise Makers mantém parceria comercial com as empresas apresentadas e pode receber comissão.'),
    jsonb_build_object('tipo', 'consultor', 'nome', 'Mariana Lopes', 'email', 'mariana@demo.wisemakers.local', 'telefone', '(44) 99999 0000',
      'texto', 'Fale comigo se quiser ajuda para comparar as propostas.')));
end $$;

-- -------------------------------------------------------------------------------------
-- v2: comprovações, ações da Wise, maturidade, pesquisa, comunicado e custos diretos
-- -------------------------------------------------------------------------------------
-- Contrapartidas comprovadas pelo parceiro e validadas pela Wise
do $$
declare c record; v uuid;
begin
  for c in select ct.* from public.contrapartidas ct join demo_parceiros d on d.id = ct.parceiro_id
           where d.etapa_final = 'parceria_ativa' and ct.periodicidade in ('mensal', 'trimestral', 'unica') and ct.ativa
           order by ct.parceiro_id, ct.nome limit 12 loop
    perform pg_temp.como(null);
    insert into public.comprovacoes (contrapartida_id, parceiro_id, link, observacao)
    values (c.id, c.parceiro_id, 'https://exemplo.demo/post/' || left(c.id::text, 8), 'Publicação feita') returning id into v;
    perform pg_temp.como(pg_temp.uid(1));
    update public.comprovacoes set estado = 'validada', validada_por = pg_temp.uid(1), validada_em = now() where id = v;
  end loop;
end $$;

-- Ações da Wise já feitas
select pg_temp.como(pg_temp.uid(1));
select public.concluir_acao_wise(a.id, jsonb_build_object('comprovacao_link', 'https://exemplo.demo/anuncio', 'alcance', 1200 + (abs(hashtext(a.id::text)) % 900)))
from public.acoes_wise a join demo_parceiros d on d.id = a.parceiro_id
where a.nome like 'Anúncio da parceria%' and d.assinatura_dias > 40;

-- Avaliações de maturidade (8 eixos, notas de 1 a 5)
insert into public.avaliacoes_maturidade (parceiro_id, notas)
select d.id, jsonb_build_object(
  'objetivo', 2 + d.n % 3, 'modelo', 2 + (d.n + 1) % 3, 'aderencia', 3 + d.n % 2, 'capacitacao', 1 + d.n % 3,
  'mercado', 2 + (d.n + 2) % 3, 'programa', 3 + (d.n + 1) % 2, 'relacionamento', 3 + d.n % 3, 'resultado', 1 + (d.n * 2) % 4)
from demo_parceiros d where d.etapa_final = 'parceria_ativa';

-- Pesquisa de satisfação do trimestre
select pg_temp.como(pg_temp.uid(11)); select public.responder_pesquisa(9, 'A mentoria mensal ajuda muito a equipe.');
select pg_temp.como(pg_temp.uid(13)); select public.responder_pesquisa(7, 'Gostaríamos de mais retorno sobre as indicações.');
select pg_temp.como(pg_temp.uid(14)); select public.responder_pesquisa(10, null);

-- Comunicado enviado a todos os parceiros
do $$
declare v uuid;
begin
  perform pg_temp.como(pg_temp.uid(1));
  insert into public.comunicados (titulo, corpo, tipo) values ('Mentoria mensal de novembro',
    'A mentoria mensal de novembro será sobre como reconhecer um cliente no perfil da Wise. Convide a sua equipe.', 'evento')
  returning id into v;
  perform public.enviar_comunicado(v);
end $$;

-- Custos diretos do programa
insert into public.custos_diretos (data, categoria, valor, descricao, parceiro_id) values
  (current_date - 200, 'evento', 1800, 'Café da manhã com parceiros em Maringá', null),
  (current_date - 140, 'kit_brindes', 950, 'Kits de boas vindas dos novos parceiros', null),
  (current_date - 95, 'deslocamento', 420, 'Visita à Mantiqueira em São José dos Campos', pg_temp.uid(1003)),
  (current_date - 60, 'ferramentas', 290, 'Ferramenta de assinatura eletrônica', null),
  (current_date - 20, 'evento', 1200, 'Encontro do Base Ativa da Araucária', pg_temp.uid(1001));

-- Metas do ano e do trimestre
insert into public.metas (indicador_chave, periodo, valor) values
  ('clientes_icp', to_char(current_date, 'YYYY'), 24),
  ('clientes_icp', to_char(current_date, 'YYYY-"T"Q'), 6),
  ('ativados', to_char(current_date, 'YYYY'), 15);

-- -------------------------------------------------------------------------------------
-- Rotinas: status de atividade, régua, faixas e alertas como no dia a dia
-- -------------------------------------------------------------------------------------
select pg_temp.como(null);
select public.rotina_diaria();

commit;
