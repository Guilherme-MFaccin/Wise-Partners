import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { toastErro } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import { CATEGORIAS_CUSTO } from "@/lib/rotulos";
import type { AcaoConjunta } from "./dados";

type Form = {
  data: string; comprovacao_link: string; alcance: string; inscritos: string; observacao: string;
  custo: string; categoria_custo: string; descricao_custo: string;
};

const numero = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")));

// Conclusão de uma ação da Wise. Com link de comprovação, a ação fica "comprovada"; sem link, "feita".
// O custo direto só aparece para administradores (o banco também só aceita deles).
export function ConcluirAcaoDialog({ acao, onFechar }: { acao: AcaoConjunta | null; onFechar: () => void }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>({
    data: hojeISO(), comprovacao_link: "", alcance: "", inscritos: "", observacao: "", custo: "", categoria_custo: "evento", descricao_custo: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (acao) {
      setF({
        data: hojeISO(), comprovacao_link: acao.comprovacao_link ?? "", alcance: acao.resultado?.alcance?.toString() ?? "",
        inscritos: acao.resultado?.inscritos?.toString() ?? "", observacao: acao.observacao ?? "", custo: "", categoria_custo: "evento",
        descricao_custo: "",
      });
    }
  }, [acao]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!acao) return;
      const alcance = numero(f.alcance);
      const inscritos = numero(f.inscritos);
      const custo = numero(f.custo);
      if ([alcance, inscritos, custo].some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
        throw new Error("Use números válidos em alcance, inscritos e custo.");
      }
      const resultado = { ...(acao.resultado ?? {}) };
      if (alcance !== null) resultado.alcance = alcance;
      if (inscritos !== null) resultado.inscritos = inscritos;
      const p: Record<string, any> = { data: f.data || hojeISO(), resultado };
      // Também enviados soltos, como descrito na API
      if (alcance !== null) p.alcance = alcance;
      if (inscritos !== null) p.inscritos = inscritos;
      if (f.comprovacao_link.trim()) p.comprovacao_link = f.comprovacao_link.trim();
      if (f.observacao.trim()) p.observacao = f.observacao.trim();
      if (isAdmin && custo) {
        p.custo = custo;
        p.categoria_custo = f.categoria_custo;
        if (f.descricao_custo.trim()) p.descricao_custo = f.descricao_custo.trim();
      }
      const { error } = await supabase.rpc("concluir_acao_wise", { p_id: acao.id, p });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(f.comprovacao_link.trim() ? "Ação comprovada." : "Ação registrada como feita.");
      qc.invalidateQueries({ queryKey: ["acoes-conjuntas"] });
      qc.invalidateQueries({ queryKey: ["parceiro"] });
      onFechar();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!acao} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Concluir ação da Wise</DialogTitle>
          <DialogDescription>
            {acao ? `${acao.nome} · ${acao.parceiro_nome}` : ""}
            {acao?.comprovacao_esperada ? `. Comprovação esperada: ${acao.comprovacao_esperada}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Data da realização" obrigatorio>
              <Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} max={hojeISO()} />
            </Campo>
            <Campo rotulo="Link da comprovação" dica="Com link, a ação fica comprovada.">
              <Input type="url" inputMode="url" placeholder="https://" value={f.comprovacao_link} onChange={(e) => set("comprovacao_link", e.target.value)} />
            </Campo>
            <Campo rotulo="Alcance">
              <Input inputMode="numeric" value={f.alcance} onChange={(e) => set("alcance", e.target.value)} />
            </Campo>
            <Campo rotulo="Inscritos">
              <Input inputMode="numeric" value={f.inscritos} onChange={(e) => set("inscritos", e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Observação">
            <Textarea rows={3} value={f.observacao} onChange={(e) => set("observacao", e.target.value)} />
          </Campo>
          {isAdmin && (
            <div className="space-y-3 rounded-[10px] border border-white/10 p-3">
              <p className="text-xs text-muted-foreground">Custo direto (opcional): entra na planilha de custos ligado ao parceiro e à ação.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Valor (R$)">
                  <Input inputMode="decimal" value={f.custo} onChange={(e) => set("custo", e.target.value)} />
                </Campo>
                <Campo rotulo="Categoria">
                  <Select value={f.categoria_custo} onValueChange={(v) => set("categoria_custo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIAS_CUSTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
              <Campo rotulo="Descrição do custo">
                <Input placeholder={acao?.nome ?? ""} value={f.descricao_custo} onChange={(e) => set("descricao_custo", e.target.value)} />
              </Campo>
            </div>
          )}
          {acao && ["quinzenal", "mensal", "bimestral", "trimestral"].includes(acao.periodicidade ?? "") && (
            <p className="text-xs text-muted-foreground">Ação periódica: a próxima ocorrência é agendada automaticamente.</p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={salvar.isPending || !f.data}>
              {salvar.isPending && <Loader2 className="animate-spin" />} Concluir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
