// Dados comuns às duas páginas públicas (/parceiros e /c/:codigo): valores de referência e perfil da reunião.
// O total sai pronto daqui; a página só formata.

export type ConfigCliente = {
  valor_diagnostico?: number | string | null;
  valor_hub?: number | string | null;
  icp_min_vendedores?: number | null;
  icp_faturamento_min?: string | null;
  preco_mes1?: number | string | null; preco_mes1_tabela?: number | string | null; preco_mes2?: number | string | null; preco_continuidade?: number | string | null;
} | null;

// Preços da jornada paga (proposta comercial de 26/11/2026) vão junto, para os marcadores das páginas
export const COLUNAS_CLIENTE = "valor_diagnostico, valor_hub, icp_min_vendedores, icp_faturamento_min, preco_mes1, preco_mes1_tabela, preco_mes2, preco_continuidade";

export function valores(c: ConfigCliente) {
  const diagnostico = Number(c?.valor_diagnostico ?? 2000);
  const hub = Number(c?.valor_hub ?? 3000);
  return {
    diagnostico, hub, total: diagnostico + hub,
    preco_mes1: Number(c?.preco_mes1 ?? 4997), preco_mes1_tabela: Number(c?.preco_mes1_tabela ?? 7000),
    preco_mes2: Number(c?.preco_mes2 ?? 4997), preco_continuidade: Number(c?.preco_continuidade ?? 3997),
  };
}

// O texto do perfil ("a partir de 3 vendedores e R$ 250 mil de faturamento por mês") é montado na página
export function icp(c: ConfigCliente) {
  return { min_vendedores: c?.icp_min_vendedores ?? 3, faturamento_min: c?.icp_faturamento_min ?? null };
}
