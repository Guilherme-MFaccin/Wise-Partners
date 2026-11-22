-- Hub de negócios: Catálogo de parceiros (FO-19, 22/11/2026). Primeira entrega, sem etapas de acompanhamento.
-- Quem oferece: parceiros Elite e empresas clientes do Grupo Tríade. Quem vê e usa as condições: Premium, Elite e clientes do grupo.
-- Níveis (resolve a CT-08): Premium = um cliente do parceiro, no perfil, fez o diagnóstico com a Wise;
-- Elite = um cliente trazido pelo parceiro contratou alguma empresa do Grupo Tríade. O portal sobe o nível sozinho (só sobe).
-- Uma empresa, dois papéis, o mesmo login: a empresa cliente do grupo é um registro em parceiros com tipo 'cliente'
-- (ou um parceiro marcado como cliente do grupo).

-- ---------------------------------------------------------------------------
-- 1. Empresas clientes do grupo
-- ---------------------------------------------------------------------------
alter table public.parceiros drop constraint if exists parceiros_tipo_parceria_check;
alter table public.parceiros add constraint parceiros_tipo_parceria_check check (tipo_parceria in ('comercial', 'institucional', 'cliente'));
alter table public.parceiros add column if not exists cliente_grupo boolean not null default false;
alter table public.parceiros add column if not exists empresa_grupo_cliente_id uuid references public.empresas_grupo(id);
alter table public.parceiros add column if not exists consultor_cliente_id uuid references public.perfis(id) on delete set null;

-- Cadastro da empresa cliente pelo time (CS da Tríade, consultores da Wise, gestão). Reaproveita a empresa se o CNPJ já existe.
create or replace function public.cadastrar_cliente_grupo(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_empresa uuid := nullif(p->>'empresa_grupo_id', '')::uuid;
begin
  if not public.is_interno_leitura() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if coalesce(btrim(p->>'nome'), '') = '' then raise exception 'Informe o nome da empresa.' using errcode = 'P0001'; end if;
  if length(coalesce(v_cnpj, '')) <> 14 then raise exception 'Informe um CNPJ válido.' using errcode = 'P0001'; end if;
  if v_empresa is null then raise exception 'Informe de qual empresa do grupo ela é cliente.' using errcode = 'P0001'; end if;
  select id into v_id from public.parceiros where public.somente_digitos(cnpj) = v_cnpj limit 1;
  if v_id is null then
    insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by, cliente_grupo, empresa_grupo_cliente_id, consultor_cliente_id)
    values (btrim(p->>'nome'), v_cnpj, nullif(btrim(p->>'site'), ''), 'cliente', 'cliente_grupo', 'qualificacao', auth.uid(), true, v_empresa,
            coalesce(nullif(p->>'consultor_id', '')::uuid, auth.uid()))
    returning id into v_id;
  else
    update public.parceiros set cliente_grupo = true, empresa_grupo_cliente_id = v_empresa,
           consultor_cliente_id = coalesce(nullif(p->>'consultor_id', '')::uuid, consultor_cliente_id, auth.uid())
     where id = v_id;
  end if;
  return v_id;
end $$;
revoke execute on function public.cadastrar_cliente_grupo(jsonb) from public, anon;
grant execute on function public.cadastrar_cliente_grupo(jsonb) to authenticated;

create or replace function public.encerrar_cliente_grupo(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_interno_leitura() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.parceiros set cliente_grupo = false where id = p_parceiro;
end $$;
revoke execute on function public.encerrar_cliente_grupo(uuid) from public, anon;
grant execute on function public.encerrar_cliente_grupo(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Quem vê e quem oferece
-- ---------------------------------------------------------------------------
create or replace function public.pode_ver_catalogo(p_parceiro uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.cliente_grupo or (p.tipo_parceria <> 'cliente' and p.data_assinatura is not null and p.nivel in ('A', 'B'))
                     from public.parceiros p where p.id = coalesce(p_parceiro, public.parceiro_atual())), false)
$$;
create or replace function public.pode_ofertar(p_parceiro uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.cliente_grupo or (p.tipo_parceria <> 'cliente' and p.data_assinatura is not null and p.nivel = 'A')
                     from public.parceiros p where p.id = coalesce(p_parceiro, public.parceiro_atual())), false)
$$;
grant execute on function public.pode_ver_catalogo(uuid), public.pode_ofertar(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Ofertas (ficha da empresa + ofertas com condição só para membros; a Wise valida)
-- ---------------------------------------------------------------------------
create table public.ofertas_hub (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  titulo text not null check (length(btrim(titulo)) between 3 and 120),
  descricao text not null check (length(btrim(descricao)) between 10 and 2000),
  para_quem text check (length(para_quem) <= 500),
  condicao text not null check (length(btrim(condicao)) between 3 and 300),
  como_usar text check (length(como_usar) <= 500),
  validade date,
  categoria_id uuid references public.categorias(id),
  estado text not null default 'em_validacao' check (estado in ('rascunho', 'em_validacao', 'publicada', 'pausada', 'recusada')),
  motivo_recusa text,
  validada_por uuid references public.perfis(id),
  validada_em timestamptz,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((titulo || descricao || coalesce(para_quem, '') || condicao || coalesce(como_usar, '')) !~ ('[' || chr(8212) || chr(8211) || ']'))
);
create index on public.ofertas_hub (estado, parceiro_id);

-- Quem oferece não publica sozinho: mudar o texto de uma oferta publicada volta para validação
create or replace function public.trg_oferta_hub() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_parcerias() then
    if new.estado in ('publicada', 'recusada') and (tg_op = 'INSERT' or old.estado is distinct from new.estado) then
      new.validada_por := auth.uid(); new.validada_em := now();
    end if;
    return new;
  end if;
  if new.estado in ('publicada', 'recusada') and (tg_op = 'INSERT' or old.estado is distinct from new.estado) then
    raise exception 'Só a Wise publica ou recusa uma oferta.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.estado in ('publicada', 'recusada') and new.estado = old.estado
     and (old.titulo, old.descricao, old.para_quem, old.condicao, old.como_usar, old.validade, old.categoria_id)
         is distinct from (new.titulo, new.descricao, new.para_quem, new.condicao, new.como_usar, new.validade, new.categoria_id) then
    new.estado := 'em_validacao'; new.motivo_recusa := null;
  end if;
  return new;
end $$;
create trigger t_oferta_hub before insert or update on public.ofertas_hub for each row execute function public.trg_oferta_hub();

alter table public.ofertas_hub enable row level security;
create policy oh_ler on public.ofertas_hub for select to authenticated using (
  public.is_interno() or parceiro_id = public.parceiro_atual()
  or (estado = 'publicada' and (validade is null or validade >= public.hoje()) and public.pode_ver_catalogo() and public.pode_ofertar(parceiro_id)));
create policy oh_criar on public.ofertas_hub for insert to authenticated with check (
  public.is_parcerias() or (parceiro_id = public.parceiro_atual() and public.pode_ofertar()));
create policy oh_editar on public.ofertas_hub for update to authenticated
  using (public.is_parcerias() or (parceiro_id = public.parceiro_atual() and public.pode_ofertar()))
  with check (public.is_parcerias() or (parceiro_id = public.parceiro_atual() and public.pode_ofertar()));
create policy oh_apagar on public.ofertas_hub for delete to authenticated using (public.is_parcerias() or parceiro_id = public.parceiro_atual());
grant select, insert, update, delete on public.ofertas_hub to authenticated;
revoke all on public.ofertas_hub from anon;

-- Catálogo pronto para a tela: só ofertas publicadas, válidas, de quem pode oferecer, para quem pode ver
create or replace function public.catalogo_hub() returns table (
  oferta_id uuid, titulo text, descricao text, para_quem text, condicao text, como_usar text, validade date,
  parceiro_id uuid, empresa text, site text, cliente_grupo boolean, categoria text, categorias text[], propria boolean
)
language sql stable security definer set search_path = public as $$
  select o.id, o.titulo, o.descricao, o.para_quem, o.condicao, o.como_usar, o.validade,
         p.id, p.nome_fantasia, p.site, p.cliente_grupo, c.nome,
         coalesce((select array_agg(c2.nome order by pc.principal desc, c2.nome) from public.parceiro_categorias pc join public.categorias c2 on c2.id = pc.categoria_id
                    where pc.parceiro_id = p.id), '{}'),
         p.id = public.parceiro_atual()
    from public.ofertas_hub o join public.parceiros p on p.id = o.parceiro_id left join public.categorias c on c.id = o.categoria_id
   where (public.is_interno() or public.pode_ver_catalogo())
     and o.estado = 'publicada' and (o.validade is null or o.validade >= public.hoje()) and public.pode_ofertar(p.id)
   order by o.validada_em desc nulls last, o.created_at desc
$$;
revoke execute on function public.catalogo_hub() from public, anon;
grant execute on function public.catalogo_hub() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Pedidos com protocolo (sem etapas de acompanhamento; quem oferece pode marcar se fechou, para a comissão opcional)
-- ---------------------------------------------------------------------------
create sequence if not exists public.pedidos_hub_seq;
create table public.pedidos_hub (
  id uuid primary key default gen_random_uuid(),
  protocolo text not null unique default ('WP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.pedidos_hub_seq')::text, 5, '0')),
  oferta_id uuid references public.ofertas_hub(id) on delete set null,
  ofertante_id uuid not null references public.parceiros(id) on delete cascade,
  solicitante_id uuid not null references public.parceiros(id) on delete cascade,
  solicitante_perfil_id uuid references public.perfis(id) on delete set null default auth.uid(),
  -- nomes gravados no pedido: cada empresa só lê o próprio cadastro em parceiros
  ofertante_nome text not null default '',
  solicitante_nome text not null default '',
  titulo_oferta text not null,
  condicao text not null,
  mensagem text check (length(mensagem) <= 1000),
  resultado text not null default 'enviado' check (resultado in ('enviado', 'fechado', 'nao_avancou')),
  resultado_em timestamptz,
  created_at timestamptz not null default now()
);
create index on public.pedidos_hub (ofertante_id, created_at desc);
create index on public.pedidos_hub (solicitante_id, created_at desc);
alter table public.pedidos_hub enable row level security;
create policy ph_ler on public.pedidos_hub for select to authenticated
  using (public.is_interno() or ofertante_id = public.parceiro_atual() or solicitante_id = public.parceiro_atual());
grant select on public.pedidos_hub to authenticated;
revoke all on public.pedidos_hub from anon;

create or replace function public.pedir_condicao(p_oferta uuid, p_mensagem text default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.ofertas_hub;
  v_eu uuid := public.parceiro_atual();
  v_nome text;
  v_prot text;
begin
  if v_eu is null or not public.pode_ver_catalogo(v_eu) then raise exception 'O catálogo é para clientes do grupo e parceiros Premium ou Elite.' using errcode = '42501'; end if;
  select * into o from public.ofertas_hub where id = p_oferta;
  if o.id is null or o.estado <> 'publicada' or (o.validade is not null and o.validade < public.hoje()) or not public.pode_ofertar(o.parceiro_id) then
    raise exception 'Esta oferta não está mais disponível.' using errcode = 'P0001';
  end if;
  if o.parceiro_id = v_eu then raise exception 'Esta oferta é da sua própria empresa.' using errcode = 'P0001'; end if;
  if p_mensagem ~ ('[' || chr(8212) || chr(8211) || ']') then p_mensagem := regexp_replace(p_mensagem, '[' || chr(8212) || chr(8211) || ']', ',', 'g'); end if;
  select nome_fantasia into v_nome from public.parceiros where id = v_eu;
  insert into public.pedidos_hub (oferta_id, ofertante_id, solicitante_id, ofertante_nome, solicitante_nome, titulo_oferta, condicao, mensagem)
  values (o.id, o.parceiro_id, v_eu, (select nome_fantasia from public.parceiros where id = o.parceiro_id), v_nome, o.titulo, o.condicao, nullif(btrim(p_mensagem), ''))
  returning protocolo into v_prot;
  perform public.notificar_parceiro(o.parceiro_id, 'pedido_hub', 'Novo pedido pelo catálogo',
    format('%s pediu a condição "%s" (protocolo %s). Os dados de contato estão em Catálogo, Pedidos.', v_nome, o.titulo, v_prot), '/parceiro/pedidos');
  perform public.notificar_responsavel(o.parceiro_id, 'pedido_hub', 'Pedido pelo catálogo',
    format('%s pediu "%s" (protocolo %s).', v_nome, o.titulo, v_prot), '/app/catalogo/pedidos');
  return v_prot;
end $$;
revoke execute on function public.pedir_condicao(uuid, text) from public, anon;
grant execute on function public.pedir_condicao(uuid, text) to authenticated;

create or replace function public.marcar_pedido(p_pedido uuid, p_resultado text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_resultado not in ('enviado', 'fechado', 'nao_avancou') then raise exception 'Resultado inválido.' using errcode = 'P0001'; end if;
  update public.pedidos_hub set resultado = p_resultado, resultado_em = case when p_resultado = 'enviado' then null else now() end
   where id = p_pedido and (ofertante_id = public.parceiro_atual() or public.is_parcerias());
  if not found then raise exception 'Sem permissão.' using errcode = '42501'; end if;
end $$;
revoke execute on function public.marcar_pedido(uuid, text) from public, anon;
grant execute on function public.marcar_pedido(uuid, text) to authenticated;

-- Contato de quem pediu: só para a empresa que oferece e para o time interno
create or replace function public.contato_do_pedido(p_pedido uuid) returns table (nome text, email text, telefone text, empresa text)
language sql stable security definer set search_path = public as $$
  select pf.nome, pf.email, pf.telefone, s.nome_fantasia
    from public.pedidos_hub ph join public.parceiros s on s.id = ph.solicitante_id left join public.perfis pf on pf.id = ph.solicitante_perfil_id
   where ph.id = p_pedido and (public.is_interno() or ph.ofertante_id = public.parceiro_atual())
$$;
revoke execute on function public.contato_do_pedido(uuid) from public, anon;
grant execute on function public.contato_do_pedido(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Nível que sobe sozinho (Premium: diagnóstico de um cliente no perfil; Elite: cliente trazido contratou o grupo)
-- ---------------------------------------------------------------------------
create or replace function public.recalcular_nivel_hub(p_parceiro uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  p public.parceiros;
  v_alvo text;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.id is null or p.tipo_parceria = 'cliente' or p.data_assinatura is null then return p.nivel; end if;
  if exists (select 1 from public.indicacoes i where i.parceiro_id = p.id and i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada') then
    v_alvo := 'A';
  elsif exists (select 1 from public.cadastros_cliente c where c.parceiro_id = p.id and c.icp and (c.status = 'diagnostico_feito' or c.plano_enviado_em is not null)) then
    v_alvo := 'B';
  else
    return p.nivel;
  end if;
  if coalesce(p.nivel, 'C') > v_alvo then
    update public.parceiros
       set nivel = v_alvo,
           nivel_ajuste_motivo = case v_alvo when 'A' then 'Elite: um cliente trazido pelo parceiro contratou uma empresa do grupo.'
                                             else 'Premium: um cliente do parceiro, no perfil, fez o diagnóstico com a Wise.' end
     where id = p.id;
    perform public.notificar_parceiro(p.id, 'nivel_subiu', 'Novo nível',
      case v_alvo when 'A' then 'Sua empresa agora é Elite: as suas ofertas podem entrar no Catálogo de parceiros.'
                  else 'Sua empresa agora é Premium: o Catálogo de parceiros e as condições especiais estão liberados.' end, '/parceiro/catalogo');
    return v_alvo;
  end if;
  return p.nivel;
end $$;
revoke execute on function public.recalcular_nivel_hub(uuid) from public, anon, authenticated;

create or replace function public.trg_nivel_por_diagnostico() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.plano_enviado_em is distinct from old.plano_enviado_em then perform public.recalcular_nivel_hub(new.parceiro_id); end if;
  return new;
end $$;
drop trigger if exists t_nivel_por_diagnostico on public.cadastros_cliente;
create trigger t_nivel_por_diagnostico after update on public.cadastros_cliente for each row execute function public.trg_nivel_por_diagnostico();

create or replace function public.trg_nivel_por_indicacao() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.etapa = 'fechada' and (tg_op = 'INSERT' or old.etapa is distinct from new.etapa) then perform public.recalcular_nivel_hub(new.parceiro_id); end if;
  return new;
end $$;
drop trigger if exists t_nivel_por_indicacao on public.indicacoes;
create trigger t_nivel_por_indicacao after insert or update on public.indicacoes for each row execute function public.trg_nivel_por_indicacao();

-- ---------------------------------------------------------------------------
-- 6. Oferta esperando validação vira tarefa (decidir)
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
           c.empresa || coalesce(' · ' || c.categoria_nome, ''),
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
