-- Portal Wise Partners: agendamentos com pg_cron (e pg_net para chamar Edge Functions).
-- Horários em UTC (Brasília = UTC-3).
--
-- Antes de aplicar no projeto, guarde no Vault o endereço do projeto e o segredo das rotinas:
--   select vault.create_secret('https://SEU-PROJETO.supabase.co', 'project_url');
--   select vault.create_secret('o mesmo valor de CRON_SECRET das Edge Functions', 'cron_secret');
-- Sem pg_cron disponível (ambiente local de testes), esta migração não faz nada.

create or replace function public.chamar_rotina(p_funcao text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_url text;
  v_segredo text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_segredo is null then
    raise warning 'Rotina % não chamada: configure project_url e cron_secret no Vault.', p_funcao;
    return;
  end if;
  perform net.http_post(
    url := v_url || '/functions/v1/' || p_funcao,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_segredo),
    body := '{}'::jsonb);
end $$;
revoke execute on function public.chamar_rotina(text) from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron ou pg_net indisponível: agendamentos não criados.';
    return;
  end if;
  create extension if not exists pg_cron;
  create extension if not exists pg_net;

  -- Recalcular status, próximos passos e contrapartidas: todo dia às 6h30
  perform cron.schedule('wise-rotina-diaria', '30 9 * * *', 'select public.rotina_diaria()');
  -- Resumo diário: dias úteis às 7h (a função ignora feriados)
  perform cron.schedule('wise-resumo-diario', '0 10 * * 1-5', 'select public.chamar_rotina(''resumo-diario'')');
  -- Relatório semanal do Diretor: segunda às 8h (dia e hora configuráveis; reagende se mudar)
  perform cron.schedule('wise-relatorio-semanal', '0 11 * * 1', 'select public.chamar_rotina(''relatorio-semanal'')');
  -- Avisos imediatos por e-mail: a cada 5 minutos
  perform cron.schedule('wise-notificacoes', '*/5 * * * *', 'select public.chamar_rotina(''enviar-notificacoes'')');
  -- Backup completo: domingo às 3h
  perform cron.schedule('wise-backup', '0 6 * * 0', 'select public.chamar_rotina(''backup'')');
end $$;
