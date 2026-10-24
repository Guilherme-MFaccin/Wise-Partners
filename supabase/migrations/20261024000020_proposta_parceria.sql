-- Portal Wise Partners 2.0: o parceiro propõe alteração do modelo de atuação e da proposta de valor
-- pelo mesmo fluxo de validação da ficha (FR-147, FR-073 ampliado). As chaves "parceria.<coluna>"
-- convivem com os ids de campos_categoria em propostas_ficha.valores.

create or replace function public.coluna_parceria_proponivel(p_chave text) returns text
language sql immutable as $$
  select case when p_chave in ('parceria.modelos_atuacao', 'parceria.valor_desejado', 'parceria.oferta_valor',
                               'parceria.entrega_valor', 'parceria.valor_criado')
              then substr(p_chave, 10) end
$$;

create or replace function public.trg_proposta_ficha() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
begin
  if tg_op = 'INSERT' then
    for k in select jsonb_object_keys(new.valores) loop
      if public.coluna_parceria_proponivel(k) is null
         and not exists (select 1 from public.campos_categoria c where c.id::text = k and c.ativo and not c.interno and c.parceiro_edita) then
        raise exception 'Campo % não pode ser alterado pelo parceiro.', k using errcode = '42501';
      end if;
    end loop;
    -- Uma proposta nova substitui a pendente do mesmo tipo (ficha ou parceria)
    update public.propostas_ficha pf set estado = 'substituida'
     where pf.parceiro_id = new.parceiro_id and pf.estado = 'pendente'
       and exists (select 1 from jsonb_object_keys(pf.valores) ch where ch like 'parceria.%')
           = exists (select 1 from jsonb_object_keys(new.valores) ch where ch like 'parceria.%');
    new.proposta_por := coalesce(new.proposta_por, auth.uid());
  end if;
  return new;
end $$;

create or replace function public.revisar_proposta_ficha(p_id uuid, p_aprovar boolean, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  pr public.propostas_ficha;
  k text;
  v_col text;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into pr from public.propostas_ficha where id = p_id and estado = 'pendente';
  if pr.id is null then raise exception 'Proposta não encontrada ou já revisada.' using errcode = 'P0001'; end if;
  if p_aprovar then
    for k in select jsonb_object_keys(pr.valores) loop
      v_col := public.coluna_parceria_proponivel(k);
      if v_col = 'modelos_atuacao' then
        update public.parceiros
           set modelos_atuacao = coalesce((select array_agg(x) from jsonb_array_elements_text(
                                   case when jsonb_typeof(pr.valores->k) = 'array' then pr.valores->k else '[]'::jsonb end) x), '{}')
         where id = pr.parceiro_id;
      elsif v_col is not null then
        execute format('update public.parceiros set %I = $1 where id = $2', v_col) using pr.valores->>k, pr.parceiro_id;
      else
        insert into public.parceiro_campos (parceiro_id, campo_id, valor, versao, updated_by, updated_at)
        values (pr.parceiro_id, k::uuid, pr.valores->k, 1, auth.uid(), now())
        on conflict (parceiro_id, campo_id) do update
          set valor = excluded.valor, versao = public.parceiro_campos.versao + 1, updated_by = auth.uid(), updated_at = now();
      end if;
    end loop;
    update public.propostas_ficha set estado = 'aprovada', revisada_por = auth.uid(), revisada_em = now() where id = p_id;
    perform public.notificar_parceiro(pr.parceiro_id, 'proposta_ficha_aprovada', 'Ficha atualizada',
      'A Wise validou a sua proposta e a nova versão já está valendo.', '/parceiro/ficha');
  else
    if coalesce(btrim(p_motivo), '') = '' then raise exception 'Informe o motivo da recusa.' using errcode = 'P0001'; end if;
    update public.propostas_ficha set estado = 'recusada', motivo_recusa = p_motivo, revisada_por = auth.uid(), revisada_em = now() where id = p_id;
    perform public.notificar_parceiro(pr.parceiro_id, 'proposta_ficha_recusada', 'Proposta não aprovada',
      p_motivo, '/parceiro/ficha');
  end if;
end $$;
