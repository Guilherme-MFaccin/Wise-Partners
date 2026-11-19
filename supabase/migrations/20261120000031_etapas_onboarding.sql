-- Portal v3, coerência com o to-be (20/11/2026): onboarding por etapas (P-94), ativação no primeiro cliente
-- cadastrado pelo link (P-30) e lembrete de parceiro parado numa etapa (P-97), no lugar do prazo de 90 dias.
-- Princípio 9 do to-be: "Primeiro valor logo na entrada, por etapas e sem prazo em dias; o parceiro só conta quando ativa."
-- O plano de 90 dias e os encontros continuam registrados (histórico), mas não definem mais a ativação nem a fila.

-- ---------------------------------------------------------------------------
-- 1. Etapas que o parceiro marca (as demais o portal vê sozinho)
-- ---------------------------------------------------------------------------
create table if not exists public.marcas_onboarding (
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  etapa text not null check (etapa in ('anuncio', 'link_enviado')),
  marcado_em timestamptz not null default now(),
  marcado_por uuid references public.perfis(id) default auth.uid(),
  primary key (parceiro_id, etapa)
);
alter table public.marcas_onboarding enable row level security;
create policy mo_ler on public.marcas_onboarding for select to authenticated
  using (public.is_interno() or parceiro_id = public.parceiro_atual());
create policy mo_marcar on public.marcas_onboarding for insert to authenticated
  with check (public.is_parcerias() or parceiro_id = public.parceiro_atual());
create policy mo_desmarcar on public.marcas_onboarding for delete to authenticated
  using (public.is_parcerias() or parceiro_id = public.parceiro_atual());
grant select, insert, delete on public.marcas_onboarding to authenticated;

alter table public.planos_onboarding add column if not exists cadastro_ativacao_id uuid references public.cadastros_cliente(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. As seis etapas do onboarding do Select, na ordem do processo P-94
-- ---------------------------------------------------------------------------
create or replace function public.etapas_onboarding(p_parceiro uuid)
returns table (ordem int, chave text, titulo text, quem text, automatica boolean, feita boolean, feita_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  v_cnpj text;
  v_acesso timestamptz;
  v_minicurso timestamptz;
  v_cliente timestamptz;
  v_diag timestamptz;
begin
  if not (public.is_interno() or p_parceiro = public.parceiro_atual()) then return; end if;
  select public.somente_digitos(cnpj) into v_cnpj from public.parceiros where id = p_parceiro;
  select min(u.last_sign_in_at) into v_acesso from public.perfis pf join auth.users u on u.id = pf.id
   where pf.parceiro_id = p_parceiro and u.last_sign_in_at is not null
     and coalesce(u.raw_user_meta_data->>'senha_provisoria', 'false') <> 'true';
  select min(c.emitido_em) into v_minicurso from public.certificados c join public.trilhas t on t.id = c.trilha_id
   where c.parceiro_id = p_parceiro and t.chave = 'como_vender' and c.ativo;
  select min(c.created_at) into v_cliente from public.cadastros_cliente c
   where c.parceiro_id = p_parceiro and c.status <> 'descartado' and public.somente_digitos(c.cnpj) is distinct from v_cnpj;
  select min(coalesce(c.plano_enviado_em, c.diagnostico_em)) into v_diag from public.cadastros_cliente c
   where c.parceiro_id = p_parceiro and (c.status = 'diagnostico_feito' or c.diagnostico_em is not null)
     and public.somente_digitos(c.cnpj) is distinct from v_cnpj;
  return query
    select 1, 'acesso', 'Entrar no portal e criar a sua senha', 'parceiro', true, v_acesso is not null, v_acesso
    union all
    select 2, 'minicurso', 'Fazer o minicurso Como vender a Wise Makers', 'parceiro', true, v_minicurso is not null, v_minicurso
    union all
    select 3, 'anuncio', 'Publicar o anúncio da parceria e marcar aqui', 'parceiro', false,
           exists (select 1 from public.marcas_onboarding m where m.parceiro_id = p_parceiro and m.etapa = 'anuncio'),
           (select m.marcado_em from public.marcas_onboarding m where m.parceiro_id = p_parceiro and m.etapa = 'anuncio')
    union all
    select 4, 'link_enviado', 'Mandar o seu link e a mensagem pronta para a base e marcar aqui', 'parceiro', false,
           exists (select 1 from public.marcas_onboarding m where m.parceiro_id = p_parceiro and m.etapa = 'link_enviado'),
           (select m.marcado_em from public.marcas_onboarding m where m.parceiro_id = p_parceiro and m.etapa = 'link_enviado')
    union all
    select 5, 'primeiro_cliente', 'Primeiro cliente cadastrado pelo seu link: a parceria fica ativa', 'cliente', true, v_cliente is not null, v_cliente
    union all
    select 6, 'primeiro_diagnostico', 'Primeiro diagnóstico feito na sua base: onboarding concluído', 'cliente', true, v_diag is not null, v_diag;
end $$;
revoke execute on function public.etapas_onboarding(uuid) from public, anon;
grant execute on function public.etapas_onboarding(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Ativação (P-30): primeiro cliente cadastrado pelo link, que não seja a própria empresa do parceiro
-- ---------------------------------------------------------------------------
create or replace function public.ativar_por_cliente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pl public.planos_onboarding;
  v_nome text;
  v_cnpj text;
begin
  select * into pl from public.planos_onboarding where parceiro_id = new.parceiro_id;
  if pl.parceiro_id is null or pl.situacao = 'ativado' then return new; end if;
  select nome_fantasia, public.somente_digitos(cnpj) into v_nome, v_cnpj from public.parceiros where id = new.parceiro_id;
  if public.somente_digitos(new.cnpj) = v_cnpj then return new; end if; -- cadastro de teste do próprio parceiro
  update public.planos_onboarding
     set situacao = 'ativado', ativado_em = public.hoje(), cadastro_ativacao_id = new.id, dias_ate_ativacao = public.hoje() - inicio
   where parceiro_id = new.parceiro_id;
  update public.parceiros set etapa = 'parceria_ativa' where id = new.parceiro_id and etapa = 'onboarding';
  perform public.notificar_responsavel(new.parceiro_id, 'parceiro_ativado', 'Parceiro ativado',
    format('%s foi ativado: o primeiro cliente (%s) se cadastrou pelo link.', v_nome, new.empresa), '/app/parceiros/' || new.parceiro_id);
  perform public.notificar_parceiro(new.parceiro_id, 'parceiro_ativado', 'Parceria ativada',
    'O primeiro cliente de vocês se cadastrou pelo link. A parceria está ativa.', '/parceiro/onboarding');
  return new;
end $$;
drop trigger if exists t_ativar_por_cliente on public.cadastros_cliente;
create trigger t_ativar_por_cliente after insert on public.cadastros_cliente for each row execute function public.ativar_por_cliente();

-- ---------------------------------------------------------------------------
-- 4. Fila de tarefas: "Parceiro parado no onboarding" passa a contar os dias na etapa (P-97), não o prazo de 90 dias
-- ---------------------------------------------------------------------------
create or replace function public.fila_tarefas()
returns table (
  chave text, tipo text, grupo text, prioridade int, titulo text, detalhe text,
  parceiro_id uuid, parceiro text, responsavel_id uuid, responsavel text,
  desde date, prazo date, ref_id uuid, link text
)
language sql stable security definer set search_path = public as $$
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
   where public.is_parcerias()
      or (public.is_financeiro() and i.tipo = 'comissao')
      or (public.is_consultor() and i.tipo in ('diagnostico', 'proximo_passo', 'tarefa_onboarding', 'checagem', 'acao_wise', 'sla',
                                                'indicacao_parada', 'atualizacao_indicacao', 'comprovacao', 'em_risco', 'cadencia'))
      or (public.is_interno_leitura() and i.responsavel_id = auth.uid() and i.tipo in ('sla', 'indicacao_parada', 'checagem', 'proximo_passo'))
   order by i.prioridade, coalesce(i.prazo, i.desde) nulls last, i.titulo;
$$;
revoke execute on function public.fila_tarefas() from public, anon;
grant execute on function public.fila_tarefas() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. A entrada do parceiro é sempre pessoal (fila, WhatsApp e conversa de entrada): sem o modo de acesso direto
-- ---------------------------------------------------------------------------
update public.config_landing set modo_cadastro = 'fila' where modo_cadastro <> 'fila';
alter table public.config_landing drop constraint if exists config_landing_modo_cadastro_check;
alter table public.config_landing add constraint config_landing_modo_cadastro_check check (modo_cadastro = 'fila');
