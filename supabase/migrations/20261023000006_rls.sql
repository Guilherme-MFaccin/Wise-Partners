-- Portal Wise Partners: Row Level Security (princípio II, matriz do briefing técnico, seção 3)
-- Regra geral: nada é visível sem política explícita. O cliente (anônimo) não lê nenhuma tabela.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

revoke all on public.v_fila_base_ativa from anon;

-- ---------------------------------------------------------------------------
-- Configuração: leitura para usuários internos ativos (e partes necessárias ao parceiro);
-- escrita só para administradores.
-- ---------------------------------------------------------------------------
create policy cfg_ler on public.empresas_grupo for select to authenticated using (public.papel_atual() is not null);
create policy cfg_admin on public.empresas_grupo for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.categorias for select to authenticated using (public.papel_atual() is not null);
create policy cfg_admin on public.categorias for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.campos_categoria for select to authenticated
  using (public.is_interno() or (public.papel_atual() = 'parceiro' and not interno));
create policy cfg_admin on public.campos_categoria for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.niveis for select to authenticated using (public.papel_atual() is not null);
create policy cfg_admin on public.niveis for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.pacotes for select to authenticated using (public.papel_atual() is not null);
create policy cfg_admin on public.pacotes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.catalogo_contrapartidas for select to authenticated using (public.is_interno());
create policy cfg_admin on public.catalogo_contrapartidas for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.tipos_atividade for select to authenticated using (public.is_interno());
create policy cfg_admin on public.tipos_atividade for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.etapas_funil for select to authenticated using (public.papel_atual() is not null);
create policy cfg_admin on public.etapas_funil for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.criterios_icp for select to authenticated using (public.is_interno());
create policy cfg_admin on public.criterios_icp for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.modelos_contrato for select to authenticated using (public.is_interno_leitura());
create policy cfg_admin on public.modelos_contrato for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.textos_email for select to authenticated using (public.is_parcerias());
create policy cfg_admin on public.textos_email for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cfg_ler on public.feriados for select to authenticated using (public.is_interno());
create policy cfg_admin on public.feriados for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Parâmetros: o parceiro lê só os públicos (endereço do Wise Hub, calendário, páginas institucionais).
create policy cfg_ler on public.configuracoes for select to authenticated
  using (public.is_parcerias()
         or (public.is_interno() and chave not in ('email_financeiro'))
         or (public.papel_atual() = 'parceiro' and chave in ('wise_hub_url', 'calendario_mentoria', 'calendario_eventos', 'materiais_parceiro')));
create policy cfg_admin on public.configuracoes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Usuários
-- ---------------------------------------------------------------------------
create policy perfis_proprio on public.perfis for select to authenticated using (id = auth.uid());
create policy perfis_internos on public.perfis for select to authenticated
  using (public.is_interno() and (papel <> 'parceiro' or public.is_interno_leitura()));
create policy perfis_parceiro on public.perfis for select to authenticated
  using (public.parceiro_atual() is not null and (
    parceiro_id = public.parceiro_atual()
    or id = (select p.responsavel_id from public.parceiros p where p.id = public.parceiro_atual())));
create policy perfis_editar_proprio on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy perfis_admin on public.perfis for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy convites_ler on public.convites for select to authenticated
  using (public.is_parcerias() or (public.is_responsavel_parceiro() and parceiro_id = public.parceiro_atual()));

-- ---------------------------------------------------------------------------
-- Parceiros e ficha
-- ---------------------------------------------------------------------------
create policy parceiros_internos on public.parceiros for select to authenticated using (public.is_interno());
create policy parceiros_proprio on public.parceiros for select to authenticated using (id = public.parceiro_atual());
create policy parceiros_gerir on public.parceiros for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Estratégico e anotações: parcerias e admin gerem; consultor e comercial leem; financeiro e parceiro não.
create policy interno_ler on public.parceiros_interno for select to authenticated using (public.is_interno_leitura());
create policy interno_gerir on public.parceiros_interno for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Instrumento (comissão do parceiro ao grupo): só quem vê comissão.
create policy instrumento_gerir on public.parceiros_instrumento for all to authenticated using (public.pode_ver_comissao()) with check (public.pode_ver_comissao());

create policy pcat_ler on public.parceiro_categorias for select to authenticated
  using (public.is_interno() or parceiro_id = public.parceiro_atual());
create policy pcat_gerir on public.parceiro_categorias for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy pcampos_ler on public.parceiro_campos for select to authenticated
  using (public.is_interno_leitura()
         or (parceiro_id = public.parceiro_atual()
             and exists (select 1 from public.campos_categoria c where c.id = campo_id and not c.interno)));
create policy pcampos_gerir on public.parceiro_campos for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy prop_ler on public.propostas_ficha for select to authenticated
  using (public.is_interno_leitura() or parceiro_id = public.parceiro_atual());
create policy prop_criar on public.propostas_ficha for insert to authenticated
  with check (parceiro_id = public.parceiro_atual() and estado = 'pendente');
create policy prop_gerir on public.propostas_ficha for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy contatos_ler on public.contatos for select to authenticated
  using (public.is_interno_leitura()
         or exists (select 1 from public.parceiro_contatos pc where pc.contato_id = contatos.id and pc.parceiro_id = public.parceiro_atual()));
create policy contatos_gerir on public.contatos for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy pcont_ler on public.parceiro_contatos for select to authenticated
  using (public.is_interno_leitura() or parceiro_id = public.parceiro_atual());
create policy pcont_gerir on public.parceiro_contatos for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Pontos de contato: consultor lê e cria; comercial lê; parceiro e financeiro não.
create policy pc_ler on public.pontos_contato for select to authenticated using (public.is_interno_leitura());
create policy pc_criar on public.pontos_contato for insert to authenticated
  with check ((public.is_parcerias() or public.is_consultor()) and autor_id = auth.uid());
create policy pc_gerir on public.pontos_contato for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy pc_excluir on public.pontos_contato for delete to authenticated using (public.is_parcerias());

create policy atv_ler on public.atividades for select to authenticated using (public.is_interno_leitura());
create policy atv_criar on public.atividades for insert to authenticated
  with check ((public.is_parcerias() or public.is_consultor()) and pessoa_id = auth.uid());
create policy atv_gerir on public.atividades for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy pp_ler on public.proximos_passos for select to authenticated using (public.is_interno_leitura());
create policy pp_criar on public.proximos_passos for insert to authenticated with check (public.is_parcerias() or public.is_consultor());
create policy pp_gerir on public.proximos_passos for update to authenticated
  using (public.is_parcerias() or responsavel_id = auth.uid()) with check (public.is_parcerias() or responsavel_id = auth.uid());

create policy doc_ler on public.documentos for select to authenticated
  using (public.is_interno_leitura() or (parceiro_id = public.parceiro_atual() and visivel_parceiro));
create policy doc_gerir on public.documentos for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- Aprovação de assinatura: só o Diretor registra.
create policy apr_ler on public.aprovacoes for select to authenticated using (public.is_interno_leitura());
create policy apr_diretor on public.aprovacoes for insert to authenticated
  with check (public.is_diretor() and aprovado_por = auth.uid());

-- Contratos e Quadro: comercial, financeiro e parceiro não.
create policy quadro_ler on public.quadros_identificacao for select to authenticated
  using (public.is_parcerias() or public.is_consultor());
create policy quadro_gerir on public.quadros_identificacao for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy contr_ler on public.contratos_gerados for select to authenticated
  using (public.is_parcerias() or public.is_consultor());
create policy contr_gerir on public.contratos_gerados for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy taref_ler on public.tarefas_onboarding for select to authenticated
  using (public.is_interno_leitura() or parceiro_id = public.parceiro_atual());
create policy taref_gerir on public.tarefas_onboarding for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy cp_ler on public.contrapartidas for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy cp_gerir on public.contrapartidas for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy compr_ler on public.comprovacoes for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy compr_enviar on public.comprovacoes for insert to authenticated
  with check (estado = 'enviada' and enviada_por = auth.uid()
              and (public.is_parcerias() or parceiro_id = public.parceiro_atual()));
create policy compr_validar on public.comprovacoes for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy ba_ler on public.ciclos_base_ativa for select to authenticated
  using (public.is_interno_leitura() or parceiro_id = public.parceiro_atual());
create policy ba_gerir on public.ciclos_base_ativa for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy bae_ler on public.base_ativa_encontros for select to authenticated
  using (public.is_interno_leitura()
         or exists (select 1 from public.ciclos_base_ativa c where c.id = ciclo_id and c.parceiro_id = public.parceiro_atual()));
create policy bae_gerir on public.base_ativa_encontros for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

-- ---------------------------------------------------------------------------
-- Clientes, indicações e comissões
-- ---------------------------------------------------------------------------
create policy cli_ler on public.clientes for select to authenticated
  using (public.is_interno()
         or exists (select 1 from public.indicacoes i where i.cliente_id = clientes.id and i.parceiro_id = public.parceiro_atual()));
create policy cli_gerir on public.clientes for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy cli_excluir on public.clientes for delete to authenticated using (public.is_admin());

-- Inserção de indicações só pela função registrar_indicacao (regra do primeiro registro).
create policy ind_ler on public.indicacoes for select to authenticated
  using (public.is_interno() or parceiro_id = public.parceiro_atual());
create policy ind_gerir on public.indicacoes for update to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy ind_excluir on public.indicacoes for delete to authenticated using (public.is_admin());

-- Comissões: parcerias e admin tudo; financeiro lê de "a pagar" em diante; parceiro só a própria
-- (beneficiário parceiro), nunca a do responsável. Consultor e comercial nada.
create policy com_parcerias on public.comissoes for all to authenticated using (public.pode_ver_comissao()) with check (public.pode_ver_comissao());
create policy com_financeiro on public.comissoes for select to authenticated
  using (public.is_financeiro() and beneficiario <> 'grupo' and estado in ('a_pagar', 'nf_recebida', 'paga'));
create policy com_parceiro on public.comissoes for select to authenticated
  using (beneficiario = 'parceiro' and parceiro_id = public.parceiro_atual());

-- ---------------------------------------------------------------------------
-- RFP: consultor cria e gere os próprios, lê todos; comercial lê; parceiro só pela função meus_rfps.
-- ---------------------------------------------------------------------------
create policy rfp_ler on public.pedidos_rfp for select to authenticated using (public.is_interno_leitura());
create policy rfp_criar on public.pedidos_rfp for insert to authenticated
  with check ((public.is_parcerias() or public.is_consultor()) and consultor_id = auth.uid());
create policy rfp_gerir on public.pedidos_rfp for update to authenticated
  using (public.pode_gerir_pedido(id)) with check (public.pode_gerir_pedido(id));
create policy rfp_excluir on public.pedidos_rfp for delete to authenticated
  using (public.pode_gerir_pedido(id) and estado = 'rascunho');

create policy rfpo_ler on public.pedido_rfp_opcoes for select to authenticated using (public.is_interno_leitura());
create policy rfpo_gerir on public.pedido_rfp_opcoes for all to authenticated
  using (public.pode_gerir_pedido(pedido_id)) with check (public.pode_gerir_pedido(pedido_id));

create policy pag_ler on public.paginas_rfp for select to authenticated using (public.is_interno_leitura());
create policy pag_gerir on public.paginas_rfp for update to authenticated
  using (public.pode_gerir_pedido(pedido_id)) with check (public.pode_gerir_pedido(pedido_id));

create policy evrfp_ler on public.eventos_rfp for select to authenticated using (public.is_interno_leitura());

-- ---------------------------------------------------------------------------
-- Sistema
-- ---------------------------------------------------------------------------
create policy hist_ler on public.historico for select to authenticated using (public.is_parcerias());

create policy notif_ler on public.notificacoes for select to authenticated using (usuario_id = auth.uid());
create policy notif_marcar on public.notificacoes for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Funções sensíveis: só a service_role (Edge Functions e pg_cron).
revoke execute on function public.rfp_pagina_publica(text, text) from public, anon, authenticated;
revoke execute on function public.rfp_registrar_clique(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.pendencias_diarias() from public, anon, authenticated;
revoke execute on function public.rotina_diaria() from public, anon, authenticated;
revoke execute on function public.notificar(uuid, text, text, text, text, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.notificar_parceiro(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.notificar_responsavel(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.registrar_historico(text, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.gerar_contrapartidas(uuid) from public, anon, authenticated;
revoke execute on function public.iniciar_onboarding(uuid) from public, anon, authenticated;
revoke execute on function public.sincronizar_comissoes(uuid) from public, anon, authenticated;
grant execute on function public.rfp_pagina_publica(text, text) to service_role;
grant execute on function public.rfp_registrar_clique(text, uuid, text) to service_role;
grant execute on function public.pendencias_diarias() to service_role;
grant execute on function public.rotina_diaria() to service_role;

-- Funções chamadas pela interface: apenas usuários autenticados (cada uma confere o papel).
do $$
declare f text;
begin
  foreach f in array array[
    'registrar_indicacao(jsonb)', 'parceiro_atualizar_indicacao(uuid, jsonb)', 'confirmar_atualizacao_indicacao(uuid, boolean)',
    'atualizar_estado_comissao(uuid, text, text)', 'revisar_proposta_ficha(uuid, boolean, text)',
    'definir_acesso_usuario_parceiro(uuid, boolean)', 'publicar_pagina_rfp(uuid, jsonb)', 'renovar_pagina_rfp(uuid)',
    'revogar_pagina_rfp(uuid)', 'meus_rfps()', 'rfp_candidatos()', 'painel_semanal(date, date)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: buckets privados. Pasta raiz = id do parceiro quando o arquivo é de um parceiro.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('documentos', 'documentos', false),
  ('anexos', 'anexos', false),
  ('comprovacoes', 'comprovacoes', false),
  ('modelos', 'modelos', false),
  ('materiais', 'materiais', false),
  ('backups', 'backups', false)
on conflict (id) do nothing;

create or replace function public.pasta_parceiro(p_nome text) returns uuid
language plpgsql immutable as $$
begin
  return split_part(p_nome, '/', 1)::uuid;
exception when others then
  return null;
end $$;

-- documentos: internos leem; parcerias grava; parceiro lê só arquivos marcados como visíveis da própria pasta
create policy st_doc_ler on storage.objects for select to authenticated using (
  bucket_id = 'documentos' and (
    public.is_interno_leitura()
    or (public.pasta_parceiro(name) = public.parceiro_atual()
        and exists (select 1 from public.documentos d where d.caminho = objects.name and d.visivel_parceiro and d.parceiro_id = public.parceiro_atual()))));
create policy st_doc_gravar on storage.objects for insert to authenticated with check (bucket_id = 'documentos' and public.is_parcerias());
create policy st_doc_excluir on storage.objects for delete to authenticated using (bucket_id = 'documentos' and public.is_parcerias());

-- anexos de pontos de contato: internos de leitura; gravam parcerias e consultores
create policy st_anexo_ler on storage.objects for select to authenticated using (bucket_id = 'anexos' and public.is_interno_leitura());
create policy st_anexo_gravar on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and (public.is_parcerias() or public.is_consultor()));

-- comprovações: parceiro grava e lê na própria pasta
create policy st_compr_ler on storage.objects for select to authenticated using (
  bucket_id = 'comprovacoes' and (public.is_parcerias() or public.is_consultor() or public.pasta_parceiro(name) = public.parceiro_atual()));
create policy st_compr_gravar on storage.objects for insert to authenticated with check (
  bucket_id = 'comprovacoes' and (public.is_parcerias() or public.pasta_parceiro(name) = public.parceiro_atual()));

-- modelos de contrato: internos de leitura leem, admin grava
create policy st_mod_ler on storage.objects for select to authenticated using (bucket_id = 'modelos' and public.is_interno_leitura());
create policy st_mod_gravar on storage.objects for insert to authenticated with check (bucket_id = 'modelos' and public.is_admin());

-- materiais institucionais (selos, apresentações do grupo): todos os usuários ativos leem
create policy st_mat_ler on storage.objects for select to authenticated using (bucket_id = 'materiais' and public.papel_atual() is not null);
create policy st_mat_gravar on storage.objects for insert to authenticated with check (bucket_id = 'materiais' and public.is_parcerias());

-- backups: só administradores leem (gravação pela service_role)
create policy st_bkp_ler on storage.objects for select to authenticated using (bucket_id = 'backups' and public.is_admin());
