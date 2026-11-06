-- Exceção por link: o administrador pode liberar a página do cliente de um parceiro que ainda não tem contrato
-- (pedido do patrocinador em 06/11/2026, para o teste com a PluggMe Hub). Sem a marca, vale a regra da migração 24.
alter table public.links_cliente add column if not exists liberado_sem_contrato boolean not null default false;

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
  if not (public.parceiro_assinado(v_parc.id) or v_link.liberado_sem_contrato) or v_parc.data_encerramento is not null then
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
