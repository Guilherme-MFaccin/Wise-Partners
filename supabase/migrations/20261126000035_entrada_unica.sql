-- Entrada única pela página do portal (26/11/2026). Qualquer empresa se cadastra pelo mesmo formulário da página do
-- Wise Partners (/parceiros): clientes do Grupo Tríade, quem quer ser parceiro e quem quer entrar na comunidade.
-- Todo cadastro entra na fila e avisa o gerente da comunidade, com o perfil que a pessoa declarou (cliente do grupo,
-- parceiro, comunidade). O gerente confere quem é e adiciona: como cliente do grupo (acesso à comunidade com as
-- condições), como empresa da comunidade (vitrine) ou como parceiro (conversa de entrada, como antes).
-- O cadastro com conta na hora pela página /comunidade (migração 34) fica fechado: a página leva à do portal.

-- ---------------------------------------------------------------------------
-- 1. A fila guarda o que a empresa contou sobre a relação com o grupo e o que quer no portal
-- ---------------------------------------------------------------------------
alter table public.cadastros_landing add column if not exists cliente_grupo boolean not null default false;
alter table public.cadastros_landing add column if not exists empresas_grupo uuid[] not null default '{}';
alter table public.cadastros_landing add column if not exists interesses text[] not null default '{}';
alter table public.cadastros_landing add constraint cadastros_landing_interesses_validos
  check (interesses <@ array['comprar', 'oferecer', 'indicar', 'ser_parceiro', 'conhecer_consultoria']);
alter table public.cadastros_landing add column if not exists segmento text;
alter table public.cadastros_landing add column if not exists cidade text;
alter table public.cadastros_landing add column if not exists uf text check (uf is null or uf ~ '^[A-Z]{2}$');
alter table public.cadastros_landing add column if not exists faturamento text check (faturamento is null or public.faixa_faturamento_ordem(faturamento) is not null);
alter table public.cadastros_landing add column if not exists vendedores int check (vendedores >= 0);
alter table public.cadastros_landing add column if not exists como_conheceu text;
alter table public.cadastros_landing add column if not exists termo_uso_versao text;
-- O termo de adesão só é aceito por quem quer ser parceiro
alter table public.cadastros_landing alter column termo_versao drop not null;

-- Perfil declarado no cadastro. Cadastro antigo, sem interesses, era sempre de parceiro.
create or replace function public.perfil_cadastro(c public.cadastros_landing) returns text
language sql immutable as $$
  select case when c.cliente_grupo then 'cliente_grupo'
              when 'ser_parceiro' = any(c.interesses) or cardinality(c.interesses) = 0 then 'parceiro'
              else 'comunidade' end
$$;
grant execute on function public.perfil_cadastro(public.cadastros_landing) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Entrar na fila: o mesmo formulário para qualquer empresa. Só a Edge Function cadastro-parceiro chama.
-- ---------------------------------------------------------------------------
create or replace function public.entrar_fila_landing(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing;
  v_com public.config_comunidade;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cliente boolean := coalesce((p->>'cliente_grupo')::boolean, false);
  v_empresas uuid[];
  v_interesses text[];
  v_parceiro boolean;
  v_cat public.categorias;
  v_uf text := upper(nullif(btrim(p->>'uf'), ''));
  v_id uuid;
  v_titulo text;
  v_texto text;
  r record;
begin
  select * into v_cfg from public.config_landing where id = 1;
  select * into v_com from public.config_comunidade where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.' using errcode = 'P0001'; end if;
  if length(coalesce(v_cnpj, '')) <> 14 then raise exception 'CNPJ inválido.' using errcode = 'P0001'; end if;
  if v_uf is not null and v_uf !~ '^[A-Z]{2}$' then raise exception 'UF inválida.' using errcode = 'P0001'; end if;

  select coalesce(array_agg(distinct x), '{}') into v_interesses
    from jsonb_array_elements_text(coalesce(p->'interesses', '[]'::jsonb)) x
   where x in ('comprar', 'oferecer', 'indicar', 'ser_parceiro', 'conhecer_consultoria');
  -- Formulário antigo (sem as perguntas novas): cadastro de parceiro
  v_parceiro := 'ser_parceiro' = any(v_interesses) or (cardinality(v_interesses) = 0 and not v_cliente);
  select coalesce(array_agg(e.id), '{}') into v_empresas
    from public.empresas_grupo e where e.id::text in (select jsonb_array_elements_text(coalesce(p->'empresas_grupo', '[]'::jsonb)));
  if v_cliente and cardinality(v_empresas) = 0 then raise exception 'Diga de qual empresa do Grupo Tríade a sua é cliente.' using errcode = 'P0001'; end if;
  if not v_cliente then v_empresas := '{}'; end if;

  if coalesce((p->>'aceite_privacidade')::boolean, false) is not true
     or (coalesce((p->>'aceite_uso')::boolean, false) is not true and coalesce((p->>'aceite_termo')::boolean, false) is not true) then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if v_parceiro and coalesce((p->>'aceite_termo')::boolean, false) is not true then
    raise exception 'Para ser parceiro, é preciso aceitar o termo de adesão do programa.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal. Entre com ele ou recupere a senha.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Sua empresa já tem cadastro no Wise Partners. Peça um acesso a quem cuida do portal na sua empresa ou fale com a Wise.' using errcode = '23505';
  end if;
  if exists (select 1 from public.cadastros_landing where cnpj = v_cnpj and status in ('fila', 'contatado', 'reuniao_marcada')) then
    raise exception 'O cadastro desta empresa já está com a Wise, que vai falar com você pelo WhatsApp.' using errcode = '23505';
  end if;
  if nullif(p->>'categoria_id', '') is not null then
    select * into v_cat from public.categorias where id = (p->>'categoria_id')::uuid and tipo in ('comercial', 'institucional') and ativa;
  end if;
  if v_parceiro and v_cat.id is null then raise exception 'Escolha a categoria da sua empresa.' using errcode = 'P0001'; end if;

  insert into public.cadastros_landing (
    nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao, status, origem,
    cliente_grupo, empresas_grupo, interesses, segmento, cidade, uf, faturamento, vendedores, como_conheceu, termo_uso_versao)
  values (
    btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    case when (p->>'clientes_ativos') ~ '^\d{1,7}$' then (p->>'clientes_ativos')::int end, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300),
    case when v_parceiro then v_cfg.termo_versao end, v_cfg.privacidade_versao, 'fila', 'pagina',
    v_cliente, v_empresas, case when cardinality(v_interesses) = 0 and v_parceiro then array['ser_parceiro'] else v_interesses end,
    nullif(btrim(left(p->>'segmento', 160)), ''), nullif(btrim(left(p->>'cidade', 80)), ''), v_uf,
    case when public.faixa_faturamento_ordem(p->>'faturamento') is not null then p->>'faturamento' end,
    case when (p->>'vendedores') ~ '^\d{1,5}$' then (p->>'vendedores')::int end, nullif(btrim(left(p->>'como_conheceu', 160)), ''),
    case when coalesce((p->>'aceite_uso')::boolean, false) then v_com.termo_uso_versao end)
  returning id into v_id;

  -- Aviso ao gerente da comunidade (e aos administradores), já com o perfil que a empresa declarou
  if v_cliente then
    v_titulo := 'Cliente do Grupo Tríade quer entrar';
    v_texto := format('%s diz ser cliente da %s. Confira e libere o acesso.', btrim(p->>'empresa'),
      (select string_agg(e.nome, ' e da ' order by e.ordem) from public.empresas_grupo e where e.id = any(v_empresas)));
  elsif v_parceiro then
    v_titulo := 'Novo parceiro na fila';
    v_texto := format('%s (%s, %s clientes) quer ser parceira e aguarda contato.', btrim(p->>'empresa'), coalesce(v_cat.nome, 'sem categoria'),
      coalesce(nullif(p->>'clientes_ativos', ''), '?'));
  else
    v_titulo := 'Nova empresa quer entrar na comunidade';
    v_texto := format('%s se cadastrou pela página. Confira quem é e libere o acesso.', btrim(p->>'empresa'));
  end if;
  for r in select id from public.perfis where papel in ('admin', 'parcerias') and ativo loop
    perform public.notificar(r.id, 'fila_landing', v_titulo, v_texto, '/app/candidatos?id=' || v_id);
  end loop;
  return jsonb_build_object('cadastro_id', v_id, 'email', v_email, 'perfil', case when v_cliente then 'cliente_grupo' when v_parceiro then 'parceiro' else 'comunidade' end);
end $$;
revoke execute on function public.entrar_fila_landing(jsonb) from public, anon, authenticated;
grant execute on function public.entrar_fila_landing(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 3. O gerente adiciona: como cliente do grupo ou como empresa da comunidade (a conta sai depois, pela convidar-usuario)
-- ---------------------------------------------------------------------------
create or replace function public.aprovar_cadastro_comunidade(p_id uuid, p_cliente_grupo boolean, p_empresa_grupo uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c public.cadastros_landing;
  v_com public.config_comunidade;
  v_parceiro uuid;
  v_contato uuid;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.cadastros_landing where id = p_id for update;
  if c.id is null then raise exception 'Cadastro não encontrado.' using errcode = 'P0001'; end if;
  if c.status not in ('fila', 'contatado', 'reuniao_marcada') then raise exception 'Este cadastro não está na fila.' using errcode = 'P0001'; end if;
  if p_cliente_grupo and p_empresa_grupo is null then raise exception 'Diga de qual empresa do grupo ela é cliente.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = c.cnpj) then
    raise exception 'Esta empresa já está cadastrada no portal.' using errcode = '23505';
  end if;
  select * into v_com from public.config_comunidade where id = 1;

  insert into public.parceiros (nome_fantasia, cnpj, site, cidade, uf, tipo_parceria, origem, etapa, created_by, cliente_grupo, empresa_grupo_cliente_id, consultor_cliente_id)
  values (c.empresa, c.cnpj, c.site, c.cidade, c.uf, 'cliente', 'comunidade', 'qualificacao', auth.uid(), p_cliente_grupo,
          case when p_cliente_grupo then p_empresa_grupo end, case when p_cliente_grupo then auth.uid() end)
  returning id into v_parceiro;
  if c.categoria_id is not null then
    insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, c.categoria_id, true);
  end if;
  insert into public.contatos (nome, cargo, email, whatsapp) values (c.nome, c.cargo, c.email, c.whatsapp) returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal) values (v_parceiro, v_contato, '{decisor}', true);

  insert into public.membros_comunidade (
    parceiro_id, nome, cargo, email, whatsapp, empresa, cnpj, site, cidade, uf, segmento, faturamento, vendedores,
    vinculo_cliente, empresas_grupo, interesses, como_conheceu, utm_source, utm_medium, utm_campaign, utm_content, referencia,
    termo_uso_versao, privacidade_versao, aceite_em, vinculo_decidido_por, vinculo_decidido_em, created_at)
  values (
    v_parceiro, c.nome, c.cargo, c.email, c.whatsapp, c.empresa, c.cnpj, c.site, c.cidade, c.uf, c.segmento, c.faturamento, c.vendedores,
    case when p_cliente_grupo then 'confirmado' when c.cliente_grupo then 'nao_confirmado' else 'nao_declarado' end,
    case when p_cliente_grupo then array[p_empresa_grupo] else c.empresas_grupo end,
    c.interesses, c.como_conheceu, c.utm_source, c.utm_medium, c.utm_campaign, c.utm_content, c.referencia,
    coalesce(c.termo_uso_versao, v_com.termo_uso_versao, '2026-11-23'), c.privacidade_versao, c.aceite_em,
    case when p_cliente_grupo or c.cliente_grupo then auth.uid() end, case when p_cliente_grupo or c.cliente_grupo then now() end, c.created_at);

  update public.cadastros_landing set parceiro_id = v_parceiro, status = 'aprovado', aprovado_em = now(), atualizado_em = now() where id = p_id;
  return jsonb_build_object('parceiro_id', v_parceiro, 'email', c.email, 'nome', c.nome, 'empresa', c.empresa);
end $$;
revoke execute on function public.aprovar_cadastro_comunidade(uuid, boolean, uuid) from public, anon;
grant execute on function public.aprovar_cadastro_comunidade(uuid, boolean, uuid) to authenticated;

-- Aprovar como parceiro exige o termo de adesão aceito no cadastro
create or replace function public.trg_aprovar_exige_termo() returns trigger language plpgsql as $$
begin
  if new.status = 'aprovado' and old.status is distinct from 'aprovado' and new.termo_versao is null
     and not exists (select 1 from public.parceiros p where p.id = new.parceiro_id and p.tipo_parceria = 'cliente') then
    raise exception 'Esta empresa não aceitou o termo de adesão no cadastro. Adicione como cliente do grupo ou como empresa da comunidade.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger t_aprovar_exige_termo before update of status on public.cadastros_landing for each row execute function public.trg_aprovar_exige_termo();

-- ---------------------------------------------------------------------------
-- 4. O cadastro com conta na hora pela página /comunidade fecha; a página leva à do portal
-- ---------------------------------------------------------------------------
update public.config_comunidade set publicada = false where id = 1;

-- ---------------------------------------------------------------------------
-- 5. Tarefas da fila pelo perfil declarado: confirmar o cliente, avaliar a empresa ou falar com o candidato a parceiro
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
