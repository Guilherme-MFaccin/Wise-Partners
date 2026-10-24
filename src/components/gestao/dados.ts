import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";

export type PessoaInterna = { id: string; nome: string; email: string; papel: string; ativo: boolean };

// Pessoas internas (perfis que não são de parceiro), para remunerações, metas e painel pessoal
export function usePessoasInternas() {
  return useQuery({
    queryKey: ["pessoas-internas"],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (ok<any>(await supabase.from("perfis").select("id, nome, email, papel, ativo").neq("papel", "parceiro").order("nome")) ?? []) as PessoaInterna[],
  });
}

// Um parâmetro da tabela configuracoes (valor jsonb)
export function useConfiguracao<T = any>(chave: string) {
  return useQuery({
    queryKey: ["configuracao", chave],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const r = ok<any>(await supabase.from("configuracoes").select("valor").eq("chave", chave).maybeSingle());
      return (r?.valor ?? null) as T | null;
    },
  });
}

// Trimestre no formato do banco: 'AAAA-TN'
export function trimestreDe(d: Date) {
  return `${d.getFullYear()}-T${Math.floor(d.getMonth() / 3) + 1}`;
}

export function rotuloTrimestre(t: string) {
  const [ano, n] = t.split("-T");
  return `${n}º trimestre de ${ano}`;
}

// Trimestres em volta do atual (para seletores)
export function trimestresProximos(base: Date, antes = 4, depois = 1) {
  const lista: string[] = [];
  for (let i = -antes; i <= depois; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i * 3, 1);
    lista.push(trimestreDe(d));
  }
  return lista.reverse();
}
