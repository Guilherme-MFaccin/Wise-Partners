import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";

// Dados da v2 no portal do parceiro. As funções do banco já devolvem só o que o parceiro pode ver
// (sem faixa, maturidade, desligamento nem notas internas).

export type GrupoNivel = { cumprido: boolean; descricao: string | null; faltante: string[] };
export type CumpreNivel = { nivel: string; cumpre: boolean; grupos: Record<string, GrupoNivel> };
export type MeuNivel = {
  tipo: "comercial" | "institucional";
  nivel: string | null;
  pacote: string | null;
  em_observacao_ate: string | null;
  pacote_pendente: string | null;
  pacote_pendente_em: string | null;
  atual: CumpreNivel | null;
  acima: CumpreNivel | null;
};

export function useMeuNivel() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-meu-nivel", perfil?.parceiro_id],
    queryFn: async () => ok<any>(await supabase.rpc("meu_nivel")) as MeuNivel,
  });
}

export type Plano = {
  parceiro_id: string;
  inicio: string;
  prazo_final: string;
  estendido_ate: string | null;
  situacao: "em_andamento" | "ativado" | "nao_ativado";
  ativado_em: string | null;
  primeira_indicacao_em: string | null;
};
export type Marco = { id: string; tipo: string; prazo: string; cumprido_em: string | null };

export function usePlanoOnboarding() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-onboarding", perfil?.parceiro_id],
    queryFn: async () => {
      const plano = ok<any>(await supabase.from("planos_onboarding")
        .select("parceiro_id, inicio, prazo_final, estendido_ate, situacao, ativado_em, primeira_indicacao_em")
        .eq("parceiro_id", perfil!.parceiro_id).maybeSingle()) as Plano | null;
      const marcos = plano
        ? (ok<any>(await supabase.from("marcos_onboarding").select("id, tipo, prazo, cumprido_em")
            .eq("parceiro_id", perfil!.parceiro_id).order("prazo").order("tipo")) as Marco[])
        : [];
      return { plano, marcos: ordenarMarcos(marcos) };
    },
  });
}

const ORDEM_MARCOS = ["encontro_alinhamento", "encontro_vendas", "marco_30", "encontro_produto", "marco_60", "encontro_pos_venda", "marco_90"];
export function ordenarMarcos(m: Marco[]) {
  return [...m].sort((a, b) => a.prazo.localeCompare(b.prazo) || ORDEM_MARCOS.indexOf(a.tipo) - ORDEM_MARCOS.indexOf(b.tipo));
}

// O que acontece em cada item do plano (Apêndice F)
export const DESCRICAO_MARCOS: Record<string, string> = {
  encontro_alinhamento: "Objetivos dos dois lados, proposta de valor em 4 pontos, régua de acompanhamento, metas dos 90 dias, entrega do link de indicação e convite das pessoas para a trilha.",
  encontro_vendas: "Como reconhecer um cliente no perfil ideal (ICP), como abordar e indicar, uso do link exclusivo.",
  marco_30: "Responsável com a trilha \"Como vender a Wise Makers\" iniciada e ao menos 1 indicação registrada.",
  encontro_produto: "Oferta da Wise, mentoria, Wise Hub, cases e respostas às objeções.",
  marco_60: "Responsável certificado e ao menos 1 indicação qualificada.",
  encontro_pos_venda: "SLA, acompanhamento do cliente indicado, comissão e revisão dos resultados.",
  marco_90: "Ativação: primeira indicação com ICP confirmado pela Wise que virou reunião.",
};

// O que o parceiro pode fazer para cumprir cada item
export const ACAO_MARCOS: Record<string, { texto: string; to: string } | null> = {
  encontro_alinhamento: null,
  encontro_vendas: { texto: "Ver o link de indicação", to: "/parceiro/indicar" },
  marco_30: { texto: "Começar a trilha", to: "/parceiro/capacitacao" },
  encontro_produto: null,
  marco_60: { texto: "Concluir a trilha e o teste", to: "/parceiro/capacitacao" },
  encontro_pos_venda: null,
  marco_90: { texto: "Indicar um cliente", to: "/parceiro/indicar" },
};

export type Leitura = {
  comunicado_id: string;
  enviado_em: string;
  lido_em: string | null;
  comunicado: { id: string; titulo: string; corpo: string; tipo: string; enviado_em: string | null } | null;
};

export function useMeusComunicados() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.id,
    queryKey: ["portal-comunicados", perfil?.id],
    refetchInterval: 120_000,
    queryFn: async () => ok<any>(await supabase.from("comunicado_leituras")
      .select("comunicado_id, enviado_em, lido_em, comunicado:comunicados(id, titulo, corpo, tipo, enviado_em)")
      .eq("perfil_id", perfil!.id).order("enviado_em", { ascending: false })) as Leitura[],
  });
}

export function useComunicadosNaoLidos() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.id,
    queryKey: ["portal-comunicados-nao-lidos", perfil?.id],
    refetchInterval: 120_000,
    queryFn: async () => {
      const { count, error } = await supabase.from("comunicado_leituras").select("comunicado_id", { count: "exact", head: true })
        .eq("perfil_id", perfil!.id).is("lido_em", null);
      if (error) return 0;
      return count ?? 0;
    },
  });
}

// Trimestre no formato do banco: "AAAA-TN" (ex.: 2026-T4)
export function trimestreAtual() {
  const [a, m] = hojeISO().split("-").map(Number);
  return `${a}-T${Math.floor((m - 1) / 3) + 1}`;
}

export function useMinhaPesquisa() {
  const { perfil } = useAuth();
  const tri = trimestreAtual();
  return useQuery({
    enabled: !!perfil?.id,
    queryKey: ["portal-pesquisa", perfil?.id, tri],
    queryFn: async () => ok<any>(await supabase.from("pesquisas_satisfacao").select("id, nota, comentario, respondida_em, trimestre")
      .eq("perfil_id", perfil!.id).eq("trimestre", tri).maybeSingle()) as
      { id: string; nota: number; comentario: string | null; respondida_em: string; trimestre: string } | null,
  });
}

export type AcaoWise = {
  id: string;
  nome: string;
  tipo_acao: string;
  periodicidade: string;
  comprovacao_esperada: string | null;
  data_prevista: string | null;
  estado: string;
  concluida_em: string | null;
  comprovacao_link: string | null;
  resultado: { alcance?: number; inscritos?: number } | null;
};

export function useAcoesWise() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-acoes-wise", perfil?.parceiro_id],
    queryFn: async () => ok<any>(await supabase.from("acoes_wise")
      .select("id, nome, tipo_acao, periodicidade, comprovacao_esperada, data_prevista, estado, concluida_em, comprovacao_link, resultado")
      .eq("parceiro_id", perfil!.parceiro_id).eq("ativa", true)
      .order("data_prevista", { ascending: true, nullsFirst: false })) as AcaoWise[],
  });
}

export function adicionarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
