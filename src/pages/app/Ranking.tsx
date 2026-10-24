import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Info, Layers, Medal, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { useConfiguracao } from "@/components/gestao/dados";
import { Premiacoes } from "@/components/gestao/Premiacoes";
import { AcessoRestrito } from "@/components/gestao/Restrito";
import { ok } from "@/lib/erros";
import { dataHora, hojeISO } from "@/lib/formato";
import { FAIXAS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type LinhaRanking = { posicao: number; parceiro_id: string | null; nome: string; pontos: number; eu: boolean | null };
type Faixa = { parceiro_id: string; faixa: string; pontos_ano: number; posicao: number | null; calculada_em: string; parceiro: { nome_fantasia: string } | null };

const PAPEIS = ["admin", "parcerias", "consultor"];
const ANO_TODO = "ano";
const TOM_FAIXA: Record<string, "menta" | "info" | "neutro"> = { destaque: "menta", potencial: "info", base: "neutro" };

// Eventos que pontuam (Apêndice K), na ordem da tabela
const EVENTOS_PONTOS: Record<string, string> = {
  indicacao_qualificada: "Indicação qualificada",
  reuniao: "Indicação que virou reunião",
  cliente_icp: "Cliente fechado no ICP",
  pessoa_certificada: "Pessoa certificada (uma vez por pessoa e trilha)",
  acao_comprovada: "Ação conjunta do parceiro concluída e comprovada no prazo",
};

// Ranking, faixas internas e premiação (Histórias 12 e 13). Interno: admin, parcerias e consultores.
export default function Ranking() {
  const { perfil, isParcerias } = useAuth();
  if (!perfil || !PAPEIS.includes(perfil.papel)) {
    return <AcessoRestrito titulo="Ranking e faixas" texto="Ranking interno, faixas e premiação são visíveis para administradores, time de parcerias e consultores." />;
  }
  return <TelaRanking podeEditar={isParcerias} />;
}

function TelaRanking({ podeEditar }: { podeEditar: boolean }) {
  const anoAtual = Number(hojeISO().slice(0, 4));
  const [ano, setAno] = useState(String(anoAtual));
  const [periodo, setPeriodo] = useState(ANO_TODO);
  const anos = Array.from({ length: 4 }, (_, i) => String(anoAtual - i));

  const ranking = useQuery({
    queryKey: ["ranking", ano, periodo],
    queryFn: async () =>
      (ok<any>(await supabase.rpc("ranking", { p_ano: Number(ano), p_trimestre: periodo === ANO_TODO ? null : Number(periodo) })) ?? []) as LinhaRanking[],
  });
  const faixas = useQuery({
    queryKey: ["faixas"],
    queryFn: async () =>
      (ok<any>(await supabase.from("faixas").select("parceiro_id, faixa, pontos_ano, posicao, calculada_em, parceiro:parceiros(nome_fantasia)")
        .order("posicao")) ?? []) as unknown as Faixa[],
  });
  const { data: pontos } = useConfiguracao<Record<string, number>>("pontos_ranking");

  const faixaDe = useMemo(() => new Map((faixas.data ?? []).map((f) => [f.parceiro_id, f.faixa])), [faixas.data]);
  const contagem = useMemo(() => {
    const c: Record<string, number> = { destaque: 0, potencial: 0, base: 0 };
    for (const f of faixas.data ?? []) c[f.faixa] = (c[f.faixa] ?? 0) + 1;
    return c;
  }, [faixas.data]);
  const calculadaEm = faixas.data?.[0]?.calculada_em;

  return (
    <div>
      <Cabecalho titulo="Ranking e faixas" descricao="Pontuação dos parceiros comerciais assinados, faixas internas de atendimento e premiação anual." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Ranking */}
        <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Trophy className="h-5 w-5 text-menta-400" /> Ranking</h2>
            <div className="flex gap-2">
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-24" aria-label="Ano"><SelectValue /></SelectTrigger>
                <SelectContent>{anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-40" aria-label="Período"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANO_TODO}>Ano inteiro</SelectItem>
                  {[1, 2, 3, 4].map((t) => <SelectItem key={t} value={String(t)}>{t}º trimestre</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {ranking.isLoading && <Carregando />}
          {ranking.error && <ErroCarga erro={ranking.error} />}
          {ranking.isSuccess && ranking.data.length === 0 && <Vazio titulo="Nenhum parceiro comercial assinado no ranking" />}
          {ranking.isSuccess && ranking.data.length > 0 && (
            <ol className="divide-y divide-white/10">
              {ranking.data.map((r) => {
                const faixa = r.parceiro_id ? faixaDe.get(r.parceiro_id) : undefined;
                return (
                  <li key={`${r.posicao}-${r.parceiro_id}`} className="flex items-center gap-3 py-2 text-sm">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      r.posicao <= 3 && r.pontos > 0 ? "bg-menta-500/20 text-menta-300" : "bg-white/5 text-muted-foreground")}>
                      {r.posicao}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {r.parceiro_id ? <Link to={`/app/parceiros/${r.parceiro_id}`} className="hover:text-menta-400">{r.nome}</Link> : r.nome}
                    </span>
                    {faixa && periodo === ANO_TODO && ano === String(anoAtual) && <Pilula tom={TOM_FAIXA[faixa]}>{rotulo(FAIXAS, faixa)}</Pilula>}
                    <span className="w-16 shrink-0 text-right font-semibold">{r.pontos} pts</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="space-y-4">
          {/* Como pontua */}
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Medal className="h-5 w-5 text-menta-400" /> Como os parceiros pontuam</h2>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(EVENTOS_PONTOS).map(([k, nome]) => (
                <li key={k} className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">{nome}</span>
                  <span className="shrink-0 font-semibold">{pontos?.[k] ?? 0} {pontos?.[k] === 1 ? "ponto" : "pontos"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Só indicações no sentido parceiro para o grupo. Cada evento pontua uma única vez. Empate: mais clientes fechados, depois a assinatura
              mais antiga. Parceiros veem a própria posição e os 10 primeiros, nunca nível nem faixa.
            </p>
          </section>

          {/* Faixas */}
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <h2 className="mb-1 flex items-center gap-2 font-semibold"><Layers className="h-5 w-5 text-menta-400" /> Faixas internas</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Pela pontuação do ano: destaque são os 5% do topo e potencial os 15% seguintes (no mínimo 1 em cada, com ao menos 1 ponto).
              {calculadaEm ? ` Calculadas em ${dataHora(calculadaEm)}.` : ""}
            </p>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {Object.entries(FAIXAS).map(([k, nome]) => (
                <div key={k} className="rounded-[10px] bg-white/5 p-2 text-center">
                  <p className="text-xl font-bold">{contagem[k] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{nome}</p>
                </div>
              ))}
            </div>
            {faixas.isLoading && <Carregando />}
            {faixas.error && <ErroCarga erro={faixas.error} />}
            {faixas.isSuccess && faixas.data.length === 0 && (
              <p className="flex gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" /> As faixas ainda não foram calculadas pela rotina diária.</p>
            )}
            {faixas.isSuccess && faixas.data.length > 0 && (
              <ul className="divide-y divide-white/10 text-sm">
                {faixas.data.map((f) => (
                  <li key={f.parceiro_id} className="flex items-center gap-2 py-1.5">
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">{f.posicao ?? ""}º</span>
                    <Link to={`/app/parceiros/${f.parceiro_id}`} className="min-w-0 flex-1 truncate hover:text-menta-400">{f.parceiro?.nome_fantasia}</Link>
                    <Pilula tom={TOM_FAIXA[f.faixa]}>{rotulo(FAIXAS, f.faixa)}</Pilula>
                    <span className="w-14 shrink-0 text-right font-semibold">{f.pontos_ano} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="mt-4">
        <Premiacoes podeEditar={podeEditar} anoPadrao={anoAtual} />
      </div>
    </div>
  );
}
