import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Peças visuais do painel, reaproveitadas nas telas de indicações, comissões e Base Ativa.
export const CLASSE_CARD = "rounded-[14px] border border-white/10 bg-card";

type Tom = "neutro" | "alerta" | "perigo" | "menta";
const COR_TOM: Record<Tom, string> = {
  neutro: "text-neutro-300",
  alerta: "text-warning",
  perigo: "text-red-300",
  menta: "text-menta-400",
};

export function Bloco({
  titulo, icone: Icone, contagem, tom = "neutro", link, descricao, children, className,
}: {
  titulo: string;
  icone?: any;
  contagem?: number | string;
  tom?: Tom;
  link?: string;
  descricao?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const numero = contagem !== undefined && (
    <span className={cn("text-2xl font-bold leading-none", contagem === 0 ? "text-muted-foreground" : COR_TOM[tom])}>{contagem}</span>
  );
  return (
    <section className={cn(CLASSE_CARD, "flex min-w-0 flex-col p-4", className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icone && <Icone className={cn("h-4 w-4 shrink-0", COR_TOM[tom])} />}
          <h2 className="text-sm font-semibold leading-tight">{titulo}</h2>
        </div>
        {numero && (link ? <Link to={link} className="shrink-0 hover:opacity-80" aria-label={`Abrir ${titulo}`}>{numero}</Link> : numero)}
      </header>
      {descricao && <p className="-mt-1 mb-3 text-xs text-muted-foreground">{descricao}</p>}
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export type ItemParceiro = { chave: string; parceiroId: string; nome: string; detalhe?: ReactNode; aviso?: ReactNode };

// Lista de parceiros com link para a ficha de cada um.
export function ListaParceiros({ itens, max = 6, vazio = "Nada por aqui.", linkMais }: {
  itens: ItemParceiro[];
  max?: number;
  vazio?: string;
  linkMais?: string;
}) {
  if (!itens.length) return <p className="text-sm text-muted-foreground">{vazio}</p>;
  const visiveis = itens.slice(0, max);
  const resto = itens.length - visiveis.length;
  return (
    <ul className="space-y-1">
      {visiveis.map((i) => (
        <li key={i.chave}>
          <Link to={`/app/parceiros/${i.parceiroId}`}
            className="flex items-center justify-between gap-2 rounded-[8px] px-2 py-1.5 text-sm hover:bg-white/5">
            <span className="min-w-0">
              <span className="block truncate font-medium">{i.nome}</span>
              {i.detalhe && <span className="block truncate text-xs text-muted-foreground">{i.detalhe}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {i.aviso}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </span>
          </Link>
        </li>
      ))}
      {resto > 0 && (
        <li className="px-2 pt-1 text-xs text-muted-foreground">
          {linkMais ? <Link to={linkMais} className="hover:text-menta-400">e mais {resto}</Link> : `e mais ${resto}`}
        </li>
      )}
    </ul>
  );
}

export function Barra({ valor, maximo, className, cor = "bg-menta-500" }: { valor: number; maximo: number; className?: string; cor?: string }) {
  const pct = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className={cn("h-full rounded-full", cor)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Número com rótulo, para os totais do topo das telas.
export function Indicador({ rotulo, valor, detalhe, link }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; link?: string }) {
  const corpo = (
    <>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-1 break-words text-xl font-bold">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
    </>
  );
  return link ? (
    <Link to={link} className={cn(CLASSE_CARD, "block min-w-0 p-4 hover:border-menta-500/40")}>{corpo}</Link>
  ) : (
    <div className={cn(CLASSE_CARD, "min-w-0 p-4")}>{corpo}</div>
  );
}
