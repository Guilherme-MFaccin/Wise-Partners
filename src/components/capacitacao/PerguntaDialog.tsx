import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { toastErro } from "@/lib/erros";
import { semTravessao } from "@/lib/formato";
import type { Pergunta } from "./dados";

// Pergunta de múltipla escolha; a resposta correta vai para o gabarito, que só administradores leem.
export function PerguntaDialog({ aberto, trilhaId, pergunta, correta, proximaOrdem, onFechar }: {
  aberto: boolean; trilhaId: string; pergunta: Pergunta | null; correta: number | undefined; proximaOrdem: number; onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [enunciado, setEnunciado] = useState("");
  const [ordem, setOrdem] = useState("1");
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);
  const [certa, setCerta] = useState<number | null>(null);

  useEffect(() => {
    if (aberto) {
      setEnunciado(pergunta?.enunciado ?? "");
      setOrdem(String(pergunta?.ordem ?? proximaOrdem));
      setOpcoes(pergunta?.opcoes?.length ? [...pergunta.opcoes] : ["", "", "", ""]);
      setCerta(correta ?? null);
    }
  }, [aberto, pergunta, correta, proximaOrdem]);

  const salvar = useMutation({
    mutationFn: async () => {
      // Opções vazias são descartadas; o índice da correta é recalculado
      const limpas = opcoes.map((o, i) => ({ o: semTravessao(o.trim()), i })).filter((x) => x.o);
      if (limpas.length < 2) throw new Error("Informe ao menos duas opções.");
      const idx = limpas.findIndex((x) => x.i === certa);
      if (idx < 0) throw new Error("Marque a opção correta.");
      const dados = { trilha_id: trilhaId, enunciado: semTravessao(enunciado.trim()), ordem: Number(ordem) || 0, opcoes: limpas.map((x) => x.o) };
      let id = pergunta?.id;
      if (pergunta) {
        const { error } = await supabase.from("trilha_perguntas").update(dados).eq("id", pergunta.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("trilha_perguntas").insert(dados).select("id").single();
        if (error) throw error;
        id = data.id as string;
      }
      const g = await supabase.from("trilha_gabarito").upsert({ pergunta_id: id, correta: idx }, { onConflict: "pergunta_id" });
      if (g.error) throw g.error;
    },
    onSuccess: () => {
      toast.success(pergunta ? "Pergunta atualizada." : "Pergunta criada.");
      qc.invalidateQueries({ queryKey: ["capacitacao", "perguntas", trilhaId] });
      qc.invalidateQueries({ queryKey: ["capacitacao", "gabarito"] });
      onFechar();
    },
    onError: toastErro,
  });

  function remover(i: number) {
    setOpcoes((x) => x.filter((_, k) => k !== i));
    setCerta((c) => (c === null || c === i ? null : c > i ? c - 1 : c));
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{pergunta ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
          <DialogDescription>Marque a opção correta. O gabarito nunca é mostrado a quem faz o teste.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (enunciado.trim()) salvar.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
            <Campo rotulo="Ordem">
              <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
            </Campo>
            <Campo rotulo="Enunciado" obrigatorio>
              <Textarea rows={3} value={enunciado} onChange={(e) => setEnunciado(e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Opções (marque a correta)">
            <RadioGroup value={certa === null ? "" : String(certa)} onValueChange={(v) => setCerta(Number(v))} className="gap-2">
              {opcoes.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <RadioGroupItem value={String(i)} id={`op-${i}`} aria-label={`Opção ${i + 1} correta`} />
                  <Input value={o} placeholder={`Opção ${i + 1}`}
                    onChange={(e) => setOpcoes((x) => x.map((y, k) => (k === i ? e.target.value : y)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover opção" disabled={opcoes.length <= 2} onClick={() => remover(i)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </RadioGroup>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOpcoes((x) => [...x, ""])} disabled={opcoes.length >= 8}>
              <Plus /> Opção
            </Button>
          </Campo>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={!enunciado.trim() || salvar.isPending}>
              {salvar.isPending && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
