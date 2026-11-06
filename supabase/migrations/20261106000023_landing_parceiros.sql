-- Landing page dos parceiros SaaS de CRM e ERP (/parceiros): cadastro sem conversa, com aceite eletrônico do termo padrão.
-- Migração aditiva: não altera migrações aplicadas; muda regras por "create or replace" e por novas restrições.

-- ---------------------------------------------------------------------------
-- 1. Aceite eletrônico conta como a aprovação de assinatura (decisão do patrocinador, FO-08 e FO-09):
--    o SaaS que aceita o termo padrão no cadastro não depende da assinatura do Diretor caso a caso.
-- ---------------------------------------------------------------------------
alter table public.aprovacoes drop constraint if exists aprovacoes_tipo_check;
alter table public.aprovacoes add constraint aprovacoes_tipo_check check (tipo in ('assinatura', 'aceite_eletronico'));
alter table public.aprovacoes alter column aprovado_por drop not null;
alter table public.aprovacoes add constraint aprovacoes_aprovador_obrigatorio
  check (tipo = 'aceite_eletronico' or aprovado_por is not null);

create or replace function public.tem_aprovacao_assinatura(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.aprovacoes a where a.parceiro_id = p_id and a.tipo in ('assinatura', 'aceite_eletronico'))
$$;

create or replace function public.trg_aprovacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  select nome_fantasia into v_nome from public.parceiros where id = new.parceiro_id;
  if new.tipo = 'aceite_eletronico' then
    perform public.notificar_responsavel(new.parceiro_id, 'aprovacao_registrada', 'Parceiro cadastrado pela landing page',
      format('%s aceitou o termo padrão no cadastro e já tem acesso ao portal.', v_nome), '/app/parceiros/' || new.parceiro_id);
  else
    perform public.notificar_responsavel(new.parceiro_id, 'aprovacao_registrada', 'Assinatura aprovada pelo Diretor',
      format('A assinatura de %s foi aprovada. O parceiro pode seguir para fechamento.', v_nome), '/app/parceiros/' || new.parceiro_id);
  end if;
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Configuração da landing page (uma linha só): o administrador edita no portal.
--    Tokens de API nunca ficam aqui: a API de Conversões do Meta usa o segredo META_CAPI_TOKEN da Edge Function.
-- ---------------------------------------------------------------------------
create table public.config_landing (
  id int primary key default 1 check (id = 1),
  publicada boolean not null default true,
  video_url text,
  pixel_meta_id text check (pixel_meta_id is null or pixel_meta_id ~ '^[0-9]{6,20}$'),
  capi_ativa boolean not null default false,
  ga4_id text check (ga4_id is null or ga4_id ~ '^G-[A-Z0-9]{4,15}$'),
  termo_versao text not null default '2026-11-06',
  termo_texto text not null,
  privacidade_versao text not null default '2026-11-06',
  privacidade_texto text not null,
  contato_privacidade text not null default 'contato@wisemakers.com.br',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.perfis(id)
);
create trigger t_upd before update on public.config_landing for each row execute function public.set_updated_at();
alter table public.config_landing enable row level security;
create policy cl_ler on public.config_landing for select to authenticated using (public.is_parcerias());
create policy cl_admin on public.config_landing for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Registro de cada cadastro feito pela página, com a origem do anúncio (UTM) e os aceites.
-- ---------------------------------------------------------------------------
create table public.cadastros_landing (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid references public.parceiros(id) on delete set null,
  nome text not null,
  email text not null,
  whatsapp text not null,
  empresa text not null,
  cnpj text not null,
  categoria_id uuid references public.categorias(id),
  categoria_nome text,
  clientes_ativos int check (clientes_ativos >= 0),
  site text,
  cargo text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  fbclid text,
  referencia text,
  termo_versao text not null,
  privacidade_versao text not null,
  aceite_em timestamptz not null default now(),
  status text not null default 'criado' check (status in ('criado', 'falhou')),
  erro text,
  created_at timestamptz not null default now()
);
create index on public.cadastros_landing (created_at desc);
create index on public.cadastros_landing (utm_campaign, utm_content);
alter table public.cadastros_landing enable row level security;
create policy cad_ler on public.cadastros_landing for select to authenticated using (public.is_parcerias());

-- ---------------------------------------------------------------------------
-- 4. Cadastro completo, numa transação: parceiro, categoria, contato, aceite, onboarding e convite de acesso.
--    Só a Edge Function cadastro-parceiro chama (service_role); a conta de login nasce depois, a partir do convite.
-- ---------------------------------------------------------------------------
create or replace function public.cadastrar_parceiro_landing(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cat public.categorias;
  v_parceiro uuid;
  v_contato uuid;
  v_cadastro uuid;
begin
  select * into v_cfg from public.config_landing where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.' using errcode = 'P0001';
  end if;
  if length(v_cnpj) <> 14 then
    raise exception 'CNPJ inválido.' using errcode = 'P0001';
  end if;
  if coalesce((p->>'aceite_termo')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias where id = nullif(p->>'categoria_id', '')::uuid and tipo = 'comercial' and ativa;
  if v_cat.id is null then
    raise exception 'Escolha o tipo de software.' using errcode = 'P0001';
  end if;

  insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
  values (btrim(p->>'empresa'), v_cnpj, nullif(btrim(p->>'site'), ''), 'comercial', 'landing_saas', 'qualificacao', null)
  returning id into v_parceiro;

  insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, v_cat.id, true);

  insert into public.contatos (nome, cargo, email, whatsapp)
  values (btrim(p->>'nome'), nullif(btrim(p->>'cargo'), ''), v_email, btrim(p->>'whatsapp'))
  returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
  values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);

  -- Aceite eletrônico do termo padrão = assinatura; nível de entrada Select e pacote Prateleira até o time revisar
  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null, format('Termo padrão versão %s aceito na landing page.', v_cfg.termo_versao));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela landing page: nível a confirmar pela carteira no ICP.',
         pacote = 'C', data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  insert into public.convites (email, nome, papel, parceiro_id, is_responsavel_parceiro)
  values (v_email, btrim(p->>'nome'), 'parceiro', v_parceiro, true);

  insert into public.cadastros_landing (
    parceiro_id, nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao)
  values (
    v_parceiro, btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    nullif(p->>'clientes_ativos', '')::int, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300), v_cfg.termo_versao, v_cfg.privacidade_versao)
  returning id into v_cadastro;

  return jsonb_build_object('parceiro_id', v_parceiro, 'cadastro_id', v_cadastro, 'email', v_email);
end $$;

-- Desfaz um cadastro quando a conta de login não pôde ser criada (chamado pela Edge Function).
create or replace function public.desfazer_cadastro_landing(p_cadastro uuid, p_erro text) returns void
language plpgsql security definer set search_path = public as $$
declare v_parceiro uuid; v_email text;
begin
  select parceiro_id, email into v_parceiro, v_email from public.cadastros_landing where id = p_cadastro;
  delete from public.convites where lower(email) = lower(v_email);
  update public.cadastros_landing set status = 'falhou', erro = left(p_erro, 500), parceiro_id = null where id = p_cadastro;
  delete from public.parceiro_contatos where parceiro_id = v_parceiro;
  delete from public.parceiros where id = v_parceiro;
end $$;

revoke execute on function public.cadastrar_parceiro_landing(jsonb) from public, anon, authenticated;
revoke execute on function public.desfazer_cadastro_landing(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Textos iniciais do termo padrão e da política de privacidade (minutas: revisão jurídica antes de publicar).
-- ---------------------------------------------------------------------------
insert into public.config_landing (id, termo_texto, privacidade_texto) values (1,
$termo$## Termo de adesão ao Programa Wise Partners

Este termo vale entre a Wise Makers e a empresa que se cadastra no Programa Wise Partners pela página de cadastro (a Parceira). Ao marcar a caixa de aceite e concluir o cadastro, a Parceira declara que leu e aceita estas condições, e o aceite tem o mesmo valor de uma assinatura.

## 1. Objeto

Parceria de indicação e cooperação: a Parceira oferece aos clientes dela a consultoria comercial incluída da Wise Makers (diagnóstico de maturidade comercial, mapa de planejamento e acesso ao Wise Hub) e pode indicar clientes para a consultoria da Wise Makers.

## 2. Custos

Não há custo, mensalidade nem taxa para a Parceira ou para os clientes dela participarem do programa.

## 3. Natureza das entregas

As entregas da Wise Makers são obrigação de meio. Não há garantia de volume de indicações, de cadastros ou de resultado. O diagnóstico individual com a equipe da Wise Makers é oferecido às empresas que se enquadram no perfil atendido, conforme a agenda disponível; o autodiagnóstico do Wise Hub é aberto aos clientes da Parceira.

## 4. Comissão

Quando um cliente que chegou pelo link da Parceira contrata a consultoria da Wise Makers, a Parceira recebe 40% da primeira mensalidade, depois da compensação do primeiro pagamento do cliente. O pagamento é feito ao CNPJ da Parceira, mediante nota fiscal, sem repasse mínimo e sem devolução. A comissão incide uma vez por cliente novo e não incide sobre renovações. O Wise Hub não gera comissão.

## 5. Atribuição

A comissão é de quem gerou o primeiro contato registrado, identificado pelo link exclusivo da Parceira no portal.

## 6. Exclusividade e metas

Não há exclusividade em nenhum sentido e não há meta mínima de indicações.

## 7. Dados

A Wise Makers não recebe a lista de clientes da Parceira. Os dados dos clientes da Parceira que fazem o diagnóstico são tratados pela Wise Makers conforme a Lei nº 13.709/2018 (LGPD) e a política de privacidade. O resultado individual do diagnóstico só é compartilhado com a Parceira com autorização escrita do cliente.

## 8. Uso de marca

Cada parte pode usar a marca da outra para divulgar a parceria. A retirada acontece em até 10 dias quando solicitada.

## 9. Confidencialidade e não aliciamento

As condições comerciais são confidenciais durante a parceria e por 2 anos depois do encerramento. Nenhuma das partes alicia profissionais da outra durante a parceria e por 6 meses depois.

## 10. Vigência e encerramento

Prazo indeterminado. Qualquer das partes pode encerrar a qualquer momento, com aviso de 30 dias, sem ônus. Comissões já geradas continuam devidas.

## 11. Foro

Fica eleito o foro de Maringá, Paraná.$termo$,
$priv$## Política de privacidade da página de cadastro do Programa Wise Partners

A Wise Makers trata os dados pessoais informados nesta página conforme a Lei nº 13.709/2018 (LGPD).

## Dados coletados

Nome, e-mail, WhatsApp, cargo, nome da empresa, CNPJ, site, tipo de software e número aproximado de clientes ativos. Também registramos a origem do acesso (parâmetros da campanha que trouxe você até a página) e a data do aceite.

## Para que usamos

Criar o seu acesso ao portal Wise Partners, cumprir o termo de adesão ao programa, entrar em contato sobre a parceria, enviar conteúdos e convites do programa e medir quais campanhas trazem parceiros.

## Base legal

Execução do termo de adesão e procedimentos preliminares a ele, e legítimo interesse para a medição das campanhas.

## Compartilhamento

Os dados não são vendidos. São compartilhados apenas com os fornecedores que hospedam o portal e, quando ativos, com as ferramentas de medição de anúncios, na medida necessária.

## Guarda

Os dados ficam guardados enquanto durar a parceria e pelo prazo exigido por lei depois do encerramento.

## Seus direitos

Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e revogar o consentimento, pelo e-mail de privacidade informado nesta página.$priv$);

-- ---------------------------------------------------------------------------
-- 6. Quem tem outro tipo de sistema também entra (decisão do patrocinador): categoria genérica no fim da lista.
-- ---------------------------------------------------------------------------
insert into public.categorias (nome, tipo, ordem) values ('Outro tipo de software', 'comercial', 99)
on conflict (tipo, nome) do nothing;
