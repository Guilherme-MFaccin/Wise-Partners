// Tipos e regras de exibição das comissões.

export type Comissao = {
  id: string;
  indicacao_id: string;
  parceiro_id: string;
  beneficiario: "parceiro" | "responsavel" | "grupo";
  percentual: number | null;
  base_descricao: string | null;
  base_valor: number | null;
  valor: number | null;
  estado: string;
  a_pagar_em: string | null;
  nf_recebida_em: string | null;
  paga_em: string | null;
  observacao: string | null;
  created_at: string;
  parceiro: { id: string; nome_fantasia: string; razao_social: string | null; cnpj: string | null; endereco: string | null; cidade: string | null; uf: string | null } | null;
  responsavel: { nome: string } | null;
  indicacao: {
    id: string; data: string; sentido: string; data_fechamento: string | null; data_compensacao: string | null;
    empresa: { id: string; nome: string } | null;
    cliente: { razao_social: string } | null;
  } | null;
};

export const SELECT_COMISSAO = `
  id, indicacao_id, parceiro_id, beneficiario, percentual, base_descricao, base_valor, valor, estado,
  a_pagar_em, nf_recebida_em, paga_em, observacao, created_at,
  parceiro:parceiros(id, nome_fantasia, razao_social, cnpj, endereco, cidade, uf),
  responsavel:perfis!comissoes_responsavel_perfil_id_fkey(nome),
  indicacao:indicacoes(id, data, sentido, data_fechamento, data_compensacao, empresa:empresas_grupo(id, nome), cliente:clientes(razao_social))
`;

// Estados que cada papel pode registrar (o banco confere de novo em atualizar_estado_comissao).
export const ESTADOS_TODOS = ["aguardando_fechamento", "aguardando_compensacao", "a_pagar", "nf_recebida", "paga", "cancelada"];

export function estadosPermitidosFinanceiro(c: Pick<Comissao, "estado" | "beneficiario">): string[] {
  if (c.beneficiario === "grupo") return [];
  if (c.estado === "a_pagar") return ["nf_recebida", "paga"];
  if (c.estado === "nf_recebida") return ["paga"];
  return [];
}

export function somar(lista: Comissao[], filtro: (c: Comissao) => boolean) {
  return lista.filter(filtro).reduce((s, c) => s + Number(c.valor ?? 0), 0);
}
