import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastErro } from "@/lib/erros";
import { data } from "@/lib/formato";

export type Encontro = {
  id: string;
  ciclo_id: string;
  numero: number;
  data: string | null;
  realizado: boolean | null;
  motivo_nao_realizado: "indisponibilidade_parceiro" | "indisponibilidade_wise" | "outro" | null;
  observacao: string | null;
};

export const MOTIVOS_NAO_REALIZADO: Record<string, string> = {
  indisponibilidade_parceiro: "Indisponibilidade do parceiro",
  indisponibilidade_wise: "Indisponibilidade da Wise",
  outro: "Outro",
};

type Situacao = "pendente" | "realizado" | "nao_realizado";
const situacaoDe = (e: Encontro): Situacao => (e.realizado === true ? "realizado" : e.realizado === false ? "nao_realizado" : "pendente");

// Um encontro do ciclo. Parcerias edita; o banco suspende o ciclo após 2 seguidos não realizados por indisponibilidade do parceiro.
export function EncontroLinha({ e, editavel }: { e: Encontro; editavel: boolean }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ data: e.data ?? "", situacao: situacaoDe(e), motivo: e.motivo_nao_realizado ?? "", observacao: e.observacao ?? "" });
  useEffect(() => {
    setF({ data: e.data ?? "", situacao: situacaoDe(e), motivo: e.motivo_nao_realizado ?? "", observacao: e.observacao ?? "" });
  }, [e]);

  const alterado = f.data !== (e.data ?? "") || f.situacao !== situacaoDe(e)
    || (f.situacao === "nao_realizado" && f.motivo !== (e.motivo_nao_realizado ?? "")) || f.observacao !== (e.observacao ?? "");
  const valido = f.situacao !== "nao_realizado" || !!f.motivo;

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("base_ativa_encontros").update({
        data: f.data || null,
        realizado: f.situacao === "pendente" ? null : f.situacao === "realizado",
        motivo_nao_realizado: f.situacao === "nao_realizado" ? f.motivo : null,
        observacao: f.observacao.trim() || null,
      }).eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Encontro ${e.numero} atualizado.`);
      qc.invalidateQueries({ queryKey: ["base-ativa"] });
    },
    onError: toastErro,
  });

  if (!editavel) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-white/10 p-3 text-sm">
        <span className="font-medium">Encontro {e.numero} · {e.data ? data(e.data) : "sem data"}</span>
        <SituacaoSelo e={e} />
        {e.observacao && <p className="w-full text-xs text-muted-foreground">{e.observacao}</p>}
      </li>
    );
  }

  return (
    <li className="space-y-2 rounded-[8px] border border-white/10 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Encontro {e.numero}</span>
        <SituacaoSelo e={e} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[10rem_12rem_1fr]">
        <Input type="date" aria-label="Data" value={f.data} onChange={(ev) => setF({ ...f, data: ev.target.value })} />
        <Select value={f.situacao} onValueChange={(v) => setF({ ...f, situacao: v as Situacao })}>
          <SelectTrigger aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Previsto</SelectItem>
            <SelectItem value="realizado">Realizado</SelectItem>
            <SelectItem value="nao_realizado">Não realizado</SelectItem>
          </SelectContent>
        </Select>
        {f.situacao === "nao_realizado" ? (
          <Select value={f.motivo} onValueChange={(v) => setF({ ...f, motivo: v })}>
            <SelectTrigger aria-label="Motivo"><SelectValue placeholder="Motivo" /></SelectTrigger>
            <SelectContent>
              {Object.entries(MOTIVOS_NAO_REALIZADO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : <span className="hidden sm:block" />}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Observação" value={f.observacao} onChange={(ev) => setF({ ...f, observacao: ev.target.value })} />
        <Button size="icon" variant={alterado ? "default" : "outline"} aria-label="Salvar encontro"
          disabled={!alterado || !valido || salvar.isPending} onClick={() => salvar.mutate()}>
          {salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
      </div>
    </li>
  );
}

function SituacaoSelo({ e }: { e: Encontro }) {
  if (e.realizado === true) return <Pilula tom="menta">Realizado</Pilula>;
  if (e.realizado === false) {
    return <Pilula tom={e.motivo_nao_realizado === "indisponibilidade_parceiro" ? "perigo" : "alerta"}>
      Não realizado{e.motivo_nao_realizado ? `: ${MOTIVOS_NAO_REALIZADO[e.motivo_nao_realizado].toLowerCase()}` : ""}
    </Pilula>;
  }
  return <Pilula>Previsto</Pilula>;
}
