-- Contas de demonstração (26/11/2026): uma conta fictícia por tipo de acesso, na produção, para o administrador e o gerente
-- abrirem o portal pelo Ver como. Pedido do patrocinador, com a marca de demonstração como condição: as empresas e as pessoas
-- marcadas ficam fora dos painéis, do ranking, da carteira, das filas, das rotinas e dos e-mails para quem é do time real
-- e para as rotinas automáticas. Quem está numa conta de demonstração (inclusive pelo Ver como) vê tudo normalmente.

alter table public.parceiros add column if not exists demonstracao boolean not null default false;
alter table public.perfis add column if not exists demonstracao boolean not null default false;
comment on column public.parceiros.demonstracao is 'Empresa fictícia para o Ver como: fora dos números, das listas e das rotinas para o time real';
comment on column public.perfis.demonstracao is 'Conta fictícia para o Ver como: sem e-mails, fora das listas do time real';

-- Quem está usando o portal agora é uma conta de demonstração?
create or replace function public.contexto_demonstracao() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select demonstracao from public.perfis where id = auth.uid()), false)
$$;

-- Registro de demonstração que não deve aparecer no contexto atual
create or replace function public.oculto_demo(p_demonstracao boolean) returns boolean
language sql stable set search_path = public as $$
  select coalesce(p_demonstracao, false) and not public.contexto_demonstracao()
$$;
create or replace function public.oculto_demo_parceiro(p_parceiro uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select demonstracao from public.parceiros where id = p_parceiro), false) and not public.contexto_demonstracao()
$$;

-- Fontes filtradas usadas pelos painéis, filas e rotinas (o formato é o da tabela, então "select *" e %rowtype continuam valendo)
create or replace function public.parceiros_visiveis() returns setof public.parceiros
language sql stable set search_path = public as $$
  select * from public.parceiros where not public.oculto_demo(demonstracao)
$$;
create or replace function public.perfis_visiveis() returns setof public.perfis
language sql stable set search_path = public as $$
  select * from public.perfis where not public.oculto_demo(demonstracao)
$$;
-- Sem revogar: as funções são de quem chama (security invoker), então a regra de acesso da tabela continua valendo

-- Telas: o time real não vê as empresas, os membros nem as pessoas de demonstração
create policy parceiros_sem_demonstracao on public.parceiros as restrictive for all to authenticated
  using (not public.oculto_demo(demonstracao)) with check (not public.oculto_demo(demonstracao));
create policy perfis_sem_demonstracao on public.perfis as restrictive for all to authenticated
  using (not public.oculto_demo(demonstracao) or id = auth.uid()) with check (not public.oculto_demo(demonstracao) or id = auth.uid());
create policy membros_sem_demonstracao on public.membros_comunidade as restrictive for all to authenticated
  using (not public.oculto_demo_parceiro(parceiro_id)) with check (not public.oculto_demo_parceiro(parceiro_id));

-- A marca só muda pelo administrador ou pelo sistema
create or replace function public.trg_protege_demonstracao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.demonstracao is distinct from old.demonstracao and auth.uid() is not null and not public.is_admin() then
    raise exception 'Somente administradores alteram a marca de demonstração.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger t_protege_demonstracao before update of demonstracao on public.parceiros for each row execute function public.trg_protege_demonstracao();
create trigger t_protege_demonstracao before update of demonstracao on public.perfis for each row execute function public.trg_protege_demonstracao();

-- E-mail nunca sai para conta de demonstração (o aviso fica só dentro do portal)
create or replace function public.trg_notificacao_demonstracao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.usuario_id is not null and exists (select 1 from public.perfis where id = new.usuario_id and demonstracao) then
    new.enviar_email := false;
  end if;
  return new;
end $$;
create trigger t_notificacao_demonstracao before insert on public.notificacoes for each row execute function public.trg_notificacao_demonstracao();

-- Ver como: a lista mostra a marca
drop function if exists public.contas_para_ver_como();
create function public.contas_para_ver_como()
returns table (perfil_id uuid, nome text, email text, papel text, responsavel boolean, ativo boolean, parceiro_id uuid, empresa text,
               tipo text, ultimo_acesso timestamptz, ultima_visualizacao timestamptz, demonstracao boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.papel, p.is_responsavel_parceiro, p.ativo, p.parceiro_id, x.nome_fantasia,
         public.tipo_acesso(p), u.last_sign_in_at,
         (select max(h.created_at) from public.historico h where h.tabela = 'perfis' and h.registro_id = p.id and h.campo = 'ver como'),
         p.demonstracao
    from public.perfis p
    left join public.parceiros x on x.id = p.parceiro_id
    left join auth.users u on u.id = p.id
   where public.is_parcerias() and p.papel <> 'admin'
   order by public.tipo_acesso(p), p.demonstracao, x.nome_fantasia nulls first, p.nome
$$;
revoke execute on function public.contas_para_ver_como() from public, anon;
grant execute on function public.contas_para_ver_como() to authenticated;

-- Painéis, filas, rotinas, ranking, comunicados, pesquisas e catálogo: mesmas funções, lendo as fontes filtradas.
-- Texto gerado a partir das definições em produção (pg_get_functiondef), trocando public.parceiros por public.parceiros_visiveis()
-- nas leituras e public.perfis por public.perfis_visiveis() no resumo diário; a rotina diária não recalcula o status das empresas
-- de demonstração.
CREATE OR REPLACE FUNCTION public._indicadores_valores(p_ini date, p_fim date, p_admin boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v jsonb := '{}';
  v_assin int; v_cad int;
  v_res jsonb;
  v_ind int; v_reun int; v_prop int; v_fech int;
  v_sla_tot int; v_sla_ok int;
  v_ativos int;
  v_plan int; v_plan90 int;
  v_marcos int; v_marcos_ok int;
  v_cp int; v_cp_ok int;
  v_reg int; v_reg_ok int;
begin
  -- Captação
  select count(*) filter (where data_assinatura is not null and not public.is_etapa_perda(etapa)) into v_assin from public.parceiros_visiveis();
  select count(*) into v_cad from public.parceiros_visiveis() where created_at::date between p_ini and p_fim;
  v := v || jsonb_build_object(
    'assinados', (select count(*) from public.parceiros_visiveis() where data_assinatura between p_ini and p_fim and not public.is_etapa_perda(etapa)),
    'assinados_total', v_assin,
    'conversao_recrutamento', (select case when count(*) > 0 then round(count(*) filter (where data_assinatura is not null)::numeric * 100 / count(*), 1) end
                               from public.parceiros_visiveis() where tipo_parceria = 'comercial' and etapa <> 'sem_contato'),
    'conversao_origem', (select coalesce(jsonb_object_agg(o, jsonb_build_object('cadastrados', c, 'assinados', a)), '{}') from (
                           select coalesce(origem_tipo, 'nao_informada') o, count(*) c, count(*) filter (where data_assinatura is not null) a
                           from public.parceiros_visiveis() group by 1) x),
    'tempo_ate_assinatura', (select round(avg(data_assinatura - created_at::date)) from public.parceiros_visiveis() where data_assinatura between p_ini and p_fim),
    'nota_scorecard', (select round(avg(s.nota_potencial), 1) from public.parceiros_visiveis() p cross join lateral public.scorecard_vigente(p.id) s where s.completo),
    'perdas_motivo', (select coalesce(jsonb_object_agg(etapa, n), '{}') from (select etapa, count(*) n from public.parceiros_visiveis() where public.is_etapa_perda(etapa) group by 1) x),
    'em_nutricao', (select count(*) from public.parceiros_visiveis() where etapa = 'nutricao'),
    'negociacoes_paradas', (select count(*) from public.parceiros_visiveis() p where public.negociacao_parada(p.etapa, p.etapa_desde)));

  -- Onboarding
  select count(*), count(*) filter (where situacao = 'ativado' and dias_ate_ativacao <= public.config_int('onboarding_dias', 90))
    into v_plan, v_plan90 from public.planos_onboarding where prazo_final <= public.hoje() or situacao = 'ativado';
  select count(*), count(*) filter (where cumprido_em is not null and cumprido_em <= prazo) into v_marcos, v_marcos_ok
    from public.marcos_onboarding where prazo <= public.hoje();
  v := v || jsonb_build_object(
    'ativados', (select count(*) from public.planos_onboarding where ativado_em between p_ini and p_fim),
    'tempo_primeira_indicacao', (select round(avg(dias_ate_primeira_indicacao)) from public.planos_onboarding where primeira_indicacao_em between p_ini and p_fim),
    'tempo_ativacao', (select round(avg(dias_ate_ativacao)) from public.planos_onboarding where ativado_em between p_ini and p_fim),
    'marcos_cumpridos', case when v_marcos > 0 then round(v_marcos_ok::numeric * 100 / v_marcos, 1) end,
    'pessoas_certificadas', (select count(distinct c.perfil_id) from public.certificados c join public.perfis pf on pf.id = c.perfil_id where c.ativo and pf.ativo),
    'ativados_90', case when v_plan > 0 then round(v_plan90::numeric * 100 / v_plan, 1) end,
    'nao_ativados', (select count(*) from public.planos_onboarding where situacao = 'nao_ativado'));

  -- Relacionamento
  select count(*) filter (where status_atividade = 'ativo') into v_ativos from public.parceiros_visiveis()
   where data_assinatura is not null and not public.is_etapa_perda(etapa);
  select count(*), count(*) filter (where estado <> 'atrasada') into v_cp, v_cp_ok from public.v_acoes_conjuntas where ativa and data_prevista <= public.hoje();
  select count(*), count(*) filter (where not (public.regua_status(id)->>'atrasada')::boolean)
    into v_reg, v_reg_ok from public.parceiros_visiveis() p where (public.regua_status(p.id)->>'aplica')::boolean;
  v := v || jsonb_build_object(
    'ativos_sobre_assinados', case when v_assin > 0 then round(v_ativos::numeric * 100 / v_assin, 1) end,
    'nps', public.nps(p_ini, p_fim),
    'regua_em_dia', case when v_reg > 0 then round(v_reg_ok::numeric * 100 / v_reg, 1) end,
    'acoes_em_dia', case when v_cp > 0 then round(v_cp_ok::numeric * 100 / v_cp, 1) end,
    'distribuicao_nivel', (select coalesce(jsonb_object_agg(coalesce(nivel, 'sem'), n), '{}') from (
                             select nivel, count(*) n from public.parceiros_visiveis() where data_assinatura is not null and not public.is_etapa_perda(etapa)
                             and tipo_parceria = 'comercial' group by 1) x),
    'distribuicao_faixa', (select coalesce(jsonb_object_agg(faixa, n), '{}') from (select faixa, count(*) n from public.faixas group by 1) x),
    'saida_parceiros', (select count(*) from public.parceiros_visiveis() where data_encerramento between p_ini and p_fim),
    'em_observacao', (select count(*) from public.parceiros_visiveis() where em_observacao_ate is not null),
    'em_risco', (select count(*) from public.fluxos_desligamento where estado in ('em_risco', 'tentativa_1', 'tentativa_2', 'sugerido')),
    'propostas_rebaixamento', (select count(*) from public.revisoes_nivel where resultado = 'proposta_rebaixamento' and decisao is null));

  -- Produção
  select count(*), count(*) filter (where data_reuniao is not null), count(*) filter (where etapa in ('proposta', 'fechada')),
         count(*) filter (where etapa = 'fechada')
    into v_ind, v_reun, v_prop, v_fech
  from public.indicacoes where sentido = 'parceiro_para_grupo' and data between p_ini and p_fim;
  select count(*), count(*) filter (where cardinality(public.sla_vencidos(i)) = 0)
    into v_sla_tot, v_sla_ok from public.indicacoes i where i.data between p_ini and p_fim;
  v := v || jsonb_build_object(
    'clientes_icp', (select count(*) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                     and coalesce(icp_confirmado, aderente_icp, false) and data_fechamento between p_ini and p_fim),
    'conversao_indicacoes', jsonb_build_object('indicacoes', v_ind, 'reunioes', v_reun, 'propostas', v_prop, 'vendas', v_fech),
    'indicacoes_sla', case when v_sla_tot > 0 then round(v_sla_ok::numeric * 100 / v_sla_tot, 1) end,
    'ciclo_venda', jsonb_build_object(
      'parceiro', (select round(avg(data_fechamento - data)) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                   and data_fechamento between p_ini and p_fim),
      'direta', (select nullif(valor #>> '{}', 'null')::numeric from public.configuracoes where chave = 'ciclo_venda_direta_dias')),
    'clientes_ativos_checagem', (select jsonb_build_object(
      'ativos_6m', count(*) filter (where marco = '6m' and cliente_ativo), 'checados_6m', count(*) filter (where marco = '6m' and registrada_em is not null),
      'ativos_12m', count(*) filter (where marco = '12m' and cliente_ativo), 'checados_12m', count(*) filter (where marco = '12m' and registrada_em is not null),
      'satisfacao', round(avg(satisfacao), 1)) from public.checagens_cliente),
    'eficiencia_vendas', case when v_ativos > 0 then round(v_fech::numeric / v_ativos, 2) end,
    'indicacoes_por_parceiro', case when v_assin > 0 then round(v_ind::numeric / v_assin, 2) end,
    'nota_qualidade', (select round(avg(nota_qualidade), 1) from public.indicacoes where data between p_ini and p_fim));

  -- Resultado do canal (só administradores)
  if p_admin then
    v_res := public._metricas_canal((select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public._planilha_custos(p_ini, p_fim) x),
                                    public.config_num('margem_contribuicao_pct', 100) / 100);
    v := v || jsonb_build_object(
      'roi', v_res->'roi',
      'custo_total_tipo', jsonb_build_object('horas', v_res->'custo_horas', 'comissoes', (v_res->>'comissoes_parceiro')::numeric + (v_res->>'comissoes_responsavel')::numeric,
                                            'diretos', v_res->'custos_diretos', 'total', v_res->'custo_total'),
      'custo_por_cliente', v_res->'custo_por_cliente',
      'tempo_retorno', v_res->'tempo_retorno_meses',
      'horas_parceiro_etapa', (select coalesce(jsonb_object_agg(coalesce(etapa_jornada, 'sem_etapa'), h), '{}') from (
                                 select etapa_jornada, round(sum(minutos) / 60.0, 1) h from public.atividades where data between p_ini and p_fim group by 1) x),
      'receita_atribuida', v_res->'receita_atribuida',
      'participacao_receita', case when public.config_num('receita_nova_wise_periodo', 0) > 0
                                   then round((v_res->>'receita_atribuida')::numeric * 100 / public.config_num('receita_nova_wise_periodo', 0), 1) end,
      'receita_por_nivel', (select coalesce(jsonb_object_agg(y.nivel, y.s), '{}') from (
                              select coalesce(p.nivel, 'sem') as nivel, sum(x.valor) s from public._planilha_custos(p_ini, p_fim) x
                              join public.parceiros_visiveis() p on p.id = x.parceiro_id where x.tipo_linha = 'receita' group by 1) y));
  end if;
  return v;
end $function$;

CREATE OR REPLACE FUNCTION public._valor_criterio(p_indicador text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case p_indicador
    when 'assinados' then (select count(*) from public.parceiros_visiveis() where data_assinatura is not null and not public.is_etapa_perda(etapa))
    when 'ativados' then (select count(*) from public.planos_onboarding where situacao = 'ativado')
    when 'clientes_icp' then (select count(*) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                              and coalesce(icp_confirmado, aderente_icp, false))
    when 'respostas_pesquisa' then (select count(*) from public.pesquisas_satisfacao)
    when 'clientes_ativos_6m_pct' then (select case when count(*) filter (where registrada_em is not null) > 0
                                          then round(count(*) filter (where cliente_ativo)::numeric * 100 / count(*) filter (where registrada_em is not null), 1) end
                                        from public.checagens_cliente where marco = '6m')
  end::numeric
$function$;

CREATE OR REPLACE FUNCTION public.aplicar_pacotes_pendentes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; n int := 0;
begin
  for r in select * from public.parceiros_visiveis() where pacote_pendente is not null and pacote_pendente_em <= public.hoje() loop
    update public.contrapartidas c set ativa = false
      from public.catalogo_contrapartidas k
     where c.catalogo_id = k.id and c.parceiro_id = r.id and not (r.pacote_pendente = any (k.pacotes));
    update public.acoes_wise a set ativa = false, estado = case when a.estado in ('planejada', 'atrasada') then 'cancelada' else a.estado end
      from public.catalogo_acoes_wise k
     where a.catalogo_id = k.id and a.parceiro_id = r.id and not (r.pacote_pendente = any (k.pacotes));
    update public.parceiros set pacote = pacote_pendente, pacote_pendente = null, pacote_pendente_em = null, pacote_pendente_motivo = null
     where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.avaliar_desligamentos()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record;
  n int := 0;
  v_fluxo uuid;
  v_espera int := public.config_int('retomada_espera_dias', 30);
begin
  for r in select p.id, p.nome_fantasia, p.responsavel_id from public.parceiros_visiveis() p
           where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
             and not exists (select 1 from public.fluxos_desligamento f where f.parceiro_id = p.id and f.estado not in ('encerrado', 'cancelado')) loop
    if public.parceiro_em_risco(r.id) then
      insert into public.fluxos_desligamento (parceiro_id, tipo, estado, em_risco_em, tentativa_1_em)
      values (r.id, 'inatividade', 'tentativa_1', public.hoje(), public.hoje()) returning id into v_fluxo;
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id)
      values (r.id, 'Tentativa de retomada: propor uma reunião para retomar a parceria', public.hoje() + 2, r.responsavel_id);
      perform public.notificar_responsavel(r.id, 'parceiro_em_risco', 'Parceiro em risco',
        format('%s está há 180 dias sem indicação qualificada nem contrapartida comprovada. A primeira tentativa de retomada foi criada.', r.nome_fantasia),
        '/app/parceiros/' || r.id || '?aba=desligamento');
      n := n + 1;
    end if;
  end loop;

  -- Segunda tentativa há 30 dias sem resposta: sugere o desligamento ao Diretor
  for r in select f.*, p.nome_fantasia from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
           where f.estado = 'tentativa_2' and f.tentativa_2_em <= public.hoje() - v_espera loop
    if not exists (select 1 from public.indicacoes i where i.parceiro_id = r.parceiro_id and i.created_at::date > r.tentativa_2_em)
       and not exists (select 1 from public.comprovacoes c where c.parceiro_id = r.parceiro_id and c.created_at::date > r.tentativa_2_em) then
      update public.fluxos_desligamento set estado = 'sugerido', sugerido_em = public.hoje() where id = r.id;
      perform public.notificar_diretores('desligamento_para_aprovar', 'Desligamento sugerido',
        format('%s não respondeu às duas tentativas de retomada. O desligamento aguarda a sua decisão.', r.nome_fantasia),
        '/app/parceiros/' || r.parceiro_id || '?aba=desligamento');
    end if;
  end loop;

  -- Encerramento na data do aviso
  for r in select f.*, p.nome_fantasia from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
           where f.estado = 'avisado' and f.data_encerramento <= public.hoje() loop
    perform public.encerrar_parceria(r.id);
  end loop;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.calcular_faixas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_n int;
  v_dest int;
  v_pot int;
  v_ini date := date_trunc('year', public.hoje())::date;
begin
  delete from public.faixas;
  with base as (
    select p.id, p.data_assinatura,
           coalesce((select sum(pontos) from public.pontos_ranking r where r.parceiro_id = p.id and r.data >= v_ini), 0)::int as pts,
           coalesce((select count(*) from public.pontos_ranking r where r.parceiro_id = p.id and r.data >= v_ini and r.evento = 'cliente_icp'), 0)::int as cli
    from public.parceiros_visiveis() p
    where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
  ), ord as (
    select *, row_number() over (order by pts desc, cli desc, data_assinatura nulls last, id)::int as pos, count(*) over ()::int as total
    from base
  )
  insert into public.faixas (parceiro_id, faixa, pontos_ano, posicao)
  select id,
         case when pts > 0 and pos <= greatest(1, floor(total * public.config_num('faixa_destaque_pct', 5) / 100)) then 'destaque'
              when pts > 0 and pos <= greatest(1, floor(total * public.config_num('faixa_destaque_pct', 5) / 100))
                                      + greatest(1, floor(total * public.config_num('faixa_potencial_pct', 15) / 100)) then 'potencial'
              else 'base' end,
         pts, pos
  from ord;
  get diagnostics v_n = row_count;
  return v_n;
end $function$;

CREATE OR REPLACE FUNCTION public.catalogo_hub()
 RETURNS TABLE(oferta_id uuid, titulo text, descricao text, para_quem text, condicao text, como_usar text, validade date, parceiro_id uuid, empresa text, site text, cliente_grupo boolean, categoria text, categorias text[], propria boolean, liberada boolean, logo_caminho text, cidade text, uf text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with acesso as (select public.is_interno() or public.pode_ver_catalogo() as ver, public.parceiro_atual() as eu)
  select o.id, o.titulo, o.descricao, o.para_quem,
         case when a.ver or p.id = a.eu then o.condicao end,
         case when a.ver or p.id = a.eu then o.como_usar end,
         o.validade, p.id, p.nome_fantasia, p.site, p.cliente_grupo, c.nome,
         coalesce((select array_agg(c2.nome order by pc.principal desc, c2.nome) from public.parceiro_categorias pc join public.categorias c2 on c2.id = pc.categoria_id
                    where pc.parceiro_id = p.id), '{}'),
         p.id = a.eu, a.ver or p.id = a.eu, p.logo_caminho, p.cidade, p.uf
    from acesso a, public.ofertas_hub o join public.parceiros_visiveis() p on p.id = o.parceiro_id left join public.categorias c on c.id = o.categoria_id
   where (public.is_interno() or a.eu is not null)
     and o.estado = 'publicada' and (o.validade is null or o.validade >= public.hoje()) and public.pode_ofertar(p.id)
   order by o.validada_em desc nulls last, o.created_at desc
$function$;

CREATE OR REPLACE FUNCTION public.enviar_comunicado(p_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.comunicados;
  r record;
  n int := 0;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.comunicados where id = p_id;
  if c.enviado_em is not null then raise exception 'Comunicado já enviado.' using errcode = 'P0001'; end if;
  for r in
    select pf.id as perfil_id, p.id as parceiro_id from public.perfis pf join public.parceiros_visiveis() p on p.id = pf.parceiro_id
    where pf.ativo and pf.papel = 'parceiro' and public.parceiro_assinado(p.id)
      and (coalesce(jsonb_array_length(c.recorte->'niveis'), 0) = 0 or p.nivel in (select jsonb_array_elements_text(c.recorte->'niveis')))
      and (coalesce(jsonb_array_length(c.recorte->'pacotes'), 0) = 0 or p.pacote in (select jsonb_array_elements_text(c.recorte->'pacotes')))
      and (coalesce(jsonb_array_length(c.recorte->'tipos'), 0) = 0 or p.tipo_parceria in (select jsonb_array_elements_text(c.recorte->'tipos')))
      and (coalesce(jsonb_array_length(c.recorte->'categorias'), 0) = 0 or exists (
            select 1 from public.parceiro_categorias pc where pc.parceiro_id = p.id
            and pc.categoria_id::text in (select jsonb_array_elements_text(c.recorte->'categorias'))))
  loop
    insert into public.comunicado_leituras (comunicado_id, perfil_id, parceiro_id) values (c.id, r.perfil_id, r.parceiro_id) on conflict do nothing;
    perform public.notificar(r.perfil_id, 'comunicado', c.titulo, left(c.corpo, 500), '/parceiro/comunicados', jsonb_build_object('comunicado_id', c.id), true);
    n := n + 1;
  end loop;
  update public.comunicados set enviado_em = now(), enviado_por = auth.uid() where id = c.id;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.enviar_pesquisa_trimestral()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; n int := 0;
begin
  for r in select pf.id from public.perfis pf join public.parceiros_visiveis() p on p.id = pf.parceiro_id
           where pf.ativo and pf.papel = 'parceiro' and public.parceiro_assinado(p.id) loop
    perform public.notificar(r.id, 'pesquisa_satisfacao', 'Pesquisa de satisfação do Wise Partners',
      'Conte como está a parceria com a Wise. Leva menos de 1 minuto.', '/parceiro/pesquisa', '{}'::jsonb, true);
    n := n + 1;
  end loop;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.excecoes_abertas()
 RETURNS TABLE(chave text, tipo text, grupo text, prioridade integer, titulo text, detalhe text, parceiro_id uuid, parceiro text, responsavel_id uuid, responsavel text, desde date, prazo date, ref_id uuid, link text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      from public.parceiros_visiveis() p
     where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)
    union all
    select 'desligamento', 'decidir', 1, 'Decidir o desligamento sugerido',
           'Sugerido por ' || case f.tipo when 'inadequacao' then 'inadequação' else 'inatividade' end || '; só o Diretor decide',
           f.parceiro_id, p.responsavel_id, f.sugerido_em::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=desligamento'
      from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado = 'sugerido'
    union all
    select 'rebaixamento', 'decidir', 2, 'Decidir a revisão de nível',
           'Revisão ' || r.trimestre || ': confirmar o rebaixamento ou manter, com motivo',
           r.parceiro_id, p.responsavel_id, r.created_at::date, null, r.id, '/app/parceiros/' || r.parceiro_id || '?aba=nivel'
      from public.revisoes_nivel r join public.parceiros_visiveis() p on p.id = r.parceiro_id
     where r.resultado = 'proposta_rebaixamento' and r.decisao is null
    union all
    select 'comprovacao', 'decidir', 2, 'Validar a comprovação de contrapartida', c.nome,
           x.parceiro_id, p.responsavel_id, x.created_at::date, null, x.id, '/app/parceiros/' || x.parceiro_id || '?aba=contrapartidas'
      from public.comprovacoes x join public.contrapartidas c on c.id = x.contrapartida_id join public.parceiros_visiveis() p on p.id = x.parceiro_id
     where x.estado = 'enviada'
    union all
    select 'ficha', 'decidir', 3, 'Revisar a ficha de apresentação', 'O parceiro propôs alterações na ficha da Prateleira',
           f.parceiro_id, p.responsavel_id, f.created_at::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=ficha'
      from public.propostas_ficha f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado = 'pendente'
    union all
    select 'atualizacao_indicacao', 'decidir', 2, 'Confirmar a atualização da indicação', cl.razao_social,
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.atualizacao_em::date, null, i.id, '/app/indicacoes?id=' || i.id
      from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where i.atualizacao_pendente is not null
    -- Responder -----------------------------------------------------------
    union all
    select 'candidato', 'responder', case when c.status = 'fila' then 1 else 2 end,
           case public.perfil_cadastro(c)
             when 'cliente_grupo' then 'Confirmar o cliente do Grupo Tríade e dar o acesso'
             when 'comunidade' then 'Avaliar a empresa e dar o acesso à comunidade'
             else case c.status when 'fila' then 'Falar com o candidato pelo WhatsApp'
                                when 'contatado' then 'Retomar o candidato sem resposta'
                                else 'Registrar a conversa de entrada' end end,
           c.empresa || case public.perfil_cadastro(c)
             when 'cliente_grupo' then ' · cliente da ' || coalesce((select string_agg(e.nome, ' e da ' order by e.ordem) from public.empresas_grupo e where e.id = any(c.empresas_grupo)), 'empresa do grupo')
             when 'comunidade' then coalesce(' · ' || c.segmento, '')
             else coalesce(' · ' || c.categoria_nome, '') end || case when c.origem = 'comunidade' then ' · pela Comunidade' else '' end,
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
      from public.cadastros_cliente d join public.parceiros_visiveis() p on p.id = d.parceiro_id
     where d.icp and ((d.status in ('cadastrado', 'agenda_liberada') and d.created_at < now() - interval '2 days')
                      or (d.status = 'reuniao_feita' and d.plano_enviado_em is null))
    union all
    select 'sla', 'responder', 1,
           case when count(*) = 1 then 'Indicação com prazo vencido' else count(*) || ' indicações com prazo vencido' end,
           string_agg(coalesce(cl.razao_social, 'Cliente'), '; ' order by i.ultima_atualizacao),
           i.parceiro_id, min(coalesce(i.responsavel_id, p.responsavel_id)::text)::uuid, min(i.ultima_atualizacao)::date, null, i.parceiro_id,
           case when count(*) = 1 then '/app/indicacoes?id=' || min(i.id::text) else '/app/parceiros/' || i.parceiro_id || '?aba=indicacoes' end
      from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where cardinality(public.sla_vencidos(i)) > 0
     group by i.parceiro_id
    union all
    select 'indicacao_parada', 'responder', 2, 'Dar retorno ao parceiro sobre a indicação',
           coalesce(cl.razao_social, 'Cliente') || ': sem atualização há mais de ' || cfg.ip || ' dias',
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.ultima_atualizacao::date, null, i.id, '/app/indicacoes?id=' || i.id
      from cfg, public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - make_interval(days => cfg.ip)
       and cardinality(public.sla_vencidos(i)) = 0
    union all
    select 'checagem', 'responder', 2, 'Checar o cliente aos ' || case c.marco when '6m' then '6' else '12' end || ' meses',
           coalesce(cl.razao_social, 'Cliente'),
           c.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), c.prevista_para, c.prevista_para, c.id, '/app/indicacoes?id=' || c.indicacao_id
      from cfg, public.checagens_cliente c join public.indicacoes i on i.id = c.indicacao_id
      join public.parceiros_visiveis() p on p.id = c.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
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
      from cfg, public.planos_onboarding pl join public.parceiros_visiveis() p on p.id = pl.parceiro_id
      cross join lateral (
        select x.titulo, coalesce((select max(y.feita_em) from public.etapas_onboarding(pl.parceiro_id) y where y.feita)::date,
                                  p.data_assinatura, pl.inicio) as desde
          from public.etapas_onboarding(pl.parceiro_id) x where not x.feita order by x.ordem limit 1) e
     where pl.situacao <> 'nao_ativado' and cfg.hoje - e.desde >= cfg.op
    union all
    select 'negociacao_parada', 'acompanhar', 2, 'Negociação parada', 'Em ' || e.nome || ' desde ' || to_char(p.etapa_desde, 'DD/MM'),
           p.id, p.responsavel_id, p.etapa_desde::date, null, p.id, '/app/parceiros/' || p.id || '?aba=contrato'
      from cfg, public.parceiros_visiveis() p join public.etapas_funil e on e.codigo = p.etapa
     where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, cfg.hoje) >= cfg.cf)
        or (p.etapa = 'proposta_decisor' and cfg.hoje - p.etapa_desde::date >= cfg.pd and public.tem_aprovacao_assinatura(p.id))
    union all
    select 'cadencia', 'acompanhar', 3, 'Falar com o parceiro: cadência de contato passou',
           'Reunião prevista até ' || to_char((s.v->>'proxima_ate')::date, 'DD/MM'),
           p.id, p.responsavel_id, (s.v->>'proxima_ate')::date, (s.v->>'proxima_ate')::date, p.id, '/app/parceiros/' || p.id || '?aba=linha-do-tempo'
      from public.parceiros_visiveis() p cross join lateral (select public.regua_status(p.id) v) s
     where p.data_assinatura is not null and coalesce((s.v->>'atrasada')::boolean, false)
    union all
    select 'acao_wise', 'acompanhar', 2,
           case when count(*) = 1 then 'Ação da Wise atrasada' else count(*) || ' ações da Wise atrasadas' end,
           string_agg(a.nome, '; ' order by a.data_prevista),
           a.parceiro_id, min(coalesce(a.responsavel_id, p.responsavel_id)::text)::uuid, min(a.data_prevista), min(a.data_prevista), a.parceiro_id,
           '/app/parceiros/' || a.parceiro_id || '?aba=acoes'
      from public.acoes_wise a join public.parceiros_visiveis() p on p.id = a.parceiro_id
     where a.ativa and a.estado = 'atrasada'
     group by a.parceiro_id
    union all
    select 'contrapartida', 'acompanhar', 3,
           case when count(*) = 1 then 'Contrapartida do parceiro atrasada' else count(*) || ' contrapartidas do parceiro atrasadas' end,
           string_agg(c.nome, '; ' order by c.proxima_data),
           c.parceiro_id, min(p.responsavel_id::text)::uuid, min(c.proxima_data), min(c.proxima_data), c.parceiro_id,
           '/app/parceiros/' || c.parceiro_id || '?aba=contrapartidas'
      from public.contrapartidas c join public.parceiros_visiveis() p on p.id = c.parceiro_id
     where c.ativa and c.estado = 'atrasada'
     group by c.parceiro_id
    union all
    select 'oferta_validar', 'decidir', 2, 'Validar a oferta do catálogo', o.titulo || ' · condição: ' || o.condicao,
           o.parceiro_id, p.responsavel_id, o.updated_at::date, o.updated_at::date + 2, o.id, '/app/catalogo?aba=validar'
      from public.ofertas_hub o join public.parceiros_visiveis() p on p.id = o.parceiro_id
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
      from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado in ('em_risco', 'tentativa_1', 'tentativa_2')
  )
  select i.tipo || ':' || i.ref_id, i.tipo, i.grupo, i.prioridade, i.titulo, i.detalhe,
         i.parceiro_id, p.nome_fantasia, i.responsavel_id, r.nome, i.desde, i.prazo, i.ref_id, i.link
    from itens i
    left join public.parceiros_visiveis() p on p.id = i.parceiro_id
    left join public.perfis r on r.id = i.responsavel_id
   order by i.prioridade, coalesce(i.prazo, i.desde) nulls last, i.titulo;
$function$;

CREATE OR REPLACE FUNCTION public.fila_tarefas()
 RETURNS TABLE(chave text, tipo text, grupo text, prioridade integer, titulo text, detalhe text, parceiro_id uuid, parceiro text, responsavel_id uuid, responsavel text, desde date, prazo date, ref_id uuid, link text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      from public.parceiros_visiveis() p
     where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)
    union all
    select 'desligamento', 'decidir', 1, 'Decidir o desligamento sugerido',
           'Sugerido por ' || case f.tipo when 'inadequacao' then 'inadequação' else 'inatividade' end || '; só o Diretor decide',
           f.parceiro_id, p.responsavel_id, f.sugerido_em::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=desligamento'
      from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado = 'sugerido'
    union all
    select 'rebaixamento', 'decidir', 2, 'Decidir a revisão de nível',
           'Revisão ' || r.trimestre || ': confirmar o rebaixamento ou manter, com motivo',
           r.parceiro_id, p.responsavel_id, r.created_at::date, null, r.id, '/app/parceiros/' || r.parceiro_id || '?aba=nivel'
      from public.revisoes_nivel r join public.parceiros_visiveis() p on p.id = r.parceiro_id
     where r.resultado = 'proposta_rebaixamento' and r.decisao is null
    union all
    select 'comprovacao', 'decidir', 2, 'Validar a comprovação de contrapartida', c.nome,
           x.parceiro_id, p.responsavel_id, x.created_at::date, null, x.id, '/app/parceiros/' || x.parceiro_id || '?aba=contrapartidas'
      from public.comprovacoes x join public.contrapartidas c on c.id = x.contrapartida_id join public.parceiros_visiveis() p on p.id = x.parceiro_id
     where x.estado = 'enviada'
    union all
    select 'ficha', 'decidir', 3, 'Revisar a ficha de apresentação', 'O parceiro propôs alterações na ficha da Prateleira',
           f.parceiro_id, p.responsavel_id, f.created_at::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=ficha'
      from public.propostas_ficha f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado = 'pendente'
    union all
    select 'atualizacao_indicacao', 'decidir', 2, 'Confirmar a atualização da indicação', cl.razao_social,
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.atualizacao_em::date, null, i.id, '/app/indicacoes?id=' || i.id
      from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
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
      from public.cadastros_cliente d join public.parceiros_visiveis() p on p.id = d.parceiro_id
     where d.icp and ((d.status in ('cadastrado', 'agenda_liberada') and d.created_at < now() - interval '2 days')
                      or (d.status = 'reuniao_feita' and d.plano_enviado_em is null))
    union all
    select 'sla', 'responder', 1,
           case when count(*) = 1 then 'Indicação com prazo vencido' else count(*) || ' indicações com prazo vencido' end,
           string_agg(coalesce(cl.razao_social, 'Cliente'), '; ' order by i.ultima_atualizacao),
           i.parceiro_id, min(coalesce(i.responsavel_id, p.responsavel_id)::text)::uuid, min(i.ultima_atualizacao)::date, null, i.parceiro_id,
           case when count(*) = 1 then '/app/indicacoes?id=' || min(i.id::text) else '/app/parceiros/' || i.parceiro_id || '?aba=indicacoes' end
      from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where cardinality(public.sla_vencidos(i)) > 0
     group by i.parceiro_id
    union all
    select 'indicacao_parada', 'responder', 2, 'Dar retorno ao parceiro sobre a indicação',
           coalesce(cl.razao_social, 'Cliente') || ': sem atualização há mais de ' || cfg.ip || ' dias',
           i.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), i.ultima_atualizacao::date, null, i.id, '/app/indicacoes?id=' || i.id
      from cfg, public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
     where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - make_interval(days => cfg.ip)
       and cardinality(public.sla_vencidos(i)) = 0
    union all
    select 'checagem', 'responder', 2, 'Checar o cliente aos ' || case c.marco when '6m' then '6' else '12' end || ' meses',
           coalesce(cl.razao_social, 'Cliente'),
           c.parceiro_id, coalesce(i.responsavel_id, p.responsavel_id), c.prevista_para, c.prevista_para, c.id, '/app/indicacoes?id=' || c.indicacao_id
      from cfg, public.checagens_cliente c join public.indicacoes i on i.id = c.indicacao_id
      join public.parceiros_visiveis() p on p.id = c.parceiro_id left join public.clientes cl on cl.id = i.cliente_id
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
      from cfg, public.planos_onboarding pl join public.parceiros_visiveis() p on p.id = pl.parceiro_id
      cross join lateral (
        select x.titulo, coalesce((select max(y.feita_em) from public.etapas_onboarding(pl.parceiro_id) y where y.feita)::date,
                                  p.data_assinatura, pl.inicio) as desde
          from public.etapas_onboarding(pl.parceiro_id) x where not x.feita order by x.ordem limit 1) e
     where pl.situacao <> 'nao_ativado' and cfg.hoje - e.desde >= cfg.op
    union all
    select 'negociacao_parada', 'acompanhar', 2, 'Negociação parada', 'Em ' || e.nome || ' desde ' || to_char(p.etapa_desde, 'DD/MM'),
           p.id, p.responsavel_id, p.etapa_desde::date, null, p.id, '/app/parceiros/' || p.id || '?aba=contrato'
      from cfg, public.parceiros_visiveis() p join public.etapas_funil e on e.codigo = p.etapa
     where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, cfg.hoje) >= cfg.cf)
        or (p.etapa = 'proposta_decisor' and cfg.hoje - p.etapa_desde::date >= cfg.pd and public.tem_aprovacao_assinatura(p.id))
    union all
    select 'cadencia', 'acompanhar', 3, 'Falar com o parceiro: cadência de contato passou',
           'Reunião prevista até ' || to_char((s.v->>'proxima_ate')::date, 'DD/MM'),
           p.id, p.responsavel_id, (s.v->>'proxima_ate')::date, (s.v->>'proxima_ate')::date, p.id, '/app/parceiros/' || p.id || '?aba=linha-do-tempo'
      from public.parceiros_visiveis() p cross join lateral (select public.regua_status(p.id) v) s
     where p.data_assinatura is not null and coalesce((s.v->>'atrasada')::boolean, false)
    union all
    select 'acao_wise', 'acompanhar', 2,
           case when count(*) = 1 then 'Ação da Wise atrasada' else count(*) || ' ações da Wise atrasadas' end,
           string_agg(a.nome, '; ' order by a.data_prevista),
           a.parceiro_id, min(coalesce(a.responsavel_id, p.responsavel_id)::text)::uuid, min(a.data_prevista), min(a.data_prevista), a.parceiro_id,
           '/app/parceiros/' || a.parceiro_id || '?aba=acoes'
      from public.acoes_wise a join public.parceiros_visiveis() p on p.id = a.parceiro_id
     where a.ativa and a.estado = 'atrasada'
     group by a.parceiro_id
    union all
    select 'contrapartida', 'acompanhar', 3,
           case when count(*) = 1 then 'Contrapartida do parceiro atrasada' else count(*) || ' contrapartidas do parceiro atrasadas' end,
           string_agg(c.nome, '; ' order by c.proxima_data),
           c.parceiro_id, min(p.responsavel_id::text)::uuid, min(c.proxima_data), min(c.proxima_data), c.parceiro_id,
           '/app/parceiros/' || c.parceiro_id || '?aba=contrapartidas'
      from public.contrapartidas c join public.parceiros_visiveis() p on p.id = c.parceiro_id
     where c.ativa and c.estado = 'atrasada'
     group by c.parceiro_id
    union all
    select 'em_risco', 'acompanhar', 1, 'Retomar o parceiro em risco',
           case f.estado when 'em_risco' then 'Em risco de desligamento' when 'tentativa_1' then 'Primeira tentativa de retomada feita'
                         else 'Segunda tentativa de retomada feita' end,
           f.parceiro_id, p.responsavel_id, f.created_at::date, null, f.id, '/app/parceiros/' || f.parceiro_id || '?aba=desligamento'
      from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
     where f.estado in ('em_risco', 'tentativa_1', 'tentativa_2')
  )
  select i.tipo || ':' || i.ref_id, i.tipo, i.grupo, i.prioridade, i.titulo, i.detalhe,
         i.parceiro_id, p.nome_fantasia, i.responsavel_id, r.nome, i.desde, i.prazo, i.ref_id, i.link
    from itens i
    left join public.parceiros_visiveis() p on p.id = i.parceiro_id
    left join public.perfis r on r.id = i.responsavel_id
   where public.is_parcerias()
      or (public.is_financeiro() and i.tipo = 'comissao')
      or (public.is_consultor() and i.tipo in ('diagnostico', 'proximo_passo', 'tarefa_onboarding', 'checagem', 'acao_wise', 'sla',
                                                'indicacao_parada', 'atualizacao_indicacao', 'comprovacao', 'em_risco', 'cadencia'))
      or (public.is_interno_leitura() and i.responsavel_id = auth.uid() and i.tipo in ('sla', 'indicacao_parada', 'checagem', 'proximo_passo'))
   order by i.prioridade, coalesce(i.prazo, i.desde) nulls last, i.titulo;
$function$;

CREATE OR REPLACE FUNCTION public.funil_reverso(p_trimestre text DEFAULT NULL::text, p_perfil uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ini date; v_fim date;
  v_meta numeric; v_assin int; v_faltam numeric; v_proj numeric; v_lacuna numeric;
  v_etapas jsonb;
  v_ch_reun numeric := (select chance_assinatura from public.etapas_funil where codigo = 'reuniao_realizada');
  v_ch_cont numeric := (select chance_assinatura from public.etapas_funil where codigo = 'contato_feito');
begin
  if auth.uid() is not null and not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_perfil is not null and auth.uid() is not null and not (public.is_admin() or p_perfil = auth.uid()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select inicio, fim into v_ini, v_fim from public.trimestre_datas(v_tri);
  v_meta := case when p_perfil is null
    then (select valor from public.metas where indicador_chave = 'assinados' and periodo = v_tri)
    else (select valor from public.metas_pessoa where perfil_id = p_perfil and trimestre = v_tri and indicador = 'assinados') end;
  select count(*) into v_assin from public.parceiros_visiveis() p
   where p.data_assinatura between v_ini and v_fim and not public.is_etapa_perda(p.etapa)
     and (p_perfil is null or public.responsavel_em(p.id, p.data_assinatura) = p_perfil);
  select coalesce(jsonb_agg(jsonb_build_object('etapa', e.codigo, 'nome', e.nome, 'quantidade', x.n, 'chance', e.chance_assinatura,
           'projecao', round(x.n * e.chance_assinatura / 100, 2), 'prazo_dias_uteis', e.prazo_dias_uteis, 'paradas', x.paradas) order by e.ordem), '[]'),
         coalesce(sum(x.n * e.chance_assinatura / 100), 0)
    into v_etapas, v_proj
    from public.etapas_funil e
    cross join lateral (select count(*) as n, count(*) filter (where public.negociacao_parada(p.etapa, p.etapa_desde)) as paradas
                          from public.parceiros_visiveis() p
                         where p.etapa = e.codigo and p.data_assinatura is null
                           and (p_perfil is null or p.responsavel_id = p_perfil)) x
   where e.chance_assinatura is not null and not e.perda;
  v_faltam := case when v_meta is null then null else greatest(v_meta - v_assin, 0) end;
  v_lacuna := case when v_faltam is null then null else greatest(v_faltam - v_proj, 0) end;
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim,
    'dias_uteis_restantes', case when public.hoje() > v_fim then 0 else public.dias_uteis_entre(greatest(public.hoje(), v_ini), v_fim) end,
    'meta', v_meta, 'assinados', v_assin, 'faltam', v_faltam,
    'projecao', round(v_proj, 1), 'lacuna', round(v_lacuna, 1),
    'reunioes_necessarias', case when v_lacuna > 0 and v_ch_reun > 0 then ceil(v_lacuna * 100 / v_ch_reun) else 0 end,
    'contatos_necessarios', case when v_lacuna > 0 and v_ch_cont > 0 then ceil(v_lacuna * 100 / v_ch_cont) else 0 end,
    'etapas', v_etapas);
end $function$;

CREATE OR REPLACE FUNCTION public.painel_pessoal(p_perfil uuid DEFAULT NULL::uuid, p_trimestre text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_perfil uuid := coalesce(p_perfil, auth.uid());
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ini date; v_fim date;
  v_reg int; v_reg_ok int;
  v_real jsonb;
begin
  if not (public.is_admin() or (public.is_parcerias() and v_perfil = auth.uid())) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select inicio, fim into v_ini, v_fim from public.trimestre_datas(v_tri);
  select count(*), count(*) filter (where not (s.v->>'atrasada')::boolean) into v_reg, v_reg_ok
    from public.parceiros_visiveis() p cross join lateral (select public.regua_status(p.id) v) s
   where p.responsavel_id = v_perfil and coalesce((s.v->>'aplica')::boolean, false);
  v_real := jsonb_build_object(
    'assinados', (select count(*) from public.parceiros_visiveis() p where p.data_assinatura between v_ini and v_fim
                   and not public.is_etapa_perda(p.etapa) and public.responsavel_em(p.id, p.data_assinatura) = v_perfil),
    'ativados', (select count(*) from public.planos_onboarding pl where pl.ativado_em between v_ini and v_fim
                   and public.responsavel_em(pl.parceiro_id, pl.ativado_em) = v_perfil),
    'clientes_icp', (select count(*) from public.indicacoes i where i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada'
                   and coalesce(i.icp_confirmado, i.aderente_icp, false) and i.data_fechamento between v_ini and v_fim
                   and public.responsavel_em(i.parceiro_id, i.data_fechamento) = v_perfil),
    'reunioes', (select count(distinct x.parceiro_id) from (
                   select pc.parceiro_id, (pc.data at time zone 'America/Sao_Paulo')::date as d from public.pontos_contato pc
                    where pc.tipo in ('reuniao_presencial', 'reuniao_online')
                   union all
                   select h.registro_id, (h.created_at at time zone 'America/Sao_Paulo')::date from public.historico h
                    where h.tabela = 'parceiros' and h.campo = 'etapa' and h.valor_novo = 'reuniao_realizada') x
                   join public.parceiros_visiveis() p on p.id = x.parceiro_id
                  where x.d between v_ini and v_fim and (p.data_assinatura is null or p.data_assinatura >= x.d)
                    and public.responsavel_em(p.id, x.d) = v_perfil),
    'regua_em_dia', case when v_reg > 0 then round(v_reg_ok::numeric * 100 / v_reg, 1) end);
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim, 'realizado', v_real,
    'metas', (select coalesce(jsonb_object_agg(indicador, valor), '{}') from public.metas_pessoa where perfil_id = v_perfil and trimestre = v_tri),
    'funil', public.funil_reverso(v_tri, v_perfil),
    'horas', (select round(coalesce(sum(minutos), 0) / 60.0, 1) from public.atividades where pessoa_id = v_perfil and data between v_ini and v_fim),
    'carteira', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                   'nivel', p.nivel, 'status', p.status_atividade, 'regua', public.regua_status(p.id)) order by p.nome_fantasia), '[]')
                 from public.parceiros_visiveis() p where p.responsavel_id = v_perfil and not public.is_etapa_perda(p.etapa)));
end $function$;

CREATE OR REPLACE FUNCTION public.painel_semanal(p_inicio date DEFAULT NULL::date, p_fim date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_ini date := coalesce(p_inicio, public.hoje() - 7);
  v_fim date := coalesce(p_fim, public.hoje());
  res jsonb;
begin
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'trimestre', to_char(public.hoje(), 'YYYY-"T"Q'),
    'meta_assinados', (select valor from public.metas where indicador_chave = 'assinados' and periodo = to_char(public.hoje(), 'YYYY-"T"Q')),
    'funil_reverso', public.funil_reverso(null),
    'assinados_total', (select count(*) from public.parceiros_visiveis() p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
    'assinados', (select count(*) from public.parceiros_visiveis() p where p.data_assinatura >= date_trunc('quarter', public.hoje())::date and not public.is_etapa_perda(p.etapa)),
    'funil', (select coalesce(jsonb_agg(jsonb_build_object('etapa', e.codigo, 'nome', e.nome, 'perda', e.perda,
                     'total', (select count(*) from public.parceiros_visiveis() p where p.etapa = e.codigo)) order by e.ordem), '[]')
              from public.etapas_funil e),
    'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'parceiro_id', x.parceiro_id, 'parceiro', p.nome_fantasia,
                     'descricao', x.descricao, 'data', x.data, 'responsavel_id', x.responsavel_id) order by x.data), '[]')
              from public.proximos_passos x join public.parceiros_visiveis() p on p.id = x.parceiro_id
              where x.estado in ('aberto', 'vencido') and x.data < public.hoje()),
    'esfriando', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'status', p.status_atividade,
                     'ultimo_contato', p.ultimo_contato, 'motivo', p.motivo_inatividade) order by p.ultimo_contato nulls first), '[]')
              from public.parceiros_visiveis() p where p.status_atividade in ('morno', 'dormente') and not public.is_etapa_perda(p.etapa)),
    'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                     'desde', p.etapa_desde::date)), '[]')
              from public.parceiros_visiveis() p
              where public.negociacao_parada(p.etapa, p.etapa_desde)),
    'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'parceiro_id', p.id, 'parceiro', p.nome_fantasia,
                     'nome', c.nome, 'proxima_data', c.proxima_data) order by c.proxima_data), '[]')
              from public.contrapartidas c join public.parceiros_visiveis() p on p.id = c.parceiro_id
              where c.ativa and c.estado = 'atrasada'),
    'aprovacoes_pendentes', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'desde', p.etapa_desde::date)), '[]')
              from public.parceiros_visiveis() p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)),
    'propostas_ficha_pendentes', (select count(*) from public.propostas_ficha where estado = 'pendente'),
    'indicacoes', (select jsonb_build_object(
                     'total', count(*),
                     'do_parceiro', count(*) filter (where i.sentido = 'parceiro_para_grupo'),
                     'para_parceiro', count(*) filter (where i.sentido = 'grupo_para_parceiro'),
                     'no_icp', count(*) filter (where i.aderente_icp),
                     'com_reuniao', count(*) filter (where i.data_reuniao is not null),
                     'fechadas', count(*) filter (where i.etapa = 'fechada'),
                     'por_empresa', (select coalesce(jsonb_object_agg(e.nome, (select count(*) from public.indicacoes j
                                        where j.empresa_grupo_id = e.id and j.data between v_ini and v_fim)), '{}') from public.empresas_grupo e))
              from public.indicacoes i where i.data between v_ini and v_fim),
    'indicacoes_paradas', (select count(*) from public.indicacoes i
              where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - make_interval(days => public.config_int('indicacao_parada_dias', 15))),
    'contratos_assinados', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'data', p.data_assinatura)), '[]')
              from public.parceiros_visiveis() p where p.data_assinatura between v_ini and v_fim),
    'comissoes', case when public.pode_ver_comissao() then (
              select jsonb_build_object(
                'a_pagar', coalesce(sum(valor) filter (where estado in ('a_pagar', 'nf_recebida') and beneficiario <> 'grupo'), 0),
                'pagas_periodo', coalesce(sum(valor) filter (where estado = 'paga' and paga_em::date between v_ini and v_fim and beneficiario <> 'grupo'), 0),
                'a_receber', coalesce(sum(valor) filter (where beneficiario = 'grupo' and estado in ('aguardando_compensacao', 'a_pagar', 'nf_recebida')), 0),
                'recebidas_periodo', coalesce(sum(valor) filter (where beneficiario = 'grupo' and estado = 'paga' and paga_em::date between v_ini and v_fim), 0))
              from public.comissoes) end,
    'fila_base_ativa', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', f.parceiro_id, 'parceiro', f.nome_fantasia,
                     'posicao', f.posicao, 'estrategico', f.estrategico) order by f.posicao), '[]') from public.v_fila_base_ativa f),
    'categorias_sem_3', (select coalesce(jsonb_agg(jsonb_build_object('categoria_id', c.id, 'categoria', c.nome,
                     'assinados', public.assinados_na_categoria(c.id)) order by c.ordem), '[]')
              from public.categorias c where c.ativa and c.tipo = 'comercial' and public.assinados_na_categoria(c.id) < 3),
    'atividades', (select coalesce(jsonb_agg(jsonb_build_object('tipo', t.nome, 'quantidade', x.qtd, 'minutos', x.minutos)), '[]')
              from (select a.tipo_atividade_id, count(*) qtd, sum(a.minutos) minutos from public.atividades a
                    where a.data between v_ini and v_fim group by a.tipo_atividade_id) x
              join public.tipos_atividade t on t.id = x.tipo_atividade_id),
    'sem_motivo_inatividade', (select count(*) from public.parceiros_visiveis() p
              where p.status_atividade in ('morno', 'dormente') and coalesce(btrim(p.motivo_inatividade), '') = '' and not public.is_etapa_perda(p.etapa))
  ) into res;
  return res;
end $function$;

CREATE OR REPLACE FUNCTION public.painel_v2(p_inicio date DEFAULT NULL::date, p_fim date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_fim date := coalesce(p_fim, public.hoje());
  v_ini date := coalesce(p_inicio, v_fim - 7);
  v_dias int := v_fim - v_ini + 1;
  v_admin boolean := public.is_admin();
  v_atual jsonb;
  v_ant jsonb;
begin
  if not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  v_atual := public._indicadores_valores(v_ini, v_fim, v_admin);
  v_ant := public._indicadores_valores(v_ini - v_dias, v_ini - 1, v_admin);
  return jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'sugestao_fase', case when public.is_parcerias() or public.is_consultor() then public.sugerir_fase() end,
    'indicadores', (select coalesce(jsonb_agg(jsonb_build_object(
        'chave', i.chave, 'etapa', i.etapa, 'nome', i.nome, 'formato', i.formato, 'destaque', i.destaque,
        'valor', v_atual -> i.chave, 'anterior', v_ant -> i.chave,
        'aceita_meta', i.aceita_meta)
        order by i.etapa, i.ordem), '[]')
      from public.indicadores i where i.ativo and (v_admin or not i.so_admin)),
    'comentarios_satisfacao', (select coalesce(jsonb_agg(jsonb_build_object('nota', s.nota, 'comentario', s.comentario, 'trimestre', s.trimestre,
        'pessoa', case when public.is_parcerias() then pf.nome end, 'parceiro', case when public.is_parcerias() then p.nome_fantasia end)
        order by s.respondida_em desc), '[]')
      from public.pesquisas_satisfacao s join public.perfis pf on pf.id = s.perfil_id join public.parceiros_visiveis() p on p.id = s.parceiro_id
      where s.comentario is not null and s.respondida_em::date between v_ini and v_fim));
end $function$;

CREATE OR REPLACE FUNCTION public.pendencias_diarias()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ip int := public.config_int('indicacao_parada_dias', 15);
  v_hoje date := public.hoje();
  u record;
  itens jsonb;
  res jsonb := '[]';
  k text;
  vazio boolean;
  v_gestor boolean;
begin
  for u in select * from public.perfis_visiveis() where ativo and papel in ('admin', 'parcerias', 'consultor', 'comercial') loop
    v_gestor := u.papel in ('admin', 'parcerias');
    itens := jsonb_build_object(
      'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', x.descricao, 'data', x.data)), '[]')
          from public.proximos_passos x join public.parceiros_visiveis() p on p.id = x.parceiro_id
          where x.responsavel_id = u.id and x.estado in ('aberto', 'vencido') and x.data < v_hoje),
      'status_atividade', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('passou de %s para %s', h.valor_anterior, h.valor_novo))), '[]')
          from public.historico h join public.parceiros_visiveis() p on p.id = h.registro_id
          where h.tabela = 'parceiros' and h.campo = 'status_atividade' and h.created_at > now() - interval '1 day'
            and p.responsavel_id = u.id),
      'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('em %s desde %s', e.nome, to_char(p.etapa_desde, 'DD/MM')))), '[]')
          from public.parceiros_visiveis() p join public.etapas_funil e on e.codigo = p.etapa
          where p.responsavel_id = u.id
            and public.negociacao_parada(p.etapa, p.etapa_desde)),
      'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s (prevista para %s)', c.nome, to_char(c.proxima_data, 'DD/MM')))), '[]')
          from public.contrapartidas c join public.parceiros_visiveis() p on p.id = c.parceiro_id
          where c.ativa and c.estado = 'atrasada' and p.responsavel_id = u.id),
      'indicacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s sem atualização desde %s', cl.razao_social, to_char(i.ultima_atualizacao, 'DD/MM')))), '[]')
          from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where i.responsavel_id = u.id and i.etapa not in ('fechada', 'perdida')
            and i.ultima_atualizacao < now() - make_interval(days => v_ip)),
      'propostas_ficha', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', 'proposta de alteração da ficha')), '[]')
          from public.propostas_ficha f join public.parceiros_visiveis() p on p.id = f.parceiro_id
          where f.estado = 'pendente' and p.responsavel_id = u.id),
      'aprovacoes_pendentes', case when u.is_diretor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', 'aguarda aprovação de assinatura')), '[]')
          from public.parceiros_visiveis() p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)) else '[]'::jsonb end,
      -- v2
      'sla_vencido', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s: prazo vencido (%s)', cl.razao_social, replace(array_to_string(public.sla_vencidos(i), ', '), '_', ' ')))), '[]')
          from public.indicacoes i join public.parceiros_visiveis() p on p.id = i.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where coalesce(i.responsavel_id, p.responsavel_id) = u.id and cardinality(public.sla_vencidos(i)) > 0),
      'regua_atrasada', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('reunião prevista até %s', to_char((s.v->>'proxima_ate')::date, 'DD/MM')))), '[]')
          from public.parceiros_visiveis() p cross join lateral (select public.regua_status(p.id) v) s
          where p.responsavel_id = u.id and p.data_assinatura is not null and coalesce((s.v->>'atrasada')::boolean, false)),
      'acoes_wise_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s (prevista para %s)', a.nome, to_char(a.data_prevista, 'DD/MM')))), '[]')
          from public.acoes_wise a join public.parceiros_visiveis() p on p.id = a.parceiro_id
          where a.ativa and a.estado = 'atrasada' and coalesce(a.responsavel_id, p.responsavel_id) = u.id),
      'onboarding_sem_ativacao', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('onboarding desde %s sem ativação', to_char(pl.inicio, 'DD/MM')))), '[]')
          from public.planos_onboarding pl join public.parceiros_visiveis() p on p.id = pl.parceiro_id
          where pl.situacao = 'em_andamento' and v_hoje >= pl.prazo_final and p.responsavel_id = u.id),
      'em_risco', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', case f.estado when 'em_risco' then 'em risco de desligamento' when 'tentativa_1' then 'primeira tentativa de retomada feita'
                                     else 'segunda tentativa de retomada feita' end)), '[]')
          from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id
          where f.estado in ('em_risco', 'tentativa_1', 'tentativa_2') and (p.responsavel_id = u.id or (v_gestor and p.responsavel_id is null))),
      'propostas_rebaixamento', case when v_gestor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('proposta de rebaixamento (%s)', r.trimestre))), '[]')
          from public.revisoes_nivel r join public.parceiros_visiveis() p on p.id = r.parceiro_id
          where r.resultado = 'proposta_rebaixamento' and r.decisao is null) else '[]'::jsonb end,
      'checagens_cliente', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s: checagem de %s', cl.razao_social, c.marco))), '[]')
          from public.checagens_cliente c join public.indicacoes i on i.id = c.indicacao_id
          join public.parceiros_visiveis() p on p.id = c.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where c.registrada_em is null and c.prevista_para <= v_hoje and coalesce(i.responsavel_id, p.responsavel_id) = u.id),
      'desligamentos_para_aprovar', case when u.is_diretor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', 'desligamento sugerido aguarda decisão')), '[]')
          from public.fluxos_desligamento f join public.parceiros_visiveis() p on p.id = f.parceiro_id where f.estado = 'sugerido') else '[]'::jsonb end
    );
    -- Preferências: tipos desativados não entram, exceto obrigatórios do Diretor
    foreach k in array u.alertas_desativados loop
      if not (k in ('aprovacoes_pendentes', 'desligamentos_para_aprovar') and u.is_diretor) then
        itens := itens - k;
      end if;
    end loop;
    select bool_and(jsonb_array_length(v) = 0) into vazio from jsonb_each(itens) as t(k2, v);
    if not coalesce(vazio, true) then
      res := res || jsonb_build_object('usuario_id', u.id, 'email', u.email, 'nome', u.nome, 'itens', itens);
    end if;
  end loop;
  return res;
end $function$;

CREATE OR REPLACE FUNCTION public.premiacoes_publicas(p_ano integer DEFAULT NULL::integer)
 RETURNS TABLE(ano integer, categoria text, nome text, minha boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select pr.ano, pr.categoria,
         case when p.id = public.parceiro_atual() or not p.anonimo_ranking then p.nome_fantasia else 'Parceiro Wise' end,
         p.id = public.parceiro_atual()
  from public.premiacoes pr join public.parceiros_visiveis() p on p.id = pr.parceiro_id
  where (p_ano is null or pr.ano = p_ano)
    and (pr.divulgada or p.id = public.parceiro_atual() or public.is_interno_leitura())
    and (public.parceiro_atual() is not null or public.is_interno_leitura())
  order by pr.ano desc, pr.categoria
$function$;

CREATE OR REPLACE FUNCTION public.ranking(p_ano integer DEFAULT NULL::integer, p_trimestre integer DEFAULT NULL::integer)
 RETURNS TABLE(posicao integer, parceiro_id uuid, nome text, pontos integer, eu boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ano int := coalesce(p_ano, extract(year from public.hoje())::int);
  v_ini date;
  v_fim date;
  v_meu uuid := public.parceiro_atual();
  v_interno boolean := public.is_parcerias() or public.is_consultor();
begin
  if not v_interno and v_meu is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_trimestre is null then
    v_ini := make_date(v_ano, 1, 1); v_fim := make_date(v_ano, 12, 31);
  else
    v_ini := make_date(v_ano, (p_trimestre - 1) * 3 + 1, 1); v_fim := (v_ini + interval '3 months')::date - 1;
  end if;
  return query
  with base as (
    select p.id, p.nome_fantasia, p.anonimo_ranking, p.data_assinatura,
           coalesce(sum(r.pontos), 0)::int as pts,
           count(*) filter (where r.evento = 'cliente_icp')::int as clientes
    from public.parceiros_visiveis() p
    left join public.pontos_ranking r on r.parceiro_id = p.id and r.data between v_ini and v_fim
    where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
    group by p.id, p.nome_fantasia, p.anonimo_ranking, p.data_assinatura
  ), ord as (
    select b.*, row_number() over (order by b.pts desc, b.clientes desc, b.data_assinatura nulls last, b.nome_fantasia)::int as pos
    from base b
  )
  select o.pos,
         case when v_interno or o.id = v_meu then o.id end,
         case when v_interno or o.id = v_meu or not o.anonimo_ranking then o.nome_fantasia else 'Parceiro Wise' end,
         o.pts, o.id = v_meu
  from ord o
  where v_interno or o.pos <= 10 or o.id = v_meu
  order by o.pos;
end $function$;

CREATE OR REPLACE FUNCTION public.resultado_canal(p_inicio date, p_fim date, p_agrupar text DEFAULT 'total'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_margem numeric := public.config_num('margem_contribuicao_pct', 100) / 100;
  v_rateio boolean := coalesce((select (valor #>> '{}')::boolean from public.configuracoes where chave = 'rateio_custo_geral'), false);
  v_linhas jsonb;
  v_total jsonb;
  v_grupos jsonb := '[]';
  v_geral jsonb;
  v_assinados uuid[];
  v_custo_geral numeric;
  v_avisos jsonb := '[]';
  r record;
begin
  if not public.is_admin() then raise exception 'Somente administradores veem o resultado do canal.' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x)), '[]') into v_linhas from public._planilha_custos(p_inicio, p_fim) x;
  v_total := public._metricas_canal(v_linhas, v_margem);
  if (v_total->>'horas_sem_custo')::numeric > 0 then
    v_avisos := v_avisos || to_jsonb(format('%s horas sem custo-hora informado: o custo do canal está subestimado.', v_total->>'horas_sem_custo'));
  end if;

  if p_agrupar <> 'total' then
    -- Custo geral (sem parceiro) à parte; com rateio, dividido igualmente entre os assinados do período
    select public._metricas_canal(coalesce(jsonb_agg(l), '[]'), v_margem) into v_geral
      from jsonb_array_elements(v_linhas) l where l->>'parceiro_id' is null;
    select array_agg(id) into v_assinados from public.parceiros_visiveis() p
     where p.tipo_parceria = 'comercial' and p.data_assinatura is not null and p.data_assinatura <= p_fim and not public.is_etapa_perda(p.etapa);
    v_custo_geral := coalesce((v_geral->>'custo_total')::numeric, 0);

    for r in
      with lp as (
        select l, p.id as pid, p.nome_fantasia, p.nivel, p.modelos_atuacao, coalesce(p.origem_tipo, 'nao_informada') as origem,
               l->>'empresa' as empresa
        from jsonb_array_elements(v_linhas) l join public.parceiros_visiveis() p on p.id = (l->>'parceiro_id')::uuid
      ), chaves as (
        select case p_agrupar
                 when 'parceiro' then pid::text
                 when 'nivel' then coalesce(nivel, 'sem_nivel')
                 when 'origem' then origem
                 when 'empresa' then coalesce(empresa, 'sem_empresa')
               end as chave,
               case p_agrupar when 'parceiro' then nome_fantasia else null end as rotulo, l
        from lp where p_agrupar <> 'modelo'
        union all
        select coalesce(m, 'nao_informado'), null, l from lp left join lateral unnest(nullif(modelos_atuacao, '{}')) m on true
        where p_agrupar = 'modelo'
      )
      select chave, max(rotulo) as rotulo, jsonb_agg(l) as linhas from chaves group by chave
    loop
      v_grupos := v_grupos || (jsonb_build_object('chave', r.chave, 'rotulo', coalesce(r.rotulo, r.chave))
        || public._metricas_canal(
             r.linhas || case when v_rateio and p_agrupar = 'parceiro' and r.chave::uuid = any (v_assinados) and cardinality(v_assinados) > 0
                              then jsonb_build_array(jsonb_build_object('tipo_linha', 'custo_direto', 'valor', v_custo_geral / cardinality(v_assinados)))
                              else '[]'::jsonb end,
             v_margem));
    end loop;
  end if;

  return jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_inicio, 'fim', p_fim),
    'parametros', jsonb_build_object('margem_pct', v_margem * 100, 'rateio', v_rateio,
      'horizonte_meses', public.config_int('horizonte_receita_meses', 12), 'prazo_padrao_meses', public.config_int('prazo_contrato_padrao_meses', 12)),
    'total', v_total, 'grupos', v_grupos, 'geral', v_geral, 'avisos', v_avisos,
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'secundarios', jsonb_build_object(
      'assinados', (select count(*) from public.parceiros_visiveis() p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
      'reunioes', (select count(*) from public.indicacoes i where i.sentido = 'parceiro_para_grupo' and i.data_reuniao between p_inicio and p_fim)));
end $function$;

CREATE OR REPLACE FUNCTION public.resumo_comunidade()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with ofertas as (
    select o.*, p.id pid from public.ofertas_hub o join public.parceiros_visiveis() p on p.id = o.parceiro_id
     where o.estado = 'publicada' and (o.validade is null or o.validade >= public.hoje()) and public.pode_ofertar(p.id))
  select jsonb_build_object(
    'ofertas', (select count(*) from ofertas),
    'empresas_ofertando', (select count(distinct pid) from ofertas),
    'membros', (select count(*) from public.parceiros_visiveis() p where p.tipo_parceria = 'cliente' or p.data_assinatura is not null),
    'categorias', coalesce((select jsonb_agg(nome order by n desc, nome) from (
        select c.nome, count(*) n from ofertas o join public.parceiro_categorias pc on pc.parceiro_id = o.pid and pc.principal
          join public.categorias c on c.id = pc.categoria_id group by c.nome order by n desc, c.nome limit 12) x), '[]'::jsonb))
$function$;

CREATE OR REPLACE FUNCTION public.revisao_trimestral(p_ref date DEFAULT NULL::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ref date := coalesce(p_ref, public.hoje());
  v_tri text := to_char(v_ref, 'YYYY-"T"Q');
  v_prox date := (date_trunc('quarter', v_ref) + interval '3 months')::date;
  r record;
  v_res jsonb;
  v_result text;
  n int := 0;
begin
  for r in select * from public.parceiros_visiveis() p where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id) and p.nivel is not null
             and not exists (select 1 from public.revisoes_nivel x where x.parceiro_id = p.id and x.trimestre = v_tri and x.resultado <> 'subida') loop
    perform public.verificar_subida_nivel(r.id);
    select * into r from public.parceiros_visiveis() where id = r.id;
    if r.status_atividade = 'pausado' then
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, motivo)
      values (r.id, v_tri, r.nivel, 'isento', 'Parceiro pausado');
    elsif v_ref - r.data_assinatura < public.config_int('isencao_revisao_dias', 180) then
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, motivo)
      values (r.id, v_tri, r.nivel, 'isento', format('Assinado há menos de %s dias', public.config_int('isencao_revisao_dias', 180)));
    else
      v_res := public.cumpre_nivel(r.id, r.nivel, date_trunc('quarter', v_ref)::date);
      if (v_res->>'cumpre')::boolean then
        v_result := 'cumpre';
        update public.parceiros set em_observacao_ate = null where id = r.id;
      elsif r.em_observacao_ate is not null and r.nivel <> 'C' then
        v_result := 'proposta_rebaixamento';
        perform public.notificar_responsavel(r.id, 'proposta_rebaixamento', 'Proposta de rebaixamento',
          format('%s segue sem cumprir os requisitos do nível depois de um trimestre em observação. Confirme ou mantenha o nível, com motivo.', r.nome_fantasia),
          '/app/parceiros/' || r.id || '?aba=nivel');
      elsif r.nivel = 'C' and r.em_observacao_ate is not null then
        v_result := 'observacao';
      else
        v_result := 'observacao';
        update public.parceiros set em_observacao_ate = v_prox where id = r.id;
        perform public.notificar_parceiro(r.id, 'nivel_observacao', 'Nível em observação',
          format('Neste trimestre vocês não cumpriram todos os requisitos do nível atual. Até %s, confira o que falta em "Meu nível".', to_char(v_prox, 'DD/MM/YYYY')),
          '/parceiro/nivel');
        perform public.notificar_responsavel(r.id, 'nivel_observacao', 'Parceiro em observação',
          format('%s entrou em observação até %s.', r.nome_fantasia, to_char(v_prox, 'DD/MM/YYYY')), '/app/parceiros/' || r.id || '?aba=nivel');
      end if;
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, detalhes)
      values (r.id, v_tri, r.nivel, v_result, v_res);
    end if;
    n := n + 1;
  end loop;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.rfp_candidatos()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_interno_leitura() then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'parceiro_id', p.id,
      'nome', p.nome_fantasia,
      'cidade', p.cidade, 'uf', p.uf,
      'categorias', (select jsonb_agg(jsonb_build_object('categoria_id', c.id, 'nome', c.nome, 'principal', pc.principal))
                       from public.parceiro_categorias pc join public.categorias c on c.id = pc.categoria_id
                      where pc.parceiro_id = p.id),
      'campos', (select jsonb_object_agg(c.rotulo, v.valor)
                   from public.parceiro_campos v join public.campos_categoria c on c.id = v.campo_id
                  where v.parceiro_id = p.id and c.uso_rfp and c.ativo and not c.interno and v.valor is not null)
    ) order by p.nome_fantasia)
    from public.parceiros_visiveis() p
    where public.elegivel_rfp(p.id)
  ), '[]'::jsonb);
end $function$;

CREATE OR REPLACE FUNCTION public.rotina_diaria()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n_status int;
  n_passos int;
  n_contra int;
  n_nutricao int := 0;
  n_sla int := 0;
  n_regua int := 0;
  n_acoes int;
  n_onb int := 0;
  n_subida int := 0;
  n_pacotes int;
  n_faixas int;
  n_desl int;
  n_check int := 0;
  n_protecao int := 0;
  n_purga int;
  r record;
  i public.indicacoes;
  k text;
  s jsonb;
  v_hoje date := public.hoje();
  v_ext int := public.config_int('onboarding_extensao_dias', 120);
begin
  -- Nutrição vencida: volta à etapa anterior (FR-118)
  for r in select p.id, p.nome_fantasia, p.etapa_antes_nutricao, p.responsavel_id from public.parceiros_visiveis() p
           where p.etapa = 'nutricao' and p.nutricao_ate < v_hoje loop
    begin
      update public.parceiros set etapa = coalesce(r.etapa_antes_nutricao, 'contato_feito') where id = r.id;
      n_nutricao := n_nutricao + 1;
      perform public.notificar_responsavel(r.id, 'nutricao_fim', 'Nutrição terminou',
        format('%s voltou para o funil. Retome o contato.', r.nome_fantasia), '/app/parceiros/' || r.id);
    exception when others then
      perform public.notificar_responsavel(r.id, 'nutricao_fim', 'Nutrição terminou',
        format('%s terminou a nutrição, mas não voltou sozinho para a etapa anterior: %s', r.nome_fantasia, sqlerrm),
        '/app/parceiros/' || r.id);
    end;
  end loop;

  -- v1: status de atividade, próximos passos, contrapartidas e estratégico
  update public.parceiros p
     set status_atividade = public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
   where not p.demonstracao and (p.status_atividade is distinct from public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
      or (p.pausado_ate is not null and p.pausado_ate < v_hoje));
  get diagnostics n_status = row_count;

  update public.proximos_passos set estado = 'vencido' where estado = 'aberto' and data < v_hoje;
  get diagnostics n_passos = row_count;

  update public.contrapartidas set estado = 'atrasada'
   where ativa and estado in ('pendente', 'validada', 'recusada') and proxima_data is not null and proxima_data < v_hoje;
  get diagnostics n_contra = row_count;

  for r in select id from public.parceiros_visiveis() loop
    perform public.atualizar_estrategico_sugerido(r.id);
  end loop;

  -- SLA das indicações (FR-134): um aviso por prazo vencido
  for i in select * from public.indicacoes where etapa not in ('fechada', 'perdida') and sla <> '{}'::jsonb loop
    foreach k in array public.sla_vencidos(i) loop
      if public.alerta_novo('sla', i.id, k || ':' || coalesce((i.ultima_atualizacao at time zone 'America/Sao_Paulo')::date::text, '')) then
        n_sla := n_sla + 1;
        if i.sentido = 'parceiro_para_grupo' then
          if i.responsavel_id is not null then
            perform public.notificar(i.responsavel_id, 'sla_vencido', 'Prazo de indicação vencido',
              format('Indicação com prazo vencido: %s.', replace(k, '_', ' ')), '/app/indicacoes/' || i.id,
              jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          else
            perform public.notificar_responsavel(i.parceiro_id, 'sla_vencido', 'Prazo de indicação vencido',
              format('Indicação com prazo vencido: %s.', replace(k, '_', ' ')), '/app/indicacoes/' || i.id,
              jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          end if;
        else
          perform public.notificar_parceiro(i.parceiro_id, 'sla_vencido', 'Atualize a indicação da Wise',
            'Uma indicação que a Wise fez para vocês está esperando contato ou atualização.', '/parceiro/indicacoes',
            jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          perform public.notificar_responsavel(i.parceiro_id, 'sla_vencido', 'Parceiro com prazo vencido',
            format('O parceiro não cumpriu o prazo de %s de uma indicação da Wise.', replace(k, '_', ' ')),
            '/app/indicacoes/' || i.id, jsonb_build_object('indicacao_id', i.id, 'prazo', k));
        end if;
      end if;
    end loop;
  end loop;

  -- Proteção de 180 dias vencida (FR-133): avisa parceiro e responsável uma vez
  for i in select * from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa not in ('fechada', 'perdida')
             and protecao_ate is not null and protecao_ate < v_hoje and not protecao_expirada loop
    if public.alerta_novo('protecao', i.id, i.protecao_ate::text) then
      n_protecao := n_protecao + 1;
      perform public.notificar_parceiro(i.parceiro_id, 'protecao_vencendo', 'Proteção de indicação vencida',
        'Uma indicação de vocês ficou 180 dias sem interação e perdeu a proteção. Se ainda houver oportunidade, atualize com a Wise.',
        '/parceiro/indicacoes', jsonb_build_object('indicacao_id', i.id));
      perform public.notificar_responsavel(i.parceiro_id, 'protecao_vencendo', 'Proteção de indicação vencida',
        'Indicação sem interação há 180 dias: a proteção venceu.', '/app/indicacoes/' || i.id, jsonb_build_object('indicacao_id', i.id));
    end if;
  end loop;

  -- Régua de atendimento (FR-163)
  for r in select p.id, p.nome_fantasia from public.parceiros_visiveis() p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa) loop
    s := public.regua_status(r.id);
    if coalesce((s->>'atrasada')::boolean, false) and public.alerta_novo('regua', r.id, s->>'proxima_ate') then
      n_regua := n_regua + 1;
      perform public.notificar_responsavel(r.id, 'regua_atrasada', 'Reunião da régua atrasada',
        format('%s está sem reunião desde %s (cadência de %s dias).', r.nome_fantasia,
               coalesce(to_char((s->>'ultima_reuniao')::date, 'DD/MM/YYYY'), 'a assinatura'), s->>'cadencia_dias'),
        '/app/parceiros/' || r.id);
    end if;
  end loop;

  -- Ações da Wise atrasadas (FR-160)
  update public.acoes_wise set estado = 'atrasada'
   where ativa and estado = 'planejada' and data_prevista is not null and data_prevista < v_hoje;
  get diagnostics n_acoes = row_count;
  for r in select a.id, a.nome, a.parceiro_id, a.responsavel_id from public.acoes_wise a
           where a.ativa and a.estado = 'atrasada' and not a.alertada loop
    if r.responsavel_id is not null then
      perform public.notificar(r.responsavel_id, 'acao_wise_atrasada', 'Ação da Wise atrasada',
        format('A ação "%s" passou da data prevista.', r.nome), '/app/parceiros/' || r.parceiro_id);
    else
      perform public.notificar_responsavel(r.parceiro_id, 'acao_wise_atrasada', 'Ação da Wise atrasada',
        format('A ação "%s" passou da data prevista.', r.nome), '/app/parceiros/' || r.parceiro_id);
    end if;
    update public.acoes_wise set alertada = true where id = r.id;
  end loop;

  -- Onboarding: ativação por reunião que chegou, marcos, 90 e 120 dias (FR-125 a FR-127)
  for r in select pl.*, p.nome_fantasia, p.responsavel_id from public.planos_onboarding pl join public.parceiros_visiveis() p on p.id = pl.parceiro_id
           where pl.situacao = 'em_andamento' loop
    perform public.verificar_ativacao(r.parceiro_id);
    perform public.verificar_marcos_onboarding(r.parceiro_id);
    if exists (select 1 from public.planos_onboarding where parceiro_id = r.parceiro_id and situacao = 'ativado') then
      n_onb := n_onb + 1;
      continue;
    end if;
    if r.estendido_ate is null and v_hoje >= r.prazo_final and not r.alertado_90 then
      update public.planos_onboarding set estendido_ate = r.inicio + v_ext, alertado_90 = true where parceiro_id = r.parceiro_id;
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id, created_by)
      values (r.parceiro_id, 'Onboarding sem ativação em 90 dias: combinar plano de recuperação', public.add_dias_uteis(v_hoje, 2),
              r.responsavel_id, null);
      perform public.notificar_responsavel(r.parceiro_id, 'onboarding_sem_ativacao', 'Onboarding sem ativação',
        format('%s chegou aos 90 dias sem ativação. O prazo foi estendido até %s.', r.nome_fantasia,
               to_char(r.inicio + v_ext, 'DD/MM/YYYY')), '/app/parceiros/' || r.parceiro_id);
      n_onb := n_onb + 1;
    elsif r.estendido_ate is not null and v_hoje > r.estendido_ate then
      update public.planos_onboarding set situacao = 'nao_ativado' where parceiro_id = r.parceiro_id;
      perform public.notificar_responsavel(r.parceiro_id, 'onboarding_sem_ativacao', 'Onboarding encerrado sem ativação',
        format('%s não foi ativado em %s dias. Avalie o próximo passo com o parceiro.', r.nome_fantasia, v_ext),
        '/app/parceiros/' || r.parceiro_id);
      n_onb := n_onb + 1;
    end if;
  end loop;
  -- Encontros e marcos vencidos sem registro: um aviso por marco
  for r in select m.id, m.parceiro_id, m.tipo from public.marcos_onboarding m join public.planos_onboarding pl on pl.parceiro_id = m.parceiro_id
           where pl.situacao = 'em_andamento' and m.cumprido_em is null and m.prazo < v_hoje and m.tipo <> 'marco_90' loop
    if public.alerta_novo('marco_onboarding', r.id, '') then
      perform public.notificar_responsavel(r.parceiro_id, 'marco_onboarding', 'Marco do onboarding vencido',
        format('O item "%s" do onboarding passou do prazo.', replace(r.tipo, '_', ' ')), '/app/parceiros/' || r.parceiro_id);
    end if;
  end loop;

  -- Subida de nível por resultado (imediata) e pacotes agendados (FR-123)
  for r in select id from public.parceiros_visiveis() where data_assinatura is not null and not public.is_etapa_perda(etapa) and tipo_parceria = 'comercial' loop
    if public.verificar_subida_nivel(r.id) is not null then n_subida := n_subida + 1; end if;
  end loop;
  n_pacotes := public.aplicar_pacotes_pendentes();

  -- Faixas e fluxo de desligamento
  n_faixas := public.calcular_faixas();
  n_desl := public.avaliar_desligamentos();

  -- Checagens do cliente aos 6 e 12 meses (FR-137)
  for r in select c.id, c.parceiro_id, c.marco, cl.razao_social, ind.responsavel_id from public.checagens_cliente c
           join public.indicacoes ind on ind.id = c.indicacao_id join public.clientes cl on cl.id = ind.cliente_id
           where c.registrada_em is null and c.prevista_para <= v_hoje loop
    if public.alerta_novo('checagem', r.id, '') then
      n_check := n_check + 1;
      if r.responsavel_id is not null then
        perform public.notificar(r.responsavel_id, 'checagem_cliente', 'Checagem do cliente indicado',
          format('Confira como está %s (%s depois do fechamento).', r.razao_social, r.marco), '/app/parceiros/' || r.parceiro_id);
      else
        perform public.notificar_responsavel(r.parceiro_id, 'checagem_cliente', 'Checagem do cliente indicado',
          format('Confira como está %s (%s depois do fechamento).', r.razao_social, r.marco), '/app/parceiros/' || r.parceiro_id);
      end if;
    end if;
  end loop;

  -- Cruzamento: purga das coincidências vencidas; limpeza do controle de envios do link
  n_purga := public.purgar_cruzamentos();
  delete from public.envios_link_limite where janela < now() - interval '2 days';

  return jsonb_build_object('status', n_status, 'proximos_passos', n_passos, 'contrapartidas', n_contra,
    'nutricao', n_nutricao, 'sla', n_sla, 'protecao', n_protecao, 'regua', n_regua, 'acoes_wise', n_acoes,
    'onboarding', n_onb, 'subidas', n_subida, 'pacotes', n_pacotes, 'faixas', n_faixas, 'desligamentos', n_desl,
    'checagens', n_check, 'purga_cruzamento', n_purga);
end $function$;
