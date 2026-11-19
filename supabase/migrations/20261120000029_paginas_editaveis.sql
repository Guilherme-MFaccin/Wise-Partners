-- Páginas públicas editáveis pelo portal (decisões do Guilherme, 19/11/2026).
-- Uma página única para os parceiros (/parceiros) e uma página única para o cliente do parceiro (/c/:codigo),
-- sem nome, logo ou cor de parceiro. O código do link continua só para atribuir o cadastro (links_cliente).
-- O administrador controla textos, seções, perguntas frequentes, valores de referência e cases em Programa, Páginas.
-- Migração aditiva: nada das anteriores é alterado; funções mudam por "create or replace".

-- ---------------------------------------------------------------------------
-- 1. Conteúdo editável de cada página (jsonb). Vazio = a página usa os textos padrão do código.
--    Formato (as chaves dos blocos estão em src/lib/paginas.ts):
--    {
--      "secoes": {
--        "<bloco>": { "visivel": bool, "eyebrow": text, "titulo": text, "texto": text, "botao": text, "nota": text,
--                     "itens": [{ "titulo": text, "texto": text }], "itens_parceiro": [{ "titulo": text, "texto": text }] }
--      },
--      "perguntas": [{ "pergunta": text, "resposta": text }]
--    }
--    Só o que difere do padrão é gravado. Textos aceitam marcadores: {valor_total}, {valor_diagnostico}, {valor_hub},
--    {perfil_reuniao}, {media_cases} e {qtd_cases}.
-- ---------------------------------------------------------------------------
alter table public.config_landing add column if not exists conteudo jsonb not null default '{}'::jsonb;
alter table public.config_landing add constraint config_landing_conteudo_valido check (
  jsonb_typeof(conteudo) = 'object'
  and octet_length(conteudo::text) <= 200000
  and position(chr(8212) in conteudo::text) = 0
  and position(chr(8211) in conteudo::text) = 0);

alter table public.config_landing_cliente add column if not exists conteudo jsonb not null default '{}'::jsonb;
alter table public.config_landing_cliente add constraint config_landing_cliente_conteudo_valido check (
  jsonb_typeof(conteudo) = 'object'
  and octet_length(conteudo::text) <= 200000
  and position(chr(8212) in conteudo::text) = 0
  and position(chr(8211) in conteudo::text) = 0);

-- ---------------------------------------------------------------------------
-- 2. Valores de referência do que o cliente do parceiro recebe (FO-15): diagnóstico R$ 2.000 e Wise Hub R$ 3.000.
--    Valem para as duas páginas; ficam na configuração da página do cliente.
-- ---------------------------------------------------------------------------
alter table public.config_landing_cliente add column if not exists valor_diagnostico numeric(12, 2) not null default 2000
  check (valor_diagnostico >= 0 and valor_diagnostico <= 10000000);
alter table public.config_landing_cliente add column if not exists valor_hub numeric(12, 2) not null default 3000
  check (valor_hub >= 0 and valor_hub <= 10000000);

-- Perfil para a reunião de diagnóstico: 3 vendedores ou mais e faturamento a partir de R$ 250 mil por mês.
-- Só ajusta quem ainda está com o padrão antigo (4 vendedores, sem faturamento mínimo).
alter table public.config_landing_cliente alter column icp_min_vendedores set default 3;
alter table public.config_landing_cliente alter column icp_faturamento_min set default '250k_500k';
update public.config_landing_cliente set icp_min_vendedores = 3 where icp_min_vendedores = 4;
update public.config_landing_cliente set icp_faturamento_min = '250k_500k' where icp_faturamento_min is null;

-- ---------------------------------------------------------------------------
-- 3. Cases de resultado num lugar só (processo P-100): usados pelas duas páginas e pelo kit.
--    Crescimento = faturamento nos meses de trabalho contra os mesmos meses do ano anterior, em %.
-- ---------------------------------------------------------------------------
create table public.cases_resultado (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (btrim(empresa) <> '' and length(empresa) <= 120),
  segmento text not null check (btrim(segmento) <> '' and length(segmento) <= 200),
  crescimento numeric(6, 1) not null check (crescimento between -100 and 10000),
  periodo text not null check (btrim(periodo) <> '' and length(periodo) <= 60),
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_resultado_sem_travessao check (
    position(chr(8212) in empresa || segmento || periodo) = 0 and position(chr(8211) in empresa || segmento || periodo) = 0)
);
create index on public.cases_resultado (ordem);
create trigger t_upd before update on public.cases_resultado for each row execute function public.set_updated_at();
alter table public.cases_resultado enable row level security;
create policy cr_ler on public.cases_resultado for select to authenticated using (public.is_interno());
create policy cr_incluir on public.cases_resultado for insert to authenticated with check (public.is_admin());
create policy cr_alterar on public.cases_resultado for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cr_apagar on public.cases_resultado for delete to authenticated using (public.is_admin());
revoke all on public.cases_resultado from anon;

-- Os 8 cases publicados (página de cases da Wise Makers, nov/26): as 8 empresas autorizaram nome e segmento.
insert into public.cases_resultado (empresa, segmento, crescimento, periodo, ordem) values
  ('Florart''s Decor', 'Decoração e ambientes de alto padrão', 89.4, 'jan/25 a out/26', 1),
  ('Maringá Portas', 'Indústria de portas', 43.8, 'jan/26 a out/26', 2),
  ('Chamego Bandeiras', 'Indústria de bandeiras', 39.7, 'jan/25 a ago/26', 3),
  ('Fusion Alumínios', 'Portas de vidro e soluções para móveis planejados', 25.7, 'fev/25 a nov/25', 4),
  ('Totonho Locações', 'Locação de móveis e peças para festas e eventos', 25.4, 'jan/26 a out/26', 5),
  ('Protectpool', 'Soluções para piscinas e rede de revendedores', 20.8, 'jan/25 a out/26', 6),
  ('Powerfit', 'Equipamentos esportivos para o mercado fitness', 19.9, 'jan/25 a out/25', 7),
  ('Nicopel', 'Indústria de embalagens personalizadas', 16.5, 'jan/26 a out/26', 8);

-- O banco entrega a lista pronta e a média (só os cases ativos): as páginas e o editor não calculam nada.
create or replace function public.resumo_cases() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'itens', coalesce(jsonb_agg(jsonb_build_object('empresa', c.empresa, 'segmento', c.segmento, 'crescimento', c.crescimento,
      'periodo', c.periodo) order by c.ordem, c.empresa), '[]'::jsonb),
    'quantidade', count(*)::int,
    'media', round(avg(c.crescimento))::int,
    'media_exata', round(avg(c.crescimento), 1))
  from public.cases_resultado c where c.ativo
$$;
revoke execute on function public.resumo_cases() from public, anon;
grant execute on function public.resumo_cases() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Parceiros de qualquer categoria (21 comerciais e as institucionais): o cadastro pela página aceita todas as ativas.
-- ---------------------------------------------------------------------------
update public.categorias set nome = 'Outra categoria'
 where tipo = 'comercial' and nome = 'Outro tipo de software'
   and not exists (select 1 from public.categorias where tipo = 'comercial' and nome = 'Outra categoria');

create or replace function public.entrar_fila_landing(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cat public.categorias;
  v_id uuid;
  r record;
begin
  select * into v_cfg from public.config_landing where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.' using errcode = 'P0001'; end if;
  if length(v_cnpj) <> 14 then raise exception 'CNPJ inválido.' using errcode = 'P0001'; end if;
  if coalesce((p->>'aceite_termo')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  if exists (select 1 from public.cadastros_landing where cnpj = v_cnpj and status in ('fila', 'contatado', 'reuniao_marcada')) then
    raise exception 'Esta empresa já está na fila. A Wise Makers vai falar com você pelo WhatsApp.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias
   where id = nullif(p->>'categoria_id', '')::uuid and tipo in ('comercial', 'institucional') and ativa;
  if v_cat.id is null then raise exception 'Escolha a categoria da sua empresa.' using errcode = 'P0001'; end if;

  insert into public.cadastros_landing (
    nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao, status)
  values (
    btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    nullif(p->>'clientes_ativos', '')::int, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300), v_cfg.termo_versao, v_cfg.privacidade_versao, 'fila')
  returning id into v_id;

  for r in select id from public.perfis where papel = 'admin' and ativo loop
    perform public.notificar(r.id, 'fila_landing', 'Novo parceiro na fila',
      format('%s (%s, %s clientes) se cadastrou pela página e aguarda contato.', btrim(p->>'empresa'), v_cat.nome, coalesce(nullif(p->>'clientes_ativos', ''), '?')),
      '/app/candidatos');
  end loop;
  return jsonb_build_object('cadastro_id', v_id, 'email', v_email);
end $$;

-- Modo "acesso direto" (desligado por padrão): mesma regra de categoria.
create or replace function public.cadastrar_parceiro_landing(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cat public.categorias;
  v_parceiro uuid;
  v_contato uuid;
  v_cadastro uuid;
begin
  select * into v_cfg from public.config_landing where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.' using errcode = 'P0001';
  end if;
  if length(v_cnpj) <> 14 then
    raise exception 'CNPJ inválido.' using errcode = 'P0001';
  end if;
  if coalesce((p->>'aceite_termo')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias
   where id = nullif(p->>'categoria_id', '')::uuid and tipo in ('comercial', 'institucional') and ativa;
  if v_cat.id is null then
    raise exception 'Escolha a categoria da sua empresa.' using errcode = 'P0001';
  end if;

  insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
  values (btrim(p->>'empresa'), v_cnpj, nullif(btrim(p->>'site'), ''), 'comercial', 'landing_saas', 'qualificacao', null)
  returning id into v_parceiro;

  insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, v_cat.id, true);

  insert into public.contatos (nome, cargo, email, whatsapp)
  values (btrim(p->>'nome'), nullif(btrim(p->>'cargo'), ''), v_email, btrim(p->>'whatsapp'))
  returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
  values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);

  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null, format('Termo padrão versão %s aceito na landing page.', v_cfg.termo_versao));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela landing page: nível a confirmar pela carteira no ICP.',
         pacote = 'C', data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  insert into public.convites (email, nome, papel, parceiro_id, is_responsavel_parceiro)
  values (v_email, btrim(p->>'nome'), 'parceiro', v_parceiro, true);

  insert into public.cadastros_landing (
    parceiro_id, nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao)
  values (
    v_parceiro, btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    nullif(p->>'clientes_ativos', '')::int, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300), v_cfg.termo_versao, v_cfg.privacidade_versao)
  returning id into v_cadastro;

  return jsonb_build_object('parceiro_id', v_parceiro, 'cadastro_id', v_cadastro, 'email', v_email);
end $$;
