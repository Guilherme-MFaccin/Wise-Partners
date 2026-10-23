import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Indicação sem atualização há 30 dias ou mais, ainda em aberto.
export function indicacaoParada(i: Pick<Indicacao, "etapa" | "ultima_atualizacao">) {
  if (i.etapa === "fechada" || i.etapa === "perdida") return false;
  return Date.now() - new Date(i.ultima_atualizacao).getTime() >= 30 * 24 * 60 * 60 * 1000;
}

// Rótulo do valor base conforme a regra da empresa ("Primeira mensalidade da consultoria", "Primeira parcela", "Valor do projeto").
export function rotuloValorBase(empresa: { base_calculo?: string | null } | null | undefined) {
  return empresa?.base_calculo || "Valor base";
}
