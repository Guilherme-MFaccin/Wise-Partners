import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { useCategorias, usePacotes } from "@/components/parceiros/dados";
import { toastErro } from "@/lib/erros";
import { semTravessao } from "@/lib/formato";
import { TIPOS_PARCERIA } from "@/lib/rotulos";
import { TIPOS_COMUNICADO, nomeNivelRecorte, type Comunicado, type Recorte } from "./dados";

type Form = { titulo: string; corpo: string; tipo: string; niveis: string[]; pacotes: string[]; categorias: string[]; tipos: string[] };

function inicial(c: Comunicado | null): Form {
  const r: Recorte = c?.recorte ?? {};
  return {
    titulo: c?.titulo ?? "", corpo: c?.corpo ?? "", tipo: c?.tipo ?? "outro",
    niveis: r.niveis ?? [], pacotes: r.pacotes ?? [], categorias: r.categorias ?? [], tipos: r.tipos ?? [],
  };
}

// Criação e edição de rascunho. Recorte vazio em todos os grupos = todos os parceiros assinados.
export function ComunicadoDialog({ aberto, comunicado, onFechar }: { aberto: boolean; comunicado: Comunicado | null; onFechar: () => void }) {
  const qc = useQueryClient();
  const { data: pacotes = [] } = usePacotes();
  const { data: categorias = [] } = useCategorias();
  const [f, setF] = useState<Form>(() => inicial(comunicado));

  useEffect(() => {
    if (aberto) setF(inicial(comunicado));
  }, [aberto, comunicado]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const alternar = (k: "niveis" | "pacotes" | "categorias" | "tipos", v: string, marcado: boolean) =>
    setF((x) => ({ ...x, [k]: marcado ? [...x[k], v] : x[k].filter((y) => y !== v) }));

  const salvar = useMutation({
    mutationFn: async () => {
      const recorte: Recorte = {};
      if (f.niveis.length) recorte.niveis = f.niveis;
      if (f.pacotes.length) recorte.pacotes = f.pacotes;
      if (f.categorias.length) recorte.categorias = f.categorias;
      if (f.tipos.length) recorte.tipos = f.tipos;
      const dados = { titulo: semTravessao(f.titulo.trim()), corpo: semTravessao(f.corpo.trim()), tipo: f.tipo, recorte };
      const r = comunicado
        ? await supabase.from("comunicados").update(dados).eq("id", comunicado.id)
        : await supabase.from("comunicados").insert(dados);
      if (r.error) throw r.error;
    },
    onSuccess: () => {
      toast.success(comunicado ? "Rascunho atualizado." : "Rascunho criado.");
      qc.invalidateQueries({ queryKey: ["comunicados"] });
      onFechar();
    },
    onError: toastErro,
  });

  const valido = f.titulo.trim() && f.corpo.trim();
  const ativas = categorias.filter((c) => c.ativa || f.categorias.includes(c.id));

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{comunicado ? "Editar rascunho" : "Novo comunicado"}</DialogTitle>
          <DialogDescription>Enviado por e-mail e no portal às pessoas ativas dos parceiros assinados no recorte.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) salvar.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Campo rotulo="Título" obrigatorio>
              <Input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} maxLength={200} />
            </Campo>
            <Campo rotulo="Tipo">
              <Select value={f.tipo} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_COMUNICADO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          </div>
          <Campo rotulo="Texto" obrigatorio>
            <Textarea rows={8} value={f.corpo} onChange={(e) => set("corpo", e.target.value)} />
          </Campo>

          <div className="space-y-3 rounded-[10px] border border-white/10 p-3">
            <div>
              <p className="text-sm font-semibold">Recorte</p>
              <p className="text-xs text-muted-foreground">
                Grupo sem marcação vale para todos. Entre grupos, o parceiro precisa atender a todos os marcados.
              </p>
            </div>
            <Grupo titulo="Tipo de parceria">
              {Object.entries(TIPOS_PARCERIA).map(([k, v]) => (
                <Opcao key={k} rotulo={v} marcado={f.tipos.includes(k)} onChange={(m) => alternar("tipos", k, m)} />
              ))}
            </Grupo>
            <Grupo titulo="Nível">
              {["A", "B", "C"].map((n) => (
                <Opcao key={n} rotulo={nomeNivelRecorte(n)} marcado={f.niveis.includes(n)} onChange={(m) => alternar("niveis", n, m)} />
              ))}
            </Grupo>
            <Grupo titulo="Pacote">
              {pacotes.map((p) => (
                <Opcao key={p.codigo} rotulo={p.nome} marcado={f.pacotes.includes(p.codigo)} onChange={(m) => alternar("pacotes", p.codigo, m)} />
              ))}
            </Grupo>
            <Grupo titulo="Categoria">
              {ativas.map((c) => (
                <Opcao key={c.id} rotulo={c.nome} marcado={f.categorias.includes(c.id)} onChange={(m) => alternar("categorias", c.id, m)} />
              ))}
            </Grupo>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={!valido || salvar.isPending}>
              {salvar.isPending && <Loader2 className="animate-spin" />} Salvar rascunho
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-neutro-300">{titulo}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </div>
  );
}

function Opcao({ rotulo, marcado, onChange }: { rotulo: string; marcado: boolean; onChange: (m: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={marcado} onCheckedChange={(c) => onChange(!!c)} /> {rotulo}
    </label>
  );
}
