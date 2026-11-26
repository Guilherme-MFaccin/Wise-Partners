-- Swallow (26/11/2026): o gerente de parcerias passa de 2% para 1,5% do projeto, a mesma regra da venda pontual da Wise.
-- O parceiro continua com 6%. Vale para as comissões calculadas daqui em diante; as já gravadas mantêm o percentual delas.
update public.empresas_grupo set pct_responsavel = 1.5 where codigo = 'swallow';
