import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";
import type { Candidato, OpcaoRfp, PaginaRfp, PedidoRfp } from "./tipos";

export type Categoria = { id: string; nome: string; tipo: string; ativa: boolean; ordem: number };

// Parceiros elegíveis (o banco filtra: assinados, sem encerramento, com ficha publicada)
export function useCandidatos() {
  return useQuery({
    queryKey: ["rfp-candidatos"],
    queryFn: async () => (ok<any>(await supabase.rpc("rfp_candidatos")) ?? []) as Candidato[],
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async () => ok<any>(await supabase.from("categorias").select("id, nome, tipo, ativa, ordem").order("ordem")) as Categoria[],
  });
}

export function useEmpresasGrupo() {
  return useQuery({
    queryKey: ["empresas-grupo"],
    queryFn: async () =>
      ok<any>(await supabase.from("empresas_grupo").select("id, codigo, nome, descricao_institucional, site").order("ordem")) as {
        id: string; codigo: string; nome: string; descricao_institucional: string | null; site: string | null;
      }[],
  });
}

export function usePedido(id: string | undefined) {
  return useQuery({
    enabled: !!id && id !== "novo",
    queryKey: ["pedido-rfp", id],
    queryFn: async () => ok<any>(await supabase.from("pedidos_rfp").select("*").eq("id", id).single()) as PedidoRfp,
  });
}

export type OpcaoComNome = OpcaoRfp & { id: string; parceiro: { nome_fantasia: string } | null };

export function useOpcoes(pedidoId: string | undefined) {
  return useQuery({
    enabled: !!pedidoId && pedidoId !== "novo",
    queryKey: ["pedido-rfp-opcoes", pedidoId],
    queryFn: async () =>
      ok<any>(await supabase.from("pedido_rfp_opcoes").select("*, parceiro:parceiros(nome_fantasia)")
        .eq("pedido_id", pedidoId).order("ordem")) as OpcaoComNome[],
  });
}

export function usePagina(pedidoId: string | undefined) {
  return useQuery({
    enabled: !!pedidoId && pedidoId !== "novo",
    queryKey: ["pagina-rfp", pedidoId],
    queryFn: async () => ok<any>(await supabase.from("paginas_rfp").select("*").eq("pedido_id", pedidoId).maybeSingle()) as PaginaRfp | null,
  });
}

export type EventoRfp = { id: number; tipo: string; parceiro_id: string | null; created_at: string; parceiro: { nome_fantasia: string } | null };

export function useEventos(paginaId: string | undefined) {
  return useQuery({
    enabled: !!paginaId,
    queryKey: ["eventos-rfp", paginaId],
    queryFn: async () =>
      ok<any>(await supabase.from("eventos_rfp").select("id, tipo, parceiro_id, created_at, parceiro:parceiros(nome_fantasia)")
        .eq("pagina_id", paginaId).order("created_at", { ascending: false })) as EventoRfp[],
  });
}

// Texto do aviso de relação comercial (configurável)
export function useConfiguracao<T = any>(chave: string) {
  return useQuery({
    queryKey: ["configuracao", chave],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("valor").eq("chave", chave).maybeSingle();
      if (error) return null;
      return (data?.valor ?? null) as T | null;
    },
  });
}

// Regra do mínimo de 3 opções por categoria (o banco também confere ao publicar)
export type SituacaoCategoria = { selecionados: number; assinados: number; bloqueia: boolean; excecao: boolean };

export function situacaoCategoria(categoriaId: string, opcoes: Pick<OpcaoRfp, "categoria_id" | "selecionado">[], candidatos: Candidato[]): SituacaoCategoria {
  const selecionados = opcoes.filter((o) => o.categoria_id === categoriaId && o.selecionado).length;
  const assinados = candidatos.filter((c) => (c.categorias ?? []).some((k) => k.categoria_id === categoriaId)).length;
  return { selecionados, assinados, bloqueia: assinados >= 3 && selecionados > 0 && selecionados < 3, excecao: assinados < 3 };
}
