import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { CATEGORIAS_MATURIDADE, EIXOS_MATURIDADE, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Secao } from "../ui";
import { nomePerfil, usePerfis } from "../dados";

type Avaliacao = {
  id: string; notas: Record<string, number>; sugestoes: Record<string, { nota: number; motivo: string }> | null;
  media: number | string | null; categoria: string | null; created_by: string | null; created_at: string;
};
type Sugestoes = Record<string, { nota: number; motivo: string }>;

const EIXOS = Object.keys(EIXOS_MATURIDADE);
const CURTOS: Record<string, string> = {
  objetivo: "Objetivo", modelo: "Modelo", aderencia: "Aderência", capacitacao: "Capacitação",
  mercado: "Mercado", programa: "Programa", relacionamento: "Relacionamento", resultado: "Resultado",
};
const rotuloCurto = (e: string) => CURTOS[e] ?? EIXOS_MATURIDADE[e] ?? e;
const TOM_CATEGORIA: Record<string, "alerta" | "info" | "menta"> = { fundacao: "alerta", desenvolvimento: "info", escala: "menta" };

// Matriz de maturidade (História 8, Apêndice J): 8 eixos de 1 a 5, média e categoria calculadas no banco.
export function AbaMaturidade({ parceiroId }: { parceiroId: string }) {
  const { isParcerias } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const [nova, setNova] = useState(false);
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "maturidade"],
    queryFn: async () => ok(await supabase.from("avaliacoes_maturidade").select("*").eq("parceiro_id", parceiroId)
      .order("created_at", { ascending: false })) as Avaliacao[],
  });

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const lista = q.data ?? [];
  const atual = lista[0];
  const anterior = lista[1];

  return (
    <div className="space-y-4">
      {isParcerias && !nova && (
        <div className="flex justify-end"><Button onClick={() => setNova(true)}><Plus /> Nova avaliação</Button></div>
      )}
      {nova && <NovaAvaliacao parceiroId={parceiroId} atual={atual} onFechar={() => setNova(false)} />}

      {!atual ? (
        !nova && <Vazio titulo="Nenhuma avaliação de maturidade.">O portal sugere a nota de cada eixo a partir dos dados que já tem.</Vazio>
      ) : (
        <Secao titulo="Avaliação mais recente"
          descricao={`${dataHora(atual.created_at)}${nomePerfil(perfis, atual.created_by) ? ` · ${nomePerfil(perfis, atual.created_by)}` : ""}`}
          acoes={atual.categoria && <Pilula tom={TOM_CATEGORIA[atual.categoria] ?? "neutro"}>{rotulo(CATEGORIAS_MATURIDADE, atual.categoria)}</Pilula>}>
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="mx-auto w-full max-w-[420px]">
              <Radar notas={atual.notas} anteriores={anterior?.notas} />
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-menta-400" /> Atual</span>
                {anterior && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-neutro-300" /> Anterior ({dataHora(anterior.created_at).slice(0, 10)})</span>}
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-3 text-sm">
                Média <strong className="text-lg">{Number(atual.media ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                <span className="text-muted-foreground"> · fundação abaixo de 2,5; desenvolvimento de 2,5 a 3,9; escala a partir de 4,0</span>
              </p>
              <ul className="space-y-2 text-sm">
                {EIXOS.map((e) => (
                  <li key={e} className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span>{EIXOS_MATURIDADE[e]}</span>
                      <span className="font-semibold">{atual.notas?.[e] ?? ""}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-menta-400" style={{ width: `${((Number(atual.notas?.[e]) || 0) / 5) * 100}%` }} />
                    </div>
                    {atual.sugestoes?.[e] && Number(atual.sugestoes[e].nota) !== Number(atual.notas?.[e]) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Sugerido {atual.sugestoes[e].nota}: {atual.sugestoes[e].motivo}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Secao>
      )}

      {lista.length > 1 && (
        <Secao titulo="Histórico">
          <ul className="space-y-2 text-sm">
            {lista.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-white/10 p-3">
                <span>{dataHora(a.created_at)}{nomePerfil(perfis, a.created_by) ? ` · ${nomePerfil(perfis, a.created_by)}` : ""}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">Média {Number(a.media ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  {a.categoria && <Pilula tom={TOM_CATEGORIA[a.categoria] ?? "neutro"}>{rotulo(CATEGORIAS_MATURIDADE, a.categoria)}</Pilula>}
                </span>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  );
}

// Radar dos 8 eixos em SVG puro (sem biblioteca de gráficos)
export function Radar({ notas, anteriores }: { notas: Record<string, number>; anteriores?: Record<string, number> | null }) {
  const tam = 320;
  const c = tam / 2;
  const r = 105;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / EIXOS.length;
  const ponto = (i: number, v: number) => [c + Math.cos(ang(i)) * (r * v) / 5, c + Math.sin(ang(i)) * (r * v) / 5];
  const poligono = (n: Record<string, number>) => EIXOS.map((e, i) => ponto(i, Math.max(0, Math.min(5, Number(n?.[e]) || 0))).join(",")).join(" ");

  return (
    <svg viewBox={`-80 -10 ${tam + 160} ${tam + 20}`} className="h-auto w-full" role="img"
      aria-label={`Radar de maturidade: ${EIXOS.map((e) => `${EIXOS_MATURIDADE[e]} ${notas?.[e] ?? "sem nota"}`).join(", ")}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <polygon key={n} points={EIXOS.map((_, i) => ponto(i, n).join(",")).join(" ")}
          fill="none" stroke="currentColor" className="text-white/10" strokeWidth={1} />
      ))}
      {EIXOS.map((_, i) => {
        const [x, y] = ponto(i, 5);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="currentColor" className="text-white/10" strokeWidth={1} />;
      })}
      {anteriores && (
        <polygon points={poligono(anteriores)} fill="none" stroke="currentColor" strokeDasharray="4 3" strokeWidth={1.5} className="text-neutro-300" />
      )}
      <polygon points={poligono(notas)} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={2} className="text-menta-400" />
      {EIXOS.map((e, i) => {
        const [x, y] = ponto(i, Number(notas?.[e]) || 0);
        return <circle key={e} cx={x} cy={y} r={3} fill="currentColor" className="text-menta-400" />;
      })}
      {EIXOS.map((e, i) => {
        const [x, y] = ponto(i, 6.1);
        const cos = Math.cos(ang(i));
        const ancora = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text key={e} x={x} y={y} textAnchor={ancora} dominantBaseline="middle" fontSize={11} fill="currentColor" className="text-neutro-300">
            {rotuloCurto(e)} {notas?.[e] ?? ""}
          </text>
        );
      })}
    </svg>
  );
}

function NovaAvaliacao({ parceiroId, atual, onFechar }: { parceiroId: string; atual?: Avaliacao; onFechar: () => void }) {
  const qc = useQueryClient();
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const sug = useQuery({
    queryKey: ["parceiro", parceiroId, "maturidade-sugestao"],
    staleTime: 0,
    queryFn: async () => ok(await supabase.rpc("sugerir_maturidade", { p_parceiro: parceiroId })) as Sugestoes,
  });
  const sugestoes = sug.data ?? {};
  // Sem escolha da pessoa, vale a sugestão (ou a nota anterior, se não houver sugestão)
  const valor = (e: string) => notas[e] ?? (sugestoes[e]?.nota != null ? Number(sugestoes[e].nota) : atual?.notas?.[e] != null ? Number(atual.notas[e]) : undefined);
  const completas = EIXOS.every((e) => valor(e) !== undefined);
  const media = completas ? EIXOS.reduce((s, e) => s + (valor(e) ?? 0), 0) / EIXOS.length : null;

  async function salvar() {
    if (!completas) return toast.error("Informe a nota de 1 a 5 em todos os 8 eixos.");
    setSalvando(true);
    const final = Object.fromEntries(EIXOS.map((e) => [e, valor(e)]));
    const { error } = await supabase.from("avaliacoes_maturidade").insert({ parceiro_id: parceiroId, notas: final, sugestoes });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Avaliação de maturidade salva.");
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId, "maturidade"] });
    onFechar();
  }

  return (
    <Secao titulo="Nova avaliação" descricao="Notas de 1 a 5 por eixo. A sugestão vem dos dados do portal; confirme ou ajuste.">
      {sug.isLoading ? <Carregando texto="Calculando sugestões..." /> : (
        <>
          {sug.error && <ErroCarga erro={sug.error} />}
          <ul className="space-y-3">
            {EIXOS.map((e) => {
              const s = sugestoes[e];
              const v = valor(e);
              return (
                <li key={e} className="min-w-0 rounded-[10px] border border-white/10 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{EIXOS_MATURIDADE[e]}</p>
                      {s && (
                        <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-menta-400" /> Sugerido {s.nota}: {s.motivo}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={EIXOS_MATURIDADE[e]}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={v === n}
                          onClick={() => setNotas((x) => ({ ...x, [e]: n }))}
                          className={cn("h-9 w-9 rounded-full border text-sm font-semibold transition-colors",
                            v === n ? "border-menta-500 bg-menta-500/20 text-menta-200" : "border-white/15 text-neutro-300 hover:border-menta-500/60")}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {media !== null ? <>Média prevista <strong className="text-foreground">{media.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</strong></> : "Preencha os 8 eixos."}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onFechar}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !completas}>
                {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar avaliação
              </Button>
            </div>
          </div>
        </>
      )}
    </Secao>
  );
}
