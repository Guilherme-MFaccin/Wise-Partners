import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Linha da view v_fila_base_ativa
export type ItemFila = {
  ciclo_id: string;
  parceiro_id: string;
  nome_fantasia: string;
  data_assinatura: string | null;
  entrou_fila_em: string;
  previsao_inicio: string | null;
  estrategico: boolean;
  posicao: number;
};

// Posição na fila. O administrador decide quando iniciar o ciclo e pode informar a previsão de início.
export function FilaItem({ item }: { item: ItemFila }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [iniciarAberto, setIniciarAberto] = useState(false);
  const [inicio, setInicio] = useState(hojeISO());

  const atualizar = useMutation({
    mutationFn: async (alteracoes: Record<string, any>) => {
      const { error } = await supabase.from("ciclos_base_ativa").update(alteracoes).eq("id", item.ciclo_id);
      if (error) throw error;
      return alteracoes;
    },
    onSuccess: (alteracoes) => {
      toast.success(alteracoes.estado === "em_ciclo" ? "Ciclo iniciado com 6 encontros a cada 14 dias." : "Previsão de início salva.");
      qc.invalidateQueries({ queryKey: ["base-ativa"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      setIniciarAberto(false);
    },
    onError: toastErro,
  });

  return (
    <li className={cn(CLASSE_CARD, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center")}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-menta-500/15 text-lg font-bold text-menta-300">
        {item.posicao}º
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/app/parceiros/${item.parceiro_id}`} className="font-semibold hover:text-menta-400">{item.nome_fantasia}</Link>
          {item.estrategico && <Pilula tom="menta">Estratégico</Pilula>}
        </div>
        <p className="text-sm text-muted-foreground">
          Assinatura: {item.data_assinatura ? data(item.data_assinatura) : "não registrada"} · Na fila desde {data(item.entrou_fila_em)}
        </p>
        {!isAdmin && item.previsao_inicio && <p className="text-sm text-muted-foreground">Previsão de início: {data(item.previsao_inicio)}</p>}
      </div>
      {isAdmin && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Previsão de início</Label>
            <Input type="date" className="w-40" defaultValue={item.previsao_inicio ?? ""}
              onBlur={(e) => {
                const v = e.target.value || null;
                if (v !== item.previsao_inicio) atualizar.mutate({ previsao_inicio: v });
              }} />
          </div>
          <Button onClick={() => setIniciarAberto(true)}><PlayCircle /> Iniciar ciclo</Button>
        </div>
      )}

      <Dialog open={iniciarAberto} onOpenChange={setIniciarAberto}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[14px]">
          <DialogHeader>
            <DialogTitle>Iniciar ciclo do Base Ativa</DialogTitle>
            <DialogDescription>
              {item.nome_fantasia}: o ciclo de 12 semanas é criado com 6 encontros, um a cada 14 dias a partir da data de início, e termina com o evento final.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data do primeiro encontro</Label>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIniciarAberto(false)}>Cancelar</Button>
            <Button disabled={!inicio || atualizar.isPending} onClick={() => atualizar.mutate({ estado: "em_ciclo", inicio })}>
              {atualizar.isPending && <Loader2 className="animate-spin" />} Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
