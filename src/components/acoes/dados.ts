import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS_ACAO_WISE, ESTADOS_CONTRAPARTIDA } from "@/lib/rotulos";

// Plano geral de ações conjuntas: os dois lados vêm da visão v_acoes_conjuntas;
// detalhes do lado da Wise (responsável, comprovação) vêm de acoes_wise.

export type Lado = "wise" | "parceiro";

export type AcaoConjunta = {
  id: string;
  parceiro_id: string;
  lado: Lado;
  nome: string;
  tipo: string;
  periodicidade: string | null;
  data_prevista: string | null;
  estado: string;
  concluida_em: string | null;
  comprovacao_esperada: string | null;
  resultado: Record<string, any> | null;
  ativa: boolean;
  // Complementos
  parceiro_nome: string;
  parceiro_responsavel_id: string | null;
  responsavel_id: string | null; // Wise: responsável pela ação; parceiro: responsável pela parceria
  comprovacao_link: string | null;
  observacao: string | null;
};

type DetalheWise = { id: string; responsavel_id: string | null; comprovacao_link: string | null; observacao: string | null };
type ParceiroMin = { id: string; nome_fantasia: string; responsavel_id: string | null };

export function useAcoesConjuntas() {
  return useQuery({
    queryKey: ["acoes-conjuntas", "geral"],
    queryFn: async () => {
      const [v, w, p] = await Promise.all([
        supabase.from("v_acoes_conjuntas").select("*").eq("ativa", true),
        supabase.from("acoes_wise").select("id, responsavel_id, comprovacao_link, observacao"),
        supabase.from("parceiros").select("id, nome_fantasia, responsavel_id"),
      ]);
      for (const r of [v, w, p]) if (r.error) throw r.error;
      const detalhes = new Map(((w.data ?? []) as DetalheWise[]).map((d) => [d.id, d]));
      const parceiros = new Map(((p.data ?? []) as ParceiroMin[]).map((x) => [x.id, x]));
      return ((v.data ?? []) as any[]).map((a): AcaoConjunta => {
        const d = a.lado === "wise" ? detalhes.get(a.id) : undefined;
        const parc = parceiros.get(a.parceiro_id);
        return {
          ...a,
          parceiro_nome: parc?.nome_fantasia ?? "Parceiro",
          parceiro_responsavel_id: parc?.responsavel_id ?? null,
          responsavel_id: a.lado === "wise" ? d?.responsavel_id ?? null : parc?.responsavel_id ?? null,
          comprovacao_link: d?.comprovacao_link ?? null,
          observacao: d?.observacao ?? null,
        };
      });
    },
  });
}

export function rotuloEstado(a: Pick<AcaoConjunta, "lado" | "estado">) {
  const mapa = a.lado === "wise" ? ESTADOS_ACAO_WISE : ESTADOS_CONTRAPARTIDA;
  return mapa[a.estado] ?? a.estado;
}

export function concluida(a: Pick<AcaoConjunta, "lado" | "estado">) {
  return a.lado === "wise" ? a.estado === "feita" || a.estado === "comprovada" : a.estado === "validada";
}

export function encerrada(a: Pick<AcaoConjunta, "lado" | "estado">) {
  return concluida(a) || a.estado === "cancelada";
}

// Atrasada: estado marcado pela rotina ou data prevista já passou sem conclusão
export function atrasada(a: Pick<AcaoConjunta, "lado" | "estado" | "data_prevista">, hoje: string) {
  if (a.estado === "atrasada") return true;
  if (!a.data_prevista || a.data_prevista >= hoje) return false;
  return a.lado === "wise" ? a.estado === "planejada" : a.estado === "pendente" || a.estado === "recusada";
}

function paraData(iso: string) {
  return new Date(iso + "T12:00:00");
}

export type Agrupamento = "mes" | "semana";

export function chaveGrupo(iso: string | null, modo: Agrupamento) {
  if (!iso) return "~sem-data";
  if (modo === "mes") return iso.slice(0, 7);
  return format(startOfWeek(paraData(iso), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function rotuloGrupo(chave: string, modo: Agrupamento) {
  if (chave === "~sem-data") return "Sem data prevista";
  if (modo === "mes") {
    const t = format(paraData(chave + "-01"), "MMMM 'de' yyyy", { locale: ptBR });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const ini = paraData(chave);
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 6);
  return `Semana de ${format(ini, "dd/MM")} a ${format(fim, "dd/MM/yyyy")}`;
}
