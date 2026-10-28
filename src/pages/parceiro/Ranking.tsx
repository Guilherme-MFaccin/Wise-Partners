import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Medal, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";

type Linha = { posicao: number; parceiro_id: string | null; nome: string; pontos: number; eu: boolean };
type Premiacao = { ano: number; categoria: string; nome: string; minha: boolean };

// Ranking (Apêndice K): posição, nome e pontos dos 10 primeiros e a própria posição.
// Nunca mostra nível, faixa, valores ou clientes; quem pediu anonimato aparece como "Parceiro Wise".
export default function Ranking() {
  const [anoAtual, mesAtual] = hojeISO().split("-").map(Number);
  const [ano, setAno] = useState(anoAtual);
  const [periodo, setPeriodo] = useState<string>("ano");
  const trimestre = periodo === "ano" ? null : Number(periodo);

  const rankingQ = useQuery({
    queryKey: ["portal-ranking", ano, trimestre],
    queryFn: async () => (ok<any>(await supabase.rpc("ranking", { p_ano: ano, p_trimestre: trimestre })) ?? []) as Linha[],
  });
  const premiosQ = useQuery({
    queryKey: ["portal-premiacoes"],
    queryFn: async () => (ok<any>(await supabase.rpc("premiacoes_publicas")) ?? []) as Premiacao[],
  });

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2];
  const triMax = ano === anoAtual ? Math.floor((mesAtual - 1) / 3) + 1 : 4;
  const lista = rankingQ.data ?? [];
  const top = lista.filter((l) => l.posicao <= 10);
  const eu = lista.find((l) => l.eu);
  const premiosPorAno = (premiosQ.data ?? []).reduce<Record<number, Premiacao[]>>((acc, p) => {
    (acc[p.ano] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Ranking" descricao="Como estamos no reconhecimento do ano? Pontos por indicações qualificadas, reuniões, clientes fechados, pessoas certificadas e ações comprovadas. O ranking não tem meta: quem define o nível são os requisitos."
        acoes={
          <>
            <Select value={String(ano)} onValueChange={(v) => { setAno(Number(v)); setPeriodo("ano"); }}>
              <SelectTrigger className="w-28" aria-label="Ano"><SelectValue /></SelectTrigger>
              <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40" aria-label="Período"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ano">Ano inteiro</SelectItem>
                {[1, 2, 3, 4].filter((t) => t <= triMax).map((t) => <SelectItem key={t} value={String(t)}>{t}º trimestre</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        } />

      {eu && (
        <section className="flex items-center gap-4 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 sm:p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-menta-500/15 text-xl font-bold text-menta-300">{eu.posicao}º</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-menta-400">Sua posição</p>
            <p className="text-lg font-bold">{eu.pontos} {eu.pontos === 1 ? "ponto" : "pontos"}</p>
            <p className="text-sm text-muted-foreground">{periodo === "ano" ? `Ranking de ${ano}` : `${periodo}º trimestre de ${ano}`}</p>
          </div>
        </section>
      )}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-menta-400" /> Os 10 primeiros</h2>
        {rankingQ.isLoading ? <Carregando /> : rankingQ.error ? <ErroCarga erro={rankingQ.error} /> : top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum parceiro pontuou neste período.</p>
        ) : (
          <ol className="mt-3 divide-y divide-white/5">
            {top.map((l) => <LinhaRanking key={l.posicao} l={l} />)}
            {eu && eu.posicao > 10 && (
              <>
                <li className="py-1 text-center text-muted-foreground" aria-hidden>⋯</li>
                <LinhaRanking l={eu} />
              </>
            )}
          </ol>
        )}
      </section>

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4 text-menta-400" /> Premiação anual</h2>
        {premiosQ.isLoading ? <Carregando /> : premiosQ.error ? <ErroCarga erro={premiosQ.error} /> : !premiosQ.data?.length ? (
          <div className="mt-3"><Vazio titulo="Nenhuma premiação divulgada">As categorias: parceiro do ano, mais clientes no ICP, melhor estreante e destaque em capacitação.</Vazio></div>
        ) : (
          <div className="mt-3 space-y-4">
            {Object.keys(premiosPorAno).map(Number).sort((a, b) => b - a).map((a) => (
              <div key={a}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{a}</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {premiosPorAno[a].map((p) => (
                    <li key={p.categoria} className={`rounded-[10px] border p-3 text-sm ${p.minha ? "border-menta-500/40 bg-menta-500/5" : "border-white/10"}`}>
                      <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      <p className="flex flex-wrap items-center gap-2 font-semibold">{p.nome} {p.minha && <Pilula tom="menta">Vocês</Pilula>}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LinhaRanking({ l }: { l: Linha }) {
  const medalha = l.posicao <= 3;
  return (
    <li className={`flex items-center gap-3 py-2.5 ${l.eu ? "-mx-2 rounded-[10px] bg-menta-500/10 px-2" : ""}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${medalha ? "bg-nivel-dourado/15 text-nivel-dourado" : "bg-white/5 text-muted-foreground"}`}>
        {medalha ? <Medal className="h-4 w-4" /> : l.posicao}
      </span>
      <span className="w-8 shrink-0 text-sm text-muted-foreground">{l.posicao}º</span>
      <span className={`min-w-0 flex-1 truncate text-sm ${l.eu ? "font-bold" : ""}`}>{l.nome}</span>
      {l.eu && <Pilula tom="menta">Vocês</Pilula>}
      <span className="shrink-0 text-sm font-semibold">{l.pontos} pts</span>
    </li>
  );
}
