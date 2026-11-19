-- Portal v3 (20/11/2026): tarefas como fila de exceções (P-09 "Resolver as exceções do dia").
-- "Exceção: o que fugiu da regra e por isso vira tarefa na fila; o que segue a regra não gera trabalho" (glossário do to-be).
-- Uma função entrega a fila pronta, já com tipo, grupo, prioridade, prazo e o link de onde se resolve; a tela só mostra.
-- Roda com permissão do sistema (usa sla_vencidos, regua_status e tem_aprovacao_assinatura) e filtra por papel no fim:
-- gestão (admin e parcerias) vê tudo; consultor vê diagnósticos e acompanhamento; comercial, o que é dele; financeiro, comissões.
-- Também: diagnóstico do cliente do parceiro com consultor, reunião e plano (P-95) e o funil por origem dos candidatos (P-98, P-101).

-- ---------------------------------------------------------------------------
-- 1. Diagnóstico do cliente do parceiro (P-95): quem conduz, quando foi a reunião, quando o plano saiu
-- ---------------------------------------------------------------------------
alter table public.cadastros_cliente add column if not exists consultor_id uuid references public.perfis(id) on delete set null;
alter table public.cadastros_cliente add column if not exists reuniao_em timestamptz;
alter table public.cadastros_cliente add column if not exists plano_enviado_em timestamptz;
alter table public.cadastros_cliente add column if not exists observacao text;
alter table public.cadastros_cliente add column if not exists atualizado_em timestamptz;
grant select (consultor_id, reuniao_em, plano_enviado_em, observacao, atualizado_em) on public.cadastros_cliente to authenticated;

-- Os consultores registram diagnósticos (FO-15): leem e atualizam os cadastros de clientes
create policy cc_ler_consultor on public.cadastros_cliente for select to authenticated using (public.is_consultor());
create policy cc_status_consultor on public.cadastros_cliente for update to authenticated
  using (public.is_consultor()) with check (public.is_consultor());

-- ---------------------------------------------------------------------------
-- 2. Fila de tarefas
-- grupo: decidir (aprovar, validar, confirmar), responder (alguém de fora espera a Wise), acompanhar (ritmo da carteira)
-- prioridade: 1 é a mais alta; dentro da prioridade, o que está há mais tempo vem antes
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
           public.config_int('indicacao_parada_dias', 15) as ip
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
    select 'onboarding_parado', 'acompanhar', 1, 'Onboarding no prazo final sem ativação',
           'Começou em ' || to_char(pl.inicio, 'DD/MM') || coalesce(', estendido até ' || to_char(pl.estendido_ate, 'DD/MM'), ''),
           pl.parceiro_id, p.responsavel_id, pl.prazo_final, coalesce(pl.estendido_ate, pl.prazo_final), pl.parceiro_id,
           '/app/parceiros/' || pl.parceiro_id || '?aba=onboarding'
      from cfg, public.planos_onboarding pl join public.parceiros p on p.id = pl.parceiro_id
     where pl.situacao = 'em_andamento' and cfg.hoje >= pl.prazo_final
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
-- 3. Candidatos por origem (P-98 campanha, P-101 outras origens): do cadastro à ativação
-- ---------------------------------------------------------------------------
create or replace function public.candidatos_por_origem(p_inicio date default null, p_fim date default null)
returns table (origem text, campanha text, cadastros int, em_conversa int, aprovados int, descartados int, ativados int)
language sql stable security invoker set search_path = public as $$
  select coalesce(nullif(c.utm_source, ''), case when nullif(c.referencia, '') is not null then 'Indicação ou link direto' else 'Direto' end),
         coalesce(nullif(c.utm_campaign, ''), '(sem campanha)'),
         count(*)::int,
         count(*) filter (where c.status in ('fila', 'contatado', 'reuniao_marcada'))::int,
         count(*) filter (where c.status in ('aprovado', 'criado'))::int,
         count(*) filter (where c.status = 'descartado')::int,
         count(*) filter (where pl.ativado_em is not null)::int
    from public.cadastros_landing c
    left join public.planos_onboarding pl on pl.parceiro_id = c.parceiro_id
   where public.is_parcerias() and c.created_at::date between coalesce(p_inicio, public.hoje() - 90) and coalesce(p_fim, public.hoje())
     and c.status <> 'falhou'
   group by 1, 2
   order by 3 desc, 1, 2;
$$;
revoke execute on function public.candidatos_por_origem(date, date) from public, anon;
grant execute on function public.candidatos_por_origem(date, date) to authenticated;
