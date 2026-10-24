import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { Barra, CLASSE_CARD } from "@/components/painel/Blocos";
import { moeda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { dias, horas, meses, numero, pct, roiPct, rotuloChave } from "./formato";

// Indicador do painel por etapa da jornada, como devolvido por painel_v2() (migração 0015).
export type IndicadorV2 = {
  chave: string;
  etapa: string;
  nome: string;
  formato: "numero" | "percentual" | "moeda" | "dias" | "lista" | "horas";
  destaque: boolean;
  valor: any;
  anterior: any;
  meta: number | null;
};

const LISTA_MOEDA = new Set(["custo_total_tipo", "receita_por_nivel"]);
const LISTA_HORAS = new Set(["horas_parceiro_etapa"]);

function vazio(v: any) {
  return v === null || v === undefined || v === "";
}

// Valor simples formatado conforme o formato do catálogo
export function formatarIndicador(ind: Pick<IndicadorV2, "chave" | "formato">, v: any): string {
  if (vazio(v)) return "Sem dados";
  if (typeof v === "object") return "";
  switch (ind.formato) {
    case "percentual": return ind.chave === "roi" ? roiPct(v) : pct(v);
    case "moeda": return moeda(v);
    case "dias": return dias(v);
    case "horas": return horas(v);
    default: return ind.chave === "tempo_retorno" ? meses(v) : numero(v);
  }
}

function formatarItemLista(chave: string, v: any): string {
  if (vazio(v)) return "sem dados";
  if (typeof v === "object") {
    // Conversão por origem: {cadastrados, assinados}
    if ("cadastrados" in v && "assinados" in v) return `${numero(v.assinados)} de ${numero(v.cadastrados)} assinados`;
    return Object.entries(v).map(([k, x]) => `${rotuloChave(k)}: ${vazio(x) ? "sem dados" : numero(x as number)}`).join(" · ");
  }
  if (LISTA_MOEDA.has(chave)) return moeda(v);
  if (LISTA_HORAS.has(chave)) return horas(v);
  if (chave === "ciclo_venda") return dias(v);
  return numero(v);
}

// Lista chave e valor (indicadores do formato "lista")
export function ListaValores({ chave, valor }: { chave: string; valor: Record<string, any> | null }) {
  const itens = Object.entries(valor ?? {});
  if (itens.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>;
  return (
    <dl className="space-y-1 text-sm">
      {itens.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 truncate text-muted-foreground">{rotuloChave(k)}</dt>
          <dd className="shrink-0 text-right font-semibold">{formatarItemLista(chave, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Comparacao({ ind }: { ind: IndicadorV2 }) {
  const atual = Number(ind.valor);
  const ant = ind.anterior;
  if (vazio(ind.valor) || typeof ind.valor === "object") return null;
  if (vazio(ant) || typeof ant === "object") {
    return <p className="text-xs text-muted-foreground">Sem dados no período anterior</p>;
  }
  const diff = atual - Number(ant);
  const Icone = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : ArrowRight;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icone className={cn("h-3.5 w-3.5 shrink-0", diff > 0 ? "text-menta-400" : diff < 0 ? "text-warning" : "")} />
      Período anterior: {formatarIndicador(ind, ant)}
    </p>
  );
}

function Meta({ ind }: { ind: IndicadorV2 }) {
  if (vazio(ind.meta)) return null;
  const meta = Number(ind.meta);
  const atual = typeof ind.valor === "number" ? ind.valor : Number(ind.valor);
  const metaTexto = formatarIndicador(ind, meta);
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs text-muted-foreground">Meta: <span className="font-semibold text-foreground">{metaTexto}</span></p>
      {Number.isFinite(atual) && meta > 0 && <Barra valor={atual} maximo={meta} className="h-1.5" />}
    </div>
  );
}

// Cartão de um indicador, com valor, comparação com o período anterior e meta
export function CartaoIndicador({ ind }: { ind: IndicadorV2 }) {
  let corpo: ReactNode;
  let rodape: ReactNode = (
    <>
      <Comparacao ind={ind} />
      <Meta ind={ind} />
    </>
  );

  if (ind.chave === "assinados_meta" && ind.valor && typeof ind.valor === "object") {
    const v = Number(ind.valor.valor ?? 0);
    const m = Number(ind.meta ?? ind.valor.meta ?? 0);
    corpo = <p className="text-2xl font-bold">{numero(v)} <span className="text-sm font-normal text-muted-foreground">de {numero(m)}</span></p>;
    rodape = m > 0 ? (
      <div className="mt-2 space-y-1">
        <Barra valor={v} maximo={m} className="h-1.5" />
        <p className="text-xs text-muted-foreground">Faltam {numero(Math.max(0, m - v))} parceiros assinados.</p>
      </div>
    ) : null;
  } else if (ind.chave === "nps" && ind.valor && typeof ind.valor === "object") {
    const r = Number(ind.valor.respostas ?? 0);
    corpo = <p className="text-2xl font-bold">{r > 0 && !vazio(ind.valor.nps) ? numero(ind.valor.nps) : "Sem respostas"}</p>;
    rodape = (
      <>
        <p className="text-xs text-muted-foreground">
          {r} {r === 1 ? "resposta" : "respostas"}{!vazio(ind.valor.media) ? ` · nota média ${numero(ind.valor.media)}` : ""}
        </p>
        <Meta ind={{ ...ind, valor: ind.valor.nps }} />
      </>
    );
  } else if (ind.chave === "ciclo_venda" && ind.valor && typeof ind.valor === "object") {
    corpo = <p className="text-2xl font-bold">{vazio(ind.valor.parceiro) ? "Sem dados" : dias(ind.valor.parceiro)}</p>;
    rodape = (
      <p className="text-xs text-muted-foreground">
        Venda direta: {vazio(ind.valor.direta) ? "não informado (Configurações, Parâmetros)" : dias(ind.valor.direta)}
      </p>
    );
  } else if (ind.valor && typeof ind.valor === "object") {
    corpo = <ListaValores chave={ind.chave} valor={ind.valor} />;
    rodape = <Meta ind={{ ...ind, valor: null }} />;
  } else {
    corpo = <p className={cn("text-2xl font-bold", vazio(ind.valor) && "text-base font-semibold text-muted-foreground")}>{formatarIndicador(ind, ind.valor)}</p>;
  }

  return (
    <div className={cn(CLASSE_CARD, "flex min-w-0 flex-col gap-1 p-4", ind.destaque && "border-menta-500/25")}>
      <p className="flex items-start gap-1.5 text-xs font-medium text-muted-foreground">
        {ind.destaque && <Star className="mt-px h-3.5 w-3.5 shrink-0 fill-menta-500/30 text-menta-400" aria-label="Destaque" />}
        <span>{ind.nome}</span>
      </p>
      <div className="min-w-0">{corpo}</div>
      {rodape && <div className="mt-auto pt-1">{rodape}</div>}
    </div>
  );
}
