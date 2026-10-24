-- Portal Wise Partners 2.0: recrutamento, scorecard de entrada, nível de entrada e nutrição (Histórias 3 e 9)

-- ---------------------------------------------------------------------------
-- Colunas novas do parceiro (dados que o próprio parceiro pode ver; nada sensível aqui)
-- ---------------------------------------------------------------------------
alter table public.parceiros
  add column modelos_atuacao text[] not null default '{}',
  add column valor_desejado text,          -- o que o parceiro quer ganhar
  add column oferta_valor text,            -- o que a Wise oferece
  add column entrega_valor text,           -- como o valor é entregue
  add column valor_criado text,            -- valor criado para cada lado e para o cliente
  add column origem_tipo text check (origem_tipo in ('prospeccao_ativa', 'procura_espontanea', 'indicacao_parceiro', 'indicacao_interna', 'evento', 'outra')),
  add column origem_detalhe text,
  add column origem_parceiro_id uuid references public.parceiros(id) on delete set null,
  add column origem_perfil_id uuid references public.perfis(id) on delete set null,
  add column horas_semana_combinadas numeric(5,1),
  add column nivel_entrada text check (nivel_entrada in ('A', 'B', 'C')),
  add column elegibilidade_motivo text,    -- decisão do administrador de seguir com parceiro "não elegível"
  add column em_observacao_ate date,
  add column pacote_pendente text references public.pacotes(codigo),
  add column pacote_pendente_em date,
  add column pacote_pendente_motivo text,
  add column etapa_antes_nutricao text,
  add column nutricao_ate date,
  add column nutricao_cadencia_dias int,
  add column anonimo_ranking boolean not null default false,
  add column aceita_cruzamento_contrato boolean not null default false;  -- contrato v2 ou aditivo com a cláusula 10.4

-- A origem em texto livre da v1 vira detalhe
update public.parceiros set origem_detalhe = origem where origem is not null and origem_detalhe is null;

-- ---------------------------------------------------------------------------
-- Funil: qualificação, parceria ativa e nutrição (FR-148, FR-149)
-- ---------------------------------------------------------------------------
alter table public.etapas_funil add column pausa boolean not null default false;
update public.etapas_funil set ordem = 7 where codigo = 'proposta_decisor';
update public.etapas_funil set ordem = 8 where codigo = 'fechamento';
update public.etapas_funil set ordem = 9 where codigo = 'onboarding';
insert into public.etapas_funil (codigo, nome, ordem, perda, pausa) values
  ('qualificacao', 'Qualificação', 6, false, false),
  ('parceria_ativa', 'Parceria ativa', 10, false, false),
  ('nutricao', 'Nutrição', 85, false, true);

-- ---------------------------------------------------------------------------
-- Scorecard de entrada (Apêndice A)
-- ---------------------------------------------------------------------------
create table public.criterios_scorecard (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  nome text not null,
  essencial boolean not null default false,
  peso numeric(4,2) not null default 1,
  regua jsonb not null,                  -- {"0": texto, "0.5": texto, "1": texto}
  elimina_com_zero boolean not null default false,  -- nota zero sugere "não elegível"
  conta_na_qualidade boolean not null default true, -- a base no ICP fica fora da nota de qualidade
  ordem int not null default 0,
  ativo boolean not null default true,
  versao int not null default 1
);

create table public.scorecards (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  notas jsonb not null,                  -- {chave: 0 | 0.5 | 1}
  completo boolean not null default false,
  nota_potencial numeric(5,2),
  nota_qualidade numeric(5,2),
  nivel_entrada_sugerido text,
  nao_elegivel_sugerido boolean not null default false,
  faltantes text[] not null default '{}',
  versao_criterios int,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.scorecards (parceiro_id, created_at desc);

-- Faixa pela base no ICP, ajustada pela qualidade: abaixo de 50%, um nível abaixo (nunca abaixo de Select)
create or replace function public.nivel_entrada_calc(p_carteira int, p_qualidade numeric) returns text
language sql stable security definer set search_path = public as $$
  select case
    when public.nivel_sugerido('comercial', p_carteira) is null then null
    when p_qualidade is not null and p_qualidade < 50 then
      case public.nivel_sugerido('comercial', p_carteira) when 'A' then 'B' else 'C' end
    else public.nivel_sugerido('comercial', p_carteira) end
$$;

create or replace function public.scorecard_vigente(p_parceiro uuid) returns public.scorecards
language sql stable security definer set search_path = public as $$
  select * from public.scorecards where parceiro_id = p_parceiro order by created_at desc limit 1
$$;

create or replace function public.trg_scorecard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_soma numeric := 0; v_peso numeric := 0;
  v_soma_q numeric := 0; v_peso_q numeric := 0;
  v_nota numeric;
  v_faltam text[] := '{}';
  v_carteira int;
  v_versao int := 0;
begin
  for c in select * from public.criterios_scorecard where ativo order by ordem loop
    v_versao := greatest(v_versao, c.versao);
    v_nota := nullif(new.notas ->> c.chave, '')::numeric;
    if v_nota is null then
      v_faltam := v_faltam || c.nome;
      continue;
    end if;
    if v_nota not in (0, 0.5, 1) then
      raise exception 'Nota inválida em %: use 0, 0,5 ou 1.', c.nome using errcode = 'P0001';
    end if;
    v_soma := v_soma + v_nota * c.peso; v_peso := v_peso + c.peso;
    if c.conta_na_qualidade then
      v_soma_q := v_soma_q + v_nota * c.peso; v_peso_q := v_peso_q + c.peso;
    end if;
    if c.elimina_com_zero and v_nota = 0 then
      new.nao_elegivel_sugerido := true;
    end if;
  end loop;
  new.faltantes := v_faltam;
  new.completo := cardinality(v_faltam) = 0;
  new.versao_criterios := v_versao;
  if new.completo then
    new.nota_potencial := round(v_soma / nullif(v_peso, 0) * 100, 2);
    new.nota_qualidade := round(v_soma_q / nullif(v_peso_q, 0) * 100, 2);
  end if;
  select carteira_icp into v_carteira from public.parceiros where id = new.parceiro_id;
  new.nivel_entrada_sugerido := public.nivel_entrada_calc(v_carteira, new.nota_qualidade);
  return new;
end $$;

create trigger t_scorecard before insert on public.scorecards for each row execute function public.trg_scorecard();

-- Depois de salvar o scorecard, recalcula o nível de entrada do parceiro
create or replace function public.trg_scorecard_depois() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.parceiros set updated_at = now() where id = new.parceiro_id;
  return null;
end $$;

create trigger t_scorecard_depois after insert on public.scorecards for each row execute function public.trg_scorecard_depois();
create trigger t_hist after insert on public.scorecards for each row execute function public.trg_historico('nivel_entrada_sugerido');

-- ---------------------------------------------------------------------------
-- Regras do parceiro (substitui o gatilho da v1, mantendo as mensagens das regras que não mudaram)
-- ---------------------------------------------------------------------------
create or replace function public.trg_parceiros_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_permitidos text[];
  v_sc public.scorecards;
  v_nivel_tocado boolean := tg_op = 'INSERT' or new.nivel is distinct from old.nivel;
begin
  -- Nível de entrada: faixa da base no ICP ajustada pela qualidade do scorecard (FR-114)
  if new.tipo_parceria = 'comercial' then
    v_sc := public.scorecard_vigente(new.id);
    new.nivel_entrada := public.nivel_entrada_calc(new.carteira_icp, case when v_sc.completo then v_sc.nota_qualidade end);
    new.nivel_sugerido := new.nivel_entrada;
    if new.nivel is null then
      new.nivel := new.nivel_sugerido;
    elsif not v_nivel_tocado and new.data_assinatura is null and coalesce(btrim(new.nivel_ajuste_motivo), '') = ''
          and new.nivel_sugerido is not null then
      -- Antes da assinatura, sem ajuste manual, o nível acompanha o nível de entrada
      new.nivel := new.nivel_sugerido;
    end if;
    if new.nivel is not null and new.nivel_sugerido is not null and new.nivel <> new.nivel_sugerido
       and v_nivel_tocado and coalesce(btrim(new.nivel_ajuste_motivo), '') = '' then
      raise exception 'Ajuste manual de nível exige motivo (nível sugerido: %).', new.nivel_sugerido
        using errcode = 'P0001';
    end if;
    if new.nivel = new.nivel_sugerido and v_nivel_tocado then
      new.nivel_ajuste_motivo := null;
    end if;
  else
    new.nivel_sugerido := null;
    new.nivel_entrada := null;
    new.pacote := null;
  end if;

  -- Pacote restrito ao nível; exceção temporária depois de rebaixamento confirmado (FR-123)
  if new.pacote is not null and new.pacote_pendente is null then
    select niveis_permitidos into v_permitidos from public.pacotes where codigo = new.pacote;
    if new.nivel is null or not (new.nivel = any (v_permitidos)) then
      raise exception 'O pacote % não está disponível para o nível do parceiro.', new.pacote using errcode = 'P0001';
    end if;
  end if;

  -- Funil
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    new.etapa_desde := now();
    if new.etapa = 'fechamento' and not public.tem_aprovacao_assinatura(new.id) then
      raise exception 'A passagem para fechamento exige a aprovação do Diretor registrada no portal.' using errcode = 'P0001';
    end if;
    if new.etapa = 'onboarding' then
      if not public.tem_aprovacao_assinatura(new.id) then
        raise exception 'A passagem para onboarding exige a aprovação do Diretor.' using errcode = 'P0001';
      end if;
      if new.data_assinatura is null then
        raise exception 'Anexe o contrato assinado e informe a data de assinatura antes do onboarding.' using errcode = 'P0001';
      end if;
    end if;
    if new.etapa = 'parceria_ativa' and new.data_assinatura is null then
      raise exception 'Parceria ativa exige contrato assinado.' using errcode = 'P0001';
    end if;
    -- Scorecard completo antes da proposta (FR-116), em mudanças feitas por pessoas no portal
    if tg_op = 'UPDATE' and new.etapa = 'proposta_decisor' and new.tipo_parceria = 'comercial' and auth.uid() is not null then
      v_sc := public.scorecard_vigente(new.id);
      if v_sc.id is null or not v_sc.completo then
        raise exception 'Preencha o scorecard completo antes da proposta com o decisor. Faltam: %.',
          coalesce(array_to_string(v_sc.faltantes, ', '), 'todos os critérios') using errcode = 'P0001';
      end if;
      if v_sc.nao_elegivel_sugerido and (not public.is_admin() or coalesce(btrim(new.elegibilidade_motivo), '') = '') then
        raise exception 'O scorecard sugere "não elegível". Só um administrador segue com a negociação, registrando o motivo.'
          using errcode = 'P0001';
      end if;
    end if;
    -- Nutrição: pausa com data de retomada, sem morno nem dormente (FR-149)
    if new.etapa = 'nutricao' then
      if new.nutricao_ate is null or new.nutricao_ate < public.hoje() then
        raise exception 'Informe a data de retomada da nutrição.' using errcode = 'P0001';
      end if;
      if tg_op = 'UPDATE' and old.etapa <> 'nutricao' then
        new.etapa_antes_nutricao := old.etapa;
      end if;
      new.nutricao_cadencia_dias := coalesce(new.nutricao_cadencia_dias, public.config_int('nutricao_cadencia_dias', 30));
      new.pausado_ate := new.nutricao_ate;
    elsif tg_op = 'UPDATE' and old.etapa = 'nutricao' then
      if new.pausado_ate is not distinct from old.nutricao_ate then
        new.pausado_ate := null;
      end if;
      new.nutricao_ate := null;
    end if;
    if new.etapa = 'parceria_encerrada' and new.data_encerramento is null then
      new.data_encerramento := public.hoje();
    end if;
  elsif new.etapa = 'nutricao' and new.nutricao_ate is distinct from old.nutricao_ate then
    new.pausado_ate := new.nutricao_ate;
  end if;

  -- Status de atividade calculado (nunca muda o nível)
  if new.pausado_ate is not null and new.pausado_ate < public.hoje() then
    new.pausado_ate := null;
  end if;
  new.status_atividade := public.calcular_status(
    new.tipo_parceria, new.nivel, new.ultimo_contato, new.pausado_ate,
    coalesce(new.created_at, now())::date);
  if new.status_atividade = 'ativo' then
    new.motivo_inatividade := null;
  end if;
  return new;
end $$;

-- Etapas depois da mudança: v1 mais nutrição, ações da Wise e aviso de subida pela base
create or replace function public.trg_parceiros_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_diretor record;
  v_data date;
begin
  if tg_op = 'INSERT' then
    insert into public.parceiros_interno (parceiro_id) values (new.id) on conflict do nothing;
    insert into public.parceiros_instrumento (parceiro_id) values (new.id) on conflict do nothing;
  end if;

  if tg_op = 'INSERT' or new.carteira_icp is distinct from old.carteira_icp then
    perform public.atualizar_estrategico_sugerido(new.id);
  end if;

  if tg_op = 'UPDATE' and new.etapa is distinct from old.etapa then
    if new.etapa = 'onboarding' then
      perform public.iniciar_onboarding(new.id);
    end if;
    if new.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(new.id) then
      for v_diretor in select id from public.perfis where is_diretor and ativo loop
        perform public.notificar(v_diretor.id, 'aprovacao_pendente', 'Aprovação de assinatura pendente',
          format('%s está em proposta com o decisor e aguarda a sua aprovação.', new.nome_fantasia),
          '/app/parceiros/' || new.id, '{}'::jsonb, true);
      end loop;
    end if;
    if new.etapa = 'parceria_encerrada' then
      update public.contrapartidas set ativa = false where parceiro_id = new.id;
      update public.acoes_wise set ativa = false where parceiro_id = new.id and estado in ('planejada', 'atrasada');
      update public.links_indicacao set ativo = false, revogado_em = now() where parceiro_id = new.id and ativo;
    end if;
    if new.etapa = 'nutricao' then
      v_data := least(new.nutricao_ate, public.hoje() + new.nutricao_cadencia_dias);
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id)
      values (new.id, 'Contato de nutrição', v_data, new.responsavel_id);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.data_assinatura is not null
     and (old.data_assinatura is null or new.pacote is distinct from old.pacote) then
    perform public.gerar_contrapartidas(new.id);
    perform public.gerar_acoes_wise(new.id);
  end if;

  -- Base no ICP atualizada depois da assinatura levando a nível de entrada acima do atual: sugere subida
  if tg_op = 'UPDATE' and new.data_assinatura is not null and new.carteira_icp is distinct from old.carteira_icp
     and new.nivel_entrada is not null and new.nivel is not null and new.nivel_entrada < new.nivel then
    perform public.notificar_responsavel(new.id, 'nivel_subida_sugerida', 'Subida de nível sugerida',
      format('A base no ICP de %s indica o nível de entrada %s. Confirme a subida por escrito, se for o caso.',
             new.nome_fantasia, case new.nivel_entrada when 'A' then 'Elite' when 'B' then 'Premium' else 'Select' end),
      '/app/parceiros/' || new.id || '?aba=nivel');
  end if;
  return null;
end $$;

create trigger t_hist2 after update on public.parceiros
for each row execute function public.trg_historico('nivel_entrada', 'em_observacao_ate', 'pacote_pendente', 'pacote_pendente_em',
  'nutricao_ate', 'origem_tipo', 'modelos_atuacao', 'elegibilidade_motivo', 'aceita_cruzamento_contrato', 'anonimo_ranking');

select public._proteger_tabela(t) from unnest(array['criterios_scorecard', 'scorecards']) t;

-- Scorecard: admin e parcerias leem e escrevem; consultor lê; demais não
create policy crit_ler on public.criterios_scorecard for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy crit_admin on public.criterios_scorecard for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sc_ler on public.scorecards for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy sc_criar on public.scorecards for insert to authenticated with check (public.is_parcerias());
