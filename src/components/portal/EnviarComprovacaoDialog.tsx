import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { nomeSeguro, type Contrapartida } from "./dados";

// Envio de comprovação de uma contrapartida: link ou arquivo na pasta do próprio parceiro.
export function EnviarComprovacaoDialog({ contrapartida, onClose }: { contrapartida: Contrapartida | null; onClose: () => void }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const [forma, setForma] = useState<"link" | "arquivo">("link");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const valido = forma === "link" ? /^https?:\/\/\S+$/.test(link.trim()) : !!arquivo;

  function fechar() {
    setLink(""); setArquivo(null); setObservacao(""); setForma("link");
    onClose();
  }

  async function enviar() {
    if (!contrapartida || !perfil?.parceiro_id) return;
    setEnviando(true);
    try {
      let caminho: string | null = null;
      if (forma === "arquivo" && arquivo) {
        caminho = `${perfil.parceiro_id}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
        const up = await supabase.storage.from("comprovacoes").upload(caminho, arquivo, { contentType: arquivo.type || undefined });
        if (up.error) throw up.error;
      }
      const { error } = await supabase.from("comprovacoes").insert({
        contrapartida_id: contrapartida.id,
        parceiro_id: perfil.parceiro_id,
        link: forma === "link" ? link.trim() : null,
        caminho,
        observacao: observacao.trim() || null,
        enviada_por: perfil.id,
        estado: "enviada",
      });
      if (error) throw error;
      toast.success("Comprovação enviada. A Wise vai validar e avisar você.");
      qc.invalidateQueries({ queryKey: ["portal-contrapartidas"] });
      fechar();
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={!!contrapartida} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar comprovação</DialogTitle>
          <DialogDescription>{contrapartida?.nome}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {contrapartida?.comprovacao && (
            <p className="text-sm text-muted-foreground">Comprovação esperada: {contrapartida.comprovacao}</p>
          )}
          <RadioGroup value={forma} onValueChange={(v) => setForma(v as any)} className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="link" /> Link</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="arquivo" /> Arquivo</label>
          </RadioGroup>
          {forma === "link" ? (
            <div className="space-y-1.5">
              <Label htmlFor="link">Link</Label>
              <Input id="link" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="arquivo">Arquivo (print, PDF ou imagem)</Label>
              <Input id="arquivo" type="file" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação</Label>
            <Textarea id="obs" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <Upload />} Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
