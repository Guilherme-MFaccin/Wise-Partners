-- Contas de demonstração, passo 1 (26/11/2026): empresas fictícias e convites, uma por tipo de acesso.
-- Rodar como sistema, depois da migração 20261126000039. Pode rodar de novo: não duplica nada.
-- Passo 2: criar os usuários no Auth com os e-mails abaixo (o gatilho do Auth cria o perfil a partir do convite).
-- Passo 3: 3-marcar.sql.
-- Exceção pedida pelo patrocinador à regra "dados de demonstração só no seed": as empresas e as contas levam a marca
-- demonstracao e ficam fora dos números, das listas e das rotinas do time real.
insert into public.parceiros (id, nome_fantasia, razao_social, tipo_parceria, etapa, data_assinatura, carteira_icp, cidade, uf,
                              origem_tipo, origem_detalhe, cliente_grupo, empresa_grupo_cliente_id, origem, demonstracao)
values
  ('de300000-0000-4000-a000-000000000001', 'Demonstração Parceiro Elite', 'Empresa fictícia para o Ver como', 'comercial', 'parceria_ativa',
   current_date - 120, 60, 'Maringá', 'PR', 'indicacao_interna', 'Conta de demonstração', false, null, null, true),
  ('de300000-0000-4000-a000-000000000002', 'Demonstração Parceiro Premium', 'Empresa fictícia para o Ver como', 'comercial', 'parceria_ativa',
   current_date - 90, 30, 'Maringá', 'PR', 'indicacao_interna', 'Conta de demonstração', false, null, null, true),
  ('de300000-0000-4000-a000-000000000003', 'Demonstração Parceiro Select', 'Empresa fictícia para o Ver como', 'comercial', 'parceria_ativa',
   current_date - 60, 8, 'Maringá', 'PR', 'indicacao_interna', 'Conta de demonstração', false, null, null, true),
  ('de300000-0000-4000-a000-000000000004', 'Demonstração Parceiro em entrada', 'Empresa fictícia para o Ver como', 'comercial', 'qualificacao',
   null, 20, 'Maringá', 'PR', 'indicacao_interna', 'Conta de demonstração', false, null, null, true),
  ('de300000-0000-4000-a000-000000000005', 'Demonstração Cliente do Grupo', 'Empresa fictícia para o Ver como', 'cliente', 'qualificacao',
   null, null, 'Maringá', 'PR', null, 'Conta de demonstração', true, (select id from public.empresas_grupo where codigo = 'wise'), 'cliente_grupo', true),
  ('de300000-0000-4000-a000-000000000006', 'Demonstração Empresa da Comunidade', 'Empresa fictícia para o Ver como', 'cliente', 'qualificacao',
   null, null, 'Maringá', 'PR', null, 'Conta de demonstração', false, null, 'comunidade', true)
on conflict (id) do nothing;

insert into public.convites (email, nome, papel, empresa_grupo_id, parceiro_id, is_responsavel_parceiro)
select v.email, v.nome, v.papel, case when v.papel <> 'parceiro' then (select id from public.empresas_grupo where codigo = 'wise') end,
       v.parceiro::uuid, v.papel = 'parceiro'
from (values
  ('demo.elite@example.com', 'Demonstração Elite', 'parceiro', 'de300000-0000-4000-a000-000000000001'),
  ('demo.premium@example.com', 'Demonstração Premium', 'parceiro', 'de300000-0000-4000-a000-000000000002'),
  ('demo.select@example.com', 'Demonstração Select', 'parceiro', 'de300000-0000-4000-a000-000000000003'),
  ('demo.entrada@example.com', 'Demonstração Entrada', 'parceiro', 'de300000-0000-4000-a000-000000000004'),
  ('demo.cliente@example.com', 'Demonstração Cliente do Grupo', 'parceiro', 'de300000-0000-4000-a000-000000000005'),
  ('demo.comunidade@example.com', 'Demonstração Comunidade', 'parceiro', 'de300000-0000-4000-a000-000000000006'),
  ('demo.gerente@example.com', 'Demonstração Gerente de Parcerias', 'parcerias', null),
  ('demo.consultor@example.com', 'Demonstração Consultor', 'consultor', null),
  ('demo.comercial@example.com', 'Demonstração Comercial', 'comercial', null),
  ('demo.financeiro@example.com', 'Demonstração Financeiro', 'financeiro', null)
) v(email, nome, papel, parceiro)
where not exists (select 1 from public.perfis p where lower(p.email) = v.email)
on conflict (email) do nothing;
