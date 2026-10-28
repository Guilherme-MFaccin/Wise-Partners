import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { convidarUsuario } from "@/lib/convite";
import { toastErro } from "@/lib/erros";
import { gerarSenha, MINIMO_SENHA_PROVISORIA } from "@/lib/senha";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoSenhaProvisoria, CredenciaisCriadas } from "./SenhaProvisoria";

// Acesso de um usuário da própria empresa, criado pelo responsável do parceiro (e-mail e senha provisória).
export function ConvidarParceiroDialog({
  aberto, parceiroId, onClose, onConvidado,
}: { aberto: boolean; parceiroId: string; onClose: () => void; onConvidado: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(() => gerarSenha());
  const [criado, setCriado] = useState<{ email: string; senha: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const valido = nome.trim() && /^\S+@\S+\.\S+$/.test(email.trim()) && senha.length >= MINIMO_SENHA_PROVISORIA;

  function fechar() {
    setNome(""); setEmail(""); setSenha(gerarSenha()); setCriado(null);
    onClose();
  }

  async function enviar() {
    setEnviando(true);
    try {
      await convidarUsuario({
        email: email.trim().toLowerCase(), nome: nome.trim(), papel: "parceiro", parceiro_id: parceiroId, senha,
      });
      toast.success("Acesso criado.");
      onConvidado();
      setCriado({ email: email.trim().toLowerCase(), senha });
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
          <DialogTitle>{criado ? "Acesso criado" : "Criar acesso"}</DialogTitle>
          <DialogDescription>
            {criado ? `${nome.trim()} já pode entrar no portal.` : "A pessoa entra com o e-mail e uma senha provisória, que o portal pede para trocar."}
          </DialogDescription>
        </DialogHeader>
        {criado ? (
          <>
            <CredenciaisCriadas email={criado.email} senha={criado.senha} />
            <DialogFooter><Button onClick={fechar}>Concluir</Button></DialogFooter>
          </>
        ) : (
        <>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <CampoSenhaProvisoria id="p-senha" valor={senha} onChange={setSenha} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || enviando}>{enviando ? <Loader2 className="animate-spin" /> : <UserPlus />} Criar acesso</Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
