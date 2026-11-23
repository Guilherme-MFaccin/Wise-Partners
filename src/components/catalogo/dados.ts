import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toastErro } from "@/lib/erros";

// Catálogo de parceiros (FO-19). Quem oferece: Elite e clientes do grupo. Quem vê e usa: Premium, Elite e clientes do grupo.
export type OfertaCatalogo = {
  oferta_id: string; titulo: string; descricao: string; para_quem: string | null; condicao: string | null; como_usar: string | null; validade: string | null;
  parceiro_id: string; empresa: string; site: string | null; cliente_grupo: boolean; categoria: string | null; categorias: string[]; propria: boolean;
  liberada: boolean; logo_caminho: string | null; cidade: string | null; uf: string | null;
};
export type Oferta = {
  id: string; parceiro_id: string; titulo: string; descricao: string; para_quem: string | null; condicao: string; como_usar: string | null;
  validade: string | null; categoria_id: string | null; estado: "rascunho" | "em_validacao" | "publicada" | "pausada" | "recusada";
  motivo_recusa: string | null; validada_em: string | null; created_at: string; updated_at: string; parceiro?: { nome_fantasia: string } | null;
};
export type Pedido = {
  id: string; protocolo: string; oferta_id: string | null; ofertante_id: string; solicitante_id: string; titulo_oferta: string; condicao: string;
  ofertante_nome: string; solicitante_nome: string;
  mensagem: string | null; resultado: "enviado" | "fechado" | "nao_avancou"; resultado_em: string | null; created_at: string;
  ofertante?: { nome_fantasia: string } | null; solicitante?: { nome_fantasia: string } | null;
};

export const ESTADOS_OFERTA: Record<Oferta["estado"], { rotulo: string; tom: "neutro" | "menta" | "alerta" | "perigo" | "info" }> = {
  rascunho: { rotulo: "Rascunho", tom: "neutro" }, em_validacao: { rotulo: "Em validação pela Wise", tom: "alerta" }, publicada: { rotulo: "Publicada", tom: "menta" },
  pausada: { rotulo: "Pausada", tom: "neutro" }, recusada: { rotulo: "Recusada", tom: "perigo" },
};
export const RESULTADOS: Record<Pedido["resultado"], string> = { enviado: "Enviado", fechado: "Fechou negócio", nao_avancou: "Não avançou" };

// O banco decide o que cada conta acessa (acesso_comunidade): condições, ofertas, indicação e o vínculo declarado
export type AcessoComunidade = {
  empresa: boolean; parceiro_programa?: boolean; cliente_grupo?: boolean; nivel?: "select" | "premium" | "elite" | null;
  ver_condicoes?: boolean; ofertar?: boolean; indicar?: boolean;
  vinculo_cliente?: "nao_declarado" | "a_confirmar" | "confirmado" | "nao_confirmado" | null; vinculo_motivo?: string | null;
  empresas_grupo?: string[]; pedido_parceria?: string | null;
};
export function useAcessoHub() {
  const { perfil } = useAuth();
  return useQuery({
    queryKey: ["acesso-hub", perfil?.parceiro_id],
    enabled: !!perfil?.parceiro_id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("acesso_comunidade" as any);
      if (error) throw error;
      const a = (data ?? { empresa: false }) as AcessoComunidade;
      return { ...a, ver: !!a.ver_condicoes, ofertar: !!a.ofertar, indicar: !!a.indicar, parceiroPrograma: !!a.parceiro_programa };
    },
  });
}

export function usePedirParceria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: { categoria_id: string; clientes_ativos: string; aceite_termo_parceiro: boolean }) => {
      const { error } = await supabase.rpc("pedir_parceria_comunidade" as any, { p: dados });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acesso-hub"] }),
    onError: toastErro,
  });
}

export function useCatalogo(ativo = true) {
  return useQuery({
    queryKey: ["catalogo-hub"],
    enabled: ativo,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("catalogo_hub" as any);
      if (error) throw error;
      return (data ?? []) as OfertaCatalogo[];
    },
  });
}

export function useOfertas(filtro: { parceiroId?: string | null; estados?: Oferta["estado"][] } = {}) {
  return useQuery({
    queryKey: ["ofertas-hub", filtro.parceiroId ?? "todas", (filtro.estados ?? []).join(",")],
    queryFn: async () => {
      let q = supabase.from("ofertas_hub" as any).select("*, parceiro:parceiros(nome_fantasia)").order("updated_at", { ascending: false });
      if (filtro.parceiroId) q = q.eq("parceiro_id", filtro.parceiroId);
      if (filtro.estados?.length) q = q.in("estado", filtro.estados);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Oferta[];
    },
  });
}

export function useSalvarOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: Partial<Oferta> }) => {
      const { parceiro: _p, ...limpo } = dados as any;
      const r = id ? await supabase.from("ofertas_hub" as any).update(limpo).eq("id", id) : await supabase.from("ofertas_hub" as any).insert(limpo);
      if (r.error) throw r.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ofertas-hub"] }); qc.invalidateQueries({ queryKey: ["catalogo-hub"] }); qc.invalidateQueries({ queryKey: ["tarefas-lista"] }); },
    onError: toastErro,
  });
}

export function useApagarOferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ofertas_hub" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ofertas-hub"] }); qc.invalidateQueries({ queryKey: ["catalogo-hub"] }); },
    onError: toastErro,
  });
}

export function usePedidos(filtro: { ofertanteId?: string | null; solicitanteId?: string | null } = {}) {
  return useQuery({
    queryKey: ["pedidos-hub", filtro.ofertanteId ?? "-", filtro.solicitanteId ?? "-"],
    queryFn: async () => {
      let q = supabase.from("pedidos_hub" as any)
        .select("*, ofertante:parceiros!pedidos_hub_ofertante_id_fkey(nome_fantasia), solicitante:parceiros!pedidos_hub_solicitante_id_fkey(nome_fantasia)")
        .order("created_at", { ascending: false }).limit(500);
      if (filtro.ofertanteId) q = q.eq("ofertante_id", filtro.ofertanteId);
      if (filtro.solicitanteId) q = q.eq("solicitante_id", filtro.solicitanteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Pedido[];
    },
  });
}

export function usePedirCondicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ofertaId, mensagem }: { ofertaId: string; mensagem: string }) => {
      const { data, error } = await supabase.rpc("pedir_condicao" as any, { p_oferta: ofertaId, p_mensagem: mensagem || null });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos-hub"] }),
    onError: toastErro,
  });
}

export function useMarcarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resultado }: { id: string; resultado: Pedido["resultado"] }) => {
      const { error } = await supabase.rpc("marcar_pedido" as any, { p_pedido: id, p_resultado: resultado });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos-hub"] }),
    onError: toastErro,
  });
}

export async function contatoDoPedido(id: string) {
  const { data, error } = await supabase.rpc("contato_do_pedido" as any, { p_pedido: id });
  if (error) throw error;
  return ((data ?? []) as { nome: string | null; email: string | null; telefone: string | null; empresa: string }[])[0] ?? null;
}

export function useCategoriasLista() {
  return useQuery({
    queryKey: ["categorias", "todas"],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("id, nome, tipo").eq("ativa", true).order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string; tipo: string }[];
    },
  });
}
