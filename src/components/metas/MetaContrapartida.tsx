import { numero } from "@/components/gestao/formato";
import { data } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { BarraMeta } from "./BlocoMetas";

// Campos da meta estruturada de uma contrapartida (migração 0022). meta_progresso e meta_prazo são colunas calculadas.
export type MetaDaContrapartida = {
  meta: string | null;
  periodicidade: string;
  meta_quantidade: number | null;
  meta_unidade: string | null;
  meta_prazo_dias: number | null;
  meta_modo: "contagem" | "valor";
  meta_progresso: number | null;
  meta_prazo: string | null;
};
export const CAMPOS_META_CONTRAPARTIDA = "meta, meta_quantidade, meta_unidade, meta_prazo_dias, meta_modo, meta_progresso, meta_prazo";

const PERIODICAS = new Set(["quinzenal", "mensal", "bimestral", "trimestral"]);

// "7 de 10 usuários ativos, até 12/01/2027" com barra; sem meta estruturada mostra só o texto combinado
export function MetaContrapartida({ c, className }: { c: MetaDaContrapartida; className?: string }) {
  if (c.meta_quantidade === null || c.meta_quantidade === undefined) {
    return c.meta ? <p className={cn("text-sm", className)}>Meta: {c.meta}</p> : null;
  }
  const feito = Number(c.meta_progresso ?? 0);
  const alvo = Number(c.meta_quantidade);
  const unidade = c.meta_unidade ?? "";
  const janela = PERIODICAS.has(c.periodicidade) && c.meta_prazo_dias ? `nos últimos ${c.meta_prazo_dias} dias` : null;
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm tabular-nums">
        <span className="font-semibold">{numero(feito)} de {numero(alvo)}</span> {unidade}
        <span className="text-muted-foreground">
          {janela ? ` ${janela}` : c.meta_prazo ? `, até ${data(c.meta_prazo)}` : ""}
          {feito >= alvo ? ". Meta atingida." : ""}
        </span>
      </p>
      <BarraMeta valor={feito} meta={alvo} className="max-w-sm" />
      {c.meta && <p className="text-xs text-muted-foreground">{c.meta}</p>}
      {c.meta_modo === "valor" && <p className="text-xs text-muted-foreground">Vale o número informado na última comprovação validada.</p>}
    </div>
  );
}
