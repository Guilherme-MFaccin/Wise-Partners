import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, CalendarClock, Flag, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SeloEstado } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { ESTADOS_BASE_ATIVA } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { EncontroLinha, type Encontro } from "./EncontroLinha";

export type Ciclo = {
  id: string;
  parceiro_id: string;
  estado: "fila" | "em_ciclo" | "concluido" | "suspenso";
  entrou_fila_em: string;
  previsao_inicio: string | null;
  inicio: string | null;
  evento_data: string | null;
  evento_descricao: string | null;
  concluido_em: string | null;
  certificado_responsavel: string | null;
  certificado_em: string | null;
  revisao_em: string | null;
  parceiro: { id: string; nome_fantasia: string } | null;
  encontros: Encontro[];
};

// Ciclo em andamento, suspenso ou concluído, com os 6 encontros e o evento final.
export function CicloCard({ ciclo }: { ciclo: Ciclo }) {
  const { isAdmin, isParcerias } = useAuth();
  const qc = useQueryClient();
  const [eventoAberto, setEventoAberto] = useState(false);
  const encontros = [...(ciclo.encontros ?? [])].sort((a, b) => a.numero - b.numero);
  const realizados = encontros.filter((e) => e.realizado === true).length;

  // Retomar ciclo suspenso: o gatilho do banco só permite a administradores voltar para "em ciclo".
  const retomar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ciclos_base_ativa").update({ estado: "em_ciclo" }).eq("id", ciclo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ciclo retomado.");
      qc.invalidateQueries({ queryKey: ["base-ativa"] });
    },
    onError: toastErro,
  });

  return (
    <li className={cn(CLASSE_CARD, "p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/app/parceiros/${ciclo.parceiro_id}`} className="font-semibold hover:text-menta-400">{ciclo.parceiro?.nome_fantasia}</Link>
          <p className="text-sm text-muted-foreground">
            {ciclo.inicio ? `Início em ${data(ciclo.inicio)}` : "Sem data de início"} · {realizados} de 6 encontros realizados
          </p>
        </div>
        <SeloEstado estado={ciclo.estado} mapa={ESTADOS_BASE_ATIVA} />
      </div>

      {ciclo.estado === "suspenso" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-warning/40 bg-warning/10 p-3 text-sm">
          <span>Ciclo suspenso após dois encontros seguidos não realizados por indisponibilidade do parceiro.</span>
          {isAdmin && (
            <Button size="sm" variant="outline" disabled={retomar.isPending} onClick={() => retomar.mutate()}>
              {retomar.isPending ? <Loader2 className="animate-spin" /> : <PlayCircle />} Retomar
            </Button>
          )}
        </div>
      )}

      {encontros.length > 0 && (
        <ul className="mt-3 space-y-2">
          {encontros.map((e) => <EncontroLinha key={e.id} e={e} editavel={isParcerias && ciclo.estado !== "concluido"} />)}
        </ul>
      )}

      {ciclo.estado === "concluido" ? (
        <dl className="mt-3 grid gap-3 rounded-[8px] border border-menta-500/30 bg-menta-500/5 p-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Evento final</dt><dd>{data(ciclo.evento_data)}{ciclo.evento_descricao ? ` · ${ciclo.evento_descricao}` : ""}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Concluído em</dt><dd>{data(ciclo.concluido_em)}</dd></div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground"><Award className="h-3.5 w-3.5" /> Certificado metodológico</dt>
            <dd>{ciclo.certificado_responsavel ?? "Responsável do parceiro não cadastrado"}{ciclo.certificado_em ? `, em ${data(ciclo.certificado_em)}` : ""}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Revisão agendada</dt>
            <dd>{data(ciclo.revisao_em)}</dd>
          </div>
        </dl>
      ) : ciclo.estado === "em_ciclo" && isParcerias && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={() => setEventoAberto(true)}><Flag /> Registrar evento final</Button>
        </div>
      )}

      <EventoFinalDialog ciclo={ciclo} aberto={eventoAberto} onOpenChange={setEventoAberto} />
    </li>
  );
}

function EventoFinalDialog({ ciclo, aberto, onOpenChange }: { ciclo: Ciclo; aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [dataEvento, setDataEvento] = useState(hojeISO());
  const [descricao, setDescricao] = useState("");
  const salvar = useMutation({
    mutationFn: async () => {
      // O banco conclui o ciclo, registra o certificado e agenda a revisão em 6 meses
      const { error } = await supabase.from("ciclos_base_ativa")
        .update({ evento_data: dataEvento, evento_descricao: descricao.trim() || null })
        .eq("id", ciclo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento final registrado. Ciclo concluído.");
      qc.invalidateQueries({ queryKey: ["base-ativa"] });
      onOpenChange(false);
    },
    onError: toastErro,
  });
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Registrar evento final</DialogTitle>
          <DialogDescription>
            {ciclo.parceiro?.nome_fantasia}: ao salvar, o ciclo é concluído, o certificado metodológico do responsável é registrado e a revisão fica agendada para 6 meses.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data do evento</Label>
            <Input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea rows={3} value={descricao} placeholder="Evento com a base, com a Wise integrada" onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!dataEvento || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending && <Loader2 className="animate-spin" />} Concluir ciclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
