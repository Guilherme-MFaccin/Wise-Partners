-- Portal Wise Partners 2.0: agendamentos novos (seção 6 do briefing). Horários em UTC (Brasília = UTC-3).
-- A rotina diária (6h30) continua com o mesmo agendamento da v1 e ganhou os itens novos.
-- Sem pg_cron disponível (ambiente local de testes), esta migração não faz nada.

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron indisponível: agendamentos v2 não criados.';
    return;
  end if;
  -- Revisão de nível, faixas, pesquisa de satisfação e sugestão de fase: a função confere
  -- se hoje é o primeiro dia útil do trimestre (6h45 de Brasília)
  perform cron.schedule('wise-rotina-trimestral', '45 9 * * *', 'select public.rotina_trimestral()');
end $$;
