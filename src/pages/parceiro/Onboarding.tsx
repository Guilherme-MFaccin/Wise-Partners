import { PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import { EtapasOnboarding, useEtapasOnboarding } from "@/components/portal/EtapasOnboarding";

// Primeiros passos do parceiro (P-94): seis etapas, sem prazo em dias. A parceria fica ativa no primeiro cliente
// cadastrado pelo link (P-30) e o onboarding termina no primeiro diagnóstico feito na base do parceiro.
export default function Onboarding() {
  const { perfil } = useAuth();
  const pid = perfil?.parceiro_id ?? null;
  const q = useEtapasOnboarding(pid);
  if (!pid) return (<div><Cabecalho titulo="Primeiros passos" /><Vazio titulo="Sem empresa vinculada">Este acesso não está ligado a uma empresa parceira.</Vazio></div>);
  const etapas = q.data ?? [];
  const concluido = etapas.length > 0 && etapas.every((e) => e.feita);
  return (
    <div className="space-y-6">
      <Cabecalho titulo="Primeiros passos" descricao="O que falta para a sua parceria ficar ativa? A parceria ativa no primeiro cliente que se cadastra pelo seu link, sem prazo." />
      {concluido && (
        <div className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" aria-hidden />
          <p>Primeiros passos concluídos: o primeiro cliente da sua base já fez o diagnóstico. Agora é manter o link circulando.</p>
        </div>
      )}
      <EtapasOnboarding parceiroId={pid} area="parceiro" podeMarcar />
    </div>
  );
}
