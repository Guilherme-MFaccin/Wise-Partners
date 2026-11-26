import { Monitor, Moon, Sun } from "lucide-react";
import { definirPreferencia, usePreferenciaTema, type Preferencia } from "@/lib/tema";
import { cn } from "@/lib/utils";

const OPCOES: { id: Preferencia; rotulo: string; icone: typeof Sun }[] = [
  { id: "sistema", rotulo: "Automático", icone: Monitor },
  { id: "claro", rotulo: "Claro", icone: Sun },
  { id: "escuro", rotulo: "Escuro", icone: Moon },
];

// Controle segmentado (padrão da Apple): três escolhas lado a lado, a ativa em destaque
export function SeletorAparencia({ className }: { className?: string }) {
  const atual = usePreferenciaTema();
  return (
    <div role="radiogroup" aria-label="Aparência" className={cn("inline-grid grid-cols-3 gap-1 rounded-[12px] bg-white/[0.06] p-1", className)}>
      {OPCOES.map((o) => {
        const ativo = atual === o.id;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={ativo} onClick={() => definirPreferencia(o.id)}
            className={cn(
              "pressionavel flex min-h-10 items-center justify-center gap-1.5 rounded-[9px] px-3 text-sm font-medium text-neutro-300 transition-colors hover:text-white",
              ativo && "bg-card text-white sombra-cartao dark:bg-white/[0.12]",
            )}>
            <o.icone className="hidden h-4 w-4 sm:block" aria-hidden />
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
