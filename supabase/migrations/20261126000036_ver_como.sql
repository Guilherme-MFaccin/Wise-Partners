-- Ver como (26/11/2026): o administrador e o gerente da comunidade abrem o portal como qualquer conta, numa aba separada,
-- para conferir o que cada tipo de acesso vê e se está funcionando. A lista de contas sai daqui; o acesso de visualização
-- sai pela Edge Function ver-como, que registra cada uso no histórico. Contas de administrador não entram na lista.

create or replace function public.tipo_acesso(p public.perfis) returns text
language sql stable security definer set search_path = public as $$
  select case
    when p.papel <> 'parceiro' then p.papel
    when x.tipo_parceria = 'cliente' and x.cliente_grupo then 'cliente_grupo'
    when x.tipo_parceria = 'cliente' then 'membro'
    when x.data_assinatura is null then 'parceiro_entrada'
    when x.nivel = 'A' then 'parceiro_elite'
    when x.nivel = 'B' then 'parceiro_premium'
    else 'parceiro_select' end
  from (select 1) _ left join public.parceiros x on x.id = p.parceiro_id
$$;
revoke execute on function public.tipo_acesso(public.perfis) from public, anon;

create or replace function public.contas_para_ver_como()
returns table (perfil_id uuid, nome text, email text, papel text, responsavel boolean, ativo boolean, parceiro_id uuid, empresa text,
               tipo text, ultimo_acesso timestamptz, ultima_visualizacao timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.email, p.papel, p.is_responsavel_parceiro, p.ativo, p.parceiro_id, x.nome_fantasia,
         public.tipo_acesso(p), u.last_sign_in_at,
         (select max(h.created_at) from public.historico h where h.tabela = 'perfis' and h.registro_id = p.id and h.campo = 'ver como')
    from public.perfis p
    left join public.parceiros x on x.id = p.parceiro_id
    left join auth.users u on u.id = p.id
   where public.is_parcerias() and p.papel <> 'admin'
   order by public.tipo_acesso(p), x.nome_fantasia nulls first, p.nome
$$;
revoke execute on function public.contas_para_ver_como() from public, anon;
grant execute on function public.contas_para_ver_como() to authenticated;
