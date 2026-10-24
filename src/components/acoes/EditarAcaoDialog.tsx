import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campo } from "@/components/parceiros/ui";
import { perfisInternos, usePerfis } from "@/components/parceiros/dados";
import { toastErro } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import type { AcaoConjunta } from "./dados";

const NINGUEM = "__ninguem";

// Data prevista e responsável de uma ação da Wise.
export function EditarAcaoDialog({ acao, onFechar }: { acao: AcaoConjunta | null; onFechar: () => void }) {
  const qc = useQueryClient();
  const { data: perfis = [] } = usePerfis();
  const internos = perfisInternos(perfis);
  const [data, setData] = useState("");
  const [resp, setResp] = useState(NINGUEM);

  useEffect(() => {
    if (acao) {
      setData(acao.data_prevista ?? "");
      setResp(acao.responsavel_id ?? NINGUEM);
    }
  }, [acao]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!acao) return;
      const mudanca: Record<string, any> = { data_prevista: data || null, responsavel_id: resp === NINGUEM ? null : resp };
      // Nova data no futuro tira a ação do estado "atrasada"
      if (acao.estado === "atrasada" && (!data || data >= hojeISO())) mudanca.estado = "planejada";
      const { error } = await supabase.from("acoes_wise").update(mudanca).eq("id", acao.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ação atualizada.");
      qc.invalidateQueries({ queryKey: ["acoes-conjuntas"] });
      onFechar();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!acao} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar ação da Wise</DialogTitle>
          <DialogDescription>{acao ? `${acao.nome} · ${acao.parceiro_nome}` : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Campo rotulo="Data prevista">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo rotulo="Responsável na Wise">
            <Select value={resp} onValueChange={setResp}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NINGUEM}>Sem responsável</SelectItem>
                {internos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
