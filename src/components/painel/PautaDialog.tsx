import { useEffect, useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { chamarIA, type ResultadoPauta } from "@/lib/ia";
import { semTravessao } from "@/lib/formato";
import { montarPautaLocal, type PainelDados } from "./pauta";

// Pauta da semana: tenta a IA; se falhar, monta o texto a partir do painel para nunca deixar o usuário sem pauta.
export function PautaDialog({ aberto, onOpenChange, painel }: { aberto: boolean; onOpenChange: (v: boolean) => void; painel: PainelDados | null }) {
  const [texto, setTexto] = useState("");
  const [origem, setOrigem] = useState<"ia" | "local" | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!aberto || !painel) return;
    let cancelado = false;
    setGerando(true);
    setTexto("");
    setOrigem(null);
    chamarIA<ResultadoPauta>("pauta_semanal", { painel })
      .then((r) => {
        if (cancelado) return;
        if (!r?.pauta?.trim()) throw new Error("Pauta vazia");
        setTexto(semTravessao(r.pauta.trim()));
        setOrigem("ia");
      })
      .catch(() => {
        if (cancelado) return;
        setTexto(montarPautaLocal(painel));
        setOrigem("local");
      })
      .finally(() => !cancelado && setGerando(false));
    return () => {
      cancelado = true;
    };
  }, [aberto, painel]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Pauta copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[14px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-menta-400" /> Pauta da semana</DialogTitle>
          <DialogDescription>
            {origem === "local"
              ? "A IA não respondeu agora. Esta pauta foi montada a partir dos indicadores do painel."
              : "Pontos para a reunião semanal, prontos para copiar."}
          </DialogDescription>
        </DialogHeader>
        {gerando ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Gerando a pauta...
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words rounded-[8px] border border-white/10 bg-background p-4 text-sm leading-relaxed">
            {texto}
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={copiar} disabled={gerando || !texto}><Copy /> Copiar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
