-- Portal Wise Partners 2.0: indicações com link exclusivo, nota de qualidade, proteção de 180 dias,
-- SLA e checagens do cliente aos 6 e 12 meses (História 6, Apêndice E)

alter table public.indicacoes
  add column icp_confirmado boolean,
  add column icp_confirmado_por uuid references public.perfis(id),
  add column icp_confirmado_em timestamptz,
  add column necessidade text,
  add column nota_qualidade int,
  add column qualificada boolean not null default false,
  add column prazo_meses int check (prazo_meses > 0),        -- Wise Makers: prazo do contrato de consultoria
  add column valor_total numeric(14,2),                       -- Tríade e Swallow: valor total da venda
  add column contrapartida_id uuid references public.contrapartidas(id) on delete set null,
  add column acao_wise_id uuid,                               -- FK na 0014
  add column link_id uuid,
  add column protecao_ate date,
  add column protecao_expirada boolean not null default false,
  add column sla jsonb not null default '{}',
  add column primeiro_contato_em timestamptz,
  add column retorno_parceiro_em timestamptz,
  add column parceiro_atualizou_em timestamptz;

alter table public.indicacoes drop constraint indicacoes_origem_check;
alter table public.indicacoes add constraint indicacoes_origem_check
  check (origem in ('grupo_whatsapp', 'wise_hub', 'evento', 'rfp', 'portal_parceiro', 'reuniao', 'link_parceiro', 'cruzamento', 'acao_conjunta', 'outra'));

-- ---------------------------------------------------------------------------
-- Links exclusivos de indicação (FR-128)
-- ---------------------------------------------------------------------------
create table public.links_indicacao (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  token text not null unique,
  empresas text[] not null default '{wise}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz,
  envios int not null default 0
);
create unique index link_ativo_por_parceiro on public.links_indicacao (parceiro_id) where ativo;
alter table public.indicacoes add constraint indicacoes_link_fk foreign key (link_id) references public.links_indicacao(id) on delete set null;

-- Limite de envios por origem (só a função pública escreve; ninguém lê pela API)
create table public.envios_link_limite (
  chave text not null,
  janela timestamptz not null,
  contagem int not null default 0,
  primary key (chave, janela)
);

create or replace function public.garantir_link_indicacao(p_parceiro uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from public.links_indicacao where parceiro_id = p_parceiro and ativo;
  if v is null then
    insert into public.links_indicacao (parceiro_id, token) values (p_parceiro, public.gerar_token_rfp()) returning id into v;
  end if;
  return v;
end $$;

-- Regenera o link (o anterior deixa de funcionar) e define as empresas atendidas
create or replace function public.regenerar_link_indicacao(p_parceiro uuid, p_empresas text[] default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ant public.links_indicacao;
  v_token text;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if not public.parceiro_assinado(p_parceiro) then raise exception 'O link é exclusivo de parceiros com contrato assinado.' using errcode = 'P0001'; end if;
  select * into v_ant from public.links_indicacao where parceiro_id = p_parceiro and ativo;
  update public.links_indicacao set ativo = false, revogado_em = now() where parceiro_id = p_parceiro and ativo;
  v_token := public.gerar_token_rfp();
  insert into public.links_indicacao (parceiro_id, token, empresas)
  values (p_parceiro, v_token, coalesce(p_empresas, v_ant.empresas, '{wise}'));
  return v_token;
end $$;

create or replace function public.revogar_link_indicacao(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.links_indicacao set ativo = false, revogado_em = now() where parceiro_id = p_parceiro and ativo;
end $$;

create trigger t_hist after insert or update on public.links_indicacao
for each row execute function public.trg_historico('ativo', 'empresas', 'revogado_em');

-- ---------------------------------------------------------------------------
-- Checagens do cliente indicado aos 6 e 12 meses (FR-135)
-- ---------------------------------------------------------------------------
create table public.checagens_cliente (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null references public.indicacoes(id) on delete cascade,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  marco text not null check (marco in ('6m', '12m')),
  prevista_para date not null,
  cliente_ativo boolean,
  satisfacao int check (satisfacao between 0 and 10),
  observacao text,
  registrada_por uuid references public.perfis(id),
  registrada_em timestamptz,
  unique (indicacao_id, marco)
);

create or replace function public.registrar_checagem(p_id uuid, p_ativo boolean, p_satisfacao int, p_observacao text default null) returns void
language plpgsql security definer set search_path = public as $$
declare c public.checagens_cliente; i public.indicacoes;
begin
  select * into c from public.checagens_cliente where id = p_id;
  select * into i from public.indicacoes where id = c.indicacao_id;
  if c.id is null or not (public.is_parcerias() or i.responsavel_id = auth.uid()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  update public.checagens_cliente
     set cliente_ativo = p_ativo, satisfacao = p_satisfacao, observacao = p_observacao, registrada_por = auth.uid(), registrada_em = now()
   where id = p_id;
  -- Checagem conta como interação com o cliente (proteção da indicação)
  update public.clientes set ultima_interacao = public.hoje() where id = i.cliente_id;
  update public.indicacoes set ultima_atualizacao = now() where id = i.id;
end $$;

-- ---------------------------------------------------------------------------
-- Proteção, SLA e nota de qualidade
-- ---------------------------------------------------------------------------
-- Última interação registrada com o cliente, em qualquer empresa do grupo (Apêndice E)
create or replace function public.ultima_interacao_cliente(p_cliente uuid) returns date
language sql stable security definer set search_path = public as $$
  select greatest(
    (select ultima_interacao from public.clientes where id = p_cliente),
    (select max((i.ultima_atualizacao at time zone 'America/Sao_Paulo')::date) from public.indicacoes i where i.cliente_id = p_cliente),
    (select max(i.data) from public.indicacoes i where i.cliente_id = p_cliente),
    (select max((c.registrada_em at time zone 'America/Sao_Paulo')::date) from public.checagens_cliente c
       join public.indicacoes i on i.id = c.indicacao_id where i.cliente_id = p_cliente))
$$;

create or replace function public.calcular_sla(i public.indicacoes) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if i.sentido = 'parceiro_para_grupo' then
    return jsonb_build_object(
      'validacao_ate', public.add_dias_uteis(i.data, public.config_int('sla_validacao_dias_uteis', 2)),
      'retorno_parceiro_ate', public.add_dias_uteis(i.data, public.config_int('sla_retorno_parceiro_dias_uteis', 5)),
      'atualizacao_dias', public.config_int('sla_atualizacao_dias', 15));
  end if;
  return jsonb_build_object(
    'primeiro_contato_ate', public.add_dias_uteis(i.data, public.config_int('sla_parceiro_contato_dias_uteis', 2)),
    'atualizacao_parceiro_ate', public.add_dias_uteis(i.data, public.config_int('sla_parceiro_atualizacao_dias_uteis', 5)),
    'atualizacao_dias', public.config_int('sla_atualizacao_dias', 15));
end $$;

-- Prazos vencidos de uma indicação (para alertas, painel e portal)
create or replace function public.sla_vencidos(i public.indicacoes) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  r text[] := '{}';
  v_hoje date := public.hoje();
begin
  if i.etapa in ('fechada', 'perdida') then return r; end if;
  if i.sentido = 'parceiro_para_grupo' then
    if (i.icp_confirmado_em is null or i.primeiro_contato_em is null) and v_hoje > (i.sla->>'validacao_ate')::date then
      r := r || 'validacao'::text;
    end if;
    if i.retorno_parceiro_em is null and v_hoje > (i.sla->>'retorno_parceiro_ate')::date then
      r := r || 'retorno_parceiro'::text;
    end if;
    if i.ultima_atualizacao < now() - make_interval(days => coalesce((i.sla->>'atualizacao_dias')::int, 15)) then
      r := r || 'atualizacao'::text;
    end if;
  else
    if i.primeiro_contato_em is null and v_hoje > (i.sla->>'primeiro_contato_ate')::date then
      r := r || 'primeiro_contato_parceiro'::text;
    end if;
    if i.parceiro_atualizou_em is null and v_hoje > (i.sla->>'atualizacao_parceiro_ate')::date then
      r := r || 'atualizacao_parceiro'::text;
    end if;
    if coalesce(i.parceiro_atualizou_em, i.created_at) < now() - make_interval(days => coalesce((i.sla->>'atualizacao_dias')::int, 15)) then
      r := r || 'atualizacao'::text;
    end if;
  end if;
  return r;
end $$;

create or replace function public.trg_indicacao_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_ok int;
  cl public.clientes;
  v_icp int := 0;
  v_comp int := 0;
  v_res int := 0;
begin
  select count(*), count(*) filter (where (new.aderencia_icp ->> c.chave)::boolean)
    into v_total, v_ok
  from public.criterios_icp c where c.ativo;
  if new.aderencia_icp is null or new.aderencia_icp = '{}'::jsonb then
    new.aderente_icp := null;
  else
    new.aderente_icp := v_total > 0 and v_ok = v_total;
  end if;
  if new.etapa = 'reuniao' and new.data_reuniao is null then new.data_reuniao := public.hoje(); end if;
  if new.etapa = 'fechada' and new.data_fechamento is null then new.data_fechamento := public.hoje(); end if;
  if tg_op = 'UPDATE' and (new.etapa, new.valor_base, new.data_reuniao, new.data_fechamento, new.data_compensacao, new.observacoes,
                           new.prazo_meses, new.valor_total, new.icp_confirmado, new.primeiro_contato_em)
     is distinct from (old.etapa, old.valor_base, old.data_reuniao, old.data_fechamento, old.data_compensacao, old.observacoes,
                       old.prazo_meses, old.valor_total, old.icp_confirmado, old.primeiro_contato_em) then
    new.ultima_atualizacao := now();
    -- Mudança de etapa informada pela Wise conta como retorno ao parceiro
    if new.sentido = 'parceiro_para_grupo' and new.etapa is distinct from old.etapa and new.retorno_parceiro_em is null then
      new.retorno_parceiro_em := now();
    end if;
  end if;
  if new.responsavel_id is null then
    select responsavel_id into new.responsavel_id from public.parceiros where id = new.parceiro_id;
  end if;
  if tg_op = 'INSERT' or new.sla = '{}'::jsonb then
    new.sla := public.calcular_sla(new);
  end if;
  -- Proteção de 180 dias desde a última interação
  if not new.protecao_expirada then
    new.protecao_ate := (greatest(new.data, (new.ultima_atualizacao at time zone 'America/Sao_Paulo')::date))
                        + public.config_int('protecao_indicacao_dias', 180);
  end if;

  -- Nota de qualidade (0 a 100) e indicação qualificada (FR-131)
  select * into cl from public.clientes where id = new.cliente_id;
  v_icp := least(50, 10 * coalesce(v_ok, 0));
  v_comp := (case when cl.cnpj_digitos is not null then 7 else 0 end)
          + (case when cl.consentimento and (cl.contato_nome is not null or cl.email is not null or cl.telefone is not null) then 7 else 0 end)
          + (case when coalesce(btrim(new.necessidade), '') <> '' then 6 else 0 end);
  v_res := (case when new.data_reuniao is not null then 20 else 0 end)
         + (case when new.etapa in ('proposta', 'fechada') then 5 else 0 end)
         + (case when new.etapa = 'fechada' then 5 else 0 end);
  new.nota_qualidade := v_icp + v_comp + v_res;
  new.qualificada := coalesce(new.icp_confirmado, false) and cl.cnpj_digitos is not null and coalesce(btrim(new.necessidade), '') <> '';
  return new;
end $$;

create or replace function public.trg_indicacao_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_icp boolean;
  pl public.planos_onboarding;
begin
  perform public.sincronizar_comissoes(new.id);
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    update public.parceiros
       set ultimo_contato = greatest(coalesce(ultimo_contato, '1900-01-01'), public.hoje())
     where id = new.parceiro_id;
    update public.clientes set ultima_interacao = public.hoje() where id = new.cliente_id;
  end if;
  if tg_op = 'INSERT' or new.data_reuniao is distinct from old.data_reuniao then
    perform public.atualizar_estrategico_sugerido(new.parceiro_id);
  end if;

  if new.sentido = 'parceiro_para_grupo' then
    -- Primeira indicação do onboarding
    select * into pl from public.planos_onboarding where parceiro_id = new.parceiro_id;
    if tg_op = 'INSERT' and pl.parceiro_id is not null and pl.primeira_indicacao_em is null then
      update public.planos_onboarding set primeira_indicacao_em = new.data, dias_ate_primeira_indicacao = new.data - inicio
       where parceiro_id = new.parceiro_id;
    end if;
    -- Pontos do ranking (únicos por evento)
    if new.qualificada then
      perform public.lancar_pontos(new.parceiro_id, 'indicacao_qualificada', new.id, public.hoje());
      perform public.cancelar_desligamento(new.parceiro_id, 'Indicação qualificada registrada');
    end if;
    if new.data_reuniao is not null then
      perform public.lancar_pontos(new.parceiro_id, 'reuniao', new.id, new.data_reuniao);
    end if;
    v_icp := coalesce(new.icp_confirmado, new.aderente_icp, false);
    if new.etapa = 'fechada' and v_icp then
      perform public.lancar_pontos(new.parceiro_id, 'cliente_icp', new.id, coalesce(new.data_fechamento, public.hoje()));
    end if;
    -- Ativação no onboarding
    if new.icp_confirmado and new.data_reuniao is not null and new.data_reuniao <= public.hoje() then
      perform public.verificar_ativacao(new.parceiro_id);
    end if;
    perform public.verificar_subida_nivel(new.parceiro_id);
  end if;

  -- Indicação fechada: checagens aos 6 e 12 meses
  if new.etapa = 'fechada' and new.data_fechamento is not null then
    insert into public.checagens_cliente (indicacao_id, parceiro_id, marco, prevista_para) values
      (new.id, new.parceiro_id, '6m', (new.data_fechamento + interval '6 months')::date),
      (new.id, new.parceiro_id, '12m', (new.data_fechamento + interval '12 months')::date)
    on conflict (indicacao_id, marco) do nothing;
  end if;
  return null;
end $$;

create trigger t_hist2 after update on public.indicacoes
for each row execute function public.trg_historico('icp_confirmado', 'qualificada', 'protecao_expirada', 'primeiro_contato_em', 'retorno_parceiro_em', 'prazo_meses', 'valor_total');

-- ---------------------------------------------------------------------------
-- Registro de indicação: casca que confere o papel e núcleo com as regras (FR-133)
-- ---------------------------------------------------------------------------
create or replace function public._registrar_indicacao_core(p jsonb, p_papel text, p_parceiro uuid, p_origem text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sentido text := coalesce(p->>'sentido', 'parceiro_para_grupo');
  v_empresa uuid := (p->>'empresa_grupo_id')::uuid;
  v_cliente public.clientes;
  v_cnpj text := public.somente_digitos(p->>'cliente_cnpj');
  v_razao text := btrim(coalesce(p->>'cliente_razao_social', ''));
  v_pessoal boolean;
  v_consent boolean := coalesce((p->>'consentimento')::boolean, false);
  v_existente record;
  v_ultima date;
  v_dias int := public.config_int('protecao_indicacao_dias', 180);
  v_id uuid;
  v_nome_parceiro text;
begin
  if p_parceiro is null or v_empresa is null or v_razao = '' then
    raise exception 'Informe parceiro, empresa do grupo e cliente.' using errcode = 'P0001';
  end if;
  if v_sentido not in ('parceiro_para_grupo', 'grupo_para_parceiro') then
    raise exception 'Sentido inválido.' using errcode = 'P0001';
  end if;

  v_pessoal := coalesce(btrim(p->>'contato_nome'), '') <> '' or coalesce(btrim(p->>'contato_email'), '') <> ''
               or coalesce(btrim(p->>'contato_telefone'), '') <> '';
  if v_pessoal and not v_consent then
    raise exception 'Declare o consentimento para compartilhar os dados pessoais do contato do cliente.' using errcode = 'P0001';
  end if;

  select * into v_cliente from public.clientes c
   where (v_cnpj is not null and c.cnpj_digitos = v_cnpj)
      or (c.razao_normalizada = public.normalizar_texto(v_razao))
   order by (v_cnpj is not null and c.cnpj_digitos = v_cnpj) desc, c.created_at
   limit 1;

  -- Proteção de 180 dias desde a última interação: dentro do prazo vale o primeiro registro, sem exceção
  if v_cliente.id is not null and v_sentido = 'parceiro_para_grupo' then
    select i.*, pa.nome_fantasia into v_existente
      from public.indicacoes i join public.parceiros pa on pa.id = i.parceiro_id
     where i.cliente_id = v_cliente.id and i.sentido = 'parceiro_para_grupo' and i.empresa_grupo_id = v_empresa
       and not i.protecao_expirada
     order by i.created_at limit 1;
    if v_existente.id is not null then
      v_ultima := public.ultima_interacao_cliente(v_cliente.id);
      if v_ultima > public.hoje() - v_dias then
        if p_papel in ('parceiro', 'sistema') then
          raise exception 'Este cliente já foi indicado anteriormente. Vale o primeiro registro.' using errcode = 'P0001', hint = 'duplicado';
        end if;
        raise exception 'Cliente já indicado por % em %. Vale o primeiro registro (proteção até %).', v_existente.nome_fantasia,
          to_char(v_existente.data, 'DD/MM/YYYY'), to_char(v_ultima + v_dias, 'DD/MM/YYYY')
          using errcode = 'P0001', hint = 'duplicado';
      end if;
      -- Proteção expirada: a anterior perde a proteção e o primeiro parceiro é avisado
      update public.indicacoes set protecao_expirada = true where cliente_id = v_cliente.id
         and sentido = 'parceiro_para_grupo' and empresa_grupo_id = v_empresa and not protecao_expirada;
      if v_existente.parceiro_id <> p_parceiro then
        perform public.notificar_parceiro(v_existente.parceiro_id, 'protecao_expirada', 'Proteção de indicação expirada',
          format('A proteção da indicação de %s expirou depois de %s dias sem interação e o cliente foi indicado de novo.', v_razao, v_dias),
          '/parceiro/indicacoes');
        perform public.notificar_responsavel(v_existente.parceiro_id, 'protecao_expirada', 'Proteção de indicação expirada',
          format('%s: a proteção da indicação de %s expirou e o cliente foi indicado por outro parceiro.', v_existente.nome_fantasia, v_razao),
          '/app/indicacoes?id=' || v_existente.id);
      end if;
    end if;
  end if;

  if v_cliente.id is null then
    insert into public.clientes (razao_social, cnpj, contato_nome, email, telefone, consentimento, consentimento_por, consentimento_em)
    values (v_razao, nullif(p->>'cliente_cnpj', ''), nullif(btrim(p->>'contato_nome'), ''), nullif(btrim(p->>'contato_email'), ''),
            nullif(btrim(p->>'contato_telefone'), ''), v_consent, case when v_consent then auth.uid() end,
            case when v_consent then now() end)
    returning * into v_cliente;
  else
    if v_cnpj is not null and v_cliente.cnpj_digitos is null then
      update public.clientes set cnpj = p->>'cliente_cnpj' where id = v_cliente.id;
    end if;
    if v_pessoal then
      update public.clientes
         set contato_nome = coalesce(nullif(btrim(p->>'contato_nome'), ''), contato_nome),
             email = coalesce(nullif(btrim(p->>'contato_email'), ''), email),
             telefone = coalesce(nullif(btrim(p->>'contato_telefone'), ''), telefone),
             consentimento = true, consentimento_por = auth.uid(), consentimento_em = now()
       where id = v_cliente.id;
    end if;
  end if;

  insert into public.indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, origem_detalhe, data,
    responsavel_id, aderencia_icp, cliente_existente, observacoes, pedido_rfp_id, necessidade, prazo_meses, valor_total,
    contrapartida_id, acao_wise_id, link_id)
  values (v_sentido, p_parceiro, v_empresa, v_cliente.id, p_origem, nullif(p->>'origem_detalhe', ''),
    coalesce((p->>'data')::date, public.hoje()), nullif(p->>'responsavel_id', '')::uuid,
    coalesce(p->'aderencia_icp', '{}'::jsonb), coalesce((p->>'cliente_existente')::boolean, false),
    nullif(p->>'observacoes', ''), nullif(p->>'pedido_rfp_id', '')::uuid, nullif(btrim(p->>'necessidade'), ''),
    nullif(p->>'prazo_meses', '')::int, nullif(p->>'valor_total', '')::numeric,
    nullif(p->>'contrapartida_id', '')::uuid, nullif(p->>'acao_wise_id', '')::uuid, nullif(p->>'link_id', '')::uuid)
  returning id into v_id;

  if p_papel in ('parceiro', 'sistema') then
    select nome_fantasia into v_nome_parceiro from public.parceiros where id = p_parceiro;
    perform public.notificar_responsavel(p_parceiro, 'indicacao_nova',
      case when p_origem = 'link_parceiro' then 'Nova indicação pelo link do parceiro' else 'Nova indicação pelo portal' end,
      format('%s indicou %s.', v_nome_parceiro, v_razao), '/app/indicacoes?id=' || v_id);
  end if;
  return v_id;
end $$;

revoke execute on function public._registrar_indicacao_core(jsonb, text, uuid, text) from public, anon, authenticated;

create or replace function public.registrar_indicacao(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_papel text := public.papel_atual();
  v_origem text := coalesce(p->>'origem', 'outra');
begin
  if v_papel is null or v_papel = 'financeiro' then
    raise exception 'Sem permissão para registrar indicações.' using errcode = '42501';
  end if;
  if v_papel = 'parceiro' then
    return public._registrar_indicacao_core(p - 'sentido', 'parceiro', public.parceiro_atual(), 'portal_parceiro');
  end if;
  if v_origem in ('link_parceiro', 'portal_parceiro') then v_origem := 'outra'; end if;
  return public._registrar_indicacao_core(p, v_papel, (p->>'parceiro_id')::uuid, v_origem);
end $$;

-- Validação da Wise: confirma ou corrige a aderência ao ICP (FR-132) e registra o primeiro contato
create or replace function public.validar_indicacao(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare i public.indicacoes;
begin
  select * into i from public.indicacoes where id = p_id;
  if i.id is null or not (public.is_parcerias() or i.responsavel_id = auth.uid()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  update public.indicacoes
     set aderencia_icp = coalesce(p->'aderencia_icp', aderencia_icp),
         icp_confirmado = coalesce((p->>'icp_confirmado')::boolean, icp_confirmado),
         icp_confirmado_por = case when p ? 'icp_confirmado' then auth.uid() else icp_confirmado_por end,
         icp_confirmado_em = case when p ? 'icp_confirmado' then now() else icp_confirmado_em end,
         necessidade = coalesce(nullif(btrim(p->>'necessidade'), ''), necessidade),
         primeiro_contato_em = case when (p->>'primeiro_contato')::boolean then coalesce(primeiro_contato_em, now()) else primeiro_contato_em end,
         retorno_parceiro_em = case when (p->>'retorno_parceiro')::boolean then coalesce(retorno_parceiro_em, now()) else retorno_parceiro_em end
   where id = p_id;
end $$;

-- Parceiro: resultado de indicação recebida fica pendente da Wise; primeiro contato vale na hora (SLA)
create or replace function public.parceiro_atualizar_indicacao(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  i public.indicacoes;
  v_nome text;
begin
  select * into i from public.indicacoes where id = p_id;
  if i.id is null or i.parceiro_id is distinct from public.parceiro_atual() or i.sentido <> 'grupo_para_parceiro' then
    raise exception 'Indicação não encontrada.' using errcode = '42501';
  end if;
  if coalesce(p->>'etapa', 'nova') not in ('nova', 'em_contato', 'reuniao', 'proposta', 'fechada', 'perdida') then
    raise exception 'Etapa inválida.' using errcode = 'P0001';
  end if;
  update public.indicacoes
     set atualizacao_pendente = jsonb_strip_nulls(jsonb_build_object(
           'etapa', p->>'etapa', 'valor_base', p->'valor_base', 'data_reuniao', p->>'data_reuniao',
           'observacao', p->>'observacao')),
         atualizacao_por = auth.uid(), atualizacao_em = now(), parceiro_atualizou_em = now(),
         primeiro_contato_em = case when (p->>'primeiro_contato')::boolean or coalesce(p->>'etapa', 'nova') <> 'nova'
                                    then coalesce(primeiro_contato_em, now()) else primeiro_contato_em end
   where id = p_id;
  select nome_fantasia into v_nome from public.parceiros where id = i.parceiro_id;
  perform public.notificar_responsavel(i.parceiro_id, 'indicacao_atualizada', 'Atualização de indicação para confirmar',
    format('%s atualizou o resultado de uma indicação recebida.', v_nome), '/app/indicacoes?id=' || p_id);
end $$;

-- ---------------------------------------------------------------------------
-- Página pública do link de indicação (só a Edge Function indicacao-publica chama)
-- ---------------------------------------------------------------------------
create or replace function public.link_indicacao_valido(p_token text) returns public.links_indicacao
language plpgsql stable security definer set search_path = public as $$
declare l public.links_indicacao;
begin
  select l2.* into l from public.links_indicacao l2
  join public.parceiros p on p.id = l2.parceiro_id
  where l2.token = p_token and l2.ativo and p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
    and not exists (select 1 from public.fluxos_desligamento f where f.parceiro_id = p.id and f.estado in ('avisado', 'encerrado'));
  return l;
end $$;

create or replace function public.link_indicacao_publico(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  l public.links_indicacao;
  v_nome text;
begin
  if p_token is null or length(p_token) < 30 then return jsonb_build_object('estado', 'indisponivel'); end if;
  l := public.link_indicacao_valido(p_token);
  if l.id is null then return jsonb_build_object('estado', 'indisponivel'); end if;
  select nome_fantasia into v_nome from public.parceiros where id = l.parceiro_id;
  return jsonb_build_object(
    'estado', 'ok',
    'parceiro', v_nome,
    'empresas', (select coalesce(jsonb_agg(jsonb_build_object('codigo', e.codigo, 'nome', e.nome, 'descricao', e.descricao_institucional) order by e.ordem), '[]')
                   from public.empresas_grupo e where e.codigo = any (l.empresas)),
    'criterios_icp', (select coalesce(jsonb_agg(jsonb_build_object('chave', c.chave, 'descricao', c.descricao) order by c.ordem), '[]')
                        from public.criterios_icp c where c.ativo));
end $$;

-- Envio do formulário: sempre devolve a mesma resposta neutra; nada é gravado nos casos recusados (FR-129, FR-130)
create or replace function public.indicacao_publica(p_token text, p_dados jsonb, p_origem_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l public.links_indicacao;
  v_neutro jsonb := jsonb_build_object('ok', true);
  v_janela timestamptz := date_trunc('hour', now());
  v_cont int;
  v_empresa text := coalesce(nullif(p_dados->>'empresa', ''), 'wise');
  v_empresa_id uuid;
  v_cnpj text := public.somente_digitos(p_dados->>'cliente_cnpj');
  v_id uuid;
  v_nome text;
begin
  if p_token is null or length(p_token) < 30 then return v_neutro; end if;
  l := public.link_indicacao_valido(p_token);
  if l.id is null then return v_neutro; end if;
  -- Campo oculto contra robôs
  if coalesce(p_dados->>'website', '') <> '' then return v_neutro; end if;
  -- Limite por origem
  insert into public.envios_link_limite (chave, janela, contagem)
  values (md5(coalesce(p_origem_hash, '') || l.token), v_janela, 1)
  on conflict (chave, janela) do update set contagem = public.envios_link_limite.contagem + 1
  returning contagem into v_cont;
  if v_cont > public.config_int('link_limite_hora', 10) then return v_neutro; end if;
  -- Consentimento do próprio titular e campos mínimos
  if not coalesce((p_dados->>'consentimento')::boolean, false) or coalesce(btrim(p_dados->>'cliente_razao_social'), '') = ''
     or coalesce(btrim(p_dados->>'contato_nome'), '') = '' then
    return v_neutro;
  end if;
  if not (v_empresa = any (l.empresas)) then v_empresa := 'wise'; end if;
  select id into v_empresa_id from public.empresas_grupo where codigo = v_empresa;
  -- Mesmo CNPJ pelo mesmo parceiro em 24 horas: descarta
  if v_cnpj is not null and exists (
    select 1 from public.indicacoes i join public.clientes c on c.id = i.cliente_id
    where i.parceiro_id = l.parceiro_id and c.cnpj_digitos = v_cnpj and i.created_at > now() - interval '24 hours') then
    return v_neutro;
  end if;
  begin
    v_id := public._registrar_indicacao_core(
      jsonb_build_object('sentido', 'parceiro_para_grupo', 'empresa_grupo_id', v_empresa_id,
        'cliente_razao_social', p_dados->>'cliente_razao_social', 'cliente_cnpj', p_dados->>'cliente_cnpj',
        'contato_nome', p_dados->>'contato_nome', 'contato_email', p_dados->>'contato_email',
        'contato_telefone', p_dados->>'contato_telefone', 'consentimento', true,
        'necessidade', left(p_dados->>'necessidade', 2000),
        'origem_detalhe', nullif(left(p_dados->>'contato_cargo', 120), ''),
        'aderencia_icp', coalesce(p_dados->'aderencia_icp', '{}'::jsonb), 'link_id', l.id),
      'sistema', l.parceiro_id, 'link_parceiro');
  exception when others then
    if sqlerrm like 'Este cliente já foi indicado%' then
      -- Tentativa duplicada: aviso ao responsável, sem atribuição
      select nome_fantasia into v_nome from public.parceiros where id = l.parceiro_id;
      perform public.notificar_responsavel(l.parceiro_id, 'indicacao_duplicada', 'Tentativa de indicação duplicada',
        format('O link de %s recebeu %s, que já está protegido por outro registro.', v_nome, p_dados->>'cliente_razao_social'),
        '/app/indicacoes');
      return v_neutro;
    end if;
    return v_neutro;
  end;
  update public.links_indicacao set envios = envios + 1 where id = l.id;
  perform public.notificar_parceiro(l.parceiro_id, 'indicacao_link_recebida', 'Indicação recebida pelo seu link',
    format('%s enviou uma indicação pelo link de vocês.', p_dados->>'cliente_razao_social'), '/parceiro/indicacoes');
  return v_neutro;
end $$;

revoke execute on function public.link_indicacao_publico(text) from public, anon, authenticated;
revoke execute on function public.indicacao_publica(text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.link_indicacao_valido(text) from public, anon, authenticated;
grant execute on function public.link_indicacao_publico(text) to service_role;
grant execute on function public.indicacao_publica(text, jsonb, text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t) from unnest(array['links_indicacao', 'envios_link_limite', 'checagens_cliente']) t;
revoke all on public.envios_link_limite from authenticated;

create policy link_ler on public.links_indicacao for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy link_gerir on public.links_indicacao for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy chk_ler on public.checagens_cliente for select to authenticated
  using (public.is_parcerias() or exists (select 1 from public.indicacoes i where i.id = indicacao_id and i.responsavel_id = auth.uid()));

do $$
declare f text;
begin
  foreach f in array array['regenerar_link_indicacao(uuid, text[])', 'revogar_link_indicacao(uuid)', 'registrar_checagem(uuid, boolean, int, text)',
    'validar_indicacao(uuid, jsonb)', 'registrar_encontro_onboarding(uuid, date, text)', 'concluir_modulo(uuid)', 'corrigir_teste(uuid, jsonb)',
    'publicar_trilha(uuid, boolean)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
