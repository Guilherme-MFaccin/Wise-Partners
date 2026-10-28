import { Link } from "react-router-dom";
import { Settings2, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { formatarIndicador } from "@/components/gestao/Indicadores";
import { rotuloTrimestre } from "@/components/gestao/dados";
import { numero } from "@/components/gestao/formato";
import { cn } from "@/lib/utils";
import { fracaoDoTrimestre, ROTULO_SITUACAO, situacaoMeta, valorDoItem, type ItemMeta, type MetasTrimestre } from "./dados";

// Barra de progresso da meta com a marca do ritmo esperado até hoje (só para o que soma no período)
export function BarraMeta({ valor, meta, ritmo, className }: { valor: number; meta: number; ritmo?: number | null; className?: string }) {
  const pct = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;
  const pctRitmo = ritmo !== null && ritmo !== undefined ? Math.min(100, ritmo * 100) : null;
  return (
    <div className={cn("relative h-2 w-full rounded-full bg-white/10", className)}>
      <div className="h-full rounded-full bg-menta-500 transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      {pctRitmo !== null && (
        <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-neutro-100/70" style={{ left: `calc(${pctRitmo}% - 1px)` }}
          title="Ritmo esperado até hoje" aria-hidden="true" />
      )}
    </div>
  );
}

function textoValor(item: ItemMeta, v: number | null) {
  if (v === null) return "Sem dados";
  return formatarIndicador({ chave: item.chave, formato: item.formato }, v);
}

function CartaoMeta({ item, fracao, destaque = false }: { item: ItemMeta; fracao: number; destaque?: boolean }) {
  const real = valorDoItem(item.chave, item.realizado);
  const meta = item.meta === null ? null : Number(item.meta);
  const sit = situacaoMeta(item, real, meta, fracao);
  const rot = ROTULO_SITUACAO[sit];
  return (
    <div className={cn("min-w-0 rounded-[10px] bg-white/5 p-3", destaque && "p-4")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("min-w-0 text-xs text-muted-foreground", destaque && "text-sm")}>{item.nome}</p>
        <Pilula tom={rot.tom} className="shrink-0">{rot.texto}</Pilula>
      </div>
      <p className={cn("mt-1 font-bold tabular-nums", destaque ? "font-display text-5xl leading-none" : "text-xl")}>
        {textoValor(item, real)}
        {meta !== null && (
          <span className={cn("font-sans font-normal text-muted-foreground", destaque ? "ml-2 text-base" : "text-sm")}> de {textoValor(item, meta)}</span>
        )}
      </p>
      {meta !== null && meta > 0 && real !== null && (
        <BarraMeta valor={real} meta={meta} ritmo={item.somavel ? fracao : null} className="mt-3" />
      )}
      {item.acumulado !== null && item.acumulado !== undefined && (
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">Desde o início do programa: {numero(item.acumulado)}</p>
      )}
      {/* O ano só se compara quando os quatro trimestres têm meta; antes disso a soma não cobre o realizado do ano */}
      {item.somavel && item.meta_ano !== null && item.meta_ano !== undefined && item.trimestres_com_meta === 4 && (
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          No ano: {textoValor(item, valorDoItem(item.chave, item.realizado_ano))} de {textoValor(item, Number(item.meta_ano))}
        </p>
      )}
    </div>
  );
}

// Metas do programa no trimestre (Painel). O número principal vem primeiro e maior.
export function BlocoMetas({ dados, className }: { dados: MetasTrimestre; className?: string }) {
  const { isAdmin } = useAuth();
  const fracao = fracaoDoTrimestre(dados);
  const comMeta = dados.itens.filter((i) => i.meta !== null);
  const principal = comMeta.find((i) => i.principal);
  const demais = comMeta.filter((i) => i !== principal);
  const semMeta = dados.itens.filter((i) => i.meta === null);

  return (
    <section className={cn(CLASSE_CARD, "min-w-0 p-4 sm:p-5", className)} aria-labelledby="t-metas-tri">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="t-metas-tri" className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-menta-400" /> Metas do {rotuloTrimestre(dados.trimestre)}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            Dia {dados.dias_passados} de {dados.dias_total}. A marca na barra é o ritmo esperado até hoje.
          </p>
        </div>
        <Link to="/app/configuracoes?aba=metas" className="inline-flex items-center gap-1 text-sm text-menta-400 hover:underline">
          <Settings2 className="h-4 w-4" /> {isAdmin ? "Editar metas" : "Ver metas"}
        </Link>
      </div>

      {comMeta.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-white/15 p-4 text-sm">
          <p className="font-medium">Nenhuma meta cadastrada para este trimestre.</p>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Defina a meta principal e as de apoio em Configurações, Metas." : "Um administrador define as metas em Configurações, Metas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {principal && <CartaoMeta item={principal} fracao={fracao} destaque />}
          {demais.length > 0 && (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
              {demais.map((i) => <CartaoMeta key={i.chave} item={i} fracao={fracao} />)}
            </div>
          )}
        </div>
      )}

      {comMeta.length > 0 && semMeta.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">Sem meta neste trimestre: {semMeta.map((i) => i.nome).join(", ")}.</p>
      )}
    </section>
  );
}
