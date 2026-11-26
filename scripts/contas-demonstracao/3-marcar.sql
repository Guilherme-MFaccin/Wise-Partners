-- Contas de demonstração, passo 3: marca os perfis criados pelo Auth e completa os registros da comunidade.
-- Rodar como sistema. Pode rodar de novo.
update public.perfis set demonstracao = true
 where lower(email) like 'demo.%@example.com' and not demonstracao;

insert into public.membros_comunidade (parceiro_id, perfil_id, nome, cargo, email, whatsapp, empresa, cnpj, cidade, uf, segmento,
  vinculo_cliente, empresas_grupo, interesses, termo_uso_versao, privacidade_versao, vinculo_decidido_em, vinculo_motivo)
select x.id, pf.id, pf.nome, 'Conta de demonstração', pf.email, '44000000000', x.nome_fantasia, '00000000000000', 'Maringá', 'PR', 'Demonstração',
       case when x.cliente_grupo then 'confirmado' else 'nao_declarado' end,
       case when x.cliente_grupo then array[x.empresa_grupo_cliente_id] else '{}'::uuid[] end,
       case when x.cliente_grupo then '{comprar,oferecer,indicar}'::text[] else '{comprar,conhecer_consultoria}'::text[] end,
       coalesce((select termo_uso_versao from public.config_comunidade limit 1), '2026-11-23'), '2026-11-07',
       case when x.cliente_grupo then now() end, case when x.cliente_grupo then 'Conta de demonstração' end
  from public.parceiros x join public.perfis pf on pf.parceiro_id = x.id
 where x.demonstracao and x.tipo_parceria = 'cliente'
on conflict (parceiro_id) do nothing;

select pf.email, public.tipo_acesso(pf) tipo, pf.demonstracao from public.perfis pf where pf.demonstracao order by 2;
