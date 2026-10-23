import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";

// Dados do portal do parceiro. A RLS devolve só o que é da empresa do usuário;
// as consultas também nunca pedem colunas internas (estratégico, anotações, comissão do responsável).

export type MeuParceiro = {
  id: string;
  nome_fantasia: string;
  razao_social: string | null;
  tipo_parceria: "comercial" | "institucional";
  perfil_institucional: string | null;
  nivel: string | null;
  pacote: string | null;
  data_assinatura: string | null;
  responsavel_id: string | null;
};

export function useMeuParceiro() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-parceiro", perfil?.parceiro_id],
    queryFn: async () =>
      ok<any>(await supabase.from("parceiros")
        .select("id, nome_fantasia, razao_social, tipo_parceria, perfil_institucional, nivel, pacote, data_assinatura, responsavel_id")
        .eq("id", perfil!.parceiro_id).single()) as MeuParceiro,
  });
}

export type Contrapartida = {
  id: string;
  nome: string;
  periodicidade: string;
  comprovacao: string;
  meta: string | null;
  proxima_data: string | null;
  estado: string;
  comprovacoes: { id: string; estado: string; motivo_recusa: string | null; created_at: string; link: string | null; caminho: string | null }[];
};

export function useMinhasContrapartidas() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-contrapartidas", perfil?.parceiro_id],
    queryFn: async () =>
      ok<any>(await supabase.from("contrapartidas")
        .select("id, nome, periodicidade, comprovacao, meta, proxima_data, estado, comprovacoes(id, estado, motivo_recusa, created_at, link, caminho)")
        .eq("parceiro_id", perfil!.parceiro_id).eq("ativa", true)
        .order("proxima_data", { ascending: true, nullsFirst: false })) as Contrapartida[],
  });
}

// Estado exibido ao parceiro: recusa volta a contrapartida para pendente, então olhamos a última comprovação.
export function estadoContrapartida(c: Contrapartida): { codigo: string; rotulo: string; motivo?: string | null } {
  const ultima = [...(c.comprovacoes ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (c.estado === "pendente" && ultima?.estado === "recusada") return { codigo: "recusada", rotulo: "Recusada", motivo: ultima.motivo_recusa };
  const rotulos: Record<string, string> = { pendente: "Pendente", enviada: "Enviada", validada: "Em dia", atrasada: "Atrasada", recusada: "Recusada" };
  return { codigo: c.estado, rotulo: rotulos[c.estado] ?? c.estado };
}

export type MeuRfp = { pedido_id: string; publicada_em: string | null; cliente_nome: string; necessidade_resumida: string | null; cliques: number; aberturas: number };

export function useMeusRfps() {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-rfps", perfil?.parceiro_id],
    queryFn: async () => (ok<any>(await supabase.rpc("meus_rfps")) ?? []) as MeuRfp[],
  });
}

// Parâmetros que o parceiro pode ler (wise_hub_url, calendários e materiais)
export function useParametro<T = any>(chave: string) {
  return useQuery({
    queryKey: ["configuracao", chave],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("valor").eq("chave", chave).maybeSingle();
      if (error) return null;
      return (data?.valor ?? null) as T | null;
    },
  });
}

export function nomeSeguro(nome: string) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
}

export async function baixarArquivo(bucket: string, caminho: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(caminho, 120);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}
