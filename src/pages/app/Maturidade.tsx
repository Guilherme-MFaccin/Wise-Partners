import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Radar as IconeRadar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Barra, CLASSE_CARD } from "@/components/painel/Blocos";
import { Radar } from "@/components/gestao/Radar";
import { AcessoRestrito } from "@/components/gestao/Restrito";
import { ok } from "@/lib/erros";
import { data } from "@/lib/formato";
import { CATEGORIAS_MATURIDADE, ETAPAS_PERDA, EIXOS_MATURIDADE, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type Avaliacao = {
  id: string; parceiro_id: string; notas: Record<string, number>; media: number; categoria: string; created_at: string;
  parceiro: { id: string; nome_fantasia: string; tipo_parceria: string; data_assinatura: string | null; etapa: string } | null;
  autor: { nome: string } | null;
};
type ParceiroAssinado = { id: string; nome_fantasia: string };

const EIXOS = Object.entries(EIXOS_MATURIDADE).map(([chave, r]) => ({ chave, rotulo: r }));
const TODAS = "__todas";
const TOM_CATEGORIA: Record<string, "alerta" | "info" | "menta"> = { fundacao: "alerta", desenvolvimento: "info", escala: "menta" };
const COR_CATEGORIA: Record<string, string> = { fundacao: "bg-warning", desenvolvimento: "bg-sky-400", escala: "bg-menta-500" };
const PAPEIS = ["admin", "parcerias", "consultor"];

const ehAssinadoComercial = (p: Avaliacao["parceiro"]) =>
  !!p && p.tipo_parceria === "comercial" && !!p.data_assinatura && !ETAPAS_PERDA.includes(p.etapa);

// Visão do programa na matriz de maturidade (História 8, Apêndice J). Parceiro nunca vê; a RLS só libera interno.
export default function Maturidade() {
  const { perfil } = useAuth();
  if (!perfil || !PAPEIS.includes(perfil.papel)) {
    return <AcessoRestrito titulo="Maturidade" texto="A matriz de maturidade é visível para administradores, time de parcerias e consultores." />;
  }
  return <TelaMaturidade />;
}

function TelaMaturidade() {
  const [categoria, setCategoria] = useState(TODAS);
  const [eixo, setEixo] = useState(TODAS);
  const [notaMax, setNotaMax] = useState("2");
  const [soAssinados, setSoAssinados] = useState(true);

  const q = useQuery({
    queryKey: ["maturidade", "programa"],
    queryFn: async () =>
      (ok<any>(await supabase.from("avaliacoes_maturidade")
        .select("id, parceiro_id, notas, media, categoria, created_at, parceiro:parceiros(id, nome_fantasia, tipo_parceria, data_assinatura, etapa), autor:perfis!avaliacoes_maturidade_created_by_fkey(nome)")
        .order("created_at", { ascending: false })) ?? []) as unknown as Avaliacao[],
  });
  const assinados = useQuery({
    queryKey: ["maturidade", "assinados"],
    queryFn: async () =>
      (ok<any>(await supabase.from("parceiros").select("id, nome_fantasia, etapa").eq("tipo_parceria", "comercial")
        .not("data_assinatura", "is", null).order("nome_fantasia")) ?? [])
        .filter((p: any) => !ETAPAS_PERDA.includes(p.etapa)) as ParceiroAssinado[],
  });

  // Vale a avaliação mais recente de cada parceiro
  const ultimas = useMemo(() => {
    const vistos = new Set<string>();
    const r: Avaliacao[] = [];
    for (const a of q.data ?? []) {
      if (vistos.has(a.parceiro_id)) continue;
      vistos.add(a.parceiro_id);
      r.push(a);
    }
    return r;
  }, [q.data]);

  const base = useMemo(() => (soAssinados ? ultimas.filter((a) => ehAssinadoComercial(a.parceiro)) : ultimas), [ultimas, soAssinados]);

  const medias = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const e of EIXOS) {
      const notas = base.map((a) => Number(a.notas?.[e.chave])).filter((n) => Number.isFinite(n));
      m[e.chave] = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
    }
    return m;
  }, [base]);
  const mediaGeral = base.length ? base.reduce((s, a) => s + Number(a.media), 0) / base.length : null;

  const distribuicao = useMemo(() => {
    const d: Record<string, number> = { fundacao: 0, desenvolvimento: 0, escala: 0 };
    for (const a of base) d[a.categoria] = (d[a.categoria] ?? 0) + 1;
    return d;
  }, [base]);

  const filtradas = useMemo(() => base.filter((a) =>
    (categoria === TODAS || a.categoria === categoria)
    && (eixo === TODAS || Number(a.notas?.[eixo]) <= Number(notaMax))), [base, categoria, eixo, notaMax]);

  const avaliados = new Set(ultimas.map((a) => a.parceiro_id));
  const semAvaliacao = (assinados.data ?? []).filter((p) => !avaliados.has(p.id));

  return (
    <div>
      <Cabecalho titulo="Maturidade dos parceiros" descricao="Radar médio dos 8 eixos, distribuição por categoria e a avaliação mais recente de cada parceiro." />

      <label className="mb-4 flex items-center gap-2 text-sm">
        <Switch checked={soAssinados} onCheckedChange={setSoAssinados} />
        Só parceiros comerciais assinados
      </label>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}

      {q.isSuccess && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold"><IconeRadar className="h-5 w-5 text-menta-400" /> Radar médio</h2>
                <p className="text-sm text-muted-foreground">
                  {base.length} {base.length === 1 ? "parceiro avaliado" : "parceiros avaliados"}
                  {mediaGeral !== null && <> · média {mediaGeral.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</>}
                </p>
              </div>
              {base.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma avaliação de maturidade registrada ainda. Avalie pela ficha do parceiro, aba Maturidade.</p>
              ) : (
                <div className="flex justify-center">
                  <Radar eixos={EIXOS} series={[{ rotulo: "Média do programa", valores: medias as Record<string, number> }]} />
                </div>
              )}
            </section>

            <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
              <h2 className="mb-3 font-semibold">Distribuição por categoria</h2>
              <div className="space-y-3">
                {Object.entries(CATEGORIAS_MATURIDADE).map(([k, nome]) => (
                  <button key={k} type="button" onClick={() => setCategoria(categoria === k ? TODAS : k)}
                    className={cn("block w-full rounded-[10px] p-2 text-left text-sm hover:bg-white/5", categoria === k && "bg-white/5 ring-1 ring-menta-500/40")}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span>{nome}</span>
                      <span className="font-semibold">{distribuicao[k] ?? 0}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {base.length ? `(${Math.round(((distribuicao[k] ?? 0) / base.length) * 100)}%)` : ""}
                        </span>
                      </span>
                    </div>
                    <Barra valor={distribuicao[k] ?? 0} maximo={Math.max(1, base.length)} className="mt-1 h-2" cor={COR_CATEGORIA[k]} />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Fundação abaixo de 2,5; desenvolvimento de 2,5 a 3,9; escala a partir de 4,0.</p>
              {soAssinados && assinados.isSuccess && semAvaliacao.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assinados sem avaliação ({semAvaliacao.length})</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {semAvaliacao.map((p) => (
                      <li key={p.id}>
                        <Link to={`/app/parceiros/${p.id}?aba=maturidade`} className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">{p.nome_fantasia}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Filtros e lista */}
          <section>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas as categorias</SelectItem>
                  {Object.entries(CATEGORIAS_MATURIDADE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eixo} onValueChange={setEixo}>
                <SelectTrigger aria-label="Eixo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Qualquer nota nos eixos</SelectItem>
                  {EIXOS.map((e) => <SelectItem key={e.chave} value={e.chave}>{e.rotulo}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={notaMax} onValueChange={setNotaMax} disabled={eixo === TODAS}>
                <SelectTrigger aria-label="Nota máxima no eixo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>Nota até {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filtradas.length === 0 ? (
              <Vazio titulo="Nenhum parceiro no filtro" />
            ) : (
              <ul className="space-y-2">
                {filtradas.map((a) => (
                  <li key={a.id}>
                    <Link to={`/app/parceiros/${a.parceiro_id}?aba=maturidade`}
                      className={cn(CLASSE_CARD, "flex items-center gap-3 p-3 hover:border-menta-500/40")}>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{a.parceiro?.nome_fantasia ?? "Parceiro"}</span>
                          <Pilula tom={TOM_CATEGORIA[a.categoria] ?? "neutro"}>{rotulo(CATEGORIAS_MATURIDADE, a.categoria)}</Pilula>
                          <span className="text-sm font-semibold">{Number(a.media).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {EIXOS.map((e) => {
                            const n = Number(a.notas?.[e.chave]);
                            return (
                              <span key={e.chave} title={`${e.rotulo}: ${n}`}
                                className={cn("rounded-[6px] px-1.5 py-0.5 text-[11px]",
                                  eixo === e.chave ? "bg-menta-500/20 text-menta-300" : n <= 2 ? "bg-warning/15 text-warning" : "bg-white/5 text-muted-foreground")}>
                                {e.rotulo.split(" ")[0]} {n}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">Avaliado em {data(a.created_at)}{a.autor?.nome ? ` por ${a.autor.nome}` : ""}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
