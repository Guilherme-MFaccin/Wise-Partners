import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { convidarUsuario } from "@/lib/convite";
import { toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Convite de usuário da própria empresa pelo responsável do parceiro.
export function ConvidarParceiroDialog({
  aberto, parceiroId, onClose, onConvidado,
}: { aberto: boolean; parceiroId: string; onClose: () => void; onConvidado: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const valido = nome.trim() && /^\S+@\S+\.\S+$/.test(email.trim());

  function fechar() {
    setNome(""); setEmail("");
    onClose();
  }

  async function enviar() {
    setEnviando(true);
    try {
      await convidarUsuario({
        email: email.trim().toLowerCase(), nome: nome.trim(), papel: "parceiro", parceiro_id: parceiroId,
      });
      toast.success("Convite enviado por e-mail.");
      onConvidado();
      fechar();
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>A pessoa recebe um link de acesso por e-mail, sem senha.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Send />} Convidar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
