-- Fila de espera dos parceiros que chegam pela landing page (pedido do Igor, 07/11/2026).
-- Quem se cadastra na página entra numa fila; o Igor fala com cada um pelo WhatsApp, manda o link da agenda
-- e só depois aprova. A aprovação cria o parceiro (aceite eletrônico, onboarding); a conta de acesso sai pela
-- função convidar-usuario, com senha provisória, como nos outros acessos do portal.
-- O modo antigo (acesso na hora) continua disponível em Configurações.

alter table public.config_landing add column if not exists modo_cadastro text not null default 'fila'
  check (modo_cadastro in ('fila', 'acesso_direto'));

alter table public.config_landing add column if not exists agenda_url text check (agenda_url is null or agenda_url ~ '^https://');

alter table public.cadastros_landing drop constraint if exists cadastros_landing_status_check;
alter table public.cadastros_landing add constraint cadastros_landing_status_check
  check (status in ('criado', 'falhou', 'fila', 'contatado', 'reuniao_marcada', 'aprovado', 'descartado'));
alter table public.cadastros_landing add column if not exists observacao text;
alter table public.cadastros_landing add column if not exists atualizado_em timestamptz;
alter table public.cadastros_landing add column if not exists aprovado_em timestamptz;

-- O time de parcerias muda a situação e as observações da fila (a aprovação tem função própria)
create policy cad_fila on public.cadastros_landing for update to authenticated
  using (public.is_parcerias()) with check (public.is_parcerias() and status in ('fila', 'contatado', 'reuniao_marcada', 'descartado'));

-- ---------------------------------------------------------------------------
-- Entrar na fila: mesmas validações do cadastro, sem criar parceiro nem acesso. Só a Edge Function chama.
-- ---------------------------------------------------------------------------
create or replace function public.entrar_fila_landing(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cat public.categorias;
  v_id uuid;
  r record;
begin
  select * into v_cfg from public.config_landing where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.' using errcode = 'P0001'; end if;
  if length(v_cnpj) <> 14 then raise exception 'CNPJ inválido.' using errcode = 'P0001'; end if;
  if coalesce((p->>'aceite_termo')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  if exists (select 1 from public.cadastros_landing where cnpj = v_cnpj and status in ('fila', 'contatado', 'reuniao_marcada')) then
    raise exception 'Esta empresa já está na fila. A Wise Makers vai falar com você pelo WhatsApp.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias where id = nullif(p->>'categoria_id', '')::uuid and tipo = 'comercial' and ativa;
  if v_cat.id is null then raise exception 'Escolha o tipo de software.' using errcode = 'P0001'; end if;

  insert into public.cadastros_landing (
    nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao, status)
  values (
    btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    nullif(p->>'clientes_ativos', '')::int, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300), v_cfg.termo_versao, v_cfg.privacidade_versao, 'fila')
  returning id into v_id;

  for r in select id from public.perfis where papel = 'admin' and ativo loop
    perform public.notificar(r.id, 'fila_landing', 'Novo parceiro na fila',
      format('%s (%s, %s clientes) se cadastrou pela página e aguarda contato.', btrim(p->>'empresa'), v_cat.nome, coalesce(nullif(p->>'clientes_ativos', ''), '?')),
      '/app/configuracoes?aba=landing');
  end loop;
  return jsonb_build_object('cadastro_id', v_id, 'email', v_email);
end $$;

-- ---------------------------------------------------------------------------
-- Aprovar: cria o parceiro a partir do cadastro da fila (aceite eletrônico já feito na página),
-- leva para onboarding e devolve o que a tela precisa para criar o acesso.
-- ---------------------------------------------------------------------------
create or replace function public.aprovar_cadastro_landing(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c public.cadastros_landing;
  v_parceiro uuid;
  v_contato uuid;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.cadastros_landing where id = p_id for update;
  if c.id is null then raise exception 'Cadastro não encontrado.' using errcode = 'P0001'; end if;
  if c.status not in ('fila', 'contatado', 'reuniao_marcada') then
    raise exception 'Este cadastro não está na fila.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = c.cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;

  insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
  values (c.empresa, c.cnpj, c.site, 'comercial', 'landing_saas', 'qualificacao', auth.uid())
  returning id into v_parceiro;
  if c.categoria_id is not null then
    insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, c.categoria_id, true);
  end if;
  insert into public.contatos (nome, cargo, email, whatsapp) values (c.nome, c.cargo, c.email, c.whatsapp) returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
  values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);

  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null,
    format('Termo padrão versão %s aceito na landing page em %s; aprovado da fila.', c.termo_versao, to_char(c.aceite_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela landing page: nível a confirmar pela carteira no ICP.',
         pacote = 'C', data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  update public.cadastros_landing set parceiro_id = v_parceiro, status = 'aprovado', aprovado_em = now(), atualizado_em = now() where id = p_id;
  return jsonb_build_object('parceiro_id', v_parceiro, 'email', c.email, 'nome', c.nome, 'empresa', c.empresa);
end $$;

revoke execute on function public.entrar_fila_landing(jsonb) from public, anon, authenticated;
grant execute on function public.entrar_fila_landing(jsonb) to service_role;
revoke execute on function public.aprovar_cadastro_landing(uuid) from public, anon;
