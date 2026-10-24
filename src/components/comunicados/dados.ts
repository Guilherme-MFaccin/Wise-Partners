import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NIVEIS_COMERCIAL, NIVEIS_INSTITUCIONAL, TIPOS_PARCERIA } from "@/lib/rotulos";

export const TIPOS_COMUNICADO: Record<string, string> = {
  regra: "Mudança de regra", evento: "Evento", material: "Material novo", outro: "Outro",
};

export type Recorte = { niveis?: string[]; pacotes?: string[]; categorias?: string[]; tipos?: string[] };

export type Comunicado = {
  id: string;
  titulo: string;
  corpo: string;
  tipo: string;
  recorte: Recorte | null;
  versao_regras_id: string | null;
  enviado_em: string | null;
  enviado_por: string | null;
  created_by: string | null;
  created_at: string;
};

export type Leitura = { comunicado_id: string; perfil_id: string; parceiro_id: string | null; enviado_em: string; lido_em: string | null };

export function useComunicados() {
  return useQuery({
    queryKey: ["comunicados", "lista"],
    queryFn: async () => {
      const [c, l] = await Promise.all([
        supabase.from("comunicados").select("*").order("created_at", { ascending: false }),
        supabase.from("comunicado_leituras").select("comunicado_id, lido_em"),
      ]);
      if (c.error) throw c.error;
      if (l.error) throw l.error;
      const contagem = new Map<string, { total: number; lidos: number }>();
      for (const x of (l.data ?? []) as Pick<Leitura, "comunicado_id" | "lido_em">[]) {
        const k = contagem.get(x.comunicado_id) ?? { total: 0, lidos: 0 };
        k.total++;
        if (x.lido_em) k.lidos++;
        contagem.set(x.comunicado_id, k);
      }
      return { comunicados: (c.data ?? []) as Comunicado[], contagem };
    },
  });
}

export function useLeituras(id: string | null) {
  return useQuery({
    queryKey: ["comunicados", "leituras", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("comunicado_leituras").select("*").eq("comunicado_id", id!);
      if (error) throw error;
      return (data ?? []) as Leitura[];
    },
  });
}

// Nível com os dois nomes (comercial e institucional), para as telas internas
export function nomeNivelRecorte(codigo: string) {
  return `${codigo} · ${NIVEIS_COMERCIAL[codigo] ?? codigo} / ${NIVEIS_INSTITUCIONAL[codigo] ?? codigo}`;
}

export function recorteVazio(r: Recorte | null | undefined) {
  return !r || ["niveis", "pacotes", "categorias", "tipos"].every((k) => !(r as any)[k]?.length);
}

export function resumoRecorte(r: Recorte | null | undefined, nomes: { pacotes: Map<string, string>; categorias: Map<string, string> }) {
  if (recorteVazio(r)) return "Todos os parceiros assinados";
  const partes: string[] = [];
  if (r!.tipos?.length) partes.push(r!.tipos.map((t) => TIPOS_PARCERIA[t] ?? t).join(" ou "));
  if (r!.niveis?.length) partes.push("nível " + r!.niveis.map((n) => NIVEIS_COMERCIAL[n] ?? n).join(", "));
  if (r!.pacotes?.length) partes.push("pacote " + r!.pacotes.map((p) => nomes.pacotes.get(p) ?? p).join(", "));
  if (r!.categorias?.length) partes.push("categoria " + r!.categorias.map((c) => nomes.categorias.get(c) ?? "removida").join(", "));
  return partes.join(" · ");
}
