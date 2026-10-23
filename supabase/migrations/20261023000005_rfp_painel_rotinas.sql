-- Portal Wise Partners: RFP, painel, pendências diárias e rotina diária

-- ---------------------------------------------------------------------------
-- RFP
-- ---------------------------------------------------------------------------

-- Valor de um campo da ficha pelo chave (perfil comum)
create or replace function public.valor_campo(p_parceiro uuid, p_chave text) returns jsonb
language sql stable security definer set search_path = public as $$
  select pc.valor from public.parceiro_campos pc
  join public.campos_categoria c on c.id = pc.campo_id
  where pc.parceiro_id = p_parceiro and c.chave = p_chave and c.escopo in ('comum_comercial', 'comum_institucional')
  limit 1
$$;

-- Elegível para RFP: assinado, sem encerramento e com ficha publicada (o que a empresa faz).
create or replace function public.elegivel_rfp(p_parceiro uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.parceiro_assinado(p_parceiro)
     and coalesce(btrim(public.valor_campo(p_parceiro, 'o_que_faz') #>> '{}'), '') <> ''
$$;

create or replace function public.assinados_na_categoria(p_categoria uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.parceiro_categorias pc
  where pc.categoria_id = p_categoria and public.elegivel_rfp(pc.parceiro_id)
$$;

-- Candidatos para a recomendação por IA: o banco filtra, a IA só ordena e justifica.
create or replace function public.rfp_candidatos() returns jsonb
language plpgsql stable security definer set search_path = public as $$
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
    from public.parceiros p
    where public.elegivel_rfp(p.id)
  ), '[]'::jsonb);
end $$;

create or replace function public.pode_gerir_pedido(p_pedido uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_parcerias() or exists (
    select 1 from public.pedidos_rfp r where r.id = p_pedido and r.consultor_id = auth.uid() and public.is_consultor()
  )
$$;

create or replace function public.gerar_token_rfp() returns text
language sql volatile as $$
  select translate(rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='), '+/', '-_')
$$;

create or replace function public.publicar_pagina_rfp(p_pedido uuid, p_blocos jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.pedidos_rfp;
  cat record;
  v_excecoes jsonb := '[]';
  v_avisos jsonb := '[]';
  v_pag public.paginas_rfp;
  v_dias int := public.config_int('validade_link_rfp_dias', 30);
  v_blocos jsonb := coalesce(p_blocos, '[]');
  v_cliente uuid;
  v_op record;
  v_tipos text[];
begin
  if not public.pode_gerir_pedido(p_pedido) then
    raise exception 'Sem permissão para publicar este pedido.' using errcode = '42501';
  end if;
  select * into r from public.pedidos_rfp where id = p_pedido;

  -- Só parceiros assinados (princípio IV.1)
  if exists (select 1 from public.pedido_rfp_opcoes o where o.pedido_id = p_pedido and o.selecionado and not public.elegivel_rfp(o.parceiro_id)) then
    raise exception 'A seleção tem parceiro sem contrato assinado ou sem ficha publicada.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.pedido_rfp_opcoes o where o.pedido_id = p_pedido and o.selecionado) then
    raise exception 'Selecione ao menos um parceiro.' using errcode = 'P0001';
  end if;

  -- Mínimo de 3 opções por categoria sempre que houver 3 ou mais assinados (princípio IV.2)
  for cat in
    select o.categoria_id, c.nome, count(*)::int as selecionados, public.assinados_na_categoria(o.categoria_id) as disponiveis
    from public.pedido_rfp_opcoes o join public.categorias c on c.id = o.categoria_id
    where o.pedido_id = p_pedido and o.selecionado
    group by o.categoria_id, c.nome
  loop
    if cat.disponiveis >= 3 and cat.selecionados < 3 then
      raise exception 'A categoria % tem % parceiros assinados: selecione no mínimo 3 opções. A Wise nunca recomenda nome único.', cat.nome, cat.disponiveis
        using errcode = 'P0001';
    end if;
    if cat.selecionados < 3 then
      v_excecoes := v_excecoes || jsonb_build_object('categoria_id', cat.categoria_id, 'categoria', cat.nome,
        'selecionados', cat.selecionados, 'disponiveis', cat.disponiveis, 'registrada_em', now());
    end if;
  end loop;

  -- Blocos padronizados apenas, com aviso de relação comercial obrigatório
  select array_agg(distinct b->>'tipo') into v_tipos from jsonb_array_elements(v_blocos) b;
  if exists (select 1 from unnest(coalesce(v_tipos, '{}')) t where t not in ('abertura', 'categoria', 'aviso', 'consultor')) then
    raise exception 'A página só aceita os blocos padrão.' using errcode = 'P0001';
  end if;
  if not ('aviso' = any (coalesce(v_tipos, '{}'))) then
    v_blocos := v_blocos || jsonb_build_array(jsonb_build_object('tipo', 'aviso', 'texto', public.config('texto_aviso_relacao_comercial') #>> '{}'));
  end if;

  -- Parceiros sem WhatsApp comercial: aviso ao consultor
  for v_op in select distinct o.parceiro_id, p.nome_fantasia from public.pedido_rfp_opcoes o join public.parceiros p on p.id = o.parceiro_id
           where o.pedido_id = p_pedido and o.selecionado loop
    if public.somente_digitos(public.valor_campo(v_op.parceiro_id, 'whatsapp_comercial') #>> '{}') is null then
      v_avisos := v_avisos || to_jsonb(format('%s não tem WhatsApp comercial: a página mostra o e-mail comercial.', v_op.nome_fantasia));
    end if;
  end loop;

  insert into public.paginas_rfp (pedido_id) values (p_pedido) on conflict (pedido_id) do nothing;
  update public.paginas_rfp
     set blocos = v_blocos,
         token = coalesce(token, public.gerar_token_rfp()),
         publicada_em = now(),
         expira_em = now() + make_interval(days => v_dias),
         revogada = false, revogada_em = null
   where pedido_id = p_pedido
  returning * into v_pag;

  update public.pedidos_rfp set estado = 'publicado', excecoes = v_excecoes where id = p_pedido;

  -- Uma indicação da empresa do consultor para cada parceiro apresentado
  v_cliente := r.cliente_id;
  if v_cliente is null then
    select id into v_cliente from public.clientes where razao_normalizada = public.normalizar_texto(r.cliente_nome) limit 1;
    if v_cliente is null then
      insert into public.clientes (razao_social) values (r.cliente_nome) returning id into v_cliente;
    end if;
    update public.pedidos_rfp set cliente_id = v_cliente where id = p_pedido;
  end if;
  for v_op in select distinct o.parceiro_id from public.pedido_rfp_opcoes o where o.pedido_id = p_pedido and o.selecionado loop
    if not exists (select 1 from public.indicacoes i where i.pedido_rfp_id = p_pedido and i.parceiro_id = v_op.parceiro_id) then
      insert into public.indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, origem_detalhe, pedido_rfp_id, responsavel_id)
      values ('grupo_para_parceiro', v_op.parceiro_id, r.empresa_grupo_id, v_cliente, 'rfp', 'Pedido de RFP', p_pedido, r.consultor_id);
    end if;
  end loop;

  perform public.registrar_historico('paginas_rfp', v_pag.id, null, 'publicada', null, to_char(v_pag.expira_em, 'YYYY-MM-DD'));
  return jsonb_build_object('token', v_pag.token, 'expira_em', v_pag.expira_em, 'excecoes', v_excecoes, 'avisos', v_avisos);
end $$;

create or replace function public.renovar_pagina_rfp(p_pedido uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_pag public.paginas_rfp;
begin
  if not public.pode_gerir_pedido(p_pedido) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.paginas_rfp
     set expira_em = now() + make_interval(days => public.config_int('validade_link_rfp_dias', 30)),
         revogada = false, revogada_em = null
   where pedido_id = p_pedido and token is not null
  returning * into v_pag;
  if v_pag.id is null then raise exception 'Página ainda não publicada.' using errcode = 'P0001'; end if;
  perform public.registrar_historico('paginas_rfp', v_pag.id, null, 'renovada', null, to_char(v_pag.expira_em, 'YYYY-MM-DD'));
  return v_pag.expira_em;
end $$;

create or replace function public.revogar_pagina_rfp(p_pedido uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pag public.paginas_rfp;
begin
  if not public.pode_gerir_pedido(p_pedido) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.paginas_rfp set revogada = true, revogada_em = now() where pedido_id = p_pedido returning * into v_pag;
  perform public.registrar_historico('paginas_rfp', v_pag.id, null, 'revogada', null, 'sim');
end $$;

-- Página pública: chamada só pela Edge Function rfp-publica (service_role).
-- Devolve apenas os blocos publicados e a disponibilidade de contato de cada parceiro.
create or replace function public.rfp_pagina_publica(p_token text, p_user_agent text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pag public.paginas_rfp;
  r public.pedidos_rfp;
  v_cons public.perfis;
  v_consultor jsonb;
  v_blocos jsonb := '[]';
  b jsonb;
  pa jsonb;
  v_parceiros jsonb;
  v_pid uuid;
  v_disp boolean;
  v_contato text;
begin
  if p_token is null or length(p_token) < 30 then
    return jsonb_build_object('estado', 'nao_encontrada');
  end if;
  select * into v_pag from public.paginas_rfp where token = p_token;
  if v_pag.id is null then
    return jsonb_build_object('estado', 'nao_encontrada');
  end if;
  select * into r from public.pedidos_rfp where id = v_pag.pedido_id;
  select * into v_cons from public.perfis where id = r.consultor_id;
  v_consultor := jsonb_build_object('nome', v_cons.nome, 'email', v_cons.email, 'telefone', v_cons.telefone);

  if v_pag.revogada or v_pag.expira_em is null or v_pag.expira_em < now() then
    return jsonb_build_object('estado', 'indisponivel', 'consultor', v_consultor);
  end if;

  update public.paginas_rfp set aberturas = aberturas + 1 where id = v_pag.id;
  insert into public.eventos_rfp (pagina_id, tipo, user_agent) values (v_pag.id, 'abertura', left(p_user_agent, 200));

  for b in select * from jsonb_array_elements(v_pag.blocos) loop
    case b->>'tipo'
      when 'abertura' then
        v_blocos := v_blocos || jsonb_build_object('tipo', 'abertura', 'titulo', b->>'titulo', 'texto', b->>'texto');
      when 'aviso' then
        v_blocos := v_blocos || jsonb_build_object('tipo', 'aviso', 'texto', b->>'texto');
      when 'consultor' then
        v_blocos := v_blocos || jsonb_build_object('tipo', 'consultor', 'texto', b->>'texto',
          'nome', coalesce(b->>'nome', v_cons.nome), 'email', coalesce(b->>'email', v_cons.email),
          'telefone', coalesce(b->>'telefone', v_cons.telefone));
      when 'categoria' then
        v_parceiros := '[]';
        for pa in select * from jsonb_array_elements(coalesce(b->'parceiros', '[]')) loop
          v_pid := (pa->>'parceiro_id')::uuid;
          v_disp := public.parceiro_assinado(v_pid);
          v_contato := case
            when not v_disp then null
            when public.somente_digitos(public.valor_campo(v_pid, 'whatsapp_comercial') #>> '{}') is not null then 'whatsapp'
            when coalesce(public.valor_campo(v_pid, 'email_comercial') #>> '{}', '') <> '' then 'email'
            else null end;
          v_parceiros := v_parceiros || jsonb_build_object(
            'parceiro_id', v_pid, 'nome', pa->>'nome', 'texto', pa->>'texto',
            'destaques', coalesce(pa->'destaques', '[]'), 'disponivel', v_disp, 'contato', v_contato);
        end loop;
        v_blocos := v_blocos || jsonb_build_object('tipo', 'categoria', 'titulo', b->>'titulo', 'texto', b->>'texto', 'parceiros', v_parceiros);
      else null;
    end case;
  end loop;

  return jsonb_build_object('estado', 'ok', 'cliente_nome', r.cliente_nome,
    'necessidade_resumida', coalesce(r.necessidade_resumida, ''), 'blocos', v_blocos,
    'consultor', v_consultor, 'expira_em', v_pag.expira_em);
end $$;

-- Clique em "falar com este parceiro": registra, avisa consultor e parceiro e devolve o destino.
create or replace function public.rfp_registrar_clique(p_token text, p_parceiro uuid, p_user_agent text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pag public.paginas_rfp;
  r public.pedidos_rfp;
  v_fone text;
  v_email text;
  v_msg text;
  v_tipo text;
  v_url text;
  v_nome text;
begin
  select * into v_pag from public.paginas_rfp where token = p_token;
  if v_pag.id is null or v_pag.revogada or v_pag.expira_em < now() then
    return jsonb_build_object('erro', 'indisponivel');
  end if;
  select * into r from public.pedidos_rfp where id = v_pag.pedido_id;
  if not exists (select 1 from public.pedido_rfp_opcoes o where o.pedido_id = r.id and o.parceiro_id = p_parceiro and o.selecionado)
     or not public.parceiro_assinado(p_parceiro) then
    return jsonb_build_object('erro', 'indisponivel');
  end if;

  v_fone := public.somente_digitos(public.valor_campo(p_parceiro, 'whatsapp_comercial') #>> '{}');
  v_email := btrim(public.valor_campo(p_parceiro, 'email_comercial') #>> '{}');
  v_msg := replace(public.config('mensagem_whatsapp_rfp') #>> '{}', '{problema resumido}',
                   coalesce(nullif(r.necessidade_resumida, ''), 'uma necessidade da minha empresa'));
  if v_fone is not null then
    if left(v_fone, 2) <> '55' then v_fone := '55' || v_fone; end if;
    v_tipo := 'clique_whatsapp';
    v_url := 'https://wa.me/' || v_fone || '?text=' || public.url_encode(v_msg);
  elsif coalesce(v_email, '') <> '' then
    v_tipo := 'clique_email';
    v_url := 'mailto:' || v_email || '?subject=' || public.url_encode('Indicação da Wise Makers') || '&body=' || public.url_encode(v_msg);
  else
    return jsonb_build_object('erro', 'sem_contato');
  end if;

  insert into public.eventos_rfp (pagina_id, tipo, parceiro_id, user_agent) values (v_pag.id, v_tipo, p_parceiro, left(p_user_agent, 200));
  select nome_fantasia into v_nome from public.parceiros where id = p_parceiro;
  perform public.notificar(r.consultor_id, 'rfp_clique', 'Cliente clicou para falar com parceiro',
    format('%s clicou para falar com %s.', r.cliente_nome, v_nome), '/app/rfp/' || r.id);
  perform public.notificar_parceiro(p_parceiro, 'rfp_clique', 'Um cliente da Wise quer falar com vocês',
    format('%s abriu o contato com vocês a partir de uma indicação da Wise Makers.', r.cliente_nome), '/parceiro/rfps');
  return jsonb_build_object('url', v_url, 'tipo', v_tipo);
end $$;

create or replace function public.url_encode(t text) returns text
language plpgsql immutable as $$
declare
  r text := '';
  ch text;
  b bytea;
  i int;
begin
  for ch in select regexp_split_to_table(coalesce(t, ''), '') loop
    if ch ~ '^[A-Za-z0-9_.~-]$' then
      r := r || ch;
    else
      b := convert_to(ch, 'UTF8');
      for i in 0 .. length(b) - 1 loop
        r := r || '%' || upper(lpad(to_hex(get_byte(b, i)), 2, '0'));
      end loop;
    end if;
  end loop;
  return r;
end $$;

-- RFPs em que o parceiro foi apresentado (nunca mostra os outros parceiros do pedido).
create or replace function public.meus_rfps() returns table (
  pedido_id uuid, publicada_em timestamptz, cliente_nome text, necessidade_resumida text, cliques int, aberturas int
)
language sql stable security definer set search_path = public as $$
  select r.id, pg.publicada_em, r.cliente_nome, r.necessidade_resumida,
         (select count(*)::int from public.eventos_rfp e where e.pagina_id = pg.id and e.parceiro_id = public.parceiro_atual()
            and e.tipo in ('clique_whatsapp', 'clique_email')),
         pg.aberturas
  from public.pedidos_rfp r
  join public.paginas_rfp pg on pg.pedido_id = r.id and pg.publicada_em is not null
  where public.parceiro_atual() is not null
    and exists (select 1 from public.pedido_rfp_opcoes o where o.pedido_id = r.id and o.selecionado and o.parceiro_id = public.parceiro_atual())
  order by pg.publicada_em desc
$$;

-- ---------------------------------------------------------------------------
-- Painel semanal (SECURITY INVOKER: a RLS de quem consulta vale para tudo)
-- ---------------------------------------------------------------------------
create or replace function public.painel_semanal(p_inicio date default null, p_fim date default null) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  v_ini date := coalesce(p_inicio, public.hoje() - 7);
  v_fim date := coalesce(p_fim, public.hoje());
  v_cf int := public.config_int('parada_contato_feito_dias_uteis', 4);
  v_pd int := public.config_int('parada_proposta_dias', 7);
  res jsonb;
begin
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'meta_assinados', public.config_int('meta_assinados', 100),
    'assinados', (select count(*) from public.parceiros p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
    'funil', (select coalesce(jsonb_agg(jsonb_build_object('etapa', e.codigo, 'nome', e.nome, 'perda', e.perda,
                     'total', (select count(*) from public.parceiros p where p.etapa = e.codigo)) order by e.ordem), '[]')
              from public.etapas_funil e),
    'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'parceiro_id', x.parceiro_id, 'parceiro', p.nome_fantasia,
                     'descricao', x.descricao, 'data', x.data, 'responsavel_id', x.responsavel_id) order by x.data), '[]')
              from public.proximos_passos x join public.parceiros p on p.id = x.parceiro_id
              where x.estado in ('aberto', 'vencido') and x.data < public.hoje()),
    'esfriando', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'status', p.status_atividade,
                     'ultimo_contato', p.ultimo_contato, 'motivo', p.motivo_inatividade) order by p.ultimo_contato nulls first), '[]')
              from public.parceiros p where p.status_atividade in ('morno', 'dormente') and not public.is_etapa_perda(p.etapa)),
    'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                     'desde', p.etapa_desde::date)), '[]')
              from public.parceiros p
              where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, public.hoje()) >= v_cf)
                 or (p.etapa = 'proposta_decisor' and public.hoje() - p.etapa_desde::date >= v_pd)),
    'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'parceiro_id', p.id, 'parceiro', p.nome_fantasia,
                     'nome', c.nome, 'proxima_data', c.proxima_data) order by c.proxima_data), '[]')
              from public.contrapartidas c join public.parceiros p on p.id = c.parceiro_id
              where c.ativa and c.estado = 'atrasada'),
    'aprovacoes_pendentes', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'desde', p.etapa_desde::date)), '[]')
              from public.parceiros p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)),
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
              where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - interval '30 days'),
    'contratos_assinados', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'data', p.data_assinatura)), '[]')
              from public.parceiros p where p.data_assinatura between v_ini and v_fim),
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
    'sem_motivo_inatividade', (select count(*) from public.parceiros p
              where p.status_atividade in ('morno', 'dormente') and coalesce(btrim(p.motivo_inatividade), '') = '' and not public.is_etapa_perda(p.etapa))
  ) into res;
  return res;
end $$;

-- ---------------------------------------------------------------------------
-- Pendências por responsável (e-mail diário). Só a Edge Function (service_role) chama.
-- ---------------------------------------------------------------------------
create or replace function public.pendencias_diarias() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_cf int := public.config_int('parada_contato_feito_dias_uteis', 4);
  v_pd int := public.config_int('parada_proposta_dias', 7);
  u record;
  itens jsonb;
  res jsonb := '[]';
  k text;
  vazio boolean;
begin
  for u in select * from public.perfis where ativo and papel in ('admin', 'parcerias', 'consultor', 'comercial') loop
    itens := jsonb_build_object(
      'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', x.descricao, 'data', x.data)), '[]')
          from public.proximos_passos x join public.parceiros p on p.id = x.parceiro_id
          where x.responsavel_id = u.id and x.estado in ('aberto', 'vencido') and x.data < public.hoje()),
      'status_atividade', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('passou de %s para %s', h.valor_anterior, h.valor_novo))), '[]')
          from public.historico h join public.parceiros p on p.id = h.registro_id
          where h.tabela = 'parceiros' and h.campo = 'status_atividade' and h.created_at > now() - interval '1 day'
            and p.responsavel_id = u.id),
      'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('em %s desde %s', e.nome, to_char(p.etapa_desde, 'DD/MM')))), '[]')
          from public.parceiros p join public.etapas_funil e on e.codigo = p.etapa
          where p.responsavel_id = u.id
            and ((p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, public.hoje()) >= v_cf)
              or (p.etapa = 'proposta_decisor' and public.hoje() - p.etapa_desde::date >= v_pd))),
      'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s (prevista para %s)', c.nome, to_char(c.proxima_data, 'DD/MM')))), '[]')
          from public.contrapartidas c join public.parceiros p on p.id = c.parceiro_id
          where c.ativa and c.estado = 'atrasada' and p.responsavel_id = u.id),
      'indicacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s sem atualização desde %s', cl.razao_social, to_char(i.ultima_atualizacao, 'DD/MM')))), '[]')
          from public.indicacoes i join public.parceiros p on p.id = i.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where i.responsavel_id = u.id and i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - interval '30 days'),
      'propostas_ficha', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', 'proposta de alteração da ficha')), '[]')
          from public.propostas_ficha f join public.parceiros p on p.id = f.parceiro_id
          where f.estado = 'pendente' and p.responsavel_id = u.id),
      'aprovacoes_pendentes', case when u.is_diretor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', 'aguarda aprovação de assinatura')), '[]')
          from public.parceiros p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)) else '[]'::jsonb end
    );
    -- Preferências: tipos desativados não entram, exceto obrigatórios do papel
    foreach k in array u.alertas_desativados loop
      if not (k = 'aprovacoes_pendentes' and u.is_diretor) then
        itens := itens - k;
      end if;
    end loop;
    select bool_and(jsonb_array_length(v) = 0) into vazio from jsonb_each(itens) as t(k2, v);
    if not coalesce(vazio, true) then
      res := res || jsonb_build_object('usuario_id', u.id, 'email', u.email, 'nome', u.nome, 'itens', itens);
    end if;
  end loop;
  return res;
end $$;

-- ---------------------------------------------------------------------------
-- Rotina diária (pg_cron, 6h30): status, próximos passos, contrapartidas, estratégico
-- ---------------------------------------------------------------------------
create or replace function public.rotina_diaria() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_status int;
  n_passos int;
  n_contra int;
  r record;
begin
  update public.parceiros p
     set status_atividade = public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
   where p.status_atividade is distinct from public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
      or (p.pausado_ate is not null and p.pausado_ate < public.hoje());
  get diagnostics n_status = row_count;

  update public.proximos_passos set estado = 'vencido' where estado = 'aberto' and data < public.hoje();
  get diagnostics n_passos = row_count;

  update public.contrapartidas set estado = 'atrasada'
   where ativa and estado in ('pendente', 'validada', 'recusada') and proxima_data is not null and proxima_data < public.hoje();
  get diagnostics n_contra = row_count;

  for r in select id from public.parceiros loop
    perform public.atualizar_estrategico_sugerido(r.id);
  end loop;

  return jsonb_build_object('status', n_status, 'proximos_passos', n_passos, 'contrapartidas', n_contra);
end $$;
