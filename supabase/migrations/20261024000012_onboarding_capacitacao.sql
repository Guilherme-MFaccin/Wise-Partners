-- Portal Wise Partners 2.0: onboarding em 90 dias com ativação e trilhas de venda com certificado (Histórias 5 e 10)

create table public.planos_onboarding (
  parceiro_id uuid primary key references public.parceiros(id) on delete cascade,
  inicio date not null,
  prazo_final date not null,
  estendido_ate date,
  situacao text not null default 'em_andamento' check (situacao in ('em_andamento', 'ativado', 'nao_ativado')),
  ativado_em date,
  indicacao_ativacao_id uuid references public.indicacoes(id) on delete set null,
  primeira_indicacao_em date,
  dias_ate_primeira_indicacao int,
  dias_ate_ativacao int,
  alertado_90 boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marcos_onboarding (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null check (tipo in ('encontro_alinhamento', 'encontro_vendas', 'encontro_produto', 'encontro_pos_venda', 'marco_30', 'marco_60', 'marco_90')),
  prazo date not null,
  cumprido_em date,
  ponto_contato_id uuid references public.pontos_contato(id) on delete set null,
  unique (parceiro_id, tipo)
);

create trigger t_upd before update on public.planos_onboarding for each row execute function public.set_updated_at();
create trigger t_hist after insert or update on public.planos_onboarding
for each row execute function public.trg_historico('situacao', 'ativado_em', 'estendido_ate');

-- Onboarding: v1 (tarefas, contrapartidas, Base Ativa) mais plano de 90 dias, ações da Wise e link de indicação
create or replace function public.iniciar_onboarding(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.parceiros;
  v_tarefas jsonb;
  t jsonb;
  v_hoje date := public.hoje();
  v_prazo date := public.add_dias_uteis(v_hoje, 2);
  v_dias int := public.config_int('onboarding_dias', 90);
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.tipo_parceria = 'comercial' then
    select tarefas_onboarding into v_tarefas from public.pacotes where codigo = p.pacote;
  else
    v_tarefas := public.config('tarefas_onboarding_institucional');
  end if;
  if not exists (select 1 from public.tarefas_onboarding where parceiro_id = p.id) then
    for t in select * from jsonb_array_elements(coalesce(v_tarefas, '[]'::jsonb)) loop
      insert into public.tarefas_onboarding (parceiro_id, descricao, prazo, responsavel_id)
      values (p.id, t #>> '{}', v_prazo, p.responsavel_id);
    end loop;
  end if;
  perform public.gerar_contrapartidas(p.id);
  perform public.gerar_acoes_wise(p.id);
  if p.pacote = 'A' and not exists (
    select 1 from public.ciclos_base_ativa where parceiro_id = p.id and estado in ('fila', 'em_ciclo')
  ) then
    insert into public.ciclos_base_ativa (parceiro_id) values (p.id);
  end if;

  -- Plano de 90 dias (Apêndice F): só parceria comercial
  if p.tipo_parceria = 'comercial' and not exists (select 1 from public.planos_onboarding where parceiro_id = p.id) then
    insert into public.planos_onboarding (parceiro_id, inicio, prazo_final) values (p.id, v_hoje, v_hoje + v_dias);
    insert into public.marcos_onboarding (parceiro_id, tipo, prazo) values
      (p.id, 'encontro_alinhamento', v_hoje + 7),
      (p.id, 'encontro_vendas', v_hoje + 30),
      (p.id, 'marco_30', v_hoje + 30),
      (p.id, 'encontro_produto', v_hoje + 60),
      (p.id, 'marco_60', v_hoje + 60),
      (p.id, 'encontro_pos_venda', v_hoje + v_dias),
      (p.id, 'marco_90', v_hoje + v_dias);
  end if;
  if p.tipo_parceria = 'comercial' then
    perform public.garantir_link_indicacao(p.id);
  end if;
end $$;

-- Registro de um encontro do onboarding: cria o ponto de contato e a atividade com o esforço do catálogo
create or replace function public.registrar_encontro_onboarding(p_marco uuid, p_data date, p_texto text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  m public.marcos_onboarding;
  v_chave text;
  v_tipo uuid;
  v_pc uuid;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into m from public.marcos_onboarding where id = p_marco;
  if m.id is null or m.tipo not like 'encontro_%' then raise exception 'Encontro não encontrado.' using errcode = 'P0001'; end if;
  v_chave := m.tipo;
  select id into v_tipo from public.tipos_atividade where chave = v_chave;
  insert into public.pontos_contato (parceiro_id, tipo, data, texto, tipo_atividade_id, autor_id)
  values (m.parceiro_id, 'reuniao_online', coalesce(p_data, public.hoje())::timestamp + interval '12 hours',
          coalesce(p_texto, 'Encontro de onboarding: ' || replace(m.tipo, 'encontro_', '')), v_tipo, auth.uid())
  returning id into v_pc;
  update public.marcos_onboarding set cumprido_em = coalesce(p_data, public.hoje()), ponto_contato_id = v_pc where id = m.id;
  return v_pc;
end $$;

-- Ativação: primeira indicação do parceiro ao grupo com ICP confirmado que virou reunião (FR-126)
create or replace function public.ativar_parceiro(p_parceiro uuid, p_indicacao uuid, p_data date) returns void
language plpgsql security definer set search_path = public as $$
declare
  pl public.planos_onboarding;
  v_nome text;
begin
  select * into pl from public.planos_onboarding where parceiro_id = p_parceiro;
  if pl.parceiro_id is null or pl.situacao = 'ativado' then return; end if;
  update public.planos_onboarding
     set situacao = 'ativado', ativado_em = p_data, indicacao_ativacao_id = p_indicacao, dias_ate_ativacao = p_data - inicio
   where parceiro_id = p_parceiro;
  update public.marcos_onboarding set cumprido_em = p_data where parceiro_id = p_parceiro and tipo = 'marco_90' and cumprido_em is null;
  update public.parceiros set etapa = 'parceria_ativa' where id = p_parceiro and etapa = 'onboarding';
  select nome_fantasia into v_nome from public.parceiros where id = p_parceiro;
  perform public.notificar_responsavel(p_parceiro, 'parceiro_ativado', 'Parceiro ativado',
    format('%s foi ativado: a primeira indicação no ICP virou reunião.', v_nome), '/app/parceiros/' || p_parceiro);
  perform public.notificar_parceiro(p_parceiro, 'parceiro_ativado', 'Parceria ativada',
    'A primeira indicação de vocês no perfil de cliente da Wise virou reunião. A parceria está ativa.', '/parceiro');
end $$;

-- Confere se o parceiro tem indicação que ativa (usada pelo gatilho de indicações e pela rotina diária)
create or replace function public.verificar_ativacao(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare i record;
begin
  if not exists (select 1 from public.planos_onboarding where parceiro_id = p_parceiro and situacao <> 'ativado') then return; end if;
  select id, data_reuniao into i from public.indicacoes
   where parceiro_id = p_parceiro and sentido = 'parceiro_para_grupo' and icp_confirmado and data_reuniao is not null
     and data_reuniao <= public.hoje()
   order by data_reuniao, created_at limit 1;
  if i.id is not null then
    perform public.ativar_parceiro(p_parceiro, i.id, i.data_reuniao);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Capacitação: trilhas, módulos, teste, progresso e certificados (FR-152 a FR-156)
-- ---------------------------------------------------------------------------
create table public.trilhas (
  id uuid primary key default gen_random_uuid(),
  chave text unique,                      -- 'como_vender' é a trilha dos requisitos de nível
  titulo text not null,
  descricao text,
  versao int not null default 1,
  publicada boolean not null default false,
  nota_minima int not null default 70 check (nota_minima between 0 and 100),
  empresa_grupo_id uuid references public.empresas_grupo(id),
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trilha_modulos (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  ordem int not null default 0,
  titulo text not null,
  tipo text not null check (tipo in ('video_arquivo', 'video_link', 'pdf', 'texto')),
  caminho text,                           -- bucket "trilhas"
  link text,
  texto text
);

create table public.trilha_perguntas (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  ordem int not null default 0,
  enunciado text not null,
  opcoes jsonb not null                    -- lista de textos
);

-- Gabarito separado: só administradores leem; a correção é feita pela função
create table public.trilha_gabarito (
  pergunta_id uuid primary key references public.trilha_perguntas(id) on delete cascade,
  correta int not null                     -- índice da opção correta (0 em diante)
);

create table public.trilha_progresso (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  modulo_id uuid not null references public.trilha_modulos(id) on delete cascade,
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  concluido_em timestamptz not null default now(),
  primary key (perfil_id, modulo_id)
);

create table public.trilha_tentativas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  versao int not null,
  respostas jsonb not null,
  nota numeric(5,2) not null,
  aprovado boolean not null,
  created_at timestamptz not null default now()
);

create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  versao int not null,
  codigo text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  nome_pessoa text not null,
  titulo_trilha text not null,
  emitido_em timestamptz not null default now(),
  caminho_pdf text,
  ativo boolean not null default true,
  unique (perfil_id, trilha_id)
);

create trigger t_upd before update on public.trilhas for each row execute function public.set_updated_at();
create trigger t_hist after insert or update on public.certificados for each row execute function public.trg_historico('titulo_trilha', 'ativo');
create trigger t_hist after insert or update on public.trilhas for each row execute function public.trg_historico('titulo', 'versao', 'publicada');

-- Progresso: grava o parceiro da pessoa para a RLS e para as contagens
create or replace function public.trg_trilha_parceiro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select parceiro_id into new.parceiro_id from public.perfis where id = new.perfil_id;
  return new;
end $$;
create trigger t_parceiro before insert on public.trilha_progresso for each row execute function public.trg_trilha_parceiro();

-- Pessoa desativada: certificados deixam de contar (FR-156, caso de borda)
create or replace function public.trg_perfil_certificados() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.ativo is distinct from old.ativo then
    update public.certificados set ativo = new.ativo where perfil_id = new.id;
  end if;
  return null;
end $$;
create trigger t_perfil_certificados after update of ativo on public.perfis for each row execute function public.trg_perfil_certificados();

create or replace function public.pessoas_certificadas(p_parceiro uuid, p_chave_trilha text default 'como_vender') returns int
language sql stable security definer set search_path = public as $$
  select count(distinct c.perfil_id)::int
  from public.certificados c join public.trilhas t on t.id = c.trilha_id
  join public.perfis pf on pf.id = c.perfil_id
  where c.parceiro_id = p_parceiro and c.ativo and pf.ativo
    and (p_chave_trilha is null or t.chave = p_chave_trilha)
$$;

create or replace function public.responsavel_certificado(p_parceiro uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.certificados c join public.trilhas t on t.id = c.trilha_id
    join public.perfis pf on pf.id = c.perfil_id
    where c.parceiro_id = p_parceiro and c.ativo and pf.ativo and pf.is_responsavel_parceiro and t.chave = 'como_vender')
$$;

-- Marca módulo concluído pela própria pessoa do parceiro
create or replace function public.concluir_modulo(p_modulo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_trilha public.trilhas;
begin
  if public.parceiro_atual() is null or not public.parceiro_assinado(public.parceiro_atual()) then
    raise exception 'Capacitação disponível para parceiros com contrato assinado.' using errcode = '42501';
  end if;
  select t.* into v_trilha from public.trilhas t join public.trilha_modulos m on m.trilha_id = t.id where m.id = p_modulo;
  if v_trilha.id is null or not v_trilha.publicada then raise exception 'Módulo não encontrado.' using errcode = 'P0001'; end if;
  insert into public.trilha_progresso (perfil_id, modulo_id) values (auth.uid(), p_modulo) on conflict do nothing;
end $$;

-- Corrige o teste, grava a tentativa e emite o certificado (FR-153, FR-154)
create or replace function public.corrigir_teste(p_trilha uuid, p_respostas jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t public.trilhas;
  v_perfil public.perfis;
  v_total int;
  v_certas int;
  v_nota numeric;
  v_aprovado boolean;
  v_ultima record;
  v_horas int := public.config_int('nova_tentativa_horas', 24);
  v_cert public.certificados;
begin
  select * into v_perfil from public.perfis where id = auth.uid() and ativo and papel = 'parceiro';
  if v_perfil.id is null or not public.parceiro_assinado(v_perfil.parceiro_id) then
    raise exception 'Capacitação disponível para parceiros com contrato assinado.' using errcode = '42501';
  end if;
  select * into t from public.trilhas where id = p_trilha and publicada;
  if t.id is null then raise exception 'Trilha não encontrada.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.trilha_modulos m where m.trilha_id = t.id
             and not exists (select 1 from public.trilha_progresso g where g.modulo_id = m.id and g.perfil_id = v_perfil.id)) then
    raise exception 'Conclua todos os módulos antes do teste.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.certificados where perfil_id = v_perfil.id and trilha_id = t.id and versao = t.versao) then
    raise exception 'Você já tem o certificado desta trilha.' using errcode = 'P0001';
  end if;
  select * into v_ultima from public.trilha_tentativas
   where perfil_id = v_perfil.id and trilha_id = t.id and not aprovado order by created_at desc limit 1;
  if v_ultima.id is not null and v_ultima.created_at > now() - make_interval(hours => v_horas) then
    raise exception 'Você poderá refazer o teste a partir de %.',
      to_char((v_ultima.created_at + make_interval(hours => v_horas)) at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI')
      using errcode = 'P0001';
  end if;

  select count(*), count(*) filter (where (p_respostas ->> q.id::text)::int = g.correta)
    into v_total, v_certas
  from public.trilha_perguntas q join public.trilha_gabarito g on g.pergunta_id = q.id
  where q.trilha_id = t.id;
  if v_total = 0 then raise exception 'Esta trilha ainda não tem teste.' using errcode = 'P0001'; end if;
  v_nota := round(v_certas::numeric / v_total * 100, 2);
  v_aprovado := v_nota >= t.nota_minima;
  insert into public.trilha_tentativas (perfil_id, parceiro_id, trilha_id, versao, respostas, nota, aprovado)
  values (v_perfil.id, v_perfil.parceiro_id, t.id, t.versao, p_respostas, v_nota, v_aprovado);

  if v_aprovado then
    insert into public.certificados (perfil_id, parceiro_id, trilha_id, versao, nome_pessoa, titulo_trilha)
    values (v_perfil.id, v_perfil.parceiro_id, t.id, t.versao, v_perfil.nome, t.titulo)
    on conflict (perfil_id, trilha_id) do update
      set versao = excluded.versao, emitido_em = now(), ativo = true, titulo_trilha = excluded.titulo_trilha
    returning * into v_cert;
    perform public.lancar_pontos(v_perfil.parceiro_id, 'pessoa_certificada', v_cert.id, public.hoje());
    perform public.verificar_subida_nivel(v_perfil.parceiro_id);
    perform public.notificar_responsavel(v_perfil.parceiro_id, 'certificado_emitido', 'Certificado emitido',
      format('%s concluiu a trilha "%s".', v_perfil.nome, t.titulo), '/app/parceiros/' || v_perfil.parceiro_id);
  end if;
  return jsonb_build_object('nota', v_nota, 'aprovado', v_aprovado, 'acertos', v_certas, 'total', v_total,
    'nota_minima', t.nota_minima, 'certificado_id', v_cert.id);
end $$;

-- Publica nova versão da trilha: certificados anteriores continuam válidos com a versão em que foram obtidos
create or replace function public.publicar_trilha(p_trilha uuid, p_nova_versao boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  update public.trilhas set publicada = true, versao = versao + case when p_nova_versao then 1 else 0 end
   where id = p_trilha returning versao into v;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado das trilhas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('trilhas', 'trilhas', false) on conflict (id) do nothing;
create policy st_trilha_ler on storage.objects for select to authenticated using (
  bucket_id = 'trilhas' and (public.is_interno_leitura()
    or (public.parceiro_atual() is not null and public.parceiro_assinado(public.parceiro_atual()))));
create policy st_trilha_gravar on storage.objects for insert to authenticated with check (bucket_id = 'trilhas' and public.is_admin());
create policy st_trilha_excluir on storage.objects for delete to authenticated using (bucket_id = 'trilhas' and public.is_admin());

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t) from unnest(array['planos_onboarding', 'marcos_onboarding', 'trilhas', 'trilha_modulos',
  'trilha_perguntas', 'trilha_gabarito', 'trilha_progresso', 'trilha_tentativas', 'certificados']) t;

create policy plano_ler on public.planos_onboarding for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy plano_gerir on public.planos_onboarding for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy marco_ler on public.marcos_onboarding for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy marco_gerir on public.marcos_onboarding for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Trilhas: internos de leitura leem; parceiro assinado lê as publicadas
create policy trilha_ler on public.trilhas for select to authenticated
  using (public.is_interno_leitura() or (publicada and public.parceiro_atual() is not null and public.parceiro_assinado(public.parceiro_atual())));
create policy trilha_admin on public.trilhas for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy modulo_ler on public.trilha_modulos for select to authenticated
  using (public.is_interno_leitura() or exists (select 1 from public.trilhas t where t.id = trilha_id and t.publicada
          and public.parceiro_atual() is not null and public.parceiro_assinado(public.parceiro_atual())));
create policy modulo_admin on public.trilha_modulos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy pergunta_ler on public.trilha_perguntas for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or exists (select 1 from public.trilhas t where t.id = trilha_id and t.publicada
          and public.parceiro_atual() is not null and public.parceiro_assinado(public.parceiro_atual())));
create policy pergunta_admin on public.trilha_perguntas for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy gabarito_admin on public.trilha_gabarito for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Progresso, tentativas e certificados: internos (parcerias e consultor) leem; a pessoa lê os seus; o responsável do parceiro, os da empresa
create policy prog_ler on public.trilha_progresso for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or perfil_id = auth.uid()
         or (public.is_responsavel_parceiro() and parceiro_id = public.parceiro_atual()));
create policy tent_ler on public.trilha_tentativas for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or perfil_id = auth.uid()
         or (public.is_responsavel_parceiro() and parceiro_id = public.parceiro_atual()));
create policy cert_ler on public.certificados for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or perfil_id = auth.uid()
         or (public.is_responsavel_parceiro() and parceiro_id = public.parceiro_atual()));
create policy cert_gerir on public.certificados for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke execute on function public.ativar_parceiro(uuid, uuid, date) from public, anon, authenticated;
revoke execute on function public.verificar_ativacao(uuid) from public, anon, authenticated;
