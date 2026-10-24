import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { toastErro } from "@/lib/erros";
import { semTravessao } from "@/lib/formato";
import type { Trilha } from "./dados";

const TODAS = "__todas";

// Criação e edição de trilha (só administradores; o banco confere).
export function TrilhaDialog({ aberto, trilha, onFechar, onCriada }: {
  aberto: boolean; trilha: Trilha | null; onFechar: () => void; onCriada?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nota, setNota] = useState("70");
  const [empresa, setEmpresa] = useState(TODAS);
  const [ordem, setOrdem] = useState("0");

  useEffect(() => {
    if (aberto) {
      setTitulo(trilha?.titulo ?? "");
      setDescricao(trilha?.descricao ?? "");
      setNota(String(trilha?.nota_minima ?? 70));
      setEmpresa(trilha?.empresa_grupo_id ?? TODAS);
      setOrdem(String(trilha?.ordem ?? 0));
    }
  }, [aberto, trilha]);

  const salvar = useMutation({
    mutationFn: async () => {
      const n = Number(nota);
      if (!Number.isInteger(n) || n < 0 || n > 100) throw new Error("A nota mínima vai de 0 a 100.");
      const dados = {
        titulo: semTravessao(titulo.trim()), descricao: semTravessao(descricao.trim()) || null, nota_minima: n,
        empresa_grupo_id: empresa === TODAS ? null : empresa, ordem: Number(ordem) || 0,
      };
      if (trilha) {
        const { error } = await supabase.from("trilhas").update(dados).eq("id", trilha.id);
        if (error) throw error;
        return trilha.id;
      }
      const { data, error } = await supabase.from("trilhas").insert(dados).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success(trilha ? "Trilha atualizada." : "Trilha criada como rascunho.");
      qc.invalidateQueries({ queryKey: ["capacitacao", "trilhas"] });
      onFechar();
      if (!trilha) onCriada?.(id);
    },
    onError: toastErro,
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{trilha ? "Editar trilha" : "Nova trilha"}</DialogTitle>
          <DialogDescription>As trilhas ficam só no portal, nunca no Wise Hub.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (titulo.trim()) salvar.mutate();
          }}
        >
          <Campo rotulo="Título" obrigatorio>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </Campo>
          <Campo rotulo="Descrição">
            <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Nota mínima (%)">
              <Input type="number" min={0} max={100} value={nota} onChange={(e) => setNota(e.target.value)} />
            </Campo>
            <Campo rotulo="Ordem">
              <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
            </Campo>
            <Campo rotulo="Empresa do grupo">
              <Select value={empresa} onValueChange={setEmpresa}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={!titulo.trim() || salvar.isPending}>
              {salvar.isPending && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
