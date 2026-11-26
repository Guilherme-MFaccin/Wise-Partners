-- Proposta comercial da Wise Makers (26/11/2026), integrada ao programa:
-- * Diagnóstico gratuito: o mesmo de antes (reunião, plano de ação e Wise Hub, valor de referência de R$ 5.000), agora com o
--   plano para os próximos 6 meses.
-- * Jornada paga, opcional: mês 1, acompanhamento guiado (4 encontros semanais de 2 horas, R$ 4.997 em vez de R$ 7.000,
--   estrutura as ferramentas, treina a equipe e dá a perspectiva de 12 meses); mês 2, Plano de Tração (mais 4 encontros, mais
--   R$ 4.997: metas, comissão, playbook e reativação); do mês 3 em diante, plano mensal de continuidade (R$ 3.997 por mês).
-- * Comissão da Wise ao parceiro: 6% das vendas pontuais (1 ou 2 meses), como na Swallow, com 1,5% para o gerente de parcerias;
--   40% da primeira mensalidade do contrato contínuo, com 10% para o gerente.
-- * Prova para empresas B2B: Chamego (não é totalmente B2B) e Totonho (B2C) saem dos cases ativos.

-- ---------------------------------------------------------------------------
-- 1. Regra de comissão por tipo de venda
-- ---------------------------------------------------------------------------
alter table public.empresas_grupo add column if not exists pct_parceiro_pontual numeric(6,3);
alter table public.empresas_grupo add column if not exists pct_responsavel_pontual numeric(6,3);
alter table public.empresas_grupo add column if not exists base_calculo_pontual text;
update public.empresas_grupo
   set base_calculo = 'Primeira mensalidade do contrato contínuo', pct_parceiro = 40, pct_responsavel = 10,
       base_calculo_pontual = 'Venda pontual da consultoria (1 ou 2 meses)', pct_parceiro_pontual = 6, pct_responsavel_pontual = 1.5
 where codigo = 'wise';

alter table public.indicacoes add column if not exists valor_pontual numeric(14,2) check (valor_pontual >= 0);
alter table public.indicacoes add column if not exists meses_pontuais int check (meses_pontuais in (1, 2));
alter table public.indicacoes add column if not exists data_compensacao_pontual date;
comment on column public.indicacoes.valor_base is 'Primeira mensalidade do contrato contínuo (Wise), primeira parcela (Tríade) ou valor do projeto (Swallow)';
comment on column public.indicacoes.valor_pontual is 'Wise: soma das vendas pontuais (mês 1, ou mês 1 e mês 2)';

alter table public.comissoes add column if not exists parcela text not null default 'unica' check (parcela in ('unica', 'pontual', 'continuo'));
alter table public.comissoes drop constraint if exists comissoes_indicacao_id_beneficiario_key;
alter table public.comissoes add constraint comissoes_indicacao_beneficiario_parcela_key unique (indicacao_id, beneficiario, parcela);

drop trigger if exists t_hist on public.indicacoes;
create trigger t_hist after insert or update on public.indicacoes
for each row execute function public.trg_historico('etapa', 'valor_base', 'data_reuniao', 'data_fechamento', 'data_compensacao',
  'cliente_existente', 'excecao_duplicidade', 'atualizacao_pendente', 'responsavel_id', 'valor_pontual', 'meses_pontuais', 'data_compensacao_pontual');

create or replace function public.sincronizar_comissoes(p_indicacao uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  i public.indicacoes;
  p public.parceiros;
  e public.empresas_grupo;
  ins public.parceiros_instrumento;
  r public.comissoes;
  v_estado text;
  v_fin record;
  v_email_fin text;
  v_sem_comissao boolean;
  v_base numeric;
  v_comp date;
begin
  select * into i from public.indicacoes where id = p_indicacao;
  select * into p from public.parceiros where id = i.parceiro_id;
  select * into e from public.empresas_grupo where id = i.empresa_grupo_id;

  -- Instituição pública: sem comissão em nenhuma direção. Cliente existente: sem comissão, salvo exceção.
  v_sem_comissao := (p.tipo_parceria = 'institucional' and p.natureza_juridica = 'publica')
                    or (i.cliente_existente and coalesce(btrim(i.excecao_duplicidade), '') = '');

  if not exists (select 1 from public.comissoes where indicacao_id = i.id) then
    if v_sem_comissao then return; end if;
    if i.sentido = 'parceiro_para_grupo' and e.codigo = 'wise' then
      -- Wise (proposta comercial de 26/11/2026): a primeira venda costuma ser pontual (mês 1, ou mês 1 e mês 2)
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao, parcela)
      values (i.id, i.parceiro_id, 'parceiro', e.pct_parceiro_pontual, e.base_calculo_pontual, 'pontual');
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, responsavel_perfil_id, percentual, base_descricao, parcela)
      values (i.id, i.parceiro_id, 'responsavel', p.responsavel_id, e.pct_responsavel_pontual, e.base_calculo_pontual, 'pontual');
    elsif i.sentido = 'parceiro_para_grupo' then
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao)
      values (i.id, i.parceiro_id, 'parceiro', e.pct_parceiro, e.base_calculo);
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, responsavel_perfil_id, percentual, base_descricao)
      values (i.id, i.parceiro_id, 'responsavel', p.responsavel_id, e.pct_responsavel, e.base_calculo);
    else
      select * into ins from public.parceiros_instrumento where parceiro_id = i.parceiro_id;
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao, observacao)
      values (i.id, i.parceiro_id, 'grupo', ins.comissao_pct,
              coalesce(ins.comissao_base, 'Conforme instrumento do parceiro'),
              case when ins.programa_proprio then 'Instrumento: ' || coalesce(ins.instrumento_nome, 'programa do parceiro') end);
    end if;
  end if;

  -- Wise: o contrato contínuo (plano mensal a partir do 3º mês) abre a sua parcela quando a primeira mensalidade é informada
  if not v_sem_comissao and i.sentido = 'parceiro_para_grupo' and e.codigo = 'wise' and i.valor_base is not null
     and not exists (select 1 from public.comissoes where indicacao_id = i.id and parcela = 'continuo') then
    insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao, parcela)
    values (i.id, i.parceiro_id, 'parceiro', e.pct_parceiro, e.base_calculo, 'continuo');
    insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, responsavel_perfil_id, percentual, base_descricao, parcela)
    values (i.id, i.parceiro_id, 'responsavel', p.responsavel_id, e.pct_responsavel, e.base_calculo, 'continuo');
  end if;

  for r in select * from public.comissoes where indicacao_id = i.id and estado not in ('paga', 'nf_recebida') loop
    -- Cada parcela tem a sua base e a sua compensação: pontual (meses 1 e 2) ou mensalidade (contínuo e demais empresas)
    v_base := case when r.parcela = 'pontual' then i.valor_pontual else i.valor_base end;
    v_comp := case when r.parcela = 'pontual' then i.data_compensacao_pontual else i.data_compensacao end;
    if i.etapa = 'perdida' then
      v_estado := 'cancelada';
    elsif i.etapa = 'fechada' and v_base is not null then
      v_estado := case when v_comp is not null then 'a_pagar' else 'aguardando_compensacao' end;
    elsif i.etapa = 'fechada' and r.parcela = 'pontual' and i.valor_base is not null then
      v_estado := 'cancelada';  -- fechou direto o contrato contínuo, sem venda pontual
    else
      v_estado := 'aguardando_fechamento';
    end if;
    -- "a pagar" já registrado não volta atrás por edição da indicação
    if r.estado = 'a_pagar' and v_estado <> 'cancelada' then v_estado := 'a_pagar'; end if;

    update public.comissoes
       set base_valor = v_base,
           valor = case when v_base is not null and r.percentual is not null
                        then round(v_base * r.percentual / 100, 2) end,
           estado = v_estado,
           a_pagar_em = case when v_estado = 'a_pagar' then coalesce(r.a_pagar_em, now()) else r.a_pagar_em end
     where id = r.id;

    if v_estado = 'a_pagar' and r.estado <> 'a_pagar' and r.beneficiario in ('parceiro', 'responsavel') then
      for v_fin in select id from public.perfis where papel = 'financeiro' and ativo loop
        perform public.notificar(v_fin.id, 'comissao_a_pagar', 'Comissão a pagar',
          format('%s: comissão de %s sobre o cliente indicado para %s%s.', p.nome_fantasia,
                 case r.beneficiario when 'parceiro' then 'parceiro' else 'responsável pela parceria' end, e.nome, case r.parcela when 'pontual' then ' (venda pontual)' when 'continuo' then ' (contrato contínuo)' else '' end),
          '/app/comissoes', jsonb_build_object('comissao_id', r.id), true);
      end loop;
      v_email_fin := public.config('email_financeiro') #>> '{}';
      if coalesce(v_email_fin, '') <> '' and not exists (select 1 from public.perfis where papel = 'financeiro' and ativo and lower(email) = lower(v_email_fin)) then
        insert into public.notificacoes (email_destino, tipo, titulo, mensagem, link, dados)
        values (v_email_fin, 'comissao_a_pagar', 'Comissão a pagar',
                format('%s: comissão de %s sobre o cliente indicado para %s%s.', p.nome_fantasia,
                       case r.beneficiario when 'parceiro' then 'parceiro' else 'responsável pela parceria' end, e.nome, case r.parcela when 'pontual' then ' (venda pontual)' when 'continuo' then ' (contrato contínuo)' else '' end),
                '/app/comissoes', jsonb_build_object('comissao_id', r.id));
      end if;
    end if;
  end loop;
end $$;

revoke execute on function public.sincronizar_comissoes(uuid) from public, anon, authenticated;

-- Receita atribuída da Wise: vendas pontuais mais a mensalidade do contínuo no horizonte configurado
create or replace function public._planilha_custos(p_inicio date, p_fim date)
returns table (
  data date, tipo_linha text, categoria text, parceiro_id uuid, parceiro text, pessoa_id uuid, pessoa text,
  atividade text, etapa_jornada text, minutos int, custo_hora numeric, valor numeric, empresa text, cliente text,
  cliente_icp boolean, mensalidade numeric, origem_id uuid)
language sql stable security definer set search_path = public as $$
  -- Horas registradas, com o custo-hora da época
  select a.data, 'hora', 'horas', a.parceiro_id, p.nome_fantasia, a.pessoa_id, pf.nome, t.nome, coalesce(a.etapa_jornada, t.etapa_jornada),
         a.minutos, ac.custo_hora, ac.custo, null::text, null::text, null::boolean, null::numeric, a.id
  from public.atividades a
  join public.tipos_atividade t on t.id = a.tipo_atividade_id
  left join public.atividades_custo ac on ac.atividade_id = a.id
  left join public.parceiros p on p.id = a.parceiro_id
  left join public.perfis pf on pf.id = a.pessoa_id
  where a.data between p_inicio and p_fim
  union all
  -- Comissões pagas pelo grupo, na data de fechamento da indicação (mesmo período da receita)
  select i.data_fechamento, case c.beneficiario when 'parceiro' then 'comissao_parceiro' else 'comissao_responsavel' end,
         'comissoes', i.parceiro_id, p.nome_fantasia, c.responsavel_perfil_id, pf.nome, null, null, null, null,
         coalesce(c.valor, 0), e.nome, cl.razao_social, null, null, c.id
  from public.comissoes c
  join public.indicacoes i on i.id = c.indicacao_id
  join public.parceiros p on p.id = i.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  left join public.perfis pf on pf.id = c.responsavel_perfil_id
  where c.beneficiario in ('parceiro', 'responsavel') and c.estado <> 'cancelada'
    and i.etapa = 'fechada' and i.data_fechamento between p_inicio and p_fim
  union all
  -- Custos diretos (recorrentes: uma linha por mês)
  select d.data, 'custo_direto', d.categoria, d.parceiro_id, p.nome_fantasia, null, null, d.descricao, null, null, null,
         d.valor, null, null, null, null, d.custo_id
  from public.custos_diretos_expandidos(p_inicio, p_fim) d
  left join public.parceiros p on p.id = d.parceiro_id
  union all
  -- Receita atribuída: indicações do parceiro para o grupo fechadas no período
  select i.data_fechamento, 'receita', 'receita', i.parceiro_id, p.nome_fantasia, null, null, null, null, null, null,
         case when e.codigo = 'wise' then coalesce(i.valor_pontual, 0)
                                          + coalesce(i.valor_base, 0) * least(coalesce(i.prazo_meses, public.config_int('prazo_contrato_padrao_meses', 12)),
                                                                              public.config_int('horizonte_receita_meses', 12))
              else coalesce(i.valor_total, i.valor_base, 0) end,
         e.nome, cl.razao_social, coalesce(i.icp_confirmado, i.aderente_icp, false),
         case when e.codigo = 'wise' then coalesce(i.valor_base, 0) else 0 end, i.id
  from public.indicacoes i
  join public.parceiros p on p.id = i.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  where i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada' and i.data_fechamento between p_inicio and p_fim
  union all
  -- Comissões recebidas pelo grupo de parceiros, pagas no período
  select (c.paga_em at time zone 'America/Sao_Paulo')::date, 'comissao_recebida', 'receita', c.parceiro_id, p.nome_fantasia,
         null, null, null, null, null, null, coalesce(c.valor, 0), e.nome, cl.razao_social, null, null, c.id
  from public.comissoes c
  join public.indicacoes i on i.id = c.indicacao_id
  join public.parceiros p on p.id = c.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  where c.beneficiario = 'grupo' and c.estado = 'paga' and (c.paga_em at time zone 'America/Sao_Paulo')::date between p_inicio and p_fim
$$;
revoke execute on function public._planilha_custos(date, date) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Preços da jornada, para as páginas (marcadores) e para o closer
-- ---------------------------------------------------------------------------
alter table public.config_landing_cliente add column if not exists preco_mes1 numeric(12,2) not null default 4997 check (preco_mes1 >= 0);
alter table public.config_landing_cliente add column if not exists preco_mes1_tabela numeric(12,2) not null default 7000 check (preco_mes1_tabela >= 0);
alter table public.config_landing_cliente add column if not exists preco_mes2 numeric(12,2) not null default 4997 check (preco_mes2 >= 0);
alter table public.config_landing_cliente add column if not exists preco_continuidade numeric(12,2) not null default 3997 check (preco_continuidade >= 0);

-- ---------------------------------------------------------------------------
-- 3. Cases B2C fora da prova (continuam na base, desativados; a média é recalculada pelo banco)
-- ---------------------------------------------------------------------------
update public.cases_resultado set ativo = false where empresa in ('Chamego Bandeiras', 'Totonho Locações');

-- ---------------------------------------------------------------------------
-- 4. Regras do programa para o parceiro: a Wise aparece com as duas comissões
-- ---------------------------------------------------------------------------
create or replace function public.regras_retrato() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'niveis', (select jsonb_agg(jsonb_build_object('codigo', n.codigo, 'nome', n.nome, 'faixa_min', n.faixa_min, 'faixa_max', n.faixa_max,
                 'requisitos', (select jsonb_agg(jsonb_build_object('grupo', r.grupo, 'descricao', r.descricao) order by r.grupo)
                                from public.requisitos_nivel r where r.nivel = n.codigo
                                  and r.vigente_desde = (select max(vigente_desde) from public.requisitos_nivel r2
                                                         where r2.nivel = r.nivel and r2.grupo = r.grupo and r2.vigente_desde <= public.hoje())))
                 order by n.codigo desc) from public.niveis n where n.tipo_parceria = 'comercial'),
    'pacotes', (select jsonb_agg(jsonb_build_object('codigo', codigo, 'nome', nome, 'entregas', entregas) order by ordem) from public.pacotes),
    -- Wise com duas linhas (proposta comercial de 26/11/2026): venda pontual e contrato contínuo
    'comissoes', (select jsonb_agg(x.j order by x.o, x.k) from (
                    select ordem o, 1 k, jsonb_build_object('empresa', nome, 'base', base_calculo, 'percentual_parceiro', pct_parceiro) j from public.empresas_grupo
                    union all
                    select ordem, 0, jsonb_build_object('empresa', nome, 'base', base_calculo_pontual, 'percentual_parceiro', pct_parceiro_pontual)
                      from public.empresas_grupo where pct_parceiro_pontual is not null) x),
    'protecao_dias', public.config_int('protecao_indicacao_dias', 180),
    'sla', jsonb_build_object('validacao_dias_uteis', public.config_int('sla_validacao_dias_uteis', 2),
      'retorno_parceiro_dias_uteis', public.config_int('sla_retorno_parceiro_dias_uteis', 5),
      'atualizacao_dias', public.config_int('sla_atualizacao_dias', 15),
      'parceiro_contato_dias_uteis', public.config_int('sla_parceiro_contato_dias_uteis', 2),
      'parceiro_atualizacao_dias_uteis', public.config_int('sla_parceiro_atualizacao_dias_uteis', 5)),
    'regua', (select jsonb_agg(jsonb_build_object('chave', chave, 'descricao', descricao) order by chave) from public.regua_atendimento where chave like 'pacote:%'),
    'desligamento', jsonb_build_object('dias_assinatura', public.config_int('risco_dias_assinatura', 180),
      'janela_dias', public.config_int('risco_janela_dias', 180), 'intervalo_tentativas', public.config_int('retomada_intervalo_dias', 15),
      'espera_dias', public.config_int('retomada_espera_dias', 30), 'aviso_dias', public.config_int('aviso_desligamento_dias', 30)),
    'ranking', public.config('pontos_ranking'),
    'premiacao', public.config('categorias_premiacao'),
    'revisao', jsonb_build_object('janela_dias', public.config_int('janela_resultado_dias', 180), 'isencao_dias', public.config_int('isencao_revisao_dias', 180)))
$$;

-- ---------------------------------------------------------------------------
-- 5. Jornada para quem está logado (aba Conhecer a Wise Makers): preços e a regra de comissão da Wise
-- ---------------------------------------------------------------------------
create or replace function public.jornada_wise() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'diagnostico', c.valor_diagnostico + c.valor_hub, 'preco_mes1', c.preco_mes1, 'preco_mes1_tabela', c.preco_mes1_tabela,
    'preco_mes2', c.preco_mes2, 'preco_continuidade', c.preco_continuidade,
    'pct_pontual', e.pct_parceiro_pontual, 'pct_continuo', e.pct_parceiro)
  from public.config_landing_cliente c, public.empresas_grupo e
  where c.id = 1 and e.codigo = 'wise'
$$;
revoke execute on function public.jornada_wise() from public, anon;
grant execute on function public.jornada_wise() to authenticated;
