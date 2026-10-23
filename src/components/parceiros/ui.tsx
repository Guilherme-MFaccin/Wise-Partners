import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Peças visuais pequenas usadas nas telas de parceiros.

export function Secao({
  titulo, descricao, acoes, children, className,
}: { titulo?: ReactNode; descricao?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5", className)}>
      {(titulo || acoes) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {titulo && <h2 className="text-base font-semibold">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// Rótulo + controle de formulário
export function Campo({
  rotulo, children, dica, className, obrigatorio,
}: { rotulo: ReactNode; children: ReactNode; dica?: ReactNode; className?: string; obrigatorio?: boolean }) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-neutro-300">
        {rotulo}
        {obrigatorio && <span className="text-menta-400"> *</span>}
      </Label>
      {children}
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
    </div>
  );
}

// Par rótulo e valor somente leitura
export function Info({ rotulo, children, className }: { rotulo: ReactNode; children: ReactNode; className?: string }) {
  const vazio = children === null || children === undefined || children === "" || children === false;
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-semibold text-neutro-300">{rotulo}</p>
      <div className="mt-0.5 break-words text-sm">{vazio ? <span className="text-muted-foreground">Não informado</span> : children}</div>
    </div>
  );
}

// Indicador numérico simples
export function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-white/10 bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-xl font-bold">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}
