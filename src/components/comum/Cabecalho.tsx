import type { ReactNode } from "react";

export function Cabecalho({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold leading-[1.1] tracking-[-0.024em] sm:text-[2.125rem]">{titulo}</h1>
        {descricao && <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-relaxed text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
