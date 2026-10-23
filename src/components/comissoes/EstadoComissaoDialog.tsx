import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toastErro } from "@/lib/erros";
import { moeda } from "@/lib/formato";
import { ESTADOS_COMISSAO, ESTADOS_COMISSAO_RECEBER, rotulo } from "@/lib/rotulos";
import type { Comissao } from "./dados";

// Mudança de estado pela função atualizar_estado_comissao (o banco valida o papel).
export function EstadoComissaoDialog({ comissao, estados, estadoInicial, onOpenChange }: {
  comissao: Comissao | null;
  estados: string[];
  estadoInicial?: string;
  onOpenChange: (aberto: boolean) => void;
}) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState("");
  const [observacao, setObservacao] = useState("");
  const mapa = comissao?.beneficiario === "grupo" ? ESTADOS_COMISSAO_RECEBER : ESTADOS_COMISSAO;

  useEffect(() => {
    if (comissao) {
      setEstado(estadoInicial ?? estados.find((e) => e !== comissao.estado) ?? "");
      setObservacao("");
    }
  }, [comissao, estadoInicial, estados]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("atualizar_estado_comissao", {
        p_id: comissao!.id, p_estado: estado, p_observacao: observacao.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comissão atualizada.");
      qc.invalidateQueries({ queryKey: ["comissoes"] });
      qc.invalidateQueries({ queryKey: ["comissoes-indicacao"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      onOpenChange(false);
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!comissao} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Atualizar comissão</DialogTitle>
          <DialogDescription>
            {comissao?.parceiro?.nome_fantasia} · {comissao?.indicacao?.cliente?.razao_social}
            {comissao?.valor != null ? ` · ${moeda(comissao.valor)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Novo estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e} value={e} disabled={e === comissao?.estado}>{rotulo(mapa, e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observação (opcional)</Label>
            <Textarea rows={2} value={observacao} placeholder="Ex.: número da nota fiscal" onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!estado || estado === comissao?.estado || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending && <Loader2 className="animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
