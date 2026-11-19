import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { casaAba, localizar, type Aba } from "@/lib/navegacao";
import { cn } from "@/lib/utils";

type Secao<A extends Aba> = { id: string; rotulo: string; icone: LucideIcon; abas: A[] };

// Só as seções com ao menos uma aba visível, e só as abas visíveis
export function filtrarSecoes<A extends Aba, S extends Secao<A>>(secoes: S[], visivel: (a: A) => boolean): S[] {
  return secoes.map((s) => ({ ...s, abas: s.abas.filter(visivel) })).filter((s) => s.abas.length > 0);
}

// Menu lateral: uma linha por seção. A seção ativa é a que contém a página atual.
export function MenuSecoes<A extends Aba>({ secoes, onNavegar, extra }: {
  secoes: Secao<A>[]; onNavegar?: () => void; extra?: (s: Secao<A>) => ReactNode;
}) {
  const { pathname } = useLocation();
  const atual = localizar(secoes, pathname);
  return (
    <nav aria-label="Seções" className="flex flex-col gap-0.5">
      {secoes.map((s, i) => {
        const ativa = atual?.secao === i;
        return (
          <Link key={s.id} to={s.abas[0].to} onClick={onNavegar} aria-current={ativa ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-neutro-300 transition-colors hover:bg-white/5 hover:text-white",
              ativa && "bg-menta-500/10 text-menta-400 hover:bg-menta-500/10 hover:text-menta-400",
            )}>
            <s.icone className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.rotulo}</span>
            {extra?.(s)}
          </Link>
        );
      })}
    </nav>
  );
}

// Abas da seção atual, no topo do conteúdo. Some quando a seção tem uma aba só.
export function BarraAbas<A extends Aba>({ secoes, rotuloExtra }: { secoes: Secao<A>[]; rotuloExtra?: (a: A) => ReactNode }) {
  const { pathname } = useLocation();
  const atual = localizar(secoes, pathname);
  const ativaRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => { ativaRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [pathname]);
  if (!atual) return null;
  const secao = secoes[atual.secao];
  if (secao.abas.length < 2) return null;
  return (
    <div className="-mx-4 mb-6 border-b border-white/10 px-4 sm:-mx-6 sm:px-6">
      <nav aria-label={secao.rotulo} className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {secao.abas.map((a) => {
          const ativa = a.to === atual.aba.to && casaAba(a, pathname) > 0;
          return (
            <Link key={a.to} to={a.to} ref={ativa ? ativaRef : undefined} aria-current={ativa ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-neutro-300 transition-colors hover:text-white",
                ativa && "border-menta-500 text-white",
              )}>
              {a.rotulo}
              {rotuloExtra?.(a)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
