import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";

// Gerenciador de tarefas (P-08, P-09): tarefas manuais e as que nascem das regras (exceções), na tabela tarefas.
export type Status = "a_fazer" | "fazendo" | "aguardando" | "feito" | "cancelada";
export type Prioridade = "urgente" | "alta" | "normal" | "baixa";
export type ItemChecklist = { texto: string; feito: boolean };
export type Tarefa = {
  id: string; titulo: string; descricao: string | null; detalhe: string | null; status: Status; prioridade: Prioridade;
  responsavel_id: string | null; criado_por: string | null; parceiro_id: string | null; origem: "manual" | "regra"; tipo: string;
  grupo: "decidir" | "responder" | "acompanhar" | null; chave_regra: string | null; link: string | null; etiquetas: string[]; checklist: ItemChecklist[];
  inicio: string | null; prazo: string | null; ordem: number; concluida_em: string | null; resolvida_pela_regra: boolean;
  created_at: string; updated_at: string; parceiro: { nome_fantasia: string } | null;
};
export type Pessoa = { id: string; nome: string; papel: string };

export const STATUS: { id: Status; rotulo: string; cor: string }[] = [
  { id: "a_fazer", rotulo: "A fazer", cor: "bg-neutro-300" },
  { id: "fazendo", rotulo: "Fazendo", cor: "bg-sky-400" },
  { id: "aguardando", rotulo: "Aguardando", cor: "bg-warning" },
  { id: "feito", rotulo: "Feito", cor: "bg-menta-500" },
  { id: "cancelada", rotulo: "Cancelada", cor: "bg-white/20" },
];
export const PRIORIDADES: { id: Prioridade; rotulo: string; cor: string; peso: number }[] = [
  { id: "urgente", rotulo: "Urgente", cor: "text-red-300", peso: 0 },
  { id: "alta", rotulo: "Alta", cor: "text-warning", peso: 1 },
  { id: "normal", rotulo: "Normal", cor: "text-sky-300", peso: 2 },
  { id: "baixa", rotulo: "Baixa", cor: "text-neutro-300", peso: 3 },
];
export const GRUPOS_REGRA: Record<string, string> = { decidir: "Decidir", responder: "Responder", acompanhar: "Acompanhar" };
export const rotuloStatus = (s: Status) => STATUS.find((x) => x.id === s)?.rotulo ?? s;
export const rotuloPrioridade = (p: Prioridade) => PRIORIDADES.find((x) => x.id === p)?.rotulo ?? p;

const SELECT = "*, parceiro:parceiros(nome_fantasia)";

export function useTarefas() {
  const qc = useQueryClient();
  // Ao abrir, traz as exceções novas e fecha as resolvidas (o banco ignora se sincronizou há menos de 2 minutos)
  const sync = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("sincronizar_tarefas" as any, { p_forcar: false });
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tarefas-lista"] }),
  });
  useEffect(() => { sync.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return useQuery({
    queryKey: ["tarefas-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tarefas" as any).select(SELECT)
        .or(`status.not.in.(feito,cancelada),updated_at.gte.${new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)}`)
        .order("ordem").limit(2000);
      if (error) throw error;
      // datas sempre como AAAA-MM-DD (os campos de data e as comparações dependem disso)
      return ((data ?? []) as unknown as Tarefa[]).map((t) => ({ ...t, inicio: t.inicio?.slice(0, 10) ?? null, prazo: t.prazo?.slice(0, 10) ?? null }));
    },
  });
}

export function usePessoas() {
  return useQuery({
    queryKey: ["perfis", "internos"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("perfis").select("id, nome, papel").neq("papel", "parceiro").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data ?? []) as Pessoa[];
    },
  });
}

export function useParceirosLista() {
  return useQuery({
    queryKey: ["parceiros", "nomes"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiros").select("id, nome_fantasia").order("nome_fantasia").limit(1000);
      if (error) throw error;
      return (data ?? []) as { id: string; nome_fantasia: string }[];
    },
  });
}

// Atualização otimista: o cartão muda na hora e volta se o banco recusar
export function useAtualizarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mudanca }: { id: string; mudanca: Partial<Tarefa> }) => {
      const { parceiro: _p, ...limpa } = mudanca as any;
      const { error } = await supabase.from("tarefas" as any).update(limpa).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, mudanca }) => {
      await qc.cancelQueries({ queryKey: ["tarefas-lista"] });
      const antes = qc.getQueryData<Tarefa[]>(["tarefas-lista"]);
      qc.setQueryData<Tarefa[]>(["tarefas-lista"], (l) => (l ?? []).map((t) => (t.id === id ? { ...t, ...mudanca } : t)));
      return { antes };
    },
    onError: (e, _v, ctx) => { if (ctx?.antes) qc.setQueryData(["tarefas-lista"], ctx.antes); toastErro(e); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tarefas-lista"] }),
  });
}

export function useCriarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Partial<Tarefa>) => {
      const { data, error } = await supabase.from("tarefas" as any).insert({ ...nova, origem: "manual" }).select(SELECT).single();
      if (error) throw error;
      return data as unknown as Tarefa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas-lista"] }),
    onError: toastErro,
  });
}

export function useApagarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarefas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas-lista"] }),
    onError: toastErro,
  });
}

export type Comentario = { id: string; texto: string; created_at: string; autor_id: string | null; autor: { nome: string } | null };
export function useComentarios(tarefaId: string | null) {
  return useQuery({
    queryKey: ["tarefa-comentarios", tarefaId],
    enabled: !!tarefaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("tarefa_comentarios" as any).select("id, texto, created_at, autor_id, autor:perfis(nome)")
        .eq("tarefa_id", tarefaId).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Comentario[];
    },
  });
}

export function useComentar(tarefaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (texto: string) => {
      const { error } = await supabase.from("tarefa_comentarios" as any).insert({ tarefa_id: tarefaId, texto });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefa-comentarios", tarefaId] }),
    onError: toastErro,
  });
}

// Datas: comparações só pelo dia (AAAA-MM-DD)
export function diasAte(prazo: string, hoje: string) {
  return Math.round((Date.parse(prazo) - Date.parse(hoje)) / 86_400_000);
}
export function faixaPrazo(t: Tarefa, hoje: string): "atrasada" | "hoje" | "semana" | "depois" | "sem" {
  if (!t.prazo) return "sem";
  const d = diasAte(t.prazo, hoje);
  return d < 0 ? "atrasada" : d === 0 ? "hoje" : d <= 7 ? "semana" : "depois";
}
export const FAIXAS_PRAZO = [
  { id: "atrasada", rotulo: "Atrasadas" }, { id: "hoje", rotulo: "Hoje" }, { id: "semana", rotulo: "Próximos 7 dias" },
  { id: "depois", rotulo: "Mais adiante" }, { id: "sem", rotulo: "Sem prazo" },
] as const;
export const aberta = (t: Tarefa) => t.status !== "feito" && t.status !== "cancelada";
export const iniciais = (nome?: string | null) => (nome ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
