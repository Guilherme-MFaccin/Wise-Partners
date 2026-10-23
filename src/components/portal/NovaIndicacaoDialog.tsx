import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useEmpresasGrupo } from "@/components/rfp/dados";

const VAZIO = {
  empresa_grupo_id: "", cliente_razao_social: "", cliente_cnpj: "", contato_nome: "", contato_email: "", contato_telefone: "",
  consentimento: false, observacoes: "",
};

// Indicação do parceiro para uma empresa do grupo. O banco força sentido e origem e aplica
// a regra do primeiro registro (duplicado volta com mensagem neutra).
export function NovaIndicacaoDialog({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [f, setF] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof VAZIO, v: any) => setF((x) => ({ ...x, [k]: v }));

  const temDadosPessoais = !!(f.contato_nome.trim() || f.contato_email.trim() || f.contato_telefone.trim());
  const valido = f.empresa_grupo_id && f.cliente_razao_social.trim() && (!temDadosPessoais || f.consentimento);

  function fechar() {
    setF(VAZIO);
    onClose();
  }

  async function enviar() {
    setEnviando(true);
    try {
      const { error } = await supabase.rpc("registrar_indicacao", {
        p: {
          empresa_grupo_id: f.empresa_grupo_id,
          cliente_razao_social: f.cliente_razao_social.trim(),
          cliente_cnpj: f.cliente_cnpj.trim() || null,
          contato_nome: f.contato_nome.trim() || null,
          contato_email: f.contato_email.trim() || null,
          contato_telefone: f.contato_telefone.trim() || null,
          consentimento: temDadosPessoais ? f.consentimento : false,
          observacoes: f.observacoes.trim() || null,
        },
      });
      if (error) throw error;
      toast.success("Indicação registrada. O seu responsável na Wise foi avisado.");
      qc.invalidateQueries({ queryKey: ["portal-indicacoes"] });
      qc.invalidateQueries({ queryKey: ["portal-indicacoes-contagem"] });
      fechar();
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova indicação</DialogTitle>
          <DialogDescription>Indique um cliente para uma das empresas do grupo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Empresa de destino</Label>
            <RadioGroup value={f.empresa_grupo_id} onValueChange={(v) => set("empresa_grupo_id", v)} className="gap-2">
              {empresas.map((e) => (
                <label key={e.id} className="flex cursor-pointer gap-3 rounded-[10px] border border-white/10 p-3 has-[[data-state=checked]]:border-menta-500">
                  <RadioGroupItem value={e.id} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{e.nome}</span>
                    {e.descricao_institucional && <span className="block text-xs text-muted-foreground">{e.descricao_institucional}</span>}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="razao">Cliente (razão social)</Label>
              <Input id="razao" value={f.cliente_razao_social} onChange={(e) => set("cliente_razao_social", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" inputMode="numeric" value={f.cliente_cnpj} onChange={(e) => set("cliente_cnpj", e.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-3 rounded-[10px] border border-white/10 p-3">
            <legend className="px-1 text-sm font-semibold">Contato no cliente (opcional)</legend>
            <Input placeholder="Nome" value={f.contato_nome} onChange={(e) => set("contato_nome", e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="E-mail" type="email" value={f.contato_email} onChange={(e) => set("contato_email", e.target.value)} />
              <Input placeholder="Telefone" inputMode="tel" value={f.contato_telefone} onChange={(e) => set("contato_telefone", e.target.value)} />
            </div>
            {temDadosPessoais && (
              <label className="flex gap-2 text-sm">
                <Checkbox checked={f.consentimento} onCheckedChange={(c) => set("consentimento", !!c)} className="mt-0.5" />
                <span>Declaro que o contato autorizou o compartilhamento destes dados com a empresa do grupo para esta indicação.</span>
              </label>
            )}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)}
              placeholder="O que o cliente precisa e como chegou até vocês" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <Send />} Registrar indicação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
