import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { redefinirSenhaUsuario } from "@/lib/convite";
import { toastErro } from "@/lib/erros";
import { gerarSenha, MINIMO_SENHA_PROVISORIA } from "@/lib/senha";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampoSenhaProvisoria, CredenciaisCriadas } from "./SenhaProvisoria";

// Nova senha provisória para quem esqueceu a senha e não recebeu o e-mail de redefinição
export function RedefinirSenhaDialog({ usuario, onClose }: { usuario: { id: string; nome: string; email: string } | null; onClose: () => void }) {
  const [senha, setSenha] = useState("");
  const [pronto, setPronto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setSenha(gerarSenha());
      setPronto(false);
    }
  }, [usuario]);

  async function salvar() {
    if (!usuario) return;
    setSalvando(true);
    try {
      await redefinirSenhaUsuario(usuario.id, senha);
      toast.success("Senha provisória definida.");
      setPronto(true);
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={!!usuario} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pronto ? "Senha provisória definida" : "Redefinir senha"}</DialogTitle>
          <DialogDescription>
            {pronto
              ? `${usuario?.nome || usuario?.email} entra com a senha abaixo e o portal pede a troca por uma senha só dela.`
              : `A senha atual de ${usuario?.nome || usuario?.email} deixa de funcionar na hora.`}
          </DialogDescription>
        </DialogHeader>
        {pronto && usuario ? (
          <>
            <CredenciaisCriadas email={usuario.email} senha={senha} />
            <DialogFooter><Button onClick={onClose}>Concluir</Button></DialogFooter>
          </>
        ) : (
          <>
            <CampoSenhaProvisoria id="r-senha" valor={senha} onChange={setSenha} />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || senha.length < MINIMO_SENHA_PROVISORIA}>
                {salvando ? <Loader2 className="animate-spin" /> : <KeyRound />} Definir senha
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
