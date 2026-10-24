import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/lib/formato";

// Consultas e tipos compartilhados das telas de indicações e comissões.

export type EmpresaGrupo = { id: string; codigo: "wise" | "triade" | "swallow"; nome: string; base_calculo: string; ordem: number };
export type CriterioIcp = { id: string; chave: string; descricao: string; ordem: number };
export type PerfilResumo = { id: string; nome: string; papel: string };

export type Indicacao = {
  id: string;
  sentido: "parceiro_para_grupo" | "grupo_para_parceiro";
  parceiro_id: string;
  empresa_grupo_id: string;
  cliente_id: string;
  origem: string;
  origem_detalhe: string | null;
  data: string;
  responsavel_id: string | null;
  aderencia_icp: Record<string, boolean>;
  aderente_icp: boolean | null;
  cliente_existente: boolean;
  etapa: string;
  data_reuniao: string | null;
  valor_base: number | null;
  data_fechamento: string | null;
  data_compensacao: string | null;
  atualizacao_pendente: { etapa?: string; valor_base?: number | string; data_reuniao?: string; observacao?: string } | null;
  atualizacao_em: string | null;
  ultima_atualizacao: string;
  excecao_duplicidade: string | null;
  pedido_rfp_id: string | null;
  observacoes: string | null;
  created_at: string;
  // v2
  icp_confirmado: boolean | null;
  icp_confirmado_por: string | null;
  icp_confirmado_em: string | null;
  necessidade: string | null;
  nota_qualidade: number | null;
  qualificada: boolean;
  prazo_meses: number | null;
  valor_total: number | null;
  link_id: string | null;
  acao_wise_id: string | null;
  contrapartida_id: string | null;
  protecao_ate: string | null;
  protecao_expirada: boolean;
  sla: Sla | null;
  primeiro_contato_em: string | null;
  retorno_parceiro_em: string | null;
  parceiro_atualizou_em: string | null;
  parceiro: { id: string; nome_fantasia: string } | null;
  empresa: { id: string; nome: string; codigo: string; base_calculo: string } | null;
  cliente: {
    id: string; razao_social: string; cnpj: string | null; contato_nome: string | null; email: string | null; telefone: string | null;
    consentimento: boolean; consentimento_em: string | null;
  } | null;
  responsavel: { id: string; nome: string } | null;
  autor_atualizacao: { nome: string } | null;
};

// Sem valores de comissão: comissões ficam em tabela própria, consultada só por quem vê comissão.
export const SELECT_INDICACAO = `
  id, sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, origem_detalhe, data, responsavel_id, aderencia_icp, aderente_icp,
  cliente_existente, etapa, data_reuniao, valor_base, data_fechamento, data_compensacao, atualizacao_pendente, atualizacao_em,
  ultima_atualizacao, excecao_duplicidade, pedido_rfp_id, observacoes, created_at,
  icp_confirmado, icp_confirmado_por, icp_confirmado_em, necessidade, nota_qualidade, qualificada, prazo_meses, valor_total,
  link_id, acao_wise_id, contrapartida_id, protecao_ate, protecao_expirada, sla, primeiro_contato_em, retorno_parceiro_em,
  parceiro_atualizou_em,
  parceiro:parceiros(id, nome_fantasia),
  empresa:empresas_grupo(id, nome, codigo, base_calculo),
  cliente:clientes(id, razao_social, cnpj, contato_nome, email, telefone, consentimento, consentimento_em),
  responsavel:perfis!indicacoes_responsavel_id_fkey(id, nome),
  autor_atualizacao:perfis!indicacoes_atualizacao_por_fkey(nome)
`;

export function useEmpresasGrupo() {
  return useQuery({
    queryKey: ["empresas-grupo"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas_grupo").select("id, codigo, nome, base_calculo, ordem").order("ordem");
      if (error) throw error;
      return (data ?? []) as EmpresaGrupo[];
    },
  });
}

export function useCriteriosIcp() {
  return useQuery({
    queryKey: ["criterios-icp"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("criterios_icp").select("id, chave, descricao, ordem").eq("ativo", true).order("ordem");
      if (error) throw error;
      return (data ?? []) as CriterioIcp[];
    },
  });
}

// Usuários internos ativos (responsáveis Wise).
export function usePerfisInternos() {
  return useQuery({
    queryKey: ["perfis-internos"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome, papel")
        .neq("papel", "parceiro")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as PerfilResumo[];
    },
  });
}

// Indicação sem atualização há 15 dias ou mais (v2: indicacao_parada_dias), ainda em aberto.
export const DIAS_PARADA = 15;
export function indicacaoParada(i: Pick<Indicacao, "etapa" | "ultima_atualizacao">) {
  if (i.etapa === "fechada" || i.etapa === "perdida") return false;
  return Date.now() - new Date(i.ultima_atualizacao).getTime() >= DIAS_PARADA * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// SLA (Apêndice E). Os prazos vêm do banco em "sla"; aqui só comparamos com hoje (espelho de sla_vencidos).
// ---------------------------------------------------------------------------
export type Sla = {
  validacao_ate?: string; retorno_parceiro_ate?: string; atualizacao_dias?: number;
  primeiro_contato_ate?: string; atualizacao_parceiro_ate?: string;
};

export type PrazoSla = { chave: string; ate: string | null; cumprido: string | null; vencido: boolean };

const DIA = 24 * 60 * 60 * 1000;

export function prazosSla(i: Pick<Indicacao, "etapa" | "sentido" | "sla" | "icp_confirmado_em" | "primeiro_contato_em"
  | "retorno_parceiro_em" | "ultima_atualizacao" | "parceiro_atualizou_em" | "created_at">): PrazoSla[] {
  const s = i.sla ?? {};
  const aberta = i.etapa !== "fechada" && i.etapa !== "perdida";
  const hoje = hojeISO();
  const dias = Number(s.atualizacao_dias ?? 15);
  const passou = (ate?: string | null) => aberta && !!ate && hoje > ate;
  const somaDias = (iso: string) => new Date(new Date(iso).getTime() + dias * DIA).toISOString();
  if (i.sentido === "parceiro_para_grupo") {
    const validado = i.icp_confirmado_em && i.primeiro_contato_em
      ? (i.icp_confirmado_em > i.primeiro_contato_em ? i.icp_confirmado_em : i.primeiro_contato_em) : null;
    const proxAtualizacao = somaDias(i.ultima_atualizacao);
    return [
      { chave: "validacao", ate: s.validacao_ate ?? null, cumprido: validado, vencido: !validado && passou(s.validacao_ate) },
      { chave: "retorno_parceiro", ate: s.retorno_parceiro_ate ?? null, cumprido: i.retorno_parceiro_em, vencido: !i.retorno_parceiro_em && passou(s.retorno_parceiro_ate) },
      { chave: "atualizacao", ate: proxAtualizacao.slice(0, 10), cumprido: null, vencido: aberta && Date.now() > new Date(proxAtualizacao).getTime() },
    ];
  }
  const base = i.parceiro_atualizou_em ?? i.created_at;
  const proxParceiro = somaDias(base);
  return [
    { chave: "primeiro_contato_parceiro", ate: s.primeiro_contato_ate ?? null, cumprido: i.primeiro_contato_em, vencido: !i.primeiro_contato_em && passou(s.primeiro_contato_ate) },
    { chave: "atualizacao_parceiro", ate: s.atualizacao_parceiro_ate ?? null, cumprido: i.parceiro_atualizou_em, vencido: !i.parceiro_atualizou_em && passou(s.atualizacao_parceiro_ate) },
    { chave: "atualizacao", ate: proxParceiro.slice(0, 10), cumprido: null, vencido: aberta && Date.now() > new Date(proxParceiro).getTime() },
  ];
}

export function slaVencidos(i: Parameters<typeof prazosSla>[0]) {
  return prazosSla(i).filter((p) => p.vencido).map((p) => p.chave);
}

// Rótulo do valor base conforme a regra da empresa ("Primeira mensalidade da consultoria", "Primeira parcela", "Valor do projeto").
export function rotuloValorBase(empresa: { base_calculo?: string | null } | null | undefined) {
  return empresa?.base_calculo || "Valor base";
}
