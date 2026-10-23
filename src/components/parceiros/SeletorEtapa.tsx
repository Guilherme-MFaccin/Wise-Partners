import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toastErro } from "@/lib/erros";
import { cn } from "@/lib/utils";
import { invalidarParceiro, useEtapas } from "./dados";

// Troca de etapa do funil. As regras (aprovação do Diretor para fechamento, contrato
// assinado para onboarding) ficam no banco; aqui só confirmamos as perdas.
export function SeletorEtapa({
  parceiro, className,
}: { parceiro: { id: string; etapa: string; nome_fantasia: string; motivo_perda?: string | null }; className?: string }) {
  const qc = useQueryClient();
  const { data: etapas = [] } = useEtapas();
  const [perda, setPerda] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [salvando, setSalvando] = useState(false);

  const funil = etapas.filter((e) => !e.perda);
  const perdas = etapas.filter((e) => e.perda);

  async function salvar(etapa: string, motivo?: string) {
    setSalvando(true);
    const campos: Record<string, any> = { etapa };
    if (motivo !== undefined) campos.motivo_perda = motivo.trim() || null;
    const { error } = await supabase.from("parceiros").update(campos).eq("id", parceiro.id);
    setSalvando(false);
    if (error) {
      toastErro(error);
      return false;
    }
    toast.success(`${parceiro.nome_fantasia}: etapa atualizada.`);
    invalidarParceiro(qc, parceiro.id);
    return true;
  }

  function escolher(etapa: string) {
    if (etapa === parceiro.etapa) return;
    if (perdas.some((p) => p.codigo === etapa)) {
      setDetalhe(parceiro.motivo_perda ?? "");
      setPerda(etapa);
      return;
    }
    salvar(etapa);
  }

  const nomePerda = perdas.find((p) => p.codigo === perda)?.nome ?? "";

  return (
    <>
      <Select value={parceiro.etapa} onValueChange={escolher} disabled={salvando}>
        <SelectTrigger className={cn("h-9 rounded-full", className)} aria-label="Etapa do funil">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Funil</SelectLabel>
            {funil.map((e) => <SelectItem key={e.codigo} value={e.codigo}>{e.nome}</SelectItem>)}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Perdas</SelectLabel>
            {perdas.map((e) => <SelectItem key={e.codigo} value={e.codigo}>{e.nome}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>

      <AlertDialog open={!!perda} onOpenChange={(v) => !v && setPerda(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar perda: {nomePerda}</AlertDialogTitle>
            <AlertDialogDescription>
              {parceiro.nome_fantasia} sai do funil ativo. O registro fica no histórico e pode ser revertido depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="detalhe-perda" className="text-xs">Detalhe (opcional)</Label>
            <Textarea id="detalhe-perda" rows={3} value={detalhe} onChange={(e) => setDetalhe(e.target.value)}
              placeholder="Ex.: decidiu seguir só com o programa próprio" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={async (ev) => {
                ev.preventDefault();
                if (perda && (await salvar(perda, detalhe))) setPerda(null);
              }}
            >
              Confirmar perda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
