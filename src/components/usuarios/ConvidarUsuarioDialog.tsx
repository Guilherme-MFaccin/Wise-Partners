import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { convidarUsuario, type DadosConvite } from "@/lib/convite";
import { toastErro } from "@/lib/erros";
import { PAPEIS } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { useEmpresasGrupo } from "@/components/rfp/dados";

type Papel = DadosConvite["papel"];

// Convite de usuário: administrador convida qualquer papel; time de parcerias só usuários de parceiro.
export function ConvidarUsuarioDialog({ aberto, onClose, onConvidado }: { aberto: boolean; onClose: () => void; onConvidado: () => void }) {
  const { isAdmin, perfil } = useAuth();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>(isAdmin ? "consultor" : "parceiro");
  const [empresa, setEmpresa] = useState<string>(perfil?.empresa_grupo_id ?? "");
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [diretor, setDiretor] = useState(false);
  const [responsavel, setResponsavel] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const ehParceiro = papel === "parceiro";
  const valido = nome.trim() && /^\S+@\S+\.\S+$/.test(email.trim()) && (ehParceiro ? !!parceiroId : !!empresa);

  function fechar() {
    setNome(""); setEmail(""); setParceiroId(null); setDiretor(false); setResponsavel(true);
    setPapel(isAdmin ? "consultor" : "parceiro");
    onClose();
  }

  async function enviar() {
    setEnviando(true);
    try {
      await convidarUsuario({
        email: email.trim().toLowerCase(),
        nome: nome.trim(),
        papel,
        empresa_grupo_id: ehParceiro ? null : empresa,
        parceiro_id: ehParceiro ? parceiroId : null,
        is_diretor: papel === "admin" && diretor,
        is_responsavel_parceiro: ehParceiro && responsavel,
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
            <Label htmlFor="c-nome">Nome</Label>
            <Input id="c-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">E-mail</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAPEIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {ehParceiro ? (
            <>
              <div className="space-y-1.5">
                <Label>Parceiro</Label>
                <ParceiroBusca valor={parceiroId} onChange={setParceiroId} />
              </div>
              <label className="flex gap-2 text-sm">
                <Checkbox checked={responsavel} onCheckedChange={(c) => setResponsavel(!!c)} className="mt-0.5" />
                <span>Responsável do parceiro (convida e desativa usuários da própria empresa)</span>
              </label>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Empresa do grupo</Label>
                <Select value={empresa} onValueChange={setEmpresa}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {papel === "admin" && (
                <label className="flex gap-2 text-sm">
                  <Checkbox checked={diretor} onCheckedChange={(c) => setDiretor(!!c)} className="mt-0.5" />
                  <span>Diretor (aprova as assinaturas)</span>
                </label>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Send />} Convidar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
