-- Landing page do cliente do parceiro (/c/:codigo), decisões do FO-10 (06/11/2026).
-- O cliente de um parceiro SaaS chega pelo link do parceiro, responde um cadastro de qualificação e:
--   no ICP (mais de 3 vendedores, configurável): recebe a agenda para a reunião de diagnóstico;
--   fora do ICP: responde o autodiagnóstico (Matriz 5x5), vê o resultado na hora e só então recebe o link do Wise Hub.
-- Migração aditiva: nada das anteriores é alterado.

-- ---------------------------------------------------------------------------
-- 1. Logo do parceiro, exibido no topo da página do cliente (bucket público "logos")
-- ---------------------------------------------------------------------------
alter table public.parceiros add column if not exists logo_caminho text;

insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
create policy st_logo_ler on storage.objects for select using (bucket_id = 'logos');
create policy st_logo_enviar on storage.objects for insert to authenticated with check (
  bucket_id = 'logos' and (public.is_parcerias() or split_part(name, '/', 1) = public.parceiro_atual()::text));
create policy st_logo_trocar on storage.objects for update to authenticated using (
  bucket_id = 'logos' and (public.is_parcerias() or split_part(name, '/', 1) = public.parceiro_atual()::text));
create policy st_logo_apagar on storage.objects for delete to authenticated using (
  bucket_id = 'logos' and (public.is_parcerias() or split_part(name, '/', 1) = public.parceiro_atual()::text));

-- O próprio parceiro (ou o time de parcerias) grava o caminho do logo; o arquivo fica na pasta do parceiro.
create or replace function public.definir_logo_parceiro(p_parceiro uuid, p_caminho text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_parcerias() or p_parceiro = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if p_caminho is not null and split_part(p_caminho, '/', 1) <> p_parceiro::text then
    raise exception 'O logo precisa estar na pasta do parceiro.' using errcode = 'P0001';
  end if;
  update public.parceiros set logo_caminho = nullif(btrim(p_caminho), '') where id = p_parceiro;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Link da página do cliente: um por parceiro, separado do link de indicação (/i/) (FO-10, link)
-- ---------------------------------------------------------------------------
create table public.links_cliente (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null unique references public.parceiros(id) on delete cascade,
  codigo text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.links_cliente enable row level security;
create policy lc_ler on public.links_cliente for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy lc_gerir on public.links_cliente for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Devolve o código do link do parceiro, criando na primeira vez. Só para parceiro com contrato (aceite ou assinatura).
create or replace function public.garantir_link_cliente(p_parceiro uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not (public.is_parcerias() or p_parceiro = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if not public.parceiro_assinado(p_parceiro) then
    raise exception 'O link é exclusivo de parceiros com contrato.' using errcode = 'P0001';
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
-- 3. Configuração da página (uma linha). Pixel do Meta e GA4 vêm da config_landing (mesma administração).
-- ---------------------------------------------------------------------------
create or replace function public.faixa_faturamento_ordem(p text) returns int
language sql immutable as $$
  select case p when 'ate_100k' then 1 when '100k_250k' then 2 when '250k_500k' then 3 when '500k_1m' then 4
                when '1m_5m' then 5 when 'acima_5m' then 6 end
$$;

create table public.config_landing_cliente (
  id int primary key default 1 check (id = 1),
  publicada boolean not null default true,
  video_url text,
  agenda_url text check (agenda_url is null or agenda_url ~ '^https://'),
  hub_url text not null default 'https://www.wisemakershub.com/auth' check (hub_url ~ '^https://'),
  icp_min_vendedores int not null default 4 check (icp_min_vendedores between 1 and 1000),
  icp_faturamento_min text check (icp_faturamento_min is null or public.faixa_faturamento_ordem(icp_faturamento_min) is not null),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.perfis(id)
);
create trigger t_upd before update on public.config_landing_cliente for each row execute function public.set_updated_at();
alter table public.config_landing_cliente enable row level security;
create policy clc_ler on public.config_landing_cliente for select to authenticated using (public.is_parcerias());
create policy clc_admin on public.config_landing_cliente for update to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.config_landing_cliente (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Cadastros feitos pela página do cliente
-- ---------------------------------------------------------------------------
create table public.cadastros_cliente (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  link_id uuid references public.links_cliente(id) on delete set null,
  nome text not null,
  email text not null,
  whatsapp text not null,
  empresa text not null,
  cnpj text not null,
  cargo text not null,
  faturamento_faixa text not null check (public.faixa_faturamento_ordem(faturamento_faixa) is not null),
  vendedores int not null check (vendedores between 0 and 100000),
  segmento text not null,
  desafio text not null,
  autoriza_parceiro boolean not null default false,
  privacidade_versao text not null,
  icp boolean not null,
  caminho text not null check (caminho in ('agenda', 'autodiagnostico')),
  status text not null default 'cadastrado'
    check (status in ('cadastrado', 'agenda_liberada', 'reuniao_agendada', 'reuniao_feita', 'diagnostico_feito', 'descartado')),
  chave text not null,
  diagnostico_respostas jsonb,
  diagnostico_resultado jsonb,
  diagnostico_em timestamptz,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  referencia text
);
create index on public.cadastros_cliente (parceiro_id, created_at desc);
create index on public.cadastros_cliente (created_at desc);
alter table public.cadastros_cliente enable row level security;
create policy cc_ler on public.cadastros_cliente for select to authenticated using (public.is_parcerias());
create policy cc_status on public.cadastros_cliente for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
-- A chave do autodiagnóstico nunca sai pela API, nem para o time interno: leitura só das demais colunas
revoke select on public.cadastros_cliente from anon, authenticated;
grant select (id, created_at, parceiro_id, link_id, nome, email, whatsapp, empresa, cnpj, cargo, faturamento_faixa, vendedores,
  segmento, desafio, autoriza_parceiro, privacidade_versao, icp, caminho, status, diagnostico_respostas, diagnostico_resultado,
  diagnostico_em, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referencia) on public.cadastros_cliente to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Cadastro: valida, decide o caminho pelo ICP e avisa o parceiro e o responsável. Só a Edge Function chama.
-- ---------------------------------------------------------------------------
create or replace function public.cadastrar_cliente_parceiro(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing_cliente;
  v_priv text;
  v_link public.links_cliente;
  v_parc public.parceiros;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_vend int;
  v_faixa text := p->>'faturamento_faixa';
  v_icp boolean;
  v_id uuid;
  v_chave text := public.gerar_token_rfp();
begin
  select * into v_cfg from public.config_landing_cliente where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then raise exception 'A página está fechada no momento.' using errcode = 'P0001'; end if;
  select * into v_link from public.links_cliente where codigo = lower(btrim(p->>'codigo')) and ativo;
  if v_link.id is null then raise exception 'Link inválido.' using errcode = 'P0001'; end if;
  select * into v_parc from public.parceiros where id = v_link.parceiro_id;
  if not public.parceiro_assinado(v_parc.id) or v_parc.data_encerramento is not null then
    raise exception 'Link inválido.' using errcode = 'P0001';
  end if;

  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = ''
     or coalesce(btrim(p->>'cargo'), '') = '' or coalesce(btrim(p->>'segmento'), '') = '' or coalesce(btrim(p->>'desafio'), '') = '' then
    raise exception 'Preencha todos os campos.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.' using errcode = 'P0001'; end if;
  if length(v_cnpj) <> 14 then raise exception 'CNPJ inválido.' using errcode = 'P0001'; end if;
  if public.faixa_faturamento_ordem(v_faixa) is null then raise exception 'Escolha a faixa de faturamento.' using errcode = 'P0001'; end if;
  if coalesce(p->>'vendedores', '') !~ '^\d{1,6}$' then raise exception 'Informe quantas pessoas vendem na empresa.' using errcode = 'P0001'; end if;
  v_vend := (p->>'vendedores')::int;
  if coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar a política de privacidade.' using errcode = 'P0001';
  end if;

  v_icp := v_vend >= v_cfg.icp_min_vendedores
           and (v_cfg.icp_faturamento_min is null or public.faixa_faturamento_ordem(v_faixa) >= public.faixa_faturamento_ordem(v_cfg.icp_faturamento_min));
  select privacidade_versao into v_priv from public.config_landing where id = 1;

  insert into public.cadastros_cliente (parceiro_id, link_id, nome, email, whatsapp, empresa, cnpj, cargo, faturamento_faixa, vendedores,
    segmento, desafio, autoriza_parceiro, privacidade_versao, icp, caminho, status, chave,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, referencia)
  values (v_parc.id, v_link.id, btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, btrim(p->>'cargo'),
    v_faixa, v_vend, btrim(p->>'segmento'), btrim(p->>'desafio'), coalesce((p->>'autoriza_parceiro')::boolean, false),
    coalesce(v_priv, '2026-11-06'), v_icp, case when v_icp then 'agenda' else 'autodiagnostico' end,
    case when v_icp then 'agenda_liberada' else 'cadastrado' end, v_chave,
    nullif(p->>'utm_source', ''), nullif(p->>'utm_medium', ''), nullif(p->>'utm_campaign', ''), nullif(p->>'utm_content', ''),
    nullif(p->>'utm_term', ''), nullif(p->>'referencia', ''))
  returning id into v_id;

  perform public.notificar_parceiro(v_parc.id, 'cliente_link', 'Um cliente entrou pelo seu link',
    format('%s se cadastrou na página de consultoria comercial.', btrim(p->>'empresa')), '/parceiro/indicar');
  perform public.notificar_responsavel(v_parc.id, 'cliente_link',
    case when v_icp then 'Cliente no ICP pelo link de parceiro' else 'Cliente pelo link de parceiro' end,
    format('%s (%s vendedores) chegou pelo link de %s.', btrim(p->>'empresa'), v_vend, v_parc.nome_fantasia), '/app/configuracoes?aba=landing-cliente');

  return jsonb_build_object('id', v_id, 'chave', v_chave, 'icp', v_icp,
    'agenda_url', case when v_icp then v_cfg.agenda_url end, 'parceiro', v_parc.nome_fantasia);
end $$;

-- ---------------------------------------------------------------------------
-- 6. Autodiagnóstico pela Matriz 5x5 (cinco pilares x cinco critérios, notas de 1 a 5).
--    O banco entrega o resultado pronto: média e percentual por pilar e por critério, geral, nível e pilar mais frágil.
-- ---------------------------------------------------------------------------
create or replace function public.resultado_matriz_5x5(p jsonb) returns jsonb
language plpgsql immutable as $$
declare
  pilares text[] := array['identidade', 'demanda', 'conversao', 'expansao', 'governanca'];
  criterios text[] := array['estrategia', 'processo', 'dados', 'tecnologia', 'pessoas'];
  pil text; cr text; v int; soma numeric; geral numeric := 0;
  res_p jsonb := '[]'; res_c jsonb := '[]';
  menor numeric := 99; fraco text;
  nivel text;
  pct numeric;
begin
  foreach pil in array pilares loop
    soma := 0;
    foreach cr in array criterios loop
      v := (p->>(pil || '.' || cr))::int;
      if v is null or v < 1 or v > 5 then raise exception 'Responda todas as perguntas com uma nota de 1 a 5.' using errcode = 'P0001'; end if;
      soma := soma + v;
    end loop;
    geral := geral + soma;
    pct := round((soma / 5.0 - 1) / 4 * 100);
    res_p := res_p || jsonb_build_object('chave', pil, 'media', round(soma / 5.0, 1), 'percentual', pct);
    if soma < menor then menor := soma; fraco := pil; end if;
  end loop;
  foreach cr in array criterios loop
    soma := 0;
    foreach pil in array pilares loop soma := soma + (p->>(pil || '.' || cr))::int; end loop;
    res_c := res_c || jsonb_build_object('chave', cr, 'media', round(soma / 5.0, 1), 'percentual', round((soma / 5.0 - 1) / 4 * 100));
  end loop;
  geral := geral / 25.0;
  nivel := case when geral < 2 then 'inicial' when geral < 3 then 'em_estruturacao' when geral < 4 then 'estruturado'
                when geral < 4.6 then 'gerenciado' else 'referencia' end;
  return jsonb_build_object('pilares', res_p, 'criterios', res_c, 'media', round(geral, 1),
    'percentual', round((geral - 1) / 4 * 100), 'nivel', nivel, 'pilar_mais_fragil', fraco);
end $$;

create or replace function public.registrar_diagnostico_cliente(p_id uuid, p_chave text, p_respostas jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c public.cadastros_cliente;
  v_res jsonb;
  v_hub text;
begin
  select * into c from public.cadastros_cliente where id = p_id;
  if c.id is null or c.chave is distinct from p_chave then raise exception 'Cadastro não encontrado.' using errcode = 'P0001'; end if;
  v_res := public.resultado_matriz_5x5(p_respostas);
  update public.cadastros_cliente
     set diagnostico_respostas = p_respostas, diagnostico_resultado = v_res, diagnostico_em = now(),
         status = case when status in ('cadastrado', 'agenda_liberada') then 'diagnostico_feito' else status end
   where id = p_id;
  if c.diagnostico_em is null then
    perform public.notificar_parceiro(c.parceiro_id, 'cliente_link', 'Um cliente fez o diagnóstico',
      format('%s concluiu o autodiagnóstico comercial.', c.empresa), '/parceiro/indicar');
  end if;
  select hub_url into v_hub from public.config_landing_cliente where id = 1;
  return v_res || jsonb_build_object('hub_url', v_hub);
end $$;

-- ---------------------------------------------------------------------------
-- 7. O que o parceiro vê: empresa, data e andamento; o resultado só com a autorização do cliente (FO-10, dados).
-- ---------------------------------------------------------------------------
create or replace function public.clientes_do_link(p_parceiro uuid default null)
returns table (id uuid, created_at timestamptz, empresa text, status text, resultado jsonb)
language plpgsql stable security definer set search_path = public as $$
declare v uuid := coalesce(p_parceiro, public.parceiro_atual());
begin
  if v is null or not (public.is_parcerias() or v = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  return query
    select c.id, c.created_at, c.empresa, c.status, case when c.autoriza_parceiro then c.diagnostico_resultado end
      from public.cadastros_cliente c where c.parceiro_id = v order by c.created_at desc limit 500;
end $$;

revoke execute on function public.cadastrar_cliente_parceiro(jsonb) from public, anon, authenticated;
revoke execute on function public.registrar_diagnostico_cliente(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.definir_logo_parceiro(uuid, text) from public, anon;
revoke execute on function public.garantir_link_cliente(uuid) from public, anon;
revoke execute on function public.clientes_do_link(uuid) from public, anon;
grant execute on function public.cadastrar_cliente_parceiro(jsonb) to service_role;
grant execute on function public.registrar_diagnostico_cliente(uuid, text, jsonb) to service_role;
