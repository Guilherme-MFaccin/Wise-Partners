import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { PAPEIS } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { useEmpresasGrupo } from "@/components/rfp/dados";

export type UsuarioLinha = {
  id: string; nome: string; email: string; papel: string; empresa_grupo_id: string | null; parceiro_id: string | null;
  is_diretor: boolean; is_responsavel_parceiro: boolean; ativo: boolean;
};

// Alteração de papel e acesso (só administrador; o gatilho do banco bloqueia os demais).
export function EditarUsuarioDialog({ usuario, onClose, onSalvo }: { usuario: UsuarioLinha | null; onClose: () => void; onSalvo: () => void }) {
  const { data: empresas = [] } = useEmpresasGrupo();
  const [u, setU] = useState<UsuarioLinha | null>(usuario);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setU(usuario), [usuario]);
  const set = (k: keyof UsuarioLinha, v: any) => setU((x) => (x ? { ...x, [k]: v } : x));

  const ehParceiro = u?.papel === "parceiro";
  const valido = !!u && u.nome.trim() && (ehParceiro ? !!u.parceiro_id : !!u.empresa_grupo_id);

  async function salvar() {
    if (!u) return;
    setSalvando(true);
    try {
      // Coerência exigida pelo banco: usuário de parceiro sem empresa do grupo; interno sem parceiro; Diretor só admin
      const { error } = await supabase.from("perfis").update({
        nome: u.nome.trim(),
        papel: u.papel,
        empresa_grupo_id: ehParceiro ? null : u.empresa_grupo_id,
        parceiro_id: ehParceiro ? u.parceiro_id : null,
        is_diretor: u.papel === "admin" && u.is_diretor,
        is_responsavel_parceiro: ehParceiro && u.is_responsavel_parceiro,
        ativo: u.ativo,
      }).eq("id", u.id);
      if (error) throw error;
      toast.success("Usuário atualizado.");
      onSalvo();
      onClose();
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
          <DialogTitle>Editar acesso</DialogTitle>
          <DialogDescription className="break-all">{usuario?.email}</DialogDescription>
        </DialogHeader>
        {u && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-nome">Nome</Label>
              <Input id="e-nome" value={u.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={u.papel} onValueChange={(v) => set("papel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAPEIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {ehParceiro ? (
              <>
                <div className="space-y-1.5">
                  <Label>Parceiro</Label>
                  <ParceiroBusca valor={u.parceiro_id} onChange={(v) => set("parceiro_id", v)} />
                </div>
                <label className="flex items-center justify-between gap-3 text-sm">
                  Responsável do parceiro
                  <Switch checked={u.is_responsavel_parceiro} onCheckedChange={(c) => set("is_responsavel_parceiro", c)} />
                </label>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Empresa do grupo</Label>
                  <Select value={u.empresa_grupo_id ?? ""} onValueChange={(v) => set("empresa_grupo_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {u.papel === "admin" && (
                  <label className="flex items-center justify-between gap-3 text-sm">
                    Diretor (aprova as assinaturas)
                    <Switch checked={u.is_diretor} onCheckedChange={(c) => set("is_diretor", c)} />
                  </label>
                )}
              </>
            )}
            <label className="flex items-center justify-between gap-3 text-sm">
              Acesso ativo
              <Switch checked={u.ativo} onCheckedChange={(c) => set("ativo", c)} />
            </label>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={!valido || salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
