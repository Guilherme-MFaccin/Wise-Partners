-- Portal v3 (21/11/2026): gerenciador de tarefas no modelo do ClickUp e do Monday.
-- Tarefas guardadas em tabela própria, com estado, prioridade, responsável, datas, etiquetas, checklist e comentários.
-- As exceções do P-09 (fila de exceções) viram tarefas sozinhas e se fecham sozinhas quando a regra deixa de apontar o caso.
-- Quem fecha à mão uma tarefa de regra que continua aberta só recebe outra depois de 7 dias (adiar com responsabilidade).

-- ---------------------------------------------------------------------------
-- 1. Exceções sem filtro de papel (base da sincronização)
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
-- 2. Tarefas e comentários
-- ---------------------------------------------------------------------------
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  descricao text check (length(descricao) <= 5000),
  detalhe text,
  status text not null default 'a_fazer' check (status in ('a_fazer', 'fazendo', 'aguardando', 'feito', 'cancelada')),
  prioridade text not null default 'normal' check (prioridade in ('urgente', 'alta', 'normal', 'baixa')),
  responsavel_id uuid references public.perfis(id) on delete set null,
  criado_por uuid references public.perfis(id) on delete set null default auth.uid(),
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  origem text not null default 'manual' check (origem in ('manual', 'regra')),
  tipo text not null default 'manual',
  grupo text check (grupo in ('decidir', 'responder', 'acompanhar')),
  chave_regra text,
  link text check (link is null or link ~ '^/'),
  etiquetas text[] not null default '{}',
  checklist jsonb not null default '[]' check (jsonb_typeof(checklist) = 'array'),
  inicio date,
  prazo date,
  ordem double precision not null default extract(epoch from now()),
  concluida_em timestamptz,
  resolvida_pela_regra boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inicio is null or prazo is null or inicio <= prazo),
  check (titulo !~ ('[' || chr(8212) || chr(8211) || ']') and coalesce(descricao, '') !~ ('[' || chr(8212) || chr(8211) || ']'))
);
create unique index tarefas_regra_aberta on public.tarefas (chave_regra) where origem = 'regra' and status not in ('feito', 'cancelada');
create index on public.tarefas (responsavel_id, status);
create index on public.tarefas (prazo) where status not in ('feito', 'cancelada');
create index on public.tarefas (parceiro_id);

create or replace function public.trg_tarefa() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'feito' and (tg_op = 'INSERT' or old.status <> 'feito') then new.concluida_em := coalesce(new.concluida_em, now()); end if;
  if new.status <> 'feito' then new.concluida_em := null; end if;
  return new;
end $$;
create trigger t_tarefa before insert or update on public.tarefas for each row execute function public.trg_tarefa();

alter table public.tarefas enable row level security;
create policy tarefa_ler on public.tarefas for select to authenticated using (public.is_interno());
create policy tarefa_criar on public.tarefas for insert to authenticated with check (public.is_interno() and origem = 'manual');
create policy tarefa_editar on public.tarefas for update to authenticated
  using (public.is_parcerias() or responsavel_id = auth.uid() or criado_por = auth.uid() or (responsavel_id is null and public.is_interno()))
  with check (public.is_interno());
create policy tarefa_apagar on public.tarefas for delete to authenticated
  using (origem = 'manual' and (public.is_parcerias() or criado_por = auth.uid()));
grant select, insert, update, delete on public.tarefas to authenticated;
revoke all on public.tarefas from anon;

create table public.tarefa_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  autor_id uuid references public.perfis(id) on delete set null default auth.uid(),
  texto text not null check (length(btrim(texto)) between 1 and 4000 and texto !~ ('[' || chr(8212) || chr(8211) || ']')),
  created_at timestamptz not null default now()
);
create index on public.tarefa_comentarios (tarefa_id, created_at);
alter table public.tarefa_comentarios enable row level security;
create policy tc_ler on public.tarefa_comentarios for select to authenticated using (public.is_interno());
create policy tc_criar on public.tarefa_comentarios for insert to authenticated with check (public.is_interno() and autor_id = auth.uid());
create policy tc_apagar on public.tarefa_comentarios for delete to authenticated using (autor_id = auth.uid() or public.is_parcerias());
grant select, insert, delete on public.tarefa_comentarios to authenticated;
revoke all on public.tarefa_comentarios from anon;

-- ---------------------------------------------------------------------------
-- 3. Sincronização das exceções com as tarefas (a tela chama ao abrir; a rotina diária também pode chamar)
-- ---------------------------------------------------------------------------
create table public.tarefas_sync (id int primary key default 1 check (id = 1), em timestamptz not null);
alter table public.tarefas_sync enable row level security;
revoke all on public.tarefas_sync from anon, authenticated;

create or replace function public.sincronizar_tarefas(p_forcar boolean default false) returns integer
language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
  k int;
  v_ult timestamptz;
begin
  if auth.uid() is not null and not public.is_interno() then return 0; end if;
  select em into v_ult from public.tarefas_sync where id = 1 for update;
  if not p_forcar and v_ult is not null and v_ult > now() - interval '2 minutes' then return 0; end if;
  insert into public.tarefas_sync (id, em) values (1, now()) on conflict (id) do update set em = now();

  create temp table if not exists _excecoes on commit drop as select * from public.excecoes_abertas() limit 0;
  truncate _excecoes;
  insert into _excecoes select * from public.excecoes_abertas();

  -- novas exceções viram tarefas (não recria o que alguém fechou à mão há menos de 7 dias)
  insert into public.tarefas (titulo, detalhe, status, prioridade, responsavel_id, criado_por, parceiro_id, origem, tipo, grupo, chave_regra, link, prazo, inicio)
  select e.titulo, e.detalhe, 'a_fazer',
         case when e.prioridade = 1 then 'alta' when e.prioridade = 2 then 'normal' else 'baixa' end,
         e.responsavel_id, null, e.parceiro_id, 'regra', e.tipo, e.grupo, e.chave, e.link, e.prazo, e.desde
    from _excecoes e
   where not exists (select 1 from public.tarefas t where t.chave_regra = e.chave and t.origem = 'regra'
                       and (t.status not in ('feito', 'cancelada') or (not t.resolvida_pela_regra and t.concluida_em > now() - interval '7 days')
                            or (t.status = 'cancelada' and t.updated_at > now() - interval '7 days')));
  get diagnostics k = row_count; n := n + k;

  -- abertas: atualiza o texto da regra
  update public.tarefas t set detalhe = e.detalhe, titulo = e.titulo
    from _excecoes e
   where t.chave_regra = e.chave and t.origem = 'regra' and t.status not in ('feito', 'cancelada')
     and (t.detalhe is distinct from e.detalhe or t.titulo is distinct from e.titulo);

  -- a regra deixou de apontar o caso: a tarefa se fecha sozinha
  update public.tarefas t set status = 'feito', resolvida_pela_regra = true
   where t.origem = 'regra' and t.status not in ('feito', 'cancelada')
     and not exists (select 1 from _excecoes e where e.chave = t.chave_regra);
  get diagnostics k = row_count; n := n + k;
  return n;
end $$;
revoke execute on function public.sincronizar_tarefas(boolean) from public, anon;
grant execute on function public.sincronizar_tarefas(boolean) to authenticated, service_role;
