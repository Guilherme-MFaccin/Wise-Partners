import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { hojeISO } from "@/lib/formato";
import { cn } from "@/lib/utils";

// P-98 (campanha) e P-101 (outras origens): de onde vêm os candidatos e quantos chegam a parceiro ativo.
type Linha = { origem: string; campanha: string; cadastros: number; em_conversa: number; aprovados: number; descartados: number; ativados: number };
const PERIODOS = [{ dias: 30, rotulo: "30 dias" }, { dias: 90, rotulo: "90 dias" }, { dias: 365, rotulo: "12 meses" }];

function pct(a: number, b: number) {
  return b > 0 ? `${Math.round((a / b) * 100)}%` : "";
}

export default function OrigensCandidatos() {
  const { isParcerias } = useAuth();
  const [dias, setDias] = useState(90);
  const fim = hojeISO();
  const inicio = new Date(Date.parse(fim) - dias * 86_400_000).toISOString().slice(0, 10);
  const q = useQuery({
    queryKey: ["candidatos-origem", dias],
    enabled: isParcerias,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("candidatos_por_origem" as any, { p_inicio: inicio, p_fim: fim });
      if (error) throw error;
      return (data ?? []) as Linha[];
    },
  });
  if (!isParcerias) return (<div><Cabecalho titulo="Origens e campanha" /><Vazio titulo="Sem permissão">Só o time de parcerias e os administradores veem as origens.</Vazio></div>);
  const linhas = q.data ?? [];
  const total = linhas.reduce((t, l) => ({
    cadastros: t.cadastros + l.cadastros, em_conversa: t.em_conversa + l.em_conversa, aprovados: t.aprovados + l.aprovados, ativados: t.ativados + l.ativados,
  }), { cadastros: 0, em_conversa: 0, aprovados: 0, ativados: 0 });

  return (
    <div>
      <Cabecalho titulo="Origens e campanha"
        descricao="De onde vêm os candidatos e quantos viram parceiro ativo? A origem vem do link de cada anúncio, evento ou contato (parâmetros utm)."
        acoes={
          <div role="radiogroup" aria-label="Período" className="flex gap-1 rounded-[10px] border border-white/10 bg-card p-1">
            {PERIODOS.map((p) => (
              <button key={p.dias} type="button" role="radio" aria-checked={dias === p.dias} onClick={() => setDias(p.dias)}
                className={cn("min-h-9 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", dias === p.dias && "bg-white/10 text-white")}>{p.rotulo}</button>
            ))}
          </div>
        } />
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && linhas.length === 0 && <Vazio titulo="Nenhum cadastro no período">Quando alguém se cadastrar pela página dos parceiros, a origem aparece aqui.</Vazio>}
      {linhas.length > 0 && (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Cadastros", total.cadastros, ""], ["Em conversa", total.em_conversa, ""], ["Aprovados", total.aprovados, pct(total.aprovados, total.cadastros)],
              ["Ativados", total.ativados, pct(total.ativados, total.aprovados)]].map(([r, v, p]) => (
              <div key={r as string} className="rounded-[14px] border border-white/10 bg-card p-4">
                <dt className="text-sm text-neutro-300">{r}</dt>
                <dd className="mt-1 text-[28px] font-bold leading-none tabular-nums">{v}</dd>
                {p && <dd className="mt-1 text-xs text-neutro-300">{r === "Aprovados" ? `${p} dos cadastros` : `${p} dos aprovados`}</dd>}
              </div>
            ))}
          </dl>
          <div className="overflow-x-auto rounded-[14px] border border-white/10 bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Candidatos por origem e campanha no período</caption>
              <thead className="border-b border-white/10 text-xs text-neutro-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Origem</th>
                  <th scope="col" className="px-4 py-3 font-medium">Campanha</th>
                  {["Cadastros", "Em conversa", "Aprovados", "Descartados", "Ativados"].map((h) => <th key={h} scope="col" className="px-4 py-3 text-right font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {linhas.map((l) => (
                  <tr key={l.origem + l.campanha}>
                    <th scope="row" className="px-4 py-3 font-semibold">{l.origem}</th>
                    <td className="px-4 py-3 text-neutro-300">{l.campanha}</td>
                    {[l.cadastros, l.em_conversa, l.aprovados, l.descartados, l.ativados].map((v, i) => <td key={i} className="px-4 py-3 text-right tabular-nums">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
