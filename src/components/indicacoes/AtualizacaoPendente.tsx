import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toastErro } from "@/lib/erros";
import { data, dataHora, moeda } from "@/lib/formato";
import { ETAPAS_INDICACAO, rotulo } from "@/lib/rotulos";
import { rotuloValorBase, type Indicacao } from "./dados";

// Confirma ou descarta a atualização que o parceiro fez numa indicação recebida.
export function useConfirmarAtualizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, aceitar }: { id: string; aceitar: boolean }) => {
      const { error } = await supabase.rpc("confirmar_atualizacao_indicacao", { p_id: id, p_aceitar: aceitar });
      if (error) throw error;
      return aceitar;
    },
    onSuccess: (aceitar) => {
      toast.success(aceitar ? "Atualização confirmada." : "Atualização descartada.");
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      qc.invalidateQueries({ queryKey: ["pendencias"] });
      qc.invalidateQueries({ queryKey: ["comissoes"] });
      qc.invalidateQueries({ queryKey: ["comissoes-indicacao"] });
    },
    onError: toastErro,
  });
}

export function AtualizacaoPendente({ indicacao, podeConfirmar }: {
  indicacao: Pick<Indicacao, "id" | "atualizacao_pendente" | "atualizacao_em" | "empresa" | "autor_atualizacao">;
  podeConfirmar: boolean;
}) {
  const confirmar = useConfirmarAtualizacao();
  const u = indicacao.atualizacao_pendente;
  if (!u) return null;
  return (
    <div className="rounded-[14px] border border-warning/50 bg-warning/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-warning">
        <RefreshCw className="h-4 w-4" /> Atualização do parceiro aguardando confirmação
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {indicacao.autor_atualizacao?.nome ? `${indicacao.autor_atualizacao.nome} em ` : "Enviada em "}
        {dataHora(indicacao.atualizacao_em)}
      </p>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        {u.etapa && <Linha rotulo="Etapa" valor={rotulo(ETAPAS_INDICACAO, u.etapa)} />}
        {u.data_reuniao && <Linha rotulo="Data da reunião" valor={data(u.data_reuniao)} />}
        {u.valor_base !== undefined && u.valor_base !== null && <Linha rotulo={rotuloValorBase(indicacao.empresa)} valor={moeda(u.valor_base)} />}
        {u.observacao && <div className="sm:col-span-2"><Linha rotulo="Observação" valor={u.observacao} /></div>}
      </dl>
      {podeConfirmar && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={confirmar.isPending} onClick={() => confirmar.mutate({ id: indicacao.id, aceitar: true })}>
            <Check /> Confirmar
          </Button>
          <Button size="sm" variant="outline" disabled={confirmar.isPending} onClick={() => confirmar.mutate({ id: indicacao.id, aceitar: false })}>
            <X /> Descartar
          </Button>
        </div>
      )}
    </div>
  );
}

function Linha({ rotulo: r, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="inline text-muted-foreground">{r}: </dt>
      <dd className="inline break-words">{valor}</dd>
    </div>
  );
}
