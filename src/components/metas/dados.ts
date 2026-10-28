import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";

// Metas em cascata (migração 0022): programa por trimestre, pessoa por trimestre, funil reverso.

export type EtapaFunilReverso = {
  etapa: string; nome: string; quantidade: number; chance: number; projecao: number; prazo_dias_uteis: number | null; paradas: number;
};
export type FunilReverso = {
  trimestre: string; inicio: string; fim: string; dias_uteis_restantes: number;
  meta: number | null; assinados: number; faltam: number | null;
  projecao: number; lacuna: number | null; reunioes_necessarias: number; contatos_necessarios: number;
  etapas: EtapaFunilReverso[];
};
export type ItemMeta = {
  chave: string; nome: string; formato: "numero" | "percentual" | "moeda"; principal: boolean; frente: string;
  meta: number | null; realizado: any; somavel: boolean; meta_ano: number | null; realizado_ano: any; acumulado: number | null; trimestres_com_meta?: number;
};
export type MetasTrimestre = {
  trimestre: string; inicio: string; fim: string; dias_total: number; dias_passados: number;
  itens: ItemMeta[]; funil: FunilReverso;
};

export function useMetasTrimestre(trimestre?: string) {
  return useQuery({
    queryKey: ["metas-trimestre", trimestre ?? "atual"],
    retry: false,
    queryFn: async () => ok<any>(await supabase.rpc("metas_trimestre", { p_trimestre: trimestre ?? null })) as MetasTrimestre,
  });
}

// versao: muda quando os parceiros mudam de etapa (ex.: dataUpdatedAt da lista do kanban)
export function useFunilReverso(versao = 0) {
  return useQuery({
    queryKey: ["funil-reverso", versao],
    retry: false,
    queryFn: async () => ok<any>(await supabase.rpc("funil_reverso", { p_trimestre: null, p_perfil: null })) as FunilReverso,
  });
}

// NPS vem como objeto {nps, media, respostas}; os outros como número
export function valorDoItem(chave: string, v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "object") return chave === "nps" && v.nps !== null && v.nps !== undefined ? Number(v.nps) : null;
  return Number(v);
}

export type Situacao = "atingida" | "no_ritmo" | "abaixo_ritmo" | "abaixo" | "sem_meta" | "sem_dados";

// Indicador que soma no período (assinados, clientes, receita) é comparado com o ritmo esperado até hoje;
// os de estado (percentuais, NPS, ROI) são comparados direto com a meta. Contagens usam o esperado arredondado para baixo
// (meta 1 no começo do trimestre ainda está no ritmo).
export function situacaoMeta(item: Pick<ItemMeta, "somavel" | "formato">, realizado: number | null, meta: number | null, fracaoTempo: number): Situacao {
  if (meta === null || meta === undefined) return "sem_meta";
  if (realizado === null) return "sem_dados";
  if (realizado >= meta) return "atingida";
  if (!item.somavel) return "abaixo";
  const esperado = item.formato === "numero" ? Math.floor(meta * fracaoTempo) : meta * fracaoTempo * 0.9;
  return realizado >= esperado ? "no_ritmo" : "abaixo_ritmo";
}

export const ROTULO_SITUACAO: Record<Situacao, { texto: string; tom: "menta" | "alerta" | "neutro" | "perigo" }> = {
  atingida: { texto: "Meta atingida", tom: "menta" },
  no_ritmo: { texto: "No ritmo", tom: "menta" },
  abaixo_ritmo: { texto: "Abaixo do ritmo", tom: "alerta" },
  abaixo: { texto: "Abaixo da meta", tom: "alerta" },
  sem_meta: { texto: "Sem meta", tom: "neutro" },
  sem_dados: { texto: "Sem dados", tom: "neutro" },
};

// Indicadores da meta por pessoa (metas_pessoa), na ordem das telas
export const INDICADORES_PESSOA: { chave: "assinados" | "ativados" | "clientes_icp" | "reunioes" | "regua_em_dia"; rotulo: string; curto: string; percentual?: boolean; somaNaWise?: boolean }[] = [
  { chave: "assinados", rotulo: "Novos parceiros assinados", curto: "Assinados", somaNaWise: true },
  { chave: "ativados", rotulo: "Parceiros ativados", curto: "Ativados", somaNaWise: true },
  { chave: "clientes_icp", rotulo: "Clientes fechados no ICP pela carteira", curto: "Clientes no ICP", somaNaWise: true },
  { chave: "reunioes", rotulo: "Reuniões com possíveis parceiros", curto: "Reuniões" },
  { chave: "regua_em_dia", rotulo: "Régua de atendimento em dia", curto: "Régua em dia", percentual: true },
];

// Fração do trimestre já passada (0 a 1)
export function fracaoDoTrimestre(m: Pick<MetasTrimestre, "dias_passados" | "dias_total">) {
  return m.dias_total > 0 ? Math.min(1, Math.max(0, m.dias_passados / m.dias_total)) : 0;
}
