import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { ETAPAS_INDICACAO } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type IndicacaoRecebida = { id: string; etapa: string; valor_base: number | null; data_reuniao: string | null; cliente: { razao_social: string } | null };

// Parceiro atualiza o resultado de uma indicação recebida; fica pendente até a Wise confirmar.
export function AtualizarIndicacaoDialog({ indicacao, onClose }: { indicacao: IndicacaoRecebida | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [etapa, setEtapa] = useState("nova");
  const [valor, setValor] = useState("");
  const [dataReuniao, setDataReuniao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!indicacao) return;
    setEtapa(indicacao.etapa);
    setValor(indicacao.valor_base?.toString() ?? "");
    setDataReuniao(indicacao.data_reuniao ?? "");
    setObservacao("");
  }, [indicacao]);

  async function salvar() {
    setSalvando(true);
    try {
      const { error } = await supabase.rpc("parceiro_atualizar_indicacao", {
        p_id: indicacao!.id,
        p: { etapa, valor_base: valor === "" ? null : Number(valor), data_reuniao: dataReuniao || null, observacao: observacao.trim() || null },
      });
      if (error) throw error;
      toast.success("Atualização enviada. Ela vale depois da confirmação da Wise.");
      qc.invalidateQueries({ queryKey: ["portal-indicacoes"] });
      onClose();
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={!!indicacao} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar resultado</DialogTitle>
          <DialogDescription>{indicacao?.cliente?.razao_social}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ETAPAS_INDICACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor do negócio (R$)</Label>
              <Input id="valor" type="number" inputMode="decimal" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reuniao">Data da reunião</Label>
              <Input id="reuniao" type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação</Label>
            <Textarea id="obs" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Enviar atualização</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
