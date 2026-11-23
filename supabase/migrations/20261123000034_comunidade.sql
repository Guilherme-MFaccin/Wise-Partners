-- Comunidade Wise Partners (23/11/2026). O portal passa a ser a Comunidade Wise Partners: o lugar onde as empresas
-- contratam produtos e serviços do ecossistema do Grupo Tríade, com condições especiais entre os membros.
-- Uma página pública geral (/comunidade), editável em Programa, Páginas, com "Cadastrar" e "Entrar". O cadastro cria
-- a conta na hora e classifica a empresa (cliente do grupo a confirmar, lead de parceiro, lead da consultoria, membro).
-- Regras de acesso do FO-19 mantidas: condições do catálogo para clientes do grupo confirmados e parceiros Premium e Elite;
-- ofertas de parceiros Elite e clientes do grupo. Quem ainda não tem acesso às condições vê o catálogo em vitrine.
-- A entrada como parceiro continua pela fila e pela conversa de entrada (DE-30): o cadastro na comunidade só põe o
-- pedido na fila; a conta já existe e é reaproveitada na aprovação.

-- ---------------------------------------------------------------------------
-- 1. Configuração da página da comunidade (uma linha)
-- ---------------------------------------------------------------------------
create table public.config_comunidade (
  id int primary key default 1 check (id = 1),
  publicada boolean not null default true,
  video_url text check (video_url is null or video_url ~ '^https://'),
  video_formato text not null default 'auto' check (video_formato in ('auto', 'horizontal', 'vertical', 'quadrado')),
  conteudo jsonb not null default '{}'::jsonb,
  termo_uso_versao text not null default '2026-11-23',
  termo_uso_texto text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.perfis(id),
  constraint config_comunidade_conteudo_valido check (
    jsonb_typeof(conteudo) = 'object' and octet_length(conteudo::text) <= 200000
    and position(chr(8212) in conteudo::text) = 0 and position(chr(8211) in conteudo::text) = 0),
  constraint config_comunidade_termo_sem_travessao check (position(chr(8212) in termo_uso_texto) = 0 and position(chr(8211) in termo_uso_texto) = 0)
);
insert into public.config_comunidade (id, termo_uso_texto) values (1,
'1. A Comunidade Wise Partners é um ambiente da Wise Makers, empresa do Grupo Tríade, onde empresas conhecem produtos e serviços do ecossistema e pedem condições especiais umas às outras.

2. O cadastro é da empresa e é feito por uma pessoa autorizada a representá-la. As informações precisam ser verdadeiras e ficar atualizadas.

3. A Wise pode confirmar as informações do cadastro, como o vínculo de cliente com uma empresa do Grupo Tríade, antes de liberar as condições especiais.

4. Cada condição do catálogo é oferecida pela empresa que a publicou, e é ela quem responde por ela. A Wise valida as ofertas, mas não é parte dos negócios fechados entre as empresas.

5. Ao pedir uma condição, a empresa autoriza o envio do nome, do e-mail e do telefone de quem pediu para a empresa que oferece.

6. A empresa pode pedir o encerramento do acesso quando quiser. A Wise pode suspender o acesso em caso de uso indevido.

7. O tratamento de dados pessoais segue a política de privacidade do Wise Partners.');
create trigger t_upd before update on public.config_comunidade for each row execute function public.set_updated_at();
alter table public.config_comunidade enable row level security;
create policy ccom_ler on public.config_comunidade for select to authenticated using (public.is_parcerias());
create policy ccom_admin on public.config_comunidade for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, update on public.config_comunidade to authenticated;
revoke all on public.config_comunidade from anon;

-- ---------------------------------------------------------------------------
-- 2. Membros: o que a empresa contou no cadastro e a classificação que sai dele
-- ---------------------------------------------------------------------------
alter table public.cadastros_landing add column if not exists origem text not null default 'pagina' check (origem in ('pagina', 'comunidade'));

create table public.membros_comunidade (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null unique references public.parceiros(id) on delete cascade,
  perfil_id uuid references public.perfis(id) on delete set null,
  nome text not null,
  cargo text,
  email text not null,
  whatsapp text not null,
  empresa text not null,
  cnpj text not null,
  site text,
  cidade text,
  uf text check (uf is null or uf ~ '^[A-Z]{2}$'),
  segmento text,
  faturamento text check (faturamento is null or public.faixa_faturamento_ordem(faturamento) is not null),
  vendedores int check (vendedores >= 0),
  -- Cliente do grupo declarado no cadastro: a Wise confirma antes de liberar as condições
  vinculo_cliente text not null default 'nao_declarado' check (vinculo_cliente in ('nao_declarado', 'a_confirmar', 'confirmado', 'nao_confirmado')),
  empresas_grupo uuid[] not null default '{}',
  interesses text[] not null default '{}' check (interesses <@ array['comprar', 'oferecer', 'indicar', 'ser_parceiro', 'conhecer_consultoria']),
  como_conheceu text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, referencia text,
  termo_uso_versao text not null,
  privacidade_versao text not null,
  aceite_em timestamptz not null default now(),
  cadastro_parceiro_id uuid references public.cadastros_landing(id) on delete set null,
  vinculo_decidido_por uuid references public.perfis(id),
  vinculo_decidido_em timestamptz,
  vinculo_motivo text,
  lead_atendido_por uuid references public.perfis(id),
  lead_atendido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((nome || empresa || coalesce(cargo, '') || coalesce(segmento, '') || coalesce(como_conheceu, '') || coalesce(vinculo_motivo, ''))
         !~ ('[' || chr(8212) || chr(8211) || ']'))
);
create index on public.membros_comunidade (vinculo_cliente);
create index on public.membros_comunidade (created_at desc);
create trigger t_upd before update on public.membros_comunidade for each row execute function public.set_updated_at();
alter table public.membros_comunidade enable row level security;
create policy mc_ler on public.membros_comunidade for select to authenticated
  using (public.is_interno_leitura() or parceiro_id = public.parceiro_atual());
grant select on public.membros_comunidade to authenticated;
revoke all on public.membros_comunidade from anon;

-- Classificação para a tela e para as tarefas (uma empresa pode ter mais de uma)
create or replace function public.classificacao_membro(m public.membros_comunidade) returns text[]
language sql immutable as $$
  select array_remove(array[
    case when m.vinculo_cliente in ('a_confirmar', 'confirmado') then 'cliente_grupo' end,
    case when 'ser_parceiro' = any(m.interesses) then 'lead_parceiro' end,
    case when 'conhecer_consultoria' = any(m.interesses) then 'lead_consultoria' end,
    case when 'oferecer' = any(m.interesses) then 'quer_oferecer' end
  ], null)
$$;

-- ---------------------------------------------------------------------------
-- 3. Cadastro pela página: valida, cria a empresa, o membro e o convite (a conta nasce na Edge Function)
-- ---------------------------------------------------------------------------
create or replace function public.preparar_membro_comunidade(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_comunidade;
  v_land public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cliente boolean := coalesce((p->>'cliente_grupo')::boolean, false);
  v_empresas uuid[];
  v_interesses text[];
  v_cat public.categorias;
  v_parceiro uuid;
  v_contato uuid;
  v_membro uuid;
  v_fila uuid;
  v_uf text := upper(nullif(btrim(p->>'uf'), ''));
  r record;
begin
  select * into v_cfg from public.config_comunidade where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then raise exception 'O cadastro na comunidade está fechado no momento.' using errcode = 'P0001'; end if;
  select * into v_land from public.config_landing where id = 1;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha seu nome, a empresa e o WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.' using errcode = 'P0001'; end if;
  if length(coalesce(v_cnpj, '')) <> 14 then raise exception 'CNPJ inválido.' using errcode = 'P0001'; end if;
  if v_uf is not null and v_uf !~ '^[A-Z]{2}$' then raise exception 'UF inválida.' using errcode = 'P0001'; end if;
  if coalesce((p->>'aceite_uso')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo de uso e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso. Entre com ele ou recupere a senha.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Sua empresa já tem cadastro na Comunidade Wise Partners. Peça um acesso a quem cuida do portal na sua empresa ou fale com a Wise.' using errcode = '23505';
  end if;

  select coalesce(array_agg(e.id), '{}') into v_empresas
    from public.empresas_grupo e
   where e.id::text in (select jsonb_array_elements_text(coalesce(p->'empresas_grupo', '[]'::jsonb)));
  if v_cliente and cardinality(v_empresas) = 0 then raise exception 'Diga de qual empresa do Grupo Tríade a sua é cliente.' using errcode = 'P0001'; end if;
  if not v_cliente then v_empresas := '{}'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_interesses
    from jsonb_array_elements_text(coalesce(p->'interesses', '[]'::jsonb)) x
   where x in ('comprar', 'oferecer', 'indicar', 'ser_parceiro', 'conhecer_consultoria');

  if nullif(p->>'categoria_id', '') is not null then
    select * into v_cat from public.categorias where id = (p->>'categoria_id')::uuid and tipo in ('comercial', 'institucional') and ativa;
  end if;
  if 'ser_parceiro' = any(v_interesses) then
    if v_cat.id is null then raise exception 'Para ser parceiro, escolha a categoria da sua empresa.' using errcode = 'P0001'; end if;
    if coalesce((p->>'aceite_termo_parceiro')::boolean, false) is not true then
      raise exception 'Para ser parceiro, é preciso aceitar o termo de adesão do programa.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.cadastros_landing where cnpj = v_cnpj and status in ('fila', 'contatado', 'reuniao_marcada')) then
      raise exception 'Esta empresa já está na fila de parceiros. A Wise Makers vai falar com você pelo WhatsApp.' using errcode = '23505';
    end if;
  end if;

  insert into public.parceiros (nome_fantasia, cnpj, site, cidade, uf, tipo_parceria, origem, etapa)
  values (btrim(p->>'empresa'), v_cnpj, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cidade'), ''), v_uf, 'cliente', 'comunidade', 'qualificacao')
  returning id into v_parceiro;
  if v_cat.id is not null then
    insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, v_cat.id, true);
  end if;
  insert into public.contatos (nome, cargo, email, whatsapp) values (btrim(p->>'nome'), nullif(btrim(p->>'cargo'), ''), v_email, btrim(p->>'whatsapp'))
  returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal) values (v_parceiro, v_contato, '{decisor}', true);

  insert into public.membros_comunidade (
    parceiro_id, nome, cargo, email, whatsapp, empresa, cnpj, site, cidade, uf, segmento, faturamento, vendedores,
    vinculo_cliente, empresas_grupo, interesses, como_conheceu, utm_source, utm_medium, utm_campaign, utm_content, referencia,
    termo_uso_versao, privacidade_versao)
  values (
    v_parceiro, btrim(p->>'nome'), nullif(btrim(p->>'cargo'), ''), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj,
    nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cidade'), ''), v_uf, nullif(btrim(p->>'segmento'), ''),
    case when public.faixa_faturamento_ordem(p->>'faturamento') is not null then p->>'faturamento' end,
    case when (p->>'vendedores') ~ '^\d{1,5}$' then (p->>'vendedores')::int end,
    case when v_cliente then 'a_confirmar' else 'nao_declarado' end, v_empresas, v_interesses, nullif(btrim(p->>'como_conheceu'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120), left(p->>'referencia', 300),
    v_cfg.termo_uso_versao, coalesce(v_land.privacidade_versao, v_cfg.termo_uso_versao))
  returning id into v_membro;

  insert into public.convites (email, nome, papel, parceiro_id, is_responsavel_parceiro)
  values (v_email, btrim(p->>'nome'), 'parceiro', v_parceiro, true);

  if 'ser_parceiro' = any(v_interesses) then
    insert into public.cadastros_landing (
      nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
      utm_source, utm_medium, utm_campaign, utm_content, referencia, termo_versao, privacidade_versao, status, origem)
    values (
      btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
      case when (p->>'clientes_ativos') ~ '^\d{1,7}$' then (p->>'clientes_ativos')::int end, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
      left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120), left(p->>'referencia', 300),
      v_land.termo_versao, v_land.privacidade_versao, 'fila', 'comunidade')
    returning id into v_fila;
    update public.membros_comunidade set cadastro_parceiro_id = v_fila where id = v_membro;
  end if;

  for r in select id from public.perfis where papel in ('admin', 'parcerias') and ativo loop
    perform public.notificar(r.id, 'membro_comunidade', 'Nova empresa na comunidade',
      format('%s se cadastrou na Comunidade Wise Partners%s.', btrim(p->>'empresa'),
             case when v_cliente then ' e diz ser cliente do grupo' when v_fila is not null then ' e quer ser parceira' else '' end),
      '/app/catalogo/membros?id=' || v_membro);
  end loop;
  return jsonb_build_object('parceiro_id', v_parceiro, 'membro_id', v_membro, 'fila_id', v_fila, 'email', v_email);
end $$;
revoke execute on function public.preparar_membro_comunidade(jsonb) from public, anon, authenticated;
grant execute on function public.preparar_membro_comunidade(jsonb) to service_role;

-- Se a conta de login não puder ser criada, a Edge Function desfaz o cadastro inteiro
create or replace function public.desfazer_membro_comunidade(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m public.membros_comunidade;
begin
  select * into m from public.membros_comunidade where parceiro_id = p_parceiro;
  if m.id is null then return; end if;
  delete from public.convites where parceiro_id = p_parceiro;
  if m.cadastro_parceiro_id is not null then delete from public.cadastros_landing where id = m.cadastro_parceiro_id; end if;
  delete from public.contatos c using public.parceiro_contatos pc where pc.contato_id = c.id and pc.parceiro_id = p_parceiro;
  delete from public.parceiros where id = p_parceiro and tipo_parceria = 'cliente' and origem = 'comunidade';
end $$;
revoke execute on function public.desfazer_membro_comunidade(uuid) from public, anon, authenticated;
grant execute on function public.desfazer_membro_comunidade(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Confirmar (ou não) o cliente do grupo, marcar o lead atendido, pedir parceria por dentro do portal
-- ---------------------------------------------------------------------------
create or replace function public.decidir_vinculo_cliente(p_membro uuid, p_confirmar boolean, p_empresa_grupo uuid default null, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare m public.membros_comunidade;
begin
  if not public.is_interno_leitura() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into m from public.membros_comunidade where id = p_membro for update;
  if m.id is null then raise exception 'Membro não encontrado.' using errcode = 'P0001'; end if;
  if p_motivo ~ ('[' || chr(8212) || chr(8211) || ']') then p_motivo := regexp_replace(p_motivo, '[' || chr(8212) || chr(8211) || ']', ',', 'g'); end if;
  if p_confirmar then
    update public.parceiros
       set cliente_grupo = true,
           empresa_grupo_cliente_id = coalesce(p_empresa_grupo, m.empresas_grupo[1], empresa_grupo_cliente_id),
           consultor_cliente_id = coalesce(consultor_cliente_id, auth.uid())
     where id = m.parceiro_id;
    update public.membros_comunidade set vinculo_cliente = 'confirmado', vinculo_decidido_por = auth.uid(), vinculo_decidido_em = now(),
           vinculo_motivo = nullif(btrim(p_motivo), '') where id = m.id;
    perform public.notificar_parceiro(m.parceiro_id, 'membro_confirmado', 'Cliente do Grupo Tríade confirmado',
      'As condições especiais do Catálogo de parceiros e o seu link de indicação estão liberados.', '/parceiro/catalogo');
  else
    if coalesce(btrim(p_motivo), '') = '' then raise exception 'Diga o motivo para a empresa.' using errcode = 'P0001'; end if;
    update public.membros_comunidade set vinculo_cliente = 'nao_confirmado', vinculo_decidido_por = auth.uid(), vinculo_decidido_em = now(),
           vinculo_motivo = btrim(p_motivo) where id = m.id;
    perform public.notificar_parceiro(m.parceiro_id, 'membro_nao_confirmado', 'Não confirmamos o vínculo de cliente',
      btrim(p_motivo), '/parceiro/catalogo');
  end if;
end $$;
revoke execute on function public.decidir_vinculo_cliente(uuid, boolean, uuid, text) from public, anon;
grant execute on function public.decidir_vinculo_cliente(uuid, boolean, uuid, text) to authenticated;

-- O cadastro do cliente pela CS ou pelo consultor (cadastrar_cliente_grupo) também confirma o membro com o mesmo CNPJ
create or replace function public.trg_cliente_grupo_membro() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.cliente_grupo and not coalesce(old.cliente_grupo, false) then
    update public.membros_comunidade set vinculo_cliente = 'confirmado', vinculo_decidido_por = coalesce(vinculo_decidido_por, auth.uid()),
           vinculo_decidido_em = coalesce(vinculo_decidido_em, now())
     where parceiro_id = new.id and vinculo_cliente <> 'confirmado';
  end if;
  return new;
end $$;
create trigger t_cliente_grupo_membro after update of cliente_grupo on public.parceiros for each row execute function public.trg_cliente_grupo_membro();

create or replace function public.marcar_lead_atendido(p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_interno_leitura() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.membros_comunidade set lead_atendido_por = auth.uid(), lead_atendido_em = now() where id = p_membro and lead_atendido_em is null;
end $$;
revoke execute on function public.marcar_lead_atendido(uuid) from public, anon;
grant execute on function public.marcar_lead_atendido(uuid) to authenticated;

-- Membro que decide ser parceiro depois do cadastro: o pedido entra na mesma fila (a conversa de entrada continua)
create or replace function public.pedir_parceria_comunidade(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.parceiro_atual();
  m public.membros_comunidade;
  v_land public.config_landing;
  v_cat public.categorias;
  v_id uuid;
  r record;
begin
  select * into m from public.membros_comunidade where parceiro_id = v_eu;
  if v_eu is null or m.id is null or not exists (select 1 from public.parceiros where id = v_eu and tipo_parceria = 'cliente') then
    raise exception 'Só empresas da comunidade que ainda não são parceiras podem fazer este pedido.' using errcode = '42501';
  end if;
  if exists (select 1 from public.cadastros_landing where cnpj = m.cnpj and status in ('fila', 'contatado', 'reuniao_marcada')) then
    raise exception 'O pedido da sua empresa já está na fila. A Wise Makers vai falar com você pelo WhatsApp.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias where id = nullif(p->>'categoria_id', '')::uuid and tipo in ('comercial', 'institucional') and ativa;
  if v_cat.id is null then raise exception 'Escolha a categoria da sua empresa.' using errcode = 'P0001'; end if;
  if coalesce((p->>'aceite_termo_parceiro')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo de adesão do programa.' using errcode = 'P0001';
  end if;
  select * into v_land from public.config_landing where id = 1;
  insert into public.cadastros_landing (nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
                                        termo_versao, privacidade_versao, status, origem)
  values (m.nome, m.email, m.whatsapp, m.empresa, m.cnpj, v_cat.id, v_cat.nome,
          case when (p->>'clientes_ativos') ~ '^\d{1,7}$' then (p->>'clientes_ativos')::int end, m.site, m.cargo,
          v_land.termo_versao, v_land.privacidade_versao, 'fila', 'comunidade')
  returning id into v_id;
  update public.membros_comunidade set cadastro_parceiro_id = v_id,
         interesses = (select array_agg(distinct x) from unnest(interesses || array['ser_parceiro']) x) where id = m.id;
  for r in select id from public.perfis where papel in ('admin', 'parcerias') and ativo loop
    perform public.notificar(r.id, 'fila_landing', 'Novo parceiro na fila', format('%s, da comunidade, pediu para ser parceira.', m.empresa), '/app/candidatos');
  end loop;
  return v_id;
end $$;
revoke execute on function public.pedir_parceria_comunidade(jsonb) from public, anon;
grant execute on function public.pedir_parceria_comunidade(jsonb) to authenticated;

-- Aprovar da fila: quando a empresa já é membro da comunidade, o mesmo registro vira parceiro e a conta é reaproveitada
create or replace function public.aprovar_cadastro_landing(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c public.cadastros_landing;
  v_parceiro uuid;
  v_contato uuid;
  v_existente public.parceiros;
  v_tipo text;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.cadastros_landing where id = p_id for update;
  if c.id is null then raise exception 'Cadastro não encontrado.' using errcode = 'P0001'; end if;
  if c.status not in ('fila', 'contatado', 'reuniao_marcada') then
    raise exception 'Este cadastro não está na fila.' using errcode = 'P0001';
  end if;
  select * into v_existente from public.parceiros where public.somente_digitos(cnpj) = c.cnpj limit 1;
  if v_existente.id is not null and v_existente.tipo_parceria <> 'cliente' then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  select case when tipo = 'institucional' then 'institucional' else 'comercial' end into v_tipo from public.categorias where id = c.categoria_id;
  v_tipo := coalesce(v_tipo, 'comercial');

  if v_existente.id is not null then
    -- Empresa da comunidade (cliente do grupo ou membro): o mesmo registro passa a ser parceiro
    v_parceiro := v_existente.id;
    update public.parceiros set tipo_parceria = v_tipo, etapa = 'qualificacao' where id = v_parceiro;
    if c.categoria_id is not null and not exists (select 1 from public.parceiro_categorias where parceiro_id = v_parceiro and categoria_id = c.categoria_id) then
      insert into public.parceiro_categorias (parceiro_id, categoria_id, principal)
      values (v_parceiro, c.categoria_id, not exists (select 1 from public.parceiro_categorias where parceiro_id = v_parceiro and principal));
    end if;
    update public.parceiro_contatos set papeis = (select array_agg(distinct x) from unnest(papeis || array['responsavel_parceria']) x)
     where parceiro_id = v_parceiro and principal;
  else
    insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
    values (c.empresa, c.cnpj, c.site, v_tipo, 'landing_saas', 'qualificacao', auth.uid())
    returning id into v_parceiro;
    if c.categoria_id is not null then
      insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, c.categoria_id, true);
    end if;
    insert into public.contatos (nome, cargo, email, whatsapp) values (c.nome, c.cargo, c.email, c.whatsapp) returning id into v_contato;
    insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
    values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);
  end if;

  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null,
    format('Termo padrão versão %s aceito %s em %s; aprovado da fila.', c.termo_versao,
           case c.origem when 'comunidade' then 'no cadastro da Comunidade Wise Partners' else 'na landing page' end,
           to_char(c.aceite_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela página: nível a confirmar pela carteira no ICP.',
         pacote = 'C', data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  update public.cadastros_landing set parceiro_id = v_parceiro, status = 'aprovado', aprovado_em = now(), atualizado_em = now() where id = p_id;
  return jsonb_build_object('parceiro_id', v_parceiro, 'email', c.email, 'nome', c.nome, 'empresa', c.empresa,
    'ja_tem_acesso', exists (select 1 from public.perfis where parceiro_id = v_parceiro and ativo));
end $$;
revoke execute on function public.aprovar_cadastro_landing(uuid) from public, anon;
grant execute on function public.aprovar_cadastro_landing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. O que cada conta acessa (a navegação da área do parceiro segue esta função)
-- ---------------------------------------------------------------------------
create or replace function public.acesso_comunidade() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when p.id is null then jsonb_build_object('empresa', false) else jsonb_build_object(
    'empresa', true,
    'parceiro_programa', p.tipo_parceria <> 'cliente',
    'cliente_grupo', p.cliente_grupo,
    'nivel', case when p.tipo_parceria = 'cliente' or p.data_assinatura is null then null
                  when p.nivel = 'A' then 'elite' when p.nivel = 'B' then 'premium' else 'select' end,
    'ver_condicoes', public.pode_ver_catalogo(p.id),
    'ofertar', public.pode_ofertar(p.id),
    'indicar', p.tipo_parceria <> 'cliente' or p.cliente_grupo,
    'vinculo_cliente', m.vinculo_cliente,
    'vinculo_motivo', m.vinculo_motivo,
    'empresas_grupo', coalesce((select jsonb_agg(e.nome order by e.ordem) from public.empresas_grupo e where e.id = any(m.empresas_grupo)), '[]'::jsonb),
    'pedido_parceria', (select c.status from public.cadastros_landing c where c.cnpj = public.somente_digitos(p.cnpj) order by c.created_at desc limit 1)
  ) end
    from (select public.parceiro_atual() id) eu
    left join public.parceiros p on p.id = eu.id
    left join public.membros_comunidade m on m.parceiro_id = p.id
$$;
revoke execute on function public.acesso_comunidade() from public, anon;
grant execute on function public.acesso_comunidade() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Catálogo para todos os membros: quem não tem acesso às condições vê a vitrine (empresas e ofertas, sem a condição)
-- ---------------------------------------------------------------------------
drop function if exists public.catalogo_hub();
create function public.catalogo_hub() returns table (
  oferta_id uuid, titulo text, descricao text, para_quem text, condicao text, como_usar text, validade date,
  parceiro_id uuid, empresa text, site text, cliente_grupo boolean, categoria text, categorias text[], propria boolean,
  liberada boolean, logo_caminho text, cidade text, uf text
)
language sql stable security definer set search_path = public as $$
  with acesso as (select public.is_interno() or public.pode_ver_catalogo() as ver, public.parceiro_atual() as eu)
  select o.id, o.titulo, o.descricao, o.para_quem,
         case when a.ver or p.id = a.eu then o.condicao end,
         case when a.ver or p.id = a.eu then o.como_usar end,
         o.validade, p.id, p.nome_fantasia, p.site, p.cliente_grupo, c.nome,
         coalesce((select array_agg(c2.nome order by pc.principal desc, c2.nome) from public.parceiro_categorias pc join public.categorias c2 on c2.id = pc.categoria_id
                    where pc.parceiro_id = p.id), '{}'),
         p.id = a.eu, a.ver or p.id = a.eu, p.logo_caminho, p.cidade, p.uf
    from acesso a, public.ofertas_hub o join public.parceiros p on p.id = o.parceiro_id left join public.categorias c on c.id = o.categoria_id
   where (public.is_interno() or a.eu is not null)
     and o.estado = 'publicada' and (o.validade is null or o.validade >= public.hoje()) and public.pode_ofertar(p.id)
   order by o.validada_em desc nulls last, o.created_at desc
$$;
revoke execute on function public.catalogo_hub() from public, anon;
grant execute on function public.catalogo_hub() to authenticated;

-- Números da página pública: só contagens e nomes de categorias, nenhuma empresa nem condição
create or replace function public.resumo_comunidade() returns jsonb
language sql stable security definer set search_path = public as $$
  with ofertas as (
    select o.*, p.id pid from public.ofertas_hub o join public.parceiros p on p.id = o.parceiro_id
     where o.estado = 'publicada' and (o.validade is null or o.validade >= public.hoje()) and public.pode_ofertar(p.id))
  select jsonb_build_object(
    'ofertas', (select count(*) from ofertas),
    'empresas_ofertando', (select count(distinct pid) from ofertas),
    'membros', (select count(*) from public.parceiros p where p.tipo_parceria = 'cliente' or p.data_assinatura is not null),
    'categorias', coalesce((select jsonb_agg(nome order by n desc, nome) from (
        select c.nome, count(*) n from ofertas o join public.parceiro_categorias pc on pc.parceiro_id = o.pid and pc.principal
          join public.categorias c on c.id = pc.categoria_id group by c.nome order by n desc, c.nome limit 12) x), '[]'::jsonb))
$$;
revoke execute on function public.resumo_comunidade() from public, anon, authenticated;
grant execute on function public.resumo_comunidade() to service_role;

-- ---------------------------------------------------------------------------
-- 7. Link de indicação da consultoria também para os clientes do grupo confirmados
-- ---------------------------------------------------------------------------
create or replace function public.garantir_link_cliente(p_parceiro uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not (public.is_parcerias() or p_parceiro = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if not (public.parceiro_assinado(p_parceiro) or exists (select 1 from public.parceiros where id = p_parceiro and cliente_grupo)) then
    raise exception 'O link é de parceiros com contrato e de clientes do Grupo Tríade.' using errcode = 'P0001';
  end if;
  select codigo into v from public.links_cliente where parceiro_id = p_parceiro;
  if v is null then
    loop
      v := lower(translate(substr(public.gerar_token_rfp(), 1, 10), '-_', 'xz'));
      exit when not exists (select 1 from public.links_cliente where codigo = v);
    end loop;
    insert into public.links_cliente (parceiro_id, codigo) values (p_parceiro, v);
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Tarefas: confirmar o cliente declarado e falar com quem quer conhecer a consultoria
-- ---------------------------------------------------------------------------
create or replace function public.excecoes_abertas()
returns table (
  chave text, tipo text, grupo text, prioridade int, titulo text, detalhe text,
  parceiro_id uuid, parceiro text, responsavel_id uuid, responsavel text,
  desde date, prazo date, ref_id uuid, link text
)
language sql stable security definer set search_path = public as $$
  -- Todas as exceções abertas, sem filtro de papel. Só o sistema chama (sincronizar_tarefas); a tela usa a tabela tarefas.
  with cfg as (
    select public.hoje() as hoje,
           public.config_int('parada_contato_feito_dias_uteis', 4) as cf,
           public.config_int('parada_proposta_dias', 7) as pd,
           public.config_int('indicacao_parada_dias', 15) as ip,
           public.config_int('onboarding_etapa_parada_dias', 14) as op
  ),
  itens as (
    -- Decidir -------------------------------------------------------------
    select 'assinatura'::text tipo, 'decidir'::text grupo, 1 prioridade, 'Aprovar a assinatura'::text titulo,
           'Em proposta com o decisor; só o Diretor aprova'::text detalhe,
           p.id parceiro_id, p.responsavel_id, p.etapa_desde::date desde, null::date prazo, p.id ref_id,
           '/app/parceiros/' || p.id || '?aba=contrato' link
      from public.parceiros p
     where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)
    union all
    select 'desligamento', 'decidir', 1, 'Decidir o desligamento sugerido',
           'Sugerido por ' || case f.tipo when 'inadequacao' then 'inadequação' else 'inatividade' end || '; só o Diretor decide',
           f.parceiro_id, p.responsavel_id, f.sugerido_em::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=desligamento'
      from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id
     where f.estado = 'sugerido'
    union all
    select 'rebaixamento', 'decidir', 2, 'Decidir a revisão de nível',
           'Revisão ' || r.trimestre || ': confirmar o rebaixamento ou manter, com motivo',
           r.parceiro_id, p.responsavel_id, r.created_at::date, null, r.id, '/app/parceiros/' || r.parceiro_id || '?aba=nivel'
      from public.revisoes_nivel r join public.parceiros p on p.id = r.parceiro_id
     where r.resultado = 'proposta_rebaixamento' and r.decisao is null
    union all
    select 'comprovacao', 'decidir', 2, 'Validar a comprovação de contrapartida', c.nome,
           x.parceiro_id, p.responsavel_id, x.created_at::date, null, x.id, '/app/parceiros/' || x.parceiro_id || '?aba=contrapartidas'
      from public.comprovacoes x join public.contrapartidas c on c.id = x.contrapartida_id join public.parceiros p on p.id = x.parceiro_id
     where x.estado = 'enviada'
    union all
    select 'ficha', 'decidir', 3, 'Revisar a ficha de apresentação', 'O parceiro propôs alterações na ficha da Prateleira',
           f.parceiro_id, p.responsavel_id, f.created_at::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=ficha'
      from public.propostas_ficha f join public.parceiros p on p.id = f.parceiro_id
     where f.estado = 'pendente'
    union all
    select 'atualizacao_indicacao', 'decidir', 2, 'Confirmar a atualização da indicação', cl.razao_social,
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.atualizacao_em::date, null, i.id, '/app/indicacoes?id=' || i.id
      from public.indicacoes i join public.parceiros p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where i.atualizacao_pendente is not null
    -- Responder -----------------------------------------------------------
    union all
    select 'candidato', 'responder', case when c.status = 'fila' then 1 else 2 end,
           case c.status when 'fila' then 'Falar com o candidato pelo WhatsApp'
                         when 'contatado' then 'Retomar o candidato sem resposta'
                         else 'Registrar a conversa de entrada' end,
           c.empresa || coalesce(' · ' || c.categoria_nome, '') || case when c.origem = 'comunidade' then ' · pela Comunidade' else '' end,
           null, null, coalesce(c.atualizado_em, c.created_at)::date,
           case when c.status = 'fila' then c.created_at::date + 1 end, c.id, '/app/candidatos?id=' || c.id
      from public.cadastros_landing c, cfg
     where c.status = 'fila'
        or (c.status = 'contatado' and coalesce(c.atualizado_em, c.created_at) < now() - interval '2 days')
        or (c.status = 'reuniao_marcada' and coalesce(c.atualizado_em, c.created_at) < now() - interval '1 day')
    union all
    select 'diagnostico', 'responder', 1,
           case when d.status = 'reuniao_feita' then 'Enviar o plano de ação' else 'Confirmar a reunião de diagnóstico' end,
           d.empresa || ' · ' || d.vendedores || ' vendedores',
           d.parceiro_id, coalesce(d.consultor_id, p.responsavel_id),
           coalesce(d.reuniao_em, d.created_at)::date,
           case when d.status = 'reuniao_feita' then coalesce(d.reuniao_em, d.atualizado_em, d.created_at)::date + 2 end,
           d.id, '/app/diagnosticos?id=' || d.id
      from public.cadastros_cliente d join public.parceiros p on p.id = d.parceiro_id
     where d.icp and ((d.status in ('cadastrado', 'agenda_liberada') and d.created_at < now() - interval '2 days')
                      or (d.status = 'reuniao_feita' and d.plano_enviado_em is null))
    union all
    select 'sla', 'responder', 1,
           case when count(*) = 1 then 'Indicação com prazo vencido' else count(*) || ' indicações com prazo vencido' end,
           string_agg(coalesce(cl.razao_social, 'Cliente'), '; ' order by i.ultima_atualizacao),
           i.parceiro_id, min(coalesce(i.responsavel_id, p.responsavel_id)::text)::uuid, min(i.ultima_atualizacao)::date, null, i.parceiro_id,
           case when count(*) = 1 then '/app/indicacoes?id=' || min(i.id::text) else '/app/parceiros/' || i.parceiro_id || '?aba=indicacoes' end
      from public.indicacoes i join public.parceiros p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where cardinality(public.sla_vencidos(i)) > 0
     group by i.parceiro_id
    union all
    select 'indicacao_parada', 'responder', 2, 'Dar retorno ao parceiro sobre a indicação',
           coalesce(cl.razao_social, 'Cliente') || ': sem atualização há mais de ' || cfg.ip || ' dias',
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.ultima_atualizacao::date, null, i.id, '/app/indicacoes?id=' || i.id
      from cfg, public.indicacoes i join public.parceiros p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - make_interval(days => cfg.ip)
       and cardinality(public.sla_vencidos(i)) = 0
    union all
    select 'checagem', 'responder', 2, 'Checar o cliente aos ' || case c.marco when '6m' then '6' else '12' end || ' meses',
           coalesce(cl.razao_social, 'Cliente'),
           c.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), c.prevista_para, c.prevista_para, c.id, '/app/indicacoes?id=' || c.indicacao_id
      from cfg, public.checagens_cliente c join public.indicacoes i on i.id = c.indicacao_id
      join public.parceiros p on p.id = c.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where c.registrada_em is null and c.prevista_para <= cfg.hoje
    union all
    select 'comissao', 'responder', 2, case c.estado when 'a_pagar' then 'Pedir a nota fiscal da comissão' else 'Pagar a comissão' end,
           coalesce(cl.razao_social, 'Cliente') || coalesce(' · R$ ' || to_char(c.valor, 'FM999G999G990D00'), ''),
           c.parceiro_id, null, coalesce(c.nf_recebida_em, c.a_pagar_em, c.updated_at)::date, null, c.id, '/app/comissoes'
      from public.comissoes c join public.indicacoes i on i.id = c.indicacao_id left join public.clientes cl on cl.id = i.cliente_id
     where c.estado in ('a_pagar', 'nf_recebida') and c.beneficiario = 'parceiro'
    -- Acompanhar ----------------------------------------------------------
    union all
    select 'proximo_passo', 'acompanhar', 2, 'Próximo passo atrasado', x.descricao,
           x.parceiro_id, x.responsavel_id, x.data, x.data, x.id, '/app/parceiros/' || x.parceiro_id || '?aba=linha-do-tempo'
      from cfg, public.proximos_passos x
     where x.estado in ('aberto', 'vencido') and x.data < cfg.hoje
    union all
    select 'tarefa_onboarding', 'acompanhar', 2, 'Tarefa de onboarding', t.descricao,
           t.parceiro_id, t.responsavel_id, t.prazo, t.prazo, t.id, '/app/parceiros/' || t.parceiro_id || '?aba=onboarding'
      from cfg, public.tarefas_onboarding t
     where not t.feita and t.prazo <= cfg.hoje + 2
    union all
    select 'onboarding_parado', 'acompanhar', 2, 'Parceiro parado no onboarding',
           'Falta: ' || e.titulo || ' (há ' || (cfg.hoje - e.desde) || ' dias sem avançar)',
           pl.parceiro_id, p.responsavel_id, e.desde, null::date, pl.parceiro_id,
           '/app/parceiros/' || pl.parceiro_id || '?aba=onboarding'
      from cfg, public.planos_onboarding pl join public.parceiros p on p.id = pl.parceiro_id
      cross join lateral (
        select x.titulo, coalesce((select max(y.feita_em) from public.etapas_onboarding(pl.parceiro_id) y where y.feita)::date,
                                  p.data_assinatura, pl.inicio) as desde
          from public.etapas_onboarding(pl.parceiro_id) x where not x.feita order by x.ordem limit 1) e
     where pl.situacao <> 'nao_ativado' and cfg.hoje - e.desde >= cfg.op
    union all
    select 'negociacao_parada', 'acompanhar', 2, 'Negociação parada', 'Em ' || e.nome || ' desde ' || to_char(p.etapa_desde, 'DD/MM'),
           p.id, p.responsavel_id, p.etapa_desde::date, null, p.id, '/app/parceiros/' || p.id || '?aba=contrato'
      from cfg, public.parceiros p join public.etapas_funil e on e.codigo = p.etapa
     where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, cfg.hoje) >= cfg.cf)
        or (p.etapa = 'proposta_decisor' and cfg.hoje - p.etapa_desde::date >= cfg.pd and public.tem_aprovacao_assinatura(p.id))
    union all
    select 'cadencia', 'acompanhar', 3, 'Falar com o parceiro: cadência de contato passou',
           'Reunião prevista até ' || to_char((s.v->>'proxima_ate')::date, 'DD/MM'),
           p.id, p.responsavel_id, (s.v->>'proxima_ate')::date, (s.v->>'proxima_ate')::date, p.id, '/app/parceiros/' || p.id || '?aba=linha-do-tempo'
      from public.parceiros p cross join lateral (select public.regua_status(p.id) v) s
     where p.data_assinatura is not null and coalesce((s.v->>'atrasada')::boolean, false)
    union all
    select 'acao_wise', 'acompanhar', 2,
           case when count(*) = 1 then 'Ação da Wise atrasada' else count(*) || ' ações da Wise atrasadas' end,
           string_agg(a.nome, '; ' order by a.data_prevista),
           a.parceiro_id, min(coalesce(a.responsavel_id, p.responsavel_id)::text)::uuid, min(a.data_prevista), min(a.data_prevista), a.parceiro_id,
           '/app/parceiros/' || a.parceiro_id || '?aba=acoes'
      from public.acoes_wise a join public.parceiros p on p.id = a.parceiro_id
     where a.ativa and a.estado = 'atrasada'
     group by a.parceiro_id
    union all
    select 'contrapartida', 'acompanhar', 3,
           case when count(*) = 1 then 'Contrapartida do parceiro atrasada' else count(*) || ' contrapartidas do parceiro atrasadas' end,
           string_agg(c.nome, '; ' order by c.proxima_data),
           c.parceiro_id, min(p.responsavel_id::text)::uuid, min(c.proxima_data), min(c.proxima_data), c.parceiro_id,
           '/app/parceiros/' || c.parceiro_id || '?aba=contrapartidas'
      from public.contrapartidas c join public.parceiros p on p.id = c.parceiro_id
     where c.ativa and c.estado = 'atrasada'
     group by c.parceiro_id
    union all
    select 'oferta_validar', 'decidir', 2, 'Validar a oferta do catálogo', o.titulo || ' · condição: ' || o.condicao,
           o.parceiro_id, p.responsavel_id, o.updated_at::date, o.updated_at::date + 2, o.id, '/app/catalogo?aba=validar'
      from public.ofertas_hub o join public.parceiros p on p.id = o.parceiro_id
     where o.estado = 'em_validacao'
    union all
    select 'membro_vinculo', 'decidir', 2, 'Confirmar o cliente do Grupo Tríade',
           m.empresa || ' diz ser cliente de ' || coalesce((select string_agg(e.nome, ', ' order by e.ordem) from public.empresas_grupo e where e.id = any(m.empresas_grupo)), 'empresa do grupo'),
           m.parceiro_id, null, m.created_at::date, m.created_at::date + 2, m.id, '/app/catalogo/membros?id=' || m.id
      from public.membros_comunidade m
     where m.vinculo_cliente = 'a_confirmar'
    union all
    select 'lead_comunidade', 'responder', 2, 'Falar com a empresa que quer conhecer a consultoria',
           m.empresa || coalesce(' · ' || m.vendedores || ' vendedores', '') || ' · ' || m.whatsapp,
           m.parceiro_id, null, m.created_at::date, m.created_at::date + 1, m.id, '/app/catalogo/membros?id=' || m.id
      from public.membros_comunidade m
     where 'conhecer_consultoria' = any(m.interesses) and m.lead_atendido_em is null
    union all
    select 'em_risco', 'acompanhar', 1, 'Retomar o parceiro em risco',
           case f.estado when 'em_risco' then 'Em risco de desligamento' when 'tentativa_1' then 'Primeira tentativa de retomada feita'
                         else 'Segunda tentativa de retomada feita' end,
           f.parceiro_id, p.responsavel_id, f.created_at::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=desligamento'
      from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id
     where f.estado in ('em_risco', 'tentativa_1', 'tentativa_2')
  )
  select i.tipo || ':' || i.ref_id, i.tipo, i.grupo, i.prioridade, i.titulo, i.detalhe,
         i.parceiro_id, p.nome_fantasia, i.responsavel_id, r.nome, i.desde, i.prazo, i.ref_id, i.link
    from itens i
    left join public.parceiros p on p.id = i.parceiro_id
    left join public.perfis r on r.id = i.responsavel_id
   order by i.prioridade, coalesce(i.prazo, i.desde) nulls last, i.titulo;
$$;
revoke execute on function public.excecoes_abertas() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Aba "Conhecer a Wise Makers": o minicurso "Como vender a Wise Makers" fica aberto a todas as empresas da
--    comunidade. As outras trilhas, o teste e o certificado continuam para parceiros com contrato.
-- ---------------------------------------------------------------------------
create or replace function public.pode_ver_trilha(p_trilha uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_interno_leitura() or exists (
    select 1 from public.trilhas t where t.id = p_trilha and t.publicada and public.parceiro_atual() is not null
       and (public.parceiro_assinado(public.parceiro_atual()) or t.chave = 'como_vender'))
$$;
grant execute on function public.pode_ver_trilha(uuid) to authenticated;

drop policy if exists trilha_ler on public.trilhas;
create policy trilha_ler on public.trilhas for select to authenticated using (public.pode_ver_trilha(id));
drop policy if exists modulo_ler on public.trilha_modulos;
create policy modulo_ler on public.trilha_modulos for select to authenticated using (public.pode_ver_trilha(trilha_id));
drop policy if exists pergunta_ler on public.trilha_perguntas;
create policy pergunta_ler on public.trilha_perguntas for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or (public.parceiro_atual() is not null and public.pode_ver_trilha(trilha_id)));
drop policy if exists st_trilha_ler on storage.objects;
create policy st_trilha_ler on storage.objects for select to authenticated using (
  bucket_id = 'trilhas' and (public.is_interno_leitura() or public.parceiro_atual() is not null));

create or replace function public.concluir_modulo(p_modulo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_trilha public.trilhas;
begin
  select t.* into v_trilha from public.trilhas t join public.trilha_modulos m on m.trilha_id = t.id where m.id = p_modulo;
  if v_trilha.id is null or not v_trilha.publicada then raise exception 'Módulo não encontrado.' using errcode = 'P0001'; end if;
  if public.parceiro_atual() is null or not public.pode_ver_trilha(v_trilha.id) then
    raise exception 'Capacitação disponível para parceiros com contrato assinado.' using errcode = '42501';
  end if;
  insert into public.trilha_progresso (perfil_id, modulo_id) values (auth.uid(), p_modulo) on conflict do nothing;
end $$;
