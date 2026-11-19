import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { toastErro } from "@/lib/erros";
import { data } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Onboarding do Select por etapas (P-94), sem prazo em dias (princípio 9 do to-be). O banco diz o que já foi feito
// (etapas_onboarding); o parceiro marca as duas etapas que o portal não consegue ver (anúncio e envio do link).
export type Etapa = { ordem: number; chave: string; titulo: string; quem: "parceiro" | "cliente"; automatica: boolean; feita: boolean; feita_em: string | null };

const ACAO_PARCEIRO: Record<string, { to: string; texto: string }> = {
  minicurso: { to: "/parceiro/capacitacao", texto: "Fazer o minicurso" },
  anuncio: { to: "/parceiro/materiais", texto: "Ver o kit" },
  link_enviado: { to: "/parceiro/indicar", texto: "Pegar o link e a mensagem" },
  primeiro_cliente: { to: "/parceiro/indicar", texto: "Ver quem entrou pelo link" },
  primeiro_diagnostico: { to: "/parceiro/indicar", texto: "Ver quem entrou pelo link" },
};

export function useEtapasOnboarding(parceiroId: string | null | undefined) {
  return useQuery({
    queryKey: ["etapas-onboarding", parceiroId],
    enabled: !!parceiroId,
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("etapas_onboarding" as any, { p_parceiro: parceiroId });
      if (error) throw error;
      return (r ?? []) as Etapa[];
    },
  });
}

export function EtapasOnboarding({ parceiroId, area, podeMarcar }: { parceiroId: string; area: "parceiro" | "interno"; podeMarcar: boolean }) {
  const qc = useQueryClient();
  const q = useEtapasOnboarding(parceiroId);
  const marcar = useMutation({
    mutationFn: async ({ etapa, feita }: { etapa: string; feita: boolean }) => {
      const r = feita
        ? await supabase.from("marcas_onboarding" as any).insert({ parceiro_id: parceiroId, etapa })
        : await supabase.from("marcas_onboarding" as any).delete().eq("parceiro_id", parceiroId).eq("etapa", etapa);
      if (r.error) throw r.error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.feita ? "Etapa marcada." : "Marca desfeita.");
      qc.invalidateQueries({ queryKey: ["etapas-onboarding", parceiroId] });
      qc.invalidateQueries({ queryKey: ["tarefas"] });
    },
    onError: toastErro,
  });

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const etapas = q.data ?? [];
  const feitas = etapas.filter((e) => e.feita).length;
  const proxima = etapas.find((e) => !e.feita);
  const ativo = etapas.find((e) => e.chave === "primeiro_cliente")?.feita;

  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5" aria-labelledby={`etapas-${parceiroId}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`etapas-${parceiroId}`} className="font-semibold">Etapas do onboarding</h2>
        <span className="text-sm tabular-nums text-muted-foreground">{feitas} de {etapas.length}{ativo ? " · parceria ativa" : ""}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-menta-500 transition-[width]" style={{ width: `${etapas.length ? Math.round((feitas / etapas.length) * 100) : 0}%` }} />
      </div>
      <ol className="mt-4 space-y-0">
        {etapas.map((e, i) => {
          const acao = area === "parceiro" ? ACAO_PARCEIRO[e.chave] : undefined;
          const atual = proxima?.chave === e.chave;
          return (
            <li key={e.chave} className="relative flex gap-3 pb-5 last:pb-0">
              {i < etapas.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-px bg-white/10" aria-hidden />}
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                e.feita ? "bg-menta-500/15 text-menta-400" : atual ? "border border-menta-500/60 text-menta-400" : "bg-white/5 text-muted-foreground")}>
                {e.feita ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", e.feita && "text-muted-foreground")}>{e.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.feita ? `Feito em ${data(e.feita_em)}` : e.automatica ? "O portal marca sozinho quando acontecer." : "Você marca quando fizer."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!e.automatica && podeMarcar && (
                    <Button size="sm" variant={e.feita ? "ghost" : "default"} disabled={marcar.isPending}
                      onClick={() => marcar.mutate({ etapa: e.chave, feita: !e.feita })}>
                      {marcar.isPending && marcar.variables?.etapa === e.chave ? <Loader2 className="animate-spin" /> : e.feita ? null : <Check />}
                      {e.feita ? "Desfazer" : "Marcar como feito"}
                    </Button>
                  )}
                  {acao && !e.feita && atual && (
                    <Button asChild size="sm" variant="outline"><Link to={acao.to}>{acao.texto} <ArrowRight /></Link></Button>
                  )}
                </div>
              </div>
              {atual && <Pilula tom="menta" className="self-start">Agora</Pilula>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
