import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {texto}
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-white/15 p-8 text-center">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

// `aoTentar`: mostra o botão "Tentar de novo"
export function ErroCarga({ erro, aoTentar }: { erro: any; aoTentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-destructive/40 bg-destructive/10 p-4 text-sm text-red-200">
      <span className="min-w-0">Não foi possível carregar: {erro?.message ?? String(erro)}</span>
      {aoTentar && (
        <button type="button" onClick={aoTentar}
          className="rounded-[10px] border border-white/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Tentar de novo
        </button>
      )}
    </div>
  );
}
