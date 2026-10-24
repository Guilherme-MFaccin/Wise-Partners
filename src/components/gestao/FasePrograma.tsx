import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, Flag, Loader2, MinusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { Pilula } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { FASES_PROGRAMA, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { numero } from "./formato";

// Retorno de sugerir_fase() (migração 0015)
export type Criterio = { nome: string; atual: number | null; meta: number | null; ok: boolean | null };
export type SugestaoFase = { fase: string; proxima: string | null; pronta: boolean; criterios: Criterio[] };

export function useSugestaoFase(habilitado = true) {
  return useQuery({
    queryKey: ["fase", "sugestao"],
    enabled: habilitado,
    queryFn: async () => ok<any>(await supabase.rpc("sugerir_fase")) as SugestaoFase,
  });
}

export function useDefinirFase() {
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  async function definir(fase: string) {
    if (!confirm(`Mudar a fase do programa para "${rotulo(FASES_PROGRAMA, fase)}"?`)) return false;
    setSalvando(true);
    try {
      const { error } = await supabase.rpc("definir_fase", { p_fase: fase });
      if (error) throw error;
      toast.success("Fase do programa atualizada.");
      qc.invalidateQueries({ queryKey: ["fase"] });
      qc.invalidateQueries({ queryKey: ["painel-v2"] });
      qc.invalidateQueries({ queryKey: ["resultado-canal"] });
      return true;
    } catch (e) {
      toastErro(e);
      return false;
    } finally {
      setSalvando(false);
    }
  }
  return { definir, salvando };
}

export function ListaCriterios({ criterios, apenasFaltantes = false }: { criterios: Criterio[]; apenasFaltantes?: boolean }) {
  const lista = apenasFaltantes ? criterios.filter((c) => c.ok !== true) : criterios;
  if (lista.length === 0) return <p className="text-sm text-muted-foreground">Nenhum critério pendente.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {lista.map((c) => {
        const Icone = c.ok === true ? CheckCircle2 : c.ok === false ? Circle : MinusCircle;
        return (
          <li key={c.nome} className="flex items-start gap-2">
            <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", c.ok === true ? "text-menta-400" : c.ok === false ? "text-warning" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1">
              {c.nome}
              {c.meta !== null && c.atual !== null && (
                <span className="text-muted-foreground"> · {numero(c.atual)} de {numero(c.meta)}</span>
              )}
              {c.atual === null && <span className="text-muted-foreground"> · conferência manual</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Fase do programa (Apêndice L) com os critérios da próxima fase. Só o administrador muda a fase.
export function CartaoFase({ fase, sugestao, className }: { fase: string | null | undefined; sugestao?: SugestaoFase | null; className?: string }) {
  const { isAdmin } = useAuth();
  const { definir, salvando } = useDefinirFase();
  const atual = fase ?? sugestao?.fase ?? "experimentacao";
  return (
    <section className={cn(CLASSE_CARD, "p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-menta-400" />
          <div>
            <p className="text-xs text-muted-foreground">Fase do programa</p>
            <p className="text-lg font-semibold leading-tight">{rotulo(FASES_PROGRAMA, atual)}</p>
          </div>
        </div>
        {sugestao?.pronta && sugestao.proxima && <Pilula tom="menta">Critérios para {rotulo(FASES_PROGRAMA, sugestao.proxima)} atingidos</Pilula>}
      </div>
      {sugestao?.proxima && sugestao.criterios?.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Para passar a {rotulo(FASES_PROGRAMA, sugestao.proxima)}
          </p>
          <ListaCriterios criterios={sugestao.criterios} />
          {isAdmin && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={sugestao.pronta ? "default" : "outline"} disabled={salvando} onClick={() => definir(sugestao.proxima!)}>
                {salvando && <Loader2 className="animate-spin" />} Mudar para {rotulo(FASES_PROGRAMA, sugestao.proxima)}
              </Button>
              {!sugestao.pronta && <span className="text-xs text-muted-foreground">A sugestão é do portal; a decisão é do administrador.</span>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
